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

  // 新手教程（首次启动或重置后显示）
  setTimeout(() => showAppTutorial(), 2500);

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
  const infoMissing = !u.gender || !u.age || !u.height;
  let h = '<h1 class="section-title">👤 我的</h1>';
  if (infoMissing) {
    h += `<div class="fresh-install-banner" style="margin-bottom:12px;"><div class="fresh-install-icon">🤖</div><div class="fresh-install-text"><b>信息未完善</b><br>让 AI 帮你了解自己，完善基础资料</div><button class="btn btn-sm btn-outline" onclick="startInfoWizard()" style="width:auto;flex-shrink:0;">AI 填写</button></div>`;
  }
  h += `<div class="me-section"><h3>基本信息${infoMissing?' <span style="font-size:11px;color:#ffb74d;">未完善</span>':''}</h3><div class="user-info-grid">`;
  h += `<div class="user-info-item" onclick="editUserInfo('gender')"><div class="label">性别</div><div class="value">${u.gender||'点击设置'}</div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('age')"><div class="label">年龄</div><div class="value">${u.age ? u.age + '<span style="font-size:14px;color:var(--muted);">岁</span>' : '点击设置'}</div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('height')"><div class="label">身高</div><div class="value">${u.height ? u.height + '<span style="font-size:14px;color:var(--muted);">cm</span>' : '点击设置'}</div></div>`;
  h += `<div class="user-info-item" onclick="editUserInfo('goal')"><div class="label">目标</div><div class="value" style="font-size:14px;">${u.goal||'点击设置'}</div></div>`;
  h += `</div></div>`;

  h += `<div class="me-section"><h3>主题外观</h3><div class="theme-switcher mb-16">`;
  ['auto','light','dark'].forEach(t => {
    const icons = { auto: '🔄', light: '☀️', dark: '🌙' };
    h += `<button class="theme-btn ${getTheme()===t?'active':''}" onclick="setTheme('${t}');renderMePage()"><span class="theme-icon">${icons[t]}</span>${icons[t]==='🔄'?'跟随系统':icons[t]==='☀️'?'浅色':'深色'}</button>`;
  });
  h += `</div></div>`;

  h += `<div class="me-section"><h3>AI 服务</h3>`;
  h += `<input type="text" class="form-input mb-8" id="ai-server-me" value="${localStorage.getItem('fitness_ai_server')||getAIBase()}" onchange="saveAIMe()" placeholder="API 地址">`;
  h += `<input type="password" class="form-input mb-8" id="ai-pwd-me" value="${localStorage.getItem('fitness_ai_password')||'gymflow2024'}" onchange="saveAIMe()" placeholder="访问密码"></div>`;

  h += `<div class="me-section"><h3>数据管理</h3><div style="display:flex;flex-direction:column;gap:8px;">`;
  h += `<button class="btn btn-outline btn-sm" onclick="exportData()">📤 导出数据</button><div style="font-size:10px;color:var(--muted);">↓ 保存到「下载」文件夹</div>`;
  h += `<button class="btn btn-outline btn-sm" onclick="importData()">📥 导入数据</button>`;
  h += `<button class="btn btn-danger btn-sm" onclick="resetData()">⚠️ 重置全部数据</button></div></div>`;
  h += `<p class="about-text mt-16">GymFlow v${APP_VERSION} · 本地存储 · 三分化训练追踪</p>`;
  h += `<input type="file" id="import-file-input" accept=".json" style="display:none" onchange="handleImportFile(event)">`;
  c.innerHTML = h;
}

// AI 信息收集向导（交互式对话）
let infoWizard = { step: 0, answers: {} };
const INFO_STEPS = [
  { key: 'gender', question: '你的性别是？', field: 'gender', hint: '男 / 女' },
  { key: 'age', question: '你的年龄？', field: 'age', hint: '比如 20 岁' },
  { key: 'height', question: '你的身高（cm）？', field: 'height', hint: '比如 175 cm' },
  { key: 'goal', question: '你的健身目标是什么？', field: 'goal', hint: '比如：增肌、减脂、塑形、提升力量' },
];

