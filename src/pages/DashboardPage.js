import { renderAppShell } from '../components/AppShell.js';
import { renderIncomeRatio } from '../components/IncomeRatio.js';
import { formatRupiah } from '../utils/format.js';
import { getAllDebts, getPaymentsByMonth, getMonthKey } from '../utils/storage.js';
import { calculatePayoffSchedule } from '../utils/strategy.js';

const navigate = (path) => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path } }));
};

/**
 * Dashboard overview: Takar meter, headline stats, and quick actions.
 * Detailed features live on their own menu pages (Tagihan, Utang Saya,
 * Strategi, Audit, Simulasi).
 * @param {HTMLElement} container
 */
export async function renderDashboardPage(container) {
  const content = await renderAppShell(container, { title: 'Dashboard', active: 'dashboard' });

  let debts = [];
  let payments = [];
  try {
    debts = await getAllDebts();
    payments = await getPaymentsByMonth(getMonthKey());
  } catch (err) {
    console.error('Failed to load data:', err);
  }

  const activeDebts = debts.filter(d => !d.isPaidOff);
  const totalPrincipal = activeDebts.reduce((s, d) => s + d.principal, 0);
  const monthlyBill = activeDebts.reduce((s, d) => s + d.minPayment, 0);
  const paidDebtIds = new Set(payments.map(p => p.debtId));
  const remainingBill = activeDebts.reduce(
    (s, d) => s + (paidDebtIds.has(d.id) ? 0 : d.minPayment), 0
  );

  const strategy = localStorage.getItem('debtclear_strategy') || 'snowball';
  const extra = parseInt(localStorage.getItem('debtclear_extra_payment') || '0', 10);
  const payoff = calculatePayoffSchedule(debts, strategy, extra);
  const freeDate = payoff.isInfinite
    ? '∞'
    : (payoff.schedule.length ? payoff.schedule[payoff.schedule.length - 1].month : '—');

  content.innerHTML = `
    <div id="privacy-notice-container"></div>
    <div id="income-ratio-container"></div>

    <div class="stat-grid mb-6">
      <div class="card">
        <div class="stat-card__label">💳 Total Utang Aktif</div>
        <div class="stat-card__value text-primary">${formatRupiah(totalPrincipal)}</div>
        <span class="text-secondary" style="font-size: var(--font-size-xs);">${activeDebts.length} utang tercatat</span>
      </div>
      <div class="card">
        <div class="stat-card__label">🧾 Tagihan Bulan Ini</div>
        <div class="stat-card__value">${formatRupiah(monthlyBill)}</div>
        <span class="text-secondary" style="font-size: var(--font-size-xs);">Sisa belum dibayar: <strong class="${remainingBill > 0 ? 'text-danger' : 'text-primary'}">${formatRupiah(remainingBill)}</strong></span>
      </div>
      <div class="card">
        <div class="stat-card__label">🎯 Bebas Utang Pada</div>
        <div class="stat-card__value ${payoff.isInfinite ? 'text-danger' : ''}">${freeDate}</div>
        <span class="text-secondary" style="font-size: var(--font-size-xs);">${payoff.isInfinite ? 'Cicilan belum menutup bunga' : `${payoff.months} bulan lagi · total bunga ${formatRupiah(payoff.totalInterest)}`}</span>
      </div>
    </div>

    <h3 class="font-bold mb-3" style="font-size: var(--font-size-md);">Aksi Cepat</h3>
    <div class="quick-actions mb-6">
      <button type="button" class="btn btn--primary" data-nav="/quick-add">⚡ Catat Pinjaman</button>
      <button type="button" class="btn btn--secondary" data-nav="/bills">🧾 Bayar Tagihan</button>
      <button type="button" class="btn btn--secondary" data-nav="/audit">🔍 Audit Utang</button>
      <button type="button" class="btn btn--secondary" data-nav="/simulate">🧮 Mau Pinjam Lagi?</button>
    </div>

    ${activeDebts.length === 0 ? `
      <div class="card text-center" style="padding: var(--spacing-8);">
        <h3 class="font-bold mb-2">Belum ada utang tercatat</h3>
        <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">Mulai dengan audit 2 menit untuk menemukan semua pinjamanmu, atau catat satu pinjaman sekarang.</p>
        <div class="flex gap-2 justify-center flex-wrap">
          <button type="button" class="btn btn--primary" data-nav="/audit">🔍 Mulai Audit</button>
          <button type="button" class="btn btn--secondary" data-nav="/quick-add">⚡ Catat Cepat</button>
        </div>
      </div>
    ` : ''}
  `;

  // One-time privacy/storage notice
  const noticeContainer = content.querySelector('#privacy-notice-container');
  if (!localStorage.getItem('debtclear_privacy_notice_dismissed')) {
    noticeContainer.innerHTML = `
      <div class="card mb-6" style="border-left: 4px solid var(--color-info);">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h3 class="font-bold mb-1" style="font-size: var(--font-size-md);">🔒 Datamu 100% di perangkat ini</h3>
            <p class="text-secondary" style="font-size: var(--font-size-sm);">
              DebtClear bisa dipakai <strong>anonim tanpa daftar</strong> — semua data utangmu tersimpan
              di HP/browser-mu sendiri, tidak pernah dikirim ke server kami.
              Konsekuensinya: data akan <strong>hilang jika kamu menghapus data situs browser</strong>
              (bukan sekadar cache) atau uninstall aplikasi. Ingin aman antar-perangkat?
              Login + upgrade Pro untuk backup cloud otomatis.
            </p>
          </div>
          <button type="button" class="btn btn--secondary btn--sm" id="privacy-notice-dismiss" title="Tutup">✕</button>
        </div>
      </div>
    `;
    noticeContainer.querySelector('#privacy-notice-dismiss').addEventListener('click', () => {
      localStorage.setItem('debtclear_privacy_notice_dismissed', '1');
      noticeContainer.innerHTML = '';
    });
  }

  renderIncomeRatio(content.querySelector('#income-ratio-container'), debts);

  content.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.getAttribute('data-nav')));
  });
}
