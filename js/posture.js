/* ============================================
   体态矫正闭环 — 自测 → 定制 → 追踪
   ============================================ */

const POSTURE_QUESTIONS = [
  {
    id: 'rounded_shoulder',
    title: '圆肩测试',
    desc: '自然站立，双臂放松下垂，观察手掌朝向',
    options: [
      { label: '掌心朝向大腿（正常）', tag: null, suggestion: '肩部位置正常' },
      { label: '掌心朝后 / 肩明显前扣', tag: '圆肩', suggestion: '可能存在圆肩，建议加强中下斜方肌和菱形肌训练' },
    ],
  },
  {
    id: 'sloped_shoulder',
    title: '溜肩测试',
    desc: '侧对镜子，观察肩颈夹角是否过大',
    options: [
      { label: '肩颈线条自然平直（正常）', tag: null, suggestion: '溜肩状态正常' },
      { label: '肩线下斜明显 / 斜方肌紧张上提', tag: '溜肩', suggestion: '可能存在溜肩，建议加强肩胛提肌和上斜方肌拉伸' },
    ],
  },
  {
    id: 'humerus_anterior',
    title: '肱骨前移测试',
    desc: '侧面站立，观察手臂是否明显在躯干前方',
    options: [
      { label: '手臂自然垂于躯干侧方（正常）', tag: null, suggestion: '肱骨位置正常' },
      { label: '手臂偏前 / 含胸体态明显', tag: '肱骨前移', suggestion: '可能存在肱骨前移，建议加强肩后束和肩袖肌群训练' },
    ],
  },
  {
    id: 'shoulder_impingement',
    title: '肩峰撞击测试',
    desc: '缓慢将手臂从侧面抬高至水平90°，感受有无不适',
    options: [
      { label: '全程无痛、活动自如（正常）', tag: null, suggestion: '肩关节活动正常' },
      { label: '抬臂时肩前侧疼痛 / 弹响', tag: '肩峰撞击风险', suggestion: '可能存在肩峰撞击风险，建议推类动作控制幅度并加强肩袖肌群' },
    ],
  },
];

function getBodyProfile() {
  try { return JSON.parse(localStorage.getItem('fitness_body_profile') || 'null'); }
  catch { return null; }
}

function saveBodyProfile(profile) {
  localStorage.setItem('fitness_body_profile', JSON.stringify(profile));
}

let postureAnswers = {};

function renderPostureModule(container) {
  postureAnswers = {};
  const profile = getBodyProfile();
  const hasHistory = profile && profile.history && profile.history.length > 1;

  let h = '';
  if (profile) {
    // 显示画像
    h += '<div class="card completed" style="margin-bottom:12px;"><div class="card-title">✅ 体态画像</div><div class="card-meta">首次评估：' + profile.createdAt + '</div>';
    h += '<div style="margin-top:8px;">' + (profile.postureTags.length > 0 ? profile.postureTags.map(t => '<span class="card-equipment" style="background:rgba(255,183,77,.15);color:#ffb74d;">' + t + '</span>').join(' ') : '🎉 未发现明显体态问题') + '</div></div>';
    // 复测入口
    const daysSince = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000);
    h += `<div class="card"><div class="card-title">🔄 复测</div><div class="card-meta">距上次 ${daysSince} 天 · 每4周复测一次</div>`;
    h += `<button class="btn btn-outline btn-sm mt-8" onclick="startPostureRetest()" style="width:auto;">开始复测</button></div>`;
    // 进展时间线
    if (profile.history && profile.history.length > 1) {
      h += '<div class="card mt-8"><div class="card-title">📈 矫正进展</div>';
      profile.history.forEach(entry => {
        h += '<div class="card-meta">' + entry.date + '：' + (entry.tags.length > 0 ? entry.tags.join('、') : '🎉 已改善') + '</div>';
      });
      h += '</div>';
    }
  } else {
    // 开始自测
    h += '<p style="margin-bottom:12px;color:var(--muted);font-size:13px;">对照镜子观察，选择最符合的选项</p>';
    POSTURE_QUESTIONS.forEach((q, i) => {
      h += `<div class="card" style="margin-bottom:8px;"><div class="card-title" style="font-size:14px;">${i+1}. ${q.title}</div><div class="card-meta" style="margin-bottom:6px;">💡 ${q.desc}</div>`;
      q.options.forEach((opt, j) => {
        h += `<div style="padding:8px 10px;margin-bottom:4px;border-radius:8px;background:var(--bg);cursor:pointer;" onclick="selectPostureOption(this,${i},${j})" id="po-${i}-${j}">${opt.label}</div>`;
      });
      h += '</div>';
    });
    h += '<button class="btn btn-accent mt-8" id="posture-submit" disabled onclick="submitPosture()">生成体态画像</button>';
  }
  container.innerHTML += h;
}

