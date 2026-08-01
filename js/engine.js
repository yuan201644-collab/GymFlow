/* ============================================
   GymFlow v1.4 — 代价场打分引擎 + 模板系统
   确定性生成方案，AI 仅做解释顾问
   ============================================ */

// ===== 构建决策上下文 =====
function buildContext(profile) {
  const s = getSettings();
  const bp = getBodyProfile();
  const weights = getWeights();
  const records = getRecords();
  return {
    experience: (profile.experience || '').toLowerCase(),
    days: parseInt((profile.days || '3').charAt(0)) || 3,
    split: (profile.split || '三分化').toLowerCase(),
    time: (profile.time || '60分钟').toLowerCase(),
    goal: (profile.goal || '增肌').toLowerCase(),
    expDetail: (profile.experience_detail || '').toLowerCase(),
    equipment: (profile.equipment || '商业健身房').toLowerCase(),
    like: (profile.like || '').toLowerCase(),
    dislike: (profile.dislike || '').toLowerCase(),
    focus: (profile.focus || '全身均衡').toLowerCase(),
    weakness: (profile.weakness || '').toLowerCase(),
    intensity: (profile.intensity || '中等强度').toLowerCase(),
    issues: (profile.issues || '无').toLowerCase(),
    postureTags: bp ? bp.postureTags : [],
    weight: weights.length > 0 ? weights[weights.length-1].weight : 75,
    recent: records.filter(r => r.completed).slice(-5),
  };
}

// ===== 设备可用性过滤 =====
function isEquipmentAvailable(ex, ctx) {
  const eq = (ex.equipment || '').toLowerCase();
  const ctxEq = ctx.equipment;
  if (ctxEq.includes('商业')) return true; // full gym
  if (ctxEq.includes('家庭') || ctxEq.includes('哑铃')) {
    const no = ['龙门架','绳索','哈克','腿举机','腿屈伸机','腿弯举机','髋外展','髋内收','提踵','臀推机','弯举机','侧平举机','肩推机','推胸机','坐姿划船','高位下拉','史密斯','蝴蝶机','卷腹机','辅助引体','辅助臂屈伸','杠铃','深蹲架','六角杠','T杆','下斜凳'];
    for (const n of no) { if (eq.includes(n.toLowerCase())) return false; }
  }
  if (ctxEq.includes('自重')) {
    if (eq && !eq.includes('自重') && !eq.includes('弹力带')) return false;
  }
  return true;
}

// ===== 经验 → 难度惩罚 =====
function expPenalty(ex, ctx) {
  const diff = ex.difficulty || '中级';
  const exp = ctx.experience;
  if (exp.includes('新手') || exp.includes('0-3') || exp.includes('刚')) {
    if (diff === '高级') return -50;
    if (diff === '中级') return -5;
  }
  if ((exp.includes('半年') || exp.includes('入门')) && diff === '高级') return -20;
  return 0;
}

// ===== 伤病 → 风险惩罚 =====
function injuryPenalty(ex, ctx) {
  let penalty = 0;
  const issues = ctx.issues + ' ' + ctx.postureTags.join(' ');
  const name = (ex.name || '').toLowerCase();
  const region = (ex.region || '').toLowerCase();
  const mech = (ex.mechanics || '').toLowerCase();

  if (issues.includes('肩峰') || issues.includes('肩膀')) {
    if (name.includes('推举') || name.includes('直立划船') || name.includes('颈后')) penalty -= 30;
    if (mech === '推' && region.includes('肩')) penalty -= 10;
    // 杠铃卧推系加重肩峰撞击风险
    if (name.includes('杠铃') && name.includes('卧推')) penalty -= 25;
  }
  if (issues.includes('膝盖') || issues.includes('膝')) {
    if (name.includes('深蹲') || name.includes('腿举')) penalty -= 15;
    if (name.includes('弓箭步') || name.includes('跳跃')) penalty -= 20;
  }
  if (issues.includes('下背') || issues.includes('腰')) {
    if (name.includes('硬拉') || name.includes('划船') && !name.includes('坐姿')) penalty -= 20;
  }
  if (ex.risk === '高') {
    if (issues !== '无') penalty -= 15;
  }
  return penalty;
}

