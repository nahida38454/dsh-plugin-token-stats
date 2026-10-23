/**
 * Token Stats — Host half.
 *
 * Serves one authenticated JSON summary of the token usage recorded in every
 * session log (`assistant/message` → `usage`), so the Client half can render the
 * "Token usage" panel and the per-session header badge.
 *
 * Sources, weakest I/O first:
 *   - live sessions: folded from the in-memory log on every request;
 *   - stored sessions: read once through `sessionQuery.readSession()` and cached
 *     until their persistence revision changes;
 *   - titles: batched `sessionQuery.readTitleSnapshots()` with a short TTL.
 *   - Claude Code: read from its own SQLite index (`claude-code.js`) and folded in
 *     as an extra provider, so one panel covers both harnesses.
 *
 * Forked sessions inherit a copied parent prefix (`inheritedEventCount`), so only
 * a session's own events are counted — history is never billed twice.
 *
 * Cost is priced from the plugin's `config` (per million tokens). Defaults are the
 * DeepSeek CNY list prices; a row override in the profile patch layer replaces the
 * whole config, so repeat every field when you change one.
 */

import { locateClaudeIndex, readClaudeUsage } from './claude-code.js';

/** Provider label Claude Code usage is reported under. */
const CLAUDE_PROVIDER = 'claude-code';
/** How long a Claude Code database read stays trusted. */
const CLAUDE_TTL_MS = 30_000;

/** Authenticated GET route serving the whole summary. */
const ROUTE_PATH = '/api/token-stats.summary';
/** How long a persistence listing stays trusted before it is refreshed. */
const INDEX_TTL_MS = 15_000;
/** How long a folded session title stays trusted. */
const TITLE_TTL_MS = 30_000;
/** Stored logs read per scan round, so one request never blocks for long. */
const SCAN_BATCH = 40;
/** Rows returned to the browser; totals always cover every session. */
const MAX_ROWS = 200;

/** DeepSeek CNY list prices per million tokens, used when the row config omits a field. */
const DEFAULT_PRICING = {
  currency: '¥',
  cacheHitPerMillion: 0.2,
  cacheMissPerMillion: 2,
  outputPerMillion: 3,
  cacheWritePerMillion: 0,
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

/** @param {unknown} value @returns {number} */
function numeric(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** @returns {Record<string, number>} a zeroed usage accumulator. */
function emptyTotals() {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, total: 0 };
}

/**
 * Add one recorded request to an accumulator.
 * @param {Record<string, number>} totals - accumulator to grow.
 * @param {unknown} usage - the event's `TokenUsage`, when the provider reported one.
 */
function addUsage(totals, usage) {
  if (typeof usage !== 'object' || usage === null) return;
  const input = numeric(usage.inputTokens);
  const output = numeric(usage.outputTokens);
  totals.requests += 1;
  totals.input += input;
  totals.output += output;
  totals.cacheRead += numeric(usage.cacheReadTokens);
  totals.cacheWrite += numeric(usage.cacheWriteTokens);
  totals.reasoning += numeric(usage.reasoningTokens);
  totals.total += typeof usage.totalTokens === 'number' ? numeric(usage.totalTokens) : input + output;
}

/** Separator joining provider and model inside one breakdown key. */
const SOURCE_SEP = '\u0000';

/**
 * Add one usage record to a keyed accumulator, creating the bucket on demand.
 * @param {Map<string, Record<string, number>>} map - accumulator keyed by provider or provider+model.
 * @param {string} key - bucket key.
 * @param {unknown} usage - the event's `TokenUsage`.
 */
function bumpUsage(map, key, usage) {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = emptyTotals();
    map.set(key, bucket);
  }
  addUsage(bucket, usage);
}

/**
 * Fold one session log into usage totals plus provider and provider/model breakdowns.
 *
 * Each assistant message carries its own provider/model source, so usage is
 * attributed without correlating request headers.
 * @param {readonly any[]} events - session events in seq order.
 * @param {number} [fromSeq] - first seq that belongs to this session itself.
 * @returns {{ totals: Record<string, number>, providers: Map<string, Record<string, number>>, models: Map<string, Record<string, number>>, lastAt: number }} the folded usage.
 */
