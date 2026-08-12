# Outer - Personal Wardrobe & Outfit Assistant

<div align="center">
  <h3>你的智能衣橱管理专家</h3>
  <p>拍照录入 · 身材档案 · 智能搭配</p>
  <a href="https://traewpvzs86n.vercel.app"><strong>🚀 在线体验 (Live Demo)</strong></a>
</div>

<br />

## 🤖 AI Agent 协作 (For AI Agents)

本项目使用 AI Agent 在多台机器上协作开发，状态通过 GitHub 交接。

- **任何 Agent 开工前，请先完整阅读根目录 [`AGENTS.md`](./AGENTS.md)** —— 这是唯一入口，包含开工/收工流程、硬性规则与目录约定。
- **当前进展与下一步，见 [`docs/STATE.md`](./docs/STATE.md)** —— 交接的单一事实来源。
- 快捷命令：开工 `./scripts/pickup.sh`　｜　收工 `./scripts/handoff.sh -m "本次做了什么"`
- 其他文档：[任务板](./docs/TASKS.md)　·　[决策记录](./docs/DECISIONS.md)　·　[路线图](./docs/ROADMAP.md)　·　[开发规范](./docs/CONVENTIONS.md)　·　[会话流水](./docs/SESSION_LOG.md)

## 📖 项目简介 (Introduction)

**Outer** 是一款专注于个人衣物管理与搭配推荐的应用程序。旨在通过最简单的交互（拍照+标签），解决“衣柜里衣服很多，但不知道穿什么”的日常难题。

本项目目前处于 **MVP (Minimum Viable Product)** 阶段，核心验证“快速录入”与“随机灵感”的用户价值。

## ✨ 核心功能 (Key Features)

### 1. 极简衣橱 (Wardrobe Entry)
- **拍照即存**：直接调用相机或上传图片。
- **快速标记**：只需选择分类（上装/下装/鞋子）、季节、颜色即可入库。
- **云端同步**：基于 Supabase Storage，数据永不丢失。

### 2. 身材档案 (Body Profile)
- **数据记录**：记录身高、体重等基础信息。
- **体型匹配**：提供 5 种标准体型（梨形、沙漏型等）供用户快速对号入座，为未来精准推荐打底。

### 3. 灵感搭配 (Smart Recommendations)
- **一键生成**：点击按钮，系统自动从你的衣柜中抽取“上装 + 下装 + 鞋子”的组合。
- **场景标签**：支持按不同场合（通勤、约会、休闲）生成并保存搭配。
- **打破惯性**：通过随机算法组合，发现你未曾尝试过的穿搭可能性。

## 🛠 技术方案 (Tech Stack)

本项目采用现代化的 **React + Supabase** 架构，实现了快速开发与 Serverless 部署。

- **前端**: React 18, Vite, TailwindCSS (移动端优先设计)
- **后端 (BaaS)**: Supabase (Auth, Database, Storage)
- **部署**: Vercel

## 📸 预览 (Screenshots)

*(此处可后续补充 App 截图)*

## 🚀 快速开始 (Getting Started)

### 本地运行

1. 克隆项目
```bash
git clone https://github.com/mintgao/Project_26_Outer.git
cd Project_26_Outer
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 为 `.env` 并填入你的 Supabase Key。

4. 启动
```bash
npm run dev
```

## 📄 License

MIT
