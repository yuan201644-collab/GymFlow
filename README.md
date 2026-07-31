<p align="center">
  <br>
  <img src="icons/icon-192.png" width="100" alt="GymFlow Logo" style="border-radius:22px;">
</p>

<h1 align="center">GymFlow</h1>
<p align="center"><b>AI 定制化健身追踪 · 三分化 / 五分化</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/纯前端-零依赖-green?style=flat-square">
  <img src="https://img.shields.io/badge/AI-GLM4--Flash-blue?style=flat-square">
  <img src="https://img.shields.io/badge/PWA+APK-双端-orange?style=flat-square">
  <img src="https://img.shields.io/badge/数据-本地存储-red?style=flat-square">
</p>

---

## 这是什么

GymFlow 是一个手机端 AI 健身追踪工具。**打开即用，数据本地存储，无需注册、无需网络。** 支持 Web H5 + Android APK 双端运行，内置 AI 健身顾问与定制化训练方案生成。

<p align="center">
  <b>🏋️ 训练</b> · <b>🤖 AI</b> · <b>📦 功能</b> · <b>👤 我的</b>
</p>

---

## v1.3 核心亮点

| 功能 | 说明 |
|------|------|
| 🧠 **AI 定制方案** | 10 步对话采集，AI 自动生成三分化/五分化训练计划 |
| 📋 **方案库管理** | 多套方案并存，一键切换，默认三分化永久保留 |
| 📚 **160+ 动作库** | 8 维标签（部位/器械/难度/类型/姿态/力学/侧重/风险），搜索+筛选 |
| 🔀 **五分化支持** | 训练页日切换器自动适配方案天数，轮转打卡无缝衔接 |
| 📊 **部位下钻统计** | 6 大区域→子区域逐层展开，排除热身拉伸 |
| 🤖 **AI 健身顾问** | 独立页面，GLM-4-Flash 免费模型，思考动画 |
| 📝 **AI 训练评分** | 提交训练数据，AI 评分+评价+建议，已完成/未完成分隔 |
| ⚖️ **体重+BMI** | 双线折线图，双Y轴，BMI 自动计算，输入校验 |
| 📂 **折叠动作组** | 点击展开/收起，完成任务自动折叠，平滑动画 |
| 📅 **月度日历** | 标注每日训练类型（推/拉/腿/休），彩色区分 |
| 🏃 **有氧量化** | 时长/坡度/距离记录，附加项不影响主训练 |
| 📋 **训练历史** | 补录（日期+类型选择器）/编辑/删除，闭环管理 |
| 🎯 **体态矫正** | 圆肩/溜肩/肱骨前移/肩峰撞击专项要领 |
| 🧘 **休息日计划** | 核心激活+体态矫正拉伸 |
| 🚀 **开屏动画** | 圆环描边+哑铃淡入，品牌一致 |
| 🌓 **深浅主题** | 跟随系统/手动切换 |
| 🔒 **数据安全** | 导出/导入含方案库+AI配置，重置清空全部数据 |

---

## AI 后端（可选）

```
server/
├── server.js          # Node.js 中转代理（纯内置模块，零依赖）
├── config.js          # 密钥+密码+限流配置（不上传Git）
├── config.example.js  # 配置模板
├── data.json          # 调用次数记录
└── README.md          # 部署文档（含 Cloudflare Tunnel）
```

对接智谱 GLM-4-Flash 免费模型。详见 [server/README.md](server/README.md)。

---

## 快速开始

### 手机使用

从 [Releases](https://github.com/yuan201644-collab/GymFlow/releases) 下载 `健身助手.apk` 安装，或解压 `健身助手.zip` → 浏览器打开 `index.html`。

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
├── Chart.js       图表渲染
├── localStorage   数据持久化
├── Service Worker 离线+PWA
├── Capacitor      APK 打包
└── Node.js        AI 后端（可选）
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
│   ├── app.js          # 主入口/路由/模块系统/AI教练
│   ├── data.js         # localStorage 数据层+方案库
│   ├── training.js     # 训练计划+打卡逻辑+历史
│   ├── ai.js           # AI 对话页面
│   ├── exercises.js    # 160+ 动作数据库（8维标签）
│   ├── weight.js       # 体重/BMI 追踪
│   ├── stats.js        # 统计图表+日历
│   └── utils.js        # 工具函数
├── icons/              # App 图标（绿圈+哑铃）
└── server/             # AI 后端（可选）
```

---

<p align="center">
  <sub>Made with 💚 for the gym</sub>
</p>
