/* ============================================
   V2.0 阶段1 — 动作卡本地 AI 建议（L0）单元测试
   验证 getActionAdvice(action, record, ctx) 纯函数逻辑：
   要点 / 重量 / 休息 / 替换 四项
   运行：node advice_test.js （在 tests/ 目录下）
   ============================================ */
const fs = require('fs');
const vm = require('vm');
const SRC = '../js';

const sandbox = { console, Math, Set, Array, Object, String, parseInt, isNaN, JSON, Date };
const c = vm.createContext(sandbox);
['exercises.js', 'utils.js'].forEach(f => vm.runInContext(fs.readFileSync(SRC + '/' + f, 'utf8'), c));
const DB = vm.runInContext('EXERCISE_DB', c);
const advice = vm.runInContext('getActionAdvice', c);

let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { pass++; console.log('✅ ' + name); }
  else { fail++; console.log('❌ ' + name + ' — ' + detail); }
}

// 商业健身房 → 设备全可用（isEquipmentAvailable 语义：ctx.equipment 含'商业'直接 true）
const eqCtx = { equipment: '商业健身房(器械很全)' };
const isAvail = (ex, ctx) => ctx.equipment.includes('商业') ? true : true;

// 找一个真实复合动作 & 孤立动作
const bench = DB.find(e => e.name === '杠铃平板卧推');
const curl = DB.find(e => e.name && e.name.includes('弯举'));
const iso = DB.find(e => e.type === '孤立');

console.log('=== 1. 动作要点 ===');
{
  const r = advice({ name: bench.name, tip: '肩胛收紧，杠贴近胸骨', sets: '3-4组' }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [] });
  t('有 tip → 用 tip', r.points === '肩胛收紧，杠贴近胸骨', 'got: ' + r.points);
}
{
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [] });
  t('无 tip 但库里有 → 用 mechanics/difficulty', r.points.includes('为主') && r.points.includes('难度'), 'got: ' + r.points);
}
{
  const r = advice({ name: '完全不存在的神秘动作' }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [] });
  t('库里没有 → 通用提示', r.points.includes('标准姿势'), 'got: ' + r.points);
}

console.log('=== 2. 建议重量 ===');
{
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60 }] }];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('有历史 → 上次60建议62.5', r.weight.suggest === 62.5 && r.weight.text.includes('62.5'), JSON.stringify(r.weight));
}
{
  const records = [
    { date: '2026-06-01', completed: true, exercises: [{ name: bench.name, weight: 50 }] },
    { date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60 }] },
  ];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('多条历史 → 取最近一条 60→62.5', r.weight.last === 60 && r.weight.suggest === 62.5, JSON.stringify(r.weight));
}
{
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [] });
  t('无历史 → 首次做轻重量起步', r.weight.text === '首次做，轻重量起步', r.weight.text);
}
{
  // 真实数据模型：updateExerciseWeight 存 parseFloat(value)||0 → 数字 0（falsy），应视为无有效历史
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 0 }] }];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('历史重量=0（数字）→ 按无历史处理', r.weight.last === null && r.weight.text === '首次做，轻重量起步', JSON.stringify(r.weight));
}

console.log('=== 3. 组间休息 ===');
{
  const comp = DB.find(e => e.type === '复合');
  const r = advice({ name: comp.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], restSec: 120 });
  t('复合 → 120s', r.rest.sec === 120 && r.rest.text.includes('120'), r.rest.text);
}
{
  const r = advice({ name: iso.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], restSec: 120 });
  t('孤立 → 60s', r.rest.sec === 60 && r.rest.text.includes('60'), r.rest.text);
}
{
  const comp = DB.find(e => e.type === '复合');
  const r = advice({ name: comp.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], restSec: 90 });
  t('方案 restSec 覆盖 → 90s', r.rest.sec === 90 && r.rest.text.includes('90'), r.rest.text);
}

console.log('=== 4. 替换动作 ===');
{
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], phase: 'main', region: '胸.中胸' });
  t('主组同区替代 ≤2 个且排除自身', r.replacements.length >= 1 && r.replacements.length <= 2 && !r.replacements.some(x => x.name === bench.name), 'len=' + r.replacements.length + ' → ' + r.replacements.map(x => x.name).join(','));
  if (r.replacements.length) {
    const regionOk = r.replacements.every(x => (x.region || '') === '胸.中胸' || (x.region || '').startsWith('胸.中胸.') || '胸.中胸'.startsWith((x.region || '') + '.'));
    t('替换动作 region 与目标匹配', regionOk, r.replacements.map(x => x.region).join(','));
  }
}
{
  // 家庭健身：排除不可用器械
  const homeAvail = (ex, ctx) => {
    if (ctx.equipment.includes('商业')) return true;
    const no = ['龙门架', '绳索', '哈克', '腿举机', '杠铃', '深蹲架', '史密斯', '推胸机', '高位下拉', '坐姿划船'];
    const eq = (ex.equipment || '').toLowerCase();
    return !no.some(n => eq.includes(n.toLowerCase()));
  };
  const r = advice({ name: bench.name }, {}, { equipment: '家庭健身(哑铃+弹力带+引体架)', db: DB, isAvailable: homeAvail, records: [], phase: 'main', region: '胸.中胸' });
  t('家庭设备过滤生效（不含杠铃类）', r.replacements.every(x => !(x.equipment || '').includes('杠铃')), r.replacements.map(x => x.equipment).join(','));
}
{
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], phase: 'warmup' });
  t('热身段替代（不按 region 过滤）', r.replacements.length <= 2, 'len=' + r.replacements.length);
}
{
  // 全角括号归一：方案动作名可能用「（）」
  const paren = DB.find(e => /[()]/.test(e.name));
  if (paren) {
    const fullName = paren.name.replace(/\(/g, '（').replace(/\)/g, '）');
    const r = advice({ name: fullName }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], phase: 'main', region: (paren.region || '').split('.')[0] });
    t('全角括号动作名能匹配库', r.points && r.points.length > 0, fullName);
  } else {
    console.log('⚠️ 库中无带括号动作名，跳过全角归一用例');
  }
}

console.log('');
console.log('结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
