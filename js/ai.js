/* ============================================
   AI 顾问 — 独立页面 · 消息动画
   ============================================ */

let aiMessages = [];
let aiLoading = false;

const DEFAULT_AI_SERVER = 'https://fathers-resistance-integral-valves.trycloudflare.com';

function getAIServer() { return localStorage.getItem('fitness_ai_server') || DEFAULT_AI_SERVER; }
function getAIPassword() { return localStorage.getItem('fitness_ai_password') || 'gymflow2024'; }
function getDeviceId() {
  let id = localStorage.getItem('fitness_device_id');
  if (!id) { id = 'web_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); localStorage.setItem('fitness_device_id', id); }
  return id;
}

// ===== 主页渲染 =====
function renderAIPage() {
  const c = document.getElementById('ai-content');
  let h = '<h1 class="section-title">🤖 AI 健身顾问</h1>';
  h += '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;">GLM-4-Flash 免费模型 · 专注健身问答</div>';
  h += '<div class="chat-box" id="chat-box">';

  if (aiMessages.length === 0) {
    h += '<div class="chat-empty"><div class="chat-empty-icon">💬</div><p>问我任何健身相关问题</p><div class="chat-suggestions">';
    h += '<button class="chat-sugg-btn" onclick="askSuggestion(\'练胸日注意什么？\')">练胸日注意什么？</button>';
    h += '<button class="chat-sugg-btn" onclick="askSuggestion(\'减脂期间晚餐建议\')">减脂晚餐建议</button>';
    h += '<button class="chat-sugg-btn" onclick="askSuggestion(\'圆肩怎么改善？\')">圆肩怎么改善？</button>';
    h += '<button class="chat-sugg-btn" onclick="askSuggestion(\'今天练腿推荐动作？\')">练腿推荐动作</button>';
    h += '</div></div>';
  } else {
    aiMessages.forEach((msg, i) => {
      h += '<div class="chat-msg ' + msg.role + '" style="animation:fadeUp .3s var(--ease-out) both;animation-delay:' + (i * 0.05) + 's;">';
      h += '<div class="chat-bubble">' + msg.content.replace(/\n/g, '<br>') + '</div></div>';
    });
  }

  if (aiLoading) {
    h += '<div class="chat-msg ai"><div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>';
  }

  h += '</div>';

  h += '<div class="chat-input-row"><input type="text" class="chat-input" id="chat-input" placeholder="输入健身问题..." onkeydown="if(event.key===\'Enter\')sendAIMessage()" maxlength="500" autocomplete="off"><button class="chat-send-btn" id="chat-send-btn" onclick="sendAIMessage()"' + (aiLoading?' disabled':'') + '>➤</button></div>';
  h += '<div class="chat-status" id="chat-status">' + (aiMessages.length > 0 ? aiMessages.length + ' 条消息' : '') + '</div>';

  c.innerHTML = h;
  setTimeout(scrollChatBottom, 150);
}

function scrollChatBottom() {
  const box = document.getElementById('chat-box');
  if (box) box.scrollTop = box.scrollHeight;
}

// ===== 快捷提问 =====
function askSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendAIMessage();
}

// ===== 发送消息 =====
async function sendAIMessage() {
  const input = document.getElementById('chat-input');
  const text = (input?.value || '').trim();
  if (!text || aiLoading) return;

  input.value = '';
  aiMessages.push({ role: 'user', content: text });
  aiLoading = true;
  renderAIPage();

  // 随机思考文案
  const thinkingTexts = ['分析中...', '整理健身知识...', '查阅训练方案...', '评估动作要点...'];
  const statusEl = document.getElementById('chat-status');
  let dotCount = 0;
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
    if (data.success) {
      aiMessages.push({ role: 'ai', content: data.answer });
      if (statusEl) statusEl.textContent = '剩余 ' + (data.usage?.remaining || '?') + ' 次';
    } else {
      aiMessages.push({ role: 'ai', content: '⚠️ ' + data.error });
      if (statusEl) statusEl.textContent = '请求失败';
    }
  } catch (e) {
    clearInterval(statusInterval);
    aiMessages.push({ role: 'ai', content: '⚠️ 无法连接 AI 服务，请确认后端已启动' });
    if (statusEl) statusEl.textContent = '连接失败';
  }

  aiLoading = false;
  renderAIPage();
}
