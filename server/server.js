/* ============================================
   GymFlow AI Server
   智谱 GLM-4-Flash 代理后端
   运行: npm start
   ============================================ */

const express = require('express');
const fs = require('fs');
const path = require('path');

// ── 加载配置 ──
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
} catch (e) {
  console.error('❌ 无法读取 config.json，请从 config.example.json 复制并填写。');
  process.exit(1);
}

const { apiUrl, apiKey, model } = config.ai;
const { password } = config.auth;
const { maxPerDevicePerDay, maxConcurrentUsers } = config.rateLimit;
const PORT = config.server.port || 3000;

// ── 校验必填配置 ──
if (!apiKey || apiKey.includes('你的') || apiKey.includes('在此')) {
  console.error('❌ 请先在 config.json 中填写智谱 API 密钥！');
  console.error('   获取路径: https://open.bigmodel.cn → API Keys');
  process.exit(1);
}
if (!password || password.includes('在此')) {
  console.error('❌ 请先在 config.json 中设置访问密码！');
  process.exit(1);
}

const app = express();
app.use(express.json());

// ── 简易限流存储（内存，重启清零）──
const dailyCounts = new Map(); // key: deviceId, value: { date, count }

function resetStaleCounts() {
  const today = new Date().toISOString().slice(0, 10);
  for (const [deviceId, entry] of dailyCounts) {
    if (entry.date !== today) dailyCounts.delete(deviceId);
  }
}

// ── AI 人设 Prompt ──
const SYSTEM_PROMPT = `你是健身减脂辅助顾问，主要解答健身训练、体态改善、日常减脂饮食相关问题。
使用者偏向力量三分化训练（推日/拉日/臀腿日轮转），你了解他的训练模式。
- 回答风格自然通用，不要过度强调"咨询专业人士"等免责话术；
- 若用户询问肩部相关动作，可以正常推荐，顺便提醒留意肩部受力即可；
- 减脂饮食建议以日常可操作为主，不过度追求精确计算；
- 回答简洁有用，控制在300字以内，除非用户要求详细说明。`;

// ── 请求 AI ──
async function askAI(userContent) {
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);
    const lib = url.protocol === 'https:' ? require('https') : require('http');

    const req = lib.request(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else if (json.error) {
            reject(new Error(json.error.message || 'AI 接口错误'));
          } else {
            reject(new Error('AI 返回格式异常'));
          }
        } catch (e) {
          reject(new Error('AI 响应解析失败'));
        }
      });
    });

    req.on('error', e => reject(new Error(`网络请求失败: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('AI 响应超时')); });
    req.write(body);
    req.end();
  });
}

// ── 主接口 ──
app.post('/api/ask', async (req, res) => {
  const { password: reqPwd, deviceId, content } = req.body || {};

  // 1. 密码校验
  if (!reqPwd || reqPwd !== password) {
    return res.status(403).json({ error: '访问密码错误', code: 'AUTH_FAILED' });
  }

  // 2. 参数校验
  if (!deviceId || !content || content.trim().length === 0) {
    return res.status(400).json({
      error: '缺少必填参数: password, deviceId, content',
      code: 'MISSING_PARAMS',
    });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: '问题过长，请限制在2000字以内', code: 'TOO_LONG' });
  }

  // 3. 设备数校验
  const uniqueDevices = new Set();
  for (const [d, e] of dailyCounts) {
    if (e.date === new Date().toISOString().slice(0, 10)) uniqueDevices.add(d);
  }
  if (uniqueDevices.size >= maxConcurrentUsers && !uniqueDevices.has(deviceId)) {
    return res.status(429).json({
      error: `当前在线人数已满（上限${maxConcurrentUsers}人），请稍后再试`,
      code: 'USERS_FULL',
    });
  }

  // 4. 限流校验
  resetStaleCounts();
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyCounts.get(deviceId) || { date: today, count: 0 };
  if (entry.date !== today) { entry.date = today; entry.count = 0; }

  if (entry.count >= maxPerDevicePerDay) {
    return res.status(429).json({
      error: `今日调用次数已达上限（${maxPerDevicePerDay}次），请明天再来`,
      code: 'RATE_LIMITED',
    });
  }

  // 5. 调用 AI
  try {
    entry.count++;
    dailyCounts.set(deviceId, entry);

    const answer = await askAI(content.trim());

    res.json({
      success: true,
      answer,
      usage: { used: entry.count, remaining: maxPerDevicePerDay - entry.count },
    });
  } catch (e) {
    // 失败时回退计数
    entry.count--;
    if (entry.count <= 0) dailyCounts.delete(deviceId);
    else dailyCounts.set(deviceId, entry);

    console.error(`[${new Date().toLocaleTimeString()}] AI 调用失败:`, e.message);
    res.status(500).json({ error: `AI 服务暂时不可用: ${e.message}`, code: 'AI_ERROR' });
  }
});

// ── 健康检查 ──
app.get('/api/health', (req, res) => {
  resetStaleCounts();
  const activeDevices = new Set();
  for (const [d, e] of dailyCounts) {
    if (e.date === new Date().toISOString().slice(0, 10)) activeDevices.add(d);
  }
  res.json({
    status: 'ok',
    model,
    activeDevices: activeDevices.size,
    maxDevices: maxConcurrentUsers,
  });
});

// ── 启动 ──
app.listen(PORT, () => {
  console.log(`🏋️  GymFlow AI Server 已启动`);
  console.log(`    地址: http://localhost:${PORT}`);
  console.log(`    模型: ${model}`);
  console.log(`    限流: ${maxPerDevicePerDay}次/设备/天 · 最多${maxConcurrentUsers}人`);
  console.log(`    接口: POST /api/ask`);
});
