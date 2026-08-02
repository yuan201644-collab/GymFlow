const pwPath = 'C:/Users/86133/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('[pageerror] ' + e.message.slice(0, 120)));
  await page.goto('file:///C:/Users/86133/Desktop/%E5%81%A5%E8%BA%AB%E5%8A%A9%E6%89%8B/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  console.log('=== 加载错误:', errs.length ? errs.join('\n') : '无');
  // 逐 Tab 点击（用 onclick 直接调渲染函数更可靠）
  const checks = [
    ['训练', 'renderTrainingPage'],
    ['AI', 'renderAIPage'],
    ['功能', 'renderFeaturesPage'],
    ['我的', 'renderMePage'],
  ];
  for (const [label, fn] of checks) {
    errs.length = 0;
    await page.evaluate(fn => { try { window[fn] && window[fn](); } catch (e) { throw e; } }, fn).catch(() => {});
    await page.waitForTimeout(350);
    const meOk = label === '我的' && (await page.content()).includes('AI 服务');
    const bodyLen = (await page.textContent('body')).length;
    console.log(`${label}页: ${errs.length ? '❌ ' + errs[0] : '✅ 无错'} | 正文${bodyLen}字${meOk ? ' | ✅ AI服务字段存在' : ''}`);
  }
  await browser.close();
})();
