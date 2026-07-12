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
import { getCurrentUser, signOut } from '../utils/supabase.js';
import { renderAuthModal } from '../components/AuthModal.js';

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

  // Get current authenticated user
  const currentUser = await getCurrentUser();

  const authSectionHTML = currentUser 
    ? `
      <div class="flex items-center gap-2" style="font-size: var(--font-size-sm);">
        <span id="sync-indicator" title="Tersinkronisasi dengan cloud" style="cursor: help; opacity: 0.8; font-size: 1.1rem; display: inline-block;">☁️</span>
        <span class="text-secondary" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentUser.email}</span>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-auth-logout" style="padding: 4px 8px;">Keluar</button>
      </div>
    `
    : `
      <button type="button" class="btn btn--primary btn--sm" id="btn-auth-trigger" style="padding: 6px 12px; font-weight:600;">
        🔑 Masuk / Daftar
      </button>
    `;


  // Base shell
  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center relative">
        <div class="brand-logo" id="logo-dashboard" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        
        <!-- Burger Button for Mobile -->
        <button type="button" class="burger-menu-btn" id="burger-menu-trigger" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="nav-menu" id="nav-menu-container">
          ${authSectionHTML}
          <button type="button" class="btn btn--secondary btn--sm" id="btn-csv-trigger" style="gap:var(--spacing-1);">
            📂 Import CSV
          </button>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-pdf-trigger" style="gap:var(--spacing-1);">
            📄 Export PDF
          </button>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-theme-toggle" style="padding: 6px 10px;">
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

  // Attach Burger Menu Toggle
  const burgerTrigger = container.querySelector('#burger-menu-trigger');
  const navMenu = container.querySelector('#nav-menu-container');
  if (burgerTrigger && navMenu) {
    burgerTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      burgerTrigger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && e.target !== burgerTrigger) {
        burgerTrigger.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });

    // Close menu when clicking any button inside
    navMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        burgerTrigger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // Attach Auth handlers
  const authTrigger = container.querySelector('#btn-auth-trigger');
  if (authTrigger) {
    authTrigger.addEventListener('click', () => {
      renderAuthModal(() => {
        // Refresh page on successful login
        renderDashboardPage(container);
      });
    });
  }

  const authLogout = container.querySelector('#btn-auth-logout');
  if (authLogout) {
    authLogout.addEventListener('click', async () => {
      await signOut();
      renderDashboardPage(container);
    });
  }

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

  // Listen to cloud sync state changes to update the UI indicator
  if (typeof window !== 'undefined') {
    window.addEventListener('sync-state-change', (e) => {
      const { syncing, error } = e.detail;
      const indicator = container.querySelector('#sync-indicator');
      if (indicator) {
        if (syncing) {
          indicator.textContent = '🔄';
          indicator.title = 'Sedang mensinkronisasi dengan cloud...';
          indicator.classList.add('spinning');
          // Add inline rotation style since keyframe animation might not be defined
          indicator.style.animation = 'spin 1s linear infinite';
        } else if (error) {
          indicator.textContent = '⚠️';
          indicator.title = 'Sinkronisasi gagal. Cek koneksi internet Anda.';
          indicator.style.animation = 'none';
        } else {
          indicator.textContent = '☁️';
          indicator.title = 'Tersinkronisasi dengan cloud';
          indicator.style.animation = 'none';
        }
      }
    });
  }

  // Trigger background sync on page load if authenticated
  if (currentUser) {
    import('../utils/sync.js').then(async ({ syncAll }) => {
      const result = await syncAll(currentUser.id);
      if (result.success) {
        // Sync completed. Refresh the debts list and re-run simulation to show new/merged data
        try {
          debts = await getAllDebts();
          updateSimulation();
          renderDebtList(listContainer);
        } catch (err) {
          console.error('Failed to reload debts after sync:', err);
        }
      }
    });
  }
}

