/* ============================================
   主入口 — 路由 / 导航 / PWA / Toast / 设置页
   ============================================ */

let currentPage = 'training';

// ========== 初始化 ==========

function initApp() {
  // 初始化主题
  initTheme();

  // 初始化默认设置
  const settings = getSettings();
  if (!settings.lastWorkoutType) {
    settings.lastWorkoutType = null;
    saveSettings(settings);
  }

  // 检测数据状态（在版本更新检查之前）
  const records = getRecords();
  const weights = getWeights();
  const hasData = records.length > 0 || weights.length > 0;
  const oldVersion = getStoredVersion();

  // 版本更新检测
  const isUpdate = checkVersionUpdate();

  if (isUpdate && hasData) {
    // 有数据的版本更新 → 数据自动保留
    setTimeout(() => {
      showToast('📦 已更新到 v' + APP_VERSION + '，数据完整保留 ✓', 'success');
    }, 500);
  } else if (!hasData && oldVersion === '0') {
    // 完全新安装，无旧数据 → 提示导入备份
    setTimeout(() => {
      showToast('🆕 首次使用？如有之前备份，请到「我的」→ 导入数据恢复', 'success');
    }, 800);
  } else if (!hasData && oldVersion !== '0') {
    // 版本更新但换了文件夹 → 数据丢失警告
    setTimeout(() => {
      showToast('⚠️ 检测到版本升级但数据未迁移 · 请到「我的」→ 导入数据恢复备份', 'error');
    }, 500);
  }

  // 渲染首页
  renderTrainingPage();
  renderSettingsPage();

  // 绑定导航事件
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      navigateTo(page);
    });
  });

  // 注册 PWA
  registerPWA();
}

// ========== 页面切换 ==========

function navigateTo(page) {
  if (currentPage === page) return;

  // 隐藏当前页
  const oldPage = document.getElementById(`page-${currentPage}`);
  if (oldPage) oldPage.classList.remove('active');

  // 显示新页面
  const newPage = document.getElementById(`page-${page}`);
  if (newPage) newPage.classList.add('active');

  // 更新导航按钮
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  currentPage = page;

  // 渲染页面内容
  switch (page) {
    case 'training':
      renderTrainingPage();
      break;
    case 'stats':
      renderStatsPage();
      break;
    case 'weight':
      renderWeightPage();
      break;
    case 'settings':
      renderSettingsPage();
      break;
  }

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 设置页 ==========

function renderSettingsPage() {
  const container = document.getElementById('settings-content');
  const settings = getSettings();
  const u = settings.userInfo;

  container.innerHTML = `
    <h1 class="section-title">👤 我的</h1>

    <!-- 用户信息（可编辑） -->
    <div class="settings-section">
      <h3>基本信息 <span style="font-size:11px;color:var(--text-muted);font-weight:400;">（点击修改）</span></h3>
      <div class="user-info-grid">
        <div class="user-info-item" onclick="editUserInfo('gender')">
          <div class="label">性别</div>
          <div class="value" id="info-gender">${u.gender}</div>
        </div>
        <div class="user-info-item" onclick="editUserInfo('age')">
          <div class="label">年龄</div>
          <div class="value" id="info-age">${u.age}<span style="font-size:14px;color:var(--text-muted);">岁</span></div>
        </div>
        <div class="user-info-item" onclick="editUserInfo('height')">
          <div class="label">身高</div>
          <div class="value" id="info-height">${u.height}<span style="font-size:14px;color:var(--text-muted);">cm</span></div>
        </div>
        <div class="user-info-item" onclick="editUserInfo('goal')">
          <div class="label">目标</div>
          <div class="value" id="info-goal" style="font-size:14px;">${u.goal || '减脂塑形'}</div>
        </div>
      </div>
    </div>

    <!-- 主题切换 -->
    <div class="settings-section">
      <h3>主题外观</h3>
      <div class="theme-switcher">
        <button class="theme-btn" data-theme="auto" id="theme-auto" onclick="setTheme('auto')">
          <span class="theme-icon">🔄</span>
          <span class="theme-label">跟随系统</span>
        </button>
        <button class="theme-btn" data-theme="light" id="theme-light" onclick="setTheme('light')">
          <span class="theme-icon">☀️</span>
          <span class="theme-label">浅色</span>
        </button>
        <button class="theme-btn" data-theme="dark" id="theme-dark" onclick="setTheme('dark')">
          <span class="theme-icon">🌙</span>
          <span class="theme-label">深色</span>
        </button>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="settings-actions">
        <button class="btn btn-outline" onclick="exportData()">📤 导出数据</button>
        <button class="btn btn-outline" onclick="importData()">📥 导入数据</button>
        <button class="btn btn-danger" onclick="resetData()">⚠️ 重置全部数据</button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="about-text">
        健身助手 v${APP_VERSION}<br>
        三分化训练追踪工具<br>
        所有数据仅存储在您的设备本地<br>
        <br>
        📌 <b>更新版本时</b>：先点「导出数据」备份 →<br>
        覆盖新文件（同一文件夹位置）→<br>
        数据自动保留；如有异常点「导入数据」恢复
      </div>
    </div>

    <input type="file" id="import-file-input" accept=".json" style="display:none;" onchange="handleImportFile(event)">
  `;

  // 同步主题按钮状态
  setTimeout(updateThemeButtons, 50);
}

// ========== 主题管理 ==========

function getTheme() {
  return localStorage.getItem('fitness_theme') || 'auto';
}

function applyTheme(theme) {
  localStorage.setItem('fitness_theme', theme);
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  updateThemeButtons();
}

function setTheme(theme) {
  applyTheme(theme);
  showToast(theme === 'auto' ? '已切换为跟随系统' : theme === 'light' ? '已切换为浅色模式' : '已切换为深色模式', 'success');
}

function updateThemeButtons() {
  const current = getTheme();
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === current);
  });
}

