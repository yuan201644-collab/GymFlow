/* ============================================
   数据层 — localStorage CRUD 封装
   ============================================ */

const STORAGE_KEYS = {
  settings: 'fitness_settings',
  records: 'fitness_records',
  weights: 'fitness_weights',
};

// ========== 通用工具 ==========

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return null;
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
    showToast('存储空间不足，请清理数据', 'error');
  }
}

// ========== Settings ==========

const DEFAULT_SETTINGS = {
  userInfo: {
    gender: '',
    age: 0,
    height: 0,
    goal: '',
  },
  lastWorkoutType: null,
};

function getSettings() {
  const s = loadJSON(STORAGE_KEYS.settings);
  return s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  saveJSON(STORAGE_KEYS.settings, settings);
}

/**
 * 获取下一个训练部位
 * 轮转顺序: push → pull → legs → rest → push ...
 */
function getNextWorkoutType() {
  const settings = getSettings();
  const pid = localStorage.getItem('fitness_active_plan') || 'default';
  if (pid !== 'default') {
    const plans = loadJSON('fitness_plans') || [];
    const ap = plans.find(p => p.id === pid);
    if (ap && ap.days) {
      const order = ap.days.map((_, i) => 'custom_' + i).concat(['rest']);
      if (!settings.lastWorkoutType || !order.includes(settings.lastWorkoutType)) return order[0];
      const idx = order.indexOf(settings.lastWorkoutType);
      return order[(idx + 1) % order.length];
    }
  }
  const order = ['push', 'pull', 'legs', 'rest'];
  if (!settings.lastWorkoutType) return 'push';
  const idx = order.indexOf(settings.lastWorkoutType);
  return order[(idx + 1) % 4];
}

/**
 * 标记训练完成，推进轮转
 */
function advanceWorkout(type) {
  const settings = getSettings();
  settings.lastWorkoutType = type;
  saveSettings(settings);
}

// ========== Training Records ==========

function getRecords() {
  return loadJSON(STORAGE_KEYS.records) || [];
}

function saveRecords(records) {
  saveJSON(STORAGE_KEYS.records, records);
}

/**
 * 获取今日训练记录（不存在则创建）
 */
function getTodayRecord() {
  const today = todayStr();
  const records = getRecords();
  let record = records.find(r => r.date === today);

  if (!record) {
    const workoutType = getNextWorkoutType();
    record = {
      id: generateId(),
      date: today,
      type: workoutType,
      completed: false,
      exercises: [],
    };
    records.push(record);
    saveRecords(records);
  }

  return record;
}

/**
 * 保存/更新今日训练记录
 */
function saveTodayRecord(record) {
  const records = getRecords();
  const idx = records.findIndex(r => r.date === record.date);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  saveRecords(records);
}

/**
 * 手动切换今日训练部位（不影响轮转记忆）
 * 轮转只在实际完成训练后才推进
 */
function switchTodayWorkoutType(type) {
  const record = getTodayRecord();
  record.type = type;
  // 清除旧动作打卡数据和选择（不同部位动作组不同）
  record.exercises = [];
  record.groupSelections = {};
  saveTodayRecord(record);
}

/**
 * 根据日期获取训练记录
 */
function getRecordByDate(dateStr) {
  const records = getRecords();
  return records.find(r => r.date === dateStr) || null;
}

/**
 * 删除训练记录
 */
function deleteRecord(id) {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  saveRecords(filtered);
}


/**
 * 获取所有训练过的日期集合
 */
function getTrainedDates() {
  const records = getRecords();
  return new Set(records.filter(r => r.completed).map(r => r.date));
}

/**
 * 获取各部位训练次数
 */
function getTypeCounts() {
  const records = getRecords();
  const completed = records.filter(r => r.completed);
  return {
    push: completed.filter(r => r.type === 'push').length,
    pull: completed.filter(r => r.type === 'pull').length,
    legs: completed.filter(r => r.type === 'legs').length,
    rest: completed.filter(r => r.type === 'rest').length,
    total: completed.length,
  };
}

/**
 * 计算连续打卡天数
 */
function getStreak() {
  const records = getRecords();
  const completedDates = new Set(
    records.filter(r => r.completed).map(r => r.date)
  );

  let streak = 0;
  const d = new Date();

  while (true) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // 如果今天还没完成，检查昨天
      if (streak === 0 && dateStr === todayStr()) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

// ========== Weight Records ==========

function getWeights() {
  return loadJSON(STORAGE_KEYS.weights) || [];
}

function saveWeights(weights) {
  saveJSON(STORAGE_KEYS.weights, weights);
}

function addWeight(weight) {
  const weights = getWeights();
  const record = {
    id: generateId(),
    date: weight.date || todayStr(),
    weight: parseFloat(weight.weight),
  };
  weights.push(record);
  // 按日期排序
  weights.sort((a, b) => a.date.localeCompare(b.date));
  saveWeights(weights);
  return record;
}

function deleteWeight(id) {
  const weights = getWeights();
  const filtered = weights.filter(w => w.id !== id);
  saveWeights(filtered);
}

// ========== Data Export / Import ==========

function exportAllData() {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    records: getRecords(),
    weights: getWeights(),
    plans: getPlans(),
    activePlan: getActivePlanId(),
    aiServer: localStorage.getItem('fitness_ai_server') || '',
    aiPassword: localStorage.getItem('fitness_ai_password') || '',
  };
  return JSON.stringify(data, null, 2);
}

