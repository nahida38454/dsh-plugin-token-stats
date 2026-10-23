/**
 * Claude Code data source for the Token Stats plugin.
 *
 * Claude Code (and its `cc-haha` desktop build) indexes every transcript into a
 * SQLite database. The `activity_daily_models` table already holds exactly what
 * this panel renders: per-day, per-model prompt/output/cache token counts. Reading
 * it is far cheaper than re-parsing the `.jsonl` transcripts, and the host indexer
 * keeps it current while Claude Code runs.
 *
 * Two data roots exist on this machine, and only one of them is populated:
 *   - `%USERPROFILE%\.claude\cc-haha\db` — created but empty (2 sessions, no usage)
 *   - `<workspace>\cc-haha\db`           — the live one the desktop app indexes into
 * so every candidate root is probed and whichever actually has rows wins.
 *
 * The whole module is optional: a machine without Claude Code, or a Node build
 * without `node:sqlite`, simply reports no rows and the plugin keeps showing DSH
 * sessions.
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Synchronous require, so SQLite reads never need to await. */
const require = createRequire(import.meta.url);

/**
 * Load `node:sqlite`, or null when this Node build does not ship it.
 * @returns {any|null} the module.
 */
function loadSqlite() {
  try {
    return require('node:sqlite');
  } catch {
    return null;
  }
}

/**
 * Candidate `cc-haha` data roots, most likely first.
 * @param {string|string[]|undefined} extra - user-supplied root(s) from the row config.
 * @returns {string[]} absolute root paths.
 */
export function candidateRoots(extra) {
  const roots = [];
  const push = (value) => {
    if (typeof value === 'string' && value.trim().length > 0) roots.push(value.trim());
  };
  if (Array.isArray(extra)) extra.forEach(push);
  else push(extra);
  const home = homedir();
  push(join(home, '.claude', 'cc-haha'));
  return roots;
}

/**
 * Resolve the database file that actually has usage rows.
 * @param {string|string[]|undefined} extra - user-supplied root(s) from the row config.
 * @returns {string|null} absolute path, or null when no populated index exists.
 */
export function locateClaudeIndex(extra) {
  const sqlite = loadSqlite();
  if (!sqlite) return null;
  for (const root of candidateRoots(extra)) {
    const file = join(root, 'db', 'index-v1.sqlite');
    if (!existsSync(file)) continue;
    let db;
    try {
      db = new sqlite.DatabaseSync(file, { readOnly: true });
      const row = db.prepare('SELECT COUNT(*) AS n FROM activity_daily_models').get();
      if (row && Number(row.n) > 0) return file;
    } catch {
      // Unreadable, or mid-migration: try the next candidate.
    } finally {
      if (db) {
        try {
          db.close();
        } catch {
          /* ignore */
        }
      }
    }
  }
  return null;
}

/**
 * Read per-day, per-model usage from a Claude Code index.
 * @param {string} file - path to `index-v1.sqlite`.
 * @returns {{ rows: Array<{date: string, model: string, totals: Record<string, number>}>, error: string|null }} rows and a soft error.
 */
export function readClaudeUsage(file) {
  const sqlite = loadSqlite();
  if (!sqlite) return { rows: [], error: 'node:sqlite unavailable' };
  const rows = [];
  let db;
  try {
    db = new sqlite.DatabaseSync(file, { readOnly: true });
    const stmt = db.prepare(
      `SELECT date, model,
              SUM(input_tokens) AS input,
              SUM(output_tokens) AS output,
              SUM(cache_read_input_tokens) AS cacheRead,
              SUM(cache_creation_input_tokens) AS cacheWrite
         FROM activity_daily_models
        GROUP BY date, model
        ORDER BY date`,
    );
    for (const row of stmt.all()) {
      const input = Number(row.input) || 0;
      const output = Number(row.output) || 0;
      const cacheRead = Number(row.cacheRead) || 0;
      const cacheWrite = Number(row.cacheWrite) || 0;
      rows.push({
        date: String(row.date ?? ''),
        model: String(row.model ?? 'unknown'),
        totals: {
          requests: 0,
          input,
          output,
          cacheRead,
          cacheWrite,
          reasoning: 0,
          total: input + output + cacheRead + cacheWrite,
        },
      });
    }
  } catch (error) {
    return { rows, error: error && error.message ? error.message : String(error) };
  } finally {
    if (db) {
      try {
        db.close();
      } catch {
        /* ignore */
      }
    }
  }
  return { rows, error: null };
}
