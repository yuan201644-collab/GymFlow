# GymFlow 双 Agent 自动化工作流 — 通用复制手册

> **用途**：在另一个项目（如 Python + Vue + TS 全栈）复制这套双 Agent 自动化协作框架。
> **原理**：两个 Agent（架构师=终端、工程师=VSCode/另一终端）通过**文件传话 + 状态机**自动迭代。人只做两件事：**开头写需求，结尾确认提交**。
> **GymFlow 实例**：完整可运行配置在 GymFlow 仓库（`健身助手/` 根目录的 `.agent-workflow/`、`orchestrator*.sh`、`tools/`、`.claude/settings.json`）。

---

## 1. 这套工作流解决什么

| 痛点 | 方案 |
|---|---|
| 两个 Claude 之间靠人传话 | 文件传话（task/plan/test_report/status） |
| 不知道该让谁干活 | 状态机 + 协调器提示 |
| 中间状态难跟踪 | `status.json` 显式记录 |
| 迭代反复 | 状态机自动 planning→coding→testing→done/failed |

**核心思路**：架构师只写方案/测试，工程师只写代码，各自改完 `status.json` 交接，互不越界。

---

## 2. 核心概念

### 2.1 状态机（status.json 的 phase）
```
planning → coding → testing → done
                ↘ failed（超过最大迭代）
```
- **planning**：架构师读 task → 写 plan → phase=coding
- **coding**：工程师读 plan/test_report → 改代码 → phase=testing
- **testing**：架构师跑测试 → 通过→done / 不通过→iteration+1 回 coding / 超限→failed

### 2.2 角色分工
| Agent | 位置 | 职责 | 不做 |
|---|---|---|---|
| 架构师 | 终端 | 需求分析/方案/代码审查/测试 | 不写业务代码 |
| 工程师 | VSCode/另一终端 | 按方案写代码、按测试报告修 bug | 不写测试、不提交、不 bump 版本 |

---

## 3. 目录结构（照这个搭）

```
项目根/
├── .agent-workflow/
│   ├── task.md              ← 人写的需求（唯一手动文件）
│   ├── plan.md              ← 架构师方案
│   ├── test_report.md       ← 测试报告
│   ├── status.json          ← 状态机
│   ├── architect_prompt.md  ← 架构师系统提示词
│   └── engineer_prompt.md   ← 工程师系统提示词
├── orchestrator.sh          ← 半自动协调器（提示你切 agent）
├── orchestrator_auto.sh     ← 全自动协调器（自动调 claude -p）
├── tools/                   ← 常用操作脚本（可选）
│   ├── check_try_catch.sh
│   ├── count_lines.sh
│   ├── grep_function.sh
│   └── run_all_tests.sh
└── .claude/
    └── settings.json        ← 权限白名单（放行文件/测试/git 只读）
```

---

## 4. 各文件职责

### 4.1 状态文件
- **task.md**：人写需求/bug。格式：现象/预期/复现（bug）或 做什么/交互（功能）。
- **plan.md**：架构师写。必须含：问题分析 / 具体改动点（文件·函数·改什么）/ 测试要点。
- **test_report.md**：架构师写。必须含：概览 / 单元测试[PASS/FAIL] / E2E[PASS/FAIL] / 静态审查 / 失败详情 / 下轮建议。
- **status.json**：
```json
{ "phase": "planning", "iteration": 1, "max_iterations": 3, "last_updated": "", "test_passed": false, "task_summary": "" }
```

### 4.2 提示词（prompts）
- **architect_prompt.md**：让架构师读 task → 按 phase 行动（planning 写方案 / testing 跑测试）→ 更新 status。**明确约束**：只写 .agent-workflow/ 和 tests/，不碰业务代码；每轮先看 git diff。
- **engineer_prompt.md**：让工程师读 status → 若 coding：读 plan（第2轮起还读 test_report）→ 改代码 → status=testing。**明确约束**：只改业务代码；不写测试、不跑测试、不提交、不 bump 版本。

> **⚠️ 时间戳规范（实测教训）**：agent 更新 `last_updated` 时**必须用 `date '+%Y-%m-%d %H:%M'` 命令取真实时钟**，禁止估时间——否则会出现"done 比 handoff 还早"的倒挂时间戳。两个 prompt 都应明确写这一条。

