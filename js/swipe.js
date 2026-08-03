/* ============================================
   GymFlow — 左右滑屏切换主页面（移动端手势）
   左滑 → 下一个 tab（训练→AI→功能→我的）
   右滑 → 上一个 tab（我的→功能→AI→训练）
   复用 app.js 的 navigateTo(page)，纯前端手势模块
*/

// ==== 常量 ====
const PAGE_ORDER = ['training', 'ai', 'features', 'me'];
const SWIPE_THRESHOLD = 60;   // 任务要求：|deltaX| > 60px
const LOCK_MS = 300;          // 切换后防连滑锁

// ==== 初始化 ====
function initSwipeNavigation() {
  const app = document.getElementById('app');
  if (!app) return;
  // 正常加载顺序下 app.js 先执行、navigateTo 已定义；此处兜底防御
  if (typeof navigateTo !== 'function') return;

  let startX = 0, startY = 0, dragX = 0;
  let tracking = false, dragging = false;
  let ignored = false, swallowed = false;
  let lastLock = 0;

  // ① 弹层/模态打开 → true（plan-switcher / celebration 常驻 DOM，需叠加可见性判断）
  function isOverlayOpen() {
    return !!(
      document.getElementById('ai-coach-overlay') ||
      document.getElementById('ai-ask-overlay') ||
      document.getElementById('info-wizard-overlay') ||
      document.getElementById('card-menu-overlay') ||
      document.getElementById('ex-picker-overlay') ||
      document.getElementById('hist-add-sheet') ||
      (document.getElementById('plan-switcher') && !document.getElementById('plan-switcher').classList.contains('plan-switcher-hidden')) ||
      (document.getElementById('celebration') && !document.getElementById('celebration').classList.contains('celebration-hidden'))
    );
  }

  // ② 横向滚动区域内开始 → true（显式选择器 + 通用祖先扫描双保险）
  function isInsideHScroll(el) {
    if (el.closest('.day-switcher, .top-bar-inner')) return true;
    let n = el;
    while (n && n !== document.body) {
      if (n.scrollWidth > n.clientWidth + 2) {
        const o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
      n = n.parentElement;
    }
    return false;
  }

  // ③ 顶部导航栏防御（正常 target 在 #app 内，此处兜底）
  function isInTopBar(el) {
    return !!el.closest('#top-bar');
  }

  // 切换动作：完全复用现有导航，不改 tab 结构
  function doSwipe(dir) {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (idx < 0) return;
    const next = dir === 'next'
      ? PAGE_ORDER[(idx + 1) % PAGE_ORDER.length]
      : PAGE_ORDER[(idx - 1 + PAGE_ORDER.length) % PAGE_ORDER.length];
    navigateTo(next);
  }

  // 拖动视觉跟随（轻量）：加 swiping 类关闭过渡，设 transform 跟随
  function applySwipeVisual(dx) {
    app.classList.add('swiping');
    app.style.transform = 'translateX(' + Math.round(dx * 0.3) + 'px)';
  }
  // 松手/触发后清空视觉（松手时 transition 自动回弹吸附）
  function clearSwipeVisual() {
    app.style.transform = '';
    app.classList.remove('swiping');
  }

  // ==== touch 事件（passive，不干预原生竖向/横向滚动）====
  app.addEventListener('touchstart', function (e) {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    tracking = true; swallowed = false;
    // 防连滑锁：切换后 LOCK_MS 内新手势直接忽略
    if (lastLock && Date.now() - lastLock < LOCK_MS) { ignored = true; return; }
    if (isOverlayOpen()) { ignored = true; return; }
    const target = e.target;
    ignored = !!(target && target.closest && (isInsideHScroll(target) || isInTopBar(target) || isInsideCoachFab(target)));
  }, { passive: true });

  app.addEventListener('touchmove', function (e) {
    if (!tracking || ignored) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) <= Math.abs(dy) || swallowed) return;
    applySwipeVisual(dx);
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      doSwipe(dx < 0 ? 'next' : 'prev');
      swallowed = true; tracking = false;
      lastLock = Date.now();
      clearSwipeVisual();
    }
  }, { passive: true });

  app.addEventListener('touchend', function () {
    tracking = false;
    clearSwipeVisual();
  }, { passive: true });

  // ==== 鼠标拖拽（桌面可测）====
  app.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    // 非交互区域按下 preventDefault：阻止原生文本选择拖拽吞掉后续 mousemove（桌面滑屏可靠性）；
    // 交互元素（输入/按钮/链接等）不拦截，保留原生 focus/点击
    const mdTarget = e.target;
    if (mdTarget && mdTarget.closest && !mdTarget.closest('input, textarea, select, button, a, [contenteditable]')) {
      e.preventDefault();
    }
    startX = e.clientX; startY = e.clientY;
    dragX = 0; dragging = true; swallowed = false;
    if (lastLock && Date.now() - lastLock < LOCK_MS) { ignored = true; return; }
    if (isOverlayOpen()) { ignored = true; return; }
    const target = e.target;
    ignored = !!(target && target.closest && (isInsideHScroll(target) || isInTopBar(target) || isInsideCoachFab(target)));
  });

  window.addEventListener('mousemove', function (e) {
    if (!dragging || ignored) return;
    dragX = e.clientX - startX;
    const dy = e.clientY - startY;
    // 水平拖拽时阻止选中文本（passive:false）
    if (Math.abs(dragX) > Math.abs(dy) && Math.abs(dragX) > 8) {
      e.preventDefault();
    }
    if (Math.abs(dragX) <= Math.abs(dy) || swallowed) return;
    applySwipeVisual(dragX);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      doSwipe(dragX < 0 ? 'next' : 'prev');
      swallowed = true; dragging = false;
      lastLock = Date.now();
      clearSwipeVisual();
    }
  }, { passive: false });

  window.addEventListener('mouseup', function (e) {
    if (!dragging) return;
    dragging = false;
    clearSwipeVisual();
    // 拖拽超过阈值后拦截一次 click，防止残留 click 误触按钮（如 day-switch-btn）
    if (swallowed && e.target) {
      document.addEventListener('click', function once(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        document.removeEventListener('click', once, true);
      }, true);
    }
  });

  // 测试挂钩：供 E2E evaluate 断言判定函数
  window.__swipeHooks = { isOverlayOpen: isOverlayOpen, isInsideHScroll: isInsideHScroll, isInTopBar: isInTopBar, isInsideCoachFab: isInsideCoachFab };
}

