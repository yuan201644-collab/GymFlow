/* ============================================
   V2.0 阶段2 — buildTrainingPrompt 动作讲解 prompt 单元测试
   验证 prompt 组装：动作名 / 要点 / 器械 / 难度 / 历史 / 体态 / 伤病 / 今日完成度
   运行：node advice_ai_test.js （在 tests/ 目录下）
   ============================================ */
const fs = require('fs');
const vm = require('vm');
const SRC = '../js';

const sandbox = { console, Math, Set, Array, Object, String, parseInt, isNaN, JSON, Date };
const c = vm.createContext(sandbox);
['exercises.js', 'utils.js', 'ai.js'].forEach(f => vm.runInContext(fs.readFileSync(SRC + '/' + f, 'utf8'), c));
const DB = vm.runInContext('EXERCISE_DB', c);
const btp = vm.runInContext('buildTrainingPrompt', c);

let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { pass++; console.log('✅ ' + name); }
  else { fail++; console.log('❌ ' + name + ' — ' + detail); }
}

const bench = DB.find(e => e.name === '杠铃平板卧推');

console.log('=== 1. 动作名与要点 ===');
{
  const p = btp({ name: bench.name, tip: '肩胛收紧，杠贴近胸骨' }, {});
  t('含动作名', p.includes(bench.name), p);
  t('含 tip 要点', p.includes('肩胛收紧，杠贴近胸骨'), p);
  t('无 undefined/null/NaN 字面量', !/undefined|null|NaN/.test(p), p);
}
{
  const p = btp({ name: bench.name }, {});
  t('无 tip → 用库 mechanics', p.includes(bench.mechanics), p);
}
{
  const p = btp({ name: '完全不存在的神秘动作XYZ' }, {});
  t('未知动作 → 兜底通用要点', p.includes('保持标准姿势'), p);
}

console.log('=== 2. 器械与难度 ===');
{
  const p = btp({ name: bench.name }, { equipment: '家庭健身(哑铃+弹力带+引体架)' });
  t('含 ctx 器械', p.includes('家庭健身(哑铃+弹力带+引体架)'), p);
}
{
  const p = btp({ name: bench.name }, {});
  t('含库难度', p.includes(bench.difficulty), p);
}

console.log('=== 3. 历史记录 ===');
const records = [
  { date: '2026-06-01', completed: true, exercises: [{ name: bench.name, weight: 50, reps: 8 }] },
  { date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60, reps: 8 }] },
  { date: '2026-07-05', completed: false, exercises: [{ name: bench.name }] },
];
{
  const p = btp({ name: bench.name }, { records });
  t('有历史 → 含「我的历史」', p.includes('我的历史'), p);
  t('历史取最近一条 60kg × 8次', p.includes('60kg') && p.includes('8次') && p.includes('2026-07-01'), p);
}
{
  const p = btp({ name: bench.name }, { records: [] });
  t('无历史 → 不含「我的历史」', !p.includes('我的历史'), p);
}
{
  // 最新记录有该动作但未填重量/次数 → 视为无有效历史
  const p = btp({ name: bench.name }, { records: [{ date: '2026-07-05', completed: true, exercises: [{ name: bench.name }] }] });
  t('最新记录无重量 → 不显示历史', !p.includes('我的历史'), p);
}

console.log('=== 4. 体态画像 / 伤病 ===');
{
  const p = btp({ name: bench.name }, { bodyProfile: { postureTags: ['圆肩', '含胸'] } });
  t('含体态问题标签', p.includes('体态问题') && p.includes('圆肩') && p.includes('含胸'), p);
}
{
  const p = btp({ name: bench.name }, { bodyProfile: { postureTags: [] } });
  t('无体态标签 → 不显示体态行', !p.includes('体态问题'), p);
}
{
  const p = btp({ name: bench.name }, { issues: '左肩旧伤，避免大重量推举' });
  t('含伤病注意', p.includes('需注意') && p.includes('左肩旧伤'), p);
}

console.log('=== 5. 今日完成度 ===');
{
  const p = btp({ name: bench.name }, { todayRecord: { exercises: [{ name: bench.name, completed: true }] } });
  t('今日已完成', p.includes('今日已完成') && p.includes('✅'), p);
}
{
  const p = btp({ name: bench.name }, { todayRecord: { exercises: [{ name: bench.name, completed: false }] } });
  t('今日进行中', p.includes('进行中'), p);
}
{
  const p = btp({ name: bench.name }, { todayRecord: { exercises: [{ name: '其它动作' }] } });
  t('今日未做该动作 → 无今日行', !p.includes('今日'), p);
}

