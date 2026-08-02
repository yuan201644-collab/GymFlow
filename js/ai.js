/* ============================================
   AI 顾问 — 独立页面 · 消息动画
   ============================================ */

let aiMessages = [];
let aiLoading = false;


// ── 双线（改进报告 §18）：云端 Worker 24/7 为主 + 本地 localhost 回退（网页端） ──
const AI_ENDPOINTS = { cloud: 'https://ai.gym-flow.xyz', local: 'http://localhost:3000' };
function isWeb() { return !(typeof window !== 'undefined' && window.Capacitor); }
function getAIBase() {
  const saved = localStorage.getItem('fitness_ai_server');
  if (saved) return saved; // 我的页手动覆盖（始终优先）
  if (!isWeb()) return AI_ENDPOINTS.cloud; // APK 强制云端，除非手动覆盖（P2 防御：防残留 local 模式）
  const mode = localStorage.getItem('fitness_ai_mode') || 'cloud'; // 记忆上次可用
  return AI_ENDPOINTS[mode] || AI_ENDPOINTS.cloud;
}
// 失败自动切另一线重试一次（网页端才有 local 回退；APK 仅云端）
async function aiFetch(path, body) {
  const tryBase = (base) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try { return await tryBase(getAIBase()); }
  catch (e) {
    const cur = getAIBase();
    const other = cur === AI_ENDPOINTS.local ? AI_ENDPOINTS.cloud : (isWeb() ? AI_ENDPOINTS.local : AI_ENDPOINTS.cloud);
    localStorage.setItem('fitness_ai_mode', other === AI_ENDPOINTS.local ? 'local' : 'cloud');
    return await tryBase(other);
  }
}
function getAIPassword() { return localStorage.getItem('fitness_ai_password') || 'gymflow2024'; }
function getDeviceId() {
  let id = localStorage.getItem('fitness_device_id');
  if (!id) { id = 'web_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); localStorage.setItem('fitness_device_id', id); }
  return id;
}

// ===== 主页渲染 =====
// AI 新手教程（只显示一次）
function showAITutorial() {
  if (localStorage.getItem('ai_tutorial_done')) return;
  const fc = document.getElementById('ai-content');
  let h = '<div style="text-align:center;padding:20px;">';
  h += '<div style="margin-bottom:12px;"><span class="nav-ai nav-ai-lg">AI</span></div>';
  h += '<h2 style="margin-bottom:8px;">AI 健身顾问</h2>';
  h += '<p style="margin-bottom:16px;">基于智谱 GLM-4-Flash 免费模型</p>';
  h += '<div class="card" style="text-align:left;margin-bottom:10px;"><b>💡 我能帮你什么</b><br><span style="font-size:13px;color:var(--muted);">训练动作推荐 · 饮食建议 · 体态矫正 · 伤病注意事项 · 训练计划优化</span></div>';
  h += '<div class="card" style="text-align:left;margin-bottom:10px;"><b>⚙️ 需要配置</b><br><span style="font-size:13px;color:var(--muted);">去「我的 → AI服务」填入你的后端地址和密码。默认地址是临时隧道，可能已过期。</span></div>';
  h += '<div class="card" style="text-align:left;margin-bottom:16px;"><b>🔒 数据安全</b><br><span style="font-size:13px;color:var(--muted);">API密钥仅存电脑，手机端不暴露。每次对话不保存服务器。</span></div>';
  h += '<button class="btn btn-accent mb-8" onclick="dismissAITutorial()">知道了，开始使用</button>';
  h += '<button class="btn btn-outline btn-sm" onclick="skipAITutorial()" style="width:auto;">跳过教程</button>';
  h += '</div>';
  fc.innerHTML = h;
}

function dismissAITutorial() {
  localStorage.setItem('ai_tutorial_done', '1');
  renderAIPage();
}

function skipAITutorial() {
  localStorage.setItem('ai_tutorial_done', '1');
  renderAIPage();
}

function renderAIPage() {
  // 首次使用显示教程
  if (!localStorage.getItem('ai_tutorial_done') && aiMessages.length === 0) {
    showAITutorial();
    return;
  }

  const c = document.getElementById('ai-content');
  let h = '<div style="display:flex;flex-direction:column;height:calc(100dvh - 105px);">';
  h += '<div><h1 class="section-title" style="margin-bottom:2px;"><span class="nav-ai" style="margin-right:4px;">AI</span> 健身顾问</h1>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">GLM-4-Flash · 专注健身问答</div></div>';

  h += '<div class="chat-box" id="chat-box">';

  if (aiMessages.length === 0) {
    const allSuggestions = [
      '练胸日注意什么？','减脂晚餐吃什么？','圆肩怎么改善？','练腿推荐动作？',
      '深蹲膝盖疼怎么办？','减脂期蛋白质吃多少？','肩峰撞击怎么避免？',
      '背日必练动作有哪些？','新手三分化怎么安排？','有氧和无氧怎么搭配？',
      '瘦大腿最有效的动作？','增肌期一天吃几顿？','杠铃卧推标准动作要点',
      '如何判断训练过度？','手臂怎么练粗？','腘绳肌训练推荐',
      '练前吃什么比较好？','减脂不掉肌肉的方法','改善驼背的训练',
      '休息日应该做什么？','三分化和五分化哪个好？','女生练臀不粗腿',
      '体脂怎么估算？','大重量少次还是轻重量多次？','空腹训练好不好？',
    ];
    // 随机选 6 个
    const picks = allSuggestions.sort(() => Math.random() - 0.5).slice(0, 6);
    h += '<div class="chat-empty"><div class="chat-empty-icon">💬</div><p>问我任何健身相关问题</p>';
    h += '<div class="chat-sugg-scroll"><div class="chat-suggestions">';
    picks.forEach(q => { h += `<button class="chat-sugg-btn" onclick="askSuggestion('${q}')">${q}</button>`; });
    h += '</div></div></div>';
  } else {
    aiMessages.forEach((msg, i) => {
      h += '<div class="chat-msg ' + msg.role + '" style="animation:fadeUp .3s var(--ease-out) both;animation-delay:' + (i * 0.05) + 's;">';
      h += '<div class="chat-bubble">' + msg.content.replace(/\n/g, '<br>') + '</div></div>';
    });
  }

  if (aiLoading) {
    h += '<div class="chat-msg ai"><div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>';
  }

  h += '</div>'; // close chat-box
  h += '</div>'; // close flex wrapper

  h += '<div class="chat-input-row"><input type="text" class="chat-input" id="chat-input" placeholder="输入健身问题..." onkeydown="if(event.key===\'Enter\')sendAIMessage()" maxlength="500" autocomplete="off"><button class="chat-send-btn" id="chat-send-btn" onclick="sendAIMessage()"' + (aiLoading?' disabled':'') + '>➤</button></div>';
  h += '<div class="chat-status" id="chat-status">' + (aiMessages.length > 0 ? aiMessages.length + ' 条消息' : '') + '</div>';

  c.innerHTML = h;
  // 瞬间滚到底部（不用动画避免跳跃）
  const box = document.getElementById('chat-box');
  if (box) box.scrollTop = box.scrollHeight;
}

// ===== 快捷提问 =====
function askSuggestion(text) {
  const input = document.getElementById('chat-input');
  if (input) input.value = text;
  sendAIMessage();
}

// ===== 发送消息 =====
async function sendAIMessage() {
  const input = document.getElementById('chat-input');
  const text = (input?.value || '').trim();
  if (!text || aiLoading) return;

  input.value = '';

  // 先检测跳转意图（跳过AI调用，直接跳转）
  if (checkAIIntentAndNavigate(text)) return;

  aiMessages.push({ role: 'user', content: text });
  aiLoading = true;
  appendChatMessage('user', text);
  appendChatLoading();

  const statusEl = document.getElementById('chat-status');
  const thinkingTexts = ['分析中...', '整理健身知识...', '查阅训练方案...', '评估动作要点...'];
  const statusInterval = setInterval(() => {
    if (statusEl) statusEl.textContent = '🤔 ' + thinkingTexts[Math.floor(Math.random() * thinkingTexts.length)];
  }, 1500);

  try {
    const resp = await aiFetch('/api/ask', { password: getAIPassword(), deviceId: getDeviceId(), content: text });
    const data = await resp.json();

    clearInterval(statusInterval);
    removeChatLoading();
    if (data.success) {
      aiMessages.push({ role: 'ai', content: data.answer });
      appendChatMessage('ai', data.answer);
      if (statusEl) statusEl.textContent = '剩余 ' + (data.usage?.remaining || '?') + ' 次';
    } else {
      aiMessages.push({ role: 'ai', content: '⚠️ ' + data.error });
      appendChatMessage('ai', '⚠️ ' + data.error);
      if (statusEl) statusEl.textContent = '请求失败';
    }
  } catch (e) {
    clearInterval(statusInterval);
    removeChatLoading();
    aiMessages.push({ role: 'ai', content: '⚠️ 无法连接 AI 服务\n\n请确认：\n1. 电脑上已启动后端\n2. 已启动隧道\n3. AI服务地址正确' });
    appendChatMessage('ai', '⚠️ 无法连接 AI 服务');
    if (statusEl) statusEl.textContent = '连接失败';
  }

  aiLoading = false;
}

function appendChatMessage(role, content) {
  const box = document.getElementById('chat-box');
  if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="chat-msg ${role}" style="animation:fadeUp .25s var(--ease-out) both;"><div class="chat-bubble" id="typing-bubble"></div></div>`);
  box.scrollTop = box.scrollHeight;
  const bubble = document.getElementById('typing-bubble');
  // 打字机效果：按字符逐个显示，换行停顿稍长
  let i = 0;
  const interval = setInterval(() => {
    if (i <= content.length) {
      const shown = content.slice(0, i);
      bubble.innerHTML = escapeHtml(shown).replace(/\n/g, '<br>');
      box.scrollTop = box.scrollHeight;
      i++;
    } else {
      clearInterval(interval);
      bubble.id = '';
    }
  }, 20);
}

function appendChatLoading() {
  const box = document.getElementById('chat-box');
  if (!box) return;
  box.insertAdjacentHTML('beforeend', '<div class="chat-msg ai" id="chat-loading"><div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>');
  box.scrollTop = box.scrollHeight;
}

function removeChatLoading() {
  const el = document.getElementById('chat-loading');
  if (el) el.remove();
}

function checkAIIntentAndNavigate(userText) {
  const t = userText.toLowerCase();
  let target = null, label = '';
  // 更精确的关键词匹配（避免误触）
  if (t.includes('训练方案') || t.includes('定制训练') || t.includes('帮我制定') || t.includes('生成一个方案') || t.includes('设计一个计划')) {
    target = 'ai-coach'; label = 'AI训练方案';
  } else if (t.includes('数据统计') || t.includes('统计报告') || t.includes('训练数据') || t.includes('我的报告')) {
    target = 'stats'; label = '数据统计';
  } else if (t.includes('体重记录') || t.includes('体重追踪') || t.includes('bmi指数') || t.includes('我的体重')) {
    target = 'weight'; label = '体重追踪';
  } else if (t.includes('方案库') || t.includes('切换方案') || t.includes('我的方案')) {
    target = 'plans'; label = '方案库';
  } else if (t.includes('体态矫正') || t.includes('体态自测') || t.includes('体态评估') || (t.includes('圆肩') && t.length < 10) || (t.includes('溜肩') && t.length < 10)) {
    target = 'posture'; label = '体态矫正';
  }
  if (target) {
    showToast(`已识别意图，跳转到「${label}」`,'success');
    navigateTo('features');
    setTimeout(() => openFeatureModule(target), 200);
    return true;
  }
  return false;
}

// ===== 💡 训练页「问 AI」动作讲解（V2.0 阶段2，L1 点按调 AI）=====
const AI_ACTION_CACHE_KEY = 'fitness_ai_action_cache';
const AI_ACTION_CACHE_TTL = 7 * 24 * 3600 * 1000; // 7 天

function getAIActionCache() {
  try { return JSON.parse(localStorage.getItem(AI_ACTION_CACHE_KEY)) || {}; }
  catch { return {}; }
}
function setAIActionCache(key, answer) {
  const cache = getAIActionCache();
  cache[key] = { answer, ts: Date.now() };
  // 防无限膨胀：只留最新 20 条
  const keys = Object.keys(cache);
  if (keys.length > 20) {
    const sorted = keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
    sorted.slice(0, keys.length - 20).forEach(k => delete cache[k]);
  }
  try { localStorage.setItem(AI_ACTION_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}
// 缓存键：默认「讲解要点」沿用旧键 name（旧缓存继续有效）；自定义问题用 name##question，互不覆盖
function actionCacheKey(name, question) {
  const q = (question || '').trim();
  return q && q !== '讲解要点' ? name + '##' + q : name;
}
// AI 回复 → 安全 HTML（escapeHtml 转义 + 换行→<br>，复用审计 P2-1 范式）
function aiAnswerHtml(answer) {
  return escapeHtml(answer).replace(/\n/g, '<br>');
}

// 构建动作讲解 prompt（纯函数，可单测）
// action: {name, tip, sets, equipment}
// ctx: {equipment, records, bodyProfile, issues, todayRecord}
// question: 自由输入问题（V2.1 轮C）；空/「讲解要点」走默认讲解语
function buildTrainingPrompt(action, ctx, question) {
  const name = action.name || '';
  const db = (ctx && ctx.db) || (typeof EXERCISE_DB !== 'undefined' ? EXERCISE_DB : []);
  const dbEx = matchDbExercise(name); // 复用 utils.js：精确 → 全半角归一 → 模糊
  const tip = action.tip || (dbEx && dbEx.mechanics) || '';
  const equipment = (ctx && ctx.equipment) || action.equipment || (dbEx && dbEx.equipment) || '';
  const difficulty = (dbEx && dbEx.difficulty) || '';

  // 历史：该动作最近一条已完成记录（重量/次数，有则带）
  const records = (ctx && ctx.records) || [];
  let historyText = '';
  const done = records.filter(r => r && r.completed && r.exercises && r.exercises.some(e => e.name === name));
  if (done.length) {
    const lastRec = done[done.length - 1];
    const lastEx = lastRec.exercises.find(e => e.name === name);
    if (lastEx && (lastEx.weight || lastEx.reps)) {
      historyText = '最近 ' + lastRec.date + ' ' + (lastEx.weight || '?') + 'kg × ' + (lastEx.reps || '?') + '次';
    }
  }

  // 今日完成度（可选）
  const todayRec = (ctx && ctx.todayRecord) || null;
  let todayText = '';
  if (todayRec && todayRec.exercises) {
    const todayEx = todayRec.exercises.find(e => e.name === name);
    if (todayEx) todayText = '今日已完成' + (todayEx.completed ? '✅' : '⏳进行中');
  }

  // 体态画像 / 伤病（用户有则带）
  const bp = (ctx && ctx.bodyProfile) || null;
  const postureTags = (bp && bp.postureTags) || [];
  const issues = (ctx && ctx.issues) || '';

  // V2.1 轮C：有具体问题走「用户问题」分支；默认/「讲解要点」维持阶段2讲解语。
  // 提问分支首行带动作名，满足验证点「prompt 含动作名与用户问题」。
  const q = (question || '').trim();
  const askLine = (q && q !== '讲解要点')
    ? '用户问题：' + q + '\n动作「' + name + '」。请结合我的训练情况/历史/体态，用100-150字简洁回答（手机阅读）。'
    : '请用100-150字讲解动作「' + name + '」的动作要领，并结合我的情况给1条针对性建议（手机阅读，简洁口语化）。';

  const lines = [
    askLine,
    '动作要点：' + (tip || '保持标准姿势，感受目标肌群发力'),
    equipment ? '器械：' + equipment : null,
    difficulty ? '难度：' + difficulty : null,
    historyText ? '我的历史：' + historyText : null,
    todayText,
    postureTags.length ? '体态问题：' + postureTags.join('、') : null,
    issues ? '需注意：' + issues : null,
    '要求：先给动作要领，再给1条针对我的建议；总字数100-150字。',
  ].filter(Boolean);

  return lines.join('\n');
}

// ===== 💡 训练页「问 AI」自由输入弹层（V2.1 轮C，L1 点按调 AI）=====
// 模块级问询上下文：暂存当前弹层的动作与问题，供重试复用（不拼用户输入进 onclick，防引号注入）
let _aiAskCtx = null;

// 打开动作问询弹层（💡 / 卡内「🤖 问 AI」统一入口）
function openAIActionAsk(uid, name, tip) {
  closeAIActionAsk();
  _aiAskCtx = { uid: uid, name: name, tip: tip || '', question: '' };
  const overlay = document.createElement('div');
  overlay.id = 'ai-ask-overlay';
  overlay.innerHTML =
    '<div class="ai-ask-backdrop overlay-fade" onclick="closeAIActionAsk()"></div>' +
    '<div class="ai-ask-sheet sheet-fadeUp">' +
      '<div class="ai-ask-header">' +
        '<span class="ai-ask-title">💡 ' + escapeHtml(name) + '</span>' +
        '<button class="ai-ask-close" onclick="closeAIActionAsk()" aria-label="关闭">✕</button>' +
      '</div>' +
      '<div class="ai-ask-quicks">' +
        '<button class="ai-ask-quick" data-q="讲解要点" onclick="quickAIActionAsk(\'讲解要点\')">讲解要点</button>' +
        '<button class="ai-ask-quick" data-q="建议重量" onclick="quickAIActionAsk(\'建议重量\')">建议重量</button>' +
      '</div>' +
      '<div class="ai-ask-input-row">' +
        '<input id="ai-ask-input" maxlength="200" placeholder="输入你想问的问题…" autocomplete="off" onkeydown="if(event.key===\'Enter\')sendAIActionAsk()">' +
        '<button id="ai-ask-send" onclick="sendAIActionAsk()">发送</button>' +
      '</div>' +
      '<div class="ai-ask-result" id="ai-ask-result"></div>' +
    '</div>';
  document.getElementById('app').appendChild(overlay);
  setTimeout(() => { const input = document.getElementById('ai-ask-input'); if (input) input.focus(); }, 150);
}

function closeAIActionAsk() {
  const overlay = document.getElementById('ai-ask-overlay');
  if (overlay) overlay.remove();
  _aiAskCtx = null;
}

// 输入框发送：空输入提示不调 AI；非空写入 ctx 后请求
function sendAIActionAsk() {
  const input = document.getElementById('ai-ask-input');
  const q = (input && input.value ? input.value : '').trim();
  if (!q) { showToast('先输入问题'); if (input) input.focus(); return; }
  if (!_aiAskCtx) return;
  _aiAskCtx.question = q;
  askActionAIFree();
}

// 快捷问法 chips：填输入框 + 写入 ctx + 直接请求
function quickAIActionAsk(q) {
  const input = document.getElementById('ai-ask-input');
  if (input) input.value = q;
  if (!_aiAskCtx) return;
  _aiAskCtx.question = q;
  askActionAIFree();
}

async function askActionAIFree() {
  if (!_aiAskCtx) return;
  const resultEl = document.getElementById('ai-ask-result');
  if (!resultEl || resultEl.dataset.loading === '1') return; // 防连点
  const name = _aiAskCtx.name, tip = _aiAskCtx.tip, question = _aiAskCtx.question;
  const key = actionCacheKey(name, question);
  // 缓存命中 → 直接展示
  const cached = getAIActionCache()[key];
  if (cached && Date.now() - (cached.ts || 0) < AI_ACTION_CACHE_TTL) {
    resultEl.innerHTML = aiAnswerHtml(cached.answer);
    return;
  }
  resultEl.dataset.loading = '1';
  resultEl.innerHTML = '<div class="advice-ai-loading">🤖 AI 分析中<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';

  // 组装 ctx（读当前数据，供 prompt）
  const s = (typeof getSettings === 'function') ? getSettings() : {};
  const ctx = {
    equipment: (s.userInfo || {}).equipment || '',
    records: (typeof getRecords === 'function') ? getRecords() : [],
    todayRecord: (typeof getTodayRecord === 'function') ? getTodayRecord() : null,
    bodyProfile: (typeof getBodyProfile === 'function') ? getBodyProfile() : null,
    issues: (s.userInfo || {}).issues || '',
  };
  const prompt = buildTrainingPrompt({ name: name, tip: tip }, ctx, question);

  try {
    const resp = await aiFetch('/api/ask', { password: getAIPassword(), deviceId: getDeviceId(), content: prompt });
    const data = await resp.json();
    delete resultEl.dataset.loading;
    if (data.success) {
      setAIActionCache(key, data.answer);
      resultEl.innerHTML = aiAnswerHtml(data.answer);
    } else {
      resultEl.innerHTML = '<div class="advice-ai-err">⚠️ ' + escapeHtml(data.error || '请求失败') + '</div>'
        + '<button class="advice-ai-retry" onclick="retryAIActionAsk()">🔄 重试</button>';
    }
  } catch (e) {
    delete resultEl.dataset.loading;
    resultEl.innerHTML = '<div class="advice-ai-err">⚠️ 无法连接 AI 服务，请确认后端已启动</div>'
      + '<button class="advice-ai-retry" onclick="retryAIActionAsk()">🔄 重试</button>';
  }
}

function retryAIActionAsk() {
  askActionAIFree();
}

// ===== 🤖 训练页 AI 教练浮层（V2.0 阶段3，上下文感知对话）=====
// 注：方案文档里浮层消息数组叫 coachMessages，但该名已被 app.js 的「AI训练方案」占用，
// 全局 let 重复声明会 SyntaxError，故这里改用 aiCoachMessages / aiCoachLoading。
let aiCoachMessages = [];
let aiCoachLoading = false;
let aiCoachPendingContent = ''; // 失败重试复用同一 content

// 组装当前训练上下文（纯函数，可单测）
// opts 可注入 {plan, record, records, bodyProfile, settings}，缺省时容错读全局函数
function buildCoachContext(opts) {
  opts = opts || {};
  const record = opts.record !== undefined ? opts.record : (typeof getTodayRecord === 'function' ? getTodayRecord() : null);
  const plan = opts.plan !== undefined ? opts.plan : (record && typeof getTrainingPlan === 'function' ? getTrainingPlan(record.type) : null);
  const records = opts.records !== undefined ? opts.records : (typeof getRecords === 'function' ? getRecords() : []);
  const bp = opts.bodyProfile !== undefined ? opts.bodyProfile : (typeof getBodyProfile === 'function' ? getBodyProfile() : null);
  const settings = opts.settings !== undefined ? opts.settings : (typeof getSettings === 'function' ? getSettings() : {});
  const activePlanId = opts.activePlanId !== undefined ? opts.activePlanId : (typeof getActivePlanId === 'function' ? getActivePlanId() : 'default');

  const lines = [];
  const groups = plan ? (typeof getAllGroups === 'function' ? getAllGroups(plan) : localPlanGroups(plan)) : [];

  // 【当前训练】
  if (record && plan) {
    let cur = '【当前训练】方案：' + (activePlanId === 'default' ? '默认三分化' : (plan.subtitle || '自定义方案'));
    cur += ' ｜ 今日：' + (record.type === 'rest' ? '休息日' : plan.label + (plan.subtitle ? '（' + plan.subtitle + '）' : ''));
    if (typeof record.type === 'string' && record.type.indexOf('custom_') === 0) {
      const dayIdx = parseInt(record.type.replace('custom_', ''), 10);
      if (!isNaN(dayIdx)) cur += ' ｜ 第' + (dayIdx + 1) + '个训练日';
    }
    lines.push(cur);
  }

  if (record && plan && record.type !== 'rest') {
    // 完成度（复用阶段1口径 isGroupCompleted；vm 单测环境无 training.js 时容错自算）
    const groupDone = (typeof isGroupCompleted === 'function') ? isGroupCompleted : localGroupCompleted;
    let doneCount = 0;
    groups.forEach(g => { if (groupDone(g, record)) doneCount++; });
    if (groups.length) lines.push('完成度：' + doneCount + '/' + groups.length + ' 部位已完成');

    // 今日已完成/未完成：遍历 record.exercises，每组只列当前选中动作（去重）
    const currentSel = {};
    groups.forEach(g => {
      const gexs = g.exercises || [];
      if (gexs.length === 0) return;
      let sel = record.groupSelections && record.groupSelections[g.id];
      const isCustomSel = sel && (record.exercises || []).some(e => e.name === sel && e.groupId === g.id && e.custom);
      const isInPlan = sel && gexs.some(e => e.name === sel);
      if (!(isCustomSel || isInPlan)) sel = (gexs.find(e => e.default) || gexs[0]).name;
      currentSel[g.id] = sel;
    });
    const selNames = Object.keys(currentSel).map(k => currentSel[k]);
    const doneNames = [], todoNames = [];
    const seen = {};
    (record.exercises || []).forEach(e => {
      if (!e || !e.name || seen[e.name]) return;
      const inSel = (e.groupId != null && currentSel[e.groupId] === e.name) || selNames.indexOf(e.name) !== -1;
      if (!inSel) return;
      seen[e.name] = 1;
      if (e.skipped) return;
      if (e.completed) doneNames.push(e.name); else todoNames.push(e.name);
    });
    if (doneNames.length) lines.push('今日已完成：' + doneNames.map(n => n + '✅').join('、'));
    if (todoNames.length) lines.push('今日未完成：' + todoNames.join('、'));
  }

  // 【动作历史】主组动作最近一条（重量/次数）
  const histLines = coachHistoryLines(plan, records);
  if (histLines.length) {
    lines.push('【动作历史】');
    histLines.forEach(l => lines.push(l));
  }

  // 【我的情况】体态 / 伤病
  const postureTags = (bp && Array.isArray(bp.postureTags)) ? bp.postureTags : [];
  const issues = (settings.userInfo && settings.userInfo.issues) || '';
  if (postureTags.length || issues) {
    let me = '【我的情况】';
    if (postureTags.length) me += '体态：' + postureTags.join('、');
    if (postureTags.length && issues) me += ' ｜ ';
    if (issues) me += '伤病：' + issues;
    lines.push(me);
  }

  return lines.filter(l => l && String(l).trim()).join('\n');
}

// ===== 🏋️ 选择器「AI 描述 → 替换动作」（V2.0 阶段4，纯函数可单测）=====
// 构建 prompt：用户描述 + 训练场景 + 候选池（前 20 个），约束 AI 只从池内选
function buildPickerAIPrompt(desc, ctx, cands) {
  ctx = ctx || {};
  const pool = Array.isArray(cands) ? cands : [];
  const descText = String(desc == null ? '' : desc).trim() || '（空）';
  const lines = [
    '你是健身动作选择助手。用户想用自然语言描述需求，你从下方候选动作中推荐 1-3 个最合适的。',
    '【用户描述】' + descText,
  ];
  const scene = [];
  if (ctx.region) scene.push('部位：' + ctx.region);
  if (ctx.phase) scene.push('阶段：' + ctx.phase);
  if (ctx.eqPref) scene.push('器械条件：' + ctx.eqPref);
  if (scene.length) lines.push('【训练场景】' + scene.join(' ｜ '));
  const names = pool.slice(0, 20).map((ex, i) => (i + 1) + '. ' + ((ex && ex.name) || '')).filter(l => l.trim());
  if (names.length) {
    lines.push('【候选动作】');
    names.forEach(l => lines.push(l));
  }
  lines.push('要求：只从候选动作中选，输出动作名，每行一个，不要编号、不要解释、不要推荐候选之外的任何动作。');
  return lines.join('\n');
}

// 解析 AI 推荐回复 → 候选池内的动作名数组（安全核心：任何池外名字一律进不来）
function parsePickerAINames(text, cands) {
  const pool = Array.isArray(cands) ? cands : [];
  if (text == null || pool.length === 0) return [];
  const result = [];
  const pushName = (name) => {
    if (!name || result.length >= 3 || result.indexOf(name) !== -1) return;
    result.push(name);
  };
  const raw = String(text).trim();
  const normL = (s) => normalizeParens(String(s == null ? '' : s)).trim().toLowerCase();

  // 1. JSON：去掉 ```json ``` 代码块后，按数组或 {names:[...]} 解析
  let jsonArr = null;
  const blockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonCandidate = blockMatch ? blockMatch[1] : raw;
  if (jsonCandidate.trim().charAt(0) === '[') {
    try {
      const arr = JSON.parse(jsonCandidate.trim());
      if (Array.isArray(arr)) jsonArr = arr.filter(x => typeof x === 'string' && x.trim());
    } catch (e) { jsonArr = null; }
  } else {
    try {
      const obj = JSON.parse(jsonCandidate.trim());
      if (obj && Array.isArray(obj.names)) jsonArr = obj.names.filter(x => typeof x === 'string' && x.trim());
    } catch (e) { jsonArr = null; }
  }

  // 2. 子串扫描（最长优先）：回复含某候选名即采纳，天然只在池内
  const normText = normL(raw);
  const byLen = pool.slice().sort((a, b) => normL(b.name).length - normL(a.name).length);
  for (const ex of byLen) {
    if (result.length >= 3) break;
    const n = normL(ex.name);
    if (!n || !normText.includes(n)) continue;
    if (result.some(r => normL(r).includes(n))) continue; // 已采纳更长名已涵盖，跳过子串名
    pushName(ex.name);
  }

  // 3. 兜底：子串扫描 0 命中时，用 JSON 数组或按分隔符切 token 做池内精确/归一/模糊匹配
  if (result.length === 0) {
    const tokens = jsonArr || raw.split(/[\n\r;；，,、。]+/).filter(Boolean);
    for (const tok of tokens) {
      if (result.length >= 3) break;
      const cleaned = stripPickerToken(tok);
      if (!cleaned) continue;
      const exact = pool.find(p => normL(p.name) === normL(cleaned));
      if (exact) { pushName(exact.name); continue; }
      const fuzzy = fuzzySearchExercises(cleaned, pool);
      if (fuzzy[0]) pushName(fuzzy[0].name);
    }
  }

  return result;
}

// 剥离编号/圆点/末尾括号注释，用于兜底 token 的池内匹配
function stripPickerToken(tok) {
  let t = String(tok == null ? '' : tok).trim();
  t = normalizeParens(t);
  t = t.replace(/^[\s\-•·*]*(?:\d+)?[\.、)）．]?\s*/, '');
  t = t.replace(/[\s]*[（(][^()（）]*[)）][\s]*$/, '');
  return t.trim();
}

// vm 单测环境（仅加载 exercises+utils+ai）无 getAllGroups 时的容错实现
function localPlanGroups(plan) {
  if (!plan) return [];
  if (Array.isArray(plan.sections)) {
    const gs = [];
    plan.sections.forEach(s => { if (s.groups) s.groups.forEach(g => gs.push(g)); });
    return gs;
  }
  if (Array.isArray(plan.groups)) return plan.groups;
  return [];
}

// 与 training.js isGroupCompleted 同口径；容错无 groupId 的注入记录（单测）
function localGroupCompleted(group, record) {
  const gexs = group.exercises || [];
  const customExs = (record.exercises || []).filter(e => e.groupId === group.id && e.custom && !gexs.some(x => x.name === e.name));
  const exs = gexs.concat(customExs);
  if (exs.length === 0) return false;
  const recEx = (name, gid) => {
    const all = record.exercises || [];
    const hit = all.find(e => e.name === name && e.groupId === gid);
    if (hit) return hit;
    return all.find(e => e.name === name && (e.groupId === undefined || e.groupId === null || e.groupId === ''));
  };
  const skipped = exs.filter(ex => { const r = recEx(ex.name, group.id); return r && r.skipped; }).length;
  if (skipped >= exs.length) return false;
  const completed = exs.filter(ex => { const r = recEx(ex.name, group.id); return r && r.completed; }).length;
  const active = exs.length - skipped;
  let threshold = 1;
  if (group.pickHint) {
    const rangeMatch = group.pickHint.match(/(\d+)选(\d+)-(\d+)/);
    if (rangeMatch) threshold = parseInt(rangeMatch[2], 10);
    else {
      const singleMatch = group.pickHint.match(/(\d+)选(\d+)/);
      if (singleMatch) threshold = parseInt(singleMatch[2], 10);
    }
  }
  return completed >= Math.min(threshold, active);
}

// 主组动作的历史行：每动作取最近一条有重量/次数的已完成记录
function coachHistoryLines(plan, records) {
  if (!Array.isArray(records)) return [];
  const names = [];
  const seenNames = {};
  const mainSections = (plan && plan.sections)
    ? plan.sections.filter(s => !s.type || s.type === 'main')
    : (plan && Array.isArray(plan.groups) ? [{ groups: plan.groups }] : []);
  mainSections.forEach(s => (s.groups || []).forEach(g => (g.exercises || []).forEach(ex => {
    if (ex && ex.name && !seenNames[ex.name]) { seenNames[ex.name] = 1; names.push(ex.name); }
  })));
  if (names.length === 0) return [];
  const sorted = records.filter(r => r && r.completed && Array.isArray(r.exercises)).slice()
    .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
  const lines = [];
  names.forEach(name => {
    let lastEx = null, lastDate = '';
    for (let i = sorted.length - 1; i >= 0; i--) {
      const r = sorted[i];
      const ex = r.exercises.find(e => e && e.name === name);
      if (ex && (ex.weight || ex.reps)) { lastEx = ex; lastDate = r.date || ''; break; }
    }
    if (lastEx) {
      let wt = '';
      if (lastEx.weight) wt += lastEx.weight + 'kg';
      if (lastEx.reps) wt += '×' + lastEx.reps + '次';
      if (wt) lines.push(name + '：' + lastDate + ' ' + wt);
    }
  });
  return lines;
}

// ── 浮层开关与交互 ──
function openAICoach() {
  const existing = document.getElementById('ai-coach-overlay');
  if (existing) { renderCoachChat(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'ai-coach-overlay';
  overlay.className = 'coach-overlay';
  overlay.innerHTML =
    '<div class="coach-backdrop" onclick="closeAICoach()"></div>' +
    '<div class="coach-sheet sheet-fadeUp">' +
      '<div class="coach-header"><span class="coach-title">🤖 AI 教练</span><button class="coach-close" onclick="closeAICoach()" aria-label="关闭">✕</button></div>' +
      '<div class="chat-box" id="coach-chat-box"></div>' +
      '<div class="chat-input-row">' +
        '<input type="text" class="chat-input" id="coach-input" placeholder="问问 AI 教练..." maxlength="300" autocomplete="off" onkeydown="if(event.key===\'Enter\')sendCoachMessage()">' +
        '<button class="chat-send-btn" id="coach-send-btn" onclick="sendCoachMessage()">➤</button>' +
      '</div>' +
    '</div>';
  document.getElementById('app').appendChild(overlay);
  if (aiCoachMessages.length === 0) {
    aiCoachMessages.push({ role: 'ai', content: '嗨！我是你的 AI 教练 🤖\n我能看到你当前的训练方案、完成度和历史记录。有什么想问的？' });
  }
  renderCoachChat();
  setTimeout(() => { const input = document.getElementById('coach-input'); if (input) input.focus(); }, 200);
}

function closeAICoach() {
  const overlay = document.getElementById('ai-coach-overlay');
  if (overlay) overlay.remove();
}

function renderCoachChat() {
  const box = document.getElementById('coach-chat-box');
  if (!box) return;
  let h = '';
  aiCoachMessages.forEach(msg => {
    const roleCls = msg.role === 'user' ? 'user' : 'ai';
    h += '<div class="chat-msg ' + roleCls + '"><div class="chat-bubble">' + aiAnswerHtml(msg.content) +
      (msg.role === 'ai-error' ? '<br><button class="coach-retry-btn" onclick="retryCoachMessage()">🔄 重试</button>' : '') +
      '</div></div>';
  });
  if (aiCoachLoading) {
    h += '<div class="chat-msg ai"><div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>';
  }
  box.innerHTML = h;
  box.scrollTop = box.scrollHeight;
  const btn = document.getElementById('coach-send-btn');
  if (btn) btn.disabled = aiCoachLoading;
}

async function sendCoachMessage() {
  const input = document.getElementById('coach-input');
  const text = (input && input.value ? input.value : '').trim();
  if (!text || aiCoachLoading) return;
  input.value = '';
  aiCoachMessages.push({ role: 'user', content: text });
  aiCoachPendingContent = buildCoachContext() + '\n\n' + text;
  await doCoachAsk();
}

async function doCoachAsk() {
  aiCoachLoading = true;
  renderCoachChat();
  try {
    const resp = await aiFetch('/api/ask', { password: getAIPassword(), deviceId: getDeviceId(), content: aiCoachPendingContent });
    const data = await resp.json();
    if (data && data.success) {
      aiCoachMessages.push({ role: 'ai', content: data.answer });
    } else {
      aiCoachMessages.push({ role: 'ai-error', content: '⚠️ ' + ((data && data.error) || '请求失败') });
    }
  } catch (e) {
    aiCoachMessages.push({ role: 'ai-error', content: '⚠️ 无法连接 AI 服务，请确认后端已启动' });
  }
  aiCoachLoading = false;
  renderCoachChat();
}

function retryCoachMessage() {
  if (aiCoachLoading || !aiCoachPendingContent) return;
  if (aiCoachMessages.length && aiCoachMessages[aiCoachMessages.length - 1].role === 'ai-error') aiCoachMessages.pop();
  doCoachAsk();
}
