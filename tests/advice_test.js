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
const summary = vm.runInContext('buildAdviceSummary', c);
const volEx = vm.runInContext('calcExerciseVolume', c);
const volTotal = vm.runInContext('calcTrainingVolume', c);
const fmtSetsReps = vm.runInContext('formatSetsReps', c);
const detailFn = vm.runInContext('buildActionDetail', c);
const warnFn = vm.runInContext('extractWarnFromTip', c);

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

console.log('=== 5. buildAdviceSummary 折叠摘要（V2.1 轮A）===');
{
  // 有历史重量 + 复合动作 → 建议62.5kg · 休息120s
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60 }] }];
  const r = advice({ name: bench.name, tip: '肩胛收紧，杠贴近胸骨' }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records, restSec: 120 });
  const s = summary(r);
  t('有历史 → 含「建议62.5kg」', s.includes('建议62.5kg'), s);
  t('含「要点」标签', s.includes('要点'), s);
  t('复合动作 → 含「休息120s」', s.includes('休息120s'), s);
  t('points 即为 tip 原文（tip 并入后要点唯一来源）', r.points === '肩胛收紧，杠贴近胸骨', r.points);
}
{
  // 无历史 → 轻重量起步（非 建议0kg）
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [] });
  const s = summary(r);
  t('无历史 → 含「轻重量起步」', s.includes('轻重量起步'), s);
  t('无历史 → 不出 建议Xkg', !/建议\d+kg/.test(s), s);
}
{
  // 孤立动作 → 60s（restSec 覆盖不生效，孤立优先）
  const r = advice({ name: iso.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records: [], restSec: 120 });
  const s = summary(r);
  t('孤立动作 → 含「休息60s」', s.includes('休息60s'), s);
}
{
  const s = summary(null);
  t('advice=null → 兜底「💡 本地建议」', s === '💡 本地建议', s);
}
{
  const s = summary({});
  t('advice=空对象 → 兜底不抛错', typeof s === 'string' && s.length > 0, s);
}

console.log('=== 6. 训练量计算（V2.1 轮D）===');
{
  t('单动作 60×3×12=2160', volEx(60, 3, 12) === 2160, 'got=' + volEx(60, 3, 12));
  t('字符串入参归一化', volEx('60', '3', '12') === 2160, 'got=' + volEx('60', '3', '12'));
  t('缺组数 → 0', volEx(60, 0, 12) === 0, 'got=' + volEx(60, 0, 12));
  t('缺次数 → 0', volEx(60, 3, 0) === 0, 'got=' + volEx(60, 3, 0));
  t('重量 0 → 0', volEx(0, 3, 12) === 0, 'got=' + volEx(0, 3, 12));
  t('负重量 → 0', volEx(-5, 3, 12) === 0, 'got=' + volEx(-5, 3, 12));
  t('undefined 入参 → 0 不抛错', volEx() === 0, 'got=' + volEx());
}
{
  t('多动作求和 2160+1200=3360', volTotal([{ weight: 60, sets: 3, reps: 12 }, { weight: 20, sets: 4, reps: 15 }]) === 3360, 'got=' + volTotal([{ weight: 60, sets: 3, reps: 12 }, { weight: 20, sets: 4, reps: 15 }]));
  t('空数组 → 0', volTotal([]) === 0, 'got=' + volTotal([]));
  t('null 输入 → 0', volTotal(null) === 0, 'got=' + volTotal(null));
  t('含 null 项 → 跳过不抛错', volTotal([null, { weight: 60, sets: 3, reps: 12 }]) === 2160, 'got=' + volTotal([null, { weight: 60, sets: 3, reps: 12 }]));
  t('全无效项 → 0', volTotal([{ weight: 0, sets: 0, reps: 0 }, { weight: 60, sets: 0, reps: 12 }]) === 0, 'got=' + volTotal([{ weight: 0, sets: 0, reps: 0 }, { weight: 60, sets: 0, reps: 12 }]));
}
{
  t('3组×12次', fmtSetsReps(3, 12) === '3组×12次', 'got=' + fmtSetsReps(3, 12));
  t('字符串入参', fmtSetsReps('3', '12') === '3组×12次', 'got=' + fmtSetsReps('3', '12'));
  t('组数 0 → 空串', fmtSetsReps(0, 12) === '', 'got=' + fmtSetsReps(0, 12));
  t('次数 0 → 空串', fmtSetsReps(3, 0) === '', 'got=' + fmtSetsReps(3, 0));
  t('undefined → 空串', fmtSetsReps(undefined, undefined) === '', 'got=' + fmtSetsReps(undefined, undefined));
}