### 4.3 协调器
- **orchestrator.sh（半自动）**：读 status → 打印"该架构师了/该工程师了" → 你按提示切窗口。`while` 循环 + `read` 等待。
- **orchestrator_auto.sh（全自动，方案A 串行）**：读 status → **按 phase 启动对应 agent**（`claude -p` headless）→ 等它改 status → 下一 phase → done/failed 收尾。

### 4.4 权限配置（.claude/settings.json）
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep", "Edit", "Write",
      "Bash(git status)", "Bash(git diff)", "Bash(git diff *)",
      "Bash(git log *)", "Bash(git add *)", "Bash(git commit -m *)",
      "Bash(node <测试文件>)", "Bash(node *.test.js)",
      "Bash(ls *)", "Bash(cat *)", "Bash(head *)", "Bash(mkdir -p *)",
      "Bash(cp *)", "Bash(mv *)", "Bash(jq *)", "Bash(date)",
      "Bash(./tools/*)", "Bash(bash tools/*)", "Bash(sh tools/*)"
    ],
    "deny": [
      "Bash(rm -rf *)", "Bash(git push --force *)",
      "Bash(curl *|bash)", "Bash(wget *|sh)", "Bash(sudo *)",
      "Bash(npm install)", "Bash(npm *)"
    ]
  }
}
```
> **关键**：`git push` 不在 deny → 会请求确认（开发端可 push 但需你点头）。`--force` push 永远拒绝。

---

## 5. 使用流程

### 5.1 半自动（先跑熟这个）
```
1. 编辑 .agent-workflow/task.md 写需求
2. 重置 status.json：phase=planning, iteration=1
3. ./orchestrator.sh            ← 它提示你该切谁
4. 切到架构师终端：让 Claude "读取 .agent-workflow/architect_prompt.md 按规则开始"
5. 切到工程师：读 engineer_prompt.md
6. 切回架构师测试
7. done 后检查 git diff → 提交
```

### 5.2 全自动（脚本搭好后）
```
1. 编辑 task.md 写需求
2. 重置 status.json phase=planning
3. ./orchestrator_auto.sh       ← 全自动跑完，人只看日志
```
> 全自动会真的启动 `claude -p` 子进程干活（耗 token、无界面，只能看 orchestrator 日志）。第一次跑建议盯着。

---

## 6. 测试策略（每个项目自建）

### 6.1 原则
- 架构师维护一套**测试套件**（放 `tests/`），按项目语言写（Node→`node tests/*.js`；Python→`pytest tests/`；前端→`vitest`/`playwright`）。
- 套件**挂到一个入口脚本**（`tools/run_all_tests.sh`），架构师一键跑全量。
- 测试报告用固定 `[PASS]/[FAIL]` 格式，工程师才能快速 get 到问题。

### 6.2 run_all_tests.sh 骨架（按语言改命令）
```bash
#!/bin/bash
# 一键跑全部测试（切到 tests/，逐个跑，汇总 PASS/FAIL）
cd "$(dirname "$0")/../tests" || exit 1
PASS=0; FAIL=0
run_test() { echo "--- $1 ---"; if <你的测试命令> "$1"; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi; }
run_test "engine_test"      # 核心逻辑测试
run_test "api_test"         # 后端接口测试（Python）
run_test "frontend_test"    # 前端组件测试（Vue/TS）
# ...
[ $FAIL -eq 0 ] && exit 0 || exit 1
```

### 6.3 GymFlow 实例（参考）
GymFlow 的 `tests/` 有：`engine_test.js`（42 画像回归）、`fuzzy_test.js`、`ai_worker_test.js`、`advice_test.js`（单元）+ 多个 Playwright UI 测试（`patch20_test.js`、`swipe_test.js` 等）。架构师 prompt 里列出套件清单，测试时按需跑。

---

## 7. 治理策略（可选采用，强烈建议）

### 7.1 版本归属
**版本号只能由「用户 + 测试端」指派，开发端（工程师）只实现功能、不自行 bump 版本**（`APP_VERSION` / `CACHE_NAME` / CHANGELOG / git tag）。测试端每轮回归检查常量是否一致，发现开发端擅自改或滞后就上报用户。

### 7.2 发布政策
| 版本 | git 本地提交 | GitHub push | 打包 |
|---|---|---|---|
| PATCH（1.7.0→1.7.1） | ✅ 测试端做 | 不必须 | 不必须 |
| MINOR（1.7→1.8）/ MAJOR（1→2） | ✅ | ✅ 开发端做 | ✅ 开发端做 |
| 紧急 PATCH（崩溃/丢数据） | ✅ | ✅ 例外允许 | ✅ 例外允许 |

- 分工：PATCH 由测试端本地 commit；MINOR/MAJOR 由开发端 commit + push + 打包（先问用户）。
- 每次 commit 同步版本常量 + CHANGELOG。

### 7.3 大版本审计
**每个大版本（如 1.x 全部结束、迈向 2.0 前）做一次代码审计**：XSS/注入、死代码、未定义引用、版本常量一致性、错误处理。审计发现写成报告，修复交给开发端（**不要脚本批量删死代码**——会括号计数级联误删，GymFlow 踩过）。

---

## 8. 踩坑记录（重要教训）

1. **claude CLI 参数（v2.x）**：`--project ./` 和 `--permission-mode acceptEdits` **不支持**（会 `unknown option` 报错退出 → 热循环）。
   ✅ 正确：`claude -p "<prompt>" --allowedTools "Read Grep Glob Edit Write Bash(git status) Bash(git diff) Bash(node *) Bash(./tools/*)"`
   - `-p` = headless（跑完即退出）；项目 = 当前目录（先 cd）。
2. **热循环守卫**：全自动脚本必须有"状态连续 N 轮不变就强制停止"（`MAX_STALL=3`），否则 agent 一报错就无限重发。
3. **迭代上限在启动 agent 前检查**（不是跑完再查）。
4. **脚本批量删死代码会出事**：用括号计数删函数，模板字符串里的 `{` 会把计数带崩，级联误删几十个函数。**死代码清理人工逐函数，别用脚本**。
5. **PowerShell 跑 bash**：`&&` 是 bash 语法，PowerShell 用 `;`；且 PowerShell 的 `bash` 可能路由到 WSL（没装发行版会报错）。用 `bash ./脚本.sh` 或 git-bash。
6. **status.json 解析**：用 `jq`（fallback grep），别硬解。
7. **测试脚本两份拷贝会漂移**（测试端目录 + 项目 tests/）——尽量只维护一份（放项目里）。

---

## 9. 适配到 Python + Vue + TS 项目

| GymFlow（前端/Node） | 目标项目（Python+Vue+TS） |
|---|---|
| `node tests/*.js` | 后端 `pytest tests/`；前端 `npm test` / `npx vitest` / `npx playwright test` |
| `tools/run_all_tests.sh` 里 `node` | 按语言改命令（pytest / npm test），汇总逻辑不变 |
| prompts 里"跑 node tests/engine_test.js" | 改成对应测试命令（Python→pytest，前端→vitest/playwright） |
| 测试套件清单（GymFlow 具体文件） | 换成目标项目的测试文件清单 |
| `tools/check_try_catch.sh`（grep try/catch） | 保留（通用文本 grep），或按语言加 pytest-语义检查脚本 |

> 其余（.agent-workflow 结构、状态机、prompts 模板、orchestrator 脚本、权限配置、治理策略）**与语言无关，可直接照搬**。

---

## 10. 快速上手清单

- [ ] `.agent-workflow/` 6 文件建好（status.json 初始 planning）
- [ ] `orchestrator.sh` + `orchestrator_auto.sh`（+x）
- [ ] `.claude/settings.json` 权限配置
- [ ] `tools/run_all_tests.sh` 按目标语言写好
- [ ] 两个 prompt 里测试命令换成目标项目
- [ ] 用一个小 task 跑通一轮（半自动先，再全自动）
- [ ] 确认 `claude -p` 参数正确（见 §8.1）

---

> 写于 2026-08-02，基于 GymFlow 实战验证。有问题看 GymFlow 仓库的 `.agent-workflow/` 实文件。
