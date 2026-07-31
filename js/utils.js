/* ============================================
   工具函数
   ============================================ */

/**
 * 获取今天日期字符串 YYYY-MM-DD
 */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化日期为中文显示
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 格式化日期为 MM-DD
 */
function formatDateShort(dateStr) {
  const parts = dateStr.split('-');
  return `${parts[1]}-${parts[2]}`;
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * 获取某年某月的天数
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 获取某年某月第一天是星期几 (0=周日)
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * 获取星期几的中文（周一开头）
 */
function getDayOfWeekCN(dayIndex) {
  // dayIndex: 0=Sun, convert to Mon=0 ... Sun=6
  const adjusted = (dayIndex + 6) % 7;
  return ['一', '二', '三', '四', '五', '六', '日'][adjusted];
}

/**
 * 防止事件冒泡
 */
function stopPropagation(e) {
  if (e) e.stopPropagation();
}