console.log('=== 6. 全角括号归一 ===');
const paren = DB.find(e => /[()]/.test(e.name));
if (paren) {
  const fullName = paren.name.replace(/\(/g, '（').replace(/\)/g, '）');
  const p = btp({ name: fullName }, {});
  t('全角括号动作名能匹配库并带要点', p.includes('动作要点') && p.length > 0, p);
} else {
  console.log('⚠️ 库中无带括号动作名，跳过全角归一用例');
}

console.log('=== 7. prompt 结构完整性 ===');
{
  const p = btp({ name: bench.name, tip: '肩胛收紧' }, {
    equipment: '商业健身房(器械很全)',
    records: [{ date: '2026-07-01', completed: true, exercises: [{ name: bench.name, weight: 60, reps: 8 }] }],
    bodyProfile: { postureTags: ['圆肩'] },
    issues: '腰突',
    todayRecord: { exercises: [{ name: bench.name, completed: true }] },
  });
  ['动作要点', '器械', '我的历史', '体态问题', '需注意', '今日已完成'].forEach(k => {
    t('综合 prompt 含「' + k + '」', p.includes(k), p);
  });
  t('含 100-150 字要求', p.includes('100-150字'), p);
  t('不含空行残渣（每行非空）', p.split('\n').every(l => l.trim().length > 0), JSON.stringify(p));
}

console.log('=== 8. buildCoachContext 训练上下文（阶段3 AI 教练） ===');
{
  const bcc = vm.runInContext('buildCoachContext', c);
  const plan = { label: '推日', subtitle: '胸 + 肩前束 + 三头', sections: [
    { type: 'warmup', title: '热身', groups: [
      { id: 'w1', label: '激活', pickHint: '2选1', exercises: [{ name: '墙面天使', default: true }, { name: '猫牛式胸椎活动' }] }
    ]},
    { type: 'main', title: '正式', groups: [
      { id: 'g1', label: '胸部', region: '胸', pickHint: '3选1-2', exercises: [
        { name: '杠铃平板卧推', default: true }, { name: '上斜哑铃卧推' }, { name: '双杠臂屈伸' }
      ]}
    ]}
  ]};
  const base = { plan, records: [], bodyProfile: null, settings: {}, activePlanId: 'default' };

  // 8.1 基本：当前训练/方案名/今日/完成度/已完成
  const rec = { type: 'push', groupSelections: { g1: '杠铃平板卧推' }, exercises: [{ name: '杠铃平板卧推', groupId: 'g1', completed: true }] };
  const p = bcc(Object.assign({ record: rec }, base));
  t('含【当前训练】+默认三分化方案名', p.includes('【当前训练】') && p.includes('默认三分化'), p);
  t('含今日推日', p.includes('推日'), p);
  t('含完成度(1/2 部位)', p.includes('完成度：1/2'), p);
  t('含今日已完成动作(✅)', p.includes('今日已完成') && p.includes('杠铃平板卧推✅'), p);
  t('无 undefined/null/NaN 字面量', !/undefined|null|NaN/.test(p), p);

  // 8.2 未完成（当前选中动作未完成时列出）
  const rec2 = { type: 'push', groupSelections: { g1: '上斜哑铃卧推' }, exercises: [
    { name: '杠铃平板卧推', groupId: 'g1', completed: true },
    { name: '上斜哑铃卧推', groupId: 'g1', completed: false },
  ]};
  const p2 = bcc(Object.assign({ record: rec2 }, base));
  t('含今日未完成动作', p2.includes('今日未完成') && p2.includes('上斜哑铃卧推'), p2);

  // 8.3 体态画像 / 伤病
  const p3 = bcc(Object.assign({ record: rec }, base, { bodyProfile: { postureTags: ['圆肩'] }, settings: { userInfo: { issues: '左肩旧伤' } } }));
  t('含体态标签', p3.includes('体态：圆肩'), p3);
  t('含伤病', p3.includes('伤病：左肩旧伤'), p3);

  // 8.4 动作历史：主组动作取最近一条（重量/次数/日期）
  const records = [
    { date: '2026-07-28', completed: true, exercises: [{ name: '杠铃平板卧推', weight: 50, reps: 8 }] },
    { date: '2026-07-31', completed: true, exercises: [{ name: '杠铃平板卧推', weight: 60, reps: 8 }] },
  ];
  const p4 = bcc(Object.assign({ record: rec }, base, { records }));
  t('含【动作历史】标题', p4.includes('【动作历史】'), p4);
  t('历史取最近一条 60kg×8次', p4.includes('60kg') && p4.includes('2026-07-31'), p4);

  // 8.5 自定义方案：subtitle + 第N个训练日
  const custPlan = { label: '练胸', subtitle: '我的推举方案', sections: [{ type: 'main', groups: [
    { id: 'c1', label: '胸部', pickHint: '2选1', exercises: [{ name: '杠铃平板卧推', default: true }] }
  ]}]};
  const p5 = bcc({ plan: custPlan, record: { type: 'custom_0', groupSelections: { c1: '杠铃平板卧推' }, exercises: [{ name: '杠铃平板卧推', groupId: 'c1', completed: true }] }, records: [], bodyProfile: null, settings: {}, activePlanId: 'my_plan' });
  t('自定义方案含方案名(subtitle)', p5.includes('我的推举方案'), p5);
  t('自定义方案含第1个训练日', p5.includes('第1个训练日'), p5);
  t('自定义方案含今日练胸', p5.includes('练胸'), p5);

  // 8.6 休息日：无完成度 / 无动作列表
  const p6 = bcc({ plan: { label: '休息日', sections: [] }, record: { type: 'rest', exercises: [] }, records: [], bodyProfile: null, settings: {}, activePlanId: 'default' });
  t('休息日含休息日', p6.includes('休息日'), p6);
  t('休息日无完成度', !p6.includes('完成度'), p6);
  t('休息日无已完成/未完成列表', !p6.includes('今日已完成') && !p6.includes('今日未完成'), p6);

  // 8.7 每行非空
  t('上下文每行非空', p.split('\n').every(l => l.trim().length > 0), JSON.stringify(p));
}