function startInfoWizard() {
  infoWizard = { step: 0, answers: {} };
  showInfoWizardDialog();
}

function showInfoWizardDialog() {
  const step = INFO_STEPS[infoWizard.step];
  // 移除旧弹窗
  const old = document.getElementById('info-wizard-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'info-wizard-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:var(--radius);padding:24px;max-width:340px;width:90%;animation:fadeUp .3s var(--ease-out);text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">🤖</div>
    <h3 style="margin-bottom:4px;">完善个人信息 (${infoWizard.step+1}/${INFO_STEPS.length})</h3>
    <p style="margin-bottom:16px;">${step.question}</p>
    <input type="text" class="form-input" id="info-wizard-input" placeholder="${step.hint}" autofocus onkeydown="if(event.key==='Enter')infoWizardNext()" style="text-align:center;font-size:18px;">
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('info-wizard-overlay').remove()" style="flex:1;">跳过</button>
      <button class="btn btn-accent btn-sm" onclick="infoWizardNext()" style="flex:1;">${infoWizard.step===INFO_STEPS.length-1?'完成':'下一步 →'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('info-wizard-input')?.focus(), 200);
}

function infoWizardNext() {
  const input = document.getElementById('info-wizard-input');
  const val = (input?.value || '').trim();
  const step = INFO_STEPS[infoWizard.step];

  if (step.field === 'age' || step.field === 'height') {
    const n = parseInt(val);
    if (!n || n < 1 || n > 300) { showToast('请输入有效数值', 'error'); return; }
    infoWizard.answers[step.field] = n;
  } else {
    infoWizard.answers[step.field] = val || step.hint;
  }

  infoWizard.step++;
  if (infoWizard.step >= INFO_STEPS.length) {
    infoWizardSave();
    return;
  }
  showInfoWizardDialog();
}

function infoWizardSave() {
  const s = getSettings();
  s.userInfo.gender = infoWizard.answers.gender || '';
  s.userInfo.age = infoWizard.answers.age || 0;
  s.userInfo.height = infoWizard.answers.height || 0;
  s.userInfo.goal = infoWizard.answers.goal || '';
  saveSettings(s);
  document.getElementById('info-wizard-overlay')?.remove();
  showToast('✅ 信息已完善', 'success');
  renderMePage();
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
    id: 'coach-log', icon: '📝', label: '教练日志',
    desc: () => {
      const log = getCoachLog();
      return log.length > 0 ? `${log.length} 篇周报 · 最近：${log[log.length-1].week}` : '复盘小结 · 周报回顾';
    },
    render: renderCoachLogModule,
  },
  {
    id: 'posture', icon: '🩻', label: '体态矫正',
    desc: () => {
      const p = getBodyProfile();
      return p ? `${p.postureTags.length||0}项标签 · 点击查看` : '自测评估 · 定制矫正';
    },
    render: renderPostureModule,
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
      if (!s.groups || s.type === 'warmup' || s.type === 'stretch') return;
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

// ── 教练日志 ──
function renderCoachLogModule(container) {
  const log = getCoachLog();
  let h = '';
  // 最近训练复盘
  const recentRecords = getRecords().filter(r => r.completed && r.aiSummary).slice(-5).reverse();
  if (recentRecords.length > 0) {
    h += '<div class="card mb-8"><div class="card-title">📊 最近复盘</div>';
    recentRecords.forEach(r => {
      h += `<div class="card-meta" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);"><b>${formatDate(r.date)} · ${getTrainingPlan(r.type).label}</b><br>${r.aiSummary.replace(/\n/g,'<br>')}</div>`;
    });
    h += '</div>';
  } else {
    h += '<div class="card mb-8"><div class="card-title">📊 最近复盘</div><div class="card-meta">暂无复盘记录<br>完成训练后点「📝 评分」即可生成</div></div>';
  }
  // 周报列表
  if (log.length > 0) {
    h += '<div class="card mb-8"><div class="card-title">📋 周报记录</div>';
    log.slice().reverse().forEach(l => {
      h += `<div class="card-meta" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);"><b>📅 ${l.week} 起</b><br>${l.summary.replace(/\n/g,'<br>')}</div>`;
    });
    h += '</div>';
  } else {
    h += '<div class="card mb-8"><div class="card-title">📋 周报记录</div><div class="card-meta">暂无周报<br>训练页标题栏点「📊 周报」生成</div></div>';
  }
  // 今日建议
  const bp = getBodyProfile();
  if (bp && bp.postureTags.length > 0) {
    h += `<div class="card"><div class="card-title">🎯 体态提醒</div><div class="card-meta">当前标签：${bp.postureTags.join('、')}<br>训练时注意相关动作选择和安全提示</div></div>`;
  }
  if (h === '') h = '<div class="empty-state"><span class="empty-icon">📝</span><p>暂无教练记录<br>完成训练并生成小结后这里会有内容</p></div>';
  container.innerHTML += h;
}

// ── AI 定制训练方案 ──
let coachMessages = [];
let coachLoading = false;
let coachProfile = {};
let coachPlanGenerated = null;
let pendingPlan = null; // 待确认的方案

const COACH_STEPS = [
  { key: 'experience', question: '你系统健身多久了？', options: ['纯新手(0-3个月)','入门级(3-6个月)','有一定基础(6个月-1年)','中级(1-2年)','老手(2年以上)'] },
  { key: 'days', question: '每周能稳定去健身房几天？', options: ['2天(比较少)','3天(标准三分化)','4天','5天','6天(几乎每天)'] },
  { key: 'split', question: '倾向哪种训练分化方式？', options: ['三分化(推/拉/腿)','五分化(胸背腿肩臂)','上下肢分化(上/下轮转)','由你根据情况推荐'] },
  { key: 'time', question: '每次训练实际能投入多长时间？', options: ['30分钟以内(紧凑高效)','45分钟左右','60分钟(标准时长)','75-90分钟(较充裕)','90分钟以上(很充裕)'] },
  { key: 'goal', question: '当前最核心的目标是什么？', options: ['增肌增维度(变大变壮)','减脂塑形(瘦下来显线条)','提升绝对力量(三大项突破)','体态矫正优先(改善圆肩驼背)','综合体能(全面发展)'] },
  { key: 'experience_detail', question: '你对三大项(深蹲/卧推/硬拉)的掌握程度？', options: ['还没练过三大项','刚开始学动作模式','能规范完成中等重量','接近或超过自重','远超自重(进阶选手)'] },
  { key: 'equipment', question: '你所在健身房器械条件如何？', options: ['商业健身房(器械很全)','社区健身房(基础器械够用)','家庭健身(哑铃+弹力带+引体架)','纯自重训练(无器械)'] },
  { key: 'like', question: '有没有特别喜欢的训练动作或风格？', options: ['喜欢自由重量(杠铃哑铃为主)','喜欢固定器械(安全稳定)','喜欢功能性训练(壶铃战绳)','都可以(均衡搭配)'] },
  { key: 'dislike', question: '有没有特别不想练或做不了的动作？', options: ['没有特别排斥的','不想练硬拉(腰部担心)','不想练深蹲(膝盖担心)','不想练杠铃卧推(肩膀担心)','跑步/有氧不想做'] },
  { key: 'focus', question: '最想优先强化哪个大肌群？', options: ['胸肌(饱满有形)','背部(宽度厚度)','肩部(宽肩衣架)','手臂(粗壮有力)','臀腿(下肢力量)','全身均衡发展'] },
  { key: 'weakness', question: '自我感觉哪个部位相对较弱？', options: ['上肢偏弱(推拉都不行)','下肢偏弱(腿细无力)','核心偏弱(腰腹不稳定)','后侧链偏弱(背+臀+腘绳)','比较均衡没有明显短板'] },
  { key: 'intensity', question: '训练时喜欢什么强度风格？', options: ['稳健保守(安全第一不冒险)','中等强度(常规力竭即可)','高强度(每组必须力竭)','灵活调整(看当天状态)'] },
  { key: 'issues', question: '有无体态问题或伤病需特别注意？', options: ['无特殊问题很健康','圆肩/溜肩/肱骨前移(上交叉)','肩峰撞击风险(肩膀弹响疼痛)','膝盖不适(弹响/酸痛)','下背容易不舒服','多种问题叠加比较复杂'] },
];

function renderAICoach(_unused) { const fc = document.getElementById('features-content');
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
      const isLast = i === coachMessages.length - 1;
      // 最新一条 AI 消息用打字机效果（空气泡，渲染后逐字填充）
      if (msg.role === 'ai' && isLast && !msg.skiptype) {
        h += `<div class="chat-msg ai"><div class="chat-bubble" id="coach-typing-bubble" style="min-height:1.5em;"></div></div>`;
      } else {
        h += `<div class="chat-msg ${msg.role}"><div class="chat-bubble">${msg.content.replace(/\n/g,'<br>')}</div></div>`;
      }
      // Show quick replies after last AI message
      if (msg.options && isLast && !coachLoading) {
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

  // 已有方案 → 显示重新定制按钮
  if (coachPlanGenerated) {
    h += '<button class="btn btn-accent mt-16" onclick="coachReset()">🔄 重新定制</button>';
  } else {
    // 自由输入 + 发送按钮
    h += '<div class="chat-input-row"><input class="chat-input" id="coach-input" placeholder="输入回答..." onkeydown="if(event.key===\'Enter\')coachSendFree()"><button class="chat-send-btn" id="coach-send" onclick="coachSendFree()">➤</button></div>';
  }
  h += '<div class="chat-status" id="coach-status"></div>';

  fc.innerHTML = h;
  const box = document.getElementById('coach-chat');
  if (box) box.scrollTop = box.scrollHeight;
  // 打字机效果：最新 AI 消息逐字显示
  const typingBubble = document.getElementById('coach-typing-bubble');
  const lastMsg = coachMessages[coachMessages.length - 1];
  if (typingBubble && lastMsg && lastMsg.role === 'ai' && !lastMsg.typed) {
    lastMsg.typed = true;
    const content = lastMsg.content;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= content.length) {
        typingBubble.innerHTML = content.slice(0, i).replace(/\n/g, '<br>');
        if (box) box.scrollTop = box.scrollHeight;
        i++;
      } else {
        clearInterval(timer);
      }
    }, 15);
  }
}

