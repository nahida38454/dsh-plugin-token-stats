# dsh-plugin-token-stats

DSH（DeepSeek Harness）的 Token 用量统计插件。把每个会话日志里记录的**真实 token 消耗**汇总成一个侧边栏面板，并在对话头部显示当前会话的实时用量；另外可以一键生成分享图片。

同时支持把 **Claude Code**（及其 `cc-haha` 桌面版）的用量并进同一份统计。

![侧边栏面板](docs/screenshots/panel.png)

![对话头部徽章](docs/screenshots/badge.png)

> 截图占位：把面板与徽章的截图放到 `docs/screenshots/` 下，文件名分别为 `panel.png`、`badge.png`。
> 未提供图片时上面两行会显示为破图，提交前请补上或删掉这两行。

## 功能

- **侧边栏面板**：全站累计 tokens / 请求数 / 会话数，输入、输出、缓存读、缓存写、推理的分项，按 provider 与模型的分布，以及按会话的用量排行。
- **会话头部徽章**：当前对话的 token 总量，点开即跳到面板。
- **四种布局**：卡片（card）、账本（ledger）、极简（minimal）、分栏（split）。
- **三种数字写法**：中文（亿/万）、英文（B/M/K）、以及两者并列。
- **分享图**：内置 16:9、1:1、3:4、9:16 四种尺寸，四套配色，可勾选显示哪些区块，导出 PNG。
- **成本估算**：按可配置的单价（默认 DeepSeek 人民币价）折算金额，仅供参考。
- **不重复计费**：fork 出来的会话带父会话的历史前缀，只统计它自己新增的事件。

## 安装

需要 Node.js 22.19+ 或 24+（用到内置的 `node:sqlite` 读取 Claude Code 索引时会尝试加载，缺少该模块则自动跳过）。

```bash
dsh plugin --profile <你的profile名> add github:nahida38454/dsh-plugin-token-stats
```

安装后确认配置能被组装出来：

```bash
dsh --profile <你的profile名> --dump-config
```

### 从 Git 安装的安全提示

DSH 从 GitHub 安装时拉的是**源码**，不会执行 `build`。本包是纯 JS、无构建步骤，所以不需要 `prepare` 脚本、也不需要在 `pnpm-workspace.yaml` 里放行 `allowBuilds`。

若要锁死版本，把安装地址换成带 commit 的形式：

```bash
dsh plugin --profile <你的profile名> add github:nahida38454/dsh-plugin-token-stats#<40位commit>
```

### 通过插件市场安装

本仓库同时充当一个 DSH 插件市场的索引源。在 DSH 的「插件市场」页打开「管理索引源…」，填入：

https://nahida38454.github.io/dsh-plugin-token-stats/index.json

之后在「发现」页即可搜到本插件并安装。索引文件是 `docs/index.json`，由 GitHub Pages 从 `/docs` 目录发布。

> 索引里每个版本都写死了 40 位 commit SHA，所以**发新版本时要同时更新 `docs/index.json`**：追加一条 `versions` 记录，填新的 `version`、`publishTimestamp`（Unix 秒）与 commit。CI 会校验索引里的版本号与 `package.json` 一致。

## 兼容性

| DSH | 状态 |
|---|---|
| 0.2.x | 已验证（开发环境） |

未声明 `engines.dsh`，因此 DSH 会按 `@deepseek-ai/dsh*` 的 peer 依赖范围判断兼容性。

## 配置

插件的 `cordis.patch.yml` 里已经带了一份默认配置。要改的话，在**profile 的 patch 层**（`$DSH_HOME/profiles/<name>/cordis.patch.yml`）按行覆盖——注意覆盖会**替换整份 `config`**，所以每个字段都要重写：

```yaml
- id: token-stats
  name: dsh-plugin-token-stats
  config:
    currency: '¥'
    cacheMissPerMillion: 2      # 缓存未命中的输入，每百万 token
    cacheHitPerMillion: 0.2     # 缓存命中的输入，每百万 token
    outputPerMillion: 3         # 输出，每百万 token
    cacheWritePerMillion: 0     # 缓存写入，每百万 token
    claudeCodeRoots: []
```

| 字段 | 说明 |
|---|---|
| `currency` | 金额前缀符号，仅影响显示 |
| `cacheMissPerMillion` / `cacheHitPerMillion` / `outputPerMillion` / `cacheWritePerMillion` | 每百万 token 的单价，用于估算成本 |
| `claudeCodeRoots` | Claude Code（cc-haha）数据根的候选列表，按顺序探测。留空时用内置回退 `~/.claude/cc-haha` |

### Claude Code 数据源

Claude Code 会把自己的 transcript 索引进一个 SQLite 库，其中 `activity_daily_models` 表正好存着按天、按模型的输入/输出/缓存 token 数，读它比重新解析 `.jsonl` 便宜得多。

**注意**：有些桌面版把索引写在**工作区旁边**（`<workspace>/cc-haha/db`）而不是用户目录下。这种情况下自动探测找不到，需要在 `claudeCodeRoots` 里显式写上那个路径。

该数据源是**可选**的：机器上没有 Claude Code、或 Node 构建缺 `node:sqlite`，插件照常显示 DSH 会话，只是不含 Claude Code 部分。

已知限制：

- Claude Code 的索引只到**日期粒度**，因此它计入的「会话数」实为天数。
- 索引里没有请求计数字段，Claude Code 那部分「请求数」为 0。
- 索引里的 `cost_usd` 通常为 0，金额是按上面的单价重新估算的。

## 数据来源

- **DSH 会话**：活会话从内存日志折叠，历史会话通过 `sessionQuery.readSession()` 读一次并按持久化版本号缓存，标题用 `readTitleSnapshots()` 批量带 TTL 读取。
- **Claude Code**：见上一节。
- 统计以每次请求自报的 `total` 为准，缺失时回退到 `input + output`。

## 许可证

[MIT](./LICENSE)
