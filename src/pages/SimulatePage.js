import { STRINGS } from '../data/strings.js';
import { formatRupiah, parseRupiah } from '../utils/format.js';
import { deriveDebtFromQuickAdd } from '../utils/quickAdd.js';
import { getMonthlyCommitment, computeRatio, getStoredIncome } from '../utils/ratio.js';
import { getAllDebts } from '../utils/storage.js';

const ZONE_LABEL = { green: 'Aman', yellow: 'Waspada', red: 'Bahaya' };

function zoneChip(ratio) {
  return `<span class="badge ratio-chip--${ratio.zone}">${ratio.pct}% · ${ZONE_LABEL[ratio.zone]}</span>`;
}

/**
 * "Mau pinjam lagi?" simulation: enter a prospective loan in pinjol
 * language and see the impact on the monthly bill and the debt-to-income
 * ratio BEFORE deciding to borrow — the intervention moment no lending
 * app offers.
 * @param {HTMLElement} container
 */
export async function renderSimulatePage(container) {
  let debts = [];
  try {
    debts = await getAllDebts();
  } catch (err) {
    console.error('Failed to load debts:', err);
  }

  const income = getStoredIncome();
  const currentCommitment = getMonthlyCommitment(debts);
  const currentRatio = income ? computeRatio(currentCommitment, income) : null;

  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <div class="brand-logo" id="logo-simulate" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-back-sim">← Dashboard</button>
      </div>
    </header>

    <main class="container mt-4 mb-12" style="max-width: 560px;">
      <div class="card mb-6">
        <h2 class="section-title" style="text-align:left;">🧮 Mau Pinjam Lagi?</h2>
        <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">
          Sebelum tekan "Ajukan" di aplikasi pinjol, cek dulu dampaknya ke keuanganmu.
          Masukkan penawaran yang kamu lihat:
        </p>

        <div class="form-group">
          <label class="form-label" for="sim-received">Uang yang akan kamu terima (Rp)</label>
          <input type="text" id="sim-received" class="form-input text-right" placeholder="Rp 1.000.000" inputmode="numeric" />
        </div>
        <div class="grid-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="sim-installment">Bayar per bulan (Rp)</label>
            <input type="text" id="sim-installment" class="form-input text-right" placeholder="Rp 410.000" inputmode="numeric" />
          </div>
          <div class="form-group">
            <label class="form-label" for="sim-tenor">Berapa kali bayar?</label>
            <input type="number" id="sim-tenor" class="form-input" placeholder="3" min="1" max="600" inputmode="numeric" />
          </div>
        </div>
      </div>

      <div id="sim-result"></div>
    </main>
  `;

  const receivedInput = container.querySelector('#sim-received');
  const installmentInput = container.querySelector('#sim-installment');
  const tenorInput = container.querySelector('#sim-tenor');
  const resultEl = container.querySelector('#sim-result');

  const maskCurrency = (input) => {
    const parsed = parseRupiah(input.value);
    input.value = parsed > 0 ? formatRupiah(parsed) : '';
  };

  const renderResult = () => {
    const derived = deriveDebtFromQuickAdd({
      amountReceived: parseRupiah(receivedInput.value),
      installment: parseRupiah(installmentInput.value),
      tenorMonths: parseInt(tenorInput.value, 10) || 0,
    });

    if (!derived) {
      resultEl.innerHTML = '';
      return;
    }

    const newCommitment = currentCommitment + derived.minPayment;
    const newRatio = income ? computeRatio(newCommitment, income) : null;

    const ratioHTML = income
      ? `
        <div class="sim-metric">
          <span class="sim-metric__label">Rasio cicilan / penghasilan</span>
          <div class="flex items-center gap-2 flex-wrap">
            ${zoneChip(currentRatio)} <span class="text-secondary">→</span> ${zoneChip(newRatio)}
          </div>
        </div>
        ${newRatio.zone === 'red' && currentRatio.zone !== 'red' ? `
          <div class="alert alert--danger mt-3" style="padding: var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);">
            ⚠️ Pinjaman ini membuat cicilanmu masuk <strong>zona Bahaya</strong> (lebih dari 50% penghasilan). Pertimbangkan lagi.
          </div>` : ''}
        ${newRatio.exceedsIncome ? `
          <div class="alert alert--danger mt-3" style="padding: var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);">
            🛑 Total cicilanmu akan <strong>melebihi penghasilanmu</strong>. Kamu tidak akan bisa membayarnya.
          </div>` : ''}
      `
      : `
        <p class="text-secondary" style="font-size: var(--font-size-sm);">
          💡 Isi penghasilanmu di dashboard untuk melihat dampak ke rasio cicilan.
        </p>
      `;

    resultEl.innerHTML = `
      <div class="card">
        <h3 class="font-bold mb-3" style="font-size: var(--font-size-lg);">Dampaknya ke keuanganmu</h3>

        <div class="sim-metric">
          <span class="sim-metric__label">Tagihan bulanan</span>
          <span><strong>${formatRupiah(currentCommitment)}</strong> <span class="text-secondary">→</span> <strong class="text-danger">${formatRupiah(newCommitment)}</strong> <span class="text-secondary">(+${formatRupiah(derived.minPayment)}/bln)</span></span>
        </div>

        <div class="sim-metric">
          <span class="sim-metric__label">Biaya pinjaman ini</span>
          <span>Total bayar <strong>${formatRupiah(derived.totalObligation)}</strong> <span class="text-secondary">= bunga ${formatRupiah(derived.totalMarkup)} (≈${derived.interestRate}%/thn)</span></span>
        </div>

        ${ratioHTML}

        <div class="flex gap-4 mt-4">
          <button type="button" class="btn btn--primary flex-1" id="sim-cancel-borrow">👍 Tidak jadi pinjam</button>
          <button type="button" class="btn btn--secondary flex-1" id="sim-record">Tetap pinjam & catat</button>
        </div>
      </div>
    `;

    resultEl.querySelector('#sim-cancel-borrow').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
    });
    resultEl.querySelector('#sim-record').addEventListener('click', () => {
      const params = new URLSearchParams({
        received: String(parseRupiah(receivedInput.value)),
        installment: String(parseRupiah(installmentInput.value)),
        tenor: tenorInput.value,
      });
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { path: `/quick-add?${params.toString()}` }
      }));
    });
  };

  [receivedInput, installmentInput].forEach(input => {
    input.addEventListener('input', () => {
      maskCurrency(input);
      renderResult();
    });
  });
  tenorInput.addEventListener('input', renderResult);

  const goDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  };
  container.querySelector('#logo-simulate').addEventListener('click', goDashboard);
  container.querySelector('#btn-back-sim').addEventListener('click', goDashboard);
}
