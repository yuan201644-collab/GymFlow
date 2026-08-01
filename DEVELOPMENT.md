# GymFlow 开发交接文档

> **用途**：新会话读取此文档即可完整接手 GymFlow 项目。包含全部修改历史、当前架构、代码规范、待完成任务、已知问题与测试方式。
> **最后更新**：2026-08-01（v1.4）
> **GitHub**：https://github.com/yuan201644-collab/GymFlow

---

## 一、项目简介

GymFlow 是手机端健身追踪工具（H5 + Android APK 双端），核心卖点：

- **离线个人数据 + 对话式 LLM + 体态矫正细分** 三者组合
- 三分化/五分化/全身体/上下肢/PPL6 五种训练分化
- AI 顾问（智谱 GLM-4-Flash 免费模型）
- 本地方案生成引擎（代价场打分，非 AI 生成）

**数据存储**：全部 localStorage，无需后端服务器（AI 除外）。

**AI 后端**：Node.js 中转智谱 GLM-4-Flash，见 `server/`。

---

## 二、版本修改历史

### v1.0（2026-07-29）
- 三分化训练计划展示（推/拉/臀腿）、基础打卡
- localStorage 本地存储、Chart.js 图表

### v1.1（2026-07-30）
- 训练打卡+进度条+自动轮转（推→拉→臀腿→休息）
- 体重+BMI 追踪+折线图、统计页、月度日历
- 体态矫正动作要领、休息日计划、深浅主题、数据导入导出、PWA

### v1.2（2026-07-31）
- 四 Tab 模块化架构（训练|AI|功能|我的）
- AI 顾问独立页、AI 训练评分
- 部位下钻统计（6 大区域）、折叠动作组
- 有氧量化、训练历史补录、开屏动画、彩屑庆祝
- 灵动岛适配、新 App 图标

### v1.3（2026-07-31）
- **AI 定制训练**：13 步对话采集、AI 生成方案（后改本地引擎）
- **方案库**：多方案保存/切换/删除
- **160+ 动作库**：8 维标签、搜索筛选、收藏
- **体态矫正闭环**：自测→定制→追踪
- **AI 复盘教练**：训练小结+今日建议+周报
- 新手教程、评分/方案确认流程
- 大量 bug 修复（功能页崩溃、数据安全等）

### v1.4（2026-08-01）
- **方案引擎五层架构重构**（见下节）
- **300 动作库**：8 维标签 + correction/jointRisk/phase 三维（共 11 维）
- **全局去重**：主组+热身+拉伸跨天不重复
- **维度敏感度**：goal/focus/weakness/time/style/intensity/experience 全部驱动不同方案
- **PPL6 天模板**、新手全身体填满、经验差异化
- **设备对齐修复**：纯自重/家庭不再选入不可用器械动作
- AI 地址智能判断：网页端 localhost，APK 端隧道

---

## 三、当前架构（v1.4）

### 3.1 文件结构

```
GymFlow/
├── index.html          # 单页入口，4 Tab
├── css/style.css       # 全部样式（暗黑+亮色主题，CSS 变量）
├── js/
│   ├── app.js          # 主入口/路由/功能页模块系统/AI教练流程
│   ├── data.js         # localStorage 数据层+方案库+版本管理
│   ├── training.js     # 训练计划+打卡+历史+周报
│   ├── ai.js           # AI 顾问对话页（打字机效果）
│   ├── exercises.js    # 300 动作库（11 维标签）
│   ├── engine.js       # ★ 方案生成引擎（五层架构）
│   ├── posture.js      # 体态矫正自测/复测
│   ├── stats.js        # 统计图表+日历
│   ├── weight.js       # 体重/BMI
│   ├── tutorial.js     # 新手教程
│   └── utils.js        # 工具函数
├── server/             # AI 后端（Node.js + 智谱 GLM-4-Flash）
│   ├── server.js       # 中转代理（密码/限流/持久化）
│   ├── config.js       # 密钥配置（不上传 Git）
│   └── AI_PLAN_SPEC.md # AI 方案生成规范
├── manifest.json       # PWA
├── sw.js               # Service Worker
└── icons/              # App 图标
```

### 3.2 方案生成引擎（engine.js）五层架构

```
┌─ 配置层  TEMPLATES：三分化/五分化/全身体/上下肢/PPL6 声明式模板
│          每组固定 region/n/pickHint + 热身拉伸部位
├─ 决策层  buildContext → 规范化决策向量 + DECISION 权重表
│          templateKey/maxSets/reps/focusMultiplier/weaknessComp
├─ 打分层  scoreExercise：11 维打分
│          expPenalty/goalBonus/regionBonus/injuryPenalty/jointRiskPenalty/
│          postureBonus/styleBonus/dislikePenalty
├─ 填充层  pickExercises/pickFromPool：模板驱动选动作 + 去重
│          usedMain（主组全局去重）+ planWarmup/planStretch（热身拉伸跨天去重）
└─ 校验层  checkPlanAgainstSpec：三段/部位数/库内/去重自检
```

**核心原则**：模板定结构（稳定）、打分定动作（个性化）、校验守规范（兜底）。

### 3.3 关键决策逻辑

- **模板选择**：新手→fullbody；days≥6→ppl6；五分化→5day；上下肢→upperlower；否则 3day
- **maxSets**：新手 5、30分钟 3、90分钟 6、老手≥5、高强度+1、保守-1
- **reps**：力量 4-6次、减脂 12-15次、增肌/保守 8-12次
- **主组动作数**：每组至少 2（满足 2选1），focus/weakness 部位 +1
- **去重**：主组跨天不重复（usedMain），热身拉伸跨天不重复（planWarmup/planStretch），纯自重池受限时允许降级

