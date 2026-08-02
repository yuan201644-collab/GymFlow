#!/bin/bash
# GymFlow 双Agent工作流协调器（半自动版）
# 用法：./orchestrator.sh
# 作用：跟踪状态、提示你该让谁干活、到点通知你

WORKFLOW_DIR=".agent-workflow"
STATUS_FILE="$WORKFLOW_DIR/status.json"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║   GymFlow 双Agent工作流协调器 v1.0           ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查文件
if [ ! -f "$STATUS_FILE" ]; then
    echo -e "${RED}❌ 找不到 $STATUS_FILE，请先初始化 .agent-workflow/ 目录${NC}"
    exit 1
fi

if [ ! -f "$WORKFLOW_DIR/task.md" ]; then
    echo -e "${RED}❌ 找不到 $WORKFLOW_DIR/task.md${NC}"
    echo "请先在 .agent-workflow/task.md 里写下你的需求"
    exit 1
fi

echo -e "${YELLOW}📋 本次任务：${NC}"
cat "$WORKFLOW_DIR/task.md"
echo ""

# 读取状态（jq 优先，无 jq 退回 grep）
read_status() {
    local key="$1"
    if command -v jq >/dev/null 2>&1; then
        jq -r ".$key" "$STATUS_FILE" 2>/dev/null || echo ""
    else
        case "$key" in
            phase) grep -o '"phase": *"[^"]*"' "$STATUS_FILE" | head -1 | sed 's/.*: *"//;s/"$//' ;;
            iteration) grep -o '"iteration": *[0-9]*' "$STATUS_FILE" | head -1 | sed 's/.*: *//' ;;
        esac
    fi
}

get_phase() { read_status phase; }
get_iteration() { read_status iteration; }

MAX_ITERATIONS=3

echo -e "${GREEN}🚀 工作流启动！${NC}"
echo ""

while true; do
    PHASE=$(get_phase)
    ITER=$(get_iteration)

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "当前状态：${YELLOW}$PHASE${NC} | 第 ${YELLOW}$ITER${NC} 轮"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    case $PHASE in
        "planning")
            echo ""
            echo -e "👉 请切换到【架构师终端】，加载 architect_prompt.md 让它写方案"
            echo -e "   写完方案后它会自动把 phase 改为 coding"
            echo ""
            echo -n "按回车刷新状态..."
            read -r
            ;;

        "coding")
            echo ""
            echo -e "👉 请切换到【VSCode工程师】，加载 engineer_prompt.md 让它写代码"
            echo -e "   改完代码后它会自动把 phase 改为 testing"
            echo ""
            echo -n "按回车刷新状态..."
            read -r
            ;;

        "testing")
            echo ""
            echo -e "👉 请切换到【架构师终端】，让它执行测试"
            echo -e "   测完后它会自动判断：通过→done，不通过→coding"
            echo ""
            echo -n "按回车刷新状态..."
            read -r
            ;;

        "done")
            echo ""
            echo -e "${GREEN}✅✅✅ 测试全部通过！任务完成！${NC}"
            echo ""
            echo -e "📄 最终方案：$WORKFLOW_DIR/plan.md"
            echo -e "📊 测试报告：$WORKFLOW_DIR/test_report.md"
            echo -e "🔄 迭代轮数：$ITER"
            echo ""
            echo -e "${YELLOW}下一步：${NC}"
            echo "  1. 检查 git diff 确认改动没问题"
            echo "  2. 没问题的话按发布政策提交（PATCH 本地 commit；MINOR+ push+APK 需确认）"
            echo ""
            exit 0
            ;;

        "failed")
            echo ""
            echo -e "${RED}❌ 迭代 $MAX_ITERATIONS 轮仍未通过，需要人工介入${NC}"
            echo ""
            echo -e "📄 方案：$WORKFLOW_DIR/plan.md"
            echo -e "📊 最后一次测试报告：$WORKFLOW_DIR/test_report.md"
            echo ""
            echo "建议："
            echo "  1. 读测试报告看卡在哪了"
            echo "  2. 如果是方案问题，手动改 plan.md"
            echo "  3. 如果是代码理解问题，手动调整后重置 status.json 重来"
            echo ""
            exit 1
            ;;

        *)
            echo -e "${RED}未知状态：$PHASE${NC}"
            exit 1
            ;;
    esac
done
