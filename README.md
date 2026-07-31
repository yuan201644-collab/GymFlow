<p align="center">
  <br>
  <img src="icons/icon-192.png" width="100" alt="GymFlow Logo" style="border-radius:22px;">
</p>

<h1 align="center">GymFlow</h1>
<p align="center"><b>三分化健身追踪 · 极简高效</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/纯前端-零依赖-green?style=flat-square">
  <img src="https://img.shields.io/badge/AI-GLM4--Flash-blue?style=flat-square">
  <img src="https://img.shields.io/badge/PWA+APK-双端-orange?style=flat-square">
  <img src="https://img.shields.io/badge/数据-本地存储-red?style=flat-square">
</p>

---

## 这是什么

GymFlow 是一个手机端健身追踪工具，专为**三分化训练**设计。打开即用，数据保存在手机本地，无需注册、无需网络。支持 **Web H5 + Android APK** 双端运行，内置 **AI 健身顾问**。

<p align="center">
  <b>🏋️ 训练</b> · <b>🤖 AI</b> · <b>📦 功能</b> · <b>👤 我的</b>
</p>

## 核心功能

| 功能 | 说明 |
|------|------|
| 🔄 **自动轮转** | 推→拉→臀腿→休息，四天循环，打开即知今日训练 |
| 🔀 **200+ 可替换动作** | 每肌群 2-3 个替换动作，平铺展开，自由选择 |
| 📂 **折叠动作组** | 组头点击展开/收起，已完成自动折叠，平滑动画 |
| ✅ **一键打卡** | 勾选完成，进度条实时反馈，完成弹彩屑庆祝 |
| 🏃 **有氧量化** | 时长/坡度/距离记录，附加项不影响主训练完成 |
| 📊 **部位下钻统计** | 胸/肩/背/手臂/臀腿/核心 6 大区域，点击展开子区域 |
| ⚖️ **体重+BMI** | 双线折线图，BMI 自动计算，趋势一目了然 |
| 📅 **月度日历** | 标注每日训练类型（推/拉/腿/休），颜色区分 |
| 🤖 **AI 健身顾问** | GLM-4-Flash 免费模型，独立页面，思考动画 |
| 📝 **AI 训练评分** | 提交训练数据，AI 评分+评价+改进建议 |
| 📋 **训练历史** | 补录/编辑/删除，查看过往所有训练记录 |
| 🎯 **体态矫正** | 圆肩/溜肩/肱骨前移/肩峰撞击专项动作要领 |
| 🧘 **休息日计划** | 核心激活+体态矫正拉伸 |
| 🌓 **深浅主题** | 跟随系统/手动切换 |
| 🚀 **开屏动画** | 圆环描边+哑铃，品牌一致 |
| 🔒 **数据安全** | 导出/导入 JSON，localStorage 本地存储 |

## AI 后端（可选）

```
server/
├── server.js          # Node.js 中转代理
├── config.example.js  # 配置模板
└── README.md          # 部署文档
```

对接智谱 GLM-4-Flash 免费模型，密钥仅存电脑本地，支持 Cloudflare Tunnel 内网穿透。详见 [server/README.md](server/README.md)。

## 快速开始

### 手机使用

从 [Releases]() 下载 `健身助手.apk` 安装，或解压 `健身助手.zip` → 浏览器打开 `index.html` → 添加到主屏幕。

### 电脑预览

```bash
git clone https://github.com/yuan201644-collab/GymFlow.git
cd GymFlow
# 浏览器打开 index.html
```

## 技术栈

```
HTML5 + CSS3 + Vanilla JS
├── Chart.js       图表渲染
├── localStorage   数据持久化
├── Service Worker 离线+PWA
├── Capacitor      APK 打包
└── Node.js        AI 后端（可选）
```

## 项目结构

```
GymFlow/
├── index.html          # 单页入口
├── manifest.json       # PWA 配置
├── sw.js               # 离线 Service Worker
├── css/style.css       # 全部样式
├── js/
│   ├── app.js          # 主入口/路由/模块系统
│   ├── data.js         # localStorage 数据层
│   ├── training.js     # 训练计划+打卡逻辑
│   ├── ai.js           # AI 对话页面
│   ├── weight.js       # 体重/BMI 追踪
│   ├── stats.js        # 统计图表+日历
│   └── utils.js        # 工具函数
├── icons/              # App 图标
└── server/             # AI 后端（可选）
```

---

<p align="center">
  <sub>Made with 💚 for the gym</sub>
</p>
