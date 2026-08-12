# CONVENTIONS — 开发规范

> 规范的目的只有一个：**让下一台机器上的 Agent（和三个月后的你）能安全地接着干。**
> 以下条目为硬性要求，与 `AGENTS.md` 的硬性规则同级。

## 一、分支策略

- 个人项目采用**单主干**模式：`main` 是唯一长期分支，**必须始终保持可运行**（`npm run build` 通过）。
- 日常小改动可直接在 `main` 上提交（含 Agent 交接提交）。
- 较大改动（跨多文件重构、可能中途留下不可运行状态）使用**短分支**：
  - `feat/*` 新功能，如 `feat/daily-recommendation`
  - `fix/*` 修 Bug，如 `fix/signed-url-expiry`
  - `chore/*` 工程杂务，如 `chore/ci-workflow`
- 短分支**完成即合并回 `main` 并删除**，不长期存活（避免跨机器交接时出现多条并行历史）。
- 跨机器工作时：**开工先 `git pull --rebase`，收工必须 push**。不允许在本地积压未推送的提交。

## 二、提交规范

- 使用 **Conventional Commits**：`<type>: <简短描述>`，描述用简体中文。
  - `feat:` 新功能 ｜ `fix:` 修复缺陷 ｜ `chore:` 构建/依赖/配置杂务
  - `docs:` 文档 ｜ `refactor:` 重构（不改行为） ｜ `test:` 测试
- **一次提交只做一件事。** 不要把重构、修 Bug、格式化混在一个提交里。
- 提交信息中带上任务 ID 便于追溯，例如：`feat: 每日推荐接入天气温度硬约束 (P1-02)`。
- **交接提交统一使用 `chore(handoff): ...`**，便于用 `git log --grep "chore(handoff)"` 快速检索历史交接点。
  该前缀由 `scripts/handoff.sh` 自动添加，不要手写。
- 禁止 `git commit -m "update"` 之类无信息量的提交信息；禁止 `--force` 推送 `main`。

## 三、代码规范

- **TypeScript `strict` 必须开启**，不得为了过编译而关闭。
- **禁止 `any`**。确实无法确定类型时用 `unknown`，再通过类型守卫收窄。
  不得用 `@ts-ignore` / `eslint-disable` 掩盖类型问题。
- **组件不直连数据库**：`src/pages`、`src/components` 中不得出现 `supabase.from()`；
  所有数据访问收敛到 `src/data`，对外暴露语义化函数。
- **领域逻辑必须是纯函数且有单测**：`src/domain` 下不依赖 React、网络与环境变量，
  输入确定则输出确定；每个策略分支都要有测试用例。
- **UI 文案统一简体中文**，术语全站一致（如统一「搭配」，不混用「穿搭 / outfit」）。
- 命名：组件 `PascalCase`，函数与变量 `camelCase`，文件与组件同名；避免无意义缩写。
- 删除代码优于注释掉代码；不留 `console.log` 调试残留（服务端结构化日志除外）。

## 四、数据库规范

- **所有 schema 变更必须以 migration 文件提交**，放在 `supabase/migrations/`，
  文件名使用**时间戳前缀**：`YYYYMMDDHHMM_简短描述.sql`（如 `202608121430_tighten_profiles_rls.sql`）。
- **RLS 策略与表结构一起进 migration**，并在 SQL 注释中**说明该表的可见性**，例如：
  ```sql
  -- 可见性：仅本人可读写（auth.uid() = user_id）
  ```
- 每张含用户数据的表**必须启用 RLS 并显式写出策略**；不允许出现 `using (true)` 这类放行策略。
- **不允许在 Supabase 控制台手改后不回写仓库。** 控制台只用于查看与临时验证；
  任何生效的变更都必须有对应 migration 文件，保证在新空项目上可零报错重放。
- migration 只追加、不修改已执行过的文件；写错了就再加一个修正 migration。

## 五、密钥规范

- **`.env` 永不提交**（已在 `.gitignore` 中忽略）。仓库内任何文件都不得出现真实密钥值。
- **服务端密钥不得使用 `VITE_` 前缀**——该前缀会被 Vite 打进前端产物，等同公开。
  服务端密钥示例：`DASHSCOPE_API_KEY`。
- 只有确认可公开的值才允许用 `VITE_` 前缀（如 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，
  它们依赖 RLS 保护，因此 RLS 必须严格）。
- **新增环境变量必须同步写进 `.env.example`**，**只写键名与说明注释，不写值**；
  同时更新 Vercel 环境变量与 `docs/STATE.md` 的「环境准备」小节。
- 一旦怀疑密钥泄露：**先轮换，再讨论**。

## 六、质量门禁

- **`npm run lint` 与 `npm run build` 必须通过才可提交。** `scripts/handoff.sh` 会自动执行这两项。
- 确实需要在未通过时交接（例如中途换机器），使用 `./scripts/handoff.sh --force`，
  并在 `docs/STATE.md` 的「已知问题与阻塞」中**写清失败原因**，不得静默跳过。
- **领域层（`src/domain`）改动必须补/改测试**，`npm run test` 需全绿。
- CI（GitHub Actions）为最终门禁：`main` 上的 CI 必须保持绿色。
- 不允许通过删测试、放宽 lint 规则的方式让门禁变绿。

## 七、图片规范

- **上传前在前端压缩**：长边约 **1600px**，转 **WebP** 格式后再上传，控制存储与流量成本。
- 存储使用**私有桶 + 签名 URL**，不使用公开桶直链；签名 URL 在使用时按需生成并设置合理有效期。
- 上传路径强制以 `{auth.uid()}/` 为前缀，由 Storage 策略保证用户之间互不可写。
- 保留原始比例，不做破坏性裁剪；缩略图按需生成，不重复上传多份原图。