// ==== AI 教练悬浮球拖拽（V2.2 轮C）：可拖动 + localStorage 记位置 ====
const COACH_DRAG_THRESHOLD = 30; // 位移超过此值判为拖动（< 滑屏阈值 60px，FAB 手势已从滑屏整体排除）
const COACH_EDGE_PAD = 8;        // 拖动/恢复时距视口边缘的最小边距

// 判定目标是否位于 AI 教练悬浮球内（供滑屏排除 + 测试断言复用）
function isInsideCoachFab(el) {
  return !!(el && el.closest && el.closest('.ai-coach-fab'));
}

// clamp 到视口内（边距 8px），返回 {x,y} 为 left/top
function clampCoachFab(fab, x, y) {
  const fabW = fab.offsetWidth || 52;
  const fabH = fab.offsetHeight || 52;
  const maxX = window.innerWidth - fabW - COACH_EDGE_PAD;
  const maxY = window.innerHeight - fabH - COACH_EDGE_PAD;
  return {
    x: Math.max(COACH_EDGE_PAD, Math.min(x, maxX)),
    y: Math.max(COACH_EDGE_PAD, Math.min(y, maxY))
  };
}

// 拖拽结束落盘：clamp 后写 localStorage.fitness_coach_pos
function saveCoachFabPos(fab) {
  try {
    const x = parseInt(fab.style.left || '0', 10) || 0;
    const y = parseInt(fab.style.top || '0', 10) || 0;
    const p = clampCoachFab(fab, x, y);
    localStorage.setItem('fitness_coach_pos', JSON.stringify({ x: Math.round(p.x), y: Math.round(p.y) }));
  } catch (e) { /* 存储不可用时静默，位置保留本次会话 */ }
}

