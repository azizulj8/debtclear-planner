import { renderAppShell } from '../components/AppShell.js';
import { renderStrategyPicker } from '../components/StrategyPicker.js';
import { renderExtraPayment } from '../components/ExtraPayment.js';
import { renderTimelineChart } from '../components/TimelineChart.js';
import { renderStrategyComparison } from '../components/StrategyComparison.js';
import { getAllDebts } from '../utils/storage.js';
import { calculatePayoffSchedule, sortByStrategy } from '../utils/strategy.js';
import { mergeConsolidatedDebts } from '../utils/billGrouping.js';
import { exportToPdf } from '../utils/pdfExport.js';
import { formatRupiah } from '../utils/format.js';

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
    <div id="action-plan-container"></div>
    <div id="strategy-picker-container"></div>
    <div id="extra-payment-container"></div>
    <div id="timeline-chart-container"></div>
    <div id="strategy-comparison-container"></div>
  `;

  const chartContainer = content.querySelector('#timeline-chart-container');
  const comparisonContainer = content.querySelector('#strategy-comparison-container');
  const planContainer = content.querySelector('#action-plan-container');
  const triggerPdf = content.querySelector('#btn-pdf-trigger');

  // Plain-language answer to "so what do I actually do this month?"
  const renderActionPlan = () => {
    const activeDebts = debts.filter(d => !d.isPaidOff);
    const totalMinimum = activeDebts.reduce((s, d) => s + d.minPayment, 0);

    // Priority target under the chosen strategy (consolidated providers merged)
    const target = sortByStrategy(mergeConsolidatedDebts(activeDebts), currentStrategy)[0];
    const targetReason = currentStrategy === 'snowball'
      ? 'sisanya paling kecil — paling cepat lunas'
      : 'bunganya paling mahal — paling boros kalau dibiarkan';

    // Impact of extra money: real (current slider) or a suggested teaser
    const baseline = calculatePayoffSchedule(debts, currentStrategy, 0);

    // "lunas N bulan lebih cepat dan/atau hemat bunga Rp X" — only the
    // parts that are actually non-zero
    const impactPhrase = (monthsSaved, interestSaved) => {
      const parts = [];
      if (monthsSaved > 0) parts.push(`lunas <strong>${monthsSaved} bulan lebih cepat</strong>`);
      if (interestSaved > 0) parts.push(`hemat bunga <strong>${formatRupiah(interestSaved)}</strong>`);
      return parts.join(' dan ');
    };

    let impactHTML = '';
    if (currentExtraPayment > 0) {
      const withExtra = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);
      const phrase = impactPhrase(
        baseline.months - withExtra.months,
        baseline.totalInterest - withExtra.totalInterest
      );
      if (phrase) {
        impactHTML = `Dengan uang lebih <strong>${formatRupiah(currentExtraPayment)}/bln</strong> yang kamu isi di bawah, kamu ${phrase}. 👏`;
      }
    } else if (!baseline.isInfinite) {
      // Suggest ~10% of the monthly commitment, rounded to Rp 50rb
      const suggested = Math.max(100000, Math.round((totalMinimum * 0.1) / 50000) * 50000);
      const withSuggested = calculatePayoffSchedule(debts, currentStrategy, suggested);
      const phrase = impactPhrase(
        baseline.months - withSuggested.months,
        baseline.totalInterest - withSuggested.totalInterest
      );
      if (phrase) {
        impactHTML = `💡 Coba geser slider di bawah: dengan tambahan <strong>${formatRupiah(suggested)}/bln</strong> saja, kamu ${phrase}.`;
      }
    }

    planContainer.innerHTML = `
      <div class="card mb-6" style="border-left: 4px solid var(--color-primary);">
        <h3 class="font-bold mb-3" style="font-size: var(--font-size-lg);">✅ Rencana Aksi Bulan Ini</h3>
        <ol class="action-plan-list">
          <li>Bayar <strong>semua cicilan minimum</strong>: total <strong>${formatRupiah(totalMinimum)}</strong> — jangan sampai telat, denda pinjol lebih mahal dari bunganya.</li>
          <li>Punya uang lebih? Fokuskan <strong>semuanya</strong> ke <strong>${target.name}</strong> dulu <span class="text-secondary">(${targetReason})</span>. Utang lain cukup bayar minimum.</li>
          ${impactHTML ? `<li>${impactHTML}</li>` : ''}
        </ol>
      </div>
    `;
  };

  const updateSimulation = () => {
    const payoffData = calculatePayoffSchedule(debts, currentStrategy, currentExtraPayment);
    renderActionPlan();
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