function foldSession(events, fromSeq) {
  const totals = emptyTotals();
  const providers = new Map();
  const models = new Map();
  let lastAt = 0;
  for (const event of events) {
    if (event === null || typeof event !== 'object') continue;
    if (typeof fromSeq === 'number' && numeric(event.seq) < fromSeq) continue;
    if (numeric(event.time) > lastAt) lastAt = numeric(event.time);
    if (event.type !== 'assistant/message') continue;
    const data = event.data ?? {};
    const usage = data.usage;
    if (usage === null || typeof usage !== 'object') continue;
    addUsage(totals, usage);
    const source = data.message ? data.message.source : undefined;
    const provider =
      source && typeof source.provider === 'string' && source.provider.length > 0 ? source.provider : 'unknown';
    const model = source && typeof source.model === 'string' && source.model.length > 0 ? source.model : 'unknown';
    bumpUsage(providers, provider, usage);
    bumpUsage(models, `${provider}${SOURCE_SEP}${model}`, usage);
  }
  return { totals, providers, models, lastAt };
}

/**
 * Add one keyed breakdown into another.
 * @param {Map<string, Record<string, number>>} target - accumulator.
 * @param {Map<string, Record<string, number>>} source - usage to merge in.
 */
function mergeTotalsMap(target, source) {
  for (const [key, bucket] of source) {
    let into = target.get(key);
    if (!into) {
      into = emptyTotals();
      target.set(key, into);
    }
    for (const field of Object.keys(into)) into[field] += numeric(bucket[field]);
  }
}

/**
 * Split a provider/model breakdown key.
 * @param {string} key - `provider` + separator + `model`.
 * @returns {{ provider: string, model: string }} the two halves.
 */
function splitSourceKey(key) {
  const at = key.indexOf(SOURCE_SEP);
  return at < 0 ? { provider: key, model: 'unknown' } : { provider: key.slice(0, at), model: key.slice(at + 1) };
}

/**
 * Sum several usage accumulators.
 * @param {readonly (Record<string, number> | undefined)[]} list - accumulators to merge.
 * @returns {Record<string, number>} the merged totals.
 */
function sumTotals(list) {
  const merged = emptyTotals();
  for (const totals of list) {
    if (!totals) continue;
    for (const key of Object.keys(merged)) merged[key] += numeric(totals[key]);
  }
  return merged;
}

/**
 * Merge the row config over the price defaults, ignoring unusable values.
 * @param {unknown} raw - the entry's `config` object.
 * @returns {{ currency: string } & Record<string, number>} the effective prices.
 */
