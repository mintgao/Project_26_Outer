# AGENTS.md — Outer 项目 Agent 入口

> **任何 AI Agent 在本仓库开工前，第一件事就是读完本文件。**
> 本文件是唯一入口，其余文档都从这里指路。

**项目定位（一句话）：Outer 是「每日出门决策助手」——每天早上告诉你今天穿什么，并给出理由。**
衣橱数据是燃料，不是目的。**它不是「衣橱管理工具」**，不以「把衣服录全、管得整齐」为成功标准，
而以「用户是否信任并采纳今天的推荐」为成功标准。任何功能取舍都回到这条定位判断。

---

## ⏱ 开工三步（Pick up）

```bash
# 一条命令搞定前三步：
./scripts/pickup.sh
```

手动等价操作：

1. `git pull --rebase` —— **必须先拉取**，否则你看到的状态是过期的。
2. 读 `docs/STATE.md` —— 交接的单一事实来源（当前 Phase、正在做什么、阻塞是什么）。
3. 读 `docs/TASKS.md` 中 `active` / `next` 的任务 —— 拿到具体任务 ID 与验收标准，然后再动手。

## 🏁 收工三步（Hand off）

1. 更新 `docs/STATE.md`（front-matter 全字段 + 正文各节），并在 `docs/SESSION_LOG.md` **顶部**追加一条本次记录。
2. 跑 `./scripts/handoff.sh -m "本次做了什么"` —— 内含 lint / build 校验与 `STATE.md` 时间戳校验。
3. 脚本会自动 `git add -A` → `chore(handoff): ...` 提交 → `git push`。确认推送成功再离开。

```bash
./scripts/handoff.sh -m "完成 P0-02 RLS 收紧"
./scripts/handoff.sh --force -m "中途交接，lint 未过（见 STATE.md 阻塞项）"
```

---

## 🚨 硬性规则（违反即视为本次会话失败）

1. **任何一次会话结束前，必须更新 `docs/STATE.md` 并推送到 `main`。**
   否则下一台机器上的 Agent 会拿到过期状态，做重复或冲突的工作。这是本机制的地基。
2. **不得把任何密钥、Token、连接串写进仓库。** `.env` 永不提交；新增变量只把**键名与说明**写进 `.env.example`。
   服务端密钥**禁止**使用 `VITE_` 前缀（该前缀会被打进前端产物）。
3. **不得跳过 Phase 门禁。** 上一阶段的验收指标没达成，不许开始下一阶段的功能（见 `docs/ROADMAP.md`）。
4. **不得删除或重写他人未完成的工作**；`main` 必须始终保持可运行（可 `npm run build` 成功）。
5. 数据库改动**只能**通过 `supabase/migrations/` 下的 migration 文件进行，禁止只在 Supabase 控制台手改而不回写仓库。

---

## 🧱 技术栈与既定决策

| 项目 | 选择 |
| --- | --- |
| 前端 | React 18 + Vite + TypeScript + TailwindCSS |
| 路由 | react-router-dom |
| 后端 / BaaS | Supabase（Auth + Postgres + Storage） |
| 部署 | Vercel（含 `api/` 下的 Serverless Function） |
| AI | DashScope（**仅服务端调用**，自动打标 + 主色提取） |

**Phase 1–3 继续使用 Supabase，Phase 4 再评估是否自建后端。**
所有已定技术与产品决策及其理由，见 **`docs/DECISIONS.md`**（ADR，仅追加不修改）。
**不要推翻已记录的决策**；如确有必要，追加一条新 ADR 说明取代关系，不要偷偷改代码。

---

## 🛠 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm install` | 安装依赖（首次或 `package.json` 变更后） |
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 生产构建（`tsc -b && vite build`），**提交前必须通过** |
| `npm run lint` | ESLint 检查，**提交前必须通过** |
| `npm run check` | 仅做 TypeScript 类型检查（`tsc -b --noEmit`） |
| `npm run preview` | 预览构建产物 |
| `./scripts/pickup.sh` | 开工：拉取 + 装依赖 + 打印交接状态 |
| `./scripts/handoff.sh` | 收工：校验 + 提交 + 推送 |

---

## 📁 目录约定与「三层分离」原则

```
src/
├─ pages/        UI 层：页面级组件（路由入口）
├─ components/   UI 层：可复用展示组件
├─ data/         数据层：统一封装所有 Supabase 访问
├─ domain/       领域规则层：纯函数业务规则（配色、推荐、评分）
├─ context/      跨页共享的 React Context（如 Auth）
├─ hooks/        通用 React Hooks
└─ lib/          纯技术性工具（客户端初始化、格式化等）
```

**三层分离的铁律：**

- **UI 层（`src/pages`、`src/components`）**：只负责渲染与交互，从数据层取数据、调领域层算规则。
  **组件内不得出现 `supabase.from()`。**
- **数据层（`src/data`）**：唯一允许直接访问 Supabase 的地方。对外暴露语义化函数
  （如 `listClothingItems()`、`createOutfit()`），内部处理查询、错误与类型转换。
- **领域规则层（`src/domain`）**：**纯函数**，不依赖 React、不依赖网络、不读环境变量。
  输入数据 → 输出结论（如配色是否协调、推荐得分、温度是否匹配）。**必须有单元测试。**

判断标准：领域层的函数应当能在 Node 里直接调用并断言结果，不需要任何 mock。

---

## ⛔ 不要做什么

- **不要在组件里直接写数据库查询**（`supabase.from(...)`）。一律走 `src/data`。
- **不要引入新的全局状态库**，直到确有需要。现有 `zustand` 与 Context 足够；先问「这个状态真的跨页面吗」。
- **不要把 AI 调用放到前端。** 所有模型调用走 `api/` 下的服务端函数，密钥只存在于服务端环境变量。
- **不要在 M2（Phase 1）验收通过前做 Phase 2 的功能**（反馈学习、体型入模、PWA 等）。
  个性化只会放大一个本来就不被信任的推荐。
- 不要用 `any`（必要时用 `unknown` 再收窄），不要关掉 `tsconfig` 的 `strict`。
- 不要新增英文界面文案；**UI 文案统一简体中文**。
- 不要为了让 lint / build 通过而删测试、加 `eslint-disable` 或 `@ts-ignore`；要么修好，要么在 `STATE.md` 里写清阻塞。

---

## 📚 文档地图

| 文件 | 作用 |
| --- | --- |
| `AGENTS.md` | **本文件**，Agent 唯一入口 |
| `docs/STATE.md` | 交接状态（单一事实来源，机读优先） |
| `docs/TASKS.md` | 任务板：稳定任务 ID + 验收标准 |
| `docs/DECISIONS.md` | 决策记录 ADR，仅追加 |
| `docs/ROADMAP.md` | 五阶段路线图与阶段门禁 |
| `docs/CONVENTIONS.md` | 开发规范（分支/提交/代码/数据库/密钥/质量/图片） |
| `docs/SESSION_LOG.md` | 会话流水，倒序追加 |
