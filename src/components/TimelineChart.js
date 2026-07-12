import { Chart, registerables } from 'chart.js';
import { formatRupiah } from '../utils/format.js';

Chart.register(...registerables);

export function renderTimelineChart(container, payoffData) {
  const { schedule, totalInterest, months, isInfinite } = payoffData;

  if (isInfinite) {
    container.innerHTML = `
      <div class="card timeline-chart-card mb-6">
        <div class="alert alert--danger">
          <strong>Peringatan: Utang Tidak Lunas!</strong><br/>
          Akumulasi bunga tahunan Anda lebih besar dibandingkan cicilan bulanan yang dibayarkan. Silakan tambahkan anggaran pembayaran bulanan (Snowflake) atau kurangi bunga untuk menyeimbangkan simulasi.
        </div>
      </div>
    `;
    return;
  }

  if (!schedule || schedule.length === 0) {
    container.innerHTML = '';
    return;
  }

  const freeDebtDate = schedule[schedule.length - 1].month;

  container.innerHTML = `
    <div class="card timeline-chart-card mb-6">
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h3 class="font-bold" style="font-size: var(--font-size-lg);">Proyeksi Bebas Utang</h3>
          <p class="text-secondary" style="font-size: var(--font-size-xs);">Gambaran sisa saldo total Anda hingga lunas.</p>
        </div>
        
        <div class="flex gap-4 flex-wrap">
          <div class="metrics-badge">
            <span class="metrics-badge__label">Bebas Utang Pada</span>
            <span class="metrics-badge__value text-primary font-bold">${freeDebtDate}</span>
          </div>
          <div class="metrics-badge">
            <span class="metrics-badge__label">Waktu Pelunasan</span>
            <span class="metrics-badge__value font-bold">${months} Bulan</span>
          </div>
          <div class="metrics-badge">
            <span class="metrics-badge__label">Total Bunga Dibayar</span>
            <span class="metrics-badge__value text-danger font-bold">${formatRupiah(totalInterest)}</span>
          </div>
        </div>
      </div>

      <div class="chart-canvas-container" style="position: relative; height: 320px; width: 100%;">
        <canvas id="timelineChartCanvas"></canvas>
      </div>
    </div>
  `;

  // Draw chart
  const ctx = container.querySelector('#timelineChartCanvas').getContext('2d');
  
  // Transform schedule into Chart.js datasets format
  // Each debt has a dataset of its remainingBalance over the months
  const monthsLabels = schedule.map(s => s.month);
  
  // Find all unique debt names/IDs in the schedule
  const debtIdsMap = {};
  schedule.forEach(s => {
    s.debts.forEach(d => {
      if (!debtIdsMap[d.id]) {
        debtIdsMap[d.id] = d.name;
      }
    });
  });

  const debtIds = Object.keys(debtIdsMap);
  
  // Color palette for debts (curated premium palette)
  const colors = [
    'rgba(15, 157, 88, 0.65)',  // green
    'rgba(66, 133, 244, 0.65)', // blue
    'rgba(219, 68, 85, 0.65)',  // red
    'rgba(244, 180, 0, 0.65)',  // yellow
    'rgba(171, 71, 188, 0.65)', // purple
    'rgba(0, 172, 193, 0.65)',  // teal
    'rgba(244, 81, 30, 0.65)',  // orange
  ];

  const borderColors = [
    '#0f9d58',
    '#4285f4',
    '#db4455',
    '#f4b400',
    '#ab47bc',
    '#00acc1',
    '#f4511e',
  ];

  // Retrieve current active theme to adjust font colors
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const fontColor = isDarkMode ? '#e0e0e0' : '#4a4a4a';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const datasets = debtIds.map((id, index) => {
    const colorIndex = index % colors.length;
    
    // For each month, get the balance of this debt ID, or 0 if paid off
    const dataPoints = schedule.map(s => {
      const debtData = s.debts.find(d => d.id.toString() === id.toString());
      return debtData ? debtData.remainingBalance : 0;
    });

    return {
      label: debtIdsMap[id],
      data: dataPoints,
      backgroundColor: colors[colorIndex],
      borderColor: borderColors[colorIndex],
      borderWidth: 1.5,
      fill: true,
      tension: 0.1
    };
  });

  // Destroy previous chart instance if exists on canvas
  if (window.activeTimelineChart) {
    window.activeTimelineChart.destroy();
  }

  window.activeTimelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthsLabels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: fontColor,
            font: {
              family: 'Inter',
              size: 11
            },
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatRupiah(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            color: gridColor
          },
          ticks: {
            color: fontColor,
            font: {
              family: 'Inter',
              size: 10
            }
          }
        },
        y: {
          stacked: true,
          grid: {
            color: gridColor
          },
          ticks: {
            color: fontColor,
            font: {
              family: 'Inter',
              size: 10
            },
            callback: function(value) {
              if (value >= 1000000) {
                return 'Rp ' + (value / 1000000).toFixed(1) + ' Jt';
              }
              return formatRupiah(value);
            }
          }
        }
      }
    }
  });
}
