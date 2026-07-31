/* ============================================
   体重页 — 记录表单 + BMI + 列表 + 折线图
   ============================================ */

let weightChart = null;

// ========== BMI 计算 ==========

function calcBMI(weight) {
  const settings = getSettings();
  const heightM = settings.userInfo.height / 100; // cm → m
  return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: '偏瘦', color: '#40c4ff' };
  if (bmi < 24.0) return { label: '正常', color: '#00e676' };
  if (bmi < 28.0) return { label: '偏胖', color: '#ffab40' };
  return { label: '肥胖', color: '#ff5252' };
}

function getBMIProgress(bmi) {
  // 在 15-35 范围内映射到 0-100% 的进度条
  const clamped = Math.max(15, Math.min(35, bmi));
  return ((clamped - 15) / 20) * 100;
}

// ========== 渲染体重页 ==========

function renderWeightPage() {
  const container = document.getElementById('weight-content');
  const weights = getWeights();
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const bmi = latestWeight ? calcBMI(latestWeight) : null;
  const category = bmi ? getBMICategory(bmi) : null;

  let html = `
    <h1 class="section-title">⚖️ 体重追踪</h1>

    <!-- BMI 概览卡片 -->
    <div class="card mb-16" style="border-left: 3px solid ${bmi ? category.color : 'var(--border)'};">
      <div class="flex-between mb-8">
        <div>
          <div style="font-size:13px;color:var(--muted);">BMI（身体质量指数）</div>
          <div style="font-size:32px;font-weight:800;color:${bmi ? category.color : 'var(--muted)'};margin-top:4px;">
            ${bmi ? bmi.toFixed(1) : '--'}
          </div>
          <div style="font-size:13px;color:${bmi ? category.color : 'var(--muted)'};margin-top:2px;">
            ${bmi ? category.label : '暂无数据'}
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--muted);line-height:1.6;">
          偏瘦 &lt;18.5<br>
          正常 18.5-23.9<br>
          偏胖 24.0-27.9<br>
          肥胖 ≥28.0
        </div>
      </div>
      <!-- BMI 进度条 -->
      <div style="position:relative;height:8px;background:linear-gradient(to right,#40c4ff 0%,#00e676 37%,#ffab40 56%,#ff5252 100%);border-radius:4px;margin-top:8px;">
        ${bmi ? `<div style="position:absolute;top:-3px;width:14px;height:14px;background:#fff;border:2px solid ${category.color};border-radius:50%;left:${getBMIProgress(bmi)}%;transform:translateX(-50%);transition:left 0.4s;"></div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:6px;">
        <span>15</span><span>18.5</span><span>24</span><span>28</span><span>35</span>
      </div>
    </div>

    <!-- 添加记录表单 -->
    <div class="card mb-16">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">日期</label>
          <input type="date" class="form-input" id="weight-date" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">体重 (kg)</label>
          <input type="number" class="form-input" id="weight-value" placeholder="80.0" step="0.1" min="30" max="300" inputmode="decimal">
        </div>
      </div>
      <div id="bmi-preview" class="text-center mt-8" style="font-size:13px;color:var(--muted);">
        输入体重后实时预览 BMI
      </div>
      <button class="btn btn-accent mt-16" onclick="handleAddWeight()">添加记录</button>
    </div>
  `;

  // 图表区域
  if (weights.length > 0) {
    html += `
      <div class="chart-container mb-16">
        <h3 class="mb-16" style="font-size:15px;">体重 & BMI 变化曲线</h3>
        <canvas id="weight-chart"></canvas>
      </div>
    `;
  }

  // 历史记录列表
  if (weights.length > 0) {
    html += `
      <div class="card">
        <h3 class="mb-16" style="font-size:15px;">历史记录</h3>
        <div id="weight-list">
          ${[...weights].reverse().map(w => {
            const b = calcBMI(w.weight);
            const cat = getBMICategory(b);
            return `
            <div class="weight-list-item">
              <div>
                <div class="weight-date">${formatDate(w.date)}</div>
                <div style="font-size:12px;color:${cat.color};margin-top:2px;">BMI ${b.toFixed(1)} · ${cat.label}</div>
              </div>
              <div class="weight-value">${w.weight} <span>kg</span></div>
              <button class="btn-delete" onclick="handleDeleteWeight('${w.id}')" title="删除">🗑️</button>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>暂无体重记录<br>添加第一条记录开始追踪吧</p>
      </div>
    `;
  }

  container.innerHTML = html;

  // 绑定实时 BMI 预览
  const weightInput = document.getElementById('weight-value');
  if (weightInput) {
    weightInput.addEventListener('input', function() {
      const v = parseFloat(this.value);
      const preview = document.getElementById('bmi-preview');
      if (preview && v > 0) {
        const b = calcBMI(v);
        const cat = getBMICategory(b);
        preview.innerHTML = `BMI <span style="color:${cat.color};font-weight:700;">${b.toFixed(1)}</span> · <span style="color:${cat.color};">${cat.label}</span>`;
      }
    });
  }

  // 渲染图表
  if (weights.length > 0) {
    setTimeout(() => renderWeightChart(weights), 100);
  }
}

function handleAddWeight() {
  const dateInput = document.getElementById('weight-date');
  const weightInput = document.getElementById('weight-value');

  if (!weightInput.value || parseFloat(weightInput.value) <= 0) {
    showToast('请输入有效体重', 'error');
    return;
  }

  const w = parseFloat(weightInput.value);
  const bmi = calcBMI(w);
  const cat = getBMICategory(bmi);

  const record = addWeight({
    date: dateInput.value || todayStr(),
    weight: w,
  });

  showToast(`已记录 ${w} kg · BMI ${bmi.toFixed(1)} (${cat.label})`, 'success');
  weightInput.value = '';

  // 重置预览
  const preview = document.getElementById('bmi-preview');
  if (preview) preview.innerHTML = '输入体重后实时预览 BMI';

  renderWeightPage();
}

function handleDeleteWeight(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  deleteWeight(id);
  showToast('已删除', 'success');
  renderWeightPage();
}

function renderWeightChart(weights) {
  const canvas = document.getElementById('weight-chart');
  if (!canvas) return;

  if (weightChart) {
    weightChart.destroy();
    weightChart = null;
  }

  const ctx = canvas.getContext('2d');
  const weightValues = weights.map(w => w.weight);
  const bmiValues = weights.map(w => calcBMI(w.weight));
  const minWeight = Math.floor(Math.min(...weightValues) - 2);
  const maxWeight = Math.ceil(Math.max(...weightValues) + 2);

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weights.map(w => formatDateShort(w.date)),
      datasets: [
        {
          label: '体重 (kg)',
          data: weightValues,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#00e676',
          pointBorderColor: '#0d0d0d',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'BMI',
          data: bmiValues,
          borderColor: '#ffab40',
          backgroundColor: 'rgba(255, 171, 64, 0.04)',
          borderWidth: 2,
          borderDash: [6, 3],
          pointBackgroundColor: '#ffab40',
          pointBorderColor: '#0d0d0d',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: false,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#a0a0a0',
            usePointStyle: true,
            pointStyleWidth: 8,
            padding: 20,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#f0f0f0',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 14,
          callbacks: {
            afterBody: ctx => {
              const bmi = bmiValues[ctx[0].dataIndex];
              const cat = getBMICategory(bmi);
              return [`BMI: ${bmi.toFixed(1)} · ${cat.label}`];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#666', font: { size: 11 } },
        },
        y: {
          type: 'linear',
          position: 'left',
          min: minWeight,
          max: maxWeight,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#00e676',
            font: { size: 11 },
            callback: v => v + ' kg',
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#ffab40',
            font: { size: 11 },
            callback: v => v.toFixed(1),
          },
        },
      },
    },
  });
}
