const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('app_tutorial_done', '1');
    localStorage.removeItem('fitness_ai_server');
    localStorage.removeItem('fitness_ai_mode');
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 100)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // 1. getAIBase 默认 = 云端
  const def = await page.evaluate(() => getAIBase());
  console.log('1. getAIBase 默认:', def, def === 'https://ai.gym-flow.xyz' ? '✅ 云端' : '❌');

  // 2. 手动覆盖优先
  const ov = await page.evaluate(() => { localStorage.setItem('fitness_ai_server', 'http://1.2.3.4:9999'); return getAIBase(); });
  console.log('2. 手动覆盖优先:', ov, ov === 'http://1.2.3.4:9999' ? '✅' : '❌');
  await page.evaluate(() => localStorage.removeItem('fitness_ai_server'));

  // 3. aiFetch 云端失败 → 回退本地 + 缓存 mode=local
  const r3 = await page.evaluate(async () => {
    const orig = window.fetch;
    window.fetch = (url, opts) => {
      const u = String(url);
      if (u.includes('ai.gym-flow.xyz')) return Promise.reject(new TypeError('Failed to fetch (cloud down)'));
      if (u.includes('localhost')) return Promise.resolve({ ok: true, json: async () => ({ success: true, answer: '来自本地服务' }) });
      return orig(url, opts);
    };
    try {
      const resp = await aiFetch('/api/ask', { password: 'pw', deviceId: 'd', content: 'hi' });
      const data = await resp.json();
      return { data, mode: localStorage.getItem('fitness_ai_mode') };
    } finally { window.fetch = orig; }
  });
  console.log('3. 云端挂→回退本地:', JSON.stringify(r3), r3.data.answer === '来自本地服务' && r3.mode === 'local' ? '✅' : '❌');

  // 4. mode 记忆生效：清掉覆盖后，getAIBase 走本地
  const r4 = await page.evaluate(() => getAIBase());
  console.log('4. 记忆 mode=local 后默认地址:', r4, r4 === 'http://localhost:3000' ? '✅' : '❌');

  // 5. APK（window.Capacitor）→ 云端失败不回退本地（仅云端）
  const r5 = await page.evaluate(async () => {
    window.Capacitor = {};  // 模拟 APK
    localStorage.setItem('fitness_ai_mode', 'local');  // 即使记忆 local，APK 也应走云端
    const orig = window.fetch;
    let tried = [];
    window.fetch = (url, opts) => {
      const u = String(url);
      tried.push(u.includes('ai.gym-flow.xyz') ? 'cloud' : 'local');
      if (u.includes('ai.gym-flow.xyz')) return Promise.reject(new TypeError('cloud down'));
      if (u.includes('localhost')) return Promise.resolve({ ok: true, json: async () => ({ success: true, answer: 'local' }) });
      return orig(url, opts);
    };
    try {
      const resp = await aiFetch('/api/ask', { password: 'pw', deviceId: 'd', content: 'hi' });
      const data = await resp.json();
      return { data, tried };
    } catch (e) { return { error: e.message, tried }; }
    finally { window.fetch = orig; window.Capacitor = undefined; }
  });
  console.log('5. APK 仅云端(不回退本地):', JSON.stringify(r5.tried), (r5.tried && r5.tried.length === 1 && r5.tried[0] === 'cloud') ? '✅ 只试云端' : '❌ ' + JSON.stringify(r5));

  // 6. 我的页地址显示
  await page.evaluate(() => window.renderMePage());
  await page.waitForTimeout(300);
  const meVal = await page.evaluate(() => document.getElementById('ai-server-me') ? document.getElementById('ai-server-me').value : 'missing');
  console.log('6. 我的页 AI 地址显示:', meVal);

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  await browser.close();
})();
