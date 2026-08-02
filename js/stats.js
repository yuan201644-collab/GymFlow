/* ============================================
   统计页 — 训练天数 + Streak + 柱状图 + 日历
   ============================================ */

let typeChart = null;
let calendarYear, calendarMonth;


function renderTypeChart(counts) {
  const canvas = document.getElementById('type-chart');
  if (!canvas) return;

  if (typeChart) {
    typeChart.destroy();
    typeChart = null;
  }

  const ctx = canvas.getContext('2d');
  typeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['推日', '拉日', '臀腿日', '休息日'],
      datasets: [{
        label: '训练次数',
        data: [counts.push, counts.pull, counts.legs, counts.rest],
        backgroundColor: [
          'rgba(0, 230, 118, 0.6)',
          'rgba(0, 200, 200, 0.6)',
          'rgba(200, 150, 255, 0.6)',
          'rgba(255, 171, 64, 0.5)',
        ],
        borderColor: [
          '#00e676',
          '#00c8c8',
          '#c896ff',
          '#ffab40',
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: ctx => `${ctx.parsed.y} 次`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#a0a0a0', font: { size: 13 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#666',
            font: { size: 11 },
            stepSize: 1,
            callback: v => v + ' 次',
          },
        },
      },
    },
  });
}

function renderStatsWeightChart() {
  const weights = getWeights();
  const container = document.getElementById('stats-weight-chart');
  if (!container || weights.length < 2) return;

  container.innerHTML = `
    <div class="chart-container mb-16">
      <h3 class="mb-16" style="font-size:15px;">体重变化趋势</h3>
      <canvas id="stats-weight-canvas"></canvas>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('stats-weight-canvas');
    if (!canvas) return;

    const weightValues = weights.map(w => w.weight);
    const minW = Math.floor(Math.min(...weightValues) - 2);
    const maxW = Math.ceil(Math.max(...weightValues) + 2);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: weights.map(w => formatDateShort(w.date)),
        datasets: [{
          label: '体重 (kg)',
          data: weightValues,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.06)',
          borderWidth: 2.5,
          pointBackgroundColor: '#00e676',
          pointBorderColor: '#0d0d0d',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: ctx => `${ctx.parsed.y} kg`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#666', font: { size: 10 } },
          },
          y: {
            min: minW,
            max: maxW,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#666', font: { size: 10 }, callback: v => v + ' kg' },
          },
        },
      },
    });
  }, 50);
}

// ========== 月度日历 ==========

function navigateCalendar(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

function getDateTypeMap() {
  const records = getRecords();
  const map = {};
  records.forEach(r => {
    if (r.completed || r.exercises.length > 0) {
      map[r.date] = r.type;
    }
  });
  return map;
}

function renderCalendar() {
  const labelEl = document.getElementById('cal-month-label');
  const gridEl = document.getElementById('cal-grid');
  if (!labelEl || !gridEl) return;

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  labelEl.textContent = `${months[calendarMonth]} ${calendarYear}`;

  const dateTypeMap = getDateTypeMap();
  const today = todayStr();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const typeEmoji = { push: '🏋️', pull: '🏋️', legs: '🏋️', rest: '🧘' };
  const typeLabel = { push: '推', pull: '拉', legs: '腿', rest: '休' };

  let html = '';

  // 星期头
  ['一', '二', '三', '四', '五', '六', '日'].forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  const startOffset = (firstDay + 6) % 7;

  for (let i = 0; i < startOffset; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const type = dateTypeMap[dateStr] || null;
    const isToday = dateStr === today;
    const cls = [
      'calendar-day',
      type ? `cal-type-${type}` : '',
      isToday ? 'today' : '',
    ].filter(Boolean).join(' ');

    html += `<div class="${cls}" title="${type ? typeLabel[type] + '日' : ''}">${day}${type ? '<span class="cal-dot">' + typeLabel[type] + '</span>' : ''}</div>`;
  }

  gridEl.innerHTML = html;

  // 图例
  const legendEl = document.getElementById('cal-legend');
  if (legendEl) {
    legendEl.innerHTML = `
      <span class="cal-legend-item"><span class="cal-dot-leg" style="background:#00e676;"></span> 推日</span>
      <span class="cal-legend-item"><span class="cal-dot-leg" style="background:#00c8c8;"></span> 拉日</span>
      <span class="cal-legend-item"><span class="cal-dot-leg" style="background:#c896ff;"></span> 臀腿日</span>
      <span class="cal-legend-item"><span class="cal-dot-leg" style="background:#ffab40;"></span> 休息日</span>
    `;
  }
}
