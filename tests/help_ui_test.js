const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem('app_tutorial_done', '1');
    // 清掉所有 help 已看标记，模拟全新用户
    Object.keys(localStorage).filter(k => k.startsWith('fitness_help_seen_')).forEach(k => localStorage.removeItem(k));
  });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 100)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const modules = ['stats', 'plans', 'ai-coach', 'exercises', 'coach-log', 'posture', 'weight'];
  let pass = 0, fail = 0;
  const t = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log(`  ❌ ${name} ${detail || ''}`); } };

  for (const id of modules) {
    const r = await page.evaluate(async (id) => {
      const seenKey = 'fitness_help_seen_' + id;
      localStorage.removeItem(seenKey);           // 模拟首访
      openFeatureModule(id);
      await new Promise(r2 => setTimeout(r2, 150));
      const body = document.getElementById('help-body-' + id);
      const firstVisible = body && body.style.display !== 'none';
      const firstText = body ? body.textContent : '';
      const introOk = firstText.trim().length > 0;
      const liCount = body ? body.querySelectorAll('li').length : 0;
      // 二次访问：重开 → 应折叠
      openFeatureModule(id);
      await new Promise(r2 => setTimeout(r2, 150));
      const body2 = document.getElementById('help-body-' + id);
      const secondCollapsed = body2 && body2.style.display === 'none';
      // 手动再展开
      toggleHelp(id);
      await new Promise(r2 => setTimeout(r2, 100));
      const reExpanded = body2 && body2.style.display !== 'none';
      // 布局：无横向溢出
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      return { firstVisible, introOk, liCount, secondCollapsed, reExpanded, overflow };
    }, id);
    const ok = r.firstVisible && r.introOk && r.liCount >= 3 && r.secondCollapsed && r.reExpanded && !r.overflow;
    console.log(`${ok ? '✅' : '❌'} 模块 ${id}: 首展=${r.firstVisible} 简介=${r.introOk} 步骤${r.liCount} 二访折叠=${r.secondCollapsed} 再展开=${r.reExpanded} 无横向溢出=${!r.overflow}`);
    t('模块 ' + id, ok, JSON.stringify(r));
  }
  console.log('=== 控制台错误:', errs.length ? errs.join('\n') : '无');
  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  await browser.close();
})();
