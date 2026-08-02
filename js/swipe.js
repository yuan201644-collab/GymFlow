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
    ignored = !!(target && target.closest && (isInsideHScroll(target) || isInTopBar(target)));
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
    startX = e.clientX; startY = e.clientY;
    dragX = 0; dragging = true; swallowed = false;
    if (lastLock && Date.now() - lastLock < LOCK_MS) { ignored = true; return; }
    if (isOverlayOpen()) { ignored = true; return; }
    const target = e.target;
    ignored = !!(target && target.closest && (isInsideHScroll(target) || isInTopBar(target)));
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
  window.__swipeHooks = { isOverlayOpen: isOverlayOpen, isInsideHScroll: isInsideHScroll, isInTopBar: isInTopBar };
}

document.addEventListener('DOMContentLoaded', initSwipeNavigation);