// ===== 目标方向加成 =====
function goalBonus(ex, ctx) {
  const goal = ctx.goal;
  const type = ex.type;
  const focus = ex.focus;
  if (goal.includes('力量') && type === '复合') return 10;
  if (goal.includes('减脂') && type === '复合') return 5;
  if (goal.includes('耐力') && focus === '肌耐力') return 8;
  return 0;
}

// ===== 肌群权重 =====
function regionBonus(ex, ctx) {
  let bonus = 0;
  const region = (ex.region || '').toLowerCase();
  const focus = ctx.focus;
  const weakness = ctx.weakness;
  if (focus.includes('胸') && region.includes('胸')) bonus += 8;
  if (focus.includes('背') && region.includes('背')) bonus += 8;
  if (focus.includes('肩') && region.includes('肩')) bonus += 8;
  if (focus.includes('臂') && region.includes('手臂')) bonus += 8;
  if (focus.includes('腿') && region.includes('臀腿')) bonus += 8;
  if (weakness.includes('上肢') && (region.includes('胸') || region.includes('背') || region.includes('手臂'))) bonus += 5;
  if (weakness.includes('下肢') && region.includes('臀腿')) bonus += 5;
  if (weakness.includes('核心') && region.includes('核心')) bonus += 5;
  return bonus;
}

// ===== 风格偏好 =====
function styleBonus(ex, ctx) {
  let bonus = 0;
  const eq = (ex.equipment || '').toLowerCase();
  const like = ctx.like;
  if (like.includes('自由') || like.includes('杠铃')) {
    if (eq.includes('杠铃') || eq.includes('哑铃')) bonus += 8;
  }
  if (like.includes('器械') || like.includes('固定')) {
    if (eq.includes('机') || eq.includes('史密斯')) bonus += 8;
  }
  if (like.includes('功能')) {
    if (eq.includes('壶铃') || eq.includes('战绳') || eq.includes('药球')) bonus += 8;
  }
  return bonus;
}

// ===== 排斥惩罚 =====
function dislikePenalty(ex, ctx) {
  const dislike = ctx.dislike;
  const name = (ex.name || '').toLowerCase();
  if (dislike.includes('硬拉') && name.includes('硬拉')) return -100;
  if (dislike.includes('深蹲') && name.includes('深蹲')) return -100;
  if (dislike.includes('卧推') && name.includes('卧推')) return -100;
  if ((dislike.includes('跑步') || dislike.includes('有氧')) && name.includes('跑')) return -100;
  return 0;
}

// ===== 体态矫正加分 =====
function postureBonus(ex, ctx) {
  let bonus = 0;
  const name = (ex.name || '').toLowerCase();
  const tags = ctx.postureTags;
  tags.forEach(tag => {
    if (tag.includes('圆肩') && (name.includes('面拉') || name.includes('划船') || name.includes('外旋') || name.includes('后束'))) bonus += 15;
    if (tag.includes('溜肩') && (name.includes('ytw') || name.includes('天使') || name.includes('侧平举'))) bonus += 10;
    if (tag.includes('肱骨') && (name.includes('面拉') || name.includes('外旋') || name.includes('后束'))) bonus += 12;
    if (tag.includes('肩峰') && (name.includes('哑铃') && name.includes('推'))) bonus += 10; // 哑铃比杠铃安全
  });
  return bonus;
}

// ===== 综合打分 =====
function scoreExercise(ex, ctx) {
  if (!isEquipmentAvailable(ex, ctx)) return -1000;
  const d = dislikePenalty(ex, ctx);
  if (d <= -100) return -999;
  return 50 // base
    + expPenalty(ex, ctx)
    + injuryPenalty(ex, ctx)
    + goalBonus(ex, ctx)
    + regionBonus(ex, ctx)
    + styleBonus(ex, ctx)
    + postureBonus(ex, ctx)
    + d;
}

// ===== 按时间限制调整组数 =====
function timeLimit(ctx) {
  const t = ctx.time;
  if (t.includes('30')) return 3;
  if (t.includes('45')) return 4;
  if (t.includes('60')) return 5;
  if (t.includes('75') || t.includes('90')) return 6;
  return 5;
}

