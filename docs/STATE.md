---
updated_at: 2026-08-12T12:10:00+08:00
updated_by: mintgao@H6W7FQ66R6
machine: H6W7FQ66R6 (macOS, 本机主力开发机)
current_phase: P0
phase_status: in_progress
active_task: P0-01
next_tasks: [P0-02, P0-05, P0-09]
blocked_by: []
build_status: build_pass_lint_fail
branch: main
last_commit: 64341c0
---

# 当前交接状态（STATE）

> 本文件是跨机器交接的**单一事实来源**。每次会话结束前必须更新，否则下一台机器会拿到过期状态。
> front-matter 供机器读取，正文供人和 Agent 理解上下文。

## 一、当前状态一句话

项目已完成产品理解与 Roadmap，刚刚落地开发规范与跨机器 Agent 交接机制；**Phase 0（止损与地基）正式开始，第一步是轮换已泄露的密钥（P0-01）**，业务代码尚未开始重构。

## 二、正在做什么

**当前任务：P0-01 — 轮换 DashScope Key 与 Supabase 凭据，`.env` 移出 git 跟踪并补 `.env.example`。**

已改动 / 新增文件（本次会话）：

- `AGENTS.md`、`CLAUDE.md` —— Agent 入口
- `docs/STATE.md`、`docs/TASKS.md`、`docs/DECISIONS.md`、`docs/ROADMAP.md`、`docs/CONVENTIONS.md`、`docs/SESSION_LOG.md`
- `scripts/pickup.sh`、`scripts/handoff.sh`（已 `chmod +x`）
- `.gitignore`（新增 `.env` / `.env.*` 忽略规则）、`.env.example`（新建，仅键名）
- `README.md`（顶部新增「AI Agent 协作」小节）
- `.env` 已执行 `git rm --cached`，**本地文件保留**，从此不再进入版本控制

**P0-01 未完成的部分（下一位 Agent 必须先做）：**

- ⚠️ **密钥尚未轮换。** 仓库侧已止血（不再跟踪 `.env`），但**旧密钥仍在 git 历史中可查**，
  且仓库为公开仓库。DashScope Key 与 Supabase 凭据（anon key、service role key、数据库密码）
  **必须由用户本人立刻到控制台轮换**，Agent 无法代做。轮换后更新本机 `.env` 与 Vercel 环境变量。
- 服务端 AI 密钥需从 `VITE_DASHSCOPE_API_KEY` 改名为 `DASHSCOPE_API_KEY`，
  并同步修改 `api/dashscope.js` 的读取方式与 Vercel 环境变量配置。

## 三、下一步该做什么（具体到任务 ID）

1. **P0-01（收尾）**：用户轮换全部密钥 → 更新本机 `.env` 与 Vercel 环境变量 → 改名 `DASHSCOPE_API_KEY` 并调整 `api/dashscope.js`。
2. **P0-02**：收紧 `profiles` 表 RLS，`select` 策略从 `using (true)` 改为 `auth.uid() = id`（以 migration 提交）。
3. **P0-05**：重建 migration 基线。现有 `supabase/migrations/20240107_add_brands_and_ai.sql`
   **首行被误粘贴的 `VITE_DASHSCOPE_API_KEY=...` 污染，SQL 无法执行**；因不继承线上数据，直接从干净 schema 重建。
4. **P0-09**：清理死代码与 Trae 残留（见 TASKS.md，其中 `package.json` 的 `name` 仍是 `trae-project`）。

顺序建议：P0-01 → P0-02 / P0-03 → P0-05 → P0-06 / P0-07 → P0-08 → P0-09 → P0-10。
安全类（01–04）优先，因为泄露风险随时间放大。

## 四、已知问题与阻塞

| 问题 | 影响 | 状态 |
| --- | --- | --- |
| 旧密钥已进入公开仓库历史 | 高危，可被扫描到 | 待用户轮换（Agent 不可代做） |
| `npm run lint` 未通过：25 errors / 3 warnings | 阻塞质量门禁与 CI（P0-10） | 待修（主要是 `no-explicit-any`、`no-unused-vars`、`prefer-const`） |
| `20240107_add_brands_and_ai.sql` 首行污染 | migration 无法执行，schema 与线上脱节 | P0-05 处理 |
| `tsconfig` 未开 `strict` | 类型安全不足 | P0-07 处理 |
| 尚无测试框架（无 `npm run test`） | 领域层无法单测 | P0-08 引入 |
| `git config user.name` 全局仍是占位值「你的名字」 | 提交作者信息不正确 | 已在本仓库设置局部身份，建议用户设置全局 |

**当前无硬阻塞（`blocked_by: []`）**，P0-02 起的技术任务均可直接开工；
但 P0-01 的密钥轮换需要用户操作，Agent 只能准备好代码与配置。

## 五、环境准备

```bash
# 1. 安装依赖
npm install

# 2. 准备环境变量：复制模板后填入真实值（真实值绝不提交）
cp .env.example .env

# 3. 起本地服务
npm run dev        # http://localhost:5173
```

需要的环境变量（详见 `.env.example`）：

| 变量 | 用途 | 暴露面 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase 项目地址 | 前端（公开，安全） |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥，依赖 RLS 保护 | 前端（公开，安全） |
| `DASHSCOPE_API_KEY` | DashScope AI 密钥 | **仅服务端，禁止 `VITE_` 前缀** |

当前构建状态（本次实测）：`npm run build` ✅ 通过；`npm run lint` ❌ 25 errors / 3 warnings。

## 六、给下一位 Agent 的提醒

- **先读 `docs/TASKS.md` 拿验收标准再动手**，不要凭感觉扩大范围；一次会话专注 1–2 个任务 ID。
- 本次只加了文档、脚本与配置，**没有动任何业务代码**（`src/`、`api/`、`supabase/` 保持原样）。
  真正的重构从 P0 各任务开始。
- 修 lint 时**不要用 `eslint-disable` 或 `@ts-ignore` 糊过去**，要真正补类型；这批 `any` 正是 P0-07 要解决的债。
- 新建目录 `src/data`、`src/domain` 时记得同步把 `src/lib/colorMatching.ts` 迁到 `src/domain`（P0-06），
  迁移后**必须补单测**（P0-08）。
- 收工别忘了：更新本文件 → 追加 `docs/SESSION_LOG.md` → `./scripts/handoff.sh -m "摘要"`。