function initTheme() {
  applyTheme(getTheme());
  // 监听系统主题变化（自动模式下跟随切换）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'auto') {
      // 无需操作，CSS media query 自动处理
    }
  });
}

function editUserInfo(field) {
  const settings = getSettings();
  const u = settings.userInfo;
  const current = field === 'goal' ? (u.goal || '减脂塑形') : u[field];

  const prompts = {
    gender: { title: '修改性别', placeholder: '男 / 女', type: 'text' },
    age: { title: '修改年龄', placeholder: '20', type: 'number' },
    height: { title: '修改身高 (cm)', placeholder: '175', type: 'number' },
    goal: { title: '修改目标', placeholder: '减脂塑形，增肌增重...', type: 'text' },
  };

  const p = prompts[field];
  const input = prompt(p.title, current);
  if (input === null) return; // cancelled

  const value = p.type === 'number' ? parseInt(input) || current : input.trim() || current;
  if (field === 'goal') {
    u.goal = value;
  } else {
    u[field] = value;
  }

  saveSettings(settings);
  renderSettingsPage();
  showToast(`已更新${field === 'gender' ? '性别' : field === 'age' ? '年龄' : field === 'height' ? '身高' : '目标'}`, 'success');
}

function exportData() {
  const json = exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('数据已导出', 'success');
}

function importData() {
  document.getElementById('import-file-input').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const success = importAllData(e.target.result);
    if (success) {
      showToast('数据导入成功！', 'success');
      // 刷新所有页面
      renderSettingsPage();
      renderTrainingPage();
    } else {
      showToast('数据格式错误，导入失败', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetData() {
  if (!confirm('确定要删除所有数据吗？此操作不可恢复！')) return;
  if (!confirm('再次确认：所有训练记录、体重数据将被永久删除。')) return;

  resetAllData();
  showToast('所有数据已重置', 'success');

  // 重新初始化
  const settings = getSettings();
  settings.lastWorkoutType = null;
  saveSettings(settings);

  renderSettingsPage();
  renderTrainingPage();
}

// ========== Toast ==========

let toastTimer = null;

function showToast(message, type = 'success') {
  const container = document.getElementById('toast');
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // 2秒后自动移除
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 2200);
}

// ========== PWA ==========

function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(
        reg => console.log('SW registered:', reg.scope),
        err => console.log('SW registration failed:', err)
      );
    });
  }
}

// ========== 启动 ==========

document.addEventListener('DOMContentLoaded', initApp);
