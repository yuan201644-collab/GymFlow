<p align="center">
  <br>
  <img src="icons/icon-192.png" width="100" alt="GymFlow Logo" style="border-radius:22px;">
</p>

<h1 align="center">GymFlow</h1>
<p align="center"><b>全面 AI 化健身追踪 · 训练页 AI 教练</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-v2.1.0-green?style=flat-square">
  <img src="https://img.shields.io/badge/AI-GLM4--Flash-blue?style=flat-square">
  <img src="https://img.shields.io/badge/PWA+APK-双端-orange?style=flat-square">
  <img src="https://img.shields.io/badge/数据-本地存储-red?style=flat-square">
  <img src="https://img.shields.io/badge/AI服务-云端24%2F7-purple?style=flat-square">
</p>

---

## 这是什么

GymFlow 是一个手机端 AI 健身追踪工具。**打开即用，数据本地存储。** 支持 Web H5 + Android APK 双端运行，内置**训练页 AI 教练**与本地方案生成引擎。AI 服务云端 24/7 在线（Cloudflare Worker），电脑关机照用。

<p align="center">
  <b>🏋️ 训练</b> · <b>AI</b> · <b>📦 功能</b> · <b>👤 我的</b>
</p>

---

## v2.1.0 核心亮点

### 👆 左右滑屏切换主页面
- 训练/AI/功能/我的 4 个主页面左右滑动切换（左滑下一个 / 右滑上一个）
- 弹层打开、竖向滚动、横向滚动区不误触；桌面鼠标拖拽可测

### 🎨 动作卡片 UI 重构
- **本地建议折叠摘要**：动作卡默认显示 要点·建议重量·休息 摘要，点开展开完整本地建议卡（动作要领并入）
- **表面精简 + 长按菜单**：卡片只留 勾选✓ + 收藏☆ + AI💡；跳过/替换/重量收进长按菜单（今日删除 / 永久删除 / 替换动作）
- **AI 交互升级**：💡 建议改为自由输入框查询（+ 快捷问法），训练页 AI 教练入口改 AI 字母徽章
- **图标统一标准**：卡片内 28-32px / 勾选 22-24px / 功能 40px，触控区 ≥44px
- **记录板块升级**：训练记录为 重量(kg) × 组数 × 每组次数，AI 复盘纳入完整记录 + 今日总训练量

## v2.0.0 核心亮点

### 🧠 训练页 AI 教练（全面 AI 化，4 阶段）
| 阶段 | 功能 | 说明 |
|------|------|------|
| 💡 **本地建议（L0）** | 每个动作卡 💡 按钮 | 动作要点 / 建议重量（上次+2.5kg）/ 组间休息（复合120s·孤立60s）/ 替换动作（同部位+设备过滤） |
| 🗣 **问 AI 讲解（L1）** | 💡 卡内「问 AI」 | 调 GLM 讲解动作（结合历史重量/体态/伤病），回复转义防 XSS + 7 天缓存 |
| 🤖 **底部 AI 教练浮层** | 训练页常驻入口 | 上下文感知：当前方案/训练日/完成度/历史，可答"今天还差什么""下一组加多少" |
| 🎯 **描述性智能替补** | 替换选择器「AI 描述」 | 自然语言描述需求 → AI 从候选池推荐替换动作（池内校验防注入） |

### 🏋️ 训练页灵活性
- 完成阈值改下限（3选1-2 做 1 个即完成）、完成按钮放开（部分完成可结束、记完成率）
- 动作级跳过（仅今天 / 以后也别推荐 → 引擎永久排除）
- 替换/新增动作（同部位+设备过滤选择器）、重量/次数录入（上次重量提示）
- 热身/拉伸组也可加动作（按阶段过滤）

