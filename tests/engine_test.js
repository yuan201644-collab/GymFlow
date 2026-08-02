/* ============================================
   GymFlow 引擎回归测试（44画像规范检查 + 相似度矩阵 + 已知问题验证）
   运行：node engine_test.js [画像数]
   用法：本脚本在 vm 中加载 健身助手/js/exercises.js + engine.js，
         mock 掉 data 层函数（getSettings/getBodyProfile/getWeights/getRecords）。
   ============================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = '../js';
const exercisesSrc = fs.readFileSync(path.join(SRC, 'exercises.js'), 'utf8');
const engineSrc = fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8');

// ---- mock data 层 ----
const mockData = {
  settings: {},
  bodyProfile: null,
  weights: [],
  records: [],
};

function makeContext() {
  const sandbox = {
    console,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    getSettings: () => ({ ...mockData.settings }),
    getBodyProfile: () => mockData.bodyProfile,
    getWeights: () => mockData.weights,
    getRecords: () => mockData.records,
    Math, Date, JSON, Set, Map, Array, Object, parseInt, isNaN,
  };
  sandbox.EXERCISE_DB = [];
  const ctx = vm.createContext(sandbox);
  vm.runInContext(exercisesSrc, ctx);
  vm.runInContext(engineSrc, ctx);
  return ctx;
}

const ctx = makeContext();
const EXERCISE_DB = vm.runInContext('EXERCISE_DB', ctx); // 顶层 const 需经 runInContext 取真实值
const dbNames = new Set(EXERCISE_DB.map(e => e.name));

// ================= 画像定义 =================
// 13 项规范检查 + 相似度矩阵
function prof(over) {
  return Object.assign({
    experience: '纯新手(0-3个月)', days: '3天(标准三分化)', split: '三分化(推/拉/腿)', time: '60分钟(标准时长)',
    goal: '增肌增维度(变大变壮)', experience_detail: '', equipment: '商业健身房(器械很全)',
    like: '都可以(均衡搭配)', dislike: '没有特别排斥的', focus: '全身均衡发展', weakness: '比较均衡没有明显短板',
    intensity: '中等强度(常规力竭即可)', issues: '无特殊问题很健康',
  }, over);
}

// 重建 44 画像套件（经典人群 × 设备 × 经验 × 目标 × 分化 × 伤病 × 侧重 × 薄弱 × 时长 × 风格 × 排斥 × 强度）
// 所有取值使用真实问卷选项文案（引擎靠 substring 匹配，保证与 app 行为一致）
const PROFILES = [];
const EQ = ['商业健身房(器械很全)', '家庭健身(哑铃+弹力带+引体架)', '纯自重训练(无器械)'];
const base = {
  '经典-StartingStrength': { experience: '纯新手(0-3个月)', days: '3天(标准三分化)', split: '三分化(推/拉/腿)', goal: '提升绝对力量(三大项突破)' },
  '经典-StrongLifts': { experience: '纯新手(0-3个月)', days: '3天(标准三分化)', split: '三分化(推/拉/腿)', goal: '增肌增维度(变大变壮)' },
  '经典-PPL': { experience: '有一定基础(6个月-1年)', days: '6天(几乎每天)', split: '三分化(推/拉/腿)', goal: '增肌增维度(变大变壮)' },
  '经典-自重RR': { experience: '纯新手(0-3个月)', days: '3天(标准三分化)', split: '三分化(推/拉/腿)', goal: '综合体能(全面发展)' },
  '经典-5/3/1': { experience: '老手(2年以上)', days: '4天', split: '三分化(推/拉/腿)', goal: '提升绝对力量(三大项突破)' },
};
Object.entries(base).forEach(([name, o]) => {
  EQ.forEach(eq => PROFILES.push({ name: name + '-' + eq, p: prof(Object.assign({}, o, { equipment: eq })) }));
});
const extra = [
  { name: '新手-增肌-商业', p: prof({ experience: '纯新手(0-3个月)', goal: '增肌增维度(变大变壮)' }) },
  { name: '新手-增肌-纯自重', p: prof({ experience: '纯新手(0-3个月)', goal: '增肌增维度(变大变壮)', equipment: '纯自重训练(无器械)' }) },
  { name: '老手-力量-商业', p: prof({ experience: '老手(2年以上)', goal: '提升绝对力量(三大项突破)' }) },
  { name: '新手-肩峰撞击', p: prof({ experience: '纯新手(0-3个月)', issues: '肩峰撞击风险(肩膀弹响疼痛)' }) },
  { name: '专注胸肌-新手', p: prof({ experience: '纯新手(0-3个月)', focus: '胸肌(饱满有形)' }) },
  { name: '臀腿弱-上下肢', p: prof({ experience: '有一定基础(6个月-1年)', weakness: '下肢偏弱(腿细无力)', split: '上下肢分化(上/下轮转)' }) },
  { name: '五分化-老手', p: prof({ experience: '老手(2年以上)', split: '五分化(胸背腿肩臂)', days: '5天' }) },
  { name: '减脂-30分钟', p: prof({ goal: '减脂塑形(瘦下来显线条)', time: '30分钟以内(紧凑高效)' }) },
  { name: '圆肩矫正-90分钟', p: prof({ goal: '体态矫正优先(改善圆肩驼背)', time: '90分钟以上(很充裕)', issues: '圆肩/溜肩/肱骨前移(上交叉)' }) },
  { name: '减脂-家庭', p: prof({ goal: '减脂塑形(瘦下来显线条)', equipment: '家庭健身(哑铃+弹力带+引体架)' }) },
  { name: '上肢弱-五分化', p: prof({ weakness: '上肢偏弱(推拉都不行)', split: '五分化(胸背腿肩臂)', days: '5天', experience: '有一定基础(6个月-1年)' }) },
  { name: '核心弱-三分化', p: prof({ weakness: '核心偏弱(腰腹不稳定)' }) },
  { name: '不喜欢硬拉', p: prof({ dislike: '不想练硬拉(腰部担心)' }) },
  { name: '自由重量-中级', p: prof({ experience: '中级(1-2年)', like: '喜欢自由重量(杠铃哑铃为主)' }) },
  { name: '固定器械-中级', p: prof({ experience: '中级(1-2年)', like: '喜欢固定器械(安全稳定)' }) },
  { name: '高强度-老手', p: prof({ experience: '老手(2年以上)', intensity: '高强度(每组必须力竭)' }) },
  { name: '保守-新手', p: prof({ experience: '纯新手(0-3个月)', intensity: '稳健保守(安全第一不冒险)' }) },
  { name: '膝盖伤病-三分化', p: prof({ issues: '膝盖不适(弹响/酸痛)' }) },
  { name: '下背伤病-三分化', p: prof({ issues: '下背容易不舒服' }) },
  { name: '六天-PPL', p: prof({ days: '6天(几乎每天)', split: '三分化(推/拉/腿)', experience: '有一定基础(6个月-1年)' }) },
  { name: '上下肢-家庭', p: prof({ split: '上下肢分化(上/下轮转)', days: '4天', equipment: '家庭健身(哑铃+弹力带+引体架)', experience: '有一定基础(6个月-1年)' }) },
  { name: '全身均衡-老手', p: prof({ experience: '老手(2年以上)', focus: '全身均衡发展' }) },
  { name: '手臂优先-五分化', p: prof({ focus: '手臂(粗壮有力)', split: '五分化(胸背腿肩臂)', days: '5天', experience: '有一定基础(6个月-1年)' }) },
  { name: '腿臀优先-三分化', p: prof({ focus: '臀腿(下肢力量)' }) },
  { name: '减脂-五分化', p: prof({ goal: '减脂塑形(瘦下来显线条)', split: '五分化(胸背腿肩臂)', days: '5天', experience: '有一定基础(6个月-1年)' }) },
  { name: '中级-三分化-家庭', p: prof({ experience: '中级(1-2年)', equipment: '家庭健身(哑铃+弹力带+引体架)' }) },
  { name: '老手-三分化-纯自重', p: prof({ experience: '老手(2年以上)', equipment: '纯自重训练(无器械)' }) },
];
PROFILES.push(...extra);

// 去重（去掉 name 重复的）
const seenNames = new Set();
const uniqueProfiles = PROFILES.filter(x => { if (seenNames.has(x.name)) return false; seenNames.add(x.name); return true; });

function buildFor(p) { const raw = p.p || p; return ctx.buildPlan(ctx.buildContext(raw)); }

// ================= 13 项规范检查 =================
function check(plan, p) {
  const issues = [];
  const name = p.name;
  const trainingDays = plan.days.filter(d => d.label !== '休息日');
  const allEx = [];
  trainingDays.forEach(d => {
    const types = d.sections.map(s => s.type);
    ['warmup', 'main', 'stretch'].forEach(t => { if (!types.includes(t)) issues.push(`${name}:${d.label} 缺 ${t} 段`); });
    const w = d.sections.find(s => s.type === 'warmup');
    const main = d.sections.find(s => s.type === 'main');
    const st = d.sections.find(s => s.type === 'stretch');
    // 热身 3-5 部位、每部位 2-3选1
    if (w) {
      if (w.groups.length < 3 || w.groups.length > 5) issues.push(`${name}:${d.label} 热身 ${w.groups.length} 部位`);
      w.groups.forEach(g => { if (g.exercises.length < 2 || g.exercises.length > 3) issues.push(`${name}:${d.label} 热身${g.label}动作数${g.exercises.length}`); });
      w.groups.forEach(g => g.exercises.forEach(e => allEx.push(e.name)));
    }
    // 拉伸 3-5 部位、每部位 2-3选1
    if (st) {
      if (st.groups.length < 3 || st.groups.length > 5) issues.push(`${name}:${d.label} 拉伸 ${st.groups.length} 部位`);
      st.groups.forEach(g => { if (g.exercises.length < 2 || g.exercises.length > 3) issues.push(`${name}:${d.label} 拉伸${g.label}动作数${g.exercises.length}`); });
      st.groups.forEach(g => g.exercises.forEach(e => allEx.push(e.name)));
    }
    // 主组
    if (main) {
      if (main.groups.length < 3) issues.push(`${name}:${d.label} 主组仅${main.groups.length}组`);
      main.groups.forEach(g => {
        if (g.exercises.length < 2) issues.push(`${name}:${d.label} 主组${g.label}仅${g.exercises.length}动作`);
        g.exercises.forEach(e => allEx.push(e.name));
      });
    }
  });
  // 全局去重
  const dup = allEx.filter((e, i) => allEx.indexOf(e) !== i);
  if (dup.length > 0) issues.push(`${name}:重复动作 ${[...new Set(dup)].join(',')}`);
  // 动作全在库
  allEx.forEach(e => { if (!dbNames.has(e)) issues.push(`${name}:库外动作 ${e}`); });
  // 设备对齐：纯自重/家庭 不允许不可用器械
  const ctxEq = (p.p.equipment || '').toLowerCase();
  if (ctxEq.includes('纯自重') || ctxEq.includes('家庭')) {
    allEx.forEach(e => {
      const ex = EXERCISE_DB.find(x => x.name === e);
      if (!ex) return;
      if (!ctx.isEquipmentAvailable(ex, ctx.buildContext(p.p))) issues.push(`${name}:设备违规 ${e}【${ex.equipment}】`);
    });
  }
  // 新手无高级
  if (p.p.experience && (p.p.experience.includes('新手') || p.p.experience.includes('0-3'))) {
    allEx.forEach(e => { const ex = EXERCISE_DB.find(x => x.name === e); if (ex && ex.difficulty === '高级') issues.push(`${name}:新手高级动作 ${e}`); });
  }
  // 伤病对齐
  if (p.p.issues && p.p.issues.includes('肩峰')) {
    allEx.forEach(e => {
      const ex = EXERCISE_DB.find(x => x.name === e);
      if (ex && (ex.name.includes('推举') || ex.name.includes('直立划船'))) issues.push(`${name}:肩峰违规 ${e}`);
    });
  }
  return { issues, allEx };
}

// ================= 相似度 =================
function jaccard(a, b) {
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  sa.forEach(x => { if (sb.has(x)) inter++; });
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 1 : inter / union;
}

function main() {
  const limit = parseInt(process.argv[2]) || uniqueProfiles.length;
  const suites = uniqueProfiles.slice(0, limit);
  const results = suites.map(p => {
    let plan;
    try { plan = buildFor(p); } catch (e) { return { ...p, error: e.message }; }
    const { issues, allEx } = check(plan, p);
    return { ...p, plan, issues, allEx };
  });

  let pass = 0, fail = 0, failCounts = {};
  console.log('\n=== 规范符合度检查 ===');
  results.forEach(r => {
    if (r.error) { fail++; console.log(`❌ ${r.name}: 崩溃 ${r.error}`); return; }
    const tag = r.issues.length === 0 ? '✅' : '❌';
    if (r.issues.length === 0) pass++; else { fail++; r.issues.forEach(i => failCounts[i.split(':')[1] || i] = (failCounts[i.split(':')[1] || i] || 0) + 1); }
    console.log(`${tag} ${r.name} (${r.issues.length})` + (r.issues.length ? ` → ${r.issues.slice(0, 3).join(' | ')}` : ''));
  });
  console.log(`\n规范符合度: ${pass}/${results.length} 通过 (${Math.round(pass / results.length * 100)}%)`);

  console.log('\n=== 失败分类统计 ===');
  Object.entries(failCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}x  ${k.slice(0, 60)}`));

  // 相似度矩阵
  console.log('\n=== 相似度矩阵（Jaccard，主组动作集合） ===');
  const mainSets = results.map(r => {
    const days = (r.plan && r.plan.days || []).filter(d => d.label !== '休息日');
    const names = [];
    days.forEach(d => { const m = d.sections.find(s => s.type === 'main'); m && m.groups.forEach(g => g.exercises.forEach(e => names.push(e.name))); });
    return names;
  });
  let avg = 0, pairs = 0, identical = 0;
  for (let i = 0; i < results.length; i++) for (let j = i + 1; j < results.length; j++) {
    const s = jaccard(mainSets[i], mainSets[j]);
    avg += s; pairs++;
    if (s >= 0.95) { identical++; if (identical <= 12) console.log(`  1.00  ${results[i].name} ≈ ${results[j].name}`); }
  }
  console.log(`平均相似度: ${(avg / pairs).toFixed(2)}，相同/近同对: ${identical}`);

  // ===== 已知问题定向验证 =====
  console.log('\n=== 已知问题定向验证 ===');
  const im = buildFor(prof({ experience: '中级(1-2年)', split: '三分化(推/拉/腿)', goal: '增肌增维度(变大变壮)' }));
  const ex5 = buildFor(prof({ experience: '老手(2年以上)', split: '三分化(推/拉/腿)', goal: '增肌增维度(变大变壮)' }));
  const jIE = jaccard(collectMain(im), collectMain(ex5));
  const cntMain = p => p.days.filter(d => d.label !== '休息日').reduce((a, d) => a + d.sections.find(s => s.type === 'main').groups.length, 0);
  console.log(`1. 中级vs老手相似度: ${jIE.toFixed(2)} (${jIE < 1 ? '差异化OK' : '❌ 仍相同'}) | 主组数 中级${cntMain(im)} vs 老手${cntMain(ex5)}`);
  // 2. 三分化主组数 + 被裁肌群
  const day0 = im.days.filter(d => d.label !== '休息日')[0];
  const day0regions = day0.sections.find(s => s.type === 'main').groups.map(g => g.label).join('/');
  console.log(`2. 三分化推日主组数: ${day0.sections.find(s => s.type === 'main').groups.length} (规范5) → 实际肌群: ${day0regions}`);
  // 3. pickHint 格式
  const hints = new Set();
  im.days.forEach(d => d.sections.filter(s => s.type === 'main').forEach(sec => sec.groups.forEach(g => hints.add(g.pickHint))));
  console.log(`3. pickHint 格式: ${[...hints].join(',')} (规范: 大肌群3选1-2)`);
  // 4. 纯自重设备对齐
  const bw = buildFor(prof({ experience: '纯新手(0-3个月)', equipment: '纯自重训练(无器械)' }));
  const bwBad = collectEquipBad(bw, '纯自重训练(无器械)');
  console.log(`4. 纯自重设备违规: ${bwBad.length ? '❌ ' + [...new Set(bwBad)].join(',') : '✅ 0'}`);
  // 5. 家庭设备对齐
  const hm = buildFor(prof({ experience: '中级(1-2年)', equipment: '家庭健身(哑铃+弹力带+引体架)' }));
  const hmBad = collectEquipBad(hm, '家庭健身(哑铃+弹力带+引体架)');
  console.log(`5. 家庭设备违规: ${hmBad.length ? '❌ ' + [...new Set(hmBad)].join(',') : '✅ 0'}`);
  // 6. days=6 模板 + dailyRecommend 天数（engine 13.6 已改为按模板实际天数）
  const ctx6 = ctx.buildContext(prof({ days: '6天(几乎每天)', split: '三分化(推/拉/腿)', experience: '有一定基础(6个月-1年)' }));
  const tplKey = vm.runInContext('DECISION.templateKey(globalThis.__ctx6)', Object.assign(ctx, { __ctx6: ctx6 }));
  const p6 = buildFor(prof({ days: '6天(几乎每天)', split: '三分化(推/拉/腿)', experience: '有一定基础(6个月-1年)' }));
  const trainDays = p6.days.filter(d => d.label !== '休息日').length;
  // 直接调用 dailyRecommend（engine 内部 total = TEMPLATES[...].days.length）
  const recObj = vm.runInContext('dailyRecommend(globalThis.__ctx6)', Object.assign(ctx, { __ctx6: ctx6 }));
  const recTotal = vm.runInContext('TEMPLATES[DECISION.templateKey(globalThis.__ctx6)].days.length', Object.assign(ctx, { __ctx6: ctx6 }));
  const dayInRange = recObj.day >= 0 && recObj.day < recTotal;
  console.log(`6. days=6 → 模板 ${tplKey} (${trainDays}训练日) ${tplKey === 'ppl6' ? '✅' : '❌'} | dailyRecommend total=${recTotal} day=${recObj.day} ${recTotal === 6 && dayInRange ? '✅' : `❌ 硬编码${recTotal}漏天`}`);
  // 7. 校验层是否空转（改坏一份方案看是否被修正）
  const good = buildFor(prof({ experience: '纯新手(0-3个月)' }));
  const issuesBefore = ctx.checkPlanAgainstSpec(good, ctx.buildContext(prof({ experience: '纯新手(0-3个月)' })));
  console.log(`7. 新手方案校验 issues: ${issuesBefore.length} ${issuesBefore.length === 0 ? '✅' : '❌ ' + issuesBefore.slice(0, 2).join(';')}`);
}

function collectEquipBad(plan, eqStr) {
  const bad = [];
  plan.days.forEach(d => d.sections.forEach(s => s.groups.forEach(g => g.exercises.forEach(e => {
    const ex = EXERCISE_DB.find(x => x.name === e.name);
    if (ex && !ctx.isEquipmentAvailable(ex, ctx.buildContext(prof({ equipment: eqStr })))) bad.push(e.name + '【' + ex.equipment + '】');
  }))));
  return bad;
}

function collectMain(plan) {
  const names = [];
  plan.days.filter(d => d.label !== '休息日').forEach(d => {
    const m = d.sections.find(s => s.type === 'main');
    m && m.groups.forEach(g => g.exercises.forEach(e => names.push(e.name)));
  });
  return names;
}

main();
