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
    gender: '男',
    age: 20,
    height: 175,
    goal: '减脂塑形',
  },
  lastWorkoutType: null, // null 表示首次使用
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
 * 更新某个动作的打卡数据
 */
function updateExerciseRecord(dateStr, exerciseName, updates) {
  const records = getRecords();
  const record = records.find(r => r.date === dateStr);
  if (!record) return;

  let ex = record.exercises.find(e => e.name === exerciseName);
  if (!ex) {
    ex = {
      name: exerciseName,
      weight: 0,
      sets: 0,
      reps: '',
      completed: false,
    };
    record.exercises.push(ex);
  }

  Object.assign(ex, updates);

  // 检查是否全部完成
  const plan = getTrainingPlan(record.type);
  const allExercises = getAllExercises(plan);
  record.completed = allExercises.every(ae =>
    record.exercises.find(e => e.name === ae.name && e.completed)
  );

  saveRecords(records);
  return record;
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
    saveRecords(data.records);
    saveWeights(data.weights);
    if (data.plans) savePlans(data.plans);
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
}

// ========== 训练方案库 ==========

function getPlans() {
  return loadJSON('fitness_plans') || [];
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
  const plans = getPlans().filter(p => p.id !== id);
  savePlans(plans);
  if (getActivePlanId() === id) setActivePlan('default');
}

// ========== 版本管理 ==========

const APP_VERSION = '1.2';

function getStoredVersion() {
  return localStorage.getItem('fitness_version') || '0';
}

function checkVersionUpdate() {
  const stored = getStoredVersion();
  if (stored !== APP_VERSION) {
    localStorage.setItem('fitness_version', APP_VERSION);
    return stored !== '0'; // 非首次使用才有更新提示
  }
  return false;
}
