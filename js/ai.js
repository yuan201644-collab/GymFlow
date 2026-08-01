/* ============================================
   AI 顾问 — 独立页面 · 消息动画
   ============================================ */

let aiMessages = [];
let aiLoading = false;

// 默认地址：网页端用 localhost（连本机后端）；APK/手机端用隧道地址
const DEFAULT_AI_SERVER_LOCAL = 'http://localhost:3000';
const DEFAULT_AI_SERVER_TUNNEL = 'https://ai.gym-flow.xyz';

function getAIServer() {
  const saved = localStorage.getItem('fitness_ai_server');
  if (saved) return saved;
  // Capacitor APK 环境（window.Capacitor 存在）→ 用隧道地址
  if (typeof window !== 'undefined' && window.Capacitor) {
    return DEFAULT_AI_SERVER_TUNNEL;
  }
  return DEFAULT_AI_SERVER_LOCAL;
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
  h += '<div style="font-size:48px;margin-bottom:12px;">🤖</div>';
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
  h += '<div><h1 class="section-title" style="margin-bottom:2px;">🤖 AI 健身顾问</h1>';
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
    const resp = await fetch(getAIServer() + '/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: getAIPassword(), deviceId: getDeviceId(), content: text }),
    });
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
      bubble.innerHTML = shown.replace(/\n/g, '<br>');
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
