/* 训练页改造 定向测试：自定义替换完成判定 + 部分完成结算 */
const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem('app_tutorial_done', '1');
    localStorage.removeItem('fitness_records');
    localStorage.removeItem('fitness_settings');
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 130)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 130)));
  let lastDialogMsg = '';
  page.on('dialog', async d => { lastDialogMsg = d.message(); await d.dismiss(); });
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => { try { window.renderTrainingPage(); } catch (e) { console.error(e.message); } });
  await page.waitForTimeout(400);

  const findGroupByLabel = async (kw) => page.evaluate((kw) => {
    const plan = getTrainingPlan(getTodayRecord().type);
    const allGroups = getAllGroups(plan);
    return allGroups.findIndex(g => (g.label || '').includes(kw));
  }, kw);

  // ── T1: 自定义替换动作的组完成判定（疑点）──
  // 找中胸组（主组，有 🔄 按钮），给它加一个自定义动作并勾选
  const zhongIdx = await findGroupByLabel('中胸');
  console.log('T1. 中胸组 index:', zhongIdx);
  // 打开该组替换选择器：🔄 按钮在 group-header 内部 .group-right 里
  await page.evaluate((i) => {
    const headers = [...document.querySelectorAll('.group-header')];
    const target = headers.find(h => h.textContent.includes('中胸'));
    if (!target) return 'no group';
    const pickerBtn = [...target.querySelectorAll('.group-right button')].find(b => b.textContent.includes('🔄'));
    if (pickerBtn) { pickerBtn.click(); return 'clicked'; }
    return 'no btn';
  }, zhongIdx);
  await page.waitForTimeout(400);
  // P2-3：首次打开若弹「设备选择」→ 选商业健身房
  const hasEquipDialog = await page.evaluate(() => (document.getElementById('ex-picker-overlay') || {}).textContent?.includes('你的器械条件') || false);
  if (hasEquipDialog) {
    await page.evaluate(() => setEquipmentPref(0));
    await page.waitForTimeout(400);
  }
  const pickerCount = await page.$$eval('#ex-picker-list .ex-card', els => els.length);
  const pickerFirst = await page.evaluate(() => { const c = document.querySelector('#ex-picker-list .ex-card'); return c ? c.textContent.slice(0, 30) : ''; });
  console.log('T1. 选择器候选数:', pickerCount, '| 第一个:', pickerFirst);
  if (pickerCount === 0) console.log('T1. ❌ 选择器 0 候选（替换功能不可用）');
  // 选第 2 个候选（尽量避开默认动作）
  await page.evaluate(() => { const c = document.querySelectorAll('#ex-picker-list .ex-card'); if (c[1]) c[1].click(); else if (c[0]) c[0].click(); });
  await page.waitForTimeout(500);
  const customState = await page.evaluate(() => {
    const record = getTodayRecord();
    const plan = getTrainingPlan(record.type);
    const g = getAllGroups(plan).find(x => (x.label || '').includes('中胸'));
    return {
      groupLabel: g.label, planExs: (g.exercises || []).map(e => e.name),
      customExs: record.exercises.filter(e => e.groupId === g.id && e.custom).map(e => e.name),
      completedNow: isGroupCompleted(g, record),
    };
  });
  console.log('T1. 加自定义后 (未勾选):', JSON.stringify(customState));
  // 勾选自定义动作卡片（找含 equipment/meta 的最新卡片，即渲染顺序里追加的自定义卡）
  await page.evaluate(() => {
    const record = getTodayRecord();
    const g = getAllGroups(getTrainingPlan(record.type)).find(x => (x.label || '').includes('中胸'));
    const custName = record.exercises.find(e => e.groupId === g.id && e.custom);
    if (!custName) return 'no custom';
    const cards = [...document.querySelectorAll('.group-exercise-card')];
    const card = cards.find(c => c.textContent.includes(custName.name));
    if (card) { const cb = card.querySelector('.checkbox-wrapper'); if (cb) cb.click(); return 'clicked ' + custName.name; }
    return 'card not found';
  });
  await page.waitForTimeout(400);
  const customDone = await page.evaluate(() => {
    const record = getTodayRecord();
    const plan = getTrainingPlan(record.type);
    const g = getAllGroups(plan).find(x => (x.label || '').includes('中胸'));
    return { completedNow: isGroupCompleted(g, record), recExs: record.exercises.filter(e => e.groupId === g.id).map(e => ({ n: e.name, c: e.completed, skip: e.skipped, cust: e.custom })) };
  });
  console.log('T1. 勾选自定义动作后 组完成判定:', JSON.stringify(customDone), customDone.completedNow ? '✅ 组完成' : '❌ 疑点成立：替换动作不计入组完成');

  // ── T2: 部分完成 → 结束训练结算 ──
  // 先把一个 2选1 热身组勾满（阈值=1，完成1个即算）
  await page.evaluate(() => {
    const plan = getTrainingPlan(getTodayRecord().type);
    const g = getAllGroups(plan)[0];
    const ex = g.exercises[0];
    // 直接通过 record 写入完成（模拟勾选第一个热身动作）
    const record = getTodayRecord();
    let re = record.exercises.find(e => e.name === ex.name && e.groupId === g.id);
    if (!re) { re = { name: ex.name, groupId: g.id, completed: false }; record.exercises.push(re); }
    re.completed = true;
    if (!record.groupSelections) record.groupSelections = {};
    record.groupSelections[g.id] = ex.name;
    saveTodayRecord(record);
  });
  await page.waitForTimeout(300);
  const beforeFinish = await page.evaluate(() => {
    const record = getTodayRecord();
    const plan = getTrainingPlan(record.type);
    const all = getAllGroups(plan);
    return { completed: all.filter(g => isGroupCompleted(g, record) && !isGroupSkipped(g, record)).length, total: all.length };
  });
  console.log('T2. 完成1个热身动作后 完成组数:', beforeFinish.completed + '/' + beforeFinish.total);
  // 点结束训练（部分完成，completedGroups>=1 → 不应弹 confirm）
  await page.evaluate(() => document.getElementById('finish-btn').click());
  await page.waitForTimeout(500);
  const afterFinish = await page.evaluate(() => { const r = getTodayRecord(); return { completed: r.completed, completedGroups: r.completedGroups, totalGroups: r.totalGroups, skippedGroups: r.skippedGroups, lastWorkoutType: getSettings().lastWorkoutType }; });
  console.log('T2. 结束训练后 record:', JSON.stringify(afterFinish), '| confirm弹窗:', lastDialogMsg || '(无)');
  console.log('T2.', afterFinish.completed ? '✅ 部分完成可结束，完成率已记录' : '❌ 仍无法结束');

  // ── T3: 跳过整个组 → 该组记已跳过，不阻塞 ──
  console.log('=== 最终控制台错误:', errs.length ? errs.join('\n') : '无');
  await browser.close();
})();
