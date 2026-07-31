# GymFlow AI Server

GymFlow 健身助手的 AI 问答后端，对接**智谱 GLM-4-Flash（免费普惠模型）**，为安卓 APK 提供 AI 能力。所有密钥仅保存在电脑本地，绝不暴露在移动端。

## 一、前置准备

### 获取智谱 API 密钥

1. 打开 [智谱开放平台](https://open.bigmodel.cn)
2. 注册登录 → 控制台 → **API Keys**
3. 复制密钥（形如 `xxxxxxxx.yyyyyyyyyyyyyyyy`）
4. **GLM-4-Flash 为免费模型，不计费**

### 安装 Node.js

已安装可跳过。未安装去 [nodejs.org](https://nodejs.org) 下载 LTS 版。

## 二、配置 & 启动

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 修改配置文件

编辑 `config.json`，填入你的真实信息：

```json
{
  "ai": {
    "apiKey": "你的智谱API密钥粘贴在这里",
    "model": "glm-4-flash"
  },
  "auth": {
    "password": "自己设一个访问密码，如 gymflow2024"
  },
  "rateLimit": {
    "maxPerDevicePerDay": 30,
    "maxConcurrentUsers": 15
  },
  "server": {
    "port": 3000
  }
}
```

| 配置项 | 说明 |
|--------|------|
| `ai.apiKey` | 智谱平台 API Key（必填） |
| `auth.password` | 自定访问密码，APK 请求时携带（必填） |
| `rateLimit.maxPerDevicePerDay` | 单设备每日最大调用次数 |
| `rateLimit.maxConcurrentUsers` | 同时在线人数上限 |
| `server.port` | 后端监听端口 |

### 3. 启动服务

```bash
npm start
```

看到以下输出表示成功：

```
🏋️  GymFlow AI Server 已启动
    地址: http://localhost:3000
    模型: glm-4-flash
    限流: 30次/设备/天 · 最多15人
    接口: POST /api/ask
```

## 三、安卓 APK 配置

APK 需要向后端发送 POST 请求：

| 配置项 | 值 |
|--------|-----|
| **请求方式** | `POST` |
| **请求地址** | `https://你的公网地址/api/ask` |
| **Content-Type** | `application/json` |

**请求 Body（JSON）：**

```json
{
  "password": "你设的访问密码",
  "deviceId": "设备唯一标识（如 Settings.Secure.ANDROID_ID）",
  "content": "用户输入的健身问题"
}
```

**成功响应：**

```json
{
  "success": true,
  "answer": "AI 的回答内容...",
  "usage": { "used": 5, "remaining": 25 }
}
```

## 四、内网穿透（Cloudflare Tunnel）

让手机通过公网 HTTPS 访问你电脑上的后端。

### 1. 安装 cloudflared

```bash
# Windows (PowerShell 管理员)
winget install --id Cloudflare.cloudflared

# 或手动下载: https://github.com/cloudflare/cloudflared/releases
```

### 2. 一键映射公网

```bash
cloudflared tunnel --url http://localhost:3000
```

运行后会输出：

```
https://xxxx-xxxx-xxxx.trycloudflare.com
```

**这个 `https://xxxx.trycloudflare.com` 就是公网地址**，把它填进 APK 的请求地址。

### 3. 完整开机流程

```
① 编辑 config.json，填入智谱密钥和访问密码
② cd server && npm start          → 启动后端 (localhost:3000)
③ cloudflared tunnel --url http://localhost:3000  → 启动隧道
④ 将 https://xxx.trycloudflare.com 配置到 APK
⑤ APK 请求: POST https://xxx.trycloudflare.com/api/ask
```

> ⚠️ 每次重启 cloudflared 地址会变。需要长期固定域名可注册 Cloudflare 账号并配置 Named Tunnel（免费）。

## 五、安全说明

| 措施 | 说明 |
|------|------|
| 密钥不暴露 | `apiKey` 仅存于 `config.json`，`.gitignore` 排除，不会上传 GitHub |
| 访问密码 | 所有 APK 请求必须携带预设密码，错误直接拒绝 |
| 设备限流 | 单设备每日最多 30 次 AI 调用，防止滥用 |
| 人数限制 | 最多 15 设备同时使用，超出排队等待 |
| 问题长度限制 | 单次问题不超过 2000 字 |

## 六、接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ask` | POST | AI 问答（需 password + deviceId + content） |
| `/api/health` | GET | 健康检查，返回在线人数 |

---

> GLM-4-Flash 由智谱提供，免费使用，不消耗付费额度。