// ===== 按强度选次数 =====
function intensityReps(ctx) {
  const i = ctx.intensity;
  if (i.includes('高强度') || (i.includes('每组') && i.includes('力竭'))) return '4-6次';
  if (i.includes('保守')) return '10-12次';
  return '8-12次'; // 中等强度 / 灵活 / 默认
}

// ===== 模板定义 =====
const SPLIT3_TEMPLATE = {
  type: '3day',
  days: [
    {
      label: '推日', regions: ['胸.中胸','胸.上胸','胸.下胸','肩.前束','手臂.三头'],
      hint: 'pick 5 from scored: 2 chest + 1 front delt + 2 tricep variants'
    },
    {
      label: '拉日', regions: ['背.背阔','背.中背','背.菱形','肩.后束','手臂.二头'],
      hint: 'pick 5 from scored: 2 back + 1 rear delt + 1 bicep + 1 optional'
    },
    {
      label: '臀腿日', regions: ['臀腿.股四头','臀腿.腘绳','臀腿.臀','臀腿.小腿','核心.腹直'],
      hint: '2 quads + 2 ham/glute + 1 calf + 1 core'
    },
  ],
};

const SPLIT5_TEMPLATE = {
  type: '5day',
  days: [
    { label: '胸日', regions: ['胸.中胸','胸.上胸','胸.下胸','胸.中缝'] },
    { label: '背日', regions: ['背.背阔','背.中背','背.下背','背.菱形'] },
    { label: '腿日', regions: ['臀腿.股四头','臀腿.腘绳','臀腿.臀','臀腿.小腿'] },
    { label: '肩日', regions: ['肩.前束','肩.中束','肩.后束'] },
    { label: '手臂日', regions: ['手臂.二头','手臂.三头','手臂.前臂'] },
  ],
};

// 新手全身体模板（3天全身体，每肌群每周3次）
const FULLBODY_TEMPLATE = {
  type: '3day-fullbody',
  days: [
    { label: '全身A', regions: ['胸.中胸','背.背阔','臀腿.股四头','核心.腹直','手臂.三头'] },
    { label: '全身B', regions: ['背.中背','臀腿.腘绳','肩.前束','核心.腹横','手臂.二头'] },
    { label: '全身C', regions: ['胸.上胸','臀腿.臀','肩.中束','背.菱形','核心.腹斜'] },
  ],
};

// ===== 从候选池选 Top N =====
function pickExercises(regionFilter, ctx, n, pickHint) {
  const candidates = EXERCISE_DB.filter(ex => {
    const r = ex.region || '';
    // 正式训练组排除拉伸/滚动/有氧/热身类动作
    if (ex.mechanics === '等长' || ex.region === '全身.有氧') return false;
    if (ex.name.includes('拉伸') || ex.name.includes('滚动') || ex.name.includes('预热')) return false;
    return regionFilter.some(f => r === f || r.startsWith(f + '.') || f.startsWith(r));
  }).map(ex => ({ ex, score: scoreExercise(ex, ctx) }));
  candidates.sort((a, b) => b.score - a.score);
  // 去重（同名不同变体）
  const seen = new Set();
  const valid = candidates.filter(c => c.score > -100);
  const unique = valid.filter(c => {
    const key = c.ex.name; if (seen.has(key)) return false; seen.add(key); return true;
  });
  const reps = intensityReps(ctx);
  return unique.slice(0, n).map((c, i) => ({
    name: c.ex.name,
    sets: `${c.ex.type === '复合' ? '3-4' : '2-3'}组×${reps}`,
    default: i === 0
  }));
}

