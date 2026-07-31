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
    aiMessages.push({ role: 'ai', content: '⚠️ 无法连接 AI 服务\n\n请确认：\n1. 电脑上已启动后端 (cd server && node server.js)\n2. 已启动隧道 (cloudflared tunnel --url http://localhost:3000)\n3. 「我的→AI服务」地址正确' });
    if (statusEl) statusEl.textContent = '连接失败 · 检查AI服务配置';
  }

  aiLoading = false;
  renderAIPage();
}
