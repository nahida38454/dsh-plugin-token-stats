window.__ModuleLoader__.load({
  id: 'dsh-plugin-token-stats',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace of this plugin's own texts. */
    const NS = 'token-stats';
    /** Authenticated Host route that owns the numbers. */
    const API = '/api/token-stats.summary';
    /** Panel id: the sidebar entry and the `main` entry share it. */
    const PANEL_ID = 'token-stats';
    /** Steady-state refresh interval while something is mounted. */
    const POLL_MS = 5000;
    /** Faster interval while the Host is still reading stored logs. */
    const BUSY_MS = 900;
    /** Selectable layouts. */
    const VARIANTS = ['card', 'ledger', 'minimal', 'split'];
    /** Selectable number renderings. */
    const NUM_MODES = ['triple', 'zh', 'en'];
    /** Preference keys, kept per browser. */
    const STORE_VARIANT = 'dsh.token-stats.variant';
    const STORE_NUM = 'dsh.token-stats.numbers';
    const STORE_SPEC = 'dsh.token-stats.share-spec';
    const STORE_STYLE = 'dsh.token-stats.share-style';
    const STORE_SHARE_OPTIONS = 'dsh.token-stats.share-options';

    /** Share-card geometry presets. */
    const SHARE_SPECS = {
      wide: { label: '16:9', width: 1200, height: 675, columns: 2 },
      square: { label: '1:1', width: 1080, height: 1080, columns: 1 },
      portrait: { label: '3:4', width: 1080, height: 1440, columns: 1 },
      story: { label: '9:16', width: 1080, height: 1920, columns: 1 },
    };

    /** Share-card palettes; `bg` is a two-stop gradient, the rest are flat colours. */
    const SHARE_STYLES = {
      dark: {
        bg: ['#0a111d', '#141d2e'],
        fg: '#f2f6ff',
        dim: '#8b97ad',
        faint: '#5c6779',
        accent: '#7ee0c0',
        track: '#1e2941',
        fill: '#5b8cff',
        line: '#1e2941',
      },
      light: {
        bg: ['#ffffff', '#f1f5fb'],
        fg: '#101828',
        dim: '#5b6474',
        faint: '#98a2b3',
        accent: '#0f9d76',
        track: '#e4e9f2',
        fill: '#3b6ef0',
        line: '#e6eaf2',
      },
      gradient: {
        bg: ['#1d2a63', '#0f5f5b'],
        fg: '#f6f9ff',
        dim: '#c2cee2',
        faint: '#93a6c2',
        accent: '#7ef0c9',
        track: 'rgba(255,255,255,0.18)',
        fill: '#7ef0c9',
        line: 'rgba(255,255,255,0.16)',
      },
      mono: {
        bg: ['#0b0b0c', '#17171a'],
        fg: '#f4f4f5',
        dim: '#a1a1aa',
        faint: '#71717a',
        accent: '#f4f4f5',
        track: '#2a2a2e',
        fill: '#f4f4f5',
        line: '#2a2a2e',
      },
    };

    /** What the card's main list blocks can show; any subset may be selected. */
    const SHARE_BLOCKS = ['providers', 'models', 'sessions', 'metrics'];

    /** Element switches offered by the share preview. */
    const SHARE_TOGGLES = ['title', 'time', 'cost', 'metrics', 'bars', 'footer'];

    /** Content switches for the share card; every element is on by default. */
    const DEFAULT_SHARE_OPTIONS = {
      title: true,
      time: true,
      cost: true,
      metrics: true,
      bars: true,
      footer: true,
      blocks: ['providers'],
    };

    const en = {
      'panel.title': 'Token usage',
      'panel.subtitle': 'Token spend recorded in every DSH session log',
      'panel.refresh': 'Refresh',
      'panel.loading': 'Collecting usage…',
      'panel.retry': 'Try again',
      'panel.total': 'All sessions',
      'panel.summary': '{tokens} tokens · {requests} requests · {sessions} sessions',
      'panel.compactSummary': '{requests} requests · {sessions} sessions · {cost}',
      'panel.metric.input': 'Input',
      'panel.metric.output': 'Output',
      'panel.metric.cacheRead': 'Cache read',
      'panel.metric.cacheWrite': 'Cache write',
      'panel.metric.reasoning': 'Reasoning',
      'panel.metric.requests': 'Requests',
      'panel.metric.sessions': 'Sessions',
      'panel.metric.cost': 'Estimated cost',
      'panel.live.title': 'Live sessions',
      'panel.live.empty': 'No session is running right now.',
      'panel.providers.title': 'By provider',
      'panel.ranking.title': 'Per-session ranking',
      'panel.ranking.empty': 'No token usage has been recorded yet.',
      'panel.ranking.note': 'Showing the top {count} sessions; the total still covers all {all}.',
      'panel.scanning': 'Reading stored sessions… {count} left',
      'panel.error': 'Could not read usage: {message}',
      'panel.note': 'Totals use each request’s reported total, falling back to input + output when absent.',
      'panel.pricing': 'Cost estimate: {miss} per M cache-miss input · {hit} per M cache-hit input · {out} per M output — informational only.',
      'panel.truncated': 'Only the largest {count} sessions are listed.',
      'panel.variant.label': 'Layout',
      'panel.variant.card': 'Cards',
      'panel.variant.ledger': 'Ledger',
      'panel.variant.minimal': 'Minimal',
      'panel.variant.split': 'Split',
      'panel.numbers.label': 'Numbers',
      'panel.numbers.triple': 'All three',
      'panel.numbers.zh': 'Chinese',
      'panel.numbers.en': 'English',
      'panel.share': 'Share image',
      'row.untitled': 'Untitled session',
      'row.live': 'Running',
      'row.open': 'Open this session',
      'row.expand': 'Show details',
      'row.collapse': 'Hide details',
      'detail.id': 'Session',
      'detail.cwd': 'Directory',
      'detail.preset': 'Preset',
      'detail.created': 'Created',
      'detail.lastAt': 'Last activity',
      'detail.models': 'Models',
      'detail.sources': 'Sources',
      'share.title': 'Share image',
      'share.close': 'Close',
      'share.spec': 'Size',
      'share.style': 'Style',
      'share.style.dark': 'Dark',
      'share.style.light': 'Light',
      'share.style.gradient': 'Gradient',
      'share.style.mono': 'Mono',
      'share.right': 'Main block',
      'share.options': 'Elements',
      'share.blocks': 'Blocks',
      'share.background': 'Background',
      'share.pickImage': 'Choose image',
      'share.clearImage': 'Clear image',
      'share.imageFailed': 'Could not load that image.',
      'share.right.providers': 'Providers',
      'share.right.models': 'Models',
      'share.right.sessions': 'Sessions',
      'share.right.metrics': 'Metrics',
      'share.toggle.title': 'Title',
      'share.toggle.time': 'Time',
      'share.toggle.cost': 'Cost',
      'share.toggle.metrics': 'Metric grid',
      'share.toggle.bars': 'Bars',
      'share.toggle.footer': 'Footer',
      'share.copy': 'Copy to clipboard',
      'share.save': 'Save as',
      'share.saved': 'PNG saved',
      'share.copied': 'PNG copied to clipboard',
      'share.copyFailed': 'Clipboard unavailable — use Save as',
      'share.failed': 'Could not render: {message}',
      'share.footer': 'DSH · Token Stats · estimate',
      'badge.tooltip': 'This session: {total} tokens (input {input} · output {output})',
    };

    const zh = {
      'panel.title': 'Token 用量',
      'panel.subtitle': '汇总所有 DSH 会话日志中记录的实际 Token 消耗',
      'panel.refresh': '刷新',
      'panel.loading': '正在统计…',
      'panel.retry': '重新加载',
      'panel.total': '全站累计',
      'panel.summary': '{tokens} tokens · {requests} 次请求 · {sessions} 个会话',
      'panel.compactSummary': '{requests} 次请求 · {sessions} 个会话 · {cost}',
      'panel.metric.input': '输入',
      'panel.metric.output': '输出',
      'panel.metric.cacheRead': '缓存读',
      'panel.metric.cacheWrite': '缓存写',
      'panel.metric.reasoning': '推理',
      'panel.metric.requests': '请求',
      'panel.metric.sessions': '会话',
      'panel.metric.cost': '估算费用',
      'panel.live.title': '当前活跃会话',
      'panel.live.empty': '当前没有正在运行的会话。',
      'panel.providers.title': '按提供商',
      'panel.ranking.title': '按会话排行',
      'panel.ranking.empty': '还没有记录到 Token 消耗。',
      'panel.ranking.note': '只列出前 {count} 个会话；合计仍覆盖全部 {all} 个。',
      'panel.scanning': '正在读取历史会话…还剩 {count} 个',
      'panel.error': '读取失败：{message}',
      'panel.note': '总计按每次请求上报的 total 计算；缺失时按「输入 + 输出」估算。',
      'panel.pricing': '费用按 {miss}/M 缓存未命中输入 · {hit}/M 缓存命中输入 · {out}/M 输出估算，仅供参考。',
      'panel.truncated': '只列出用量最大的 {count} 个会话。',
      'panel.variant.label': '版式',
      'panel.variant.card': '卡片',
      'panel.variant.ledger': '台账',
      'panel.variant.minimal': '极简',
      'panel.variant.split': '双栏',
      'panel.numbers.label': '数字',
      'panel.numbers.triple': '三种',
      'panel.numbers.zh': '中文',
      'panel.numbers.en': '英文',
      'panel.share': '分享图片',
      'row.untitled': '未命名会话',
      'row.live': '运行中',
      'row.open': '打开该会话',
      'row.expand': '展开明细',
      'row.collapse': '收起明细',
      'detail.id': '会话',
      'detail.cwd': '目录',
      'detail.preset': '预设',
      'detail.created': '创建',
      'detail.lastAt': '最近活动',
      'detail.models': '模型',
      'detail.sources': '来源',
      'share.title': '分享图片',
      'share.close': '关闭',
      'share.spec': '规格',
      'share.style': '样式',
      'share.style.dark': '深色',
      'share.style.light': '浅色',
      'share.style.gradient': '渐变',
      'share.style.mono': '单色',
      'share.right': '主区块',
      'share.options': '显示项',
      'share.blocks': '区块',
      'share.background': '背景图',
      'share.pickImage': '选择图片',
      'share.clearImage': '清除',
      'share.imageFailed': '图片加载失败。',
      'share.right.providers': '提供商',
      'share.right.models': '模型',
      'share.right.sessions': '会话',
      'share.right.metrics': '指标',
      'share.toggle.title': '标题',
      'share.toggle.time': '时间',
      'share.toggle.cost': '费用',
      'share.toggle.metrics': '指标网格',
      'share.toggle.bars': '占比条',
      'share.toggle.footer': '页脚',
      'share.copy': '复制到剪贴板',
      'share.save': '另存为',
      'share.saved': 'PNG 已保存',
      'share.copied': 'PNG 已复制到剪贴板',
      'share.copyFailed': '剪贴板不可用，请用「另存为」',
      'share.failed': '生成失败：{message}',
      'share.footer': 'DSH · Token 统计 · 仅供参考',
      'badge.tooltip': '本会话：{total} tokens（输入 {input} · 输出 {output}）',
    };

    const CSS = `
.ts-root { box-sizing: border-box; height: 100%; overflow: auto; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
.ts-inner { box-sizing: border-box; max-width: 900px; margin: 0 auto; padding: 24px 24px 56px; display: flex; flex-direction: column; gap: 16px; }
.ts-inner-wide { max-width: 1120px; }
.ts-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ts-title { margin: 0; font-size: 17px; font-weight: 600; }
.ts-sub { margin: 5px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.ts-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px; padding-bottom: 2px; }
.ts-toolgroup { display: inline-flex; align-items: center; gap: 6px; }
.ts-toolgroup-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ts-spacer { flex: 1 1 auto; }
.ts-seg { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; }
.ts-seg-btn { height: 24px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer; }
.ts-seg-btn:hover { color: var(--dsw-alias-label-primary); }
.ts-seg-btn[data-selected="true"] { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ts-btn { height: 28px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer; }
.ts-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ts-btn:disabled { opacity: .55; cursor: default; }
.ts-btn-primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #ffffff; font-weight: 600; }
.ts-btn-primary:hover { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #ffffff; opacity: .88; }
.ts-btn-accent { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.ts-btn-accent:hover { background: transparent; border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); opacity: .85; }
.ts-flash { font-size: 11px; color: var(--dsw-alias-state-success-primary); }
.ts-flash-error { font-size: 11px; color: var(--dsw-alias-state-error-primary); }
.ts-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; padding: 16px 18px; }
.ts-hero-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.ts-hero-value { margin-top: 6px; font-size: 32px; font-weight: 650; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; line-height: 1.15; }
.ts-hero-huge { font-size: 44px; }
.ts-hero-small { margin-top: 3px; font-size: 11px; line-height: 1.45; color: var(--dsw-alias-label-secondary); opacity: .72; font-variant-numeric: tabular-nums; }
.ts-hero-meta { margin-top: 4px; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.ts-metric { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 12px 14px; }
.ts-metric-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ts-metric-value { margin-top: 4px; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ts-metric-small { margin-top: 2px; font-size: 10px; line-height: 1.4; color: var(--dsw-alias-label-secondary); opacity: .66; font-variant-numeric: tabular-nums; min-height: 14px; }
.ts-metric-cost .ts-metric-value { color: var(--dsw-alias-brand-primary); }
.ts-section-title { margin: 6px 0 0; font-size: 13px; font-weight: 600; }
.ts-list { display: flex; flex-direction: column; }
.ts-entry { display: flex; flex-direction: column; border-top: 1px solid var(--dsw-alias-border-l1); }
.ts-list > .ts-entry:first-child { border-top: 0; }
.ts-entry-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 0 8px; width: 100%; padding: 9px 0 8px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; }
.ts-disclosure { width: 16px; height: 16px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 16px; cursor: pointer; }
.ts-disclosure:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ts-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
button.ts-name { border: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; text-align: left; padding: 0; cursor: pointer; }
button.ts-name:hover { color: var(--dsw-alias-brand-primary); }
.ts-name-static { cursor: default; }
.ts-value { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ts-sub-line { grid-column: 2 / -1; font-size: 10.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); opacity: .85; font-variant-numeric: tabular-nums; }
.ts-bar { grid-column: 2 / -1; height: 4px; margin-top: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.ts-bar > i { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); opacity: .8; }
.ts-detail { display: flex; flex-direction: column; gap: 3px; margin: 0 0 10px 26px; padding: 8px 10px; border-left: 2px solid var(--dsw-alias-border-l2); font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ts-detail-head { font-size: 10px; letter-spacing: .05em; text-transform: uppercase; opacity: .8; }
.ts-detail-row { display: grid; grid-template-columns: minmax(0, 1.1fr) auto auto; align-items: baseline; gap: 0 12px; }
.ts-detail-key { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary); }
.ts-detail-value { font-weight: 600; }
.ts-detail-meta { text-align: right; opacity: .85; }
.ts-live-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-state-success-primary); margin-right: 6px; vertical-align: 1px; }
.ts-empty { padding: 10px 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.ts-foot { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ts-notice { font-size: 12px; color: var(--dsw-alias-state-warn-primary); }
.ts-badge { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 9px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; font-variant-numeric: tabular-nums; cursor: pointer; }
.ts-badge:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ts-badge-mark { width: 6px; height: 6px; border-radius: 2px; background: var(--dsw-alias-brand-primary); opacity: .85; }
.ts-strip { display: flex; flex-wrap: wrap; gap: 10px 26px; }
.ts-strip-item { min-width: 78px; }
.ts-strip-label { font-size: 10px; letter-spacing: .04em; color: var(--dsw-alias-label-secondary); text-transform: uppercase; }
.ts-strip-value { margin-top: 2px; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ts-strip-small { margin-top: 1px; font-size: 10px; color: var(--dsw-alias-label-secondary); opacity: .66; font-variant-numeric: tabular-nums; }
.ts-strip-item-cost .ts-strip-value { color: var(--dsw-alias-brand-primary); }
.ts-rule { height: 1px; background: var(--dsw-alias-border-l1); margin: 14px 0; }
.ts-group { margin: 10px 0 2px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.ts-tight { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto 52px; align-items: center; gap: 0 10px; width: 100%; padding: 5px 0; border: 0; background: transparent; color: inherit; font: inherit; font-size: 12.5px; text-align: left; }
.ts-tight-share { text-align: right; font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ts-minimal { display: flex; flex-direction: column; gap: 24px; }
.ts-minimal-huge { font-size: 46px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.02; font-variant-numeric: tabular-nums; }
.ts-minimal-line { margin-top: 10px; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ts-inline { display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ts-inline b { color: var(--dsw-alias-label-primary); font-weight: 600; }
.ts-plain-group { border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 10px; }
.ts-plain-entry { display: flex; flex-direction: column; }
.ts-plain-row { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; gap: 0 8px; width: 100%; padding: 6px 0; border: 0; background: transparent; color: inherit; font: inherit; font-size: 12.5px; text-align: left; }
.ts-cols { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 18px; align-items: start; }
.ts-rail { display: flex; flex-direction: column; gap: 14px; }
.ts-kv { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; font-size: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
.ts-kv:first-child { border-top: 0; }
.ts-kv-label { color: var(--dsw-alias-label-secondary); }
.ts-kv-box { text-align: right; }
.ts-kv-value { font-weight: 600; font-variant-numeric: tabular-nums; }
.ts-kv-small { font-size: 10px; color: var(--dsw-alias-label-secondary); opacity: .66; font-variant-numeric: tabular-nums; }
.ts-kv-cost .ts-kv-value { color: var(--dsw-alias-brand-primary); }
.ts-scroll { max-height: 44vh; overflow: auto; }
.ts-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(8, 12, 20, .62); pointer-events: auto; }
.ts-modal-card { display: flex; flex-direction: column; gap: 12px; width: min(960px, 100%); max-height: min(92vh, 920px); padding: 16px 18px 14px; border-radius: 14px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-overlay); box-shadow: 0 24px 60px rgba(0, 0, 0, .36); }
.ts-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ts-modal-title { font-size: 14px; font-weight: 600; }
.ts-modal-close { width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer; }
.ts-modal-close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ts-modal-controls { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.ts-modal-stage { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; min-height: 0; padding: 10px; border-radius: 10px; background: var(--dsw-alias-bg-base); overflow: hidden; }
.ts-modal-canvas { max-width: 100%; max-height: 52vh; width: auto; height: auto; border-radius: 8px; box-shadow: 0 10px 30px rgba(0, 0, 0, .28); }
.ts-modal-foot { display: flex; align-items: center; gap: 8px; }
@media (max-width: 720px) { .ts-cols { grid-template-columns: minmax(0, 1fr); } }
`;

    /** @param {number} value @param {number} digits @returns {string} */
    function trimZeros(value, digits) {
      let text = value.toFixed(digits);
      if (text.indexOf('.') >= 0) text = text.replace(/0+$/, '').replace(/\.$/, '');
      return text;
    }

    /**
     * Chinese magnitude form.
     * @param {number} value - raw count.
     * @returns {string} a label such as `1.99亿`.
     */
    function compactZh(value) {
      const count = Math.max(0, Math.round(Number(value) || 0));
      if (count >= 1e8) return `${trimZeros(count / 1e8, 2)}亿`;
      if (count >= 1e4) return `${trimZeros(count / 1e4, count >= 1e6 ? 0 : 1)}万`;
      return String(count);
    }

    /**
     * English magnitude form.
     * @param {number} value - raw count.
     * @returns {string} a label such as `199.8M`.
     */
    function english(value) {
      const count = Math.max(0, Math.round(Number(value) || 0));
      if (count >= 1e9) return `${trimZeros(count / 1e9, 2)}B`;
      if (count >= 1e6) return `${trimZeros(count / 1e6, 1)}M`;
      if (count >= 1e3) return `${trimZeros(count / 1e3, 1)}K`;
      return String(count);
    }

    /**
     * Grouped exact count.
     * @param {number} value - raw count.
     * @param {string} localeId - active locale id.
     * @returns {string} the grouped count.
     */
    function full(value, localeId) {
      const count = Math.max(0, Math.round(Number(value) || 0));
      try {
        return new Intl.NumberFormat(localeId, { maximumFractionDigits: 0 }).format(count);
      } catch (error) {
        return String(count);
      }
    }

    /**
     * Format a money amount.
     * @param {number} value - amount in the configured currency.
     * @param {string} localeId - active locale id.
     * @param {string} currency - symbol or short prefix.
     * @returns {string} a labelled amount such as `¥43.82`.
     */
    function money(value, localeId, currency) {
      const amount = Number(value);
      const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
      const digits = safe === 0 || safe >= 0.01 ? 2 : 4;
      try {
        return `${currency}${new Intl.NumberFormat(localeId, {
          minimumFractionDigits: 2,
          maximumFractionDigits: digits,
        }).format(safe)}`;
      } catch (error) {
        return `${currency}${safe.toFixed(digits)}`;
      }
    }

    /**
     * The renderings of one count under the active number mode.
     * @param {number} value - raw count.
     * @param {string} mode - `triple`, `zh`, or `en`.
     * @param {string} localeId - active locale id.
     * @returns {{ main: string, sub: string }} the primary figure and its dim companion line.
     */
    function numForms(value, mode, localeId) {
      const exact = full(value, localeId);
      const cn = compactZh(value);
      const enText = english(value);
      if (mode === 'zh') return { main: cn, sub: exact };
      if (mode === 'en') return { main: enText, sub: exact };
      const chinese = isChinese(localeId);
      return { main: chinese ? cn : enText, sub: `${chinese ? enText : cn} · ${exact}` };
    }

    /**
     * All three renderings on one line, for detail rows, tooltips, and the share card.
     * @param {number} value - raw count.
     * @param {string} localeId - active locale id.
     * @returns {string} `1.99亿 · 199.8M · 199,787,147`.
     */
    function tripleText(value, localeId) {
      return `${compactZh(value)} · ${english(value)} · ${full(value, localeId)}`;
    }

    /** @param {string} text @param {Record<string, string>} values @returns {string} */
    function interpolate(text, values) {
      return String(text).replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
      );
    }

    /** @param {string} localeId @returns {boolean} */
    function isChinese(localeId) {
      return String(localeId).toLowerCase().indexOf('zh') === 0;
    }

    /** @param {string} localeId @returns {Record<string, string>} */
    function dictOf(localeId) {
      return isChinese(localeId) ? zh : en;
    }

    /**
     * @param {string} key - storage key.
     * @param {string} fallback - value used when nothing usable is stored.
     * @param {readonly string[]} allowed - accepted values.
     * @returns {string} the stored preference or the fallback.
     */
    function readStored(key, fallback, allowed) {
      try {
        const stored = window.localStorage.getItem(key);
        return stored !== null && allowed.indexOf(stored) >= 0 ? stored : fallback;
      } catch (error) {
        return fallback;
      }
    }

    /** @param {string} key - storage key. @param {string} value - value to remember. */
    function writeStored(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* private mode: keep the in-memory choice only */
      }
    }

    /** @returns {any} the stored share-content switches merged over the defaults. */
    function readStoredOptions() {
      try {
        const raw = window.localStorage.getItem(STORE_SHARE_OPTIONS);
        if (!raw) return { ...DEFAULT_SHARE_OPTIONS, blocks: [...DEFAULT_SHARE_OPTIONS.blocks] };
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_SHARE_OPTIONS, blocks: [...DEFAULT_SHARE_OPTIONS.blocks] };
        const merged = { ...DEFAULT_SHARE_OPTIONS, ...parsed };
        if (!Array.isArray(merged.blocks)) {
          merged.blocks = typeof parsed.right === 'string' && SHARE_BLOCKS.indexOf(parsed.right) >= 0 ? [parsed.right] : [...DEFAULT_SHARE_OPTIONS.blocks];
        }
        merged.blocks = merged.blocks.filter((key) => SHARE_BLOCKS.indexOf(key) >= 0);
        delete merged.right;
        return merged;
      } catch (error) {
        return { ...DEFAULT_SHARE_OPTIONS, blocks: [...DEFAULT_SHARE_OPTIONS.blocks] };
      }
    }

    /** @param {string} key - storage key. @param {any} value - JSON-serializable value. */
    function writeStoredJson(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* private mode: keep the in-memory choice only */
      }
    }

    /**
     * Resolve visible text: the slot-injected translator first, own dictionaries as the floor.
     * @param {any} props - slot props, which carry `t` when the registration names a locale.
     * @param {any} localeFace - active-locale reader.
     * @returns {(key: string, values?: Record<string, string>) => string} the translator.
     */
    function translator(props, localeFace) {
      const injected = typeof props.t === 'function' ? props.t : null;
      return (key, values) => {
        let text;
        if (injected) {
          try {
            text = injected(key);
          } catch (error) {
            text = undefined;
          }
        }
        if (typeof text !== 'string' || text === key) {
          const dict = dictOf(localeFace.current());
          text = dict[key] !== undefined ? dict[key] : en[key] !== undefined ? en[key] : key;
        }
        return values ? interpolate(text, values) : text;
      };
    }

    /** @param {any} localeFace @returns {string} the active locale id, re-read on change. */
    function useLocaleId(localeFace) {
      const [id, setId] = React.useState(() => localeFace.current());
      React.useEffect(
        () =>
          localeFace.subscribe((snapshot) => {
            setId(snapshot && typeof snapshot.active === 'string' ? snapshot.active : localeFace.current());
          }),
        [localeFace],
      );
      return id;
    }

    /** Summary store: one poller shared by the panel and every session badge. */
    function createStore() {
      let state = { status: 'loading', data: null, error: null };
      const listeners = new Set();
      let timer = null;
      let inflight = null;
      let disposed = false;

      /** @param {any} next - the next published state. */
      function publish(next) {
        state = next;
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch (error) {
            console.error(error);
          }
        }
      }

      /**
       * Read the summary from the Host.
       * @param {boolean} force - ask the Host to re-read stored logs.
       * @returns {Promise<unknown>} the in-flight read.
       */
      function load(force) {
        if (disposed) return Promise.resolve(null);
        if (inflight) return inflight;
        const url = force ? `${API}?refresh=1` : API;
        inflight = (async () => {
          try {
            const response = await window.fetch(url, {
              cache: 'no-store',
              credentials: 'same-origin',
              headers: { accept: 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!disposed) publish({ status: 'ready', data, error: null });
          } catch (error) {
            if (!disposed) {
              publish({
                status: state.data ? 'ready' : 'error',
                data: state.data,
                error: error && error.message ? error.message : String(error),
              });
            }
          } finally {
            inflight = null;
          }
        })();
        return inflight;
      }

      function schedule() {
        if (timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
        if (disposed || listeners.size === 0) return;
        const busy = state.data ? state.data.scanning === true && state.data.pendingSessions > 0 : true;
        timer = window.setTimeout(async () => {
          timer = null;
          await load(false);
          schedule();
        }, busy ? BUSY_MS : POLL_MS);
      }

      return {
        getSnapshot: () => state,
        subscribe(listener) {
          listeners.add(listener);
          if (listeners.size === 1) {
            load(false);
            schedule();
          }
          return () => {
            listeners.delete(listener);
            if (listeners.size === 0 && timer !== null) {
              window.clearTimeout(timer);
              timer = null;
            }
          };
        },
        refresh: () => load(true),
        dispose() {
          disposed = true;
          if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
          }
          listeners.clear();
        },
      };
    }

    /** Share-preview state: whether the modal is open, and which spec and style it shows. */
    function createShareUi() {
      let state = {
        open: false,
        spec: readStored(STORE_SPEC, 'wide', Object.keys(SHARE_SPECS)),
        style: readStored(STORE_STYLE, 'dark', Object.keys(SHARE_STYLES)),
        options: readStoredOptions(),
        background: null,
      };
      const listeners = new Set();
      /** @param {any} patch - fields to merge into the published state. */
      const publish = (patch) => {
        state = { ...state, ...patch };
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch (error) {
            console.error(error);
          }
        }
      };
      return {
        getSnapshot: () => state,
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        open: () => publish({ open: true }),
        close: () => publish({ open: false }),
        setSpec(spec) {
          writeStored(STORE_SPEC, spec);
          publish({ spec });
        },
        setStyle(style) {
          writeStored(STORE_STYLE, style);
          publish({ style });
        },
        toggleOption(key) {
          const options = { ...state.options, [key]: state.options[key] === false };
          writeStoredJson(STORE_SHARE_OPTIONS, options);
          publish({ options });
        },
        toggleBlock(key) {
          const current = Array.isArray(state.options.blocks) ? state.options.blocks : [];
          const blocks = current.indexOf(key) >= 0 ? current.filter((entry) => entry !== key) : [...current, key];
          const options = { ...state.options, blocks };
          writeStoredJson(STORE_SHARE_OPTIONS, options);
          publish({ options });
        },
        setBackground(background) {
          publish({ background });
        },
      };
    }

    /** @param {any} store @returns {any} the published state, re-rendered on change. */
    function useStore(store) {
      const [snapshot, setSnapshot] = React.useState(() => store.getSnapshot());
      React.useEffect(() => {
        let alive = true;
        const read = () => {
          if (alive) setSnapshot(store.getSnapshot());
        };
        read();
        const unsubscribe = store.subscribe(read);
        return () => {
          alive = false;
          unsubscribe();
        };
      }, [store]);
      return snapshot;
    }

    /** DeepSeek CNY list prices per million tokens; a Host-reported table overrides these. */
    const DEFAULT_PRICING = {
      currency: '¥',
      cacheHitPerMillion: 0.2,
      cacheMissPerMillion: 2,
      outputPerMillion: 3,
      cacheWritePerMillion: 0,
    };

    /**
     * Merge a Host-reported price table over the built-in defaults.
     * @param {any} raw - the summary payload's `pricing`, when the Host sends one.
     * @returns {{ currency: string } & Record<string, number>} effective prices.
     */
    function resolvePricing(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      /** @param {string} key @returns {number} */
      const price = (key) => {
        const value = source[key];
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : DEFAULT_PRICING[key];
      };
      const currency =
        typeof source.currency === 'string' && source.currency.trim().length > 0
          ? source.currency.trim()
          : DEFAULT_PRICING.currency;
      return {
        currency,
        cacheHitPerMillion: price('cacheHitPerMillion'),
        cacheMissPerMillion: price('cacheMissPerMillion'),
        outputPerMillion: price('outputPerMillion'),
        cacheWritePerMillion: price('cacheWritePerMillion'),
      };
    }

    /**
     * Price one usage accumulator.
     * @param {any} totals - usage totals.
     * @param {{ currency: string } & Record<string, number>} pricing - effective prices.
     * @returns {number} the estimated amount.
     */
    function costOf(totals, pricing) {
      const n = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
      return (
        (n(totals.input) / 1e6) * pricing.cacheMissPerMillion +
        (n(totals.cacheRead) / 1e6) * pricing.cacheHitPerMillion +
        (n(totals.cacheWrite) / 1e6) * pricing.cacheWritePerMillion +
        (n(totals.output) / 1e6) * pricing.outputPerMillion
      );
    }

    /**
     * Format a timestamp for a detail line.
     * @param {number} at - epoch milliseconds.
     * @param {string} localeId - active locale id.
     * @returns {string} a short local date-time, or an empty string.
     */
    function stampText(at, localeId) {
      const value = Number(at);
      if (!Number.isFinite(value) || value <= 0) return '';
      try {
        return new Intl.DateTimeFormat(localeId, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
      } catch (error) {
        return new Date(value).toISOString().slice(0, 16).replace('T', ' ');
      }
    }

    /** Sidebar panel icon: a token ledger mark that follows the sidebar text color. */
    function TokenStatsIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block', opacity: props.active === false ? 0.85 : 1 },
        },
        h('path', {
          d: 'M12 3.1 20 7.5v9L12 20.9 4 16.5v-9Z',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M8.2 10h7.6M8.2 13.4h4.6', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      );
    }

    /**
     * Render the shareable card into an off-screen canvas.
     * @param {any} input - spec, style, options, texts, totals, pricing, providers, sessions, and the report time.
     * @returns {HTMLCanvasElement} the card at 2× device scale.
     */
    function buildShareCard(input) {
      const spec = SHARE_SPECS[input.spec] || SHARE_SPECS.wide;
      const palette = SHARE_STYLES[input.style] || SHARE_STYLES.dark;
      const options = Object.assign({}, DEFAULT_SHARE_OPTIONS, input.options || {});
      const wide = spec.columns === 2;
      const scale = 2;
      const width = spec.width;
      const height = spec.height;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d unavailable');
      ctx.scale(scale, scale);

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, palette.bg[0]);
      background.addColorStop(1, palette.bg[1]);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const photo = input.background && input.background.image ? input.background.image : null;
      if (photo && photo.width > 0 && photo.height > 0) {
        const cover = Math.max(width / photo.width, height / photo.height) * 1.08;
        const photoWidth = photo.width * cover;
        const photoHeight = photo.height * cover;
        ctx.save();
        try {
          ctx.filter = `blur(${Math.max(12, Math.round(width * 0.016))}px)`;
        } catch (error) {
          /* no filter support: keep the photo crisp */
        }
        ctx.drawImage(photo, (width - photoWidth) / 2, (height - photoHeight) / 2, photoWidth, photoHeight);
        ctx.restore();
        const lightCard = input.style === 'light';
        const scrim = ctx.createLinearGradient(0, 0, width, height);
        scrim.addColorStop(0, lightCard ? 'rgba(250, 252, 255, 0.88)' : 'rgba(6, 10, 18, 0.74)');
        scrim.addColorStop(1, lightCard ? 'rgba(244, 247, 253, 0.8)' : 'rgba(6, 10, 18, 0.58)');
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);
      }

      const accent = ctx.createLinearGradient(0, 0, width, 0);
      accent.addColorStop(0, palette.fill);
      accent.addColorStop(1, palette.accent);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, width, Math.max(4, Math.round(width * 0.004)));

      /** @param {number} size @param {number} weight @returns {string} */
      const font = (size, weight) => `${weight} ${size}px system-ui, "Segoe UI", "Microsoft YaHei", sans-serif`;
      /**
       * Draw text, clipped to a maximum width.
       * @param {string} text - content.
       * @param {number} x - left edge, or the right edge when `right` is set.
       * @param {number} y - baseline.
       * @param {string} color - fill colour.
       * @param {number} size - font size.
       * @param {number} weight - font weight.
       * @param {number} maxWidth - clipping width.
       * @param {boolean} [right] - right-align at `x`.
       */
      const draw = (text, x, y, color, size, weight, maxWidth, right) => {
        ctx.font = font(size, weight);
        ctx.fillStyle = color;
        let label = String(text);
        if (label && maxWidth) {
          if (right) {
            while (label.length > 1 && ctx.measureText(label).width > maxWidth) label = label.slice(0, -1);
          } else if (ctx.measureText(label).width > maxWidth) {
            while (label.length > 1 && ctx.measureText(`${label}…`).width > maxWidth) label = label.slice(0, -1);
            label = `${label}…`;
          }
        }
        ctx.textAlign = right ? 'right' : 'left';
        ctx.fillText(label, x, y);
        ctx.textAlign = 'left';
      };

      const { t, totals, pricing, cost, providers, sessions, generatedAt, localeId } = input;
      const pad = Math.round(width * (wide ? 0.047 : 0.07));
      const innerWidth = width - pad * 2;
      const costText = money(cost, localeId, pricing.currency);
      const barHeight = Math.max(4, Math.round(width * 0.005));
      const enabled = (key) => options[key] !== false;
      const safeProviders = Array.isArray(providers) ? providers : [];
      const safeSessions = Array.isArray(sessions) ? sessions : [];
      const metricPairs = [
        [t('panel.metric.input'), totals.input],
        [t('panel.metric.output'), totals.output],
        [t('panel.metric.cacheRead'), totals.cacheRead],
        [t('panel.metric.cacheWrite'), totals.cacheWrite],
        [t('panel.metric.reasoning'), totals.reasoning],
        [t('panel.metric.requests'), totals.requests],
        [t('panel.metric.sessions'), safeSessions.length],
      ];

      const modelRows = [];
      for (const provider of safeProviders) {
        for (const model of Array.isArray(provider.models) ? provider.models : []) {
          modelRows.push({
            label: `${provider.provider} / ${model.model}`,
            total: model.total,
            input: model.input,
            output: model.output,
            requests: model.requests,
            cost: costOf(model, pricing),
          });
        }
      }
      modelRows.sort((left, right) => right.total - left.total);
      const providerRows = safeProviders.map((row) => ({
        label: String(row.provider),
        total: row.total,
        input: row.input,
        output: row.output,
        requests: row.requests,
        cost: costOf(row, pricing),
      }));
      const sessionRows = safeSessions.map((row) => ({
        label: row.title && String(row.title).trim().length > 0 ? String(row.title) : t('row.untitled'),
        total: row.total,
        input: row.input,
        output: row.output,
        requests: row.requests,
        cost: costOf(row, pricing),
      }));
      const selectedBlocks = (Array.isArray(options.blocks) ? options.blocks : []).filter(
        (kind) => SHARE_BLOCKS.indexOf(kind) >= 0,
      );
      /** @param {string} kind - block key. @returns {readonly any[]} the rows it draws. */
      const rowsFor = (kind) => (kind === 'models' ? modelRows : kind === 'sessions' ? sessionRows : providerRows);

      /**
       * Draw the title and time.
       * @param {number} x - left edge.
       * @param {number} y - top edge.
       * @param {number} columnWidth - available width.
       * @returns {number} the cursor below the block.
       */
      const drawHeader = (x, y, columnWidth) => {
        let cursor = y;
        if (enabled('title')) {
          const size = Math.max(22, Math.round(width * (wide ? 0.026 : 0.03)));
          draw(t('panel.title'), x, cursor + size, palette.fg, size, 600, columnWidth);
          cursor += Math.round(size * 0.92) + 8;
        }
        if (enabled('time')) {
          draw(stampText(generatedAt, localeId), x, cursor + 15, palette.dim, Math.max(11, Math.round(width * 0.0125)), 400, columnWidth);
          cursor += 22;
        }
        return cursor;
      };

      /**
       * Draw the grand total with its two companion renderings.
       * @param {number} x - left edge.
       * @param {number} y - top edge.
       * @param {number} columnWidth - available width.
       * @returns {number} the cursor below the block.
       */
      const drawHero = (x, y, columnWidth) => {
        const base = wide ? columnWidth : width;
        const mainSize = Math.max(40, Math.round(base * (wide ? 0.148 : 0.092)));
        const subSize = Math.max(13, Math.round(base * (wide ? 0.042 : 0.018)));
        let cursor = y;
        draw(t('panel.total'), x, cursor + Math.max(12, Math.round(base * 0.03)), palette.dim, Math.max(11, Math.round(base * (wide ? 0.031 : 0.0145))), 400, columnWidth);
        cursor += Math.max(20, Math.round(base * (wide ? 0.052 : 0.026)));
        draw(compactZh(totals.total), x, cursor + mainSize, palette.fg, mainSize, 700, columnWidth);
        cursor += mainSize + Math.round(mainSize * 0.16);
        draw(`${english(totals.total)} · ${full(totals.total, localeId)}`, x, cursor + subSize, palette.dim, subSize, 400, columnWidth);
        return cursor + subSize + Math.round(subSize * 0.7);
      };

      /**
       * Draw the estimated cost.
       * @param {number} x - left edge.
       * @param {number} y - top edge.
       * @param {number} columnWidth - available width.
       * @returns {number} the cursor below the block.
       */
      const drawCost = (x, y, columnWidth) => {
        const base = wide ? columnWidth : width;
        let cursor = y;
        draw(t('panel.metric.cost'), x, cursor + 13, palette.dim, Math.max(10, Math.round(base * (wide ? 0.027 : 0.0125))), 400, columnWidth);
        cursor += 20;
        const size = Math.max(24, Math.round(base * (wide ? 0.068 : 0.032)));
        draw(costText, x, cursor + size, palette.accent, size, 650, Math.round(columnWidth * 0.8));
        return cursor + size + Math.round(size * 0.5);
      };

      /**
       * Draw the metric grid.
       * @param {number} x - left edge.
       * @param {number} y - top edge.
       * @param {number} columnWidth - available width.
       * @param {number} columns - grid columns.
       * @param {number} cellH - row height.
       * @param {boolean} withEnglish - draw the English magnitude under each value.
       * @returns {number} the cursor below the block.
       */
      const drawMetrics = (x, y, columnWidth, columns, cellH, withEnglish) => {
        const cellW = columnWidth / columns;
        metricPairs.forEach((pair, index) => {
          const cx = x + (index % columns) * cellW;
          const cy = y + Math.floor(index / columns) * cellH;
          draw(pair[0], cx, cy + Math.round(cellH * 0.34), palette.faint, Math.max(9, Math.round(columnWidth * 0.022)), 400, cellW - 12);
          draw(compactZh(pair[1]), cx, cy + Math.round(cellH * 0.66), palette.fg, Math.max(13, Math.round(columnWidth * 0.034)), 600, cellW - 12);
          if (withEnglish) {
            draw(english(pair[1]), cx, cy + Math.round(cellH * 0.88), palette.dim, Math.max(8, Math.round(columnWidth * 0.019)), 400, cellW - 12);
          }
        });
        return y + Math.ceil(metricPairs.length / columns) * cellH;
      };

      /**
       * Draw a titled list block.
       * @param {number} x - left edge.
       * @param {number} y - top edge.
       * @param {number} columnWidth - available width.
       * @param {string} title - block heading.
       * @param {readonly any[]} rows - entries with `label`, `total`, and `cost`.
       * @param {number} maxRows - cap on drawn rows.
       * @param {number} rowH - row height.
       * @param {boolean} withBars - draw the share bar under each row.
       * @param {boolean} withSub - draw the English value and cost under each row.
       * @returns {number} the cursor below the block.
       */
      const drawList = (x, y, columnWidth, title, rows, maxRows, rowH, withBars, withSub) => {
        let cursor = y;
        draw(title, x, cursor + Math.max(11, Math.round(columnWidth * 0.026)), palette.dim, Math.max(10, Math.round(columnWidth * 0.025)), 500, columnWidth);
        cursor += Math.max(18, Math.round(columnWidth * 0.04));
        const limit = Math.min(rows.length, maxRows);
        for (let index = 0; index < limit; index += 1) {
          if (cursor + rowH > height - pad) break;
          const row = rows[index];
          const ratio = totals.total > 0 ? Math.min(1, row.total / totals.total) : 0;
          const nameSize = Math.max(12, Math.round(columnWidth * 0.029));
          const baseline = cursor + Math.round(rowH * (withSub ? 0.38 : 0.55));
          draw(row.label, x, baseline, palette.fg, nameSize, 500, columnWidth * 0.68);
          draw(compactZh(row.total), x + columnWidth, baseline, palette.fg, nameSize, 600, columnWidth * 0.3, true);
          if (withSub) {
            draw(
              `${english(row.total)} · ${money(row.cost, localeId, pricing.currency)}`,
              x,
              baseline + Math.round(nameSize * 1.15),
              palette.dim,
              Math.max(9, Math.round(columnWidth * 0.02)),
              400,
              columnWidth * 0.8,
            );
          }
          if (withBars) {
            const by = cursor + rowH - Math.round(rowH * 0.2);
            ctx.fillStyle = palette.track;
            ctx.fillRect(x, by, columnWidth, barHeight);
            ctx.fillStyle = palette.fill;
            ctx.fillRect(x, by, Math.max(4, Math.round(columnWidth * ratio)), barHeight);
          } else {
            ctx.fillStyle = palette.line;
            ctx.fillRect(x, cursor + rowH - 1, columnWidth, 1);
          }
          cursor += rowH;
        }
        return cursor;
      };

      if (wide) {
        const gutter = Math.round(innerWidth * 0.05);
        const leftWidth = Math.round(innerWidth * 0.44);
        const rightX = pad + leftWidth + gutter;
        const rightWidth = width - pad - rightX;

        let leftY = drawHeader(pad, pad, leftWidth);
        leftY += Math.round(height * 0.03);
        leftY = drawHero(pad, leftY, leftWidth);
        leftY += Math.round(height * 0.025);
        if (enabled('cost')) {
          leftY = drawCost(pad, leftY, leftWidth);
          leftY += Math.round(height * 0.015);
        }
        if (enabled('metrics')) {
          drawMetrics(pad, leftY, leftWidth, 3, Math.round(height * 0.075), false);
        }

        const bottom = height - pad;
        let rightY = pad;
        selectedBlocks.forEach((kind, index) => {
          const remaining = bottom - rightY - (selectedBlocks.length - index - 1) * 12;
          if (remaining < 36) return;
          if (kind === 'metrics') {
            const columns = 2;
            const rows = Math.ceil(metricPairs.length / columns);
            const cellH = Math.max(34, Math.min(Math.round(height * 0.08), Math.floor(remaining / rows)));
            rightY = drawMetrics(rightX, rightY, rightWidth, columns, cellH, true) + 14;
          } else {
            const rowH = Math.round(height * 0.078);
            const maxRows = Math.max(1, Math.min(8, Math.floor(remaining / rowH)));
            rightY =
              drawList(
                rightX,
                rightY,
                rightWidth,
                t(`share.right.${kind}`),
                rowsFor(kind),
                maxRows,
                rowH,
                enabled('bars'),
                kind !== 'sessions',
              ) + 14;
          }
        });
      } else {
        const dense = height < 1200;
        let y = drawHeader(pad, pad, innerWidth);
        y += Math.round(height * 0.022);
        y = drawHero(pad, y, innerWidth);
        y += Math.round(height * 0.024);
        if (enabled('cost')) {
          y = drawCost(pad, y, innerWidth);
          y += Math.round(height * 0.02);
        }
        if (enabled('metrics')) {
          y = drawMetrics(pad, y, innerWidth, dense ? 4 : 3, Math.round(height * (dense ? 0.05 : 0.042)), true);
          y += Math.round(height * 0.02);
        }
        selectedBlocks.forEach((kind) => {
          const footReserve = enabled('footer') ? Math.round(pad * 0.9) : 0;
          const remaining = height - pad - footReserve - y;
          if (remaining < 36) return;
          if (kind === 'metrics') {
            const columns = 3;
            const rows = Math.ceil(metricPairs.length / columns);
            const cellH = Math.max(34, Math.min(Math.round(height * 0.05), Math.floor(remaining / rows)));
            y = drawMetrics(pad, y, innerWidth, columns, cellH, true) + Math.round(height * 0.02);
          } else {
            const rowH = Math.round(height * (dense ? 0.045 : 0.038));
            const maxRows = Math.max(1, Math.min(12, Math.floor(remaining / rowH)));
            y =
              drawList(
                pad,
                y,
                innerWidth,
                t(`share.right.${kind}`),
                rowsFor(kind),
                maxRows,
                rowH,
                enabled('bars'),
                kind !== 'sessions',
              ) + Math.round(height * 0.015);
          }
        });
      }

      if (enabled('footer')) {
        draw(t('share.footer'), pad, height - Math.round(pad * 0.55), palette.faint, Math.max(10, Math.round(width * 0.011)), 400);
      }

      return canvas;
    }

    /**
     * File name for a rendered card.
     * @param {string} spec - spec key.
     * @param {string} style - style key.
     * @returns {string} the suggested `.png` file name.
     */
    function shareFilename(spec, style) {
      const now = new Date();
      const pad2 = (value) => String(value).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}`;
      return `token-usage-${spec}-${style}-${stamp}.png`;
    }

    /**
     * Hand a rendered canvas to the browser as a PNG download.
     * @param {HTMLCanvasElement} canvas - the rendered card.
     * @param {string} filename - suggested file name.
     */
    function downloadCanvas(canvas, filename) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, 'image/png');
    }

    /**
     * Copy a rendered canvas to the clipboard when the browser allows it.
     * @param {HTMLCanvasElement} canvas - the rendered card.
     * @returns {Promise<boolean>} whether the copy succeeded.
     */
    async function copyCanvas(canvas) {
      if (!navigator.clipboard || typeof window.ClipboardItem !== 'function') return false;
      try {
        const png = new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': png })]);
        return true;
      } catch (error) {
        return false;
      }
    }

    function TokenStatsPanel(props) {
      const { store, shareUi, localeFace, openSession } = props;
      const t = translator(props, localeFace);
      const localeId = useLocaleId(localeFace);
      const snapshot = useStore(store);
      const [busy, setBusy] = React.useState(false);
      const [variant, setVariant] = React.useState(() => readStored(STORE_VARIANT, 'card', VARIANTS));
      const [numMode, setNumMode] = React.useState(() => readStored(STORE_NUM, 'triple', NUM_MODES));
      const [expanded, setExpanded] = React.useState(() => new Set());
      const data = snapshot.data;

      const refresh = () => {
        setBusy(true);
        Promise.resolve(store.refresh()).then(
          () => setBusy(false),
          () => setBusy(false),
        );
      };

      const pickVariant = (next) => {
        setVariant(next);
        writeStored(STORE_VARIANT, next);
      };
      const pickNumbers = (next) => {
        setNumMode(next);
        writeStored(STORE_NUM, next);
      };
      const toggleExpanded = (key) =>
        setExpanded((previous) => {
          const next = new Set(previous);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      const style = h('style', { key: 'token-stats-style' }, CSS);

      if (!data) {
        return h(
          'div',
          { className: 'ts-root' },
          style,
          h(
            'div',
            { className: 'ts-inner' },
            h(
              'div',
              { className: 'ts-head' },
              h('div', null, h('h1', { className: 'ts-title' }, t('panel.title')), h('p', { className: 'ts-sub' }, t('panel.subtitle'))),
            ),
            snapshot.status === 'error'
              ? h(
                  'div',
                  { className: 'ts-card' },
                  h('div', { className: 'ts-notice' }, t('panel.error', { message: snapshot.error || '' })),
                  h('div', { style: { marginTop: 12 } }, h('button', { type: 'button', className: 'ts-btn', onClick: refresh }, t('panel.retry'))),
                )
              : h('div', { className: 'ts-card ts-empty' }, t('panel.loading')),
          ),
        );
      }

      const totals = data.totals;
      const pricing = resolvePricing(data.pricing);
      const cost = costOf(totals, pricing);
      const costText = money(cost, localeId, pricing.currency);
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const providers = Array.isArray(data.providers) ? data.providers : [];
      const live = sessions.filter((row) => row.live);
      const peak = sessions.length > 0 ? Math.max(1, sessions[0].total) : 1;
      const totalPeak = Math.max(1, totals.total);
      const pending = typeof data.pendingSessions === 'number' ? data.pendingSessions : 0;
      const sessionCount = data.sessionCount || sessions.length;
      const metrics = [
        ['panel.metric.input', totals.input],
        ['panel.metric.output', totals.output],
        ['panel.metric.cacheRead', totals.cacheRead],
        ['panel.metric.cacheWrite', totals.cacheWrite],
        ['panel.metric.reasoning', totals.reasoning],
        ['panel.metric.requests', totals.requests],
        ['panel.metric.sessions', sessionCount],
      ];

      /** @param {any} row - one session summary. */
      const rowLabel = (row) => (row.title && String(row.title).trim().length > 0 ? String(row.title) : t('row.untitled'));
      /** @param {number} part @returns {string} the share of the grand total, in percent. */
      const share = (part) => trimZeros(Math.round((Number(part) / totalPeak) * 1000) / 10, 1);
      /** @param {any} row - one session summary. */
      const activate = (row) => {
        if (typeof openSession === 'function') openSession(row.id);
      };

      const openShare = () => shareUi.open();

      /** @param {string} key - locale key prefix, `panel.variant` or `panel.numbers`. */
      const segments = (key, options, current, onPick) =>
        h(
          'div',
          { className: 'ts-toolgroup' },
          h('span', { className: 'ts-toolgroup-label' }, t(`${key}.label`)),
          h(
            'div',
            { className: 'ts-seg', role: 'group', 'aria-label': t(`${key}.label`) },
            options.map((id) =>
              h(
                'button',
                {
                  type: 'button',
                  key: id,
                  className: 'ts-seg-btn',
                  'data-selected': String(id === current),
                  onClick: () => onPick(id),
                },
                t(`${key}.${id}`),
              ),
            ),
          ),
        );

      const toolbar = h(
        'div',
        { className: 'ts-toolbar' },
        segments('panel.variant', VARIANTS, variant, pickVariant),
        segments('panel.numbers', NUM_MODES, numMode, pickNumbers),
        h('span', { className: 'ts-spacer' }),
        h('button', { type: 'button', className: 'ts-btn', onClick: openShare }, t('panel.share')),
        h('button', { type: 'button', className: 'ts-btn', onClick: refresh, disabled: busy }, t('panel.refresh')),
      );

      const head = h(
        'div',
        { className: 'ts-head' },
        h('div', null, h('h1', { className: 'ts-title' }, t('panel.title')), h('p', { className: 'ts-sub' }, t('panel.subtitle'))),
      );

      const statusLine =
        pending > 0 ? h('div', { className: 'ts-foot' }, t('panel.scanning', { count: full(pending, localeId) })) : null;

      const footers = [
        Array.isArray(data.problems) && data.problems.length > 0
          ? h('div', { className: 'ts-notice', key: 'problem' }, t('panel.error', { message: String(data.problems[0]) }))
          : null,
        h('div', { className: 'ts-foot', key: 'note' }, t('panel.note')),
        h(
          'div',
          { className: 'ts-foot', key: 'pricing' },
          t('panel.pricing', {
            miss: `${pricing.currency}${pricing.cacheMissPerMillion}`,
            hit: `${pricing.currency}${pricing.cacheHitPerMillion}`,
            out: `${pricing.currency}${pricing.outputPerMillion}`,
          }),
        ),
      ];

      /**
       * Expansion content for one entry.
       * @param {string} kind - `provider` or `session`.
       * @param {any} row - the entry.
       * @returns {any} the detail block.
       */
      const detailBlock = (kind, row) => {
        if (kind === 'provider') {
          const models = Array.isArray(row.models) ? row.models : [];
          return h(
            'div',
            { className: 'ts-detail' },
            h('div', { className: 'ts-detail-head' }, `${t('detail.models')} · ${full(models.length, localeId)}`),
            models.length === 0
              ? h('div', null, '—')
              : models.map((model) =>
                  h(
                    'div',
                    { className: 'ts-detail-row', key: String(model.model) },
                    h('span', { className: 'ts-detail-key' }, String(model.model)),
                    h('span', { className: 'ts-detail-value' }, tripleText(model.total, localeId)),
                    h(
                      'span',
                      { className: 'ts-detail-meta' },
                      `${full(model.requests, localeId)} · ${money(costOf(model, pricing), localeId, pricing.currency)}`,
                    ),
                  ),
                ),
          );
        }
        const sources = Array.isArray(row.sources) ? row.sources : [];
        const meta = [
          [t('detail.id'), row.id],
          row.cwd ? [t('detail.cwd'), row.cwd] : null,
          row.agentPreset ? [t('detail.preset'), row.agentPreset] : null,
          row.createdAt ? [t('detail.created'), stampText(row.createdAt, localeId)] : null,
          row.lastAt ? [t('detail.lastAt'), stampText(row.lastAt, localeId)] : null,
        ].filter(Boolean);
        return h(
          'div',
          { className: 'ts-detail' },
          meta.map((pair) =>
            h(
              'div',
              { className: 'ts-detail-row', key: pair[0] },
              h('span', { className: 'ts-detail-key' }, String(pair[0])),
              h('span', { className: 'ts-detail-value', style: { gridColumn: '2 / -1', fontWeight: 400 } }, String(pair[1])),
            ),
          ),
          h('div', { className: 'ts-detail-head', style: { marginTop: 6 } }, `${t('detail.sources')} · ${full(sources.length, localeId)}`),
          sources.length === 0
            ? h('div', null, '—')
            : sources.map((source) =>
                h(
                  'div',
                  { className: 'ts-detail-row', key: `${source.provider}/${source.model}` },
                  h('span', { className: 'ts-detail-key' }, `${source.provider} / ${source.model}`),
                  h('span', { className: 'ts-detail-value' }, tripleText(source.total, localeId)),
                  h(
                    'span',
                    { className: 'ts-detail-meta' },
                    `${full(source.requests, localeId)} · ${money(costOf(source, pricing), localeId, pricing.currency)}`,
                  ),
                ),
              ),
        );
      };

      /**
       * One expandable entry.
       * @param {string} kind - `provider` or `session`.
       * @param {any} row - the entry.
       * @param {string} look - `card`, `ledger`, or `plain` row styling.
       * @returns {any} the entry element.
       */
      const entry = (kind, row, look) => {
        const isProvider = kind === 'provider';
        const key = isProvider ? `p:${row.provider}` : `s:${row.id}`;
        const open = expanded.has(key);
        const label = isProvider ? String(row.provider) : rowLabel(row);
        const forms = numForms(row.total, numMode, localeId);
        const canExpand = isProvider ? Array.isArray(row.models) && row.models.length > 0 : true;
        const disclosure = canExpand
          ? h(
              'button',
              {
                type: 'button',
                className: 'ts-disclosure',
                'aria-expanded': String(open),
                title: open ? t('row.collapse') : t('row.expand'),
                onClick: () => toggleExpanded(key),
              },
              open ? '▾' : '▸',
            )
          : h('span', { className: 'ts-disclosure', 'aria-hidden': true });

        const nameNode = isProvider
          ? h('span', { className: 'ts-name ts-name-static' }, label)
          : h(
              'button',
              { type: 'button', className: 'ts-name', title: t('row.open'), onClick: () => activate(row) },
              row.live ? h('span', { className: 'ts-live-dot' }) : null,
              label,
            );

        if (look === 'plain') {
          return h(
            'div',
            { className: 'ts-plain-entry', key },
            h(
              'div',
              { className: 'ts-plain-row' },
              disclosure,
              nameNode,
              h('span', { className: 'ts-value', title: tripleText(row.total, localeId) }, forms.main),
            ),
            open ? detailBlock(kind, row) : null,
          );
        }

        if (look === 'ledger') {
          return h(
            'div',
            { className: 'ts-entry', key },
            h(
              'div',
              { className: 'ts-tight' },
              disclosure,
              nameNode,
              h('span', { className: 'ts-value', title: tripleText(row.total, localeId) }, forms.main),
              h('span', { className: 'ts-tight-share' }, `${share(row.total)}%`),
            ),
            open ? detailBlock(kind, row) : null,
          );
        }

        return h(
          'div',
          { className: 'ts-entry', key },
          h(
            'div',
            { className: 'ts-entry-row' },
            disclosure,
            nameNode,
            h('span', { className: 'ts-value', title: tripleText(row.total, localeId) }, forms.main),
            h('span', { className: 'ts-sub-line' }, forms.sub),
            h(
              'span',
              { className: 'ts-sub-line' },
              `${t('panel.metric.input')} ${compactZh(row.input)} · ${t('panel.metric.output')} ${compactZh(row.output)} · ${t('panel.metric.requests')} ${full(row.requests, localeId)} · ${money(costOf(row, pricing), localeId, pricing.currency)}`,
            ),
            h('div', { className: 'ts-bar' }, h('i', { style: { width: `${Math.max(2, Math.round((row.total / peak) * 100))}%` } })),
          ),
          open ? detailBlock(kind, row) : null,
        );
      };

      /** Variant A: hero card, metric grid, then one card per section. */
      const renderCard = () => [
        h(
          'div',
          { className: 'ts-card', key: 'hero' },
          h('div', { className: 'ts-hero-label' }, t('panel.total')),
          h('div', { className: 'ts-hero-value', title: tripleText(totals.total, localeId) }, numForms(totals.total, numMode, localeId).main),
          h('div', { className: 'ts-hero-small' }, numForms(totals.total, numMode, localeId).sub),
          h(
            'div',
            { className: 'ts-hero-meta' },
            t('panel.summary', {
              tokens: full(totals.total, localeId),
              requests: full(totals.requests, localeId),
              sessions: full(sessionCount, localeId),
            }),
          ),
          statusLine ? h('div', { style: { marginTop: 8 } }, statusLine) : null,
        ),
        h(
          'div',
          { className: 'ts-grid', key: 'grid' },
          metrics.map((pair) =>
            h(
              'div',
              { className: 'ts-metric', key: pair[0] },
              h('div', { className: 'ts-metric-label' }, t(pair[0])),
              h('div', { className: 'ts-metric-value', title: tripleText(pair[1], localeId) }, numForms(pair[1], numMode, localeId).main),
              h('div', { className: 'ts-metric-small' }, numForms(pair[1], numMode, localeId).sub),
            ),
          ),
          h(
            'div',
            { className: 'ts-metric ts-metric-cost', key: 'cost' },
            h('div', { className: 'ts-metric-label' }, t('panel.metric.cost')),
            h('div', { className: 'ts-metric-value', title: costText }, costText),
            h('div', { className: 'ts-metric-small' }),
          ),
        ),
        h('h2', { className: 'ts-section-title', key: 'live-title' }, t('panel.live.title')),
        h(
          'div',
          { className: 'ts-card', key: 'live' },
          live.length === 0
            ? h('div', { className: 'ts-empty' }, t('panel.live.empty'))
            : h('div', { className: 'ts-list' }, live.map((row) => entry('session', row, 'card'))),
        ),
        providers.length === 0 ? null : h('h2', { className: 'ts-section-title', key: 'prov-title' }, t('panel.providers.title')),
        providers.length === 0
          ? null
          : h(
              'div',
              { className: 'ts-card', key: 'prov' },
              h('div', { className: 'ts-list' }, providers.map((row) => entry('provider', row, 'card'))),
            ),
        h('h2', { className: 'ts-section-title', key: 'rank-title' }, t('panel.ranking.title')),
        h(
          'div',
          { className: 'ts-card', key: 'rank' },
          sessions.length === 0
            ? h('div', { className: 'ts-empty' }, t('panel.ranking.empty'))
            : h('div', { className: 'ts-list' }, sessions.map((row) => entry('session', row, 'card'))),
        ),
      ];

      /** Variant B: one ledger surface — metric strip, then provider and session tables. */
      const renderLedger = () => [
        h(
          'div',
          { className: 'ts-card', key: 'ledger' },
          h(
            'div',
            { className: 'ts-strip' },
            h(
              'div',
              { className: 'ts-strip-item' },
              h('div', { className: 'ts-strip-label' }, t('panel.total')),
              h('div', { className: 'ts-strip-value', title: tripleText(totals.total, localeId) }, numForms(totals.total, numMode, localeId).main),
              h('div', { className: 'ts-strip-small' }, numForms(totals.total, numMode, localeId).sub),
            ),
            metrics.map((pair) =>
              h(
                'div',
                { className: 'ts-strip-item', key: pair[0] },
                h('div', { className: 'ts-strip-label' }, t(pair[0])),
                h('div', { className: 'ts-strip-value', title: tripleText(pair[1], localeId) }, numForms(pair[1], numMode, localeId).main),
                h('div', { className: 'ts-strip-small' }, numForms(pair[1], numMode, localeId).sub),
              ),
            ),
            h(
              'div',
              { className: 'ts-strip-item ts-strip-item-cost' },
              h('div', { className: 'ts-strip-label' }, t('panel.metric.cost')),
              h('div', { className: 'ts-strip-value', title: costText }, costText),
            ),
          ),
          statusLine ? h('div', { style: { marginTop: 10 } }, statusLine) : null,
          h('div', { className: 'ts-rule' }),
          h('div', { className: 'ts-group' }, t('panel.live.title')),
          live.length === 0
            ? h('div', { className: 'ts-empty' }, t('panel.live.empty'))
            : h('div', null, live.map((row) => entry('session', row, 'ledger'))),
          providers.length === 0 ? null : h('div', { className: 'ts-group' }, t('panel.providers.title')),
          providers.length === 0 ? null : h('div', null, providers.map((row) => entry('provider', row, 'ledger'))),
          h('div', { className: 'ts-group' }, t('panel.ranking.title')),
          sessions.length === 0
            ? h('div', { className: 'ts-empty' }, t('panel.ranking.empty'))
            : h('div', null, sessions.map((row) => entry('session', row, 'ledger'))),
        ),
      ];

      /** Variant C: one huge figure, one inline metric line, then plain lists. */
      const renderMinimal = () => [
        h(
          'div',
          { className: 'ts-minimal', key: 'minimal' },
          h(
            'div',
            null,
            h('div', { className: 'ts-minimal-huge', title: tripleText(totals.total, localeId) }, numForms(totals.total, numMode, localeId).main),
            h('div', { className: 'ts-hero-small' }, numForms(totals.total, numMode, localeId).sub),
            h(
              'div',
              { className: 'ts-minimal-line' },
              t('panel.compactSummary', {
                requests: full(totals.requests, localeId),
                sessions: full(sessionCount, localeId),
                cost: costText,
              }),
            ),
            statusLine,
          ),
          h(
            'div',
            { className: 'ts-inline' },
            metrics.map((pair) =>
              h('span', { key: pair[0], title: tripleText(pair[1], localeId) }, `${t(pair[0])} `, h('b', null, numForms(pair[1], numMode, localeId).main)),
            ),
            h('span', { key: 'cost' }, `${t('panel.metric.cost')} `, h('b', null, costText)),
          ),
          h(
            'div',
            { className: 'ts-plain-group' },
            h('div', { className: 'ts-group' }, t('panel.live.title')),
            live.length === 0
              ? h('div', { className: 'ts-empty' }, t('panel.live.empty'))
              : h('div', null, live.map((row) => entry('session', row, 'plain'))),
            providers.length === 0 ? null : h('div', { className: 'ts-group', style: { marginTop: 18 } }, t('panel.providers.title')),
            providers.length === 0 ? null : h('div', null, providers.map((row) => entry('provider', row, 'plain'))),
            h('div', { className: 'ts-group', style: { marginTop: 18 } }, t('panel.ranking.title')),
            sessions.length === 0
              ? h('div', { className: 'ts-empty' }, t('panel.ranking.empty'))
              : h('div', null, sessions.map((row) => entry('session', row, 'plain'))),
          ),
        ),
      ];

      /** Variant D: left rail of numbers, right column of lists. */
      const renderSplit = () => [
        h(
          'div',
          { className: 'ts-cols', key: 'cols' },
          h(
            'div',
            { className: 'ts-rail' },
            h(
              'div',
              { className: 'ts-card' },
              h('div', { className: 'ts-hero-label' }, t('panel.total')),
              h('div', { className: 'ts-hero-value ts-hero-huge', title: tripleText(totals.total, localeId) }, numForms(totals.total, numMode, localeId).main),
              h('div', { className: 'ts-hero-small' }, numForms(totals.total, numMode, localeId).sub),
              h(
                'div',
                { className: 'ts-hero-meta' },
                t('panel.compactSummary', {
                  requests: full(totals.requests, localeId),
                  sessions: full(sessionCount, localeId),
                  cost: costText,
                }),
              ),
              statusLine ? h('div', { style: { marginTop: 8 } }, statusLine) : null,
            ),
            h(
              'div',
              { className: 'ts-card' },
              metrics.map((pair) =>
                h(
                  'div',
                  { className: 'ts-kv', key: pair[0] },
                  h('span', { className: 'ts-kv-label' }, t(pair[0])),
                  h(
                    'span',
                    { className: 'ts-kv-box' },
                    h('span', { className: 'ts-kv-value', title: tripleText(pair[1], localeId) }, numForms(pair[1], numMode, localeId).main),
                    h('span', { className: 'ts-kv-small' }, ` ${numForms(pair[1], numMode, localeId).sub}`),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'ts-kv ts-kv-cost' },
                h('span', { className: 'ts-kv-label' }, t('panel.metric.cost')),
                h('span', { className: 'ts-kv-box' }, h('span', { className: 'ts-kv-value', title: costText }, costText)),
              ),
            ),
          ),
          h(
            'div',
            { className: 'ts-rail' },
            h(
              'div',
              { className: 'ts-card' },
              h('div', { className: 'ts-group' }, t('panel.live.title')),
              live.length === 0
                ? h('div', { className: 'ts-empty' }, t('panel.live.empty'))
                : h('div', null, live.map((row) => entry('session', row, 'ledger'))),
              providers.length === 0 ? null : h('div', { className: 'ts-group', style: { marginTop: 14 } }, t('panel.providers.title')),
              providers.length === 0 ? null : h('div', null, providers.map((row) => entry('provider', row, 'ledger'))),
            ),
            h(
              'div',
              { className: 'ts-card' },
              h('div', { className: 'ts-group' }, t('panel.ranking.title')),
              h(
                'div',
                { className: 'ts-scroll' },
                sessions.length === 0
                  ? h('div', { className: 'ts-empty' }, t('panel.ranking.empty'))
                  : h('div', null, sessions.map((row) => entry('session', row, 'ledger'))),
              ),
            ),
          ),
        ),
      ];

      const body =
        variant === 'ledger'
          ? renderLedger()
          : variant === 'minimal'
            ? renderMinimal()
            : variant === 'split'
              ? renderSplit()
              : renderCard();

      return h(
        'div',
        { className: 'ts-root' },
        style,
        h('div', { className: variant === 'split' ? 'ts-inner ts-inner-wide' : 'ts-inner' }, head, toolbar, body, ...footers),
      );
    }

    /** Modal preview of the share card: pick a size and a style, then copy or save. */
    function SharePreview(props) {
      const { store, shareUi, localeFace } = props;
      const t = translator(props, localeFace);
      const localeId = useLocaleId(localeFace);
      const state = useStore(shareUi);
      const summary = useStore(store);
      const canvasRef = React.useRef(null);
      const builtRef = React.useRef(null);
      const fileRef = React.useRef(null);
      const [status, setStatus] = React.useState(null);
      const [error, setError] = React.useState(null);
      const data = summary.data;

      React.useEffect(() => {
        if (!state.open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') shareUi.close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [state.open, shareUi]);

      React.useEffect(() => {
        if (!state.open || !data || !canvasRef.current) return;
        try {
          const pricing = resolvePricing(data.pricing);
          const offscreen = buildShareCard({
            spec: state.spec,
            style: state.style,
            options: state.options,
            background: state.background,
            t,
            localeId,
            totals: data.totals,
            pricing,
            cost: costOf(data.totals, pricing),
            providers: Array.isArray(data.providers) ? data.providers : [],
            sessions: Array.isArray(data.sessions) ? data.sessions : [],
            generatedAt: data.generatedAt || Date.now(),
          });
          builtRef.current = offscreen;
          const visible = canvasRef.current;
          visible.width = offscreen.width;
          visible.height = offscreen.height;
          const ctx = visible.getContext('2d');
          if (ctx) ctx.drawImage(offscreen, 0, 0);
          setError(null);
        } catch (cause) {
          setError(cause && cause.message ? cause.message : String(cause));
        }
      }, [state.open, state.spec, state.style, state.options, state.background, data, localeId]);

      if (!state.open) return null;

      /** Copy the rendered card to the clipboard when the browser allows it. */
      const copy = async () => {
        if (!builtRef.current) return;
        const ok = await copyCanvas(builtRef.current);
        setStatus(ok ? t('share.copied') : t('share.copyFailed'));
      };
      /** Save the rendered card as a PNG file. */
      const save = () => {
        if (!builtRef.current) return;
        downloadCanvas(builtRef.current, shareFilename(state.spec, state.style));
        setStatus(t('share.saved'));
      };
      /** Load a picked image and use it as the blurred card background. */
      const onPickImage = (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const url = typeof reader.result === 'string' ? reader.result : '';
          if (!url) return;
          const image = new window.Image();
          image.onload = () => {
            setError(null);
            shareUi.setBackground({ url, image });
          };
          image.onerror = () => setError(t('share.imageFailed'));
          image.src = url;
        };
        reader.onerror = () => setError(t('share.imageFailed'));
        reader.readAsDataURL(file);
      };

      const spec = SHARE_SPECS[state.spec] || SHARE_SPECS.wide;

      return h(
        'div',
        {
          className: 'ts-modal',
          role: 'presentation',
          onClick: (event) => {
            if (event.target === event.currentTarget) shareUi.close();
          },
        },
        h(
          'div',
          { className: 'ts-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('share.title') },
          h(
            'div',
            { className: 'ts-modal-head' },
            h('span', { className: 'ts-modal-title' }, t('share.title')),
            h(
              'button',
              {
                type: 'button',
                className: 'ts-modal-close',
                'aria-label': t('share.close'),
                onClick: () => shareUi.close(),
              },
              '✕',
            ),
          ),
          h(
            'div',
            { className: 'ts-modal-controls' },
            h(
              'div',
              { className: 'ts-toolgroup' },
              h('span', { className: 'ts-toolgroup-label' }, t('share.spec')),
              h(
                'div',
                { className: 'ts-seg', role: 'group', 'aria-label': t('share.spec') },
                Object.keys(SHARE_SPECS).map((id) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: id,
                      className: 'ts-seg-btn',
                      'data-selected': String(id === state.spec),
                      title: `${SHARE_SPECS[id].width}×${SHARE_SPECS[id].height}`,
                      onClick: () => shareUi.setSpec(id),
                    },
                    SHARE_SPECS[id].label,
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ts-toolgroup' },
              h('span', { className: 'ts-toolgroup-label' }, t('share.style')),
              h(
                'div',
                { className: 'ts-seg', role: 'group', 'aria-label': t('share.style') },
                Object.keys(SHARE_STYLES).map((id) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: id,
                      className: 'ts-seg-btn',
                      'data-selected': String(id === state.style),
                      onClick: () => shareUi.setStyle(id),
                    },
                    t(`share.style.${id}`),
                  ),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'ts-modal-controls' },
            h(
              'div',
              { className: 'ts-toolgroup' },
              h('span', { className: 'ts-toolgroup-label' }, t('share.blocks')),
              h(
                'div',
                { className: 'ts-seg', role: 'group', 'aria-label': t('share.blocks') },
                SHARE_BLOCKS.map((id) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: id,
                      className: 'ts-seg-btn',
                      'data-selected': String(
                        Array.isArray(state.options.blocks) && state.options.blocks.indexOf(id) >= 0,
                      ),
                      onClick: () => shareUi.toggleBlock(id),
                    },
                    t(`share.right.${id}`),
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ts-toolgroup' },
              h('span', { className: 'ts-toolgroup-label' }, t('share.options')),
              h(
                'div',
                { className: 'ts-seg', role: 'group', 'aria-label': t('share.options') },
                SHARE_TOGGLES.map((id) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: id,
                      className: 'ts-seg-btn',
                      'data-selected': String(state.options[id] !== false),
                      onClick: () => shareUi.toggleOption(id),
                    },
                    t(`share.toggle.${id}`),
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ts-toolgroup' },
              h('span', { className: 'ts-toolgroup-label' }, t('share.background')),
              h(
                'div',
                { className: 'ts-seg' },
                h(
                  'button',
                  { type: 'button', className: 'ts-seg-btn', onClick: () => fileRef.current && fileRef.current.click() },
                  t('share.pickImage'),
                ),
                state.background
                  ? h(
                      'button',
                      { type: 'button', className: 'ts-seg-btn', onClick: () => shareUi.setBackground(null) },
                      t('share.clearImage'),
                    )
                  : null,
              ),
              h('input', {
                ref: fileRef,
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                onChange: onPickImage,
              }),
            ),
          ),
          h(
            'div',
            { className: 'ts-modal-stage' },
            h('canvas', { ref: canvasRef, className: 'ts-modal-canvas' }),
            error ? h('div', { className: 'ts-notice' }, t('share.failed', { message: error })) : null,
          ),
          h(
            'div',
            { className: 'ts-modal-foot' },
            h('span', { className: 'ts-foot' }, `${spec.width}×${spec.height}`),
            h('span', { className: 'ts-spacer' }),
            status ? h('span', { className: 'ts-flash' }, status) : null,
            h('button', { type: 'button', className: 'ts-btn ts-btn-accent', onClick: copy }, t('share.copy')),
            h('button', { type: 'button', className: 'ts-btn ts-btn-primary', onClick: save }, t('share.save')),
          ),
        ),
      );
    }

    function SessionTokenBadge(props) {
      const { store, localeFace, openPanel } = props;
      const t = translator(props, localeFace);
      const localeId = useLocaleId(localeFace);
      const snapshot = useStore(store);
      const data = snapshot.data;
      const sessionId = props.sessionId !== undefined && props.sessionId !== null ? props.sessionId : props.injectedSessionId;
      if (!data || sessionId === undefined || sessionId === null) return null;
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const row = sessions.find((item) => String(item.id) === String(sessionId));
      if (!row || !(row.total > 0)) return null;
      const tooltip = t('badge.tooltip', {
        total: tripleText(row.total, localeId),
        input: full(row.input, localeId),
        output: full(row.output, localeId),
      });
      return h(
        React.Fragment,
        null,
        h('style', { key: 'token-stats-style' }, CSS),
        h(
          'button',
          { type: 'button', className: 'ts-badge', title: tooltip, 'aria-label': tooltip, onClick: () => openPanel() },
          h('span', { className: 'ts-badge-mark' }),
          h('span', null, compactZh(row.total)),
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        const store = createStore();
        const shareUi = createShareUi();
        const localeFace = {
          current: () => {
            const snapshot = ctx.locale.getLocale();
            return snapshot && typeof snapshot.active === 'string' ? snapshot.active : 'en';
          },
          subscribe: (listener) => ctx.on('locale/change', listener),
        };
        const openSession = (id) => {
          const workspace = ctx.get('uiWorkspace');
          if (!workspace) return;
          try {
            workspace.openSession(id);
          } catch (error) {
            console.error(error);
          }
        };
        const openPanel = () => {
          try {
            ctx.layout.selectPanel(PANEL_ID);
          } catch (error) {
            console.error(error);
          }
        };
        const label = () => dictOf(localeFace.current())['panel.title'];

        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'token-stats: dictionaries');
        ctx.effect(() => () => store.dispose(), 'token-stats: summary store');

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 20, label }, TokenStatsIcon),
        );
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: PANEL_ID, locale: NS, inject: () => ({ store, shareUi, localeFace, openSession }) },
            TokenStatsPanel,
          ),
        );
        ctx.slots.inject('conversation.session.header.utilities', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.utilities',
              id: 'token-stats-badge',
              order: 4,
              locale: NS,
              inject: (sessionId) => ({ store, localeFace, openPanel, injectedSessionId: sessionId }),
            },
            SessionTokenBadge,
          ),
        );
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'token-stats-share',
              order: 60,
              locale: NS,
              inject: () => ({ store, shareUi, localeFace }),
            },
            SharePreview,
          ),
        );
      },
    };
  },
});
