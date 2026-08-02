# GymFlow AI Server

本地 Node.js 后端，对接**智谱 GLM-4-Flash（免费模型）**，为 GymFlow 健身 APK 提供 AI 文字问答。密钥仅存电脑本地，安卓端不暴露。

## 一、配置

编辑 `config.js`，三个配置项：

```js
module.exports = {
  apiKey: '智谱API密钥',   // 从 https://open.bigmodel.cn → API Keys 获取
  password: 'gymflow2024',  // 自定义访问密码，APK 需携带
  maxPerDay: 120,          // 单设备每日最大次数
};
```

## 二、启动

```bash
cd server
node server.js
```

输出：

```
🏋️  GymFlow AI Server v2 已启动
    http://localhost:3000
    模型: glm-4-flash（免费）
    限流: 120次/设备/天
    POST /api/ask
```

## 三、安卓 APK 请求格式

| 项 | 值 |
|------|-----|
| 方式 | `POST` |
| 地址 | `https://公网地址/api/ask` |
| Content-Type | `application/json` |

**请求体：**

```json
{
  "password": "gymflow2024",
  "deviceId": "设备唯一ID",
  "content": "今天练腿有什么需要注意的？"
}
```

**成功返回：**

```json
{
  "success": true,
  "answer": "练腿日注意：1. 热身充分...",
  "usage": { "used": 5, "remaining": 115 }
}
```

**密码错误：**

```json
{ "error": "访问密钥错误" }
```

**次数用完：**

```json
{ "error": "今日使用额度已满，次日自动恢复" }
```

## 四、Cloudflare Tunnel（内网穿透）

让手机通过公网 HTTPS 访问你电脑上的后端。

### 安装

```bash
winget install --id Cloudflare.cloudflared
# 或 https://github.com/cloudflare/cloudflared/releases 下载 exe
```

### 启动隧道

```bash
cloudflared tunnel --url http://localhost:3000
```

运行后得到公网地址：

```
https://xxxx-xxxx.trycloudflare.com
```

把 `https://xxxx.trycloudflare.com/api/ask` 填入 APK 请求地址。

### 完整开机流程

```
1. 编辑 server/config.js，填入智谱密钥和访问密码
2. cd server && node server.js
3. cloudflared tunnel --url http://localhost:3000
4. 将生成的 https://xxx.trycloudflare.com 配置到 APK
```

> ⚠️ cloudflared 每次重启地址会变；长期固定域名需注册 Cloudflare 账号并配置 Named Tunnel。

## 五、智谱密钥获取

1. 打开 [open.bigmodel.cn](https://open.bigmodel.cn)
2. 注册登录 → 控制台 → API Keys
3. 创建密钥 → 复制到 `config.js`
4. **GLM-4-Flash 为免费模型，不扣费**

## 六、项目结构

```
server/
├── server.js          # 主服务（密码校验 + 限流 + AI 代理）
├── config.js          # 配置（API密钥、密码、限流，不上传Git）
├── config.example.js  # 配置模板
├── data.json          # 调用次数记录（自动维护）
└── README.md
```
