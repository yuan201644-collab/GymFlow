#!/bin/bash
# GymFlow 双Agent工作流协调器（全自动版·方案A：串行调度）
# 用法：./orchestrator_auto.sh
# 前提：claude CLI 已装并配置好模型路由
# 注意：用 -p（headless）而非 --prompt（交互），跑完即退出

WORKFLOW_DIR=".agent-workflow"
STATUS_FILE="$WORKFLOW_DIR/status.json"
MAX_ITERATIONS=3
AGENT_TIMEOUT=900   # 单个 agent 超时秒数，防卡死

get_phase() {
    grep -o '"phase": *"[^"]*"' "$STATUS_FILE" | head -1 | sed 's/"phase": *"//' | sed 's/"//'
}
get_iteration() {
    grep -o '"iteration": *[0-9]*' "$STATUS_FILE" | head -1 | sed 's/"iteration": *//'
}

run_agent() {
    local prompt="$1"
    echo "[$(date '+%H:%M:%S')] 启动 agent: $prompt"
    # -p headless；--allowedTools 放行只读+编辑+git/node/工具脚本；timeout 防卡死
    timeout "$AGENT_TIMEOUT" claude -p "$(cat "$WORKFLOW_DIR/$prompt")" \
        --allowedTools "Read Grep Glob Edit Write Bash(git *) Bash(node *) Bash(./tools/*)"
}

echo "🚀 全自动工作流启动（方案A：串行调度）..."
echo ""

while true; do
    PHASE=$(get_phase)
    ITER=$(get_iteration)
    echo "[$(date '+%H:%M:%S')] 状态: $PHASE | 第 $ITER 轮"

    case $PHASE in
        "planning") run_agent "architect_prompt.md" ;;
        "coding")   run_agent "engineer_prompt.md" ;;
        "testing")  run_agent "architect_prompt.md" ;;
        "done")   echo "✅ 任务完成！第 $ITER 轮"; exit 0 ;;
        "failed") echo "❌ 迭代超限，需人工介入"; exit 1 ;;
        *) echo "未知状态: $PHASE"; exit 1 ;;
    esac

    # 迭代上限兜底
    if [ "$ITER" -gt "$MAX_ITERATIONS" ]; then
        echo "❌ 超过最大迭代 $MAX_ITERATIONS，强制停止"; exit 1
    fi
    sleep 3  # 等 agent 落地 status
done
