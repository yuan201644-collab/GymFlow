/* ============================================================
   GymFlow — 左右滑屏切换主页面（swipe.js）UI 测试
   覆盖：左右滑导航 / 弹层阻断 / 竖滑不触发 / 横向滚动区不触发 /
         顶部导航栏不触发 / 防连滑锁 / 触摸路径 / 视觉复位 / 无JS错误
   滑动模拟：合成 MouseEvent/TouchEvent 直接 dispatch 到 #app/window
             （精确触发 swipe.js 同一套监听器，确定性高），
             另含 1 条真实 page.mouse 拖拽验证桌面可测性。
   ============================================================ */
const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.addInitScript(() => {
    localStorage.setItem('app_tutorial_done', '1');
    localStorage.removeItem('fitness_records');
    localStorage.removeItem('fitness_settings');
    localStorage.removeItem('fitness_ai_server');
    localStorage.removeItem('fitness_ai_mode');
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('[pageerror] ' + e.message.slice(0, 120)));

  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(300);

  let pass = 0, fail = 0;
  const t = (n, c, d) => { if (c) pass++; else { fail++; console.log(`  ❌ ${n} ${d || ''}`); } };

  // ---- 工具 ----
  const cur = () => page.evaluate(() => typeof currentPage !== 'undefined' ? currentPage : '?');
  const active = () => page.evaluate(() => { const a = document.querySelector('.page.active'); return a ? a.id.replace('page-', '') : null; });
  const go = p => page.evaluate(p => { try { window.navigateTo(p); } catch (e) { return 'ERR:' + e.message; } }, p);
  const wait = ms => page.waitForTimeout(ms);

  // 合成鼠标横滑（mousedown 在 #app，mousemove/mouseup 在 window）
  const mouseSwipe = (fx, fy, tx, ty) => page.evaluate(([fx, fy, tx, ty]) => {
    const app = document.getElementById('app');
    const M = (x, y) => new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
    app.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: fx, clientY: fy }));
    const steps = 8;
    for (let i = 1; i <= steps; i++) window.dispatchEvent(M(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: tx, clientY: ty }));
  }, [fx, fy, tx, ty]);

  // 合成触摸横滑
  const touchSwipe = (fx, fy, tx, ty) => page.evaluate(([fx, fy, tx, ty]) => {
    const app = document.getElementById('app');
    const mk = (id, x, y) => new Touch({ identifier: id, target: app, clientX: x, clientY: y, screenX: x, screenY: y });
    let tc = mk(1, fx, fy);
    app.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [tc], targetTouches: [tc], changedTouches: [tc] }));
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      tc = mk(1, fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps);
      app.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [tc], targetTouches: [tc], changedTouches: [tc] }));
    }
    const te = mk(1, tx, ty);
    app.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [te] }));
  }, [fx, fy, tx, ty]);

  // 从某元素中心开始的鼠标横滑（测横向滚动区域/导航栏排除）
  const mouseSwipeFromEl = (sel, tx, ty) => page.evaluate(([sel, tx, ty]) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const fx = r.left + r.width / 2, fy = r.top + r.height / 2;
    const M = (x, y) => new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: fx, clientY: fy }));
    const steps = 8;
    for (let i = 1; i <= steps; i++) window.dispatchEvent(M(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: tx, clientY: ty }));
    return true;
  }, [sel, tx, ty]);

  console.log('=== swipe 测试开始 ===');

  // 0. 测试挂钩存在
  const hooks = await page.evaluate(() => { const h = window.__swipeHooks; return h ? [typeof h.isOverlayOpen, typeof h.isInsideHScroll, typeof h.isInTopBar].join(',') : 'missing'; });
  t('0. __swipeHooks 挂钩存在', hooks === 'function,function,function', hooks);

  // 1. 初始状态
  t('1. 初始在训练页', (await cur()) === 'training' && (await active()) === 'training');

  // 2. 左滑 训练→AI
  await mouseSwipe(370, 400, 20, 400);
  await wait(400);
  t('2. 左滑训练→AI', (await cur()) === 'ai' && (await active()) === 'ai', 'cur=' + await cur());

  // 3. 左滑后视觉复位（swiping 类移除 + transform 清空）
  const vis = await page.evaluate(() => {
    const app = document.getElementById('app');
    return { swiping: app.classList.contains('swiping'), transform: app.style.transform };
  });
  t('3. 视觉复位（无swiping类、transform空）', !vis.swiping && vis.transform === '', JSON.stringify(vis));

  // 4. 右滑 AI→训练
  await mouseSwipe(20, 400, 370, 400);
  await wait(400);
  t('4. 右滑AI→训练', (await cur()) === 'training', 'cur=' + await cur());

  // 5. 右滑 训练→我的（任务明确要求）
  await mouseSwipe(20, 400, 370, 400);
  await wait(400);
  t('5. 右滑训练→我的', (await cur()) === 'me', 'cur=' + await cur());

  // 6. 左滑 我的→训练（环形闭合）
  await mouseSwipe(370, 400, 20, 400);
  await wait(400);
  t('6. 左滑我的→训练', (await cur()) === 'training', 'cur=' + await cur());

  // 7. 防连滑锁：刚切完立刻再滑 → 不变
  await mouseSwipe(370, 400, 20, 400);           // training→ai，触发后设 lastLock
  await mouseSwipe(370, 400, 20, 400);           // 立刻再滑（LOCK_MS 内）→ 应被忽略
  t('7. 连滑锁：300ms内第二次滑动被忽略', (await cur()) === 'ai', 'cur=' + await cur());

  // 8. 锁恢复：等 400ms 后再滑 → 正常导航 ai→features
  await wait(400);
  await mouseSwipe(370, 400, 20, 400);
  await wait(400);
  t('8. 锁恢复：延迟后再滑正常', (await cur()) === 'features', 'cur=' + await cur());

  // 9. 弹层-AI教练浮层打开时滑动不切换
  await go('training'); await wait(300);
  await page.evaluate(() => window.openAICoach());
  await wait(200);
  await mouseSwipe(370, 400, 20, 400);
  t('9. AI教练浮层打开时滑动不切换', (await cur()) === 'training', 'cur=' + await cur());
  await page.evaluate(() => { document.getElementById('ai-coach-overlay')?.remove(); });

  // 10. 弹层-方案切换打开时滑动不切换
  await wait(300);
  await page.evaluate(() => window.switchPlan());
  await wait(200);
  await mouseSwipe(370, 400, 20, 400);
  t('10. 方案切换弹层打开时滑动不切换', (await cur()) === 'training', 'cur=' + await cur());
  await page.evaluate(() => window.closePlanSwitcher());
  await wait(300);

  // 11. 弹层-替换选择器打开时滑动不切换（V2.1 轮B：入口改为直调 openExercisePicker，组头 ➕ 已移除）
  const pickerOpened = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex]')][0];
    if (!card) return 'no-card';
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
    const eqDlg = document.getElementById('ex-picker-overlay')?.textContent?.includes('你的器械条件');
    if (eqDlg) { const btns = [...document.querySelectorAll('#ex-picker-overlay button')]; if (btns[0]) btns[0].click(); }
    await new Promise(r => setTimeout(r, 300));
    return document.getElementById('ex-picker-overlay') ? 'open' : 'closed';
  });
  if (pickerOpened === 'open') {
    await mouseSwipe(370, 400, 20, 400);
    await page.evaluate(() => { document.getElementById('ex-picker-overlay')?.remove(); });
    await wait(300);
    t('11. 替换选择器打开时滑动不切换', (await cur()) === 'training', 'cur=' + await cur());
  } else {
    t('11. 替换选择器打开时滑动不切换', false, '选择器未打开: ' + pickerOpened);
  }

  // 12. 竖滑（dy 主导）不触发
  await mouseSwipe(200, 300, 210, 600);
  await wait(400);
  t('12. 竖滑不触发', (await cur()) === 'training', 'cur=' + await cur());

  // 13. 触摸路径：左滑训练→AI
  await touchSwipe(370, 400, 20, 400);
  await wait(400);
  t('13. 触摸左滑训练→AI', (await cur()) === 'ai', 'cur=' + await cur());

  // 14. 触摸路径：竖滑不触发
  await touchSwipe(200, 300, 210, 600);
  await wait(400);
  t('14. 触摸竖滑不触发', (await cur()) === 'ai', 'cur=' + await cur());

  // 15. 横向滚动区（day-switcher）内开始的手势不触发
  await go('training'); await wait(300);
  const swipedFromDS = await mouseSwipeFromEl('.day-switch-btn', 20, 500);
  await wait(300);
  t('15. day-switcher 内滑动不触发', swipedFromDS === true && (await cur()) === 'training', 'cur=' + await cur() + ', found=' + swipedFromDS);

  // 16. day-switcher 按钮正常点击仍可用（控制项）
  const dayClick = await page.evaluate(async () => {
    const btns = [...document.querySelectorAll('.day-switch-btn')];
    if (!btns.length) return 'no-btn';
    const before = document.querySelector('.day-switch-btn.active')?.textContent || '';
    btns[0].click();
    await new Promise(r => setTimeout(r, 250));
    return { before, after: document.querySelector('.day-switch-btn.active')?.textContent || '' };
  });
  t('16. day-switcher 按钮点击正常', dayClick !== 'no-btn', JSON.stringify(dayClick));
  await wait(300);

  // 17. 顶部导航栏滑动不触发 + tab 点击正常
  await go('training'); await wait(300);
  const topBarResult = await page.evaluate(() => {
    const tab = document.querySelector('.top-tab[data-page="ai"]');
    const r = tab.getBoundingClientRect();
    const fx = r.left + r.width / 2, fy = r.top + r.height / 2;
    const M = (x, y) => new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
    tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: fx, clientY: fy }));
    for (let i = 1; i <= 8; i++) window.dispatchEvent(M(fx - 40 * i, fy));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: fx - 40 * 8, clientY: fy }));
    return typeof currentPage !== 'undefined' ? currentPage : '?';
  });
  t('17. 顶部导航栏滑动不触发', topBarResult === 'training', 'cur=' + topBarResult);
  await page.click('.top-tab[data-page="features"]');
  await wait(400);
  t('17b. 顶栏 tab 点击仍正常', (await cur()) === 'features', 'cur=' + await cur());

  // 18. 真实 page.mouse 拖拽（桌面可测性）：左拖 next、右拖 prev
  await page.mouse.move(385, 200);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(385 - 380 * i / 8, 200);
  await page.mouse.up();
  await wait(400);
  t('18. 真实鼠标左拖 features→me（next）', (await cur()) === 'me', 'cur=' + await cur());
  await page.mouse.move(5, 200);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(5 + 380 * i / 8, 200);
  await page.mouse.up();
  await wait(400);
  t('18b. 真实鼠标右拖 me→features（prev）', (await cur()) === 'features', 'cur=' + await cur());

  // 19. 全程无 JS 错误
  t('19. 全程无 JS 错误', errs.length === 0, errs.slice(0, 3).join(' | '));

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