function selectPostureOption(el, qi, oi) {
  // 清除该题其他选项
  const parent = el.parentElement;
  parent.querySelectorAll('div[style]').forEach(d => d.style.background = 'var(--bg)');
  el.style.background = 'rgba(0,200,83,.12)';
  postureAnswers[POSTURE_QUESTIONS[qi].id] = oi;
  // 检查是否全部回答
  const allAnswered = POSTURE_QUESTIONS.every(q => postureAnswers[q.id] !== undefined);
  const btn = document.getElementById('posture-submit') || document.getElementById('retest-submit');
  if (btn) btn.disabled = !allAnswered;
}

function submitPosture() {
  const tags = [];
  POSTURE_QUESTIONS.forEach(q => {
    const oi = postureAnswers[q.id];
    if (oi !== undefined) {
      const opt = q.options[oi];
      if (opt.tag) tags.push(opt.tag);
    }
  });
  const profile = {
    postureTags: tags,
    createdAt: todayStr(),
    history: [{ date: todayStr(), tags, notes: tags.length > 0 ? tags.join('、') + ' 需矫正' : '体态正常' }],
  };
  // 如果有旧数据，追加历史
  const old = getBodyProfile();
  if (old && old.history) {
    profile.history = [...old.history, { date: todayStr(), tags, notes: tags.length > 0 ? tags.join('、') + ' 需矫正' : '体态正常' }];
  }
  saveBodyProfile(profile);
  showToast(tags.length > 0 ? `检测到 ${tags.length} 项体态问题` : '🎉 体态正常！', 'success');
  openFeatureModule('posture');
}

function startPostureRetest() {
  postureAnswers = {};
  const c = document.getElementById('features-content');
  let h = '<div class="sub-page-header"><button class="history-back-btn" onclick="renderFeaturesPage()">← 功能</button><span class="history-title">🔄 体态复测</span><span></span></div>';
  h += '<p style="margin-bottom:12px;color:var(--muted);font-size:13px;">重新判断，看看有没有改善</p>';
  POSTURE_QUESTIONS.forEach((q, i) => {
    h += `<div class="card" style="margin-bottom:8px;"><div class="card-title" style="font-size:14px;">${i+1}. ${q.title}</div><div class="card-meta" style="margin-bottom:6px;">💡 ${q.desc}</div>`;
    q.options.forEach((opt, j) => {
      h += `<div style="padding:8px 10px;margin-bottom:4px;border-radius:8px;background:var(--bg);cursor:pointer;" onclick="selectPostureOption(this,${i},${j})" id="rpo-${i}-${j}">${opt.label}</div>`;
    });
    h += '</div>';
  });
  h += '<button class="btn btn-accent mt-8" id="retest-submit" disabled onclick="submitPostureRetest()">保存复测结果</button>';
  c.innerHTML = h;
}

function submitPostureRetest() {
  const tags = [];
  POSTURE_QUESTIONS.forEach(q => {
    const oi = postureAnswers[q.id];
    if (oi !== undefined) {
      const opt = q.options[oi];
      if (opt.tag) tags.push(opt.tag);
    }
  });
  const old = getBodyProfile();
  old.postureTags = tags;
  old.history.push({ date: todayStr(), tags, notes: tags.length > 0 ? tags.join('、') + ' 需矫正' : '体态正常' });
  saveBodyProfile(old);
  const improved = old.history[0].tags.length - tags.length;
  showToast(improved > 0 ? `🎉 改善了 ${improved} 项！` : tags.length === 0 ? '🎉 体态正常！' : '结果已保存', 'success');
  openFeatureModule('posture');
}
