const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => { localStorage.setItem('app_tutorial_done','1'); localStorage.removeItem('fitness_records'); localStorage.removeItem('fitness_settings'); });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 100)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  let pass = 0, fail = 0;
  const t = (n, c, d) => { if (c) pass++; else { fail++; console.log('  ❌ ' + n + ' ' + (d || '')); } };

  // 1. 导航 AI 徽章
  const navAI = await page.evaluate(() => { const b = [...document.querySelectorAll('.top-tab')].find(x => x.dataset.page === 'ai'); return b ? b.innerHTML : '无'; });
  console.log('1. AI 导航:', navAI);
  t('导航 AI 用字母徽章无🤖', navAI.includes('nav-ai') && navAI.includes('>AI<') && !navAI.includes('🤖'), navAI);

  // 2. 页面无 🤖 残留（渲染后）
  const robotCount = await page.evaluate(() => document.body.textContent.split('🤖').length - 1);
  t('页面无 🤖 残留', robotCount === 0, '残留 ' + robotCount);

  // 3. 默认方案日图标：推/拉/腿 各异
  const dayEmojis = await page.evaluate(() => {
    const plan = getTrainingPlan('push'); // 默认推日
    const order = ['push','pull','legs'];
    const emos = {};
    order.forEach(k => { const p = TRAINING_PLANS[k]; if (p) emos[k] = p.emoji; });
    return emos;
  });
  console.log('3. 默认方案日图标:', JSON.stringify(dayEmojis));
  const distinct = new Set([dayEmojis.push, dayEmojis.pull, dayEmojis.legs]).size === 3;
  t('推/拉/腿图标互不相同', distinct, JSON.stringify(dayEmojis));
  t('推=🏋️ 拉=🏹 腿=🦵', dayEmojis.push==='🏋️' && dayEmojis.pull==='🏹' && dayEmojis.legs==='🦵', JSON.stringify(dayEmojis));

  // 4. 训练页日切换器显示不同图标
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(300);
  const daySwitchIcons = await page.evaluate(() => [...document.querySelectorAll('.day-switch-btn, [class*=day]')].slice(0,8).map(e => e.textContent.trim().slice(0,3)).join(','));
  console.log('4. 日切换器图标:', daySwitchIcons);

  // 5. 弹层动画类：打开替换选择器
  const overlayAnim = await page.evaluate(async () => {
    const gh = [...document.querySelectorAll('.group-header')].find(h => h.textContent.includes('胸大肌'));
    const btn = gh.querySelector('.group-right button');
    btn.click();
    await new Promise(r => setTimeout(r, 250));
    const ov = document.getElementById('ex-picker-overlay');
    const sheet = ov ? ov.querySelector('.sheet-fadeUp') : null;
    const hasFade = ov ? ov.className.includes('overlay-fade') : false;
    const hasSheet = !!sheet;
    document.getElementById('ex-picker-overlay')?.remove();
    return { hasFade, hasSheet };
  });
  console.log('5. 替换选择器动画:', JSON.stringify(overlayAnim));
  t('弹层 overlay-fade + sheet-fadeUp', overlayAnim.hasFade && overlayAnim.hasSheet);

  // 6. 按钮 btn-pop
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(300);
  const btnPop = await page.evaluate(() => document.querySelectorAll('.btn-pop').length);
  console.log('6. btn-pop 按钮数:', btnPop);
  t('➕/⏭ 有 btn-pop', btnPop >= 2, 'btn-pop=' + btnPop);

  // 7. AI 顾问页徽章
  await page.evaluate(() => { try { window.navigateTo && window.navigateTo('ai'); } catch(e) {} });
  await page.waitForTimeout(300);
  const aiBadge = await page.evaluate(() => document.body.querySelector('.nav-ai, .nav-ai-lg') ? document.body.textContent.includes('健身顾问') : false);
  console.log('7. AI 顾问页徽章:', aiBadge);

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
})();