function coachReset() {
  coachMessages = [];
  coachProfile = {};
  coachPlanGenerated = null;
  pendingPlan = null;
  coachLoading = false;
  openFeatureModule('ai-coach');
}

function coachAnswer(answer) {
  if (answer === '✏️ 修改调整' && pendingPlan) {
    // 弹出输入框让用户描述想要的修改
    const note = prompt('想怎么调整这个方案？\n\n例如：\n- 把深蹲换成腿举\n- 增加一个腹部训练日\n- 减少胸肌动作，增加背部\n- 改成每周5天', '');
    if (!note || !note.trim()) return;
    coachMessages.push({ role: 'user', content: '修改要求：' + note.trim() });
    coachLoading = true;
    renderAICoach();
    // 在原有方案基础上追加修改要求重新生成
    const origPrompt = `原方案JSON：\n${JSON.stringify(pendingPlan, null, 2)}\n\n修改要求：${note.trim()}\n\n请根据修改要求调整方案，返回完整的新JSON。`;
    coachRegenerate(origPrompt);
    return;
  }
  if (answer === '💾 保存方案' && pendingPlan) {
    const plan = addPlan(pendingPlan);
    coachPlanGenerated = plan;
    pendingPlan = null;
    coachMessages.push({ role: 'ai', content: `✅ 方案"${plan.name}"已保存到方案库！可前往「方案库」设为当前方案`, options: ['🔄 重新定制'] });
    renderAICoach();
    return;
  }
  if (answer === '🗑️ 放弃' && pendingPlan) {
    pendingPlan = null;
    coachMessages.push({ role: 'ai', content: '已放弃该方案。你可以重新定制或退出。', options: ['🔄 重新定制'] });
    renderAICoach();
    return;
  }
  if (answer === '🔄 重试' || answer === '🔄 重新生成' || answer === '🔄 重新定制') {
    coachMessages = [];
    coachProfile = {};
    coachPlanGenerated = null;
    pendingPlan = null;
    coachLoading = false;
    renderAICoach();
    return;
  }
  coachMessages.push({ role: 'user', content: answer });
  const done = coachProcessStep(answer);
  if (done) {
    coachGeneratePlan();
  } else {
    renderAICoach();
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

async function coachRegenerate(customPrompt) {
  const status = document.getElementById('coach-status');
  if (status) status.textContent = '🧠 AI正在修改方案...';
  try {
    const resp = await aiFetch('/api/ask', {password:getAIPassword(),deviceId:getDeviceId(),content:customPrompt});
    const data = await resp.json();
    coachLoading = false;
    if (data.success) {
      let raw = data.answer.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const jsonMatch = raw.match(/\{[\s\S]*"name"[\s\S]*"days"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[0]);
          if (json.name && json.days && Array.isArray(json.days)) {
            pendingPlan = json;
            let resultText = '✅ 方案已更新：\n\n📋 ' + (json.type==='5day'?'五分化':'三分化') + ' · ' + json.days.length + '天训练\n';
            json.days.forEach(d => {
              resultText += '\n▸ ' + d.label;
              if(d.groups) d.groups.forEach(g => {
                if(g.exercises) g.exercises.forEach(ex => {
                  resultText += '\n  · ' + ex.name + '  ' + (ex.sets||'');
                });
              });
            });
            resultText += '\n\n──────────────';
            coachMessages.push({ role: 'ai', content: resultText, options: ['💾 保存方案', '✏️ 修改调整', '🗑️ 放弃', '🔄 重新生成'] });
            if(status) status.textContent = '修改完成，请选择';
            renderAICoach();
            return;
          }
        } catch(e) {}
      }
    }
    coachMessages.push({ role: 'ai', content: '⚠️ 修改失败，请重试', options: ['🔄 重新生成'] });
    if(status) status.textContent = '';
  } catch(e) {
    coachMessages.push({ role: 'ai', content: '⚠️ 无法连接AI服务', options: ['🔄 重试'] });
    if(status) status.textContent = '';
  }
  coachLoading = false;
  renderAICoach();
}

async function coachGeneratePlan() {
  coachLoading = true;
  renderAICoach(document.getElementById('features-content'));
  const status = document.getElementById('coach-status');
  if (status) status.textContent = '🧠 正在计算最优训练方案...';
  try {
    const ctx = buildContext(coachProfile);
    const plan = buildPlan(ctx);
    pendingPlan = plan;
    // 记录设备偏好（供训练页替换/新增动作做设备过滤）
    if (coachProfile && coachProfile.equipment) {
      const s2 = getSettings();
      s2.userInfo = s2.userInfo || {};
      s2.userInfo.equipment = coachProfile.equipment;
      saveSettings(s2);
    }
    coachLoading = false;
    let resultText = '✅ 方案已生成！\n\n📋 ' + (plan.type==='5day'?'五分化':'三分化') + ' · ' + plan.days.length + '天';
    // 制定依据
    if (plan.rationale) {
      resultText += '\n\n🧠 制定依据：';
      plan.rationale.forEach(r => { resultText += '\n• ' + r; });
    }
    if (plan.progressNote) resultText += '\n📈 ' + plan.progressNote;
    plan.days.forEach(d => {
      resultText += '\n\n▸ ' + d.label;
      const mainSections = (d.sections || []).filter(s => s.type === 'main' || !s.type);
      mainSections.forEach(s => {
        (s.groups || []).forEach(g => {
          if (g.exercises) g.exercises.slice(0, 3).forEach(ex => {
            resultText += '\n  · ' + ex.name + '  ' + (ex.sets||'');
          });
        });
      });
    });
    resultText += '\n\n──────────────';
    coachPlanGenerated = null;
    if (status) status.textContent = '本地引擎生成 · 100%动作匹配';
    const msgOpts = ['💾 保存方案', '✏️ 修改调整', '🗑️ 放弃', '🔄 重新生成'];
    coachMessages.push({ role: 'ai', content: resultText, options: msgOpts });
  } catch(e) {
    coachLoading = false;
    coachMessages.push({ role: 'ai', content: '⚠️ 方案生成失败：' + e.message, options: ['🔄 重试'] });
    if (status) status.textContent = '';
  }
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
  h += `<div style="display:flex;gap:6px;margin-bottom:8px;" id="ex-diff-filter">`;
  h += `<button class="chat-sugg-btn active" onclick="filterExTag(this,'difficulty','全部')">难度:全</button>`;
  ['初级','中级','高级'].forEach(d => { h += `<button class="chat-sugg-btn" onclick="filterExTag(this,'difficulty','${d}')">${d}</button>`; });
  h += `</div><div style="display:flex;gap:6px;margin-bottom:8px;" id="ex-type-filter">`;
  h += `<button class="chat-sugg-btn active" onclick="filterExTag(this,'type','全部')">类型:全</button>`;
  ['复合','孤立'].forEach(t => { h += `<button class="chat-sugg-btn" onclick="filterExTag(this,'type','${t}')">${t}</button>`; });
  h += `</div>`;
  h += `<button class="chat-sugg-btn" id="fav-filter" style="margin-left:auto;" onclick="toggleFavFilter(this)">⭐ 收藏</button></div>`;
  h += `<div id="ex-list" class="ex-list"></div>`;
  container.innerHTML += h;
  filterExercises();
}

// 收藏功能
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('fitness_favorites') || '[]'); }
  catch { return []; }
}
function saveFavorites(arr) { localStorage.setItem('fitness_favorites', JSON.stringify(arr)); }
function isFavorite(name) { return getFavorites().includes(name); }
function toggleFavorite(name) {
  const favs = getFavorites();
  const idx = favs.indexOf(name);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(name);
  saveFavorites(favs);
  filterExercises();
}

