# TASKS — 任务板

> **格式约定（便于 Agent 机读）：** 每条任务一行 `- [ ] **任务ID** 标题`，其下缩进一行 `验收：...`。
> 任务 ID 一经分配**永不复用、永不重排**；完成后把 `[ ]` 改成 `[x]` 并保留原行。
> 当前正在做的任务与下一步，见 `docs/STATE.md` 的 `active_task` / `next_tasks`。
> 状态标记：`[ ]` 未开始 / `[~]` 进行中 / `[x]` 已完成 / `[!]` 阻塞（阻塞原因写进 STATE.md）。

---

## Phase 0 — 止损与地基（1–2 周）

目标：消除高危安全项、让工程基线可信、CI 能跑。**这是权威清单，逐条完成。**

- [~] **P0-01** 轮换 DashScope Key 与 Supabase 凭据；`.env` 移出 git 跟踪并补 `.env.example`
  - 进展（2026-08-12）：仓库侧已彻底止血 —— `git filter-repo` 重写全历史，`.env` 全部历史版本删除、明文密钥替换为 `***REMOVED***`，已 force push，全历史敏感串扫描命中 0。**控制台密钥轮换尚未执行，本任务仍未完成。**
  - 验收：DashScope Key、Supabase anon key / service role key / 数据库密码全部在控制台重置为新值；旧值全部失效；`git ls-files | grep .env` 只剩 `.env.example`；`.env.example` 只含键名与注释、无任何真实值；本机 `.env` 与 Vercel 环境变量均已更新为新值；`npm run dev` 与线上部署功能正常。
- [ ] **P0-02** 收紧 RLS：`profiles` 的 select 策略从 `using (true)` 改为 `auth.uid() = id`
  - 验收：新 migration 文件包含 drop 旧策略 + create 新策略；用 A 账号登录查询 `profiles` 只能拿到自己那一行（B 账号数据返回 0 行）；策略变更已写入 `supabase/migrations/`，未只在控制台手改。
- [ ] **P0-03** Storage：`clothing-images` 桶转私有 + 签名 URL；insert 策略限定 `auth.uid()` 目录前缀
  - 验收：桶 `public = false`；直接访问原始对象 URL 返回 403；前端通过 `createSignedUrl` 正常显示图片；上传路径强制为 `{auth.uid()}/...`，尝试写入他人 uid 前缀被策略拒绝；策略以 migration 提交。
- [ ] **P0-04** 给 AI 代理（`api/dashscope.js`）加 JWT 校验 + 单用户日配额 + 结构化日志
  - 验收：无 `Authorization` 头或 JWT 无效时返回 401；伪造/过期 token 被拒；同一用户单日超过配额上限返回 429；每次调用输出结构化日志（含 user_id、耗时、状态码、是否命中配额，**不得记录密钥或图片原文**）；密钥从 `DASHSCOPE_API_KEY` 读取（非 `VITE_` 前缀）。
- [ ] **P0-05** 重建 migration 基线（现有 `supabase/migrations/20240107_add_brands_and_ai.sql` 首行被误粘贴的 `VITE_DASHSCOPE_API_KEY=sk-...` 污染，无法执行；污染首行已于 2026-08-12 随 git 历史清理从工作区与全历史移除，但基线重建仍未做；因不继承线上数据，直接从干净 schema 重建）
  - 验收：在全新空 Supabase 项目上按顺序执行 `supabase/migrations/` 下全部文件**零报错**；污染文件已删除或重写，仓库内不存在被环境变量污染的 SQL；migration 内含所有表、索引与 RLS 策略；`supabase db reset` 可复现完整 schema。
- [ ] **P0-06** 搭目录骨架（UI / 数据层 / 领域层三分），把 `src/lib/colorMatching.ts` 迁入领域层
  - 验收：存在 `src/data/` 与 `src/domain/`；`colorMatching.ts` 位于 `src/domain/`，且不 import React、不 import supabase；全仓库 `grep -rn "supabase.from(" src/pages src/components` 结果为空（数据访问全部收敛到 `src/data`）；`npm run build` 通过。
