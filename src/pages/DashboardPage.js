import { STRINGS } from '../data/strings.js';
import { renderStrategyPicker } from '../components/StrategyPicker.js';
import { renderExtraPayment } from '../components/ExtraPayment.js';
import { renderTimelineChart } from '../components/TimelineChart.js';
import { renderStrategyComparison } from '../components/StrategyComparison.js';
import { renderCsvImport } from '../components/CsvImport.js';
import { renderDebtList } from '../components/DebtList.js';
import { getAllDebts } from '../utils/storage.js';
import { calculatePayoffSchedule } from '../utils/strategy.js';
import { exportToPdf } from '../utils/pdfExport.js';

export async function renderDashboardPage(container) {
  let debts = [];
  try {
    debts = await getAllDebts();
  } catch (err) {
    console.error('Failed to load debts:', err);
  }

  // Load preferences
  let currentStrategy = localStorage.getItem('debtclear_strategy') || 'snowball';
  let currentExtraPayment = parseInt(localStorage.getItem('debtclear_extra_payment') || '0', 10);
  const currentTheme = localStorage.getItem('debtclear_theme') || 'dark';

  // Base shell
  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <div class="brand-logo" id="logo-dashboard" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <div class="flex items-center gap-3">
          <button type="button" class="btn btn--secondary btn--sm" id="btn-csv-trigger" style="gap:var(--spacing-1);">
            📂 Import CSV
          </button>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-pdf-trigger" style="gap:var(--spacing-1);">
            📄 Export PDF
          </button>
          <button type="button" class="btn btn--secondary" id="btn-theme-toggle" style="padding: 6px 10px;">
            ${currentTheme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>

    <main class="container mt-4 mb-12">
      <div class="dashboard-layout grid-main">
        <!-- Left Side: Calculation controls, Visual charts and Comparisons -->
        <div class="dashboard-controls-section">
          <div id="strategy-picker-container"></div>
          <div id="extra-payment-container"></div>
          <div id="timeline-chart-container"></div>
          <div id="strategy-comparison-container"></div>
        </div>

        <!-- Right Side: Current active debts list -->
        <div class="dashboard-list-section">
          <div id="debt-list-container"></div>
        </div>
      </div>
    </main>
  `;

  // Attach CSV import modal trigger
  const csvImport = renderCsvImport(container, async () => {
    // Refresh page data on successful import
    renderDashboardPage(container);
  });

  const triggerCsv = container.querySelector('#btn-csv-trigger');
  if (triggerCsv) {
    triggerCsv.addEventListener('click', () => csvImport.open());
  }

  // Logo home navigation
  container.querySelector('#logo-dashboard').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/' } }));
  });

  // Theme switcher
  const themeBtn = container.querySelector('#btn-theme-toggle');
  themeBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('debtclear_theme', newTheme);
    themeBtn.textContent = newTheme === 'light' ? '🌙' : '☀️';
    
    // Re-render chart to update grid line colors dynamically
    updateSimulation();
  });

  const strategyContainer = container.querySelector('#strategy-picker-container');
  const extraPaymentContainer = container.querySelector('#extra-payment-container');
  const chartContainer = container.querySelector('#timeline-chart-container');
  const comparisonContainer = container.querySelector('#strategy-comparison-container');
  const listContainer = container.querySelector('#debt-list-container');

  const updateSimulation = () => {
    // Recalculate schedule
    const payoffData = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);

    // Render components
    renderTimelineChart(chartContainer, payoffData);
    renderStrategyComparison(comparisonContainer, debts, currentExtraPayment);
    
    // Enable/disable PDF export trigger based on data
    const triggerPdf = container.querySelector('#btn-pdf-trigger');
    if (triggerPdf) {
      if (debts.length === 0 || payoffData.isInfinite) {
        triggerPdf.disabled = true;
        triggerPdf.style.opacity = '0.5';
      } else {
        triggerPdf.disabled = false;
        triggerPdf.style.opacity = '1';
      }
    }
  };

  // PDF Export Trigger
  const triggerPdf = container.querySelector('#btn-pdf-trigger');
  if (triggerPdf) {
    triggerPdf.addEventListener('click', () => {
      const payoffData = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);
      exportToPdf(debts, currentStrategy, currentExtraPayment, payoffData);
    });
  }

  // Render initial strategy selection
  renderStrategyPicker(strategyContainer, currentStrategy, (newStrategy) => {
    currentStrategy = newStrategy;
    updateSimulation();
  });

  // Render initial extra payment control
  renderExtraPayment(extraPaymentContainer, currentExtraPayment, (newExtra) => {
    currentExtraPayment = newExtra;
    updateSimulation();
  });

  // Render active list
  renderDebtList(listContainer);

  // Run initial simulation
  updateSimulation();
}
