/* ============================================
   新手教程 — 首次启动/重置数据后显示
   ============================================ */

let tutorialStep = 0;

const TUTORIAL_SLIDES = [
  {
    emoji: '👋', title: '欢迎使用 GymFlow',
    text: 'AI 定制化健身追踪工具<br>三分化 · 五分化 · 全程记录',
  },
  {
    emoji: '🏋️', title: '训练页',
    text: '查看今日训练计划<br>勾选打卡 · 记录重量 · AI评分',
  },
  {
    emoji: '🤖', title: 'AI 顾问',
    text: 'GLM-4-Flash 免费模型<br>问训练 · 问饮食 · 问体态矫正',
  },
  {
    emoji: '📦', title: '功能页',
    text: '数据统计 · 体重追踪<br>动作库 · 方案库 · AI定制方案',
  },
  {
    emoji: '👤', title: '我的页',
    text: '完善信息 · 切换主题<br>AI服务配置 · 数据导出导入',
  },
  {
    emoji: '🔒', title: '数据安全',
    text: '所有数据仅存储在你设备本地<br>无需注册 · 无需网络<br>可随时导出备份',
  },
];

function showAppTutorial() {
  if (localStorage.getItem('app_tutorial_done')) return false;
  tutorialStep = 0;
  renderTutorialSlide();
  return true;
}

function renderTutorialSlide() {
  const s = TUTORIAL_SLIDES[tutorialStep];
  const last = tutorialStep === TUTORIAL_SLIDES.length - 1;

  // 创建遮罩
  let overlay = document.getElementById('tutorial-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;flex-direction:column;padding:32px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="text-align:center;max-width:340px;animation:fadeUp 0.3s var(--ease-out);">
      <div style="font-size:64px;margin-bottom:16px;">${s.emoji}</div>
      <h2 style="margin-bottom:8px;">${s.title}</h2>
      <p style="margin-bottom:24px;line-height:1.8;">${s.text}</p>
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:20px;">
        ${TUTORIAL_SLIDES.map((_, i) => `<div style="width:8px;height:8px;border-radius:50%;background:${i===tutorialStep?'var(--accent)':'var(--border)'};transition:background .2s;"></div>`).join('')}
      </div>
      <button class="btn btn-accent mb-8" onclick="nextTutorialSlide()">${last ? '🚀 开始使用' : '下一步 →'}</button>
      <button class="btn btn-outline btn-sm" onclick="skipTutorial()" style="width:auto;">跳过教程</button>
    </div>
  `;
}

function nextTutorialSlide() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_SLIDES.length) {
    dismissTutorial();
    return;
  }
  renderTutorialSlide();
}

function skipTutorial() {
  dismissTutorial();
}

function dismissTutorial() {
  localStorage.setItem('app_tutorial_done', '1');
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.remove();
}
