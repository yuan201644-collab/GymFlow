/* ============================================================
   V2.2 轮D — 人性化（可用性）测试
   覆盖四个维度（符合使用习惯）：
     ① 触控尺寸  关键可点元素触控区 ≥44×44px，图标可见 ≥28px
     ② 防误触    长按菜单不因单击/滑动误触发；AI球拖拽与滑屏互斥；竖滑不触发横向操作
     ③ 操作流顺畅 勾选→记录→组完成→完成训练→复盘，每步可达/可点/有反馈
     ④ 可见性    图标/文字可辨识、对比度合理、无重叠、390px 不破版
   运行：node usability_test.js （在 tests/ 目录下）
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
    localStorage.removeItem('fitness_coach_pos');
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('[pageerror] ' + e.message.slice(0, 120)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(400);
  // 关闭启动屏遮罩（真实使用 2s 后自动淡出；此处提前隐藏，保证真实指针事件命中目标而非 #splash）
  await page.evaluate(() => { const s = document.getElementById('splash'); if (s) s.classList.add('hide'); });
  await page.waitForTimeout(100);

  let pass = 0, fail = 0;
  const t = (n, c, d) => { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${d || ''}`); } };
  const wait = ms => page.waitForTimeout(ms);
  const cur = () => page.evaluate(() => typeof currentPage !== 'undefined' ? currentPage : '?');
  const go = p => page.evaluate(p => { try { window.navigateTo(p); } catch (e) { return 'ERR:' + e.message; } }, p);

  // 合成鼠标横滑（与 swipe_test 一致，dispatch 到 #app/window）
  const mouseSwipe = (fx, fy, tx, ty) => page.evaluate(([fx, fy, tx, ty]) => {
    const app = document.getElementById('app');
    const M = (x, y) => new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
    app.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: fx, clientY: fy }));
    const steps = 8;
    for (let i = 1; i <= steps; i++) window.dispatchEvent(M(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: tx, clientY: ty }));
  }, [fx, fy, tx, ty]);

  // 合成触摸竖滑（垂直方向，用于「竖滑不触发横向操作」）
  const touchSwipeV = (fx, fy, tx, ty) => page.evaluate(([fx, fy, tx, ty]) => {
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

  // 长按辅助（与 advice_ui_test 一致：卡片空白区 560ms）
  const longPressAt = async (x, y) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await wait(560);
    await page.mouse.up();
    await wait(120);
  };
  const longPressCard = async (idx) => {
    const pos = await page.evaluate((i) => {
      const cards = [...document.querySelectorAll('.group-exercise-card[data-ex]')];
      const card = cards[i];
      if (!card) return { err: 'no-card', count: cards.length };
      card.scrollIntoView({ block: 'center' });
      const r = card.getBoundingClientRect();
      const ignore = '.checkbox-custom, button, input, .advice-summary, .advice-card, .weight-row';
      for (let fy = 0.9; fy >= 0.2; fy -= 0.2) {
        for (let fx = 0.15; fx <= 0.85; fx += 0.2) {
          const x = r.left + r.width * fx;
          const y = r.top + r.height * fy;
          const el = document.elementFromPoint(x, y);
          if (el && el.closest && !el.closest(ignore)) return { x, y, ex: card.dataset.ex };
        }
      }
      return { err: 'no-point', ex: card.dataset.ex };
    }, idx);
    if (pos.err) return pos;
    await longPressAt(pos.x, pos.y);
    return pos;
  };

  // 元素中心点是否「可达」（未被遮挡，elementFromPoint 命中自身或子元素）
  const reachable = (sel) => page.evaluate((s) => {
    const el = typeof s === 'string' ? document.querySelector(s) : s;
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { hit: false, reason: 'zero-size' };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return {
      hit: !!(top && (top === el || el.contains(top))),
      topTag: top ? top.tagName + '.' + (top.className || '').toString().slice(0, 30) : 'none',
      offscreen: r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth,
    };
  }, sel);

  // 对比度（WCAG 相对亮度）
  const parseRgb = (str) => { const m = String(str).match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return null; return { r: +m[0], g: +m[1], b: +m[2], a: m[3] !== undefined ? +m[3] : 1 }; };
  const lum = (c) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); };

  // ============================================================
  console.log('\n=== 1. 触控尺寸（关键可点元素 ≥44×44，图标可见 ≥28px）===');
  // ============================================================
  // 1.1 动作卡按钮（AI🤖 + ☆收藏）
  const btnInfo = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex]');
    if (!card) return null;
    card.scrollIntoView({ block: 'center' });
    const btns = [...card.querySelectorAll('.icon-btn')];
    const ai = btns.find(b => b.textContent.includes('🤖'));
    const fav = btns.find(b => b.textContent === '☆' || b.textContent === '⭐');
    const rect = el => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    const font = el => parseFloat(getComputedStyle(el).fontSize);
    return { count: btns.length, aiRect: ai ? rect(ai) : null, aiFont: ai ? font(ai) : 0, favRect: fav ? rect(fav) : null, favFont: fav ? font(fav) : 0 };
  });
  console.log('1.1 动作卡按钮:', JSON.stringify(btnInfo));
  t('AI🤖 触控区 ≥44×44', btnInfo && btnInfo.aiRect && btnInfo.aiRect.w >= 44 && btnInfo.aiRect.h >= 44, JSON.stringify(btnInfo && btnInfo.aiRect));
  t('AI🤖 图标可见字号 ≥28px', btnInfo && btnInfo.aiFont >= 28, 'font=' + (btnInfo && btnInfo.aiFont));
  t('☆ 触控区 ≥44×44', btnInfo && btnInfo.favRect && btnInfo.favRect.w >= 44 && btnInfo.favRect.h >= 44, JSON.stringify(btnInfo && btnInfo.favRect));
  t('☆ 图标可见字号 ≥28px', btnInfo && btnInfo.favFont >= 28, 'font=' + (btnInfo && btnInfo.favFont));

  // 1.2 勾选框（触控区=整行 .checkbox-wrapper，视觉=圆形 24px）
  const cbInfo = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex]');
    if (!card) return null;
    card.scrollIntoView({ block: 'center' });
    const wrapper = card.querySelector('.checkbox-wrapper');
    const cb = card.querySelector('.checkbox-custom');
    const r1 = wrapper ? wrapper.getBoundingClientRect() : null;
    const r2 = cb ? cb.getBoundingClientRect() : null;
    return { hitW: r1 ? Math.round(r1.width) : 0, hitH: r1 ? Math.round(r1.height) : 0, visualW: r2 ? Math.round(r2.width) : 0, visualH: r2 ? Math.round(r2.height) : 0 };
  });
  console.log('1.2 勾选框:', JSON.stringify(cbInfo));
  t('勾选框触控区(整行)高度 ≥44px', cbInfo && cbInfo.hitH >= 44, JSON.stringify(cbInfo));
  t('勾选框视觉圆形 22-24px', cbInfo && cbInfo.visualW >= 22 && cbInfo.visualW <= 24, JSON.stringify(cbInfo));

  // 1.3 AI 球（FAB）
  const fabInfo = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    if (!fab) return null;
    const r = fab.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), font: parseFloat(getComputedStyle(fab).fontSize), text: (fab.textContent || '').trim() };
  });
  console.log('1.3 AI球:', JSON.stringify(fabInfo));
  t('AI球 触控区 ≥44×44', fabInfo && fabInfo.w >= 44 && fabInfo.h >= 44, JSON.stringify(fabInfo));
  t('AI球「AI」可见字号 ≥28px', fabInfo && fabInfo.font >= 28, 'font=' + (fabInfo && fabInfo.font));
  t('AI球 可达(未被遮挡)', fabInfo && (await reachable('#ai-coach-fab')).hit === true, JSON.stringify(await reachable('#ai-coach-fab')));

  // 1.4 长按菜单项
  const lp1 = await longPressCard(0);
  const menuInfo = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    if (!items.length) return { count: 0, heights: [], minH: 0 };
    return { count: items.length, heights: items.map(i => Math.round(i.getBoundingClientRect().height)), minH: Math.min(...items.map(i => i.getBoundingClientRect().height)) };
  });
  console.log('1.4 长按菜单项:', JSON.stringify(menuInfo));
  t('长按菜单项 ≥44px 高', menuInfo.count > 0 && menuInfo.minH >= 44, JSON.stringify(menuInfo));
  await page.evaluate(() => window.closeCardMenu());
  await wait(150);

  // 1.5 底部完成栏
  const barInfo = await page.evaluate(() => {
    const bar = document.getElementById('bottom-bar');
    if (!bar) return null;
    const btns = [...bar.querySelectorAll('button')];
    const rects = btns.map(b => { const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), text: (b.textContent || '').trim().slice(0, 10) }; });
    return { count: btns.length, rects, minH: rects.length ? Math.min(...rects.map(x => x.h)) : 0 };
  });
  console.log('1.5 底部完成栏:', JSON.stringify(barInfo));
  t('底部完成栏按钮 ≥44px 高', barInfo && barInfo.count >= 2 && barInfo.minH >= 44, JSON.stringify(barInfo));
  const finishReach = await reachable('#finish-btn');
  t('「完成训练」按钮可达', finishReach && finishReach.hit === true, JSON.stringify(finishReach));

  // 1.6 建议卡「🤖 问 AI」按钮（展开建议卡后测量）
  const aaiInfo = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    sum.click();
    await new Promise(r => setTimeout(r, 250));
    const btn = document.querySelector('.advice-ai-btn');
    const r = btn ? btn.getBoundingClientRect() : null;
    sum.click(); // 收起
    return { err: btn ? null : '无问AI按钮', w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0 };
  });
  console.log('1.6 问AI按钮:', JSON.stringify(aaiInfo));
  t('建议卡「问AI」按钮 ≥44px 高', aaiInfo.err === null && aaiInfo.h >= 44, JSON.stringify(aaiInfo));

  // 1.7 日期切换按钮
  const dayInfo = await page.evaluate(() => {
    const b = document.querySelector('.day-switch-btn');
    if (!b) return null;
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('1.7 日期切换按钮:', JSON.stringify(dayInfo));
  t('日期切换按钮 ≥44px 高', dayInfo && dayInfo.h >= 44, JSON.stringify(dayInfo));

  // 1.8 卡片底部常驻录入行输入框（重量/组数/次数）——触控尺寸重点核查
  const inputInfo = await page.evaluate(() => {
    const row = document.querySelector('.card-record-row');
    if (!row) return null;
    row.scrollIntoView({ block: 'center' });
    const inputs = [...row.querySelectorAll('.weight-input-sm')];
    return inputs.map(i => { const r = i.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width) }; });
  });
  console.log('1.8 常驻录入行输入:', JSON.stringify(inputInfo));
  t('录入行 3 个输入框(重量/组数/次数)', inputInfo && inputInfo.length === 3, JSON.stringify(inputInfo));
  const inputMinH = inputInfo ? Math.min(...inputInfo.map(x => x.h)) : 0;
  t('录入行输入框高度 ≥44px（触控标准）', inputInfo && inputMinH >= 44, 'minH=' + inputMinH + ' ' + JSON.stringify(inputInfo));

  // ============================================================
  console.log('\n=== 2. 防误触 ===');
  // ============================================================
  // 2.1 单击卡片空白 → 不弹长按菜单
  const blank = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.group-exercise-card[data-ex]')];
    const card = cards[0];
    if (!card) return { err: 'no-card' };
    card.scrollIntoView({ block: 'center' });
    const r = card.getBoundingClientRect();
    const ignore = '.checkbox-custom, button, input, .advice-summary, .advice-card, .weight-row';
    for (let fy = 0.9; fy >= 0.2; fy -= 0.2) {
      for (let fx = 0.15; fx <= 0.85; fx += 0.2) {
        const x = r.left + r.width * fx;
        const y = r.top + r.height * fy;
        const el = document.elementFromPoint(x, y);
        if (el && el.closest && !el.closest(ignore)) return { x, y, ex: card.dataset.ex };
      }
    }
    return { err: 'no-point' };
  });
  if (!blank.err) {
    await page.mouse.click(blank.x, blank.y, { delay: 60 });
    await wait(200);
  }
  const menuAfterClick = await page.evaluate(() => !!document.getElementById('card-menu-overlay'));
  t('2.1 单击卡片不弹长按菜单', blank.err ? false : menuAfterClick === false, JSON.stringify(blank) + ' menu=' + menuAfterClick);

  // 2.2 横向快速滑动 → 不误弹菜单（切页是预期，菜单弹出才是误触）
  await go('training'); await wait(300);
  await mouseSwipe(360, 300, 30, 300);
  await wait(400);
  const afterSwipe = await page.evaluate(() => ({ menu: !!document.getElementById('card-menu-overlay'), cur: typeof currentPage !== 'undefined' ? currentPage : '?' }));
  t('2.2 横滑不误弹长按菜单', afterSwipe.menu === false, JSON.stringify(afterSwipe));
  await go('training'); await wait(300);

  // 2.3 竖滑（垂直滚动）→ 不触发页面切换
  await go('training'); await wait(300);
  const beforeV = await cur();
  touchSwipeV(200, 200, 200, 600);   // 向下滑动 400px
  await wait(400);
  const afterV = await cur();
  const afterVMenu = await page.evaluate(() => !!document.getElementById('card-menu-overlay'));
  t('2.3 竖滑不触发页面切换', beforeV === afterV, 'before=' + beforeV + ' after=' + afterV);
  t('2.3b 竖滑不误弹菜单', afterVMenu === false, 'menu=' + afterVMenu);

  // 2.4 AI 球拖动 → 不触发页面切换（拖拽与滑屏互斥）
  await go('training'); await wait(300);
  const fabPos = await page.evaluate(() => {
    localStorage.removeItem('fitness_coach_pos');
    const fab = document.getElementById('ai-coach-fab');
    const r = fab.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  await page.mouse.move(fabPos.cx, fabPos.cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(fabPos.cx - 90 * i / 10, fabPos.cy + 30 * i / 10);
  await page.mouse.up();
  await wait(300);
  const fabAfter = await page.evaluate(() => ({ cur: typeof currentPage !== 'undefined' ? currentPage : '?', menu: !!document.getElementById('card-menu-overlay'), pos: localStorage.getItem('fitness_coach_pos') }));
  t('2.4 AI球拖动不触发页面切换', fabAfter.cur === 'training', JSON.stringify(fabAfter));
  t('2.4b AI球拖动不误弹菜单', fabAfter.menu === false, JSON.stringify(fabAfter));
  // 复位 FAB 位置
  await page.evaluate(() => { localStorage.removeItem('fitness_coach_pos'); window.renderTrainingPage(); });
  await wait(300);

  // 2.5 长按落在 AI🤖 按钮 → 不弹菜单（可交互目标忽略）
  const aiBtnPos = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex]');
    const btn = card ? [...card.querySelectorAll('.icon-btn')].find(b => b.textContent.includes('🤖')) : null;
    if (!btn) return { err: 'no-ai-btn' };
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!aiBtnPos.err) {
    await page.mouse.move(aiBtnPos.x, aiBtnPos.y);
    await page.mouse.down();
    await wait(560);
    await page.mouse.up();
    await wait(150);
  }
  const menuAfterAiLong = await page.evaluate(() => !!document.getElementById('card-menu-overlay'));
  t('2.5 长按落在 AI🤖 不弹菜单', aiBtnPos.err ? false : menuAfterAiLong === false, 'err=' + (aiBtnPos.err || 'none') + ' menu=' + menuAfterAiLong);

  // ============================================================
  console.log('\n=== 3. 操作流顺畅（关键路径：勾选→记录→组完成→完成训练→复盘）===');
  // ============================================================
  // 预置设备偏好，避免替换选择器弹设备选择
  await page.evaluate(async () => {
    const s = window.getSettings();
    if (!s.userInfo) s.userInfo = {};
    s.userInfo.equipment = '商业健身房(器械很全)';
    window.saveSettings(s);
  });
  await wait(200);

  // mock AI 复盘接口
  let aiMock = { success: true, answer: '【小结】完成度优秀\n【评分】88分\n【评价】继续保持', count: 0 };
  await page.route('**/api/ask', async route => {
    aiMock.count++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: aiMock.success, answer: aiMock.answer }) });
  });

  // 3.1 勾选动作 → 卡片 completed + 勾选态 ✓
  const flowInfo = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    if (!card) return { err: '无主组动作卡' };
    const exName = card.dataset.ex, gid = card.dataset.groupid;
    card.scrollIntoView({ block: 'center' });
    const cb = card.querySelector('.checkbox-custom');
    if (!cb) return { err: '无勾选框' };
    cb.click();
    await new Promise(r => setTimeout(r, 250));
    const rec = window.getTodayRecord();
    const e = rec.exercises.find(x => x.name === exName && x.groupId === gid);
    return {
      cardCompleted: card.classList.contains('completed'),
      cbChecked: cb.classList.contains('checked'),
      cbText: cb.textContent,
      recordCompleted: !!(e && e.completed),
      exName, gid,
    };
  });
  console.log('3.1 勾选动作:', JSON.stringify(flowInfo));
  t('3.1a 勾选动作 → 卡片 completed 态', flowInfo.err === undefined && flowInfo.cardCompleted === true, JSON.stringify(flowInfo));
  t('3.1b 勾选动作 → 勾选框 ✓ 态（反馈）', flowInfo.err === undefined && flowInfo.cbChecked === true && flowInfo.cbText === '✓', JSON.stringify(flowInfo));
  t('3.1c 勾选动作 → 写入当日记录', flowInfo.err === undefined && flowInfo.recordCompleted === true, JSON.stringify(flowInfo));

  // 3.2 记录重量/组数/次数 → 输入值持久 + 写当日记录
  const recInfo = await page.evaluate(async ({ exName, gid }) => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex]')].find(c => c.dataset.ex === exName && c.dataset.groupid === gid);
    const row = card ? card.querySelector('.card-record-row') : null;
    if (!row) return { err: '无常驻录入行' };
    row.scrollIntoView({ block: 'center' });
    const inputs = row.querySelectorAll('.weight-input-sm');
    if (inputs.length < 3) return { err: '输入数<3' };
    const reachableBefore = [...inputs].every(i => { const r = i.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    inputs[0].value = '40'; inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    inputs[1].value = '3'; inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    inputs[2].value = '10'; inputs[2].dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const rec = window.getTodayRecord();
    const e = rec.exercises.find(x => x.name === exName && x.groupId === gid);
    const inputsAfter = row.querySelectorAll('.weight-input-sm');
    return {
      reachableBefore,
      weight: e ? e.weight : null, sets: e ? e.sets : null, reps: e ? e.reps : null,
      persisted: inputsAfter[0].value === '40' && inputsAfter[1].value === '3' && inputsAfter[2].value === '10',
    };
  }, { exName: flowInfo.exName, gid: flowInfo.gid });
  console.log('3.2 记录重量/组数/次数:', JSON.stringify(recInfo));
  t('3.2a 录入行输入框在视口内(可点)', recInfo.err === undefined && recInfo.reachableBefore === true, JSON.stringify(recInfo));
  t('3.2b 录入 重量/组数/次数 写入当日记录', recInfo.err === undefined && recInfo.weight === 40 && recInfo.sets === 3 && recInfo.reps === 10, JSON.stringify(recInfo));
  t('3.2c 输入值录入后持久显示(反馈)', recInfo.err === undefined && recInfo.persisted === true, JSON.stringify(recInfo));

  // 3.3 组完成 → 组头 ✅（完成主组全部动作）
  const groupInfo = await page.evaluate(async () => {
    const mainCards = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')];
    if (!mainCards.length) return { err: '无主组卡' };
    const gid = mainCards[0].dataset.groupid;
    const sec = mainCards[0].dataset.sec, grp = mainCards[0].dataset.grp;
    // 完成该组所有未完成的卡
    const cards = [...document.querySelectorAll('.group-exercise-card[data-ex]')].filter(c => c.dataset.groupid === gid);
    for (const c of cards) {
      const cb = c.querySelector('.checkbox-custom');
      if (cb && !cb.classList.contains('checked')) { cb.click(); await new Promise(r => setTimeout(r, 180)); }
    }
    await new Promise(r => setTimeout(r, 500));
    const gh = document.getElementById('gh-' + sec + '-' + grp);
    const label = gh ? gh.querySelector('.group-target-label') : null;
    const rec = window.getTodayRecord();
    const doneCount = cards.filter(c => { const e = rec.exercises.find(x => x.name === c.dataset.ex && x.groupId === gid); return e && e.completed; }).length;
    return { groupDone: gh ? gh.classList.contains('group-done') : false, label: label ? label.textContent : '', doneCount, total: cards.length };
  });
  console.log('3.3 组完成:', JSON.stringify(groupInfo));
  t('3.3a 完成组内全部动作 → 组头 group-done', groupInfo.err === undefined && groupInfo.groupDone === true, JSON.stringify(groupInfo));
  t('3.3b 组头目标文案 🎯→✅（反馈）', groupInfo.err === undefined && (groupInfo.label || '').includes('✅'), groupInfo.label);

  // 3.4 完成训练 → 庆祝动画 + 记录 completed
  const finishReach2 = await reachable('#finish-btn');
  t('3.4a 「完成训练」按钮可达', finishReach2 && finishReach2.hit === true, JSON.stringify(finishReach2));
  await page.evaluate(() => document.getElementById('finish-btn').click());
  await wait(400);
  const finishInfo = await page.evaluate(() => {
    const cel = document.getElementById('celebration');
    const rec = window.getTodayRecord();
    return { celebrationShown: cel && !cel.classList.contains('celebration-hidden'), recordCompleted: rec.completed === true };
  });
  console.log('3.4 完成训练:', JSON.stringify(finishInfo));
  t('3.4b 完成训练 → 庆祝动画显示（反馈）', finishInfo.celebrationShown === true, JSON.stringify(finishInfo));
  t('3.4c 完成训练 → 当日记录 completed=true', finishInfo.recordCompleted === true, JSON.stringify(finishInfo));

  // 3.5 复盘 → 评分卡出现（mock AI）
  await page.evaluate(() => window.closeCelebration());
  await wait(200);
  const ratingReach = await reachable('#bottom-bar .btn-outline');
  t('3.5a 「评分/复盘」按钮可达', ratingReach && ratingReach.hit === true, JSON.stringify(ratingReach));
  await page.evaluate(() => document.querySelector('#bottom-bar .btn-outline').click());
  await wait(800);
  const ratingInfo = await page.evaluate(() => {
    const card = document.querySelector('.rating-card');
    return { exists: !!card, text: card ? card.textContent.slice(0, 60) : '' };
  });
  console.log('3.5 复盘:', JSON.stringify(ratingInfo), 'aiCalls=' + aiMock.count);
  t('3.5b 复盘 → 评分卡渲染 AI 小结', ratingInfo.exists === true && (ratingInfo.text || '').includes('AI 复盘小结'), JSON.stringify(ratingInfo));
  t('3.5c 复盘 → 调用 AI 接口', aiMock.count >= 1, 'count=' + aiMock.count);

  // ============================================================
  console.log('\n=== 4. 可见性（图标/文字可辨识、对比度合理、无重叠、390px 不破版）===');
  // ============================================================
  // 4.1 390px 无横向溢出（训练页 / 长按菜单 / 浮层）
  const ov1 = await page.evaluate(() => ({ body: document.body.scrollWidth, doc: document.documentElement.scrollWidth, vw: window.innerWidth }));
  t('4.1a 训练页 390px 无横向溢出', ov1.body <= ov1.vw && ov1.doc <= ov1.vw, JSON.stringify(ov1));

  // 4.2 常驻录入行不超出卡片宽度（内部无横向溢出）
  const rowOv = await page.evaluate(() => {
    const row = document.querySelector('.card-record-row');
    if (!row) return null;
    return { sw: row.scrollWidth, cw: row.clientWidth, overflow: row.scrollWidth > row.clientWidth + 1 };
  });
  console.log('4.2 录入行溢出:', JSON.stringify(rowOv));
  t('4.2a 录入行不横向溢出卡片', rowOv && rowOv.overflow === false, JSON.stringify(rowOv));

  // 4.3 录入行与卡片边界无重叠（行在卡片内；V2.2 轮E 起仅主组卡有录入行）
  const rowInCard = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex][data-phase="main"]');
    const row = card ? card.querySelector('.card-record-row') : null;
    if (!card || !row) return null;
    const cr = card.getBoundingClientRect(), rr = row.getBoundingClientRect();
    return { inside: rr.left >= cr.left - 1 && rr.right <= cr.right + 1, rowTop: Math.round(rr.top), cardBottom: Math.round(cr.bottom) };
  });
  console.log('4.3 录入行在卡内:', JSON.stringify(rowInCard));
  t('4.3a 录入行完全位于卡片内(无重叠)', rowInCard && rowInCard.inside === true, JSON.stringify(rowInCard));

  // 4.4 底部完成栏 与 AI 球 不重叠（底部关键控件）
  const barFabOverlap = await page.evaluate(() => {
    const bar = document.getElementById('bottom-bar');
    const fab = document.getElementById('ai-coach-fab');
    if (!bar || !fab) return null;
    const b = bar.getBoundingClientRect(), f = fab.getBoundingClientRect();
    const overlap = !(b.right < f.left || b.left > f.right || b.bottom < f.top || b.top > f.bottom);
    return { overlap, barBottom: Math.round(b.bottom), fabTop: Math.round(f.top) };
  });
  console.log('4.4 底部栏与AI球:', JSON.stringify(barFabOverlap));
  t('4.4a 底部完成栏与 AI 球不重叠', barFabOverlap && barFabOverlap.overlap === false, JSON.stringify(barFabOverlap));

  // 4.5 关键文字对比度（WCAG 相对亮度，合理 ≥3）
  const contrastInfo = await page.evaluate(() => {
    const specs = [
      ['卡标题', '.card-title'], ['卡meta', '.card-meta'],
      ['日期按钮', '.day-switch-btn'], ['菜单项', '.card-menu-item'],
      ['要点', '.advice-detail-points'], ['⚠️注意', '.advice-detail-warn'],
      ['标签chip', '.advice-chip'], ['底部按钮', '#bottom-bar .btn'],
    ];
    // 有效背景 = 从最外层不透明背景向内 alpha 混合（真实渲染颜色）
    const bgOf = el => {
      const layers = [];
      let n = el;
      while (n) {
        const c = getComputedStyle(n).backgroundColor;
        const m = String(c).match(/rgba?\(([^)]+)\)/);
        if (m) {
          const p = m[1].split(',').map(Number);
          const a = p[3] !== undefined ? p[3] : 1;
          if (a > 0.02) layers.push({ r: p[0], g: p[1], b: p[2], a });
        }
        if (n === document.documentElement) break;
        n = n.parentElement;
      }
      layers.reverse(); // 外层在前
      let bg;
      if (layers.length && layers[0].a >= 0.99) {
        bg = { r: layers[0].r, g: layers[0].g, b: layers[0].b };
        layers.shift();
      } else {
        bg = { r: 255, g: 255, b: 255 };
      }
      for (const l of layers) {
        bg.r = l.r * l.a + bg.r * (1 - l.a);
        bg.g = l.g * l.a + bg.g * (1 - l.a);
        bg.b = l.b * l.a + bg.b * (1 - l.a);
      }
      return `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`;
    };
    const parse = s => { const m = String(s).match(/\d+/g); return m && m.length >= 3 ? { r: +m[0], g: +m[1], b: +m[2] } : null; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    const out = [];
    specs.forEach(([name, sel]) => {
      const el = document.querySelector(sel);
      if (!el) { out.push({ name, sel, missing: true }); return; }
      const fg = parse(getComputedStyle(el).color);
      const bg = parse(bgOf(el));
      if (!fg || !bg) { out.push({ name, sel, missing: true }); return; }
      out.push({ name, ratio: Math.round(ratio(fg, bg) * 10) / 10 });
    });
    return out;
  });
  console.log('4.5 对比度:', JSON.stringify(contrastInfo));
  const contrastFail = (contrastInfo || []).filter(c => !c.missing && c.ratio < 3);
  t('4.5a 关键文字对比度 ≥3（合理辨识）', contrastFail.length === 0, JSON.stringify(contrastFail));

  // 4.6 长按菜单打开 390px 无横向溢出
  const lp2 = await longPressCard(0);
  const menuOv = await page.evaluate(() => ({ body: document.body.scrollWidth, doc: document.documentElement.scrollWidth, vw: window.innerWidth }));
  console.log('4.6 菜单溢出:', JSON.stringify(menuOv));
  t('4.6a 长按菜单 390px 无横向溢出', menuOv.body <= menuOv.vw && menuOv.doc <= menuOv.vw, JSON.stringify(menuOv));
  await page.evaluate(() => window.closeCardMenu());
  await wait(150);

  console.log('\n=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
