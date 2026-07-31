/* ============================================
   统计页 — 训练天数 + Streak + 柱状图 + 日历
   ============================================ */

let typeChart = null;
let calendarYear, calendarMonth;

function renderStatsPage() {
  const container = document.getElementById('stats-content');
  const counts = getTypeCounts();
  const streak = getStreak();

  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();

  let html = `
    <h1 class="section-title">📊 数据统计</h1>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-number">${counts.total}</div>
        <div class="stat-label">累计训练天数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${streak}</div>
        <div class="stat-label">连续打卡</div>
        ${streak > 0 ? `<div class="stat-fire">🔥 已连续 ${streak} 天</div>` : ''}
      </div>
    </div>

    <!-- 各部位训练次数 -->
    <div class="chart-container mb-16">
      <h3 class="mb-16" style="font-size:15px;">各部位训练次数</h3>
      <canvas id="type-chart"></canvas>
    </div>

    <!-- 体重变化（如果有多条记录） -->
    <div id="stats-weight-chart"></div>

    <!-- 月度训练日历 -->
    <div class="card">
      <div class="calendar-header">
        <span class="calendar-month" id="cal-month-label"></span>
        <div class="calendar-nav">
          <button onclick="navigateCalendar(-1)">◀</button>
          <button onclick="navigateCalendar(1)">▶</button>
        </div>
      </div>
      <div class="calendar-grid" id="cal-grid"></div>
      <div class="mt-16 flex-between" style="font-size:12px;color:var(--text-muted);">
        <span>🟢 已训练</span>
        <span>⚪ 未训练</span>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // 渲染图表
  setTimeout(() => {
    renderTypeChart(counts);
    renderStatsWeightChart();
    renderCalendar();
  }, 100);
}

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

function renderCalendar() {
  const labelEl = document.getElementById('cal-month-label');
  const gridEl = document.getElementById('cal-grid');
  if (!labelEl || !gridEl) return;

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  labelEl.textContent = `${months[calendarMonth]} ${calendarYear}`;

  const trainedDates = getTrainedDates();
  const today = todayStr();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  let html = '';

  // 星期头（周一开始）
  ['一', '二', '三', '四', '五', '六', '日'].forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  // 调整 firstDay: 0=Sun → 转换为周一=0
  const startOffset = (firstDay + 6) % 7;

  // 填充前面的空白
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // 日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isTrained = trainedDates.has(dateStr);
    const isToday = dateStr === today;
    const cls = [
      'calendar-day',
      isTrained ? 'trained' : '',
      isToday ? 'today' : '',
    ].filter(Boolean).join(' ');

    html += `<div class="${cls}">${day}</div>`;
  }

  gridEl.innerHTML = html;
}
