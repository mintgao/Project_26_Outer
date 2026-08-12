#!/usr/bin/env bash
#
# handoff.sh — 收工交接脚本
#
# 用途：会话结束前执行。校验质量门禁与 STATE.md 时效性，然后提交并推送，
#       保证下一台机器上的 Agent 能拿到最新状态。
#
# 用法：
#   ./scripts/handoff.sh -m "完成 P0-02 RLS 收紧"
#   ./scripts/handoff.sh --force -m "中途交接，lint 未过（原因见 STATE.md）"
#   ./scripts/handoff.sh --help
#
# 参数：
#   -m, --message <摘要>   交接提交的摘要（会自动加上 chore(handoff): 前缀）
#   -f, --force            即使 lint / build 失败或 STATE.md 未更新，仍继续提交推送
#   -h, --help             显示帮助
#
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BOLD='\033[1m'; RED='\033[31m'; GREEN='\033[32m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
line() { printf '%s\n' "------------------------------------------------------------"; }
title() { line; printf "${BOLD}${CYAN}%s${RESET}\n" "$1"; line; }

FORCE=0
MESSAGE=""

usage() {
  cat <<'USAGE'
用法：./scripts/handoff.sh [选项]

选项：
  -m, --message <摘要>   交接提交摘要，最终提交信息为 "chore(handoff): <摘要>"
  -f, --force            lint / build 失败或 STATE.md 未更新时仍强制继续
  -h, --help             显示本帮助

示例：
  ./scripts/handoff.sh -m "完成 P0-02 RLS 收紧"
  ./scripts/handoff.sh --force -m "中途交接，lint 未过（原因见 STATE.md）"
USAGE
}

# ---------- 参数解析 ----------
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message)
      if [ $# -lt 2 ] || [ -z "${2:-}" ]; then
        printf "${RED}❌ 参数错误：%s 需要一个摘要内容${RESET}\n" "$1"; exit 1
      fi
      MESSAGE="$2"; shift 2 ;;
    -f|--force)
      FORCE=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      printf "${RED}❌ 未知参数：%s${RESET}\n\n" "$1"; usage; exit 1 ;;
  esac
done

printf "${BOLD}${GREEN}==> Outer 收工交接（handoff）${RESET}\n"
printf "仓库路径：%s ｜ 机器：%s\n" "$REPO_ROOT" "$(hostname -s)"
[ "$FORCE" -eq 1 ] && printf "${YELLOW}（已启用 --force：校验失败也会继续）${RESET}\n"
echo

FAILED=0

# ---------- 1. 质量门禁：lint ----------
title "第 1 步：npm run lint"
if npm run lint; then
  printf "${GREEN}✅ lint 通过${RESET}\n"
else
  FAILED=1
  printf "${RED}❌ lint 未通过。${RESET}\n"
  printf "   请修复后重试；若确需带着问题交接，请在 docs/STATE.md 的「已知问题与阻塞」写清原因，并使用 --force。\n"
fi
echo

# ---------- 2. 质量门禁：build ----------
title "第 2 步：npm run build"
if npm run build; then
  printf "${GREEN}✅ build 通过${RESET}\n"
else
  FAILED=1
  printf "${RED}❌ build 未通过 —— main 分支必须保持可运行！${RESET}\n"
  printf "   强烈建议修复后再交接；确需交接请使用 --force 并在 STATE.md 中说明。\n"
fi
echo

# ---------- 3. 校验 STATE.md 是否为今天更新 ----------
title "第 3 步：校验 docs/STATE.md 的 updated_at 是否为今天"
if [ ! -f docs/STATE.md ]; then
  FAILED=1
  printf "${RED}❌ 未找到 docs/STATE.md${RESET}\n"
else
  TODAY="$(date +%Y-%m-%d)"
  STATE_DATE="$(awk -F: '/^updated_at:/ {print $2; exit}' docs/STATE.md | tr -d ' ' | cut -c1-10)"
  printf "STATE.md updated_at 日期：%s ｜ 今天：%s\n" "${STATE_DATE:-空}" "$TODAY"
  if [ "$STATE_DATE" = "$TODAY" ]; then
    printf "${GREEN}✅ STATE.md 已是今天更新${RESET}\n"
  else
    FAILED=1
    printf "${RED}❌ docs/STATE.md 的 updated_at 不是今天，说明你还没更新交接状态。${RESET}\n"
    printf "   ${BOLD}请先更新 docs/STATE.md${RESET}（front-matter 全字段 + 正文各节），\n"
    printf "   并在 docs/SESSION_LOG.md 顶部追加一条本次记录，然后重新执行本脚本。\n"
    printf "   下一台机器完全依赖这份状态，过期状态会导致重复劳动或冲突。\n"
  fi
fi
echo

# ---------- 4. 汇总校验结果 ----------
if [ "$FAILED" -eq 1 ]; then
  if [ "$FORCE" -eq 1 ]; then
    printf "${YELLOW}⚠️  存在校验失败项，但已指定 --force，继续提交推送。${RESET}\n\n"
  else
    line
    printf "${RED}${BOLD}交接中止：请先处理上述失败项。${RESET}\n"
    printf "确认知晓风险并仍要交接，请使用：${BOLD}./scripts/handoff.sh --force -m \"摘要\"${RESET}\n"
    line
    exit 1
  fi
fi

# ---------- 5. 提交 ----------
title "第 4 步：提交改动"
if [ -z "$(git status --porcelain)" ]; then
  printf "${YELLOW}工作区没有任何改动，无需提交。${RESET}\n"
else
  git add -A
  if [ -n "$MESSAGE" ]; then
    COMMIT_MSG="chore(handoff): $MESSAGE"
  else
    COMMIT_MSG="chore(handoff): 更新交接状态 @ $(hostname -s) $(date '+%Y-%m-%d %H:%M')"
  fi
  printf "提交信息：${BOLD}%s${RESET}\n" "$COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
  printf "${GREEN}✅ 已提交${RESET}\n"
fi
echo

# ---------- 6. 推送 ----------
title "第 5 步：推送到远端"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if git push origin "$CURRENT_BRANCH"; then
  printf "${GREEN}✅ 已推送到 origin/%s${RESET}\n" "$CURRENT_BRANCH"
else
  printf "${RED}❌ 推送失败。${RESET}\n"
  printf "   请检查网络与 GitHub 凭据；未推送成功意味着交接未完成，下一台机器拿不到你的状态。\n"
  exit 1
fi
echo

line
printf "${BOLD}${GREEN}交接完成 ✅${RESET}\n"
printf "最新提交：%s\n" "$(git log --oneline -1)"
printf "下一台机器请执行：${BOLD}./scripts/pickup.sh${RESET}\n"
line
