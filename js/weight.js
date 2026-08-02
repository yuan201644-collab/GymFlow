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



function handleDeleteWeight(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  deleteWeight(id);
  showToast('已删除', 'success');
  if (typeof openFeatureModule === 'function') {
    openFeatureModule('weight');
  }
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
