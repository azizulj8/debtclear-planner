import { compareStrategies } from '../utils/strategy.js';
import { formatRupiah } from '../utils/format.js';

export function renderStrategyComparison(container, debts, extraPayment = 0) {
  if (!debts || debts.filter(d => !d.isPaidOff).length === 0) {
    container.innerHTML = '';
    return;
  }

  const comparison = compareStrategies(debts, extraPayment);
  const { snowball, avalanche, betterStrategy, interestSaved, monthsSaved } = comparison;

  const snowballWinner = betterStrategy === 'snowball';
  const avalancheWinner = betterStrategy === 'avalanche';

  container.innerHTML = `
    <div class="card comparison-card mb-6">
      <h3 class="font-bold mb-4" style="font-size: var(--font-size-lg);">Bandingkan Strategi Pelunasan</h3>
      
      <div class="grid-2 gap-4">
        <!-- Snowball Card -->
        <div class="comparison-column-card ${snowballWinner ? 'comparison-column-card--winner' : ''}">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold">Method Snowball</h4>
            ${snowballWinner ? '<span class="badge badge--success">Paling Hemat</span>' : ''}
          </div>
          <div class="comparison-metric-item">
            <span class="comparison-metric-label">Lama Pelunasan</span>
            <span class="comparison-metric-value font-bold">${snowball.isInfinite ? 'Tak Terhingga' : `${snowball.months} Bulan`}</span>
          </div>
          <div class="comparison-metric-item mt-2">
            <span class="comparison-metric-label">Total Bunga</span>
            <span class="comparison-metric-value text-danger font-bold">${formatRupiah(snowball.totalInterest)}</span>
          </div>
        </div>

        <!-- Avalanche Card -->
        <div class="comparison-column-card ${avalancheWinner ? 'comparison-column-card--winner' : ''}">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold">Method Avalanche</h4>
            ${avalancheWinner ? '<span class="badge badge--success">Paling Hemat</span>' : ''}
          </div>
          <div class="comparison-metric-item">
            <span class="comparison-metric-label">Lama Pelunasan</span>
            <span class="comparison-metric-value font-bold">${avalanche.isInfinite ? 'Tak Terhingga' : `${avalanche.months} Bulan`}</span>
          </div>
          <div class="comparison-metric-item mt-2">
            <span class="comparison-metric-label">Total Bunga</span>
            <span class="comparison-metric-value text-danger font-bold">${formatRupiah(avalanche.totalInterest)}</span>
          </div>
        </div>
      </div>

      <!-- Recommendation Summary Banner -->
      <div class="comparison-summary-banner mt-4 p-3 flex gap-2 items-center">
        <span style="font-size: 1.5rem;">🎉</span>
        <div class="font-medium" style="font-size: var(--font-size-sm); line-height:1.4;">
          ${interestSaved === 0 && monthsSaved === 0 ? `
            Kedua strategi memberikan hasil pelunasan yang serupa. Pilih <strong>Snowball</strong> untuk kepuasan psikologis cepat, atau <strong>Avalanche</strong> untuk keteraturan matematis.
          ` : `
            Metode <strong>${betterStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> lebih direkomendasikan! 
            Anda menghemat <strong>${formatRupiah(interestSaved)}</strong> biaya bunga ${monthsSaved > 0 ? `dan bebas utang <strong>${monthsSaved} bulan lebih cepat</strong>` : ''} dibanding metode alternatif.
          `}
        </div>
      </div>
    </div>
  `;
}
