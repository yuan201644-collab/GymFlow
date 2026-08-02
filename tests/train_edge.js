/* 训练页边界用例：跳过/勾选互斥、清零、全跳过、自定义完成率 */
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
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 120)));
  page.on('dialog', async d => d.accept());
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(400);

  // E1: 全跳过第一个 3选1 组 → 记已跳过
  await page.evaluate(() => {
    const plan = getTrainingPlan(getTodayRecord().type);
    const g0 = getAllGroups(plan)[0];
    g0.exercises.forEach(ex => {
      const r = getTodayRecord();
      let re = r.exercises.find(e => e.name === ex.name && e.groupId === g0.id);
      if (!re) { re = { name: ex.name, groupId: g0.id, completed: false }; r.exercises.push(re); }
      re.skipped = true;
      saveTodayRecord(r);
    });
  });
  const e1 = await page.evaluate(() => {
    const r = getTodayRecord(); const plan = getTrainingPlan(r.type);
    const g0 = getAllGroups(plan)[0];
    return { skipped: isGroupSkipped(g0, r), completed: isGroupCompleted(g0, r) };
  });
  console.log('E1. 全跳过一组 → isGroupSkipped:', e1.skipped, '| isGroupCompleted:', e1.completed);

  // E2: 已跳过动作再勾选 → skipped 是否清除？（走真实 selectAndToggle）
  await page.evaluate(() => {
    const r = getTodayRecord(); const plan = getTrainingPlan(r.type);
    const g0 = getAllGroups(plan)[0];
    const ex = g0.exercises[0];
    selectAndToggle(0, 0, 0, g0.id, ex.name);  // 真实函数：勾选完成
  });
  const e2 = await page.evaluate(() => {
    const r = getTodayRecord(); const plan = getTrainingPlan(r.type);
    const g0 = getAllGroups(plan)[0]; const ex = g0.exercises[0];
    const re = r.exercises.find(e => e.name === ex.name && e.groupId === g0.id);
    return { completed: re.completed, skipped: re.skipped };
  });
  console.log('E2. 走真实勾选 → completed:', e2.completed, '| skipped:', e2.skipped, e2.completed && e2.skipped ? '❌ 同卡完成+跳过冲突' : '✅ 勾选清除跳过');

  // E3: resetTodayProgress 后 skipped/custom/weight 是否残留？
  await page.evaluate(() => {
    const r = getTodayRecord();
    // 给第2个组加一个 custom + weight + 一组 skipped
    const plan = getTrainingPlan(r.type);
    const g1 = getAllGroups(plan)[1];
    r.exercises.push({ name: '自定义测试动作', groupId: g1.id, completed: false, custom: true, weight: 50, reps: 10 });
    r.exercises.push({ name: '门框胸肌拉伸', groupId: getAllGroups(plan)[0].id, completed: false, skipped: true });
    saveTodayRecord(r);
  });
  // 调真函数（顶部 handler 已 accept confirm）
  await page.evaluate(() => resetTodayProgress());
  await page.waitForTimeout(300);
  const e3b = await page.evaluate(() => {
    const r = getTodayRecord();
    return { exCount: r.exercises.length, skipped: r.exercises.filter(e => e.skipped).length, custom: r.exercises.filter(e => e.custom).length, weight: r.exercises.filter(e => e.weight).length, hasSelection: Object.keys(r.groupSelections || {}).length };
  });
  console.log('E3. 调用真 reset 后 → exercises:', e3b.exCount, '| skipped:', e3b.skipped, '| custom:', e3b.custom, '| weight:', e3b.weight, '| groupSelections:', e3b.hasSelection, (e3b.exCount || e3b.hasSelection) ? '❌ 清零不彻底' : '✅ 全清');

  // E4: finish 时已完成的自定义动作计入 completedGroups？
  await page.evaluate(() => {
    const r = getTodayRecord();
    r.exercises.forEach(e => { e.skipped = false; e.completed = false; });
    // 完成一个 2选1 热身组的第1个（阈值1 → 完成）
    const plan = getTrainingPlan(r.type);
    const g0 = getAllGroups(plan)[0];
    let re = r.exercises.find(e => e.name === g0.exercises[0].name && e.groupId === g0.id);
    if (!re) { re = { name: g0.exercises[0].name, groupId: g0.id, completed: false }; r.exercises.push(re); }
    re.completed = true;
    saveTodayRecord(r);
  });
  const e4 = await page.evaluate(() => {
    const r = getTodayRecord(); const plan = getTrainingPlan(r.type);
    const all = getAllGroups(plan);
    return { completedCount: all.filter(g => isGroupCompleted(g, r) && !isGroupSkipped(g, r)).length, total: all.length };
  });
  console.log('E4. 完成1组后计数:', e4.completedCount + '/' + e4.total);

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  await browser.close();
})();