function importAllData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.version || !data.records || !data.weights) {
      throw new Error('数据格式无效');
    }
    saveSettings(data.settings || DEFAULT_SETTINGS);
    saveRecords(sanitizeRecords(data.records)); // P2-2：导入清洗（过滤恶意/畸形数据）
    saveWeights(sanitizeWeights(data.weights));
    if (data.plans) savePlans((Array.isArray(data.plans) ? data.plans : []).map(sanitizePlan).filter(Boolean));
    if (data.activePlan) setActivePlan(data.activePlan);
    if (data.aiServer) localStorage.setItem('fitness_ai_server', data.aiServer);
    if (data.aiPassword) localStorage.setItem('fitness_ai_password', data.aiPassword);
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.settings);
  localStorage.removeItem(STORAGE_KEYS.records);
  localStorage.removeItem(STORAGE_KEYS.weights);
  localStorage.removeItem('fitness_version');
  localStorage.removeItem('fitness_plans');
  localStorage.removeItem('fitness_active_plan');
  localStorage.removeItem('fitness_ai_server');
  localStorage.removeItem('fitness_ai_password');
  localStorage.removeItem('fitness_theme');
  localStorage.removeItem('fitness_device_id');
  localStorage.removeItem('app_tutorial_done');
  localStorage.removeItem('ai_tutorial_done');
}

// ========== 训练方案库 ==========

// 清洗可能畸形的方案数据（旧格式 / 手动编辑 / 导入异常），幂等，不破坏正常结构
// P2-2 导入清洗：强制数组、过滤 null、id 重建、weight 数字、动作名截断
function sanitizeRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.filter(r => r && typeof r === 'object' && r.date).map(r => {
    const clean = {
      id: (r.id && String(r.id)) || generateId(),
      date: String(r.date).slice(0, 10),
      type: String(r.type || 'push').slice(0, 20),
      completed: !!r.completed,
      exercises: [],
    };
    if (Array.isArray(r.exercises)) {
      clean.exercises = r.exercises.filter(e => e && typeof e === 'object' && e.name).map(e => ({
        name: String(e.name).slice(0, 50),
        groupId: e.groupId ? String(e.groupId) : '',
        completed: !!e.completed,
        skipped: !!e.skipped,
        weight: isFinite(parseFloat(e.weight)) ? parseFloat(e.weight) : 0,
        reps: isFinite(parseInt(e.reps)) ? parseInt(e.reps) : 0,
        sets: isFinite(parseInt(e.sets)) ? parseInt(e.sets) : 0,
        custom: !!e.custom,
      }));
    }
    if (r.cardio && typeof r.cardio === 'object') {
      clean.cardio = { done: !!r.cardio.done, duration: parseFloat(r.cardio.duration) || 0, incline: parseFloat(r.cardio.incline) || 0, distance: parseFloat(r.cardio.distance) || 0 };
    }
    return clean;
  });
}

function sanitizeWeights(weights) {
  if (!Array.isArray(weights)) return [];
  return weights.filter(w => w && typeof w === 'object' && w.weight).map(w => ({
    id: (w.id && String(w.id)) || generateId(),
    date: String(w.date || todayStr()).slice(0, 10),
    weight: parseFloat(w.weight) || 0,
  }));
}

function sanitizePlan(plan) {
  if (!plan || typeof plan !== 'object') return null;
  if (!Array.isArray(plan.days)) plan.days = [];
  plan.days = plan.days.filter(d => d && typeof d === 'object').map(d => {
    // 旧格式 day.groups（无 sections）→ 转 main sections
    if (!Array.isArray(d.sections) && Array.isArray(d.groups)) {
      d.sections = [{ type: 'main', title: '训练', groups: d.groups }];
    }
    if (!Array.isArray(d.sections)) d.sections = [];
    d.sections = d.sections.filter(s => s && typeof s === 'object').map(s => {
      if (!Array.isArray(s.groups)) s.groups = [];
      s.groups = s.groups.filter(g => g && typeof g === 'object').map(g => {
        if (!Array.isArray(g.exercises)) g.exercises = [];
        g.exercises = g.exercises.filter(e => e && typeof e === 'object');
        return g;
      });
      return s;
    });
    return d;
  });
  return plan;
}

function getPlans() {
  const plans = loadJSON('fitness_plans') || [];
  return Array.isArray(plans) ? plans.map(sanitizePlan).filter(Boolean) : [];
}

function savePlans(plans) {
  saveJSON('fitness_plans', plans);
}

function getActivePlanId() {
  return localStorage.getItem('fitness_active_plan') || 'default';
}

function setActivePlan(id) {
  localStorage.setItem('fitness_active_plan', id);
}

function addPlan(plan) {
  const plans = getPlans();
  plan.id = 'plan_' + Date.now().toString(36);
  plan.createdAt = todayStr();
  plans.push(plan);
  savePlans(plans);
  return plan;
}

function deletePlan(id) {
  if (!confirm('确定删除这套方案吗？')) return;
  const plans = getPlans().filter(p => p.id !== id);
  savePlans(plans);
  if (getActivePlanId() === id) setActivePlan('default');
}

// ========== 版本管理 ==========

const APP_VERSION = '2.1';