---

## 四、代码规范

### 4.1 通用
- 纯 Vanilla JS，无框架、无构建工具
- 全局函数（无模块系统），通过 `<script>` 顺序加载
- 中文字符串（UI 全部中文）
- 注释用中文，节段用 `// ====` 分隔

### 4.2 数据层（data.js）
- localStorage key 前缀 `fitness_`（settings/records/weights/plans/body_profile/coach_log 等）
- 版本号 `APP_VERSION` 常量，`checkVersionUpdate` 检测更新
- 导出/导入 JSON 含全部数据（含方案库/AI配置）

### 4.3 训练数据（exercises.js）
每个动作 11 维标签：
```
{ name, region, equipment, difficulty, type, posture,
  mechanics, focus, risk,
  correction[], jointRisk{shoulder,knee,lowerBack}, phase }
```
- `region` 格式：`部位.子部位`（如 `胸.中胸`）
- `phase`：warmup | main | stretch | cardio
- 新动作必须打全 11 维标签

### 4.4 训练计划（training.js）
- 动作组模式：`groups[]`，每组 `exercises[]` 备选动作
- `pickHint`：`2选1`/`3选1`（表示几选几）
- 完成逻辑：组内完成动作数 ≥ 阈值才标记完成
- 折叠：完成组折叠未完成动作，取消展开

### 4.5 引擎（engine.js）
- **打分函数**统一签名 `(ex, ctx)`，返回数值
- **ctx** 决策向量在 buildContext 生成，含 decision 子对象
- **模板**只声明结构，不写死动作
- **去重 Set**：usedMain/planWarmup/planStretch
- **设备过滤** `isEquipmentAvailable(ex, ctx)` 必须最前，任何情况下不可用动作不入选

---

## 五、待完成任务（改进报告未落地项）

### 5.1 产品功能待补充（改进报告末尾）
1. 语音记录（Web Speech API）
2. 训练年鉴
3. 休息计时×动作教学
4. 智能替补
5. 同设备多档案
6. 疲劳感知「今日建议」轮转

### 5.2 引擎打磨（11.4 延续）
- **经验中级/老手差异化**：expPenalty 已加，但中级/老手结构差异仍弱，可进一步驱动模板参数（中级含高级 ≤30%、老手 ≤50%）

### 5.3 已知问题
- **纯自重+新手**：动作池最受限，跨天去重后偶有 1 个重复（报告认可降级）
- **纯自重上胸**：可用动作少，组可能只有 1 个动作（降级组）
- **老 WebView 兼容**：全项目约 30 处 `?.` 可选链（Chrome 80+），老设备有解析风险（用户暂缓）
- **APK 导出**：WebView 下载需 native 配置，web 层无法修复

### 5.4 改进报告历史遗留（已完成但可优化）
- 动作库重复名清理（曾 22 个重复，已去重到 300 唯一）
- 方案相似度 0.46，剩余同画像对主因「目标-增肌≈基础」「伤病-多种叠加未落具体 penalty」

---

## 六、测试方式

### 6.1 本地引擎回归
```js
// 用 vm 加载 exercises.js + engine.js，buildPlan 各种画像验证：
// - 无重复动作（方案级）
// - 主组每组 ≥2 动作
// - 热身 3-5 部位、拉伸 3-5 部位
// - 设备对齐（纯自重/家庭无不可用器械）
// - 维度敏感度（goal/focus/time 等不同 → 方案不同）
```

### 6.2 手动测试
- 浏览器打开 index.html（手机视口）
- 功能页 → AI训练方案 → 走 13 步问卷 → 生成方案预览 → 保存/修改/放弃
- 方案库 → 切换方案 → 训练页自动跳转第一个训练日
- 训练页 → 勾选打卡 → 折叠动画 → 完成庆祝

### 6.3 AI 后端（固定隧道方案，2026-08-01）
- **一键启动**：双击根目录 `start.bat`（启动后端 + 固定隧道，两个窗口保持打开）
- **手动启动**：
  ```bash
  cd server && node server.js   # localhost:3000（网页端）
  "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run gymflow   # 固定隧道 ai.gym-flow.xyz
  ```
- **固定隧道配置**（已配好，见 `C:\Users\86133\.cloudflared\`）：
  - Named Tunnel：`gymflow`（ID `cab2e383-2203-492b-8497-ea049d25213a`）
  - 固定域名：`ai.gym-flow.xyz`（Cloudflare DNS CNAME → 隧道）
  - `config.yml`：`ai.gym-flow.xyz → http://localhost:3000`
- **地址不再变化**：免费 trycloudflare 隧道已废弃（每次重启地址变），现用固定域名一劳永逸
- 域名 `gym-flow.xyz` 托管在 Cloudflare（阿里云购买，实名已过）

---

## 七、部署与上传

- **网页版**：浏览器打开 index.html
- **APK**：`健身.apk/` 目录的 Capacitor 工程，`npx cap sync android && gradlew assembleDebug`
- **GitHub**：`git add -A && git commit && git push`
- ⚠️ **重要**：用户要求「上传前必须先询问」，不要默认自动 push

---

## 八、相关文档

- `README.md` — 用户向项目介绍
- `CHANGELOG.md` — 版本更新日志
- `server/AI_PLAN_SPEC.md` — AI 方案生成规范（3+1/5+1 结构）
- `server/README.md` — AI 后端部署文档
- `C:\Users\86133\Desktop\测试gym\GymFlow测试报告.md` — 测试报告（44 画像大规模测试）
- `C:\Users\86133\Desktop\测试gym\GymFlow改进报告.md` — 改进报告（差异化创新点设计）
