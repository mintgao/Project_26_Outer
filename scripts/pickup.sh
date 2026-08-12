#!/usr/bin/env bash
#
# pickup.sh — 开工脚本
#
# 用途：在任意机器上开始工作前执行，确保拿到最新状态并了解「现在做到哪了、接下来做什么」。
# 用法：./scripts/pickup.sh
#
set -euo pipefail

# 无论从仓库哪个子目录调用，都切到 git 根目录
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BOLD='\033[1m'; GREEN='\033[32m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'

line() { printf '%s\n' "------------------------------------------------------------"; }
title() { line; printf "${BOLD}${CYAN}%s${RESET}\n" "$1"; line; }

printf "${BOLD}${GREEN}==> Outer 开工准备（pickup）${RESET}\n"
printf "仓库路径：%s\n" "$REPO_ROOT"
printf "当前机器：%s ｜ 当前用户：%s\n\n" "$(hostname -s)" "$(git config user.name || echo '未配置')"

# ---------- 1. 拉取最新代码 ----------
title "第 1 步：拉取远端最新状态（git pull --rebase）"
if git pull --rebase; then
  printf "${GREEN}✅ 已同步到远端最新状态${RESET}\n"
else
  printf "${YELLOW}⚠️  git pull --rebase 失败。${RESET}\n"
  printf "   常见原因：本地有未提交改动或存在冲突。\n"
  printf "   请先处理（git stash / 解决冲突后 git rebase --continue）再重新执行本脚本。\n"
  exit 1
fi
echo

# ---------- 2. 安装依赖 ----------
title "第 2 步：检查依赖"
if [ ! -d node_modules ]; then
  printf "${YELLOW}未发现 node_modules，开始执行 npm install ...${RESET}\n"
  npm install
  printf "${GREEN}✅ 依赖安装完成${RESET}\n"
else
  printf "${GREEN}✅ node_modules 已存在，跳过安装${RESET}"
  printf "（若 package.json 有变更，请手动执行 npm install）\n"
fi
echo

# ---------- 3. 打印交接状态 ----------
title "第 3 步：docs/STATE.md — 机读字段（front-matter）"
if [ -f docs/STATE.md ]; then
  # 打印第一段 --- 与第二段 --- 之间的内容
  awk 'NR==1 && /^---$/ {inside=1; next} inside && /^---$/ {exit} inside {print}' docs/STATE.md
else
  printf "${YELLOW}⚠️  未找到 docs/STATE.md，请检查仓库完整性。${RESET}\n"
fi
echo

title "docs/STATE.md — 「下一步该做什么」小节"
if [ -f docs/STATE.md ]; then
  # 抓取「下一步」所在的二级标题小节，直到下一个二级标题
  awk '/^## .*下一步/ {inside=1} inside && /^## / && !/下一步/ && ++seen>1 {exit} inside {print}' docs/STATE.md
fi
echo

# ---------- 4. 最近提交 ----------
title "最近 5 条提交（git log --oneline -5）"
git log --oneline -5
echo

# ---------- 5. 最近会话记录 ----------
title "docs/SESSION_LOG.md — 最近 3 条会话记录"
if [ -f docs/SESSION_LOG.md ]; then
  awk '/^## / {count++} count>0 && count<=3 {print} count>3 {exit}' docs/SESSION_LOG.md
else
  printf "${YELLOW}⚠️  未找到 docs/SESSION_LOG.md${RESET}\n"
fi
echo

# ---------- 6. 工作区状态提醒 ----------
title "工作区状态"
if [ -n "$(git status --porcelain)" ]; then
  printf "${YELLOW}⚠️  工作区有未提交改动：${RESET}\n"
  git status --short
  printf "   请确认这些改动是上一次会话的遗留（若是，先读 STATE.md 了解上下文）。\n"
else
  printf "${GREEN}✅ 工作区干净${RESET}\n"
fi
echo

line
printf "${BOLD}${GREEN}开工准备完成。${RESET}\n"
printf "接下来：阅读 ${BOLD}AGENTS.md${RESET} → 打开 ${BOLD}docs/TASKS.md${RESET} 找到 active / next 任务与其验收标准，再开始动手。\n"
printf "收工时请执行：${BOLD}./scripts/handoff.sh -m \"本次做了什么\"${RESET}\n"
line