- [ ] **P0-07** 打开 `tsconfig` 的 `strict`，用 `supabase gen types` 生成数据库类型
  - 验收：`tsconfig` 中 `"strict": true`；`npm run check` 零错误；生成的类型文件（如 `src/types/database.ts`）已提交，数据层函数使用该类型而非 `any`；`npm run lint` 中 `no-explicit-any` 错误数为 0。
- [ ] **P0-08** 配色引擎补单元测试（覆盖全部策略分支）
  - 验收：已引入测试框架并提供 `npm run test`；`src/domain` 配色规则的**每个策略分支**都有对应用例（含边界与无解情况）；`npm run test` 全绿；领域层语句覆盖率 ≥ 80%。
- [ ] **P0-09** 清理死代码与 Trae 残留
  - 验收：删除无人引用的 `src/hooks/useTheme.ts`；删除占位组件 `src/pages/Home.tsx`（若仅为占位）与 `src/components/Empty.tsx`；移除 `vite-plugin-trae-solo-badge` 角标注入（`vite.config.ts` 与 `package.json` 依赖同时清除）；`package.json` 的 `name` 从 `trae-project` 改为 `outer`；移除 `DevTools` 里的前端邮箱白名单（权限判断不得放在前端）；`grep -rin "trae" .`（排除 `node_modules`、`.git`）无残留；`npm run build` 通过。
- [ ] **P0-10** lint + build + test 接入 GitHub Actions CI 作为门禁
  - 验收：存在 `.github/workflows/ci.yml`，在 push 与 pull_request 时运行 `npm ci && npm run lint && npm run build && npm run test`；main 分支最新一次 CI 为绿色；CI 失败时 PR 显示红叉；工作流不依赖任何真实密钥。

**Phase 0 门禁：** 无高危项残留（01–05 全部完成）、CI 能跑且为绿色。未通过不得进入 Phase 1。

---

## Phase 1 — 可信闭环（5–7 周）

目标：让「录入 → 每日决策 → 打卡」这条核心循环真正跑通且值得信任。

- [ ] **P1-01** 批量录入 + AI 自动打标
  - 验收：支持一次选择多张图片连续录入；AI 自动填充分类/季节/主色等字段，用户仅需确认或微调；**实测录入 20 件耗时 < 5 分钟**；AI 失败时可降级为纯手动录入且不丢已填数据。
- [ ] **P1-02** 每日 3 套带理由的推荐（接天气 API 做温度硬约束）
  - 验收：首页每日给出 3 套完整搭配，每套附一句人类可读理由（如「今天 12℃ 偏凉，选了厚外套 + 深色下装」）；接入天气 API，温度不匹配的单品**被硬性排除**（不是降权）；连续 7 天记录采纳情况，**采纳率 ≥ 40%**；无衣可推时给出明确提示而非空白页。
- [ ] **P1-03** 穿着打卡与搭配历史
  - 验收：可对当日实际穿着一键打卡（支持采纳推荐或自选）；历史页按日期倒序展示已穿搭配；**上线后 7 日打卡率 ≥ 50%**；打卡数据写入穿着日志表并可用于后续统计。
- [ ] **P1-04** 数据模型扩展
  - 验收：衣物表补充「名称、厚薄、版型、状态、穿着次数」字段；搭配表落「评分、策略、理由」；新增穿着日志表；`brands` 表**按用户隔离**（含 `user_id` 且 RLS 限定本人可见）；全部变更以 migration 提交，并在新空项目可零报错重放。
- [ ] **P1-05** 界面文案改中文
  - 验收：所有页面、按钮、表单标签、空状态、错误提示均为简体中文；无残留英文占位文案；术语在全站保持一致（如统一用「搭配」不混用「穿搭/outfit」）。

**Phase 1 门禁：** 录 20 件 < 5 分钟、推荐采纳率 ≥ 40%、7 日打卡率 ≥ 50%。三项全达标才可进入 Phase 2。

---

## Phase 2 及以后

Phase 2（越用越准）、Phase 3（诊断与灵感）、Phase 4（规模化）的范围与门禁见 `docs/ROADMAP.md`。
**在 Phase 1 门禁通过前，不要在此处新增 P2 任务，也不要提前实现 P2 功能。**