console.log('=== 9. parsePickerAINames AI 回复解析（阶段4 候选池校验） ===');
{
  const parse = vm.runInContext('parsePickerAINames', c);
  const bpp = vm.runInContext('buildPickerAIPrompt', c);
  const mkPool = (names) => names.map(n => DB.find(e => e.name === n)).filter(Boolean);
  const pool = mkPool(['杠铃平板卧推', '哑铃上斜卧推', '双杠臂屈伸', '低位绳索夹胸', '低位绳索夹胸(上斜)']);
  t('测试池 5 个真实动作名就绪', pool.length === 5, 'len=' + pool.length + ' → ' + pool.map(e => e.name).join(','));

  // 9.1 JSON 数组全在池内 → 全部返回（最多3）
  const p1 = parse(JSON.stringify(['杠铃平板卧推', '哑铃上斜卧推']), pool);
  t('JSON数组全在池内 → 全部返回', p1.length === 2 && p1.includes('杠铃平板卧推') && p1.includes('哑铃上斜卧推'), JSON.stringify(p1));

  // 9.2 JSON 数组混库外名 → 库外被过滤
  const p2 = parse(JSON.stringify(['杠铃平板卧推', '太空步']), pool);
  t('JSON混库外名 → 只留池内', p2.length === 1 && p2[0] === '杠铃平板卧推', JSON.stringify(p2));

  // 9.3 JSON 纯库外 → 空数组（触发兜底错误路径）
  const p3 = parse(JSON.stringify(['太空步']), pool);
  t('JSON纯库外 → 空数组', p3.length === 0, JSON.stringify(p3));

  // 9.4 ```json 代码块
  const p4 = parse('```json\n["杠铃平板卧推","哑铃上斜卧推"]\n```', pool);
  t('```json 代码块 → 解析', p4.length === 2, JSON.stringify(p4));

  // 9.5 {names:[...]} 对象
  const p5 = parse('{"names":["杠铃平板卧推"]}', pool);
  t('{names:[...]} 对象 → 解析', p5.length === 1 && p5[0] === '杠铃平板卧推', JSON.stringify(p5));

  // 9.6 换行 + 编号
  const p6 = parse('1. 杠铃平板卧推\n2. 哑铃上斜卧推', pool);
  t('换行编号 → 解析', p6.length === 2, JSON.stringify(p6));

  // 9.7 自然语言子串扫描
  const p7 = parse('我推荐做杠铃平板卧推或者哑铃上斜卧推', pool);
  t('自然语言含候选名 → 子串采纳', p7.length === 2, JSON.stringify(p7));

  // 9.8 最长优先去重：长名被采纳后其子串短名跳过
  const p8 = parse('低位绳索夹胸(上斜)', pool);
  t('长名被采纳后短子串名跳过', p8.length === 1 && p8[0] === '低位绳索夹胸(上斜)' && !p8.includes('低位绳索夹胸'), JSON.stringify(p8));

  // 9.9 全角括号归一 → 返回库内半角规范名
  const p9 = parse('低位绳索夹胸（上斜）', pool);
  t('全角括号 → 归一匹配库内半角', p9.length === 1 && p9[0] === '低位绳索夹胸(上斜)', JSON.stringify(p9));

  // 9.10 最多 3 个
  const p10 = parse(['杠铃平板卧推', '哑铃上斜卧推', '双杠臂屈伸', '低位绳索夹胸'].join('\n'), pool);
  t('AI 返回超3个 → 截断到3', p10.length === 3, JSON.stringify(p10));

  // 9.11 重复名去重
  const p11 = parse('杠铃平板卧推\n杠铃平板卧推\n哑铃上斜卧推', pool);
  t('重复名 → 去重', p11.length === 2, JSON.stringify(p11));

  // 9.12 空/null/空池 兜底
  t('null 文本 → 空数组', parse(null, pool).length === 0);
  t('undefined 文本 → 空数组', parse(undefined, pool).length === 0);
  t('空池 → 空数组', parse('杠铃平板卧推', []).length === 0);

  // 9.13 编号 + 末尾括号注释 → 剥离后池内匹配
  const p13 = parse('1. 杠铃平板卧推(胸部)', pool);
  t('编号+括号注释 → 剥离后匹配', p13.length === 1 && p13[0] === '杠铃平板卧推', JSON.stringify(p13));
}

