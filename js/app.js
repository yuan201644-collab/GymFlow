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
  h += `<input type="text" class="form-input mb-8" id="ai-pwd-me" value="${localStorage.getItem('fitness_ai_password')||'gymflow2024'}" onchange="saveAIMe()" placeholder="访问密码"></div>`;

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