// ===== 目标驱动训练量配置 =====
function trainingVolume(ctx) {
  const goal = ctx.goal;
  const exp = ctx.experience;
  const isBeginner = exp.includes('新手') || exp.includes('0-3') || exp.includes('刚');
  const isStrength = goal.includes('力量');
  const isFatLoss = goal.includes('减脂');
  // 每组动作数（按目标收缩）
  let exercisesPerGroup = 2;
  // 每天肌群组数
  let groupsPerDay;
  if (isBeginner) groupsPerDay = 3;
  else if (isStrength) groupsPerDay = 4;
  else groupsPerDay = 5;
  // 组数
  let compoundSets = '3-4';
  let isoSets = '2-3';
  if (isStrength) { compoundSets = '4-5'; isoSets = '3-4'; }
  return { exercisesPerGroup, groupsPerDay, compoundSets, isoSets, isBeginner };
}

// ===== 构建方案 =====
function buildPlan(ctx) {
  const is5Day = ctx.split.includes('五');
  const vol = trainingVolume(ctx);
  // 新手 → 全身体模板；否则按分化
  const template = vol.isBeginner ? FULLBODY_TEMPLATE : (is5Day ? SPLIT5_TEMPLATE : SPLIT3_TEMPLATE);
  const isFullbody = vol.isBeginner;
  const name = (ctx.goal.includes('减脂')?'减脂':ctx.goal.includes('力量')?'力量':ctx.goal.includes('矫正')?'矫正':'增肌')
    + (isFullbody?'全身体':(is5Day?'五分化':'三分化'));

  const days = template.days.map(day => {
    const isLowerDay = day.label.includes('腿') || day.label.includes('臀');
    // 每组1-2个动作（收缩训练量），按目标控制组数
    const mainGroups = day.regions.slice(0, vol.groupsPerDay).map((region, ri) => {
      const n = vol.exercisesPerGroup;
      const exercises = pickExercises([region], ctx, n, `${n}选1`);
      if (exercises.length === 0) return null;
      exercises[0].default = true;
      return {
        label: region.split('.')[1] || region.split('.')[0] || '训练组',
        pickHint: exercises.length + '选1' + (exercises.length >= 3 ? '-2' : ''),
        region: region,
        exercises,
      };
    }).filter(Boolean);
    // 按训练日肌群匹配热身/拉伸（确定性选择，同输入同输出）
    const di = template.days.indexOf(day);
    const pickByRegion = (regions, label, n, fb) => {
      const pool = EXERCISE_DB.filter(e => regions.some(r => e.region&&e.region.startsWith(r)) && e.mechanics==='等长' && isEquipmentAvailable(e,ctx));
      const sorted = [...pool].sort((a,b)=>a.name.localeCompare(b.name));
      const r = []; for (let i=0;i<sorted.length&&r.length<n;i++){const ei=(di*3+i)%sorted.length;if(!r.find(x=>x.name===sorted[ei].name))r.push({name:sorted[ei].name,sets:'每侧30秒',default:r.length===0})}
      return r.length>=n?r:fb;
    };
    const cf = EXERCISE_DB.filter(e=>e.region==='全身.有氧'&&e.type==='复合'&&isEquipmentAvailable(e,ctx)).sort((a,b)=>a.name.localeCompare(b.name));
    const mf = EXERCISE_DB.filter(e=>(e.region==='全身.功能'||e.name.includes('绕环')||e.name.includes('激活')||e.name.includes('弹力带肩'))&&isEquipmentAvailable(e,ctx)).sort((a,b)=>a.name.localeCompare(b.name));
    const ci = di*2 % Math.max(1,cf.length); const cii = (di*2+1) % Math.max(1,cf.length);
    const mi = di*3 % Math.max(1,mf.length); const mii = (di*3+1) % Math.max(1,mf.length);
    const cG = {label:'有氧预热',pickHint:'2选1',exercises:cf.length>=2?[{name:cf[ci].name,sets:'5分钟',default:true},{name:cf[cii].name,sets:'3分钟',default:false}]:[{name:'跑步机快走',sets:'5分钟',default:true},{name:'跳绳',sets:'3分钟×2组',default:false}]};
    const mG = {label:'关节激活',pickHint:'2选1',exercises:mf.length>=2?[{name:mf[mi].name,sets:'5分钟',default:true},{name:mf[mii].name,sets:'3分钟',default:false}]:[{name:'肩髋动态拉伸',sets:'5分钟',default:true},{name:'泡沫轴滚动',sets:'3分钟',default:false}]};
    const uS = {label:isLowerDay?'下肢拉伸':'上肢拉伸',pickHint:'2选1',exercises:isLowerDay?pickByRegion(['臀腿','小腿'],'下肢拉伸',2,[{name:'股四头肌拉伸',sets:'每侧30秒',default:true},{name:'腘绳肌拉伸',sets:'每侧30秒',default:false}]):pickByRegion(['胸','背','肩','手臂'],'上肢拉伸',2,[{name:'胸肌门框拉伸',sets:'每侧30秒',default:true},{name:'背阔肌拉伸',sets:'每侧30秒',default:false}])};
    const lS = {label:isLowerDay?'小腿拉伸':'下肢拉伸',pickHint:'2选1',exercises:isLowerDay?pickByRegion(['小腿'],'小腿拉伸',2,[{name:'站姿小腿拉伸',sets:'每侧30秒',default:true},{name:'鸽子式',sets:'每侧30秒',default:false}]):pickByRegion(['臀腿','小腿'],'下肢拉伸',2,[{name:'股四头肌拉伸',sets:'每侧30秒',default:true},{name:'腘绳肌拉伸',sets:'每侧30秒',default:false}])};
    return {
      label: day.label,
      sections: [
        { type:'warmup',title:'热身(5-10分钟)', groups:[cG, mG]},
        { type:'main',title:'正式训练',groups:mainGroups},
        { type:'stretch',title:'拉伸(5分钟)',groups:[uS, lS]}
      ]
    };
  });

  // 追加休息日
  days.push({
    label: '休息日',
    sections: [{
      type:'main',title:'休息日',groups:[
        { label:'核心训练',pickHint:'2选1',exercises:[{name:'平板支撑',sets:'3组×30秒',default:true},{name:'死虫式',sets:'3组×10次/侧',default:false}] },
        { label:'体态拉伸',pickHint:'2选1',exercises:[{name:'胸肌门框拉伸',sets:'每侧30秒',default:true},{name:'鸽子式',sets:'每侧30秒',default:false}] }
      ]
    }]
  });

  return {
    name,
    type: isFullbody ? '3day' : (is5Day ? '5day' : '3day'),
    description: ctx.goal + ' · ' + (isFullbody?'全身体':(is5Day?'五分化':'三分化')) + ' · 自动生成',
    progressNote: '渐进超负荷：完成全部组次后，复合动作下次 +2.5kg，孤立动作 +1.25kg 或 +1次',
    restSec: 120,
    days,
  };
}

