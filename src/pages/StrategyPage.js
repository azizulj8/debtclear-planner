import { renderAppShell } from '../components/AppShell.js';
import { renderStrategyPicker } from '../components/StrategyPicker.js';
import { renderExtraPayment } from '../components/ExtraPayment.js';
import { renderTimelineChart } from '../components/TimelineChart.js';
import { renderStrategyComparison } from '../components/StrategyComparison.js';
import { getAllDebts } from '../utils/storage.js';
import { calculatePayoffSchedule } from '../utils/strategy.js';
import { exportToPdf } from '../utils/pdfExport.js';

/**
 * Strategi page: payoff strategy picker, snowflake budget, projection
 * chart, strategy comparison, and PDF export.
 * @param {HTMLElement} container
 */
export async function renderStrategyPage(container) {
  const content = await renderAppShell(container, { title: 'Strategi Pelunasan', active: 'strategy' });

  let debts = [];
  try {
    debts = await getAllDebts();
  } catch (err) {
    console.error('Failed to load debts:', err);
  }

  if (debts.filter(d => !d.isPaidOff).length === 0) {
    content.innerHTML = `
      <div class="card text-center" style="padding: var(--spacing-8);">
        <h3 class="font-bold mb-2">Belum ada yang bisa disimulasikan</h3>
        <p class="text-secondary" style="font-size: var(--font-size-sm);">Catat utangmu dulu, lalu lihat strategi pelunasan tercepat dan terhemat di sini.</p>
      </div>
    `;
    return;
  }

  let currentStrategy = localStorage.getItem('debtclear_strategy') || 'snowball';
  let currentExtraPayment = parseInt(localStorage.getItem('debtclear_extra_payment') || '0', 10);

  content.innerHTML = `
    <div class="flex justify-end mb-4">
      <button type="button" class="btn btn--secondary btn--sm" id="btn-pdf-trigger">📄 Export PDF</button>
    </div>
    <div id="strategy-picker-container"></div>
    <div id="extra-payment-container"></div>
    <div id="timeline-chart-container"></div>
    <div id="strategy-comparison-container"></div>
  `;

  const chartContainer = content.querySelector('#timeline-chart-container');
  const comparisonContainer = content.querySelector('#strategy-comparison-container');
  const triggerPdf = content.querySelector('#btn-pdf-trigger');

  const updateSimulation = () => {
    const payoffData = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);
    renderTimelineChart(chartContainer, payoffData);
    renderStrategyComparison(comparisonContainer, debts, currentExtraPayment);

    if (payoffData.isInfinite) {
      triggerPdf.disabled = true;
      triggerPdf.style.opacity = '0.5';
    } else {
      triggerPdf.disabled = false;
      triggerPdf.style.opacity = '1';
    }
  };

  triggerPdf.addEventListener('click', () => {
    const payoffData = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);
    exportToPdf(debts, currentStrategy, currentExtraPayment, payoffData);
  });

  renderStrategyPicker(content.querySelector('#strategy-picker-container'), currentStrategy, (s) => {
    currentStrategy = s;
    updateSimulation();
  });

  renderExtraPayment(content.querySelector('#extra-payment-container'), currentExtraPayment, (e) => {
    currentExtraPayment = e;
    updateSimulation();
  });

  updateSimulation();
}
