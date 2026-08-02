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

  // 2. 展开/收起
  const toggle = await page.evaluate(async () => {
    const btn = document.querySelector('button[title="本地AI建议"]');
    if (!btn) return { err: '无💡按钮' };
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const uid = btn.id.replace('ab-', '');
    const card = document.getElementById('advice-' + uid);
    const visibleOpen = card && card.style.display !== 'none' && card.offsetHeight > 0;
    const title = card ? card.querySelector('.advice-title')?.textContent : '';
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const visibleClose = card.style.display === 'none';
    return { visibleOpen, title, visibleClose };
  });
  console.log('2. 展开/收起:', JSON.stringify(toggle));
  t('点击展开显示建议卡', toggle.visibleOpen === true);
  t('标题为「本地建议」', (toggle.title || '').includes('本地建议'));
  t('再次点击收起', toggle.visibleClose === true);

  // 3. 展开后 4 项内容（要点/重量/休息/替换）
  const content = await page.evaluate(async () => {
    const btn = document.querySelector('button[title="本地AI建议"]');
    btn.click();
    await new Promise(r => setTimeout(r, 200));
    const uid = btn.id.replace('ab-', '');
    const card = document.getElementById('advice-' + uid);
    const labels = [...card.querySelectorAll('.advice-label')].map(x => x.textContent);
    const items = {};
    card.querySelectorAll('.advice-item').forEach(it => {
      const lb = it.querySelector('.advice-label').textContent;
      items[lb] = it.textContent.replace(lb, '').trim();
    });
    btn.click();
    await new Promise(r => setTimeout(r, 200));
    return { labels, items };
  });
  console.log('3. 建议内容:', JSON.stringify(content.items));
  t('有 要点 项', content.labels.includes('要点') && content.items['要点'].length > 0);
  t('有 重量 项', content.labels.includes('重量') && content.items['重量'].length > 0);
  t('有 休息 项', content.labels.includes('休息') && content.items['休息'].length > 0);
  t('重量项无 undefined', !/undefined|null|NaN/.test(content.items['重量'] || ''));
  t('休息项含 秒', (content.items['休息'] || '').includes('秒'));

  // 4. 重量建议文本合理性（主组首个动作若无历史 → 首次做；若有历史 → 上次X建议Y）
  const weightText = content.items['重量'] || '';
  t('重量项为预期格式', /首次做|上次.*建议/.test(weightText), weightText);

  // 5. 休息日无 💡 按钮
  const rest = await page.evaluate(async () => {
    if (window.switchTrainingDay) { try { window.switchTrainingDay('rest'); } catch (e) {} }
    await new Promise(r => setTimeout(r, 300));
    return document.querySelectorAll('button[title="本地AI建议"]').length;
  });
  console.log('5. 休息日 💡 按钮数:', rest);
  t('休息日无 💡 按钮', rest === 0);

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

  // 7. 点 💡 展开 → 点「问 AI」→ 显示转义后的回复（XSS payload + 换行）
  aiMock.answer = '动作要领：肩胛收紧，杠贴近胸骨。<script>window.__xss=1</script>\n第二行针对性建议：手腕保持中立位。';
  const ask1 = await page.evaluate(async () => {
    const b = document.querySelector('button[title="本地AI建议"]');
    if (!b) return { err: '无💡按钮' };
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const uid = b.id.replace('ab-', '');
    const aiBtn = document.getElementById('aai-btn-' + uid);
    if (!aiBtn) return { err: '无问AI按钮' };
    aiBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const res = document.getElementById('aai-result-' + uid);
    return { html: res.innerHTML, text: res.innerText, scriptEls: res.querySelectorAll('script').length };
  });
  console.log('7. 问AI回复:', JSON.stringify(ask1).slice(0, 200));
  t('点击「问 AI」显示 AI 回复', (ask1.text || '').includes('动作要领'), ask1.err || ask1.html);
  t('XSS payload 已转义（无 script 元素）', ask1.scriptEls === 0, 'scriptEls=' + ask1.scriptEls);
  t('换行渲染为 <br>', (ask1.html || '').includes('<br>'), ask1.html);
  t('AI 回复无 JS 错误注入', errs.length === 0, errs.join(' | '));

  // 8. 缓存：re-render 后预填显示，重复问不重复调 aiFetch
  const cacheTest = await page.evaluate(async () => {
    window.renderTrainingPage();
    await new Promise(r => setTimeout(r, 400));
    const b = document.querySelector('button[title="本地AI建议"]');
    if (!b) return { err: 're-render 后无💡按钮' };
    const uid = b.id.replace('ab-', '');
    const card = document.getElementById('advice-' + uid);
    if (card && card.style.display === 'none') { b.click(); await new Promise(r => setTimeout(r, 250)); }
    const res = document.getElementById('aai-result-' + uid);
    const store = JSON.parse(localStorage.getItem('fitness_ai_action_cache') || '{}');
    return { resText: res ? res.innerText : '', cacheKeys: Object.keys(store).length, first: store[Object.keys(store)[0]] || {} };
  });
  console.log('8. 缓存:', JSON.stringify({ resText: (cacheTest.resText || '').slice(0, 30), cacheKeys: cacheTest.cacheKeys }));
  t('re-render 后缓存预填显示回复', (cacheTest.resText || '').includes('动作要领'), cacheTest.resText);
  t('缓存已写入 localStorage', cacheTest.cacheKeys >= 1, 'keys=' + cacheTest.cacheKeys);
  t('缓存带时间戳', typeof cacheTest.first.ts === 'number', JSON.stringify(cacheTest.first));
  t('重复问不重复调 aiFetch（count 仍=1）', aiMock.count === 1, 'count=' + aiMock.count);

  // 9. 失败路径：mock 返回 success:false → 显示错误 + 重试按钮（换第二个动作，避免缓存命中）
  aiMock.success = false;
  const failTest = await page.evaluate(async () => {
    const btns = document.querySelectorAll('button[title="本地AI建议"]');
    const b = btns[1];
    if (!b) return { err: '无第二个💡按钮' };
    const uid = b.id.replace('ab-', '');
    const card = document.getElementById('advice-' + uid);
    if (card && card.style.display === 'none') { b.click(); await new Promise(r => setTimeout(r, 200)); }
    const aiBtn = document.getElementById('aai-btn-' + uid);
    if (!aiBtn) return { err: '无问AI按钮' };
    aiBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const res = document.getElementById('aai-result-' + uid);
    const errEl = res.querySelector('.advice-ai-err');
    return { html: res.innerHTML, hasRetry: !!res.querySelector('.advice-ai-retry'), errText: errEl ? errEl.textContent : '' };
  });
  console.log('9. 失败重试:', JSON.stringify(failTest));
  t('失败显示错误信息', (failTest.errText || '').includes('模拟后端失败'), failTest.errText);
  t('失败显示重试按钮', failTest.hasRetry === true, failTest.html);

  // 10. 加载中转圈：mock 延迟 → 加载中出现「AI 分析中」样式，延迟后显示结果
  aiMock.success = true;
  aiMock.answer = '延迟后的讲解：肘部贴紧，控制离心。';
  aiMock.delay = 600;
  const loadingTest = await page.evaluate(async () => {
    const btns = document.querySelectorAll('button[title="本地AI建议"]');
    const b = btns[2] || btns[1];
    const uid = b.id.replace('ab-', '');
    const card = document.getElementById('advice-' + uid);
    if (card && card.style.display === 'none') { b.click(); await new Promise(r => setTimeout(r, 200)); }
    const aiBtn = document.getElementById('aai-btn-' + uid);
    if (!aiBtn) return { err: '无问AI按钮' };
    aiBtn.click();
    await new Promise(r => setTimeout(r, 150));
    const res = document.getElementById('aai-result-' + uid);
    const loadingEl = res.querySelector('.advice-ai-loading');
    const loadingText = loadingEl ? loadingEl.textContent : '';
    await new Promise(r => setTimeout(r, 900));
    return { hasLoading: !!loadingEl, loadingText, finalText: res.innerText };
  });
  console.log('10. 转圈:', JSON.stringify({ hasLoading: loadingTest.hasLoading, text: (loadingTest.loadingText || '').slice(0, 20) }));
  t('加载中显示「AI 分析中」转圈', loadingTest.hasLoading === true && (loadingTest.loadingText || '').includes('AI 分析中'), loadingTest.loadingText);
  t('延迟后显示结果', (loadingTest.finalText || '').includes('延迟后的讲解'), loadingTest.finalText);

  // 11. 390px 无横向溢出（「问 AI」按钮宽 100% 不破版）
  const overflow2 = await page.evaluate(() => {
    const body = document.body.scrollWidth;
    const doc = document.documentElement.scrollWidth;
    return { vw: window.innerWidth, body, doc };
  });
  console.log('11. 横向宽度:', JSON.stringify(overflow2));
  t('追加后 390px 无横向溢出', overflow2.body <= overflow2.vw && overflow2.doc <= overflow2.vw, JSON.stringify(overflow2));

  // ===== V2.0 阶段3 — AI 教练浮层（底部常驻入口 + 上下文感知对话）=====
  // 12. FAB 存在且训练页可见
  const fabInfo = await page.evaluate(() => {
    const fab = document.getElementById('ai-coach-fab');
    return fab ? { text: fab.textContent, display: getComputedStyle(fab).display } : null;
  });
  console.log('12. FAB:', JSON.stringify(fabInfo));
  t('FAB 存在且文案为 AI 教练', fabInfo && (fabInfo.text || '').includes('AI 教练'), JSON.stringify(fabInfo));
  t('FAB 训练页可见(flex)', fabInfo && fabInfo.display === 'flex', JSON.stringify(fabInfo));

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
  t('回训练页 FAB 恢复(flex)', backInfo.fabDisplay === 'flex', JSON.stringify(backInfo));

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
    const btn = document.querySelector('button[title="替换/新增动作"]');
    if (!btn) return { err: '无➕按钮' };
    btn.click();
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
    const btn = document.querySelector('button[title="替换/新增动作"]');
    if (btn) btn.click();
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

  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
