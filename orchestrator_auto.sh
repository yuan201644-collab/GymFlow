#!/bin/bash
# GymFlow 双Agent工作流协调器（全自动版·方案A：串行调度）
# 用法：./orchestrator_auto.sh
# 前提：claude CLI 已装并配置好模型路由
# 注意：用 -p（headless）而非 --prompt（交互），跑完即退出

WORKFLOW_DIR=".agent-workflow"
STATUS_FILE="$WORKFLOW_DIR/status.json"
LOG_DIR="$WORKFLOW_DIR/logs"
MAX_ITERATIONS=3
AGENT_TIMEOUT=900      # 单个 agent 超时秒数，防卡死
MAX_STALL=3            # 状态连续不变的最大轮数，防热循环

mkdir -p "$LOG_DIR"

# 用 jq 读 status（无 jq 时退回 grep）——审计：JSON 解析更稳
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

run_agent() {
    local prompt="$1"
    local logfile="$LOG_DIR/$(date '+%Y%m%d-%H%M%S')-$prompt.log"
    echo "[$(date '+%H:%M:%S')] 启动 agent: $prompt → $logfile"
    # -p headless；allowedTools 限只读+编辑+测试工具（不含 git commit/push，版本归用户+测试端）
    timeout "$AGENT_TIMEOUT" claude -p "$(cat "$WORKFLOW_DIR/$prompt")" \
        --allowedTools "Read Grep Glob Edit Write Bash(git status) Bash(git diff) Bash(git diff *) Bash(git log *) Bash(node *) Bash(./tools/*)" \
        2>&1 | tee "$logfile"
}

echo "🚀 全自动工作流启动（方案A：串行调度）..."
echo ""

PREV_STATUS=""
STALL=0

while true; do
    PHASE=$(get_phase)
    ITER=$(get_iteration)

    # 迭代上限：启动 agent 前检查（审计：原在 agent 运行后检查，已修）
    if [ -z "$PHASE" ]; then
        echo "❌ 无法读取 status.json 的 phase，请检查文件格式"; exit 1
    fi
    if [ "$ITER" -gt "$MAX_ITERATIONS" ]; then
        echo "❌ 超过最大迭代 $MAX_ITERATIONS，强制停止"; exit 1
    fi

    # 无进展守卫：status 与上次相同则计数，超限强制停止（审计：防热循环，原无限重发）
    CUR="$PHASE/$ITER"
    if [ "$CUR" = "$PREV_STATUS" ]; then
        STALL=$((STALL + 1))
    else
        STALL=0
        PREV_STATUS="$CUR"
    fi
    if [ "$STALL" -ge "$MAX_STALL" ]; then
        echo "❌ 状态连续 $MAX_STALL 轮无变化（当前 $PHASE | 第 $ITER 轮），agent 可能卡住/报错，强制停止"
        echo "   查看日志: $LOG_DIR/"
        exit 1
    fi

    echo "[$(date '+%H:%M:%S')] 状态: $PHASE | 第 $ITER 轮"

    case $PHASE in
        "planning") run_agent "architect_prompt.md" ;;
        "coding")   run_agent "engineer_prompt.md" ;;
        "testing")  run_agent "architect_prompt.md" ;;
        "done")   echo "✅ 任务完成！第 $ITER 轮"; exit 0 ;;
        "failed") echo "❌ 迭代超限，需人工介入"; exit 1 ;;
        *) echo "❌ 未知状态: $PHASE"; exit 1 ;;
    esac

    sleep 3  # 等 agent 落地 status
done