// ===== 每日推荐 =====
function dailyRecommend(ctx) {
  const today = new Date();
  const recent = ctx.recent;
  if (recent.length === 0) return { day: 0, reason: '今天开始训练吧！建议从第1天开始' };

  // 找最近训练过的日类型
  const fatigue = {};
  recent.forEach(r => {
    const daysAgo = Math.floor((today - new Date(r.date)) / 86400000);
    const factor = Math.max(0, 1 - daysAgo / 4); // 4天恢复
    const groupCount = r.exercises ? r.exercises.filter(e => e.completed).length : 0;
    fatigue[r.type] = (fatigue[r.type] || 0) + factor * (groupCount / 8);
  });

  // 找疲劳最低的训练日（含默认计划记录）
  const total = (ctx.split.includes('五') ? 5 : 3);
  // 把默认 push/pull/legs 映射到 custom_0/1/2
  if (fatigue.push) { fatigue.custom_0 = (fatigue.custom_0 || 0) + fatigue.push; }
  if (fatigue.pull) { fatigue.custom_1 = (fatigue.custom_1 || 0) + fatigue.pull; }
  if (fatigue.legs) { fatigue.custom_2 = (fatigue.custom_2 || 0) + fatigue.legs; }
  let bestDay = 0, bestScore = Infinity;
  for (let i = 0; i < total; i++) {
    const key = 'custom_' + i;
    const score = fatigue[key] || 0;
    if (score < bestScore) { bestScore = score; bestDay = i; }
  }

  return { day: bestDay, reason: bestScore < 0.5 ? '今天推荐训练' : '各部位恢复良好，任选一天' };
}
