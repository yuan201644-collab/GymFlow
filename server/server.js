/* ============================================
   GymFlow AI Server v2
   智谱 GLM-4-Flash 代理后端
   启动: node server.js
   ============================================ */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── 加载配置 ──
const { apiKey, password, maxPerDay } = require('./config');

// ── 持久化数据文件 ──
const DATA_FILE = path.join(__dirname, 'data.json');
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return {}; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── 系统提示词 ──
const SYSTEM_PROMPT = `你是健身减脂辅助顾问，专注解答健身训练、力量三分化（推日/拉日/臀腿日）、体态改善（圆肩/溜肩/肱骨前移/肩峰撞击）、日常减脂饮食相关问题。
- 回答精简凝练，适配手机端阅读，通常控制在200字以内；
- 若用户问肩部动作，正常推荐并简要提醒留意肩部受力即可；
- 若用户问非健身类问题，自行礼貌回绝，说明你只解答健身相关问题；
- 减脂饮食建议以日常可操作为主，不追求精确计算。`;

// ── 调用智谱 API ──
function callAI(userContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const req = https.request('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 25000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content.trim());
          } else {
            reject(new Error(json.error?.message || 'AI 接口返回异常'));
          }
        } catch (e) { reject(new Error('AI 响应解析失败')); }
      });
    });

    req.on('error', e => reject(new Error(`网络异常: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('AI 响应超时，请重试')); });
    req.write(body);
    req.end();
  });
}

// ── 简易 HTTP 服务 ──
const server = require('http').createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method !== 'POST' || req.url !== '/api/ask') {
    res.writeHead(req.url === '/api/health' ? 200 : 404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.url === '/api/health' ? { status: 'ok' } : { error: 'Not Found' }));
    return;
  }

  let raw = '';
  req.on('data', c => raw += c);
  req.on('end', async () => {
    let params;
    try { params = JSON.parse(raw); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '请求格式错误' }));
    }

    const { password: pwd, deviceId, content } = params;

    // 1. 密码校验
    if (!pwd || pwd !== password) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '访问密钥错误' }));
    }

    // 2. 参数校验
    if (!deviceId || !content || content.trim().length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '缺少必填参数: password, deviceId, content' }));
    }

    // 3. 限流校验
    const data = loadData();
    const today = new Date().toISOString().slice(0, 10);
    if (!data[deviceId] || data[deviceId].date !== today) {
      data[deviceId] = { date: today, count: 0 };
    }
    const entry = data[deviceId];

    if (entry.count >= maxPerDay) {
      saveData(data);
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '今日使用额度已满，次日自动恢复', usage: { used: entry.count, limit: maxPerDay } }));
    }

    // 4. 调用 AI
    try {
      entry.count++;
      saveData(data);

      const answer = await callAI(content.trim());

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        answer,
        usage: { used: entry.count, remaining: maxPerDay - entry.count },
      }));
    } catch (e) {
      entry.count--;
      saveData(data);
      console.error(`[${new Date().toLocaleTimeString()}] 调用失败:`, e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `AI 服务暂时不可用: ${e.message}` }));
    }
  });
});

server.listen(3000, () => {
  console.log('🏋️  GymFlow AI Server v2 已启动');
  console.log(`    http://localhost:3000`);
  console.log(`    模型: glm-4-flash（免费）`);
  console.log(`    限流: ${maxPerDay}次/设备/天`);
  console.log('    POST /api/ask');
});