function normalizePricing(raw) {
  const source = typeof raw === 'object' && raw !== null ? raw : {};
  /** @param {string} key @returns {number} */
  const price = (key) => {
    const value = typeof source[key] === 'string' ? Number(source[key]) : source[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : DEFAULT_PRICING[key];
  };
  const currency = typeof source.currency === 'string' ? source.currency.trim() : '';
  return {
    currency: currency.length > 0 && currency.length <= 4 ? currency : DEFAULT_PRICING.currency,
    cacheHitPerMillion: price('cacheHitPerMillion'),
    cacheMissPerMillion: price('cacheMissPerMillion'),
    outputPerMillion: price('outputPerMillion'),
    cacheWritePerMillion: price('cacheWritePerMillion'),
  };
}

/**
 * Price one usage accumulator.
 *
 * `input` is the cache-missing part of the prompt and `cacheRead` the cache-hit
 * part, which is how providers report both. Reasoning tokens are already inside
 * the output count, so they are not priced again.
 * @param {Record<string, number>} totals - usage accumulator.
 * @param {{ currency: string } & Record<string, number>} pricing - effective prices.
 * @returns {number} the estimated amount in `pricing.currency`.
 */
function costOf(totals, pricing) {
  return (
    (numeric(totals.input) / 1e6) * pricing.cacheMissPerMillion +
    (numeric(totals.cacheRead) / 1e6) * pricing.cacheHitPerMillion +
    (numeric(totals.cacheWrite) / 1e6) * pricing.cacheWritePerMillion +
    (numeric(totals.output) / 1e6) * pricing.outputPerMillion
  );
}

/** @param {unknown} error @returns {string} a short message. */
function messageOf(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** @param {unknown} data @returns {Response} a JSON response with the given payload. */
function jsonResponse(data) {
  return new Response(JSON.stringify(data), { status: 200, headers: JSON_HEADERS });
}

export const inject = ['connection'];

/**
 * Register the summary route.
 * @param {any} ctx - the plugin context.
 * @param {any} [config] - this row's config: token prices and currency symbol.
 */
export function apply(ctx, config) {
  const pricing = normalizePricing(config);
  const sessionsService = ctx.get('sessions');
  const query = ctx.get('sessionQuery');
  const persistence = ctx.get('sessionPersistence');

  /** @type {Map<string, any>} one row per known session id. */
  const rows = new Map();
  let indexedAt = 0;
  let indexPromise = null;
  let scanPromise = null;
  const problems = [];

  /** Claude Code usage: the located index, its folded totals, and cache stamps. */
  const claudeRoots = typeof config === 'object' && config !== null ? config.claudeCodeRoots : undefined;
  let claudeAt = 0;
  let claudeFile = null;
  let claudeTotals = emptyTotals();
  /** @type {Map<string, Record<string, number>>} provider/model buckets. */
  let claudeModels = new Map();
  let claudeSessions = 0;
  let claudeError = null;

  /** Refresh the Claude Code fold when its TTL has expired. */
  function refreshClaude() {
    if (Date.now() - claudeAt < CLAUDE_TTL_MS) return;
    claudeAt = Date.now();
    try {
      const file = locateClaudeIndex(claudeRoots);
      if (!file) {
        claudeFile = null;
        claudeTotals = emptyTotals();
        claudeModels = new Map();
        claudeSessions = 0;
        claudeError = null;
        return;
      }
      const read = readClaudeUsage(file);
      claudeFile = file;
      claudeError = read.error;
      const totals = emptyTotals();
      const models = new Map();
      for (const row of read.rows) {
        for (const field of Object.keys(totals)) totals[field] += numeric(row.totals[field]);
        const key = `${CLAUDE_PROVIDER}${SOURCE_SEP}${row.model}`;
        let bucket = models.get(key);
        if (!bucket) {
          bucket = emptyTotals();
          models.set(key, bucket);
        }
        for (const field of Object.keys(bucket)) bucket[field] += numeric(row.totals[field]);
      }
      claudeTotals = totals;
      claudeModels = models;
      claudeSessions = new Set(read.rows.map((row) => row.date)).size;
      if (read.error) noteProblem(read.error);
    } catch (error) {
      claudeFile = null;
      noteProblem(error);
    }
  }

  /** @param {unknown} error - a failure worth reporting without breaking the summary. */
  function noteProblem(error) {
    const message = messageOf(error);
    if (problems.length < 5 && !problems.includes(message)) problems.push(message);
  }

  /**
   * Read or create the row for one session id.
   * @param {string} id - session id as a plain string.
   * @param {any} [header] - freshest known header.
   * @returns {any} the row.
   */
  function rowOf(id, header) {
    const existing = rows.get(id);
    if (existing) {
      if (header) existing.header = header;
      return existing;
    }
    const row = {
      id,
      header: header ?? null,
      live: false,
      persisted: false,
      revision: null,
      stale: false,
      totals: emptyTotals(),
      providers: new Map(),
      models: new Map(),
      lastAt: 0,
      title: null,
      titleAt: 0,
      error: null,
    };
    rows.set(id, row);
    return row;
  }

  /** Reconcile the row table with the stored-session listing. */
  async function refreshIndex() {
    if (!persistence) return;
    const snapshots = await persistence.list();
    const seen = new Set();
    for (const snapshot of snapshots) {
      const id = String(snapshot.header.id);
      seen.add(id);
      const row = rowOf(id, snapshot.header);
      row.persisted = true;
      const revision = String(snapshot.revision);
      if (row.revision !== revision) {
        row.revision = revision;
        row.stale = true;
      }
    }
    for (const [id, row] of rows) {
      if (!seen.has(id)) row.persisted = false;
    }
    indexedAt = Date.now();
  }

  /** Run one index refresh at a time. @returns {Promise<void>} the in-flight refresh. */
  function ensureIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = refreshIndex()
      .catch((error) => {
        noteProblem(error);
      })
      .finally(() => {
        indexPromise = null;
        if (indexedAt === 0) indexedAt = Date.now();
      });
    return indexPromise;
  }

  /** Fold every live session from memory, which is always current. */
  function refreshLive() {
    if (!sessionsService) return;
    const live = new Set();
    for (const session of sessionsService.list()) {
      const id = String(session.id);
      live.add(id);
      const row = rowOf(id, session.header);
      row.live = true;
      row.stale = false;
      row.error = null;
      try {
        const folded = foldSession(session.ownEvents());
        row.totals = folded.totals;
        row.providers = folded.providers;
        row.models = folded.models;
        row.lastAt = folded.lastAt;
      } catch (error) {
        noteProblem(error);
      }
    }
    for (const [id, row] of rows) {
      if (row.live && !live.has(id)) row.live = false;
    }
  }

  /** Read the stored logs and titles this round can afford. */
  function ensureScan() {
    if (scanPromise) return scanPromise;
    scanPromise = (async () => {
      if (!query) return;
      let budget = SCAN_BATCH;
      for (const row of rows.values()) {
        if (budget <= 0) break;
        if (row.live || !row.stale) continue;
        budget -= 1;
        try {
          const snapshot = await query.readSession(row.id);
          const inherited = numeric(snapshot.inheritedEventCount);
          const folded = foldSession(snapshot.events, inherited);
          row.totals = folded.totals;
          row.providers = folded.providers;
          row.models = folded.models;
          row.lastAt = folded.lastAt;
          row.error = null;
        } catch (error) {
          row.error = messageOf(error);
          noteProblem(error);
        }
        row.stale = false;
      }

      const targets = [];
      for (const row of rows.values()) {
        if (Date.now() - row.titleAt >= TITLE_TTL_MS) targets.push(row.id);
        if (targets.length >= SCAN_BATCH) break;
      }
      if (targets.length > 0) {
        try {
          const observations = await query.readTitleSnapshots(targets);
          const stamp = Date.now();
          for (const observation of observations) {
            const row = rows.get(String(observation.sessionId));
            if (!row) continue;
            if (observation.status === 'fulfilled') {
              const title = observation.value && observation.value.title;
              row.title = title && typeof title.title === 'string' ? title.title : row.title;
            }
            row.titleAt = stamp;
          }
        } catch (error) {
          noteProblem(error);
        }
        const stamp = Date.now();
        for (const id of targets) {
          const row = rows.get(id);
          if (row && row.titleAt === 0) row.titleAt = stamp;
        }
      }
    })()
      .catch((error) => {
        noteProblem(error);
      })
      .finally(() => {
        scanPromise = null;
      });
    return scanPromise;
  }

  /** @returns {Record<string, unknown>} the current summary. */
  function snapshot() {
    const all = [...rows.values()];
    const liveRows = all.filter((row) => row.live);
    const items = all
      .map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.header ? numeric(row.header.createdAt) : 0,
        cwd: row.header && typeof row.header.cwd === 'string' ? row.header.cwd : null,
        agentPreset: row.header && typeof row.header.agentPreset === 'string' ? row.header.agentPreset : null,
        live: row.live,
        persisted: row.persisted,
        error: row.error,
        lastAt: row.lastAt,
        sources: [...row.models]
          .map(([key, bucket]) => {
            const { provider, model } = splitSourceKey(key);
            return { provider, model, ...bucket, cost: costOf(bucket, pricing) };
          })
          .sort((left, right) => right.total - left.total)
          .slice(0, 12),
        cost: costOf(row.totals, pricing),
        requests: row.totals.requests,
        input: row.totals.input,
        output: row.totals.output,
        cacheRead: row.totals.cacheRead,
        cacheWrite: row.totals.cacheWrite,
        reasoning: row.totals.reasoning,
        total: row.totals.total,
      }))
      .sort((left, right) => right.total - left.total || right.createdAt - left.createdAt);
    const totals = sumTotals(all.map((row) => row.totals));
    const liveTotals = sumTotals(liveRows.map((row) => row.totals));
    const providerTotals = new Map();
    const modelTotals = new Map();
    for (const row of all) {
      mergeTotalsMap(providerTotals, row.providers);
      mergeTotalsMap(modelTotals, row.models);
    }

    // Fold Claude Code in as one more provider, so the panel and the share card
    // cover both harnesses without the client knowing there are two sources.
    if (claudeFile) {
      mergeTotalsMap(providerTotals, new Map([[CLAUDE_PROVIDER, claudeTotals]]));
      mergeTotalsMap(modelTotals, claudeModels);
      for (const field of Object.keys(totals)) totals[field] += numeric(claudeTotals[field]);
    }

    const modelsByProvider = new Map();
    for (const [key, bucket] of modelTotals) {
      const { provider, model } = splitSourceKey(key);
      const list = modelsByProvider.get(provider) ?? [];
      list.push({ model, ...bucket, cost: costOf(bucket, pricing) });
      modelsByProvider.set(provider, list);
    }
    const providers = [...providerTotals]
      .map(([provider, bucket]) => ({
        provider,
        ...bucket,
        cost: costOf(bucket, pricing),
        models: (modelsByProvider.get(provider) ?? []).sort((left, right) => right.total - left.total),
      }))
      .sort((left, right) => right.total - left.total);
    const pending = all.filter((row) => !row.live && row.stale).length;
    return {
      generatedAt: Date.now(),
      scanning: pending > 0,
      pendingSessions: pending,
      problems: problems.slice(),
      pricing,
      totals: { ...totals, cost: costOf(totals, pricing) },
      liveTotals: { ...liveTotals, cost: costOf(liveTotals, pricing) },
      providers,
      sessions: items.slice(0, MAX_ROWS),
      sessionCount: items.length + claudeSessions,
      liveCount: liveRows.length,
      truncated: items.length > MAX_ROWS,
      claudeCode: claudeFile
        ? {
            file: claudeFile,
            error: claudeError,
            days: claudeSessions,
            ...claudeTotals,
            cost: costOf(claudeTotals, pricing),
          }
        : null,
    };
  }

  /**
   * Answer one summary request.
   * @param {Request} request - the authenticated request.
   * @returns {Promise<Response>} the JSON summary.
   */
  async function handle(request) {
    const url = new URL(request.url);
    if (url.searchParams.get('refresh') === '1') {
      for (const row of rows.values()) {
        row.revision = null;
        row.titleAt = 0;
        if (!row.live) row.stale = true;
      }
      indexedAt = 0;
    }
    if (indexedAt === 0 || Date.now() - indexedAt > INDEX_TTL_MS) await ensureIndex();
    refreshLive();
    ensureScan();
    refreshClaude();
    return jsonResponse(snapshot());
  }

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_PATH,
        methods: ['GET'],
        requestBody: 'buffered',
        fetch: async (request) => {
          try {
            return await handle(request);
          } catch (error) {
            noteProblem(error);
            return new Response(JSON.stringify({ error: messageOf(error) }), { status: 500, headers: JSON_HEADERS });
          }
        },
      }),
    'token-stats: usage summary route',
  );
}