console.log('=== 10. buildPickerAIPrompt 描述→候选 prompt（阶段4） ===');
{
  const bpp = vm.runInContext('buildPickerAIPrompt', c);
  const mkPool = (names) => names.map(n => DB.find(e => e.name === n)).filter(Boolean);
  const pool = mkPool(['杠铃平板卧推', '哑铃上斜卧推', '双杠臂屈伸']);

  // 10.1 基础内容：描述/场景/候选池/约束
  const p1 = bpp('卧推区满了换什么推胸', { region: '胸', phase: 'main', eqPref: '商业健身房(器械很全)' }, pool);
  t('含用户描述', p1.includes('卧推区满了换什么推胸'), p1);
  t('含部位', p1.includes('胸'), p1);
  t('含阶段', p1.includes('main'), p1);
  t('含器械条件', p1.includes('商业健身房'), p1);
  t('含候选动作名', p1.includes('杠铃平板卧推') && p1.includes('哑铃上斜卧推'), p1);
  t('含约束指令(只从候选选)', p1.includes('只从候选动作中选'), p1);

  // 10.2 候选池超 20 → 只列前 20
  const big = DB.filter(e => e.phase === 'main');
  const p2 = bpp('测试', {}, big);
  const candLines = p2.split('\n').filter(l => /^\d+\.\s/.test(l)).length;
  t('池超20 → 只列前20', candLines === 20, 'candLines=' + candLines + ' pool=' + big.length);

  // 10.3 空描述 → 占位（空）
  const p3 = bpp('', {}, pool);
  t('空描述 → 占位（空）', p3.includes('（空）'), p3);

  // 10.4 无 ctx → 不渲染【训练场景】行
  const p4 = bpp('描述', {}, pool);
  t('无ctx → 无场景行', !p4.includes('【训练场景】'), p4);

  // 10.5 prompt 每行非空、无 undefined
  t('prompt 无 undefined/null/NaN', !/undefined|null|NaN/.test(p1), p1);
  t('prompt 每行非空', p1.split('\n').every(l => l.trim().length > 0), JSON.stringify(p1));
}

console.log('');
console.log('结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
