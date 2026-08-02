#!/bin/bash
# 用法：./tools/grep_function.sh <函数名>
# 搜索函数定义在哪个文件哪一行（普通函数/箭头函数/对象方法）

if [ $# -lt 1 ]; then
    echo "用法: $0 <函数名>"
    exit 1
fi

grep -rn "function $1\|$1.*=.*function\|$1.*=>" js/ --include="*.js"
