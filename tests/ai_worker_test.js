/* worker.js 契约测试：密码/参数/限流/GLM 调用/{success,answer}（mock fetch，不真调 GLM） */
const fs = require('fs');
const vm = require('vm');
const SRC = '../server/worker.js';

let src = fs.readFileSync(SRC, 'utf8').replace('export default', 'module.exports =');
let glmCalls = 0;
const sandbox = {
  module: { exports: {} }, exports: {}, console, URL, Map, parseInt,
  Response: class { constructor(body, init) { this.body = body; this.status = (init || {}).status || 200; this.headers = (init || {}).headers || {}; } async json() { return JSON.parse(this.body); } },
  fetch: async () => { glmCalls++; return { ok: true, json: async () => ({ choices: [{ message: { content: 'AI 测试回答' } }] }) }; },
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const worker = sandbox.module.exports;

let pass = 0, fail = 0;
const t = (name, cond, detail) => { if (cond) { pass++; console.log(`✅ ${name}`); } else { fail++; console.log(`❌ ${name} → ${detail || ''}`); } };

async function send(method, path, body, env) {
  const request = { method, url: 'https://ai.gym-flow.xyz' + path, json: async () => body };
  return await worker.fetch(request, env || { ACCESS_PASSWORD: 'pw', GLM_API_KEY: 'k', MAX_PER_DAY: '3' });
}

(async () => {
  // 1. 健康检查
  let r = await send('GET', '/api/health', null);
  t('健康检查 /api/health', r.status === 200 && (await r.json()).status === 'ok', JSON.stringify(r));

  // 2. 非 /api/ask → 404
  r = await send('GET', '/api/xxx', null);
  t('未知路径 404', r.status === 404);

  // 3. 错误密码 → 403
  r = await send('POST', '/api/ask', { password: 'wrong', deviceId: 'd1', content: 'hi' });
  t('错误密码 403', r.status === 403 && (await r.json()).error === '访问密钥错误', r.status);

  // 4. 缺 content → 400
  r = await send('POST', '/api/ask', { password: 'pw', deviceId: 'd1', content: '' });
  t('缺 content 400', r.status === 400);

  // 5. 合法请求 → success + answer + usage
  r = await send('POST', '/api/ask', { password: 'pw', deviceId: 'd1', content: '今天练什么' });
  const j5 = await r.json();
  t('合法请求 → success:true + answer', j5.success === true && j5.answer === 'AI 测试回答' && j5.usage.remaining === 2, JSON.stringify(j5));

  // 6. 限流：发满 3 次后第 4 次 429
  await send('POST', '/api/ask', { password: 'pw', deviceId: 'd2', content: 'a' });
  await send('POST', '/api/ask', { password: 'pw', deviceId: 'd2', content: 'b' });
  r = await send('POST', '/api/ask', { password: 'pw', deviceId: 'd2', content: 'c' });
  r = await send('POST', '/api/ask', { password: 'pw', deviceId: 'd2', content: 'd' });
  t('额度满 429', r.status === 429 && (await r.json()).error.includes('额度'), r.status);

  // 7. CORS 头存在
  r = await send('POST', '/api/ask', { password: 'pw', deviceId: 'd3', content: 'x' });
  const cors = r.headers['Access-Control-Allow-Origin'];
  t('CORS * 存在', cors === '*', JSON.stringify(r.headers));

  // 8. GLM 调用次数统计（d1 1次 + d2 3次 + d3 1次 = 5）
  t('GLM fetch 调用 5 次', glmCalls === 5, 'glmCalls=' + glmCalls);

  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
})();
