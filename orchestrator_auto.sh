#!/bin/bash
# GymFlow 双Agent工作流协调器（全自动版）
# 前置条件：已安装 claude 命令行工具，且配置好了CCSwitch
# 用法：./orchestrator_auto.sh
# 注意：这是实验性功能，建议先用熟半自动版再尝试

WORKFLOW_DIR=".agent-workflow"
STATUS_FILE="$WORKFLOW_DIR/status.json"

echo "🚀 全自动工作流启动..."

# 启动架构师agent（后台）
echo "   启动架构师agent..."
claude --project ./ --permission-mode acceptEdits \
  --prompt "$(cat $WORKFLOW_DIR/architect_prompt.md)" &
ARCH_PID=$!

# 启动工程师agent（后台）
echo "   启动工程师agent..."
claude --project ./ --permission-mode acceptEdits \
  --prompt "$(cat $WORKFLOW_DIR/engineer_prompt.md)" &
ENG_PID=$!

echo ""
echo "两个agent已启动，正在监控状态..."
echo ""

# 监控循环
while true; do
    PHASE=$(grep -o '"phase": *"[^"]*"' "$STATUS_FILE" | head -1 | sed 's/"phase": *"//' | sed 's/"//')
    ITER=$(grep -o '"iteration": *[0-9]*' "$STATUS_FILE" | head -1 | sed 's/"iteration": *//')

    echo "[$(date '+%H:%M:%S')] 状态: $PHASE | 第 $ITER 轮"

    if [ "$PHASE" = "done" ]; then
        echo ""
        echo "✅ 任务完成！"
        kill $ARCH_PID $ENG_PID 2>/dev/null
        exit 0
    fi

    if [ "$PHASE" = "failed" ]; then
        echo ""
        echo "❌ 迭代超限，需要人工介入"
        kill $ARCH_PID $ENG_PID 2>/dev/null
        exit 1
    fi

    sleep 15  # 每15秒检查一次
done
