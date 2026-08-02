#!/bin/bash
# 一键跑全部测试套件（tests/ 目录下）

echo "===== 运行全部测试 ====="
echo ""

# 切到 tests/ 目录（脚本在 tools/ 下）
cd "$(dirname "$0")/../tests" 2>/dev/null || cd "tests" 2>/dev/null || { echo "找不到 tests/ 目录"; exit 1; }

PASS=0
FAIL=0

run_test() {
    echo "--- $1 ---"
    if node "$1"; then
        echo "✅ 通过"
        PASS=$((PASS + 1))
    else
        echo "❌ 失败"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

# 单元测试
run_test "engine_test.js"
run_test "fuzzy_test.js"
run_test "ai_worker_test.js"
run_test "advice_test.js"
run_test "advice_ai_test.js"

# UI测试（Playwright）
run_test "patch20_test.js"
run_test "ui21_test.js"
run_test "help_ui_test.js"
run_test "ai_dual_ui.js"
run_test "advice_ui_test.js"

echo "===== 测试汇总 ====="
echo "通过: $PASS"
echo "失败: $FAIL"
echo ""

[ $FAIL -eq 0 ] && exit 0 || exit 1
