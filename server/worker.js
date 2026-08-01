/* ============================================
   GymFlow AI Worker — Cloudflare Workers 版
   云端 GLM 中转（24/7，电脑关机可用）
   与 server.js 同契约（{success, answer} / {error}）
   部署: wrangler deploy
   Secrets: GLM_API_KEY / ACCESS_PASSWORD / MAX_PER_DAY
   ============================================ */

const SYSTEM_PROMPT = `你是健身减脂辅助顾问，专注解答健身训练、力量三分化（推日/拉日/臀腿日）、体态改善（圆肩/溜肩/肱骨前移/肩峰撞击）、日常减脂饮食相关问题。
- 回答精简凝练，适配手机端阅读，通常控制在200字以内；
- 若用户问肩部动作，正常推荐并简要提醒留意肩部受力即可；
- 若用户问非健身类问题，自行礼貌回绝，说明你只解答健身相关问题；
- 减脂饮食建议以日常可操作为主，不追求精确计算。`;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', ...CORS },
});

// 限流：isolate 内存 Map（免费版个人够用；isolate 回收清零，次日自动恢复）
const rateMap = new Map();

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/api/ask') {
      const isHealth = url.pathname === '/api/health';
      return json(isHealth ? { status: 'ok' } : { error: 'Not Found' }, isHealth ? 200 : 404);
    }

    let params;
    try { params = await request.json(); } catch { return json({ error: '请求格式错误' }, 400); }
    const { password: pwd, deviceId, content } = params;

    // 1. 密码校验
    if (!pwd || pwd !== env.ACCESS_PASSWORD) return json({ error: '访问密钥错误' }, 403);
    // 2. 参数校验
    if (!deviceId || !content || !content.trim()) return json({ error: '缺少必填参数: password, deviceId, content' }, 400);

    // 3. 限流
    const maxPerDay = parseInt(env.MAX_PER_DAY || '100', 10);
    const used = rateMap.get(deviceId) || 0;
    if (used >= maxPerDay) return json({ error: '今日使用额度已满，次日自动恢复', usage: { used, limit: maxPerDay } }, 429);

    // 4. 调用 GLM
    try {
      const answer = await callGLM(content.trim(), env.GLM_API_KEY);
      rateMap.set(deviceId, used + 1);
      return json({ success: true, answer, usage: { used: used + 1, remaining: maxPerDay - used - 1 } });
    } catch (e) {
      return json({ error: `AI 服务暂时不可用: ${e.message}` }, 500);
    }
  },
};

async function callGLM(content, apiKey) {
  const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });
  const data = await resp.json();
  if (data.choices && data.choices[0]) return data.choices[0].message.content.trim();
  throw new Error(data.error?.message || 'AI 接口返回异常');
}
