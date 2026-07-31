/* ============================================
   GymFlow v2.0 — 双入口导航
   训练 | 我的
*/

let currentPage = 'training';

// ── 初始化 ──
function initApp() {
  initTheme();
  // 开屏动画：2秒后淡出
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hide');
  }, 2000);

  const s = getSettings();
  if (!s.lastWorkoutType) { s.lastWorkoutType = null; saveSettings(s); }

  renderTrainingPage();
  renderMePage();

  document.querySelectorAll('.top-tab').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  registerPWA();
}

// ── 导航 ──
function navigateTo(page) {
  if (currentPage === page) return;
  const old = document.getElementById(`page-${currentPage}`);
  const nu = document.getElementById(`page-${page}`);
  if (old) old.classList.remove('active');
  if (nu) nu.classList.add('active');

  document.querySelectorAll('.top-tab').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  currentPage = page;

  // 底部评分栏仅在训练页显示
  const bar = document.getElementById('bottom-bar');
  if (bar) bar.style.display = (page === 'training') ? 'flex' : 'none';

  switch (page) {
    case 'training': renderTrainingPage(); break;
    case 'ai': renderAIPage(); break;
    case 'features': renderFeaturesPage(); break;
    case 'me': renderMePage(); break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── 「我的」页面 ──
function renderMePage() {
  const c = document.getElementById('me-content');
  const s = getSettings(); const u = s.userInfo;
  let h = '<h1 class="section-title">👤 我的</h1>';
  h += `<div class="me-section"><h3>基本信息</h3><div class="user-info-grid">`;
  h += `<div class="user-info-item" onclick="editUserInfo('gender')"><div class="label">性别</div><div class="value">${u.gender}</div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('age')"><div class="label">年龄</div><div class="value">${u.age}<span style="font-size:14px;color:var(--muted);">岁</span></div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('height')"><div class="label">身高</div><div class="value">${u.height}<span style="font-size:14px;color:var(--muted);">cm</span></div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('goal')"><div class="label">目标</div><div class="value" style="font-size:14px;">${u.goal||'减脂塑形'}</div></div>`;
  h += `</div></div>`;

  h += `<div class="me-section"><h3>主题外观</h3><div class="theme-switcher mb-16">`;
  ['auto','light','dark'].forEach(t => {
    const icons = { auto: '🔄', light: '☀️', dark: '🌙' };
    h += `<button class="theme-btn ${getTheme()===t?'active':''}" onclick="setTheme('${t}');renderMePage()"><span class="theme-icon">${icons[t]}</span>${icons[t]==='🔄'?'跟随系统':icons[t]==='☀️'?'浅色':'深色'}</button>`;
  });
  h += `</div></div>`;

  h += `<div class="me-section"><h3>AI 服务</h3>`;
  h += `<input type="text" class="form-input mb-8" id="ai-server-me" value="${localStorage.getItem('fitness_ai_server')||DEFAULT_AI_SERVER}" onchange="saveAIMe()" placeholder="API 地址">`;
  h += `<input type="password" class="form-input mb-8" id="ai-pwd-me" value="${localStorage.getItem('fitness_ai_password')||'gymflow2024'}" onchange="saveAIMe()" placeholder="访问密码"></div>`;

  h += `<div class="me-section"><h3>数据管理</h3><div style="display:flex;flex-direction:column;gap:8px;">`;
  h += `<button class="btn btn-outline btn-sm" onclick="exportData()">📤 导出数据</button>`;
  h += `<button class="btn btn-outline btn-sm" onclick="importData()">📥 导入数据</button>`;
  h += `<button class="btn btn-danger btn-sm" onclick="resetData()">⚠️ 重置全部数据</button></div></div>`;
  h += `<p class="about-text mt-16">GymFlow v${APP_VERSION} · 本地存储 · 三分化训练追踪</p>`;
  h += `<input type="file" id="import-file-input" accept=".json" style="display:none" onchange="handleImportFile(event)">`;
  c.innerHTML = h;
}

function saveAIMe() {
  localStorage.setItem('fitness_ai_server', document.getElementById('ai-server-me')?.value || '');
  localStorage.setItem('fitness_ai_password', document.getElementById('ai-pwd-me')?.value || '');
}

// ══════════════════════════════════════
// 模块化功能页系统
// 加新功能只需在 MODULES 数组加一行
// ══════════════════════════════════════

const FEATURE_MODULES = [
  {
    id: 'stats', icon: '📊', label: '数据统计',
    desc: () => `累计训练 ${getTypeCounts().total} 天`,
    render: renderStatsModule,
  },
  {
    id: 'plans', icon: '📋', label: '方案库',
    desc: () => {
      const plans = getPlans();
      const active = getActivePlanId();
      const activePlan = plans.find(p => p.id === active);
      return activePlan ? `当前：${activePlan.name}` : `当前：默认三分化 · ${plans.length}套方案`;
    },
    render: renderPlanLib,
  },
  {
    id: 'ai-coach', icon: '🧠', label: 'AI训练方案',
    desc: () => '定制化三分化/五分化训练',
    render: renderAICoach,
  },
  {
    id: 'exercises', icon: '📚', label: '动作库',
    desc: () => `${EXERCISE_DB.length}+ 动作 · 8维标签`,
    render: renderExerciseLib,
  },
  {
    id: 'weight', icon: '⚖️', label: '体重追踪',
    desc: () => {
      const ws = getWeights();
      return ws.length ? `${ws[ws.length-1].weight}kg · BMI ${calcBMI(ws[ws.length-1].weight).toFixed(1)}` : '暂无数据';
    },
    render: renderWeightModule,
  },
  // 加新模块在这里加一行即可
];

function renderFeaturesPage() {
  const c = document.getElementById('features-content');
  let h = '<h1 class="section-title">📦 功能</h1><div class="me-grid">';
  FEATURE_MODULES.forEach(m => {
    h += `<div class="me-card" onclick="openFeatureModule('${m.id}')"><div class="me-card-icon">${m.icon}</div><div class="me-card-label">${m.label}</div><div class="me-card-meta">${m.desc()}</div></div>`;
  });
  h += '</div>';
  c.innerHTML = h;
}

function openFeatureModule(id) {
  const mod = FEATURE_MODULES.find(m => m.id === id);
  if (!mod) return;
  const c = document.getElementById('features-content');
  let h = `<div class="sub-page-header"><button class="history-back-btn" onclick="renderFeaturesPage()">← 功能</button><span class="history-title">${mod.icon} ${mod.label}</span><span></span></div>`;
  c.innerHTML = h;
  mod.render(c);
  c.scrollIntoView({ behavior: 'smooth' });
}

// ── 统计模块（部位下钻）──
function renderStatsModule(container) {
  const counts = getTypeCounts();
  let h = `<div class="stat-cards"><div class="stat-card"><div class="stat-number">${counts.total}</div><div class="stat-label">累计训练天数</div></div><div class="stat-card"><div class="stat-number">${getStreak()}</div><div class="stat-label">连续打卡</div></div></div>`;

  // 部位下钻区域
  h += `<h3 style="font-size:14px;margin-bottom:10px;">各部位训练次数 <span style="font-size:11px;color:var(--muted);">（点击展开）</span></h3>`;
  h += `<div id="region-drill"></div>`;

  // 推拉腿柱状图
  h += `<div class="chart-container"><h3 style="font-size:14px;margin-bottom:10px;">推拉腿分布</h3><canvas id="chart-type"></canvas></div>`;
  h += `<div class="chart-container"><h3 style="font-size:14px;margin-bottom:10px;">体重变化</h3><canvas id="chart-weight"></canvas></div>`;
  h += `<div class="card"><div class="calendar-header"><span class="calendar-month" id="cal-month"></span><div class="calendar-nav"><button onclick="calNav(-1)">◀</button><button onclick="calNav(1)">▶</button></div></div><div class="calendar-grid" id="cal-grid"></div><div class="cal-legend" id="cal-legend"></div></div>`;
  container.innerHTML += h;

  // 构建区域数据
  const records = getRecords().filter(r => r.completed);
  const regionMap = {}; // { '胸': { count, subs: { '中胸': count, ... } }, ... }
  records.forEach(r => {
    const plan = getTrainingPlan(r.type);
    plan.sections.forEach(s => {
      if (!s.groups) return;
      s.groups.forEach(g => {
        if (!g.region) return;
        const done = isGroupCompleted(g, r);
        if (!done) return;
        const parts = g.region.split('.');
        const main = parts[0];
        const sub = parts[1] || '_total';
        if (!regionMap[main]) regionMap[main] = { count: 0, subs: {} };
        regionMap[main].count++;
        regionMap[main].subs[sub] = (regionMap[main].subs[sub] || 0) + 1;
      });
    });
  });

  // 渲染区域卡片（始终显示6大区域）
  const allRegions = ['胸', '肩', '背', '手臂', '臀腿', '核心'];
  const colors = { '胸': '#00c853', '肩': '#ffb74d', '背': '#00bcd4', '手臂': '#ef5350', '臀腿': '#b39ddb', '核心': '#fff176' };
  const icons = { '胸': '🏋️', '肩': '🙆', '背': '🔙', '手臂': '💪', '臀腿': '🦵', '核心': '🎯' };
  let rh = '';
  const maxCount = Math.max(1, ...allRegions.map(r => (regionMap[r]?.count || 0)));
  allRegions.forEach(name => {
    const data = regionMap[name] || { count: 0, subs: {} };
    const pct = Math.round(data.count / maxCount * 100);
    const subEntries = Object.entries(data.subs).filter(([k]) => k !== '_total');
    rh += `<div class="region-card" data-region="${name}" onclick="toggleRegionDrill(this)" id="rc-${name}">`;
    rh += `<div class="region-card-top"><span>${icons[name]||''} ${name}</span><span class="region-expand-arrow">▶</span><span style="font-weight:800;font-size:18px;">${data.count}<span style="font-size:12px;color:var(--muted);">次</span></span></div>`;
    rh += `<div class="region-bar"><div class="region-bar-fill" style="width:${pct}%;background:${colors[name]||'var(--accent)'};"></div></div>`;
    rh += `<div class="region-subs" id="rs-${name}" style="display:none;">`;
    if (subEntries.length > 0) {
      const subMax = Math.max(1, ...subEntries.map(([,c]) => c));
      subEntries.sort((a, b) => b[1] - a[1]).forEach(([sub, cnt]) => {
        const sp = Math.round(cnt / subMax * 100);
        rh += `<div class="region-sub-row"><span>${sub}</span><div class="region-sub-bar"><div class="region-sub-fill" style="width:${sp}%;background:${colors[name]||'var(--accent)'};"></div></div><span style="font-weight:600;">${cnt}</span></div>`;
      });
    } else {
      rh += `<div class="region-sub-row" style="color:var(--muted);">暂无细分数据</div>`;
    }
    rh += `</div>`;
    rh += `</div>`;
  });
  document.getElementById('region-drill').innerHTML = rh;

  setTimeout(() => {
    const tc = document.getElementById('chart-type');
    if (tc) new Chart(tc, { type: 'bar', data: { labels: ['推日','拉日','臀腿日'], datasets: [{ data: [counts.push, counts.pull, counts.legs], backgroundColor: ['rgba(0,200,83,.6)','rgba(0,188,212,.6)','rgba(179,157,219,.6)'], borderRadius: 8, borderSkipped: false }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#868686' } }, y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,.1)' }, ticks: { color: '#868686', stepSize: 1 } } } } });
    const ws = getWeights(); const wc = document.getElementById('chart-weight');
    if (wc && ws.length >= 2) { const vals = ws.map(w => w.weight); new Chart(wc, { type: 'line', data: { labels: ws.map(w => formatDateShort(w.date)), datasets: [{ data: vals, borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,.06)', borderWidth: 2.5, pointRadius: 4, tension: .35, fill: true }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(128,128,128,.06)' }, ticks: { color: '#868686', font: { size: 10 } } }, y: { grid: { color: 'rgba(128,128,128,.06)' }, ticks: { color: '#868686', font: { size: 10 } } } } } }); }
    calYear = new Date().getFullYear(); calMonth = new Date().getMonth(); renderCal();
  }, 100);
}

function toggleRegionDrill(card) {
  const name = card.dataset.region;
  const subs = document.getElementById('rs-' + name);
  const arrow = card.querySelector('.region-expand-arrow');
  if (!subs) return;
  const isHidden = subs.style.display === 'none';
  subs.style.display = isHidden ? 'block' : 'none';
  if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
}

let calYear = new Date().getFullYear(), calMonth = new Date().getMonth();
function calNav(d) { calMonth += d; if (calMonth < 0) { calMonth = 11; calYear--; } if (calMonth > 11) { calMonth = 0; calYear++; } renderCal(); }
function renderCal() {
  const le = document.getElementById('cal-month'); const ge = document.getElementById('cal-grid'); const lg = document.getElementById('cal-legend');
  if (!le || !ge) return;
  le.textContent = `${calMonth+1}月 ${calYear}`;
  const dtm = {}; getRecords().forEach(r => { if (r.completed || r.exercises.length > 0) dtm[r.date] = r.type; });
  const today = todayStr();
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const fd = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const tl = { push: '推', pull: '拉', legs: '腿', rest: '休' };
  let h = '';
  ['一','二','三','四','五','六','日'].forEach(d => { h += `<div class="calendar-day-header">${d}</div>`; });
  for (let i = 0; i < fd; i++) h += '<div class="calendar-day empty"></div>';
  for (let d = 1; d <= dim; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const t = dtm[ds];
    h += `<div class="calendar-day${t?' cal-type-'+t:''}${ds===today?' today':''}">${d}${t?'<span class="cal-dot">'+tl[t]+'</span>':''}</div>`;
  }
  ge.innerHTML = h;
  if (lg) lg.innerHTML = '<span class="cal-legend-item"><span class="cal-dot-leg" style="background:#00c853;"></span>推</span><span class="cal-legend-item"><span class="cal-dot-leg" style="background:#00bcd4;"></span>拉</span><span class="cal-legend-item"><span class="cal-dot-leg" style="background:#b39ddb;"></span>腿</span><span class="cal-legend-item"><span class="cal-dot-leg" style="background:#ffb74d;"></span>休</span>';
}

// ── 体重模块 ──
function renderWeightModule(container) {
  const ws = getWeights();
  let h = `<div class="form-row mb-8"><div class="form-group"><input type="date" class="form-input" id="w-date" value="${todayStr()}" style="font-size:13px;"></div><div class="form-group"><input type="number" class="form-input" id="w-val" placeholder="体重 kg" step="0.1" inputmode="decimal"></div></div>`;
  h += `<button class="btn btn-accent mb-8" onclick="addWeightFromFeatures()">添加记录</button>`;
  if (ws.length >= 2) h += `<div class="chart-container"><canvas id="chart-weight-dual"></canvas></div>`;
  if (ws.length > 0) {
    ws.slice().reverse().forEach(w => { const b = calcBMI(w.weight); const cat = getBMICategory(b);
      h += `<div class="weight-list-item"><div><div class="weight-date">${formatDate(w.date)}</div><div style="font-size:12px;color:${cat.color};">BMI ${b.toFixed(1)} · ${cat.label}</div></div><div class="weight-value">${w.weight}<span>kg</span></div><button class="btn-delete" onclick="handleDeleteWeight('${w.id}');openFeatureModule('weight')">🗑️</button></div>`;
    });
  } else h += `<div class="empty-state"><span class="empty-icon">📋</span><p>暂无体重记录</p></div>`;
  container.innerHTML += h;
  if (ws.length >= 2) setTimeout(() => {
    const ws2 = getWeights(); const cv = document.getElementById('chart-weight-dual'); if (!cv || ws2.length < 2) return;
    const wV = ws2.map(w => w.weight); const bV = ws2.map(w => calcBMI(w.weight));
    new Chart(cv, { type: 'line', data: { labels: ws2.map(w => formatDateShort(w.date)), datasets: [
      { label: '体重 kg', data: wV, borderColor: '#00c853', backgroundColor: 'rgba(0,200,83,.06)', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#00c853', tension: .35, fill: true, yAxisID: 'y' },
      { label: 'BMI', data: bV, borderColor: '#ffb74d', backgroundColor: 'rgba(255,183,77,.04)', borderWidth: 2.5, borderDash: [5,3], pointRadius: 4, pointBackgroundColor: '#ffb74d', tension: .35, fill: true, yAxisID: 'y1' },
    ]}, options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#868686', usePointStyle: true, padding: 16, font: { size: 11 } } } }, scales: { x: { grid: { color: 'rgba(128,128,128,.06)' }, ticks: { color: '#868686', font: { size: 10 } } }, y: { position: 'left', grid: { color: 'rgba(128,128,128,.06)' }, ticks: { color: '#868686', font: { size: 10 }, callback: v => v + ' kg' } }, y1: { position: 'right', grid: { display: false }, ticks: { color: '#ffb74d', font: { size: 10 } } } } } });
  }, 100);
}
// ── 方案库 ──
function renderPlanLib(container) {
  const plans = getPlans();
  const activeId = getActivePlanId();
  let h = '';

  // 默认方案
  const isDefault = activeId === 'default';
  h += `<div class="card ${isDefault?'completed':''}" style="cursor:pointer;" onclick="setActivePlan('default');openFeatureModule('plans')">`;
  h += `<div class="flex-between"><div><span class="card-target">📌 默认</span><div class="card-title mt-8">三分化训练（推/拉/臀腿）</div><div class="card-meta">系统内置 · 4天轮转含休息日</div></div>`;
  h += `${isDefault?'<span style="color:var(--accent);font-weight:700;">✓ 当前</span>':''}</div></div>`;

  // 自定义方案
  if (plans.length === 0) {
    h += '<p class="text-muted text-center mt-16">暂无自定义方案<br>去「AI训练方案」生成你的专属计划</p>';
  } else {
    plans.forEach(p => {
      const isActive = p.id === activeId;
      h += `<div class="card ${isActive?'completed':''}" style="cursor:pointer;">`;
      h += `<div class="flex-between" onclick="setActivePlan('${p.id}');openFeatureModule('plans')"><div><span class="card-target">${p.type==='5day'?'5分化':'3分化'}</span><div class="card-title mt-8">${p.name}</div><div class="card-meta">${p.description||''} · ${p.createdAt}</div></div>`;
      h += `${isActive?'<span style="color:var(--accent);font-weight:700;">✓ 当前</span>':''}</div>`;
      h += `<button class="btn btn-sm btn-outline mt-8" onclick="event.stopPropagation();deletePlan('${p.id}');openFeatureModule('plans')" style="width:auto;">🗑️ 删除</button>`;
      h += '</div>';
    });
  }
  container.innerHTML += h;
}

// ── AI 定制训练方案 ──
let coachMessages = [];
let coachLoading = false;
let coachProfile = {};
let coachPlanGenerated = null;

const COACH_STEPS = [
  { key: 'experience', question: '你健身多久了？', options: ['刚开始(0-3个月)','半年左右','1-2年','2年以上'] },
  { key: 'days', question: '每周能训练几天？', options: ['2-3天','3-4天','4-5天','5-6天'] },
  { key: 'goal', question: '当前主要目标是？', options: ['增肌增重','减脂塑形','提升力量','体态矫正'] },
  { key: 'equipment', question: '你能用的器械有哪些？', options: ['商业健身房(全器械)','家庭哑铃+弹力带','自重为主'] },
  { key: 'focus', question: '想重点改善哪些部位？', options: ['胸+肩','背+手臂','臀腿','全身均衡'] },
  { key: 'issues', question: '有无体态问题或伤病？', options: ['无','圆肩/溜肩','肩峰撞击','膝盖不适','下背不适'] },
];

function renderAICoach(_unused) { const fc = document.getElementById('features-content');
  // 已有方案 → 显示总结 + 重新开始按钮
  if (coachPlanGenerated) {
    let h = '<div class="sub-page-header"><button class="history-back-btn" onclick="renderFeaturesPage()">← 功能</button><span class="history-title">🧠 AI训练方案</span><span></span></div>';
    h += '<div class="chat-box"><div class="chat-msg ai"><div class="chat-bubble">✅ 你的定制方案已生成！<br><br>方案已保存到方案库供你随时切换使用。</div></div></div>';
    h += '<button class="btn btn-accent mt-16" onclick="coachReset()">🔄 重新定制</button>';
    fc.innerHTML = h;
    return;
  }

  let h = '<div class="sub-page-header"><button class="history-back-btn" onclick="renderFeaturesPage()">← 功能</button><span class="history-title">🧠 AI训练方案</span><span></span></div>';
  h += '<div class="chat-box" id="coach-chat" style="padding-bottom:60px;max-height:58vh;min-height:350px;">';

  if (coachMessages.length === 0) {
    const s = getSettings();
    const name = s.userInfo.gender === '女' ? '姐妹' : '兄弟';
    h += `<div class="chat-msg ai"><div class="chat-bubble">嗨${name}！我是你的AI教练 🧠<br><br>我来帮你定制一套专属训练方案。先了解一下你的情况——<br><br>${COACH_STEPS[0].question}</div></div>`;
    h += `<div class="chat-suggestions" style="padding:0 0 12px 0;">`;
    COACH_STEPS[0].options.forEach(o => {
      h += `<button class="chat-sugg-btn" onclick="coachAnswer('${o}')">${o}</button>`;
    });
    h += '</div>';
  } else {
    coachMessages.forEach((msg, i) => {
      h += `<div class="chat-msg ${msg.role}"><div class="chat-bubble">${msg.content.replace(/\n/g,'<br>')}</div></div>`;
      // Show quick replies after last AI message
      if (msg.options && i === coachMessages.length-1 && !coachLoading) {
        h += '<div class="chat-suggestions" style="padding:0 0 8px 8px;">';
        msg.options.forEach(o => {
          h += `<button class="chat-sugg-btn" onclick="coachAnswer('${o}')">${o}</button>`;
        });
        h += '</div>';
      }
    });
    if (coachLoading) {
      h += '<div class="chat-msg ai"><div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>';
    }
  }

  h += '</div>';

  // 自由输入 + 发送按钮（固定底部）
  h += '<div class="chat-input-row"><input class="chat-input" id="coach-input" placeholder="输入回答..." onkeydown="if(event.key===\'Enter\')coachSendFree()"><button class="chat-send-btn" id="coach-send" onclick="coachSendFree()">➤</button></div>';
  h += '<div class="chat-status" id="coach-status"></div>';

  fc.innerHTML = h;
  setTimeout(() => { const box = document.getElementById('coach-chat'); if(box) box.scrollTop = box.scrollHeight; }, 100);
}

function coachReset() {
  coachMessages = [];
  coachProfile = {};
  coachPlanGenerated = null;
  coachLoading = false;
  openFeatureModule('ai-coach');
}

function coachAnswer(answer) {
  if (answer === '🔄 重试' || answer === '🔄 重新生成') {
    // 重试：去掉最后一条AI错误消息，重新生成
    coachMessages.pop();
    coachGeneratePlan();
    return;
  }
  coachMessages.push({ role: 'user', content: answer });
  const done = coachProcessStep(answer);
  if (done) {
    coachGeneratePlan();
  } else {
    renderAICoach(document.getElementById('features-content'));
  }
}

function coachSendFree() {
  const input = document.getElementById('coach-input');
  const text = (input?.value || '').trim();
  if (!text || coachLoading) return;
  input.value = '';
  coachAnswer(text);
}

function coachProcessStep(answer) {
  // Find which step we're on
  const answered = Object.keys(coachProfile).length;
  const step = COACH_STEPS[answered];
  if (step) {
    coachProfile[step.key] = answer;
  }

  const nextStep = COACH_STEPS[Object.keys(coachProfile).length];
  if (nextStep) {
    coachMessages.push({ role: 'ai', content: `${nextStep.question}` });
    // Add quick reply buttons via a special marker
    coachMessages[coachMessages.length-1].options = nextStep.options;
    return false;
  }
  return true; // All steps done
}

async function coachGeneratePlan() {
  coachLoading = true;
  renderAICoach(document.getElementById('features-content'));

  const status = document.getElementById('coach-status');
  if (status) status.textContent = '🧠 AI正在为你定制训练方案...';

  // Build comprehensive prompt
  const s = getSettings();
  let prompt = `## 用户信息\n性别：${s.userInfo.gender} · 年龄：${s.userInfo.age} · 身高：${s.userInfo.height}cm\n`;
  prompt += `## 训练问卷\n`;
  COACH_STEPS.forEach(st => { prompt += `${st.question} → ${coachProfile[st.key]}\n`; });
  prompt += `\n## 要求\n根据以上信息，从动作数据库中为ta定制一套训练方案。`;
  prompt += `\n当前重量：${(getWeights().slice(-1)[0]||{}).weight||'未知'}kg`;
  prompt += `\n\n请生成JSON格式的训练方案（不要markdown代码块）：`;
  prompt += `\n{"name":"方案名称","type":"3day或5day","description":"简短描述","days":[{"label":"训练日名称","groups":[{"label":"肌群名","exercises":[{"name":"动作名","sets":"组数×次数"}]}]}]}`;
  prompt += `\n每个训练日4-6个肌群组，每组选1个合适动作。方案要结合ta的器械条件。`;

  try {
    const resp = await fetch(getAIServer()+'/api/ask', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:getAIPassword(),deviceId:getDeviceId(),content:prompt})
    });
    const data = await resp.json();
    if (data.success) {
      // 尝试解析JSON（多种格式兼容）
      let plan = null;
      let raw = data.answer;
      // 去掉markdown代码块
      raw = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      // 尝试提取JSON对象
      const jsonMatch = raw.match(/\{[\s\S]*"name"[\s\S]*"days"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[0]);
          if (json.name && json.days && Array.isArray(json.days)) {
            plan = addPlan(json);
          }
        } catch(e) { console.log('JSON parse error:', e.message); }
      }

      let resultText = '';
      if (plan) {
        // 显示方案预览
        resultText = `✅ 方案"${plan.name}"已生成并保存！\n\n`;
        resultText += `📋 ${plan.type === '5day' ? '五分化' : '三分化'} · ${plan.days.length}天训练\n\n`;
        plan.days.forEach(d => {
          resultText += `▸ ${d.label}\n`;
          if (d.groups) d.groups.forEach(g => {
            if (g.exercises) g.exercises.forEach(ex => {
              resultText += `  · ${ex.name}  ${ex.sets||''}\n`;
            });
          });
        });
        setActivePlan(plan.id);
        coachPlanGenerated = plan;
        if (status) status.textContent = `✅ 方案"${plan.name}"已设为当前 → 去训练页查看`;
      } else {
        resultText = '⚠️ AI返回了方案但格式无法解析，请重试\n\n原始回复：\n' + data.answer.substring(0, 200) + '...';
        coachPlanGenerated = null; // 不标记成功，走重试分支
        if (status) status.textContent = 'JSON解析失败，点击重试';
      }
      coachMessages.push({ role: 'ai', content: resultText, options: ['🔄 重新生成'] });
    } else {
      coachMessages.push({ role: 'ai', content: '⚠️ 生成失败：' + data.error, options: ['🔄 重试'] });
      if (status) status.textContent = '';
    }
  } catch(e) {
    coachMessages.push({ role: 'ai', content: '⚠️ 无法连接AI服务', options: ['🔄 重试'] });
    if (status) status.textContent = '';
  }
  coachLoading = false;
  renderAICoach(document.getElementById('features-content'));
}

// ── 动作库浏览 ──
function renderExerciseLib(container) {
  let h = `<div class="form-row mb-8"><div class="form-group"><input type="text" class="form-input" id="ex-search" placeholder="搜索动作..." oninput="filterExercises()" style="font-size:14px;"></div></div>`;
  h += `<div class="day-switcher mb-8" id="ex-region-filter">`;
  h += `<button class="day-switch-btn active" onclick="filterByRegion(this,'全部')">全部</button>`;
  Object.keys(REGION_TREE).forEach(r => {
    h += `<button class="day-switch-btn" onclick="filterByRegion(this,'${r}')">${REGION_TREE[r].icon} ${r}</button>`;
  });
  h += `</div>`;
  h += `<div id="ex-list" class="ex-list"></div>`;
  container.innerHTML += h;
  filterExercises();
}

let exFilter = { search: '', region: '全部' };
function filterByRegion(btn, r) {
  exFilter.region = r;
  document.querySelectorAll('#ex-region-filter .day-switch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterExercises();
}
function filterExercises() {
  const s = (document.getElementById('ex-search')?.value || '').toLowerCase();
  exFilter.search = s;
  const list = document.getElementById('ex-list');
  if (!list) return;
  let filtered = EXERCISE_DB;
  if (exFilter.region !== '全部') filtered = filtered.filter(e => e.region.startsWith(exFilter.region));
  if (s) filtered = filtered.filter(e => e.name.includes(s) || e.equipment.includes(s) || e.region.includes(s));
  if (filtered.length === 0) { list.innerHTML = '<p class="text-muted text-center mt-16">无匹配动作</p>'; return; }
  let h = `<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${filtered.length} 个动作</div>`;
  filtered.forEach(e => {
    const parts = e.region.split('.');
    const ri = REGION_TREE[parts[0]];
    h += `<div class="card ex-card"><div class="flex-between"><div><span style="font-size:12px;color:${ri?.color||'var(--accent)'};">${ri?.icon||''} ${e.region}</span><div class="card-title" style="font-size:14px;margin-top:2px;">${e.name}</div><div class="card-meta">${e.equipment} · ${e.mechanics} · ${e.difficulty} · ${e.type}</div></div></div></div>`;
  });
  list.innerHTML = h;
}

function addWeightFromFeatures() {
  const v = parseFloat(document.getElementById('w-val')?.value);
  if (!v || v <= 0) { showToast('请输入有效体重', 'error'); return; }
  addWeight({ date: document.getElementById('w-date')?.value || todayStr(), weight: v });
  showToast(`已记录 ${v} kg`, 'success');
  openFeatureModule('weight');
}

// ── 旧函数占位 ──
// 旧函数占位（已迁移到 FEATURE_MODULES）

function renderStatsInMe(sub) {
  const counts = getTypeCounts();
  let h = `<div class="me-section mt-16"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>📊 数据统计</h3><span style="font-size:12px;color:var(--accent);cursor:pointer;" onclick="sub.innerHTML='';sub.scrollIntoView({behavior:'smooth'})">收起</span></div>`;
  h += `<div class="stat-cards"><div class="stat-card"><div class="stat-number">${counts.total}</div><div class="stat-label">累计训练天数</div></div><div class="stat-card"><div class="stat-number">${getStreak()}</div><div class="stat-label">连续打卡</div></div></div>`;
  h += `<div class="chart-container"><h3 style="font-size:15px;margin-bottom:12px;">各部位训练次数</h3><canvas id="type-chart-me"></canvas></div>`;
  h += `<div class="chart-container"><h3 style="font-size:15px;margin-bottom:12px;">体重变化</h3><canvas id="weight-chart-me"></canvas></div>`;
  sub.innerHTML = h;
  setTimeout(() => {
    renderTypeChartCanvas('type-chart-me', counts);
    renderWeightChartCanvas('weight-chart-me');
  }, 100);
}

function renderWeightInMe(sub) {
  let h = `<div class="me-section mt-16"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>⚖️ 体重追踪</h3><span style="font-size:12px;color:var(--accent);cursor:pointer;" onclick="sub.innerHTML='';sub.scrollIntoView({behavior:'smooth'})">收起</span></div>`;
  const weights = getWeights();
  h += `<div class="form-row mb-8"><div class="form-group"><input type="date" class="form-input" id="w-date-me" value="${todayStr()}" style="font-size:13px;"></div><div class="form-group"><input type="number" class="form-input" id="w-val-me" placeholder="体重 kg" step="0.1" inputmode="decimal"></div></div>`;
  h += `<button class="btn btn-accent mb-8" onclick="addWeightFromMe()">添加</button>`;

  if (weights.length >= 2) {
    h += `<div class="chart-container"><canvas id="weight-chart-me"></canvas></div>`;
  }

  if (weights.length > 0) {
    weights.slice().reverse().forEach(w => {
      const b = calcBMI(w.weight); const cat = getBMICategory(b);
      h += `<div class="weight-list-item"><div><div class="weight-date">${formatDate(w.date)}</div><div style="font-size:12px;color:${cat.color};">BMI ${b.toFixed(1)} · ${cat.label}</div></div><div class="weight-value">${w.weight}<span>kg</span></div><button class="btn-delete" onclick="handleDeleteWeight('${w.id}');renderWeightInMe(sub)">🗑️</button></div>`;
    });
  } else {
    h += `<p class="text-muted text-center mt-16">暂无记录</p>`;
  }
  sub.innerHTML = h;

  if (weights.length >= 2) {
    setTimeout(() => renderDualLineChart('weight-chart-me', weights), 100);
  }
}

function renderDualLineChart(canvasId, weights) {
  const cv = document.getElementById(canvasId); if (!cv) return;
  const weightVals = weights.map(w => w.weight);
  const bmiVals = weights.map(w => calcBMI(w.weight));
  const wMin = Math.floor(Math.min(...weightVals) - 2);
  const wMax = Math.ceil(Math.max(...weightVals) + 2);
  const bMin = Math.floor(Math.min(...bmiVals) - 1);
  const bMax = Math.ceil(Math.max(...bmiVals) + 1);

  new Chart(cv, {
    type: 'line',
    data: {
      labels: weights.map(w => formatDateShort(w.date)),
      datasets: [
        {
          label: '体重 (kg)',
          data: weightVals,
          borderColor: '#00c853',
          backgroundColor: 'rgba(0,200,83,0.06)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#00c853',
          tension: 0.35,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'BMI',
          data: bmiVals,
          borderColor: '#ffb74d',
          backgroundColor: 'rgba(255,183,77,0.04)',
          borderWidth: 2.5,
          borderDash: [5, 3],
          pointRadius: 4,
          pointBackgroundColor: '#ffb74d',
          tension: 0.35,
          fill: true,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#868686', usePointStyle: true, pointStyleWidth: 8, padding: 20, font: { size: 12 } } },
        tooltip: { backgroundColor: '#141414', borderColor: '#1f1f1f', borderWidth: 1, cornerRadius: 8, padding: 10 },
      },
      scales: {
        x: { grid: { color: 'rgba(128,128,128,.06)' }, ticks: { color: '#868686', font: { size: 10 } } },
        y: {
          type: 'linear', position: 'left', min: wMin, max: wMax,
          grid: { color: 'rgba(128,128,128,.06)' },
          ticks: { color: '#868686', font: { size: 10 }, callback: v => v + ' kg' },
        },
        y1: {
          type: 'linear', position: 'right', min: bMin, max: bMax,
          grid: { display: false },
          ticks: { color: '#ffb74d', font: { size: 10 } },
        },
      },
    },
  });
}

function addWeightFromMe() {
  const v = parseFloat(document.getElementById('w-val-me')?.value);
  if(!v||v<=0){showToast('请输入体重','error');return}
  addWeight({date:document.getElementById('w-date-me')?.value||todayStr(),weight:v});
  showToast(`已记录 ${v} kg`,'success');
  renderMePage();
}

function renderSettingsInMe(sub) {
  let h = `<div class="me-section mt-16"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>⚙️ 设置</h3><span style="font-size:12px;color:var(--accent);cursor:pointer;" onclick="sub.innerHTML='';sub.scrollIntoView({behavior:'smooth'})">收起</span></div>`;
  // Theme
  h += `<h3 style="font-size:12px;color:var(--muted);margin-bottom:6px;">主题外观</h3><div class="theme-switcher mb-16">`;
  ['auto','light','dark'].forEach(t=>{const icons={auto:'🔄',light:'☀️',dark:'🌙'};const labels={auto:'跟随系统',light:'浅色',dark:'深色'};h+=`<button class="theme-btn ${getTheme()===t?'active':''}" onclick="setTheme('${t}');renderMePage()"><span class="theme-icon">${icons[t]}</span>${labels[t]}</button>`});
  h += `</div>`;
  // AI
  h += `<h3 style="font-size:12px;color:var(--muted);margin-bottom:6px;">AI 服务</h3>`;
  h += `<input type="text" class="form-input mb-8" id="ai-server-input-s" value="${localStorage.getItem('fitness_ai_server')||'https://fathers-resistance-integral-valves.trycloudflare.com'}" onchange="saveAIConfigS()" placeholder="API地址">`;
  h += `<input type="text" class="form-input mb-8" id="ai-password-input-s" value="${localStorage.getItem('fitness_ai_password')||'gymflow2024'}" onchange="saveAIConfigS()" placeholder="密码">`;
  // Data
  h += `<h3 style="font-size:12px;color:var(--muted);margin-bottom:6px;">数据管理</h3><div style="display:flex;flex-direction:column;gap:8px;">`;
  h += `<button class="btn btn-outline btn-sm" onclick="exportData()">📤 导出数据</button>`;
  h += `<button class="btn btn-outline btn-sm" onclick="importData()">📥 导入数据</button>`;
  h += `<button class="btn btn-danger btn-sm" onclick="resetData()">⚠️ 重置数据</button></div>`;
  h += `<p class="about-text mt-16">GymFlow v${APP_VERSION} · 三分化训练追踪 · 本地存储</p>`;
  h += `<input type="file" id="import-file-input" accept=".json" style="display:none" onchange="handleImportFile(event)">`;
  sub.innerHTML = h;
}

function saveAIConfigS() {
  localStorage.setItem('fitness_ai_server', document.getElementById('ai-server-input-s')?.value||'');
  localStorage.setItem('fitness_ai_password', document.getElementById('ai-password-input-s')?.value||'');
}

// ── Theme ──
function getTheme(){ return localStorage.getItem('fitness_theme')||'auto'; }
function applyTheme(t){ localStorage.setItem('fitness_theme',t); if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t); }
function setTheme(t){ applyTheme(t);showToast(t==='auto'?'跟随系统':t==='light'?'浅色模式':'深色模式','success'); }
function initTheme(){ applyTheme(getTheme()); }
function updateThemeButtons(){document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===getTheme()));}

// ── User Info ──
function editUserInfo(field){
  const s=getSettings();const u=s.userInfo;const cur=field==='goal'?(u.goal||'减脂塑形'):u[field];
  const v=prompt({gender:'修改性别',age:'修改年龄',height:'修改身高(cm)',goal:'修改目标'}[field],cur);
  if(v===null)return;
  const val={gender:'text',age:'number',height:'number',goal:'text'}[field]==='number'?(parseInt(v)||cur):v.trim()||cur;
  if(field==='goal')u.goal=val;else u[field]=val;
  saveSettings(s);renderMePage();
}

// ── Chart helpers ──
function renderTypeChartCanvas(id, counts){
  const cv=document.getElementById(id); if(!cv)return;
  new Chart(cv,{type:'bar',data:{labels:['推日','拉日','臀腿日'],datasets:[{label:'训练次数',data:[counts.push,counts.pull,counts.legs],backgroundColor:['rgba(0,200,83,.6)','rgba(0,188,212,.6)','rgba(179,157,219,.6)'],borderColor:['#00c853','#00bcd4','#b39ddb'],borderWidth:1.5,borderRadius:8,borderSkipped:false}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:getComputedStyle(document.body).getPropertyValue('--muted')}},y:{beginAtZero:true,grid:{color:'rgba(128,128,128,.1)'},ticks:{color:'#868686',stepSize:1}}}}});
}
function renderWeightChartCanvas(id){
  const cv=document.getElementById(id); if(!cv)return;
  const ws=getWeights(); if(ws.length<2)return;
  const vals=ws.map(w=>w.weight); const min=Math.floor(Math.min(...vals)-2); const max=Math.ceil(Math.max(...vals)+2);
  new Chart(cv,{type:'line',data:{labels:ws.map(w=>formatDateShort(w.date)),datasets:[{data:vals,borderColor:'#00c853',backgroundColor:'rgba(0,200,83,.06)',borderWidth:2.5,pointRadius:4,tension:.3,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(128,128,128,.06)'},ticks:{color:'#868686',font:{size:10}}},y:{min,max,grid:{color:'rgba(128,128,128,.06)'},ticks:{color:'#868686',font:{size:10}}}}}});
}

// ── Export / Import ──
function exportData(){const j=exportAllData();const b=new Blob([j],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`gymflow-backup-${todayStr()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);showToast('已导出','success')}
function importData(){document.getElementById('import-file-input')?.click()}
function handleImportFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){if(importAllData(ev.target.result)){showToast('导入成功','success');renderMePage();renderTrainingPage()}else showToast('格式错误','error')};r.readAsText(f);e.target.value=''}
function resetData(){if(!confirm('确定删除所有数据？不可恢复！'))return;if(!confirm('再次确认'))return;resetAllData();const s=getSettings();s.lastWorkoutType=null;saveSettings(s);showToast('已重置','success');renderMePage();renderTrainingPage()}

// ── Toast ──
function showToast(msg,type='success'){const c=document.getElementById('toast');const t=document.createElement('div');t.className=`toast-item ${type}`;t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),2200)}

// ── PWA ──
function registerPWA(){if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(r=>console.log('SW registered'),()=>{})})}}

document.addEventListener('DOMContentLoaded', initApp);
