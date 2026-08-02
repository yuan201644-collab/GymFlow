const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem('app_tutorial_done', '1');
    localStorage.removeItem('fitness_records');
    localStorage.removeItem('fitness_settings');
    localStorage.removeItem('fitness_ai_server');
    localStorage.removeItem('fitness_ai_mode');
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 100)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(400);
  let pass = 0, fail = 0;
  const t = (n, c, d) => { if (c) pass++; else { fail++; console.log(`  ❌ ${n} ${d || ''}`); } };

  // 1. 组头按钮：V2.1 轮B 起组头 ➕ 已移入长按菜单，组头不再有按钮
  const btnInfo = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.group-header').forEach(gh => {
      const gr = gh.querySelector('.group-right');
      out.push({ label: gh.textContent.replace(/\s+/g, '').slice(0, 12), hasBtn: !!(gr && gr.querySelector('button')) });
    });
    return out;
  });
  console.log('1. 组头按钮:', JSON.stringify(btnInfo.slice(0, 4)), '…');
  t('组头无 ➕ 按钮（已收进长按菜单）', btnInfo.length > 0 && btnInfo.every(b => !b.hasBtn), JSON.stringify(btnInfo));

  // 2. 图标区分：组级无 🔄，清除进度仍 🔄
  const groupNoReset = await page.$$eval('.group-right button', els => els.filter(e => e.textContent.includes('🔄')).length);
  const resetIcon = await page.evaluate(() => { const r = [...document.querySelectorAll('.progress-count .history-link')].find(e => e.textContent.includes('🔄')); return r ? r.textContent : '无'; });
  console.log('2. 组级 🔄 残留:', groupNoReset, '| 清除进度图标:', resetIcon);
  t('组级无 🔄（已改 ➕）', groupNoReset === 0);
  t('清除进度仍 🔄 可区分', resetIcon.includes('🔄'));

  // 3. 选择器按 phase 过滤：从热身组打开 → 全是 warmup 动作
  const warmupPhase = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="warmup"]')][0];
    if (!card) return { err: 'no-warmup-card', count: document.querySelectorAll('.group-exercise-card').length };
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
    const eqDlg = document.getElementById('ex-picker-overlay')?.textContent?.includes('你的器械条件');
    if (eqDlg) { const btns = [...document.querySelectorAll('#ex-picker-overlay button')]; if (btns[0]) btns[0].click(); }
    await new Promise(r => setTimeout(r, 300));
    const cands = [...document.querySelectorAll('#ex-picker-list .ex-card')].map(c => { const n = c.querySelector('div[style*="font-weight:600"]'); return n ? n.textContent.trim() : ''; });
    const phases = cands.map(n => { const ex = EXERCISE_DB.find(e => e.name === n); return ex ? ex.phase : '?'; });
    const count = cands.length;
    const allWarmup = count > 0 && phases.every(p => p === 'warmup');
    document.getElementById('ex-picker-overlay')?.remove();
    return { count, allWarmup, sample: cands.slice(0, 3) };
  });
  console.log('3. 热身选择器:', JSON.stringify(warmupPhase));
  t('热身选择器候选>0 且全 warmup', warmupPhase.count > 0 && warmupPhase.allWarmup, JSON.stringify(warmupPhase));

  // 4. 拉伸组选择器 → 全 stretch
  const stretchPhase = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="stretch"]')][0];
    if (!card) return { err: 'no-stretch-card', count: document.querySelectorAll('.group-exercise-card').length };
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
    const eqDlg = document.getElementById('ex-picker-overlay')?.textContent?.includes('你的器械条件');
    if (eqDlg) { const btns = [...document.querySelectorAll('#ex-picker-overlay button')]; if (btns[0]) btns[0].click(); }
    await new Promise(r => setTimeout(r, 300));
    const cands = [...document.querySelectorAll('#ex-picker-list .ex-card')].map(c => { const n = c.querySelector('div[style*="font-weight:600"]'); return n ? n.textContent.trim() : ''; });
    const phases = cands.map(n => { const ex = EXERCISE_DB.find(e => e.name === n); return ex ? ex.phase : '?'; });
    const count = cands.length;
    const allStretch = count > 0 && phases.every(p => p === 'stretch');
    document.getElementById('ex-picker-overlay')?.remove();
    return { count, allStretch, sample: cands.slice(0, 3) };
  });
  console.log('4. 拉伸选择器:', JSON.stringify(stretchPhase));
  t('拉伸选择器候选>0 且全 stretch', stretchPhase.count > 0 && stretchPhase.allStretch, JSON.stringify(stretchPhase));

  // 5. 主组选择器仍 region+phase 过滤
  const mainPhase = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    if (!card) return { err: 'no-main-card', count: document.querySelectorAll('.group-exercise-card').length };
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
    const eqDlg = document.getElementById('ex-picker-overlay')?.textContent?.includes('你的器械条件');
    if (eqDlg) { const btns = [...document.querySelectorAll('#ex-picker-overlay button')]; if (btns[0]) btns[0].click(); }
    await new Promise(r => setTimeout(r, 300));
    const cands = [...document.querySelectorAll('#ex-picker-list .ex-card')].map(c => { const n = c.querySelector('div[style*="font-weight:600"]'); return n ? n.textContent.trim() : ''; });
    const phases = cands.map(n => { const ex = EXERCISE_DB.find(e => e.name === n); return ex ? ex.phase : '?'; });
    const allMain = cands.length > 0 && phases.every(p => p === 'main');
    document.getElementById('ex-picker-overlay')?.remove();
    return { count: cands.length, allMain, sample: cands.slice(0, 3) };
  });
  console.log('5. 主组选择器:', JSON.stringify(mainPhase));
  t('主组选择器全 main', mainPhase.allMain, JSON.stringify(mainPhase));

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
})();