### 🔍 500+ 动作库
- **500+ 动作**，11 维标签（部位/器械/难度/类型/姿态/力学/侧重/风险 + 矫正/关节风险/阶段）
- **模糊搜索**：拼音（`wotui`→卧推）/ 首字母 / 错别字容错（`握推`→卧推）/ 同义词（`bench`/`推胸`）/ 多关键词（`哑铃 推`）
- 按部位/难度/类型筛选 + ⭐ 收藏

### ☁️ AI 服务 24/7
- GLM 中转部署 **Cloudflare Worker**，`ai.gym-flow.xyz` 云端 24/7（电脑关机照用）
- 网页端云端失败自动回退 localhost；APK 仅云端
- 智谱 GLM-4-Flash 免费模型

### 🧠 其他 AI 能力
- **AI 定制方案**：本地方案引擎（五层架构：模板定结构/打分定动作/校验守规范），全局去重 + 维度敏感
- **AI 复盘教练**：训练小结 + 今日建议 + 周报
- **AI 云端双线**：网页端云端为主 + 本地回退

### 📖 使用教程
- 功能模块顶部可折叠「ℹ️ 使用说明」卡（首访展开、二次折叠）

### 既有能力（v1.x）
- ⚖️ 体重+BMI 双线图 · 📊 部位下钻统计 · 📅 月度日历 · 🏃 有氧量化 · 📋 训练历史 · 🎯 体态矫正闭环 · 🧘 休息日 · 🌓 深浅主题 · 🔒 数据导入导出 · 📱 PWA+APK

---

## AI 后端（Cloudflare Worker 24/7）

```
server/
├── worker.js         # Cloudflare Worker（GLM 中转，24/7 云端）
├── wrangler.toml     # Worker 部署配置（绑定 ai.gym-flow.xyz）
├── server.js         # 本地 Node 中转（网页端回退用）
├── config.js         # 密钥+密码+限流（不上传Git）
└── README.md         # 部署文档
```

- **云端**：`ai.gym-flow.xyz` → Cloudflare Worker，24/7 可用
- **本地**：`node server.js`（开发/回退）+ `cloudflared tunnel run gymflow`（真机调试走 local.gym-flow.xyz）
- 详见 [server/README.md](server/README.md)

---

## 快速开始

### 手机使用

从 [Releases](https://github.com/yuan201644-collab/GymFlow/releases) 下载 `健身助手.apk` 安装。

### 电脑预览

```bash
git clone https://github.com/yuan201644-collab/GymFlow.git
cd GymFlow
# 浏览器打开 index.html
```

---

## 技术栈

```
HTML5 + CSS3 + Vanilla JS
├── Chart.js          图表渲染
├── localStorage      数据持久化
├── Service Worker    离线+PWA
├── Capacitor         APK 打包
├── Cloudflare Worker AI 服务 24/7（可选）
└── Node.js           本地 AI 回退（可选）
```

---

## 项目结构

```
GymFlow/
├── index.html          # 单页入口
├── manifest.json       # PWA 配置
├── sw.js               # 离线 Service Worker
├── css/style.css       # 全部样式（暗黑+亮色主题）
├── js/
│   ├── app.js          # 主入口/路由/功能模块/AI教练流程
│   ├── data.js         # localStorage 数据层+方案库
│   ├── training.js     # 训练页（打卡/跳过/替换/重量/AI教练）
│   ├── engine.js       # 方案生成引擎（五层架构）
│   ├── ai.js           # AI 顾问 + 双线（云端/本地）
│   ├── exercises.js    # 500+ 动作库（11维标签）
│   ├── search_index.js # 模糊搜索拼音索引（自动生成）
│   ├── synonyms.js     # 模糊搜索同义词表
│   ├── utils.js        # 工具函数 + 模糊搜索
│   ├── posture.js      # 体态矫正
│   ├── stats.js        # 统计图表+日历
│   ├── weight.js       # 体重/BMI
│   └── tutorial.js     # 新手教程
├── server/             # AI 后端（Worker + 本地回退）
└── icons/              # App 图标
```

---

<p align="center">
  <sub>Made with 💚 for the gym</sub>
</p>
