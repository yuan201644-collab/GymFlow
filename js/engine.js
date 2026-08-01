/* ============================================
   GymFlow v1.4 — 代价场打分引擎（分层架构）
   配置层/决策层/打分层/填充层/校验层
   ============================================ */

// ══════════════════════════════════════════
// 配置层：声明式模板（结构稳定，每组固定 n/pickHint + 热身拉伸部位）
// ══════════════════════════════════════════
const TEMPLATES = {
  '3day': {
    type: '3day', label: '三分化',
    days: [
      { label: '推日', main: [
        { region: '胸.中胸', n: 3, pick: '3选1' },
        { region: '胸.上胸', n: 3, pick: '3选1' },
        { region: '胸.下胸', n: 2, pick: '2选1' },
        { region: '肩.前束', n: 2, pick: '2选1' },
        { region: '手臂.三头', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['胸', '肩', '三头', '二头'] },
      { label: '拉日', main: [
        { region: '背.背阔', n: 3, pick: '3选1' },
        { region: '背.中背', n: 3, pick: '3选1' },
        { region: '背.菱形', n: 2, pick: '2选1' },
        { region: '肩.后束', n: 2, pick: '2选1' },
        { region: '手臂.二头', n: 2, pick: '2选1' },
      ], warmup: ['肩胛', '肩', '胸椎'], stretch: ['背', '肩后束', '二头', '前臂'] },
      { label: '臀腿日', main: [
        { region: '臀腿.股四头', n: 3, pick: '3选1' },
        { region: '臀腿.腘绳', n: 2, pick: '2选1' },
        { region: '臀腿.臀', n: 3, pick: '3选1' },
        { region: '臀腿.小腿', n: 2, pick: '2选1' },
        { region: '核心.腹直', n: 2, pick: '2选1' },
      ], warmup: ['髋', '膝', '踝'], stretch: ['臀', '大腿前', '大腿后', '小腿'] },
    ],
  },
  '5day': {
    type: '5day', label: '五分化',
    days: [
      { label: '胸日', main: [
        { region: '胸.中胸', n: 3, pick: '3选1' }, { region: '胸.上胸', n: 3, pick: '3选1' },
        { region: '胸.下胸', n: 2, pick: '2选1' }, { region: '胸.中缝', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['胸', '肩', '三头'] },
      { label: '背日', main: [
        { region: '背.背阔', n: 3, pick: '3选1' }, { region: '背.中背', n: 3, pick: '3选1' },
        { region: '背.菱形', n: 2, pick: '2选1' }, { region: '背.下背', n: 2, pick: '2选1' },
      ], warmup: ['肩胛', '肩', '胸椎'], stretch: ['背', '肩后束', '二头'] },
      { label: '腿日', main: [
        { region: '臀腿.股四头', n: 3, pick: '3选1' }, { region: '臀腿.腘绳', n: 3, pick: '3选1' },
        { region: '臀腿.臀', n: 3, pick: '3选1' }, { region: '臀腿.小腿', n: 2, pick: '2选1' },
      ], warmup: ['髋', '膝', '踝'], stretch: ['臀', '大腿前', '大腿后', '小腿'] },
      { label: '肩日', main: [
        { region: '肩.前束', n: 3, pick: '3选1' }, { region: '肩.中束', n: 3, pick: '3选1' },
        { region: '肩.后束', n: 3, pick: '3选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['肩', '肩后束', '三头'] },
      { label: '手臂日', main: [
        { region: '手臂.二头', n: 3, pick: '3选1' }, { region: '手臂.三头', n: 3, pick: '3选1' },
        { region: '手臂.前臂', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '手臂'], stretch: ['二头', '三头', '前臂'] },
    ],
  },
  'fullbody': {
    type: '3day', label: '全身体',
    days: [
      { label: '全身A', main: [
        { region: '胸.中胸', n: 2, pick: '2选1' }, { region: '背.背阔', n: 2, pick: '2选1' },
        { region: '臀腿.股四头', n: 2, pick: '2选1' }, { region: '核心.腹直', n: 2, pick: '2选1' },
        { region: '手臂.三头', n: 2, pick: '2选1' },
      ], warmup: ['肩', '髋', '胸椎'], stretch: ['胸', '背', '大腿后'] },
      { label: '全身B', main: [
        { region: '背.中背', n: 2, pick: '2选1' }, { region: '臀腿.腘绳', n: 2, pick: '2选1' },
        { region: '肩.前束', n: 2, pick: '2选1' }, { region: '核心.腹横', n: 2, pick: '2选1' },
        { region: '手臂.二头', n: 2, pick: '2选1' },
      ], warmup: ['肩胛', '膝', '肩'], stretch: ['背', '肩', '大腿前'] },
      { label: '全身C', main: [
        { region: '胸.上胸', n: 2, pick: '2选1' }, { region: '臀腿.臀', n: 2, pick: '2选1' },
        { region: '肩.中束', n: 2, pick: '2选1' }, { region: '背.菱形', n: 2, pick: '2选1' },
        { region: '核心.腹斜', n: 2, pick: '2选1' },
      ], warmup: ['肩', '踝', '肩胛'], stretch: ['胸', '臀', '小腿'] },
    ],
  },
  'upperlower': {
    type: '3day', label: '上下肢',
    days: [
      { label: '上肢日', main: [
        { region: '胸.中胸', n: 3, pick: '3选1' }, { region: '背.背阔', n: 3, pick: '3选1' },
        { region: '肩.前束', n: 2, pick: '2选1' }, { region: '手臂.三头', n: 2, pick: '2选1' },
        { region: '背.中背', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['胸', '背', '二头', '三头'] },
      { label: '下肢日', main: [
        { region: '臀腿.股四头', n: 3, pick: '3选1' }, { region: '臀腿.腘绳', n: 3, pick: '3选1' },
        { region: '臀腿.臀', n: 3, pick: '3选1' }, { region: '核心.腹直', n: 2, pick: '2选1' },
        { region: '臀腿.小腿', n: 2, pick: '2选1' },
      ], warmup: ['髋', '膝', '踝'], stretch: ['臀', '大腿前', '大腿后', '小腿'] },
    ],
  },
  'ppl6': {
    type: '5day', label: '推拉腿六天',
    days: [
      { label: '推日A', main: [
        { region: '胸.中胸', n: 3, pick: '3选1' }, { region: '胸.上胸', n: 2, pick: '2选1' },
        { region: '肩.前束', n: 2, pick: '2选1' }, { region: '手臂.三头', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['胸', '肩', '三头'] },
      { label: '拉日A', main: [
        { region: '背.背阔', n: 3, pick: '3选1' }, { region: '背.中背', n: 2, pick: '2选1' },
        { region: '肩.后束', n: 2, pick: '2选1' }, { region: '手臂.二头', n: 2, pick: '2选1' },
      ], warmup: ['肩胛', '肩', '胸椎'], stretch: ['背', '肩后束', '二头'] },
      { label: '腿日A', main: [
        { region: '臀腿.股四头', n: 3, pick: '3选1' }, { region: '臀腿.腘绳', n: 2, pick: '2选1' },
        { region: '臀腿.臀', n: 2, pick: '2选1' }, { region: '臀腿.小腿', n: 2, pick: '2选1' },
      ], warmup: ['髋', '膝', '踝'], stretch: ['臀', '大腿前', '大腿后', '小腿'] },
      { label: '推日B', main: [
        { region: '胸.下胸', n: 2, pick: '2选1' }, { region: '胸.中缝', n: 2, pick: '2选1' },
        { region: '肩.中束', n: 2, pick: '2选1' }, { region: '手臂.三头', n: 2, pick: '2选1' },
      ], warmup: ['肩', '胸椎', '肩胛'], stretch: ['胸', '肩', '三头'] },
      { label: '拉日B', main: [
        { region: '背.菱形', n: 2, pick: '2选1' }, { region: '背.下背', n: 2, pick: '2选1' },
        { region: '肩.后束', n: 2, pick: '2选1' }, { region: '手臂.二头', n: 2, pick: '2选1' },
      ], warmup: ['肩胛', '肩', '胸椎'], stretch: ['背', '肩后束', '二头'] },
      { label: '腿日B', main: [
        { region: '臀腿.股四头', n: 3, pick: '3选1' }, { region: '臀腿.臀', n: 2, pick: '2选1' },
        { region: '核心.腹直', n: 2, pick: '2选1' }, { region: '臀腿.腘绳', n: 2, pick: '2选1' },
      ], warmup: ['髋', '膝', '踝'], stretch: ['臀', '大腿前', '大腿后', '小腿'] },
    ],
  },
};

// ══════════════════════════════════════════
// 决策层：buildContext → 规范化决策向量 + 权重表
// ══════════════════════════════════════════
function buildContext(profile) {
  const s = getSettings();
  const bp = getBodyProfile();
  const weights = getWeights();
  const records = getRecords();
  const exp = (profile.experience || '').toLowerCase();
  const goal = (profile.goal || '增肌').toLowerCase();
  const t = (profile.time || '60分钟').toLowerCase();
  return {
    experience: exp, days: parseInt((profile.days || '3').charAt(0)) || 3,
    split: (profile.split || '三分化').toLowerCase(),
    time: t, goal,
    expDetail: (profile.experience_detail || '').toLowerCase(),
    equipment: (profile.equipment || '商业健身房').toLowerCase(),
    like: (profile.like || '').toLowerCase(), dislike: (profile.dislike || '').toLowerCase(),
    focus: (profile.focus || '全身均衡').toLowerCase(),
    weakness: (profile.weakness || '').toLowerCase(),
    intensity: (profile.intensity || '中等强度').toLowerCase(),
    issues: (profile.issues || '无').toLowerCase(),
    postureTags: bp ? bp.postureTags : [],
    weight: weights.length > 0 ? weights[weights.length - 1].weight : 75,
    recent: records.filter(r => r.completed).slice(-5),
    // 决策向量（供权重表使用）
    decision: {
      isBeginner: exp.includes('新手') || exp.includes('0-3') || exp.includes('刚'),
      isStrength: goal.includes('力量'), isFatLoss: goal.includes('减脂'),
      isShort: t.includes('30'), isLong: t.includes('90') || t.includes('75'),
    },
  };
}

// 维度权重表（显式配置，可单测）
const DECISION = {
  // goal → 次数区间
  reps: ctx => ctx.decision.isStrength ? '4-6次' : (ctx.decision.isFatLoss ? '12-15次' : (ctx.intensity.includes('保守') ? '10-12次' : '8-12次')),
  // time + intensity + experience → 每天最多主组数（模板结构兜底，默认 5 保住三头/二头）
  maxSets: ctx => {
    let s = ctx.decision.isShort ? 3 : (ctx.decision.isLong ? 6 : 5); // 默认 5：三分化推日 5 组完整（不裁三头）
    if (!ctx.decision.isShort) {
      if (ctx.decision.isBeginner) s = Math.max(s, 5); // 全身体需 5 组
      if (ctx.experience.includes('老手') || ctx.experience.includes('2年以上')) s = Math.max(s, 6); // 老手 5-6
      else if (ctx.experience.includes('1-2')) s = Math.max(s, 5); // 中级 5
    }
    if (ctx.intensity.includes('高强') || (ctx.intensity.includes('每组') && ctx.intensity.includes('力竭'))) s = Math.min(6, s + 1);
    if (ctx.intensity.includes('保守')) s = Math.max(2, s - 1);
    if (ctx.decision.isFatLoss) s = Math.max(3, s - 1); // 减脂容量略降（主组少一组，驱动 goal 敏感）
    return s;
  },
  // 模板选择：新手→全身体；6天→PPL6；五分化→5day；上下肢→upperlower；否则3day
  templateKey: ctx => {
    if (ctx.decision.isBeginner) return 'fullbody';
    if (ctx.days >= 6) return 'ppl6';
    if (ctx.split.includes('五')) return '5day';
    if (ctx.split.includes('上下肢')) return 'upperlower';
    return '3day';
  },
  // focus 肌群权重倍率
  focusMultiplier: ctx => {
    const f = ctx.focus;
    const map = { '胸': 2, '背': 2, '肩': 2, '臂': 2, '腿': 2 };
    for (const k in map) if (f.includes(k)) return map[k];
    return 1;
  },
  // weakness 补偿
  weaknessComp: ctx => {
    const w = ctx.weakness;
    if (w.includes('上肢')) return ['胸', '背', '手臂'];
    if (w.includes('下肢')) return ['臀腿'];
    if (w.includes('核心')) return ['核心'];
    return [];
  },
};

// ══════════════════════════════════════════
// 打分层：按权重表对各动作打分
// ══════════════════════════════════════════
function isEquipmentAvailable(ex, ctx) {
  const eq = (ex.equipment || '').toLowerCase();
  const ctxEq = ctx.equipment;
  if (ctxEq.includes('商业')) return true;
  if (ctxEq.includes('家庭') || ctxEq.includes('哑铃')) {
    const no = ['龙门架', '绳索', '哈克', '腿举机', '腿屈伸机', '腿弯举机', '髋外展', '髋内收', '提踵', '臀推机', '弯举机', '侧平举机', '肩推机', '推胸机', '坐姿划船', '高位下拉', '史密斯', '蝴蝶机', '卷腹机', '辅助引体', '辅助臂屈伸', '杠铃', '深蹲架', '六角杠', 'T杆', '下斜凳'];
    for (const n of no) { if (eq.includes(n.toLowerCase())) return false; }
  }
  if (ctxEq.includes('自重')) {
    if (eq && !eq.includes('自重') && !eq.includes('弹力带')) return false;
  }
  return true;
}

function expPenalty(ex, ctx) {
  const diff = ex.difficulty || '中级';
  const exp = ctx.experience;
  if (exp.includes('新手') || exp.includes('0-3') || exp.includes('刚')) {
    if (diff === '高级') return -50;
    if (diff === '中级') return -5;
  }
  if (exp.includes('半年') || exp.includes('入门')) {
    if (diff === '高级') return -20;
    return 0;
  }
  // 中级（半年-1年）：高级动作允许但略扣
  if (exp.includes('一定基础') || exp.includes('6个月') || exp.includes('半年-1年')) {
    if (diff === '高级') return -8;
  }
  // 中级（1-2年）：高级动作允许但略扣（区别于老手，避免 includes('2年') 误判）
  if (exp.includes('1-2')) {
    if (diff === '高级') return -8;
  }
  // 老手（2年以上）：高级动作加成
  if (exp.includes('老手') || exp.includes('2年以上')) {
    if (diff === '高级') return 5;
  }
  return 0;
}

function injuryPenalty(ex, ctx) {
  let penalty = 0;
  const issues = ctx.issues + ' ' + ctx.postureTags.join(' ');
  const name = (ex.name || '').toLowerCase();
  const region = (ex.region || '').toLowerCase();
  const mech = (ex.mechanics || '').toLowerCase();
  if (issues.includes('肩峰') || issues.includes('肩膀')) {
    if (name.includes('推举') || name.includes('直立划船') || name.includes('颈后')) penalty -= 30;
    if (mech === '推' && region.includes('肩')) penalty -= 10;
  }
  if (issues.includes('膝盖') || issues.includes('膝')) {
    if (name.includes('深蹲') || name.includes('腿举')) penalty -= 15;
    if (name.includes('弓箭步') || name.includes('跳跃')) penalty -= 20;
  }
  if (issues.includes('下背') || issues.includes('腰')) {
    if (name.includes('硬拉') || name.includes('划船') && !name.includes('坐姿')) penalty -= 20;
  }
  if (ex.risk === '高' && issues !== '无') penalty -= 15;
  return penalty;
}

function jointRiskPenalty(ex, ctx) {
  let penalty = 0;
  const issues = ctx.issues + ' ' + ctx.postureTags.join(' ');
  const jr = ex.jointRisk;
  if (!jr) return 0;
  if ((issues.includes('肩峰') || issues.includes('肩膀')) && jr.shoulder === '高') penalty -= 25;
  if ((issues.includes('膝盖') || issues.includes('膝')) && jr.knee === '中') penalty -= 15;
  if ((issues.includes('下背') || issues.includes('腰')) && jr.lowerBack === '高') penalty -= 20;
  return penalty;
}

function goalBonus(ex, ctx) {
  const goal = ctx.goal;
  const type = ex.type;
  if (goal.includes('力量')) return type === '复合' ? 20 : -10;
  if (goal.includes('减脂')) return type === '复合' ? 10 : (ex.mechanics === '有氧' ? 15 : 0);
  if (goal.includes('增肌')) return type === '复合' ? 5 : (ex.focus === '肌肥大' ? 8 : 0);
  return 0;
}

function regionBonus(ex, ctx) {
  let bonus = 0;
  const region = (ex.region || '').toLowerCase();
  const focus = ctx.focus;
  const weakness = ctx.weakness;
  // 目标肌群大幅加分（强差异化），非目标肌群扣分
  const focusRegions = [];
  if (focus.includes('胸')) focusRegions.push('胸');
  if (focus.includes('背')) focusRegions.push('背');
  if (focus.includes('肩')) focusRegions.push('肩');
  if (focus.includes('臂')) focusRegions.push('手臂');
  if (focus.includes('腿')) focusRegions.push('臀腿');
  if (focus.includes('全身') || focusRegions.length === 0) {
    // 全身均衡：微偏向大肌群
    if (region.includes('胸') || region.includes('背') || region.includes('臀腿')) bonus += 3;
  } else {
    if (focusRegions.some(r => region.includes(r))) bonus += 22;
    else bonus -= 10;
  }
  // 弱点部位补偿
  DECISION.weaknessComp(ctx).forEach(r => { if (region.includes(r.toLowerCase())) bonus += 10; });
  return bonus;
}

function styleBonus(ex, ctx) {
  let bonus = 0;
  const eq = (ex.equipment || '').toLowerCase();
  const like = ctx.like;
  if ((like.includes('自由') || like.includes('杠铃')) && (eq.includes('杠铃') || eq.includes('哑铃'))) bonus += 8;
  if ((like.includes('器械') || like.includes('固定')) && (eq.includes('机') || eq.includes('史密斯'))) bonus += 8;
  if (like.includes('功能') && (eq.includes('壶铃') || eq.includes('战绳') || eq.includes('药球'))) bonus += 8;
  return bonus;
}

function dislikePenalty(ex, ctx) {
  const dislike = ctx.dislike;
  const name = (ex.name || '').toLowerCase();
  if (dislike.includes('硬拉') && name.includes('硬拉')) return -100;
  if (dislike.includes('深蹲') && name.includes('深蹲')) return -100;
  if (dislike.includes('卧推') && name.includes('卧推')) return -100;
  if ((dislike.includes('跑步') || dislike.includes('有氧')) && name.includes('跑')) return -100;
  return 0;
}

function postureBonus(ex, ctx) {
  let bonus = 0;
  const tags = ctx.postureTags;
  const corrections = ex.correction || [];
  const name = (ex.name || '').toLowerCase();
  tags.forEach(tag => {
    if (tag.includes('圆肩') && (corrections.includes('圆肩') || name.includes('面拉'))) bonus += 15;
    if (tag.includes('溜肩') && (corrections.includes('溜肩') || name.toLowerCase().includes('ytw'))) bonus += 10;
    if (tag.includes('肱骨') && (corrections.includes('肱骨前移') || name.includes('面拉'))) bonus += 12;
    if (tag.includes('肩峰') && (corrections.includes('肩峰') || (name.includes('哑铃') && name.includes('推')))) bonus += 10;
  });
  return bonus;
}

function scoreExercise(ex, ctx) {
  if (!isEquipmentAvailable(ex, ctx)) return -1000;
  const d = dislikePenalty(ex, ctx);
  if (d <= -100) return -999;
  return 50 + expPenalty(ex, ctx) + injuryPenalty(ex, ctx) + jointRiskPenalty(ex, ctx)
    + goalBonus(ex, ctx) + regionBonus(ex, ctx) + styleBonus(ex, ctx) + postureBonus(ex, ctx) + d;
}

// ══════════════════════════════════════════
// 填充层：模板驱动选动作 + 全局去重
// ══════════════════════════════════════════
function pickExercises(regionFilter, ctx, n, usedNames) {
  const candidates = EXERCISE_DB.filter(ex => {
    if (usedNames && usedNames.has(ex.name)) return false;
    const r = ex.region || '';
    if (ex.phase !== 'main') return false; // 只选正式训练动作
    if (ex.mechanics === '等长' || ex.region === '全身.有氧') return false;
    if (ex.name.includes('拉伸') || ex.name.includes('滚动') || ex.name.includes('预热')) return false;
    // 新手/入门不选高级动作（北欧弯举等越权动作，主选与 backup 同标准）
    if ((ctx.experience.includes('新手') || ctx.experience.includes('0-3') || ctx.experience.includes('刚')
      || ctx.experience.includes('半年') || ctx.experience.includes('入门')) && ex.difficulty === '高级') return false;
    return regionFilter.some(f => r === f || r.startsWith(f + '.') || f.startsWith(r));
  }).map(ex => ({ ex, score: scoreExercise(ex, ctx) }));
  candidates.sort((a, b) => b.score - a.score);
  const valid = candidates.filter(c => c.score > -100);
  const seen = new Set();
  const unique = valid.filter(c => { const k = c.ex.name; if (seen.has(k)) return false; seen.add(k); return true; });
  const reps = DECISION.reps(ctx);
  const result = unique.slice(0, n).map((c, i) => ({
    name: c.ex.name,
    sets: `${c.ex.type === '复合' ? '3-4' : '2-3'}组×${reps}`,
    default: i === 0,
  }));
  // 不足 n 时补足（backup 与主选共用同一套过滤：usedMain + 经验难度 + 设备/伤病/排斥，宁缺勿越权）
  if (result.length < n) {
    const backup = EXERCISE_DB.filter(ex => {
      if (ex.phase !== 'main') return false;
      if (usedNames && usedNames.has(ex.name)) return false; // 排 usedMain（跨组不重复）
      if (ex.name.includes('拉伸') || ex.name.includes('滚动') || ex.name.includes('预热')) return false;
      if (!isEquipmentAvailable(ex, ctx)) return false; // 设备对齐
      if (expPenalty(ex, ctx) < 0) return false; // 难度越权过滤（新手/入门不补超纲高级动作，如北欧弯举）
      if (scoreExercise(ex, ctx) <= -100) return false; // 排斥/伤病过滤
      return regionFilter.some(f => (ex.region || '') === f || (ex.region || '').startsWith(f + '.') || f.startsWith(ex.region || ''));
    });
    for (const ex of backup) {
      if (result.length >= n) break;
      if (!result.find(x => x.name === ex.name)) {
        result.push({ name: ex.name, sets: `${ex.type === '复合' ? '3-4' : '2-3'}组×${reps}`, default: false });
        usedNames && usedNames.add(ex.name);
      }
    }
  }
  return result;
}

// 热身/拉伸部位池
const WARMUP_POOL = {
  '髋': { kw: ['绕环', '臀桥', '髋外展', '画圈', '髋部'], region: ['臀', '臀腿.臀'] },
  '膝': { kw: ['深蹲', '弓步', '高抬腿'], region: ['股四头', '腘绳', '臀腿'] },
  '踝': { kw: ['踝', '脚踝', '提踵', '足尖', '足跟'], region: '臀腿.小腿' },
  '肩': { kw: ['绕环', '肩外旋', '肩内旋', '肩拉开', '肩袖'], region: ['肩', '胸'] },
  '肩胛': { kw: ['激活', '天使', 'ytw', '肩胛'], region: ['背', '肩'] },
  '胸椎': { kw: ['猫牛', '胸椎'], region: '背' },
  '胸': { kw: ['滚动', '扩胸'], region: '胸' },
  '背': { kw: ['滚动'], region: '背' },
  '手臂': { kw: ['拉伸', '肩外旋', '拉开'], region: '手臂' },
  '核心': { kw: ['平板', '鸟狗', '死虫', '登山者', '转体', '举腿', '侧平板'], region: '核心' },
};
const STRETCH_POOL = {
  '胸': { kw: ['胸肌', '门框', '泡沫轴'], region: '胸' },
  '背': { kw: ['背阔肌', '婴儿式'], region: '背' },
  '肩后束': { kw: ['后束'], region: '肩' },
  '肩': { kw: ['上斜方肌', '前束', '中束', '颈部', '颈'], region: '肩' },
  '二头': { kw: ['二头'], region: '手臂.二头' },
  '三头': { kw: ['三头'], region: '手臂.三头' },
  '前臂': { kw: ['前臂', '手腕'], region: '手臂.前臂' },
  '臀': { kw: ['鸽子式', '髋屈', '抱膝', '4字'], region: '臀腿.臀' },
  '大腿前': { kw: ['股四头'], region: '臀腿.股四头' },
  '大腿后': { kw: ['腘绳'], region: '臀腿.腘绳' },
  '小腿': { kw: ['小腿'], region: '臀腿.小腿' },
};

function pickFromPool(poolKey, pool, ctx, usedSet, n, sets, fb, dayOffset) {
  const spec = pool[poolKey];
  if (!spec) return fb;
  const targetPhase = pool === STRETCH_POOL ? 'stretch' : 'warmup'; // 按调用方池区分（'肩/胸/背' 撞名修复）
  const regs = Array.isArray(spec.region) ? spec.region : [spec.region];
  // 候选匹配（严格：阶段/设备/部位/关键词），含已用（供池耗尽时降级复用）
  const matches = e => {
    if (e.phase !== targetPhase) return false; // 只选对应阶段动作
    if (!isEquipmentAvailable(e, ctx)) return false; // 设备对齐
    const r = e.region || '';
    if (!regs.some(rg => r === rg || r.startsWith(rg) || r.includes(rg))) return false;
    return spec.kw.some(k => e.name.includes(k));
  };
  const all = EXERCISE_DB.filter(matches);
  const unused = all.filter(e => !usedSet.has(e.name));
  const picked = [];
  const usedNow = new Set();
  // 优先未用动作（跨天不重复）；池不足时允许复用已用动作（宁多勿空，空组是 bug 而重复是降级）
  for (let ui = 0, ai = 0; picked.length < n && (ui < unused.length || ai < all.length); ) {
    let e;
    if (ui < unused.length) { e = unused[(dayOffset + ui) % unused.length]; ui++; }
    else { e = all[(dayOffset + ai) % all.length]; ai++; }
    if (usedNow.has(e.name)) continue;
    usedNow.add(e.name);
    picked.push({ name: e.name, sets, default: picked.length === 0 });
    usedSet.add(e.name);
  }
  // fb 兜底：仅当候选不足时启用，必须 phase 匹配 + 设备可用 + 未用（杜绝 main 动作混入热身）
  if (picked.length < n) {
    for (const x of fb || []) {
      if (picked.length >= n) break;
      if (usedNow.has(x.name) || usedSet.has(x.name)) continue;
      const fbEx = EXERCISE_DB.find(e => e.name === x.name);
      if (!fbEx || fbEx.phase !== targetPhase || !isEquipmentAvailable(fbEx, ctx)) continue;
      picked.push({ ...x }); usedSet.add(x.name); usedNow.add(x.name);
    }
  }
  return picked;
}

// ══════════════════════════════════════════
// 校验层：checkPlanAgainstSpec + 自动修正
// ══════════════════════════════════════════
function checkPlanAgainstSpec(plan, ctx) {
  const issues = [];
  const dbNames = new Set(EXERCISE_DB.map(e => e.name));
  const allNames = [];
  const ctxEq = (ctx.equipment || '').toLowerCase();
  const isNewbie = ctx.decision.isBeginner;
  plan.days.forEach(d => {
    if (d.label === '休息日') return;
    const types = d.sections.map(s => s.type);
    ['warmup', 'main', 'stretch'].forEach(t => { if (!types.includes(t)) issues.push(`${d.label} 缺 ${t} 段`); });
    const w = d.sections.find(s => s.type === 'warmup');
    if (w && (w.groups.length < 3 || w.groups.length > 5)) issues.push(`${d.label} 热身 ${w.groups.length} 部位（应3-5）`);
    w && w.groups.forEach(g => { if (g.exercises.length < 2 || g.exercises.length > 3) issues.push(`${d.label} ${g.label} 动作数 ${g.exercises.length}`); g.exercises.forEach(e => allNames.push(e.name)); });
    const s = d.sections.find(x => x.type === 'stretch');
    if (s && (s.groups.length < 3 || s.groups.length > 5)) issues.push(`${d.label} 拉伸 ${s.groups.length} 部位（应3-5）`);
    s && s.groups.forEach(g => { if (g.exercises.length < 2 || g.exercises.length > 3) issues.push(`${d.label} ${g.label} 动作数 ${g.exercises.length}`); g.exercises.forEach(e => allNames.push(e.name)); });
    const m = d.sections.find(x => x.type === 'main');
    if (m && m.groups.length < 3) issues.push(`${d.label} 主组仅 ${m.groups.length} 组`);
    m && m.groups.forEach(g => { if (g.exercises.length < 2) issues.push(`${d.label} 主组${g.label}动作数 ${g.exercises.length}`); g.exercises.forEach(e => allNames.push(e.name)); });
  });
  // 全方案无重复（含 warmup/main/stretch 跨类别）
  const seen = new Set();
  allNames.forEach(n => { if (seen.has(n)) issues.push(`重复动作 ${n}`); seen.add(n); });
  // 库内 + 设备对齐 + 新手无高级
  allNames.forEach(n => {
    const ex = dbNames.has(n) ? EXERCISE_DB.find(x => x.name === n) : null;
    if (!ex) { issues.push(`库外动作:${n}`); return; }
    if ((ctxEq.includes('纯自重') || ctxEq.includes('家庭')) && !isEquipmentAvailable(ex, ctx)) issues.push(`设备违规 ${n}【${ex.equipment}】`);
    if (isNewbie && ex.difficulty === '高级') issues.push(`新手高级动作 ${n}`);
  });
  return issues;
}

// ══════════════════════════════════════════
// buildPlan：组装五层
// ══════════════════════════════════════════
function buildPlan(ctx) {
  const tplKey = DECISION.templateKey(ctx);
  const template = TEMPLATES[tplKey];
  const used = new Set(); // 方案级全局去重：warmup/main/stretch 共享（跨天 + 跨类别不重复）
  const name = (ctx.goal.includes('减脂') ? '减脂' : ctx.goal.includes('力量') ? '力量' : ctx.goal.includes('矫正') ? '矫正' : '增肌')
    + template.label;

  const days = template.days.map((day, di) => {
    const dayUsed = new Set(); // 当天去重（与方案级池合并用）
    // 填充层：主组（focus/weakness 部位加动作数，非 focus 部位减）
    const mainGroups = day.main.map(g => {
      const region = g.region || '';
      const isFocus = ctx.focus && !ctx.focus.includes('全身') && (
        (ctx.focus.includes('胸') && region.includes('胸')) ||
        (ctx.focus.includes('背') && region.includes('背')) ||
        (ctx.focus.includes('肩') && region.includes('肩')) ||
        (ctx.focus.includes('臂') && region.includes('手臂')) ||
        (ctx.focus.includes('腿') && region.includes('臀腿'))
      );
      const isWeak = DECISION.weaknessComp(ctx).some(r => region.includes(r.toLowerCase()));
      // 经验影响动作数：每组至少2（满足2选1），focus/weakness 部位加1（fullbody 维度敏感）
      let n;
      if (ctx.decision.isBeginner) {
        n = isFocus ? 3 : (isWeak ? 3 : 2); // 新手每组至少2动作，focus/weakness 部位加1
      } else {
        n = isFocus ? g.n + 1 : (isWeak ? g.n + 1 : Math.max(2, g.n));
        if (ctx.focus.includes('全身') || !ctx.focus) n = isWeak ? g.n + 1 : Math.max(2, g.n);
      }
      // 老手（2年以上）：每组多 1 个备选动作，驱动结构与中级差异化（相似度 < 1）
      if (ctx.experience.includes('老手') || ctx.experience.includes('2年以上')) n += 1;
      // pickHint：大肌群（胸/背/臀腿）允许多选备选 N选1-2，小肌群（肩/手臂/核心）N选1（规范 5.3）
      const bigMuscle = region.startsWith('胸') || region.startsWith('背') || region.startsWith('臀腿');
      const pickStr = bigMuscle ? `${Math.max(2, n)}选1-2` : `${Math.max(2, n)}选1`;
      const exercises = pickExercises([region], ctx, n, used);
      if (exercises.length === 0) return null;
      exercises.forEach(e => used.add(e.name));
      exercises[0].default = true;
      return { label: (region.split('.')[1] || region.split('.')[0]), pickHint: pickStr, region, exercises };
    }).filter(Boolean).slice(0, DECISION.maxSets(ctx));

    // 热身组
    const warmupGroups = (day.warmup || []).map((key, i) => {
      const fbMap = { '髋': [{ name: '髋关节绕环', sets: '10次', default: true }, { name: '臀桥预热', sets: '10次', default: false }], '膝': [{ name: '深蹲预热(自重)', sets: '10次', default: true }, { name: '高抬腿', sets: '3分钟', default: false }], '踝': [{ name: '开合跳', sets: '3分钟', default: true }, { name: '原地踏步', sets: '3分钟', default: false }], '肩': [{ name: '肩关节绕环', sets: '10次', default: true }, { name: '弹力带肩环绕', sets: '10次', default: false }], '肩胛': [{ name: 'YTW激活', sets: '10次', default: true }, { name: '墙面天使', sets: '10次', default: false }, { name: '弹力带拉开', sets: '10次', default: false }], '胸椎': [{ name: '猫牛式', sets: '10次', default: true }, { name: '胸椎旋转拉伸', sets: '每侧10次', default: false }], '胸': [{ name: '胸肌泡沫轴拉伸', sets: '3分钟', default: true }, { name: '泡沫轴滚动(胸椎)', sets: '3分钟', default: false }], '背': [{ name: '泡沫轴滚动(背部)', sets: '3分钟', default: true }, { name: '背阔肌门框拉伸', sets: '每侧30秒', default: false }], '手臂': [{ name: '弹力带肩外旋', sets: '10次', default: true }, { name: '弹力带拉开', sets: '10次', default: false }], '核心': [{ name: '鸟狗式', sets: '10次', default: true }, { name: '死虫式', sets: '10次', default: false }] };
      const picked = pickFromPool(key, WARMUP_POOL, ctx, used, 3, '10次', fbMap[key] || [{ name: key + '激活', sets: '10次', default: true }, { name: key + '放松', sets: '10次', default: false }], di * 7 + i);
      return { label: key + '激活', pickHint: '3选1', exercises: picked };
    });

    // 拉伸组
    const stretchGroups = (day.stretch || []).map((key, i) => {
      const fbMap = { '胸': [{ name: '胸肌门框拉伸', sets: '每侧30秒', default: true }, { name: '胸肌泡沫轴拉伸', sets: '每侧30秒', default: false }], '背': [{ name: '背阔肌拉伸', sets: '每侧30秒', default: true }, { name: '婴儿式', sets: '每侧30秒', default: false }], '肩后束': [{ name: '三角肌后束拉伸', sets: '每侧30秒', default: true }, { name: '三角肌前束拉伸', sets: '每侧30秒', default: false }], '肩': [{ name: '上斜方肌拉伸', sets: '每侧30秒', default: true }, { name: '三角肌前束拉伸', sets: '每侧30秒', default: false }], '二头': [{ name: '肱二头肌拉伸', sets: '每侧30秒', default: true }], '三头': [{ name: '肱三头肌拉伸', sets: '每侧30秒', default: true }], '前臂': [{ name: '前臂拉伸', sets: '每侧30秒', default: true }, { name: '手腕屈肌拉伸', sets: '每侧30秒', default: false }], '臀': [{ name: '鸽子式', sets: '每侧30秒', default: true }, { name: '仰卧抱膝', sets: '每侧30秒', default: false }], '大腿前': [{ name: '股四头肌拉伸', sets: '每侧30秒', default: true }, { name: '股四头肌侧卧拉伸', sets: '每侧30秒', default: false }], '大腿后': [{ name: '腘绳肌拉伸', sets: '每侧30秒', default: true }, { name: '腘绳肌仰卧拉伸', sets: '每侧30秒', default: false }], '小腿': [{ name: '站姿小腿拉伸', sets: '每侧30秒', default: true }, { name: '坐姿小腿拉伸', sets: '每侧30秒', default: false }] };
      const picked = pickFromPool(key, STRETCH_POOL, ctx, used, 2, '每侧30秒', fbMap[key] || [{ name: key + '拉伸', sets: '每侧30秒', default: true }, { name: key + '放松', sets: '每侧30秒', default: false }], di * 7 + i + 50);
      return { label: key + '拉伸', pickHint: '2选1', exercises: picked };
    });

    const sections = [
      { type: 'warmup', title: '热身(5-10分钟)', groups: warmupGroups },
      { type: 'main', title: '正式训练', groups: mainGroups },
      { type: 'stretch', title: '拉伸(5分钟)', groups: stretchGroups },
    ];
    // 减脂目标：每个训练日附加有氧段（fullbody 维度敏感）
    if (ctx.decision.isFatLoss) {
      const cardioEx = EXERCISE_DB.filter(e => e.phase === 'cardio' && isEquipmentAvailable(e, ctx));
      const c2 = [];
      for (let k = 0; k < cardioEx.length && c2.length < 2; k++) {
        const e = cardioEx[(di * 5 + k) % cardioEx.length];
        if (!used.has(e.name)) { c2.push({ name: e.name, sets: '20分钟', default: c2.length === 0 }); used.add(e.name); }
      }
      if (c2.length > 0) sections.push({ type: 'cardio', title: '有氧燃脂(20分钟)', groups: [{ label: '有氧', pickHint: '2选1', exercises: c2 }] });
    }
    return { label: day.label, sections };
  });

  // 休息日
  days.push({
    label: '休息日',
    sections: [{
      type: 'main', title: '休息日', groups: [
        { label: '核心训练', pickHint: '2选1', exercises: [{ name: '平板支撑', sets: '3组×30秒', default: true }, { name: '死虫式', sets: '3组×10次/侧', default: false }] },
        { label: '体态拉伸', pickHint: '2选1', exercises: [{ name: '腹部拉伸', sets: '每侧30秒', default: true }, { name: '侧腰拉伸', sets: '每侧30秒', default: false }] },
      ],
    }],
  });

  const plan = { name, type: template.type, description: ctx.goal + ' · ' + template.label + ' · 自动生成', days };

  // 校验层：自动修正（最多3轮，空组兜底防御；正常由生成层降级保证不空）
  let issues = checkPlanAgainstSpec(plan, ctx);
  let retries = 0;
  while (issues.length > 0 && retries < 3) {
    plan.days.forEach(d => {
      if (d.label === '休息日') return;
      d.sections.forEach(sec => sec.groups.forEach(g => {
        if (g.exercises.length === 0) {
          const fbEx = EXERCISE_DB.find(e => e.phase === 'main' && isEquipmentAvailable(e, ctx));
          if (fbEx) g.exercises.push({ name: fbEx.name, sets: '3组×8-12次', default: true });
        }
      }));
    });
    issues = checkPlanAgainstSpec(plan, ctx);
    retries++;
  }

  // 制定依据
  const expText = ctx.decision.isBeginner ? '刚开始训练，动作模式建立优先，避免过早冲击大重量' : (ctx.split.includes('五') ? '有经验训练者，五分化精细化各肌群' : '有经验训练者，三分化每肌群每周2次兼顾恢复');
  const goalText = ctx.decision.isStrength ? '力量目标：复合为主，低次高重' : ctx.decision.isFatLoss ? '减脂目标：复合占比高+高频有氧' : '增肌目标：中等容量肌肥大为主';
  const timeText = ctx.decision.isShort ? '时长30分钟内，每天≤3组' : ctx.decision.isLong ? '时长90分钟以上，每天最多6组' : '时长适中，组数标准';
  const equipText = ctx.equipment.includes('纯自重') ? '纯自重：仅自重/弹力带动作' : ctx.equipment.includes('家庭') ? '家庭：排除大型器械' : '商业健身房：全器械可用';
  const postureText = ctx.postureTags && ctx.postureTags.length > 0 ? ('体态矫正：针对' + ctx.postureTags.join('、') + '调整动作') : '体态正常';
  plan.rationale = [expText, goalText, timeText, equipText, postureText];
  plan.progressNote = '渐进超负荷：完成全部组次后复合+2.5kg，孤立+1.25kg或+1次';
  plan.restSec = 120;
  return plan;
}

// ══════════════════════════════════════════
// 每日推荐
// ══════════════════════════════════════════
function dailyRecommend(ctx) {
  const today = new Date();
  const recent = ctx.recent;
  if (recent.length === 0) return { day: 0, reason: '今天开始训练吧！建议从第1天开始' };
  const fatigue = {};
  recent.forEach(r => {
    const daysAgo = Math.floor((today - new Date(r.date)) / 86400000);
    const factor = Math.max(0, 1 - daysAgo / 4);
    const groupCount = r.exercises ? r.exercises.filter(e => e.completed).length : 0;
    fatigue[r.type] = (fatigue[r.type] || 0) + factor * (groupCount / 8);
  });
  const tpl = TEMPLATES[DECISION.templateKey(ctx)];
  const total = tpl ? tpl.days.length : 3; // 按模板实际天数（ppl6=6 / 五分化=5 / 上下肢=2 / 三分化与全身体=3）
  if (fatigue.push) fatigue.custom_0 = (fatigue.custom_0 || 0) + fatigue.push;
  if (fatigue.pull) fatigue.custom_1 = (fatigue.custom_1 || 0) + fatigue.pull;
  if (fatigue.legs) fatigue.custom_2 = (fatigue.custom_2 || 0) + fatigue.legs;
  let bestDay = 0, bestScore = Infinity;
  for (let i = 0; i < total; i++) {
    const key = 'custom_' + i;
    const score = fatigue[key] || 0;
    if (score < bestScore) { bestScore = score; bestDay = i; }
  }
  return { day: bestDay, reason: bestScore < 0.5 ? '今天推荐训练' : '各部位恢复良好，任选一天' };
}