console.log('=== 7. getActionAdvice 建议重量含组×次数（V2.1 轮D）===');
{
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60, sets: 3, reps: 12 }] }];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('历史含 sets/reps → 文本带「上次 60kg × 3组×12次」', r.weight.text.includes('上次 60kg × 3组×12次') && r.weight.text.includes('建议 62.5kg'), r.weight.text);
  t('suggest 仍为上次+2.5', r.weight.suggest === 62.5, JSON.stringify(r.weight));
}
{
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60 }] }];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('旧数据只有重量 → 原格式「上次 60kg，建议 62.5kg」', r.weight.text === '上次 60kg，建议 62.5kg', r.weight.text);
  t('旧数据只有重量 → 不抛错且 suggest 仍正确(62.5)', typeof r.weight.suggest === 'number' && r.weight.suggest === 62.5, JSON.stringify(r.weight));
}
{
  const records = [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, sets: 3, reps: 12 }] }];
  const r = advice({ name: bench.name }, {}, { ...eqCtx, db: DB, isAvailable: isAvail, records });
  t('历史只有组次无重量 → 按无历史处理', r.weight.last === null && r.weight.text === '首次做，轻重量起步', JSON.stringify(r.weight));
}

console.log('=== 8. 动作详情组装（V2.2 轮A：要点 + 注意事项 + 全标签）===');
{
  const benchDb = DB.find(e => e.name === '杠铃平板卧推');   // risk:'中'
  const hi = DB.find(e => e.name === '杠铃硬拉');            // risk:'高'
  const d = detailFn({ name: benchDb.name, tip: '肩胛收紧，杠贴近胸骨' }, benchDb);
  t('有 tip → points 用 tip 全文(非截断)', d.points === '肩胛收紧，杠贴近胸骨', JSON.stringify(d.points));
}
{
  const d = detailFn({ name: '杠铃平板卧推' }, null);
  t('无 tip 有库 → points 含「为主」「难度」', d.points.includes('为主') && d.points.includes('难度'), JSON.stringify(d.points));
}
{
  const d = detailFn({ name: '完全不存在的神秘动作' }, null);
  t('无 tip 无库 → points 含「标准姿势」', d.points.includes('标准姿势'), JSON.stringify(d.points));
}
{
  const hi = DB.find(e => e.name === '杠铃硬拉');
  const d = detailFn({ name: '杠铃硬拉' }, hi);
  t('高风险 → warnings 含「高风险动作」', d.warnings.some(w => w.includes('高风险动作')), JSON.stringify(d.warnings));
}
{
  const d = detailFn({ name: 'X', tip: '手肘略低于肩（避免肩峰撞击⚠️），缓慢前倾' }, null);
  t('⚠️ 句尾 → 提取「避免肩峰撞击」', d.warnings.some(w => w.includes('避免肩峰撞击')), JSON.stringify(d.warnings));
}
{
  const d = detailFn({ name: 'X', tip: '⚠️用轻重量！手肘微内收' }, null);
  t('⚠️ 句首 → 提取「用轻重量」', d.warnings.some(w => w.includes('用轻重量')), JSON.stringify(d.warnings));
}
{
  const d = detailFn({ name: '标准俯卧撑' }, null);   // risk:'低'，无 tip
  t('无 ⚠️ 且 risk 低 → warnings 为空', d.warnings.length === 0, JSON.stringify(d.warnings));
}
{
  const benchDb = DB.find(e => e.name === '杠铃平板卧推');
  const d = detailFn({ name: benchDb.name }, benchDb);
  const ok = d.tags.length === 6
    && d.tags.some(t => t.label === '难度' && t.value === '中级')
    && d.tags.some(t => t.label === '器械' && t.value === '杠铃+平板凳')
    && d.tags.some(t => t.label === '力学' && t.value === '推')
    && d.tags.some(t => t.label === '类型' && t.value === '复合')
    && d.tags.some(t => t.label === '姿态' && t.value === '卧')
    && d.tags.some(t => t.label === '侧重' && t.value === '肌肥大');
  t('标签 6 维齐全(难度/器械/力学/类型/姿态/侧重)', ok, JSON.stringify(d.tags));
}
{
  const d = detailFn({ name: 'X' }, { difficulty: '初级' });
  t('缺失省略 → 只有「难度」一项', d.tags.length === 1 && d.tags[0].label === '难度' && d.tags[0].value === '初级', JSON.stringify(d.tags));
}
{
  const d = detailFn({ name: 'X' }, { mechanics: '拉', focus: '力量', difficulty: '高级' });
  t('dbEx 注入 → 标签用注入值(纯函数不依赖全局)', d.tags.length === 3 && d.tags.some(t => t.label === '力学' && t.value === '拉') && d.tags.some(t => t.label === '侧重' && t.value === '力量'), JSON.stringify(d.tags));
}
{
  const d = detailFn({ name: 'X', tip: '避免肩峰撞击⚠️。避免肩峰撞击⚠️。' }, null);
  t('多段 ⚠️ 相同 → 去重后仅一条', d.warnings.length === 1 && d.warnings[0] === '避免肩峰撞击', JSON.stringify(d.warnings));
}
{
  t('extractWarnFromTip 句中 ⚠️ 也能提取', warnFn('避免肩峰撞击⚠️；③推法').some(w => w.includes('避免肩峰撞击')), JSON.stringify(warnFn('避免肩峰撞击⚠️；③推法')));
  t('extractWarnFromTip 无 ⚠️ → 空数组', warnFn('正常提示文本').length === 0, JSON.stringify(warnFn('正常提示文本')));
}

console.log('');
console.log('结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
