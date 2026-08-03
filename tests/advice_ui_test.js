/* ============================================
   V2.0 阶段1 — 动作卡 💡 本地 AI 建议 浏览器测试
   验证：💡 按钮分布 / 展开收起 / 4项建议内容 / 休息日无按钮 / 无JS错误
   运行：node advice_ui_test.js （在 tests/ 目录下）
   ============================================ */
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
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 150)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.renderTrainingPage());
  await page.waitForTimeout(400);
  let pass = 0, fail = 0;
  const t = (n, c, d) => { if (c) pass++; else { fail++; console.log(`  ❌ ${n} ${d || ''}`); } };

  // 1. 💡 按钮分布：主组/热身/拉伸段有，休息日无
  const dist = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.group-exercise-card')];
    const hasBtn = cards.some(c => c.querySelector('#ab-' + c.id.replace('card-', '')) || c.querySelector('button[title="本地AI建议"]'));
    const mainBtn = [...document.querySelectorAll('button[title="本地AI建议"]')].length;
    return { cards: cards.length, mainBtn, hasBtn };
  });
  console.log('1. 💡 按钮:', JSON.stringify(dist));
  t('存在 💡 按钮', dist.mainBtn > 0, 'count=' + dist.mainBtn);
  t('💡 按钮数 ≤ 动作卡数', dist.mainBtn <= dist.cards);

  // 2. 展开/收起（V2.1 轮C：💡 改开 AI 问询弹层；本地建议卡改由折叠摘要 .advice-summary 开合）
  const toggle = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    sum.click();
    await new Promise(r => setTimeout(r, 300));
    const uid = sum.id.replace('as-', '');
    const card = document.getElementById('advice-' + uid);
    const visibleOpen = card && card.style.display !== 'none' && card.offsetHeight > 0;
    const title = card && card.querySelector('.advice-title') ? card.querySelector('.advice-title').textContent : '';
    sum.click();
    await new Promise(r => setTimeout(r, 300));
    const visibleClose = card ? card.style.display === 'none' : false;
    return { visibleOpen, title, visibleClose };
  });
  console.log('2. 展开/收起:', JSON.stringify(toggle));
  t('点击摘要展开显示建议卡', toggle.visibleOpen === true);
  t('标题为「本地建议」', (toggle.title || '').includes('本地建议'));
  t('再次点击收起', toggle.visibleClose === true);

  // 3. 展开后内容（V2.2 轮A：要点已上移详情区，.advice-label 只剩 重量/休息）
  const content = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    const uid = sum.id.replace('as-', '');
    const card = document.getElementById('advice-' + uid);
    const labels = [...card.querySelectorAll('.advice-label')].map(x => x.textContent);
    const items = {};
    card.querySelectorAll('.advice-item').forEach(it => {
      const lb = it.querySelector('.advice-label').textContent;
      items[lb] = it.textContent.replace(lb, '').trim();
    });
    const detail = card.querySelector('.advice-detail');
    const points = detail ? detail.querySelector('.advice-detail-points').textContent.trim() : '';
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    return { labels, items, detailExists: !!detail, points };
  });
  console.log('3. 建议内容:', JSON.stringify(content.items));
  t('详情区存在(动作详情)', content.detailExists === true, 'detail=' + content.detailExists);
  t('详情区要点非空', content.points.length > 0, 'len=' + content.points.length);
  t('有 重量 项', content.labels.includes('重量') && content.items['重量'].length > 0);
  t('有 休息 项', content.labels.includes('休息') && content.items['休息'].length > 0);
  t('重量项无 undefined', !/undefined|null|NaN/.test(content.items['重量'] || ''));
  t('休息项含 秒', (content.items['休息'] || '').includes('秒'));

  // 4. 重量建议文本合理性（主组首个动作若无历史 → 首次做；若有历史 → 上次X建议Y）
  const weightText = content.items['重量'] || '';
  t('重量项为预期格式', /首次做|上次.*建议/.test(weightText), weightText);

  // 5. 休息日无 💡 按钮 / 无折叠摘要（V2.1 轮A：三处一致）
  const rest = await page.evaluate(async () => {
    if (window.switchTrainingDay) { try { window.switchTrainingDay('rest'); } catch (e) {} }
    await new Promise(r => setTimeout(r, 300));
    return {
      btn: document.querySelectorAll('button[title="本地AI建议"]').length,
      summaries: document.querySelectorAll('.advice-summary').length,
    };
  });
  console.log('5. 休息日:', JSON.stringify(rest));
  t('休息日无 💡 按钮', rest.btn === 0);
  t('休息日无折叠摘要', rest.summaries === 0);

  // 6. 390px 横向不溢出
  await page.evaluate(async () => {
    if (window.switchTrainingDay) { try { window.switchTrainingDay('push'); } catch (e) {} }
    await new Promise(r => setTimeout(r, 300));
  });
  const overflow = await page.evaluate(() => {
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    return { vw: window.innerWidth, body, doc };
  });
  console.log('6. 横向宽度:', JSON.stringify(overflow));
  t('390px 无横向溢出', overflow.body <= overflow.vw && overflow.doc <= overflow.vw, JSON.stringify(overflow));

  // ===== V2.1 轮A — 本地建议卡重构：折叠摘要（push 日）=====
  // 6b. 默认折叠摘要行 → 点击展开本地建议卡（含要点/重量/休息）→ 再点收起；card-tip 已移除
  const sumTest = await page.evaluate(async () => {
    const summaries = [...document.querySelectorAll('.advice-summary')];
    const first = summaries[0];
    if (!first) return { err: '无折叠摘要' };
    const text = first.textContent.trim();
    const visible = first.offsetHeight > 0;
    first.click();
    await new Promise(r => setTimeout(r, 300));
    const uid = first.id.replace('as-', '');
    const card = document.getElementById('advice-' + uid);
    const openVisible = card && card.style.display !== 'none' && card.offsetHeight > 0;
    const labels = card ? [...card.querySelectorAll('.advice-label')].map(x => x.textContent) : [];
    const again = document.getElementById('as-' + uid);
    if (again) again.click();
    await new Promise(r => setTimeout(r, 300));
    const closed = card && card.style.display === 'none';
    return { text, visible, openVisible, labels, closed, tipCount: document.querySelectorAll('.card-tip').length, sumCount: summaries.length, hasDetail: !!(card && card.querySelector('.advice-detail')) };
  });
  console.log('6b. 折叠摘要:', JSON.stringify(sumTest));
  t('默认显示折叠摘要行(可见)', sumTest.visible === true, JSON.stringify(sumTest));
  t('摘要含「要点」标签', (sumTest.text || '').includes('要点'), sumTest.text);
  t('摘要重量段为 建议Xkg 或 轻重量起步', /建议\d+(\.\d+)?kg|轻重量起步/.test(sumTest.text || ''), sumTest.text);
  t('摘要含「休息Xs」段', /休息\d+s/.test(sumTest.text || ''), sumTest.text);
  t('点击摘要展开本地建议卡', sumTest.openVisible === true, JSON.stringify(sumTest));
  t('展开卡含 重量/休息 项', ['重量', '休息'].every(x => sumTest.labels.includes(x)), JSON.stringify(sumTest.labels));
  t('展开卡含动作详情区', sumTest.hasDetail === true, 'hasDetail=' + sumTest.hasDetail);
  t('再点摘要收起', sumTest.closed === true, JSON.stringify(sumTest));
  t('卡片底部无 card-tip 行', sumTest.tipCount === 0, 'tipCount=' + sumTest.tipCount);
  t('push 日折叠摘要数 > 0', sumTest.sumCount > 0, 'sumCount=' + sumTest.sumCount);

  // ===== V2.2 轮A — 动作详情卡（详细要点 + 注意事项 + 全标签）=====
  // A1. 详情区数据（DOM 已渲染，无需展开）：要点完整 + 标签 chips + ⚠️ 注意事项
  const detailData = await page.evaluate(() => {
    const details = [...document.querySelectorAll('.advice-detail')];
    const nonEmpty = d => (d.querySelector('.advice-detail-points') || {}).textContent ? d.querySelector('.advice-detail-points').textContent.trim().length > 0 : false;
    const anyChips = details.filter(d => d.querySelectorAll('.advice-chip').length >= 1).length;
    const anyWarn = details.filter(d => d.querySelectorAll('.advice-detail-warn').length >= 1).length;
    const warnStartsOk = details.every(d => [...d.querySelectorAll('.advice-detail-warn')].every(w => w.textContent.trim().startsWith('⚠️')));
    return { total: details.length, withPoints: details.filter(d => nonEmpty(d)).length, anyChips, anyWarn, warnStartsOk };
  });
  console.log('A1. 详情区数据:', JSON.stringify(detailData));
  t('所有卡详情区要点完整(非空)', detailData.total > 0 && detailData.withPoints === detailData.total, JSON.stringify(detailData));
  t('至少一张卡有标签 chips', detailData.anyChips >= 1, 'chips=' + detailData.anyChips);
  t('至少一张卡有 ⚠️ 注意事项', detailData.anyWarn >= 1, 'warn=' + detailData.anyWarn);
  t('⚠️ 注意事项文本均以 ⚠️ 开头', detailData.warnStartsOk === true, JSON.stringify(detailData));

  // A2. 展开首卡 → 详情区可见（视觉验证）+ 390px 无横向溢出
  const detailVisible = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    sum.click();
    await new Promise(r => setTimeout(r, 300));
    const uid = sum.id.replace('as-', '');
    const card = document.getElementById('advice-' + uid);
    const detail = card.querySelector('.advice-detail');
    const points = detail.querySelector('.advice-detail-points');
    const out = {
      visible: detail.offsetHeight > 0,
      pointsLen: points.textContent.trim().length,
      body: document.body.scrollWidth, vw: window.innerWidth,
    };
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    return out;
  });
  console.log('A2. 详情卡展开:', JSON.stringify(detailVisible));
  t('展开首卡详情区可见', detailVisible.visible === true, JSON.stringify(detailVisible));
  t('展开详情卡 390px 无横向溢出', detailVisible.body <= detailVisible.vw, JSON.stringify(detailVisible));

  // A3. 高风险动作 → ⚠️ 注意事项（注入自定义「杠铃硬拉」→ 展开 → 断言 → 清理）
  const hiRisk = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    const gid = card.dataset.groupid;
    const rec = window.getTodayRecord();
    rec.exercises.push({ name: '杠铃硬拉', groupId: gid, custom: true, weight: 0, completed: false });
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    await new Promise(r => setTimeout(r, 250));
    const dlCard = [...document.querySelectorAll('.group-exercise-card[data-ex="杠铃硬拉"]')][0];
    if (!dlCard) return { err: '注入卡未渲染', cleaned: true };
    const sum = dlCard.querySelector('.advice-summary');
    if (sum) sum.click();
    await new Promise(r => setTimeout(r, 250));
    const uid = dlCard.id.replace('card-', '');
    const adviceCard = document.getElementById('advice-' + uid);
    const warns = adviceCard ? [...adviceCard.querySelectorAll('.advice-detail-warn')].map(w => w.textContent.trim()) : [];
    const points = adviceCard ? adviceCard.querySelector('.advice-detail-points').textContent.trim() : '';
    if (sum) sum.click();
    // 清理：移除注入动作 + 重渲染，避免污染后续断言
    rec.exercises = rec.exercises.filter(e => !(e.name === '杠铃硬拉' && e.custom));
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    await new Promise(r => setTimeout(r, 200));
    return { warns, points, err: null };
  });
  console.log('A3. 高风险:', JSON.stringify(hiRisk));
  t('高风险动作卡显示 ⚠️ 注意事项(高风险动作)', hiRisk.err === null && hiRisk.warns.some(w => w.startsWith('⚠️') && w.includes('高风险动作')), JSON.stringify(hiRisk));
  t('高风险动作卡要点含「注意⚠️高风险」', (hiRisk.points || '').includes('高风险'), hiRisk.points);

  // ===== V2.1 轮B — 卡片表面精简 + 长按菜单 + 弹出动画 =====
  // B1. 表面精简：无 ⏭/➕；保留 💡/☆。V2.2 轮B 起重量/组数/次数常驻卡片底部(.card-record-row)，长按菜单内录入行(.card-menu-weight)移除
  const surface = await page.evaluate(() => ({
    skipBtns: document.querySelectorAll('.skip-btn').length,
    plusBtns: document.querySelectorAll('button[title="替换/新增动作"]').length,
    recordRows: document.querySelectorAll('.card-record-row').length,
    menuWeightRows: document.querySelectorAll('.card-menu-weight').length,
    adviceBtns: document.querySelectorAll('button[title="本地AI建议"]').length,
    favBtns: document.querySelectorAll('.group-exercise-card .icon-btn').length,
  }));
  console.log('B1. 表面精简:', JSON.stringify(surface));
  t('表面无 ⏭ 跳过按钮', surface.skipBtns === 0, 'skip=' + surface.skipBtns);
  t('表面无 ➕ 替换按钮', surface.plusBtns === 0, 'plus=' + surface.plusBtns);
  t('卡片底部有常驻录入行(.card-record-row)', surface.recordRows > 0, 'rows=' + surface.recordRows);
  t('长按菜单内无重量/组数/次数录入行(.card-menu-weight)', surface.menuWeightRows === 0, 'menuWeight=' + surface.menuWeightRows);
  t('表面保留 💡 按钮', surface.adviceBtns > 0, 'adv=' + surface.adviceBtns);
  t('表面保留 ☆ 收藏按钮', surface.favBtns > 0, 'fav=' + surface.favBtns);

  // 预置设备偏好：长按→替换动作需先确认设备，避免首弹设备选择
  await page.evaluate(async () => {
    const s = window.getSettings();
    if (!s.userInfo) s.userInfo = {};
    s.userInfo.equipment = '商业健身房(器械很全)';
    window.saveSettings(s);
    await new Promise(r => setTimeout(r, 200));
  });

  async function longPressAt(x, y) {
    await page.waitForTimeout(100);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(560);
    await page.mouse.up();
    await page.waitForTimeout(120);
  }
  // 长按卡片「空白区」：避开可交互元素（勾选框图标/按钮/输入/建议行/录入行）。
  // 注意：onLpStart 只排除 .checkbox-custom（勾选框图标），标题/器械/meta 所在的
  // .checkbox-wrapper 仍可长按弹菜单；故 ignore 用 .checkbox-custom 而非整行。
  async function longPressCard(idx) {
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
          if (el && el.closest && !el.closest(ignore)) {
            return { x, y, ex: card.dataset.ex, uid: card.id.replace('card-', '') };
          }
        }
      }
      return { err: 'no-point', ex: card.dataset.ex };
    }, idx);
    if (pos.err) return pos;
    await longPressAt(pos.x, pos.y);
    return pos;
  }
  // 长按标题区域（P1 暴露点：标题位于 .checkbox-wrapper 内，被忽略拦截）
  async function longPressTitle(idx) {
    const pos = await page.evaluate((i) => {
      const cards = [...document.querySelectorAll('.group-exercise-card[data-ex]')];
      const card = cards[i];
      if (!card) return { err: 'no-card' };
      card.scrollIntoView({ block: 'center' });
      const title = card.querySelector('.card-title') || card;
      const r = title.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, ex: card.dataset.ex };
    }, idx);
    if (pos.err) return pos;
    await longPressAt(pos.x, pos.y);
    return pos;
  }

  // B2. 长按动作卡 → 卡片弹出动画 + 菜单（V2.2 轮B：仅 今日删除/永久删除/替换动作 三项，重量/组数/次数已移至卡片底部常驻）
  let lp = await longPressCard(0);
  const menuOpen = await page.evaluate(() => ({
    overlay: !!document.getElementById('card-menu-overlay'),
    anim: !!document.querySelector('.group-exercise-card.card-menu-open'),
    items: [...document.querySelectorAll('#card-menu-overlay .card-menu-item')].map(x => x.textContent.trim()),
    sheet: !!document.querySelector('#card-menu-overlay .sheet-fadeUp'),
  }));
  console.log('B2. 长按菜单:', JSON.stringify(menuOpen));
  t('长按弹出菜单(overlay)', menuOpen.overlay === true, JSON.stringify(menuOpen));
  t('卡片有弹出动画类 card-menu-open', menuOpen.anim === true, JSON.stringify(menuOpen));
  t('菜单含 今日删除/永久删除/替换动作 三项', ['今日删除', '永久删除', '替换动作'].every(k => (menuOpen.items || []).some(i => i.includes(k))), JSON.stringify(menuOpen.items));
  t('菜单无 重量/组数/次数 录入项', !(menuOpen.items || []).some(i => i.includes('组数') || i.includes('重量')), JSON.stringify(menuOpen.items));
  t('菜单用 sheet-fadeUp 弹层样式', menuOpen.sheet === true, JSON.stringify(menuOpen));
  await page.evaluate(() => window.closeCardMenu());
  await page.waitForTimeout(150);

  // B3. 长按落在 ☆ 按钮 → 不弹菜单（可交互目标忽略）
  const favPos = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex]');
    const fav = card ? [...card.querySelectorAll('.icon-btn')].find(b => b.textContent === '☆' || b.textContent === '⭐') : null;
    if (!fav) return { err: 'no-fav' };
    const r = fav.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!favPos.err) {
    await page.mouse.move(favPos.x, favPos.y);
    await page.mouse.down();
    await page.waitForTimeout(560);
    await page.mouse.up();
    await page.waitForTimeout(120);
  }
  const noMenu = await page.evaluate(() => !document.getElementById('card-menu-overlay'));
  t('长按落在 ☆ 不弹菜单', favPos.err ? false : noMenu === true, 'err=' + (favPos.err || 'none') + ', noMenu=' + noMenu);

  // B4. 今日删除（原「仅今天跳过」）
  lp = await longPressCard(0);
  const skipTest = await page.evaluate(async (exName) => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    const label = items[0] ? items[0].textContent.trim() : '';
    if (items[0]) items[0].click();
    await new Promise(r => setTimeout(r, 300));
    const rec = window.getTodayRecord();
    const skipped = rec.exercises.filter(x => x.name === exName).some(e => e.skipped === true);
    const skippedCards = document.querySelectorAll('.exercise-skipped').length;
    const tagEl = document.querySelector('.exercise-skipped .card-title');
    const tagged = !!tagEl && tagEl.textContent.includes('已跳过');
    return { label, skipped, skippedCards, tagged };
  }, lp.ex);
  console.log('B4. 今日删除:', JSON.stringify(skipTest));
  t('未跳过时菜单首项为「今日删除」', (skipTest.label || '').includes('今日删除'), skipTest.label);
  t('点今日删除 → skipped=true', skipTest.skipped === true, JSON.stringify(skipTest));
  t('卡片变灰(exercise-skipped)', skipTest.skippedCards === 1, 'cards=' + skipTest.skippedCards);
  t('标题带「已跳过」标签', skipTest.tagged === true, JSON.stringify(skipTest));

  // B5. 已跳过卡再长按 → 首项「今日恢复」→ 可逆
  lp = await longPressCard(0);
  const restoreTest = await page.evaluate(async (exName) => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    const label = items[0] ? items[0].textContent.trim() : '';
    if (items[0]) items[0].click();
    await new Promise(r => setTimeout(r, 300));
    const rec = window.getTodayRecord();
    const skipped = rec.exercises.filter(x => x.name === exName).some(e => e.skipped === true);
    const skippedCards = document.querySelectorAll('.exercise-skipped').length;
    return { label, skipped, skippedCards };
  }, lp.ex);
  console.log('B5. 今日恢复:', JSON.stringify(restoreTest));
  t('已跳过时菜单首项为「今日恢复」', (restoreTest.label || '').includes('今日恢复'), restoreTest.label);
  t('点今日恢复 → skipped=false', restoreTest.skipped === false, JSON.stringify(restoreTest));
  t('卡片恢复正常(无 exercise-skipped)', restoreTest.skippedCards === 0, 'cards=' + restoreTest.skippedCards);

  // B6. 卡片底部常驻录入行：重量/组数/次数 三输入 → 录入写当日记录（V2.2 轮B：替代原长按菜单内录入；轮E：仅主组卡有行 + 文字标签）
  const firstExName = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex][data-phase="main"]');
    return card ? card.dataset.ex : '';
  });
  const weightTest = await page.evaluate(async (exName) => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex]')].find(c => c.dataset.ex === exName);
    const row = card ? card.querySelector('.card-record-row') : null;
    const inputs = row ? row.querySelectorAll('.weight-input-sm') : [];
    const labels = row ? row.querySelectorAll('.weight-label') : [];
    const visible = row && row.offsetHeight > 0;
    if (visible && inputs.length >= 3) {
      inputs[0].value = '42.5';
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      inputs[1].value = '3';
      inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      inputs[2].value = '12';
      inputs[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
    await new Promise(r => setTimeout(r, 200));
    const rec = window.getTodayRecord();
    const e = rec.exercises.find(x => x.name === exName);
    return {
      visible,
      inputCount: inputs.length,
      hasWeightLabel: [...labels].some(l => l.textContent === '重量'),
      hasSetsLabel: [...labels].some(l => l.textContent === '组数'),
      hasRepsLabel: [...labels].some(l => l.textContent === '次数'),
      hasIconOnly: [...labels].some(l => l.textContent === '⚖️' || l.textContent === '🔁'),
      weight: e ? e.weight : null, sets: e ? e.sets : null, reps: e ? e.reps : null,
    };
  }, firstExName);
  console.log('B6. 常驻录入行:', JSON.stringify(weightTest));
  t('卡片底部常驻录入行可见', weightTest.visible === true, JSON.stringify(weightTest));
  t('常驻行含 3 个输入(重量/组数/次数)', weightTest.inputCount === 3, 'n=' + weightTest.inputCount);
  t('记录行含 重量/组数/次数 文字标签', weightTest.hasWeightLabel === true && weightTest.hasSetsLabel === true && weightTest.hasRepsLabel === true, JSON.stringify(weightTest));
  t('记录行不再用 ⚖️/🔁 图标当标签', weightTest.hasIconOnly === false, JSON.stringify(weightTest));
  t('录入 重量/组数/次数 写入当日记录', weightTest.weight === 42.5 && weightTest.sets === 3 && weightTest.reps === 12, JSON.stringify(weightTest));

  // B6b. 阶段过滤（V2.2 轮E）：仅主组卡有录入行，热身/拉伸卡无
  const phaseRows = await page.evaluate(() => {
    const out = {};
    ['warmup', 'main', 'stretch'].forEach(p => {
      const cards = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="' + p + '"]')];
      out[p] = { cards: cards.length, rows: cards.filter(c => c.querySelector('.card-record-row')).length };
    });
    return out;
  });
  console.log('B6b. 阶段-录入行:', JSON.stringify(phaseRows));
  t('主组卡有常驻录入行', phaseRows.main && phaseRows.main.cards > 0 && phaseRows.main.rows === phaseRows.main.cards, JSON.stringify(phaseRows));
  t('热身卡无常驻录入行', phaseRows.warmup && phaseRows.warmup.cards > 0 && phaseRows.warmup.rows === 0, JSON.stringify(phaseRows));
  t('拉伸卡无常驻录入行', phaseRows.stretch && phaseRows.stretch.cards > 0 && phaseRows.stretch.rows === 0, JSON.stringify(phaseRows));

  // B6c. 折叠摘要可点暗示（V2.2 轮E）：::after「展开」提示 + 无重复 kg 占位
  const afford = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    const closedAfter = getComputedStyle(sum, '::after').content;   // 收起态先读
    const chipBg = getComputedStyle(sum).backgroundColor;
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    const hasOpenCls = sum.classList.contains('open');
    const openAfter = getComputedStyle(sum, '::after').content;
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    const mainCard = document.querySelector('.group-exercise-card[data-ex][data-phase="main"]');
    const row = mainCard ? mainCard.querySelector('.card-record-row') : null;
    const wInput = row ? row.querySelector('.weight-input-sm') : null;
    return {
      chipBg, closedAfter, hasOpenCls, openAfter,
      placeholder: wInput ? wInput.getAttribute('placeholder') : 'no-input',
    };
  });
  console.log('B6c. 摘要可点暗示:', JSON.stringify(afford));
  t('摘要收起态 ::after 含「展开」提示', afford.err === undefined && afford.closedAfter && afford.closedAfter.includes('展开'), JSON.stringify(afford));
  t('摘要为 chip 样式(非透明背景)', afford.err === undefined && afford.chipBg && afford.chipBg !== 'rgba(0, 0, 0, 0)' && afford.chipBg !== 'transparent', JSON.stringify(afford));
  t('展开态加 open 类且 ::after 变「收起」', afford.err === undefined && afford.hasOpenCls === true && afford.openAfter && afford.openAfter.includes('收起'), JSON.stringify(afford));
  t('重量输入框无 placeholder="kg" 重复单位', afford.err === undefined && !afford.placeholder, JSON.stringify(afford));

  // B7. 永久删除 → 内联确认 → 取消：不写 userDislike
  lp = await longPressCard(1);
  const dislikeCancel = await page.evaluate(async (exName) => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    const del = items.find(i => i.textContent.includes('永久删除'));
    if (del) del.click();
    await new Promise(r => setTimeout(r, 150));
    const sheet = document.querySelector('#card-menu-overlay .sheet-fadeUp');
    const confirmShown = !!(sheet && sheet.textContent.includes('确定以后不再推荐'));
    const cancel = sheet ? sheet.querySelector('.btn-outline') : null;
    if (cancel) cancel.click();
    await new Promise(r => setTimeout(r, 150));
    const s = window.getSettings();
    const inDislike = (s.userDislike || []).includes(exName);
    const backToMenu = document.querySelectorAll('#card-menu-overlay .card-menu-item').length === 3; // V2.2 轮B：菜单仅 3 项（重量/组数/次数已移至卡片底部常驻）
    window.closeCardMenu();
    return { confirmShown, inDislike, backToMenu };
  }, lp.ex);
  console.log('B7. 永久删除-取消:', JSON.stringify(dislikeCancel));
  t('点永久删除 → 内联确认层出现', dislikeCancel.confirmShown === true, JSON.stringify(dislikeCancel));
  t('取消 → 不写 userDislike', dislikeCancel.inDislike === false, JSON.stringify(dislikeCancel));
  t('取消 → 回到菜单项', dislikeCancel.backToMenu === true, JSON.stringify(dislikeCancel));

  // B8. 永久删除 → 确定：写 userDislike + 该卡同时今日删除；随后清理避免影响后续
  lp = await longPressCard(1);
  const dislikeConfirm = await page.evaluate(async (exName) => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    const del = items.find(i => i.textContent.includes('永久删除'));
    if (del) del.click();
    await new Promise(r => setTimeout(r, 150));
    const sheet = document.querySelector('#card-menu-overlay .sheet-fadeUp');
    const ok = sheet ? sheet.querySelector('.btn-danger') : null;
    if (ok) ok.click();
    await new Promise(r => setTimeout(r, 300));
    const s = window.getSettings();
    const inDislike = (s.userDislike || []).includes(exName);
    const rec = window.getTodayRecord();
    const skipped = rec.exercises.filter(x => x.name === exName).some(e => e.skipped === true);
    const cardSkipped = document.querySelectorAll('.exercise-skipped').length > 0;
    const toast = document.body.textContent.includes('以后不再推荐');
    // 清理：移除 dislike + 恢复 skipped + 重渲染，避免污染后续替换选择器候选池
    s.userDislike = (s.userDislike || []).filter(n => n !== exName);
    window.saveSettings(s);
    rec.exercises.filter(x => x.name === exName).forEach(e => { e.skipped = false; });
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    await new Promise(r => setTimeout(r, 250));
    return { inDislike, skipped, cardSkipped, toast };
  }, lp.ex);
  console.log('B8. 永久删除-确定:', JSON.stringify(dislikeConfirm));
  t('确定 → userDislike 写入动作名', dislikeConfirm.inDislike === true, JSON.stringify(dislikeConfirm));
  t('确定 → 该卡同时被今日删除(skipped)', dislikeConfirm.skipped === true, JSON.stringify(dislikeConfirm));
  t('确定 → 卡片变灰', dislikeConfirm.cardSkipped === true, JSON.stringify(dislikeConfirm));
  t('确定 → toast 提示', dislikeConfirm.toast === true, JSON.stringify(dislikeConfirm));

  // B9. 长按菜单 → 替换动作 → 选择器打开（原表面 ➕ 入口移到这里）
  lp = await longPressCard(0);
  const pickerFromMenu = await page.evaluate(async () => {
    const items = [...document.querySelectorAll('#card-menu-overlay .card-menu-item')];
    const rep = items.find(i => i.textContent.includes('替换动作'));
    if (rep) rep.click();
    await new Promise(r => setTimeout(r, 300));
    const ov = document.getElementById('ex-picker-overlay');
    return {
      overlay: !!ov,
      sheet: !!(ov && ov.querySelector('.sheet-fadeUp')),
      aiInput: !!document.getElementById('ai-pick-input'),
      cands: window._pickerCands ? window._pickerCands.length : -1,
    };
  });
  console.log('B9. 长按→替换动作:', JSON.stringify(pickerFromMenu));
  t('长按菜单→替换动作→选择器打开', pickerFromMenu.overlay === true, JSON.stringify(pickerFromMenu));
  t('选择器含 sheet-fadeUp + AI 输入框', pickerFromMenu.sheet === true && pickerFromMenu.aiInput === true, JSON.stringify(pickerFromMenu));
  t('候选池非空', pickerFromMenu.cands > 0, 'cands=' + pickerFromMenu.cands);
  await page.evaluate(() => document.getElementById('ex-picker-overlay')?.remove());

  // B10. 菜单打开时 390px 无横向溢出
  lp = await longPressCard(0);
  const menuOverflow = await page.evaluate(() => {
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    return { vw: window.innerWidth, body, doc };
  });
  console.log('B10. 菜单溢出:', JSON.stringify(menuOverflow));
  t('长按菜单打开 390px 无横向溢出', menuOverflow.body <= menuOverflow.vw && menuOverflow.doc <= menuOverflow.vw, JSON.stringify(menuOverflow));
  await page.evaluate(() => window.closeCardMenu());
  await page.waitForTimeout(150);

  // B11. 点建议卡「建议重量」→ 填入卡片底部重量输入框 + 写当日记录（V2.2 轮B 修重量推荐 bug）
  const adviceW = await page.evaluate(async () => {
    // 轮E 起仅主组卡有底部录入行，故取主组卡验证「点建议重量→填输入框」（热身/拉伸卡无录入行，非本用例场景）
    const mainCard = document.querySelector('.group-exercise-card[data-ex][data-phase="main"]');
    if (!mainCard) return { err: '无主组动作卡' };
    const exName = mainCard.dataset.ex || '';
    const recs = window.getRecords();
    recs.push({ date: '2026-07-01', completed: true, type: 'push', exercises: [{ name: exName, weight: 60, sets: 3, reps: 12 }] });
    window.saveRecords(recs);
    window.renderTrainingPage();
    await new Promise(r => setTimeout(r, 300));
    const mc = document.querySelector('.group-exercise-card[data-ex][data-phase="main"]');
    const el = mc ? mc.querySelector('.advice-weight.clickable') : null;
    if (!el) return { err: '无可点击建议重量', exName };
    const uid = el.closest('.advice-card').id.replace('advice-', '');
    const card = document.getElementById('advice-' + uid);
    const sum = document.getElementById('as-' + uid);
    if (sum && card && card.style.display === 'none') { sum.click(); await new Promise(r => setTimeout(r, 250)); }
    const before = el.textContent;
    el.click();
    await new Promise(r => setTimeout(r, 250));
    const rec = window.getTodayRecord();
    const e = rec.exercises.find(x => x.name === exName);
    const input = document.querySelector('#rec-' + uid + ' .weight-input-sm');
    const inputVal = input ? input.value : '';
    const toast = document.body.textContent.includes('已填入建议重量');
    // 清理：移除注入历史，避免污染后续建议
    window.saveRecords(window.getRecords().filter(r => r.date !== '2026-07-01'));
    return { exName, before, afterWeight: e ? e.weight : null, inputVal, toast };
  });
  console.log('B11. 点建议重量:', JSON.stringify(adviceW));
  t('有历史时建议重量可点击', adviceW.err === undefined && /建议/.test(adviceW.before || ''), JSON.stringify(adviceW));
  t('点建议重量 → 重量输入框填入建议值(62.5)', adviceW.err === undefined && adviceW.inputVal === '62.5', JSON.stringify(adviceW));
  t('点建议重量 → 写入当日记录 weight(62.5)', adviceW.err === undefined && adviceW.afterWeight === 62.5, JSON.stringify(adviceW));
  t('点建议重量 → toast 提示「已填入建议重量」', adviceW.err === undefined && adviceW.toast === true, JSON.stringify(adviceW));

  // B2a. 【P1】长按标题区域（checkbox-wrapper 内）→ 应弹出菜单。
  // 当前实现把整个 .checkbox-wrapper（含标题/器械/meta）排除在长按外，
  // 导致长按标题无效（用户最自然的操作点）；且未拦截 click → 可能误勾选。
  lp = await longPressTitle(0);
  const titleMenu = await page.evaluate((exName) => {
    const menu = !!document.getElementById('card-menu-overlay');
    const rec = window.getTodayRecord();
    const misChecked = rec.exercises.filter(x => x.name === exName).some(e => e.completed === true);
    // 清理：取消误勾选 + 重渲染，避免污染后续
    rec.exercises.filter(x => x.name === exName).forEach(e => { e.completed = false; });
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    return { menu, misChecked };
  }, lp.ex);
  console.log('B2a. 长按标题:', JSON.stringify(titleMenu));
  t('长按标题区域应弹菜单（P1：checkbox-wrapper 覆盖标题）', titleMenu.menu === true, 'menu=' + titleMenu.menu + ', 误勾选=' + titleMenu.misChecked);
  await page.evaluate(() => window.closeCardMenu());
  await page.waitForTimeout(150);

  // ===== V2.0 阶段2 —「问 AI」动作讲解（L1，点按调 AI）=====
  // mock aiFetch：拦截所有 /api/ask 请求，避免真实网络
  let aiMock = { success: true, answer: '', delay: 0, count: 0, lastContent: '' };
  await page.route('**/api/ask', async route => {
    aiMock.count++;
    aiMock.lastContent = route.request().postData() || '';
    if (aiMock.delay) await new Promise(r => setTimeout(r, aiMock.delay));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: aiMock.success, answer: aiMock.answer, error: '模拟后端失败' }),
    });
  });

  // ===== V2.1 轮C — AI💡 自由输入弹层（替代阶段2固定「问 AI」链路）=====
  // C1. 点💡 → 弹层出现：输入框 + 发送 + 2 快捷 chips + 头部动作名
  const firstEx = await page.evaluate(() => {
    const card = document.querySelector('.group-exercise-card[data-ex]');
    return card ? card.dataset.ex : '';
  });
  const c1 = await page.evaluate(async () => {
    const b = document.querySelector('button[title="本地AI建议"]');
    if (!b) return { err: '无💡按钮' };
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const ov = document.getElementById('ai-ask-overlay');
    return {
      overlay: !!ov,
      input: !!document.getElementById('ai-ask-input'),
      send: !!document.getElementById('ai-ask-send'),
      quicks: ov ? [...ov.querySelectorAll('.ai-ask-quick')].map(x => x.textContent.trim()) : [],
      title: ov && ov.querySelector('.ai-ask-title') ? ov.querySelector('.ai-ask-title').textContent : '',
    };
  });
  console.log('C1. AI弹层:', JSON.stringify(c1));
  t('点💡打开 AI 问询弹层', c1.overlay === true && c1.input === true && c1.send === true, c1.err || JSON.stringify(c1));
  t('弹层含 2 个快捷问法 chip', c1.quicks.length === 2 && c1.quicks.includes('讲解要点') && c1.quicks.includes('建议重量'), JSON.stringify(c1.quicks));
  t('弹层头部含动作名上下文', (c1.title || '').includes(firstEx), c1.title);

  // C2. 输入自定义问题 → 发送 → mock AI XSS 转义 + 换行→<br>
  aiMock.answer = '保护手腕：手腕保持中立位。<script>window.__xss2=1</script>\n第二行：先充分热身。';
  const c2 = await page.evaluate(async () => {
    const input = document.getElementById('ai-ask-input');
    if (!input) return { err: '无输入框' };
    input.value = '这个动作怎么保护手腕';
    document.getElementById('ai-ask-send').click();
    await new Promise(r => setTimeout(r, 600));
    const res = document.getElementById('ai-ask-result');
    return { html: res.innerHTML, text: res.innerText, scriptEls: res.querySelectorAll('script').length };
  });
  console.log('C2. 自由输入回复:', JSON.stringify(c2).slice(0, 200));
  t('自定义问题回复显示', (c2.text || '').includes('保护手腕'), c2.err || c2.text);
  t('XSS payload 转义（无 script 元素）', c2.scriptEls === 0, 'scriptEls=' + c2.scriptEls);
  t('换行渲染为 <br>', (c2.html || '').includes('<br>'), c2.html);

  // C3. prompt 含用户问题原文 + 动作名上下文
  t('prompt 含用户问题原文', (aiMock.lastContent || '').includes('这个动作怎么保护手腕'), (aiMock.lastContent || '').slice(0, 120));
  t('prompt 含动作名上下文', (aiMock.lastContent || '').includes(firstEx), (aiMock.lastContent || '').slice(0, 120));

  // C4. 快捷问法 chips：填输入框 + 自动发送；prompt 分支正确
  aiMock.answer = '讲解要点回答';
  const c4a = await page.evaluate(async () => {
    const chip = [...document.querySelectorAll('.ai-ask-quick')].find(x => x.textContent.trim() === '讲解要点');
    if (!chip) return { err: '无讲解要点chip' };
    chip.click();
    await new Promise(r => setTimeout(r, 500));
    return { inputVal: document.getElementById('ai-ask-input').value };
  });
  console.log('C4a. 讲解要点:', JSON.stringify(c4a), 'last=', (aiMock.lastContent || '').slice(0, 60));
  t('讲解要点 chip 自动填输入框', c4a.inputVal === '讲解要点', JSON.stringify(c4a));
  t('讲解要点 prompt 走「讲解动作」分支', (aiMock.lastContent || '').includes('讲解动作'), (aiMock.lastContent || '').slice(0, 120));
  aiMock.answer = '建议重量回答';
  const c4b = await page.evaluate(async () => {
    const chip = [...document.querySelectorAll('.ai-ask-quick')].find(x => x.textContent.trim() === '建议重量');
    if (!chip) return { err: '无建议重量chip' };
    chip.click();
    await new Promise(r => setTimeout(r, 500));
    return { inputVal: document.getElementById('ai-ask-input').value };
  });
  console.log('C4b. 建议重量:', JSON.stringify(c4b), 'last=', (aiMock.lastContent || '').slice(0, 60));
  t('建议重量 chip 自动填输入框', c4b.inputVal === '建议重量', JSON.stringify(c4b));
  t('建议重量 prompt 含「建议重量」', (aiMock.lastContent || '').includes('建议重量'), (aiMock.lastContent || '').slice(0, 120));

  // C5. 缓存：同问题二次问（关弹层重开）→ 不重复调 aiFetch；写 name##question 键
  const countBefore5 = aiMock.count;
  await page.evaluate(() => window.closeAIActionAsk());
  await page.waitForTimeout(150);
  aiMock.answer = '缓存命中不请求';
  const c5 = await page.evaluate(async (ex) => {
    const b = document.querySelector('button[title="本地AI建议"]');
    if (!b) return { err: '无💡按钮' };
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const input = document.getElementById('ai-ask-input');
    input.value = '这个动作怎么保护手腕';
    document.getElementById('ai-ask-send').click();
    await new Promise(r => setTimeout(r, 400));
    const res = document.getElementById('ai-ask-result');
    const store = JSON.parse(localStorage.getItem('fitness_ai_action_cache') || '{}');
    const keys = Object.keys(store);
    return { text: res.innerText, hasQKey: keys.indexOf(ex + '##这个动作怎么保护手腕') >= 0 };
  }, firstEx);
  console.log('C5. 缓存:', JSON.stringify({ count: aiMock.count, hasQKey: c5.hasQKey, text: (c5.text || '').slice(0, 30) }));
  t('同问题二次问不重复调 aiFetch', aiMock.count === countBefore5, 'count=' + aiMock.count + ' before=' + countBefore5);
  t('缓存写入 name##question 键', c5.hasQKey === true, JSON.stringify(c5));
  t('二次问命中缓存显示回复', (c5.text || '').includes('保护手腕'), c5.text);

  // C6. 失败 → 错误 + 重试按钮 → 点重试复用同问题成功
  aiMock.success = false;
  const c6 = await page.evaluate(async () => {
    const input = document.getElementById('ai-ask-input');
    input.value = '失败测试问题';
    document.getElementById('ai-ask-send').click();
    await new Promise(r => setTimeout(r, 400));
    const res = document.getElementById('ai-ask-result');
    const errEl = res.querySelector('.advice-ai-err');
    return { errText: errEl ? errEl.textContent : '', hasRetry: !!res.querySelector('.advice-ai-retry'), html: res.innerHTML };
  });
  console.log('C6. 失败:', JSON.stringify({ errText: (c6.errText || '').slice(0, 30), hasRetry: c6.hasRetry }));
  t('失败显示错误信息', (c6.errText || '').includes('模拟后端失败'), c6.errText);
  t('失败显示重试按钮', c6.hasRetry === true, c6.html);
  aiMock.success = true;
  aiMock.answer = '重试后的回答';
  const c6r = await page.evaluate(async () => {
    const retry = document.querySelector('#ai-ask-result .advice-ai-retry');
    if (!retry) return { err: '无重试按钮' };
    retry.click();
    await new Promise(r => setTimeout(r, 500));
    const res = document.getElementById('ai-ask-result');
    return { text: res.innerText, hasRetry: !!res.querySelector('.advice-ai-retry') };
  });
  console.log('C6r. 重试:', JSON.stringify(c6r));
  t('重试后显示回答', (c6r.text || '').includes('重试后的回答'), c6r.err || c6r.text);
  t('重试后错误/重试按钮消失', c6r.hasRetry === false, JSON.stringify(c6r));

  // C7. 加载转圈
  aiMock.answer = '加载测试的回答';
  aiMock.delay = 600;
  const c7 = await page.evaluate(async () => {
    const input = document.getElementById('ai-ask-input');
    input.value = '加载测试';
    document.getElementById('ai-ask-send').click();
    await new Promise(r => setTimeout(r, 150));
    const res = document.getElementById('ai-ask-result');
    const loadingEl = res.querySelector('.advice-ai-loading');
    const loadingText = loadingEl ? loadingEl.textContent : '';
    await new Promise(r => setTimeout(r, 900));
    return { hasLoading: !!loadingEl, loadingText, finalText: res.innerText };
  });
  console.log('C7. 加载:', JSON.stringify({ hasLoading: c7.hasLoading, text: (c7.loadingText || '').slice(0, 20) }));
  t('加载中显示「AI 分析中」转圈', c7.hasLoading === true && (c7.loadingText || '').includes('AI 分析中'), c7.loadingText);
  t('延迟后显示结果', (c7.finalText || '').includes('加载测试的回答'), c7.finalText);

  // C8. 空输入点发送 → toast「先输入问题」且不调 AI
  const countBefore8 = aiMock.count;
  const c8 = await page.evaluate(async () => {
    const input = document.getElementById('ai-ask-input');
    input.value = '   ';
    document.getElementById('ai-ask-send').click();
    await new Promise(r => setTimeout(r, 250));
    return { toast: document.body.textContent.includes('先输入问题') };
  });
  console.log('C8. 空输入:', JSON.stringify(c8));
  t('空输入点发送 → toast「先输入问题」', c8.toast === true, JSON.stringify(c8));
  t('空输入不调 AI', aiMock.count === countBefore8, 'count=' + aiMock.count + ' before=' + countBefore8);

  // C9. ✕ 关闭 → 再开另一卡弹层正常（ctx 重置）
  const c9 = await page.evaluate(async () => {
    const close = document.querySelector('.ai-ask-close');
    if (close) close.click();
    await new Promise(r => setTimeout(r, 200));
    const removed = !document.getElementById('ai-ask-overlay');
    const btns = document.querySelectorAll('button[title="本地AI建议"]');
    const b2 = btns[1] || btns[0];
    if (!b2) return { removed, reopened: false, title2: '', name2: '' };
    const uid2 = b2.id.replace('ab-', '');
    const card2 = document.getElementById('card-' + uid2);
    const name2 = card2 ? card2.dataset.ex : '';
    b2.click();
    await new Promise(r => setTimeout(r, 250));
    const ov = document.getElementById('ai-ask-overlay');
    const title2 = ov && ov.querySelector('.ai-ask-title') ? ov.querySelector('.ai-ask-title').textContent : '';
    window.closeAIActionAsk();
    return { removed, reopened: !!ov, title2, name2 };
  });
  console.log('C9. 关闭重开:', JSON.stringify(c9));
  t('✕ 关闭移除弹层', c9.removed === true, JSON.stringify(c9));
  t('再开另一卡弹层正常(头部换名)', c9.reopened === true && (c9.title2 || '').indexOf(c9.name2 || '') >= 0, JSON.stringify(c9));

  // C10. 弹层打开 390px 无横向溢出
  const c10 = await page.evaluate(async () => {
    const b = document.querySelector('button[title="本地AI建议"]');
    if (b) b.click();
    await new Promise(r => setTimeout(r, 250));
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    window.closeAIActionAsk();
    return { vw: window.innerWidth, body, doc };
  });
  console.log('C10. 弹层溢出:', JSON.stringify(c10));
  t('AI 弹层打开 390px 无横向溢出', c10.body <= c10.vw && c10.doc <= c10.vw, JSON.stringify(c10));

  // C11. 本地建议卡内「🤖 问 AI」按钮同样打开弹层（任务指定第二入口）
  const c11 = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (!sum) return { err: '无折叠摘要' };
    sum.click();
    await new Promise(r => setTimeout(r, 200));
    const aiBtn = document.querySelector('.advice-ai-btn');
    if (!aiBtn) return { err: '无问AI按钮', overlay: !!document.getElementById('ai-ask-overlay') };
    aiBtn.click();
    await new Promise(r => setTimeout(r, 250));
    const opened = !!document.getElementById('ai-ask-overlay');
    window.closeAIActionAsk();
    if (sum) sum.click();
    return { opened };
  });
  console.log('C11. 卡内问AI:', JSON.stringify(c11));
  t('本地卡内「🤖 问 AI」打开弹层', c11.opened === true, JSON.stringify(c11));

  // ===== V2.1 轮C — 图标统一标准 =====
  const iconInfo = await page.evaluate(async () => {
    const sum = document.querySelector('.advice-summary');
    if (sum) { sum.click(); await new Promise(r => setTimeout(r, 200)); }
    const card = document.querySelector('.group-exercise-card[data-ex]');
    const btns = card ? [...card.querySelectorAll('.icon-btn')] : [];
    const aiBtn = btns.find(b => b.textContent === '🤖'); // V2.2 轮C：AI 建议按钮由 💡 换为 🤖
    const favBtn = btns.find(b => b.textContent === '☆' || b.textContent === '⭐');
    const cb = card ? card.querySelector('.checkbox-custom') : null;
    const cw = card ? card.querySelector('.checkbox-wrapper') : null;
    const aai = document.querySelector('.advice-ai-btn');
    const rect = el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; };
    const font = el => parseFloat(getComputedStyle(el).fontSize);
    const info = {
      iconCount: btns.length,
      aiFont: aiBtn ? font(aiBtn) : 0, aiRect: aiBtn ? rect(aiBtn) : { w: 0, h: 0 },
      favFont: favBtn ? font(favBtn) : 0, favRect: favBtn ? rect(favBtn) : { w: 0, h: 0 },
      cbW: cb ? rect(cb).w : 0,
      cwH: cw ? rect(cw).h : 0,
      aaiH: aai ? rect(aai).h : 0,
    };
    if (sum) sum.click();
    return info;
  });
  console.log('I. 图标:', JSON.stringify(iconInfo));
  t('主卡 icon-btn ≥ 2（收藏+AI）', iconInfo.iconCount >= 2, 'n=' + iconInfo.iconCount);
  t('AI🤖 字号 ≥ 28px', iconInfo.aiFont >= 28, 'font=' + iconInfo.aiFont);
  t('AI🤖 触控区 ≥ 44px', iconInfo.aiRect.w >= 44 && iconInfo.aiRect.h >= 44, JSON.stringify(iconInfo.aiRect));
  t('☆ 字号 ≥ 28px', iconInfo.favFont >= 28, 'font=' + iconInfo.favFont);
  t('☆ 触控区 ≥ 44px', iconInfo.favRect.w >= 44 && iconInfo.favRect.h >= 44, JSON.stringify(iconInfo.favRect));
  t('勾选框 22-24px', iconInfo.cbW >= 22 && iconInfo.cbW <= 24, 'cbW=' + iconInfo.cbW);
  t('勾选框触控区 ≥ 44px', iconInfo.cwH >= 44, 'cwH=' + iconInfo.cwH);
  t('问AI按钮 ≥ 40px', iconInfo.aaiH >= 40, 'aaiH=' + iconInfo.aaiH);

  // ===== V2.0 阶段3 — AI 教练浮层（底部常驻入口 + 上下文感知对话）=====
  // 12. FAB 存在且为 AI 字母徽章（V2.1 轮C：text='AI' + nav-ai/nav-ai-lg，accent 底色）
  const fabInfo = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    if (!fab) return null;
    const cs = getComputedStyle(fab);
    return { text: (fab.textContent || '').trim(), cls: fab.className, display: cs.display, bg: cs.backgroundColor };
  });
  console.log('12. FAB:', JSON.stringify(fabInfo));
  t('FAB 存在且文案为 AI 字母', fabInfo && fabInfo.text === 'AI', JSON.stringify(fabInfo));
  t('FAB 带 nav-ai/nav-ai-lg 徽章类', fabInfo && fabInfo.cls.includes('nav-ai') && fabInfo.cls.includes('nav-ai-lg'), fabInfo && fabInfo.cls);
  // position:fixed 会把 inline-flex 块化为 flex（CSS Display 3），两者皆视为徽章可见
  t('FAB 训练页可见(flex/inline-flex)', fabInfo && (fabInfo.display === 'flex' || fabInfo.display === 'inline-flex'), JSON.stringify(fabInfo));
  t('FAB 徽章 accent 底色(非透明)', fabInfo && fabInfo.bg && fabInfo.bg !== 'rgba(0, 0, 0, 0)', fabInfo && fabInfo.bg);

  // 13. 点击 FAB 打开浮层 → 欢迎消息 + 输入框 maxlength=300
  const openInfo = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    if (!fab) return { err: '无FAB' };
    fab.click();
    return {
      overlay: !!document.getElementById('ai-coach-overlay'),
      input: !!document.getElementById('coach-input'),
      maxlength: document.getElementById('coach-input') ? document.getElementById('coach-input').maxLength : -1,
      msgCount: document.querySelectorAll('#coach-chat-box .chat-msg').length,
      welcome: document.querySelector('#coach-chat-box .chat-msg .chat-bubble') ? document.querySelector('#coach-chat-box .chat-msg .chat-bubble').textContent : '',
    };
  });
  console.log('13. 打开浮层:', JSON.stringify(openInfo));
  t('浮层已打开(overlay+input)', openInfo.overlay === true && openInfo.input === true, JSON.stringify(openInfo));
  t('输入框 maxlength=300', openInfo.maxlength === 300, 'maxlength=' + openInfo.maxlength);
  t('初始欢迎消息', openInfo.msgCount === 1 && (openInfo.welcome || '').includes('AI 教练'), openInfo.welcome);

  // 14. 发消息 → 请求上下文含当前训练日/完成度/问题 + 回复转义 + 换行→<br>
  aiMock.success = true;
  aiMock.answer = '今天推日已完成0/12组。<script>window.__coachXss=1</script>\n先练胸：杠铃平板卧推，热身组2.5kg起步。';
  const coachTest = await page.evaluate(async () => {
    const input = document.getElementById('coach-input');
    if (!input) return { err: '无输入框' };
    input.value = '今天还差什么？';
    window.sendCoachMessage();
    await new Promise(r => setTimeout(r, 800));
    const box = document.getElementById('coach-chat-box');
    const last = box.querySelector('.chat-msg:last-child');
    return { html: last ? last.innerHTML : '', text: last ? last.innerText : '', scriptEls: box.querySelectorAll('script').length, msgCount: box.querySelectorAll('.chat-msg').length };
  });
  console.log('14. 教练回复:', JSON.stringify(coachTest).slice(0, 250));
  t('发消息后消息数=3(欢迎+用户+AI)', coachTest.msgCount === 3, 'count=' + coachTest.msgCount);
  t('AI 回复内容显示', (coachTest.text || '').includes('先练胸'), coachTest.text);
  t('XSS payload 转义(无 script)', coachTest.scriptEls === 0, 'scriptEls=' + coachTest.scriptEls);
  t('换行渲染为 <br>', (coachTest.html || '').includes('<br>'), coachTest.html);
  t('请求上下文含当前训练日(推日)', (aiMock.lastContent || '').includes('推日'), aiMock.lastContent);
  t('请求上下文含完成度', (aiMock.lastContent || '').includes('完成度'), aiMock.lastContent);
  t('请求上下文含用户问题', (aiMock.lastContent || '').includes('今天还差什么'), aiMock.lastContent);

  // 15. 加载转圈 + 发送按钮禁用
  aiMock.answer = '延迟回答';
  aiMock.delay = 600;
  const loadInfo = await page.evaluate(async () => {
    const input = document.getElementById('coach-input');
    input.value = '加载中转圈';
    window.sendCoachMessage();
    await new Promise(r => setTimeout(r, 150));
    const typing = !!document.querySelector('#coach-chat-box .typing-dots');
    const btnDisabled = document.getElementById('coach-send-btn') ? document.getElementById('coach-send-btn').disabled : null;
    await new Promise(r => setTimeout(r, 900));
    return { typing, btnDisabled };
  });
  console.log('15. 加载:', JSON.stringify(loadInfo));
  t('加载中显示转圈', loadInfo.typing === true, JSON.stringify(loadInfo));
  t('加载中发送按钮禁用', loadInfo.btnDisabled === true, JSON.stringify(loadInfo));

  // 16. 失败 → ai-error 消息 + 重试按钮
  aiMock.success = false;
  aiMock.delay = 0;
  const failInfo = await page.evaluate(async () => {
    const input = document.getElementById('coach-input');
    input.value = '模拟失败';
    window.sendCoachMessage();
    await new Promise(r => setTimeout(r, 500));
    const box = document.getElementById('coach-chat-box');
    const last = box.querySelector('.chat-msg:last-child');
    return { hasRetry: !!box.querySelector('.coach-retry-btn'), lastText: last ? last.innerText : '' };
  });
  console.log('16. 失败:', JSON.stringify(failInfo));
  t('失败显示错误信息+重试按钮', failInfo.hasRetry === true && (failInfo.lastText || '').includes('模拟后端失败'), JSON.stringify(failInfo));

  // 17. 点重试 → 成功回答替换错误消息
  aiMock.success = true;
  aiMock.answer = '重试后的回答';
  const retryInfo = await page.evaluate(async () => {
    document.querySelector('.coach-retry-btn').click();
    await new Promise(r => setTimeout(r, 700));
    const box = document.getElementById('coach-chat-box');
    const last = box.querySelector('.chat-msg:last-child');
    return { lastText: last ? last.innerText : '', msgCount: box.querySelectorAll('.chat-msg').length, hasRetry: !!box.querySelector('.coach-retry-btn') };
  });
  console.log('17. 重试:', JSON.stringify(retryInfo));
  t('重试后显示 AI 回答', (retryInfo.lastText || '').includes('重试后的回答'), retryInfo.lastText);
  t('重试替换错误消息(条数不变,无重试按钮)', retryInfo.msgCount === 7 && retryInfo.hasRetry === false, JSON.stringify(retryInfo));

  // 18. 关闭浮层
  const closeInfo = await page.evaluate(() => {
    window.closeAICoach();
    return !document.getElementById('ai-coach-overlay');
  });
  console.log('18. 关闭:', closeInfo);
  t('关闭后浮层移除', closeInfo === true);

  // 19. 切离训练页：FAB 隐藏 + 浮层自动关闭
  const navInfo = await page.evaluate(() => {
    if (window.navigateTo) window.navigateTo('ai');
    return new Promise(resolve => setTimeout(() => {
      const fab = document.getElementById('ai-coach-fab');
      resolve({ fabDisplay: fab ? getComputedStyle(fab).display : 'null', overlay: !!document.getElementById('ai-coach-overlay') });
    }, 400));
  });
  console.log('19. 切页:', JSON.stringify(navInfo));
  t('切离训练页 FAB 隐藏(none)', navInfo.fabDisplay === 'none', JSON.stringify(navInfo));
  t('切离训练页浮层自动关闭', navInfo.overlay === false, JSON.stringify(navInfo));

  // 20. 回训练页：FAB 恢复可见
  const backInfo = await page.evaluate(() => {
    if (window.navigateTo) window.navigateTo('training');
    return new Promise(resolve => setTimeout(() => {
      const fab = document.getElementById('ai-coach-fab');
      resolve({ fabDisplay: fab ? getComputedStyle(fab).display : 'null' });
    }, 400));
  });
  console.log('20. 回训练页:', JSON.stringify(backInfo));
  t('回训练页 FAB 恢复(flex/inline-flex)', backInfo.fabDisplay === 'flex' || backInfo.fabDisplay === 'inline-flex', JSON.stringify(backInfo));

  // 21. 浮层打开时 390px 无横向溢出
  const overflow3 = await page.evaluate(async () => {
    document.getElementById('ai-coach-fab').click();
    await new Promise(r => setTimeout(r, 200));
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    return { vw: window.innerWidth, body, doc };
  });
  console.log('21. 浮层溢出:', JSON.stringify(overflow3));
  t('浮层打开 390px 无横向溢出', overflow3.body <= overflow3.vw && overflow3.doc <= overflow3.vw, JSON.stringify(overflow3));

  // ===== V2.0 阶段4 — 替换选择器「AI 描述」智能替补（描述→推荐→点选替换）=====
  // 22. 打开替换选择器 → AI 描述入口存在
  await page.evaluate(async () => {
    window.closeAICoach(); // 收掉阶段3浮层
    const s = window.getSettings();
    if (!s.userInfo) s.userInfo = {};
    s.userInfo.equipment = '商业健身房(器械很全)';
    window.saveSettings(s);
    await new Promise(r => setTimeout(r, 200));
  });
  const pickerInfo = await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    if (!card) return { err: '无主组动作卡' };
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
    const input = document.getElementById('ai-pick-input');
    return {
      overlay: !!document.getElementById('ex-picker-overlay'),
      input: !!input,
      placeholder: input ? input.placeholder : '',
      maxlength: input ? input.maxLength : -1,
      btn: !!document.querySelector('.ai-pick-btn'),
      cands: window._pickerCands ? window._pickerCands.length : -1,
    };
  });
  console.log('22. 选择器AI入口:', JSON.stringify(pickerInfo));
  t('选择器已打开', pickerInfo.overlay === true, JSON.stringify(pickerInfo));
  t('AI 描述输入框存在且占位正确', pickerInfo.input === true && (pickerInfo.placeholder || '').includes('文字描述'), JSON.stringify(pickerInfo));
  t('输入框 maxlength=100', pickerInfo.maxlength === 100, 'maxlength=' + pickerInfo.maxlength);
  t('🤖 推荐按钮存在', pickerInfo.btn === true);
  t('候选池非空', pickerInfo.cands > 0, 'cands=' + pickerInfo.cands);

  // 23. AI 返回池内动作 → 渲染推荐卡 → 点选即替换
  const recoName = await page.evaluate(() => ((window._pickerCands && window._pickerCands[0]) || {}).name || '');
  aiMock.success = true;
  aiMock.answer = recoName;
  aiMock.delay = 0;
  const recoTest = await page.evaluate(async () => {
    const input = document.getElementById('ai-pick-input');
    const b = document.querySelector('.ai-pick-btn');
    if (!input || !b) return { err: '无输入/按钮' };
    input.value = '肩膀不舒服想要个安全点的胸动作';
    b.click();
    await new Promise(r => setTimeout(r, 600));
    const result = document.getElementById('ai-pick-result');
    const recoCards = result ? result.querySelectorAll('.ai-pick-reco') : [];
    return {
      recoCount: recoCards.length,
      recoText: recoCards.length ? recoCards[0].innerText : '',
      title: result && result.querySelector('.ai-pick-title') ? result.querySelector('.ai-pick-title').textContent : '',
    };
  });
  console.log('23. AI推荐:', JSON.stringify(recoTest));
  t('AI 返回池内动作 → 渲染推荐卡', recoTest.recoCount >= 1, JSON.stringify(recoTest));
  t('推荐卡含该动作名', (recoTest.recoText || '').includes(recoName), recoTest.recoText + ' vs ' + recoName);
  t('推荐标题「AI 推荐（点选即替换）」', (recoTest.title || '').includes('AI 推荐'), recoTest.title);
  t('请求 prompt 含用户描述', (aiMock.lastContent || '').includes('肩膀不舒服'), aiMock.lastContent.slice(0, 200));
  t('请求 prompt 含候选池动作名', (aiMock.lastContent || '').includes(recoName), aiMock.lastContent.slice(0, 200));

  const replaceTest = await page.evaluate(async () => {
    const reco = document.querySelector('.ai-pick-reco');
    if (!reco) return { err: '无推荐卡' };
    reco.click();
    await new Promise(r => setTimeout(r, 400));
    const rec = window.getTodayRecord();
    const gid = (window._pickerCtx || {}).groupId || '';
    return {
      overlayGone: !document.getElementById('ex-picker-overlay'),
      groupSel: rec.groupSelections ? rec.groupSelections[gid] : '',
      hasCustom: (rec.exercises || []).some(e => e.groupId === gid && e.custom),
    };
  });
  console.log('23b. 点选替换:', JSON.stringify(replaceTest));
  t('点选后选择器关闭', replaceTest.overlayGone === true, JSON.stringify(replaceTest));
  t('groupSelections 已更新为推荐动作', replaceTest.groupSel === recoName, JSON.stringify(replaceTest));
  t('当日记录已写入 custom 动作', replaceTest.hasCustom === true, JSON.stringify(replaceTest));

  // 24. AI 返回库外名 → 被过滤 → 兜底错误 + 重试按钮
  await page.evaluate(async () => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    if (!card) return;
    window.openExercisePicker(card.dataset.sec, card.dataset.grp, card.dataset.groupid, card.dataset.region, card.dataset.phase);
    await new Promise(r => setTimeout(r, 300));
  });
  aiMock.success = true;
  aiMock.answer = '太空步飞踢'; // 候选池外动作
  aiMock.delay = 0;
  const outTest = await page.evaluate(async () => {
    const input = document.getElementById('ai-pick-input');
    const b = document.querySelector('.ai-pick-btn');
    if (!input || !b) return { err: '无输入/按钮' };
    input.value = '想要个玄幻动作';
    b.click();
    await new Promise(r => setTimeout(r, 600));
    const result = document.getElementById('ai-pick-result');
    return {
      recoCount: result ? result.querySelectorAll('.ai-pick-reco').length : 0,
      errText: result && result.querySelector('.ai-pick-err') ? result.querySelector('.ai-pick-err').textContent : '',
      hasRetry: !!(result && result.querySelector('.ai-pick-retry')),
    };
  });
  console.log('24. 库外兜底:', JSON.stringify(outTest));
  t('库外名被过滤(无推荐卡)', outTest.recoCount === 0, JSON.stringify(outTest));
  t('显示兜底错误+重试按钮', outTest.hasRetry === true && (outTest.errText || '').includes('未能识别'), JSON.stringify(outTest));

  // 25. AI 服务失败(success:false) → 错误 + 重试
  aiMock.success = false;
  aiMock.answer = '';
  const fail25 = await page.evaluate(async () => {
    const input = document.getElementById('ai-pick-input');
    const b = document.querySelector('.ai-pick-btn');
    input.value = '测试失败';
    b.click();
    await new Promise(r => setTimeout(r, 600));
    const result = document.getElementById('ai-pick-result');
    return { text: result ? result.innerText : '', hasRetry: !!(result && result.querySelector('.ai-pick-retry')) };
  });
  console.log('25. AI失败:', JSON.stringify(fail25));
  t('AI 失败显示错误+重试', fail25.hasRetry === true && (fail25.text || '').includes('模拟后端失败'), JSON.stringify(fail25));

  // 26. 空描述 → 提示先输入（不调 AI）
  const emptyTest = await page.evaluate(async () => {
    const input = document.getElementById('ai-pick-input');
    const b = document.querySelector('.ai-pick-btn');
    input.value = '';
    b.click();
    await new Promise(r => setTimeout(r, 200));
    const result = document.getElementById('ai-pick-result');
    return { text: result ? result.innerText : '' };
  });
  console.log('26. 空描述:', JSON.stringify(emptyTest));
  t('空描述提示先输入', (emptyTest.text || '').includes('请先输入描述'), JSON.stringify(emptyTest));

  // 27. 再触发一次兜底错误 → 点重试 → 成功后渲染推荐卡
  const validName27 = await page.evaluate(() => ((window._pickerCands && window._pickerCands[0]) || {}).name || '');
  aiMock.success = true;
  aiMock.answer = '库外动作X';
  await page.evaluate(async () => {
    const input = document.getElementById('ai-pick-input');
    const b = document.querySelector('.ai-pick-btn');
    input.value = '再来一次';
    b.click();
    await new Promise(r => setTimeout(r, 500));
  });
  aiMock.answer = validName27;
  const retry27 = await page.evaluate(async () => {
    const retryBtn = document.querySelector('.ai-pick-retry');
    if (!retryBtn) return { err: '无重试按钮' };
    retryBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const result = document.getElementById('ai-pick-result');
    return { recoCount: result ? result.querySelectorAll('.ai-pick-reco').length : 0, hasRetry: !!(result && result.querySelector('.ai-pick-retry')) };
  });
  console.log('27. 重试:', JSON.stringify(retry27));
  t('重试成功后渲染推荐卡(无残留重试)', retry27.recoCount >= 1 && retry27.hasRetry === false, JSON.stringify(retry27));

  // 28. 选择器打开（含 AI 描述行）时 390px 无横向溢出
  const overflow4 = await page.evaluate(() => {
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    return { vw: window.innerWidth, body, doc };
  });
  console.log('28. 选择器溢出:', JSON.stringify(overflow4));
  t('选择器打开 390px 无横向溢出', overflow4.body <= overflow4.vw && overflow4.doc <= overflow4.vw, JSON.stringify(overflow4));

  // ===== V2.1 轮D — 记录板块：重量×组数×次数 =====
  // 清理阶段4 残留 overlay（ex-picker 选择器 / AI 弹层 / 长按菜单 / 教练浮层），避免遮挡卡片影响长按
  await page.evaluate(() => {
    ['ex-picker-overlay', 'ai-ask-overlay', 'card-menu-overlay', 'coach-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    if (window.closeAICoach) { try { window.closeAICoach(); } catch (e) {} }
    window.renderTrainingPage();
  });
  await page.waitForTimeout(300);

  // D1. 旧数据兼容：历史只有 weight/reps 无 sets → 卡片底部常驻行组数输入为空、不报错（V2.2 轮B：录入行已移至卡片底部 .card-record-row）
  await page.evaluate(() => {
    // 与 longPressCard(0) 一致：取第一张主组卡（V2.2 轮E 起只有主组卡有常驻录入行），确保 recEx 能匹配
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    const gid = card.dataset.groupid, exName = card.dataset.ex;
    const rec = window.getTodayRecord();
    rec.exercises = [{ name: exName, groupId: gid, weight: 60, reps: 12 }]; // 无 sets 的旧数据
    rec.groupSelections = { [gid]: exName };
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    return { ex: rec.exercises[0] };
  });
  await page.waitForTimeout(300);
  const d1 = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    const row = card ? card.querySelector('.card-record-row') : null;
    const inputs = row ? row.querySelectorAll('.weight-input-sm') : [];
    const out = {
      rowExists: !!row,
      inputCount: inputs.length,
      weightVal: inputs[0] ? inputs[0].value : 'n/a',
      setsVal: inputs[1] ? inputs[1].value : 'n/a',
      repsVal: inputs[2] ? inputs[2].value : 'n/a',
      jsError: false,
    };
    return out;
  });
  console.log('D1. 旧数据兼容:', JSON.stringify(d1));
  t('旧数据(无sets)常驻行不报错、组数输入为空', d1.rowExists === true && d1.inputCount === 3 && d1.weightVal === '60' && d1.setsVal === '' && d1.repsVal === '12', JSON.stringify(d1));

  // D2. AI 复盘 report：有 weight/sets/reps → 「kg × N组×N次」+ 今日总训练量
  const d2 = await page.evaluate(async () => {
    const rec = window.getTodayRecord();
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    const gid = card.dataset.groupid, exName = card.dataset.ex;
    rec.exercises = [{ name: exName, groupId: gid, weight: 60, sets: 3, reps: 12, completed: true }];
    rec.groupSelections = { [gid]: exName };
    window.saveTodayRecord(rec);
    window.renderTrainingPage();
    return { gid, exName };
  });
  await page.waitForTimeout(300);
  aiMock.success = true; aiMock.answer = 'OK'; aiMock.delay = 0;
  await page.evaluate(() => window.submitForRating());
  await page.waitForTimeout(600);
  const report2 = aiMock.lastContent || '';
  console.log('D2. AI复盘 report:', report2.replace(/\n/g, '\\n').slice(0, 220));
  t('report 含「60kg × 3组×12次」完整记录', report2.includes('60kg × 3组×12次'), report2.slice(0, 120));
  t('report 含「今日总训练量：2160 kg」', report2.includes('今日总训练量：2160 kg'), report2.slice(0, 200));

  // D3. 旧数据(仅 weight/reps 无 sets) → report 用旧格式、无训练量行、不报错
  await page.evaluate(() => {
    const rec = window.getTodayRecord();
    const e = rec.exercises[0];
    delete e.sets; // 模拟旧数据
    window.saveTodayRecord(rec);
  });
  await page.evaluate(() => window.submitForRating());
  await page.waitForTimeout(600);
  const report3 = aiMock.lastContent || '';
  console.log('D3. 旧数据 report:', report3.replace(/\n/g, '\\n').slice(0, 160));
  t('旧数据 report 用「60kg」旧格式', report3.includes(' 60kg') && !report3.includes('× 3组×12次'), report3.slice(0, 120));
  t('旧数据(组数0) 无今日总训练量行', !report3.includes('今日总训练量'), report3.slice(0, 160));

  // D4. 历史详情：动作信息带 组×次数（有则显示）
  const d4 = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.group-exercise-card[data-ex][data-phase="main"]')][0];
    const gid = card.dataset.groupid, exName = card.dataset.ex;
    const records = window.getRecords();
    records.push({
      id: 'hist-d4', date: '2026-08-01', type: 'push', completed: true,
      exercises: [{ name: exName, groupId: gid, weight: 60, sets: 3, reps: 12, completed: true }],
      groupSelections: { [gid]: exName },
    });
    window.saveRecords(records);
    window.viewHistoryRecord('hist-d4');
    return { gid, exName };
  });
  await page.waitForTimeout(300);
  const d4content = await page.evaluate(() => document.getElementById('training-content').textContent);
  const d4check = await page.evaluate(() => {
    window.backToTraining();
    const records = window.getRecords();
    window.saveRecords(records.filter(r => r.id !== 'hist-d4'));
    window.renderTrainingPage();
    return true;
  });
  console.log('D4. 历史详情含组次:', d4content.includes('3组×12次'), '| 含重量:', d4content.includes('60kg'));
  t('历史详情动作行带「3组×12次」', d4content.includes('3组×12次'), d4content.slice(0, 200));
  t('历史详情含重量 60kg', d4content.includes('60kg'), d4content.slice(0, 200));

  // ===== V2.2 轮C — AI 教练球可拖动 + localStorage 记位置 =====
  // 清理此前拖拽痕迹，回到 CSS 默认右下定位
  await page.evaluate(() => {
    localStorage.removeItem('fitness_coach_pos');
    window.renderTrainingPage();
  });
  await page.waitForTimeout(300);

  // C1. FAB 初始为 CSS 默认定位（bottom/right），无 inline left/top
  const fabC1 = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    if (!fab) return null;
    const r = fab.getBoundingClientRect();
    return {
      hasClass: fab.classList.contains('ai-coach-fab'),
      inlineLeft: fab.style.left, inlineTop: fab.style.top,
      left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
      w: Math.round(r.width), h: Math.round(r.height),
      pos: localStorage.getItem('fitness_coach_pos'),
    };
  });
  console.log('C1. FAB初始:', JSON.stringify(fabC1));
  t('C1. FAB 带 ai-coach-fab 类', fabC1 && fabC1.hasClass === true, JSON.stringify(fabC1));
  t('C1b. FAB 初始无 inline left(右下默认)', fabC1 && fabC1.inlineLeft === '' && fabC1.right > 300 && fabC1.pos === null, JSON.stringify(fabC1));
  t('C1c. FAB 尺寸 52px 徽章(≥44 触控)', fabC1 && fabC1.w >= 44 && fabC1.h >= 44, JSON.stringify(fabC1));

  // C2. mouse 拖拽 FAB（左移120/下移40，避开边缘 clamp）→ 位置变化 + 写入 localStorage
  if (fabC1) {
    await page.mouse.move(fabC1.left + fabC1.w / 2, fabC1.top + fabC1.h / 2);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(fabC1.left + fabC1.w / 2 - 120 * i / 10, fabC1.top + fabC1.h / 2 + 40 * i / 10);
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  const fabC2 = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    const r = fab.getBoundingClientRect();
    return {
      left: Math.round(r.left), top: Math.round(r.top),
      inlineLeft: fab.style.left, inlineTop: fab.style.top,
      pos: localStorage.getItem('fitness_coach_pos'),
    };
  });
  console.log('C2. FAB拖后:', JSON.stringify(fabC2));
  t('C2. 拖拽后 FAB 位置变化(Δ>30px)', fabC2 && (Math.abs(fabC2.left - fabC1.left) > 30 || Math.abs(fabC2.top - fabC1.top) > 30), JSON.stringify(fabC2));
  t('C2b. 拖拽写入 inline left/top', fabC2 && fabC2.inlineLeft !== '' && fabC2.inlineTop !== '', JSON.stringify(fabC2));
  t('C3. localStorage.fitness_coach_pos 已写入', fabC2 && fabC2.pos && fabC2.pos.includes('"x"') && fabC2.pos.includes('"y"'), fabC2 && fabC2.pos);

  // C4. 重新渲染 → FAB 恢复拖拽位置（localStorage 生效）
  await page.evaluate(() => { window.renderTrainingPage(); });
  await page.waitForTimeout(300);
  const fabC4 = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    const r = fab.getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top) };
  });
  console.log('C4. FAB恢复:', JSON.stringify(fabC4));
  t('C4. 重渲染后恢复拖拽位置(±8px)', fabC4 && Math.abs(fabC4.left - fabC2.left) <= 8 && Math.abs(fabC4.top - fabC2.top) <= 8, JSON.stringify(fabC4));

  // C5. 单击（原位 down+up）→ 打开 AI 教练浮层
  await page.mouse.move(fabC4.left + 26, fabC4.top + 26);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(250);
  const fabC5 = await page.evaluate(() => ({ overlay: !!document.getElementById('ai-coach-overlay') }));
  console.log('C5. FAB单击:', JSON.stringify(fabC5));
  t('C5. 单击 FAB 打开浮层', fabC5.overlay === true, JSON.stringify(fabC5));
  await page.evaluate(() => { try { window.closeAICoach(); } catch (e) {} });
  await page.waitForTimeout(200);

  // C6. 再次拖拽（大幅移动）→ 不误开浮层（拖拽后 click 被吞）
  const fabC6 = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    const r = fab.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  await page.mouse.move(fabC6.cx, fabC6.cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(fabC6.cx - 80 * i / 10, fabC6.cy - 40 * i / 10);
  await page.mouse.up();
  await page.waitForTimeout(250);
  const fabC6r = await page.evaluate(() => ({ overlay: !!document.getElementById('ai-coach-overlay') }));
  console.log('C6. 拖后不误开浮层:', JSON.stringify(fabC6r));
  t('C6. 拖拽不触发浮层打开', fabC6r.overlay === false, JSON.stringify(fabC6r));

  // 清理拖拽痕迹，避免影响其他套件
  await page.evaluate(() => {
    localStorage.removeItem('fitness_coach_pos');
    window.renderTrainingPage();
  });
  await page.waitForTimeout(200);

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