// 拖拽后的残余 click 拦截（参照 swipe.js mouseup 的 once 写法；加超时兜底，防 touch 场景无 click 时误吞下一次点击）
function swallowCoachFabClick() {
  let used = false;
  function once(ev) {
    used = true;
    ev.stopPropagation();
    ev.preventDefault();
    document.removeEventListener('click', once, true);
  }
  document.addEventListener('click', once, true);
  setTimeout(function () {
    if (!used) document.removeEventListener('click', once, true);
  }, 300);
}

// 初始化 AI 教练悬浮球拖拽：恢复上次位置 + touch/mouse 拖拽状态机
function initCoachFabDrag(fab) {
  if (!fab || fab.__coachDragInit) return;
  fab.__coachDragInit = true;

  // 恢复上次位置（无/解析失败 → 保持 CSS 默认 right/bottom 定位）
  try {
    const saved = JSON.parse(localStorage.getItem('fitness_coach_pos') || 'null');
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number' &&
        isFinite(saved.x) && isFinite(saved.y)) {
      const p = clampCoachFab(fab, saved.x, saved.y);
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      fab.style.left = p.x + 'px';
      fab.style.top = p.y + 'px';
    }
  } catch (e) { /* 解析失败保持默认位 */ }

  let active = false;   // 本次输入是否从 FAB 上发起
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  let dragged = false;  // 位移超过阈值判为拖动

  function dragStart(cx, cy) {
    active = true;
    dragged = false;
    startX = cx; startY = cy;
    // 取当前真实像素位（FAB 可能仍处于 CSS 默认 right/bottom 定位，无 inline left/top）
    const rect = fab.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
  }

  function dragMove(cx, cy) {
    if (!active) return;
    const dx = cx - startX, dy = cy - startY;
    if (!dragged && (Math.abs(dx) > COACH_DRAG_THRESHOLD || Math.abs(dy) > COACH_DRAG_THRESHOLD)) {
      dragged = true;
      // 进入拖动态：切换为 left/top 定位，避免与 CSS 默认 right/bottom 冲突
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
    }
    if (dragged) {
      const p = clampCoachFab(fab, startLeft + dx, startTop + dy);
      fab.style.left = p.x + 'px';
      fab.style.top = p.y + 'px';
    }
  }

  function dragEnd() {
    active = false;
    if (dragged) {
      saveCoachFabPos(fab);
      swallowCoachFabClick();
    }
  }

  // touch 拖拽（passive:false，dragged 时 preventDefault 防页面滚动）
  fab.addEventListener('touchstart', function (e) {
    const t = e.touches[0];
    if (!t) return;
    dragStart(t.clientX, t.clientY);
  }, { passive: false });

  fab.addEventListener('touchmove', function (e) {
    if (!active) return;
    const t = e.touches[0];
    if (!t) return;
    dragMove(t.clientX, t.clientY);
    if (dragged) e.preventDefault();
  }, { passive: false });

  fab.addEventListener('touchend', function () {
    dragEnd();
  }, { passive: false });

  // mouse 拖拽（mousemove/mouseup 挂 window：拖拽中光标会离开 FAB，与 swipe.js 同款）
  fab.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    dragStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', function (e) {
    if (!active) return;
    dragMove(e.clientX, e.clientY);
    if (dragged) e.preventDefault(); // 防文本选中
  });

  window.addEventListener('mouseup', function () {
    dragEnd();
  });
}

document.addEventListener('DOMContentLoaded', initSwipeNavigation);