let exFilter = { search: '', region: '全部', difficulty: '全部', type: '全部', fav: false };
function toggleFavFilter(btn) {
  exFilter.fav = !exFilter.fav;
  btn.classList.toggle('active', exFilter.fav);
  filterExercises();
}
function filterByRegion(btn, r) {
  exFilter.region = r;
  document.querySelectorAll('#ex-region-filter .day-switch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterExercises();
}
function filterExTag(btn, key, val) {
  exFilter[key] = val;
  const gid = key === 'difficulty' ? 'ex-diff-filter' : 'ex-type-filter';
  document.querySelectorAll('#' + gid + ' .chat-sugg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterExercises();
}
function filterExercises() {
  const s = (document.getElementById('ex-search')?.value || '').toLowerCase();
  exFilter.search = s;
  const list = document.getElementById('ex-list');
  if (!list) return;
  let filtered = EXERCISE_DB;
  if (exFilter.fav) filtered = filtered.filter(e => isFavorite(e.name));
  if (exFilter.region !== '全部') filtered = filtered.filter(e => e.region.startsWith(exFilter.region));
  if (exFilter.difficulty !== '全部') filtered = filtered.filter(e => e.difficulty === exFilter.difficulty);
  if (exFilter.type !== '全部') filtered = filtered.filter(e => e.type === exFilter.type);
  if (s) filtered = fuzzySearchExercises(s, filtered); // 第16节：模糊搜索（拼音/容错/多关键词/相关性排序）
  if (filtered.length === 0) { list.innerHTML = '<p class="text-muted text-center mt-16">无匹配动作</p>'; return; }
  let h = `<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${filtered.length} 个动作${exFilter.fav?' · 已收藏':''}</div>`;
  filtered.forEach(e => {
    const parts = e.region.split('.');
    const ri = REGION_TREE[parts[0]];
    const fav = isFavorite(e.name);
    h += `<div class="card ex-card"><div class="flex-between"><div style="flex:1;"><span style="font-size:12px;color:${ri?.color||'var(--accent)'};">${ri?.icon||''} ${e.region}</span><div class="card-title" style="font-size:14px;margin-top:2px;">${e.name}</div><div class="card-meta">${e.equipment} · ${e.mechanics} · ${e.difficulty} · ${e.type} · ${e.posture} · ${e.focus}</div></div><button class="fav-star-btn" onclick="event.stopPropagation();var el=this;try{toggleFavorite('${e.name.replace(/'/g,"\\\\\\\\'")}');el.textContent=isFavorite('${e.name.replace(/'/g,"\\\\\\\\'")}')?'⭐':'☆';el.classList.add('pop');setTimeout(function(){el.classList.remove('pop')},500)}catch(e){}">${fav?'⭐':'☆'}</button></div></div>`;
  });
  list.innerHTML = h;
}

function addWeightFromFeatures() {
  const v = parseFloat(document.getElementById('w-val')?.value);
  if (!v || v < 20 || v > 300) { showToast('体重需在20-300kg范围内', 'error'); return; }
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
  h += `<input type="text" class="form-input mb-8" id="ai-server-input-s" value="${localStorage.getItem('fitness_ai_server')||(typeof window!=='undefined'&&window.Capacitor?'https://fathers-resistance-integral-valves.trycloudflare.com':'http://localhost:3000')}" onchange="saveAIConfigS()" placeholder="API地址">`;
  h += `<input type="text" class="form-input mb-8" id="ai-password-input-s" value="${localStorage.getItem('fitness_ai_password')||'gymflow2024'}" onchange="saveAIConfigS()" placeholder="密码">`;
  // Data
  h += `<h3 style="font-size:12px;color:var(--muted);margin-bottom:6px;">数据管理</h3><div style="display:flex;flex-direction:column;gap:8px;">`;
  h += `<button class="btn btn-outline btn-sm" onclick="exportData()">📤 导出数据</button><div style="font-size:10px;color:var(--muted);">↓ 保存到「下载」文件夹</div>`;
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
function exportData(){
  const j=exportAllData();
  const filename=`GymFlow-备份-${todayStr()}.json`;
  // 尝试下载，失败则复制到剪贴板
  const b=new Blob([j],{type:'application/json'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=u;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  // 备用：复制到剪贴板（APK/WebView 可能不支持下载）
  setTimeout(() => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(j).then(() => {
        showToast('📋 已复制到剪贴板（APK可能不支持直接下载，请粘贴保存）','success');
      }).catch(() => {});
    }
  }, 500);
  showToast('✅ 桌面端已下载 · APK端已复制到剪贴板\n📄 '+filename,'success');
}
function importData(){document.getElementById('import-file-input')?.click()}
function handleImportFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){if(importAllData(ev.target.result)){showToast('导入成功','success');renderMePage();renderTrainingPage()}else showToast('格式错误','error')};r.readAsText(f);e.target.value=''}
function resetData(){if(!confirm('确定删除所有数据？不可恢复！'))return;if(!confirm('再次确认'))return;resetAllData();const s=getSettings();s.lastWorkoutType=null;saveSettings(s);showToast('已重置','success');renderMePage();renderTrainingPage()}

// ── Toast ──
function showToast(msg,type='success'){const c=document.getElementById('toast');const t=document.createElement('div');t.className=`toast-item ${type}`;t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),2200)}

// ── PWA ──
function registerPWA(){if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(r=>console.log('SW registered'),()=>{})})}}

document.addEventListener('DOMContentLoaded', initApp);
