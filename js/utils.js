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

// ══════════════════════════════════════
// 动作库模糊搜索（改进报告第16节）：拼音 / 容错 / 多关键词 / 相关性排序
// 依赖全局 SEARCH_INDEX / CHAR_PINYIN（search_index.js）与 EXERCISE_SYNONYMS（synonyms.js）
// ══════════════════════════════════════

// 文本转拼音（查静态表，零运行时计算）
function getPinyin(text) {
  let py = '';
  for (const ch of text) {
    py += (typeof CHAR_PINYIN !== 'undefined' && CHAR_PINYIN[ch]) ? CHAR_PINYIN[ch] : ch.toLowerCase();
  }
  return py;
}

// token 的别名集合 = {token} ∪ 同义词双向
function tokenAliases(token) {
  const set = new Set([token]);
  if (typeof EXERCISE_SYNONYMS !== 'undefined') {
    if (EXERCISE_SYNONYMS[token]) EXERCISE_SYNONYMS[token].forEach(a => set.add(a));
    for (const k in EXERCISE_SYNONYMS) if (EXERCISE_SYNONYMS[k].includes(token)) set.add(k);
  }
  return [...set];
}

// 单 token 对单个动作打分（分层：精确>前缀>子串>拼音>首字母>字段>容错）
function fuzzyScore(ex, token) {
  const name = ex.name || '';
  const idx = (typeof SEARCH_INDEX !== 'undefined' && SEARCH_INDEX[name]) || null;
  let best = 0;
  for (const raw of tokenAliases(token)) {
    const al = raw.toLowerCase();
    if (name === al) best = Math.max(best, 100);
    if (name.startsWith(al)) best = Math.max(best, 85);
    if (name.includes(al)) best = Math.max(best, 70);
    if (idx) {
      if (idx.py === al) best = Math.max(best, 100);
      if (idx.pyi === al) best = Math.max(best, 65);
      if (idx.py.startsWith(al)) best = Math.max(best, 60);
      if (idx.py.includes(al)) best = Math.max(best, 55);
      // 首字母子串（用户输入任意词的拼音首字母，如 wt→卧推）
      if (idx.pyi.startsWith(al) || idx.pyi.includes(al)) best = Math.max(best, 60);
    }
    const eq = (ex.equipment || '').toLowerCase();
    const region = (ex.region || '').toLowerCase();
    const mech = (ex.mechanics || '').toLowerCase();
    if (eq.includes(al)) best = Math.max(best, 45);
    if (region.includes(al)) best = Math.max(best, 45);
    if (mech.includes(al)) best = Math.max(best, 45);
    const type = (ex.type || '').toLowerCase();
    const focus = (ex.focus || '').toLowerCase();
    const diff = (ex.difficulty || '').toLowerCase();
    if (type.includes(al)) best = Math.max(best, 40);
    if (focus.includes(al)) best = Math.max(best, 40);
    if (diff.includes(al)) best = Math.max(best, 40);
    // 用户输入拼音直匹配（如 wotui → 卧推）
    if (idx) {
      const tpy = getPinyin(token).toLowerCase();
      if (tpy && tpy.length > 1 && (idx.py === tpy || idx.py.startsWith(tpy))) best = Math.max(best, 60);
    }
  }
  // 错别字容错：token 与名字某连续子串编辑距离 ≤1（单字符差异/增删，仅前几档都未命中时）
  if (best === 0 && token.length >= 2 && name.length >= 2) {
    const distLe1 = (a, b) => {
      if (Math.abs(a.length - b.length) > 1) return false;
      if (a === b) return true;
      if (a.length === b.length) {
        let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
        return d <= 1;
      }
      const [s, l] = a.length < b.length ? [a, b] : [b, a];
      let i = 0, j = 0, skip = 0;
      while (i < s.length && j < l.length) {
        if (s[i] === l[j]) { i++; j++; } else { skip++; if (skip > 1) return false; j++; }
      }
      return true;
    };
    let hit = false;
    for (let len = Math.max(2, token.length - 1); len <= token.length && !hit; len++) {
      for (let i = 0; i + len <= name.length && !hit; i++) {
        if (distLe1(token, name.substr(i, len))) hit = true;
      }
    }
    if (hit) best = 30;
  }
  return best;
}

// 多关键词 AND + 总分归一 + 排序；空查询返回原列表（保持筛选叠加）
function fuzzySearchExercises(query, list) {
  const tokens = (query || '').trim().toLowerCase().split(/[\s,，、]+/).filter(Boolean);
  if (tokens.length === 0) return list || [];
  const pool = list || (typeof EXERCISE_DB !== 'undefined' ? EXERCISE_DB : []);
  const results = [];
  const multi = tokens.length > 1;
  for (const ex of pool) {
    let sum = 0, ok = true;
    for (const t of tokens) {
      const sc = fuzzyScore(ex, t);
      // 多关键词 AND：每个 token 需非容错命中（错别字容错=30 分，不计入多词约束）；单 token 保留容错（握推→卧推）
      if (sc === 0 || (multi && sc < 40)) { ok = false; break; }
      sum += sc;
    }
    if (ok) results.push({ ex, score: sum / tokens.length });
  }
  results.sort((a, b) => b.score - a.score);
  return results.map(r => r.ex);
}
