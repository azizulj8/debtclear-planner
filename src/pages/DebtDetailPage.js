import { STRINGS } from '../data/strings.js';
import { formatRupiah } from '../utils/format.js';
import { getDebt, getPaymentsByDebt } from '../utils/storage.js';
import {
  getTotalObligation,
  getPaidInstallments,
  getRemainingObligation,
  buildInstallmentSchedule,
} from '../utils/obligation.js';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function paidDateLabel(paidAt) {
  return new Date(paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Renders the detail page of a single debt: remaining obligation,
 * installment progress, month-by-month schedule (tenor debts) and
 * payment history (all debts).
 * @param {HTMLElement} container
 */
export async function renderDebtDetailPage(container) {
  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get('id'), 10);

  const debt = !isNaN(id) ? await getDebt(id) : null;
  if (!debt) {
    alert('Utang tidak ditemukan!');
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
    return;
  }

  const payments = await getPaymentsByDebt(id); // newest first
  const hasTenor = !!debt.tenorMonths;

  const remaining = getRemainingObligation(debt, payments.length);
  const totalObligation = getTotalObligation(debt);
  const paidCount = getPaidInstallments(debt, payments.length);
  const progressPct = hasTenor
    ? Math.min(100, Math.round((paidCount / debt.tenorMonths) * 100))
    : 0;

  // --- Schedule section (tenor debts only) ---
  let scheduleHTML = '';
  if (hasTenor) {
    const schedule = buildInstallmentSchedule(debt, payments) || [];
    const priorNote = debt.priorPayments
      ? `<div class="schedule-row schedule-row--prior">
           <span class="text-secondary" style="font-size: var(--font-size-sm);">✓ ${debt.priorPayments} cicilan dibayar sebelum dicatat di aplikasi</span>
         </div>`
      : '';

    const rowsHTML = schedule.map(row => {
      let statusHTML = '';
      let rowClass = '';
      if (row.status === 'paid') {
        statusHTML = `<span class="badge badge--success">✓ Dibayar ${paidDateLabel(row.paidAt)}</span>`;
        rowClass = 'schedule-row--paid';
      } else if (row.status === 'late') {
        statusHTML = '<span class="badge badge--danger">Terlambat</span>';
        rowClass = 'schedule-row--late';
      } else if (row.status === 'due') {
        statusHTML = '<span class="badge badge--warning">Bulan Ini</span>';
      }
      return `
        <div class="schedule-row ${rowClass}">
          <span class="schedule-row__month">${monthLabel(row.month)}</span>
          <span class="schedule-row__status">${statusHTML}</span>
          <span class="schedule-row__amount font-bold">${formatRupiah(row.amount)}</span>
        </div>
      `;
    }).join('');

    scheduleHTML = `
      <div class="card mb-6">
        <h3 class="font-bold mb-3" style="font-size: var(--font-size-lg);">📅 Jadwal Cicilan</h3>
        <div class="schedule-list">
          ${priorNote}
          ${rowsHTML || '<p class="text-secondary">Semua cicilan sudah selesai. 🎉</p>'}
        </div>
      </div>
    `;
  }

  // --- Payment history (no-tenor debts; tenor debts see it in the schedule) ---
  let historyHTML = '';
  if (!hasTenor) {
    const rows = payments.map(p => `
      <div class="schedule-row schedule-row--paid">
        <span class="schedule-row__month">${monthLabel(p.month)}</span>
        <span class="schedule-row__status"><span class="badge badge--success">✓ ${paidDateLabel(p.paidAt)}</span></span>
        <span class="schedule-row__amount font-bold">${formatRupiah(p.amount)}</span>
      </div>
    `).join('');

    historyHTML = `
      <div class="card mb-6">
        <h3 class="font-bold mb-3" style="font-size: var(--font-size-lg);">🧾 Riwayat Pembayaran</h3>
        ${rows || '<p class="text-secondary">Belum ada pembayaran tercatat untuk utang ini.</p>'}
      </div>
    `;
  }

  // --- Summary numbers ---
  const summaryHTML = hasTenor
    ? `
      <div class="grid-2 gap-4 mb-4">
        <div>
          <span class="text-secondary" style="font-size: var(--font-size-xs); display:block;">Sisa Kewajiban</span>
          <span class="font-bold ${remaining === 0 ? 'text-primary' : ''}" style="font-size: var(--font-size-xl);">${formatRupiah(remaining)}</span>
        </div>
        <div>
          <span class="text-secondary" style="font-size: var(--font-size-xs); display:block;">Total Kewajiban</span>
          <span class="font-bold" style="font-size: var(--font-size-xl);">${formatRupiah(totalObligation)}</span>
        </div>
      </div>
      <div class="bills-progress mb-2">
        <div class="bills-progress__track">
          <div class="bills-progress__fill" style="width: ${progressPct}%;"></div>
        </div>
        <span class="text-secondary" style="font-size: var(--font-size-xs);">${Math.min(paidCount, debt.tenorMonths)}/${debt.tenorMonths} cicilan dibayar (${progressPct}%)</span>
      </div>
    `
    : `
      <div class="mb-4">
        <span class="text-secondary" style="font-size: var(--font-size-xs); display:block;">Sisa Pokok (diperbarui manual lewat Edit)</span>
        <span class="font-bold" style="font-size: var(--font-size-xl);">${formatRupiah(debt.principal)}</span>
      </div>
    `;

  container.innerHTML = `
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <div class="brand-logo" id="logo-detail" style="cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${STRINGS.APP_NAME}
        </div>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-back-dashboard">← Dashboard</button>
      </div>
    </header>

    <main class="container mt-4 mb-12" style="max-width: 720px;">
      <div class="card mb-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 style="font-size: var(--font-size-xl); font-weight: 700;">${debt.name}</h1>
            <span class="badge badge--gray mt-1">${debt.type}</span>
            ${debt.isPaidOff ? `<span class="badge badge--success mt-1">${STRINGS.LIST_BADGE_LUNAS}</span>` : ''}
          </div>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-edit-detail">${STRINGS.LIST_BTN_EDIT}</button>
        </div>

        ${summaryHTML}

        <div class="grid-2 gap-4 mt-4" style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-4);">
          <div class="debt-card__info-group">
            <span class="debt-card__info-label">Sisa Pokok</span>
            <span class="debt-card__info-value">${formatRupiah(debt.principal)}</span>
          </div>
          <div class="debt-card__info-group">
            <span class="debt-card__info-label">${STRINGS.LIST_LABEL_MIN_PAYMENT}</span>
            <span class="debt-card__info-value">${formatRupiah(debt.minPayment)}</span>
          </div>
          <div class="debt-card__info-group">
            <span class="debt-card__info-label">${STRINGS.LIST_LABEL_INTEREST}</span>
            <span class="debt-card__info-value">${debt.interestRate}% / thn</span>
          </div>
          <div class="debt-card__info-group">
            <span class="debt-card__info-label">${STRINGS.LIST_LABEL_DUE_DATE}</span>
            <span class="debt-card__info-value">${debt.dueDate}</span>
          </div>
          ${hasTenor ? `
          <div class="debt-card__info-group">
            <span class="debt-card__info-label">Tenor</span>
            <span class="debt-card__info-value">${debt.tenorMonths} bulan</span>
          </div>
          ` : ''}
        </div>
      </div>

      ${scheduleHTML}
      ${historyHTML}
    </main>
  `;

  const goDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/dashboard' } }));
  };
  container.querySelector('#btn-back-dashboard').addEventListener('click', goDashboard);
  container.querySelector('#logo-detail').addEventListener('click', goDashboard);
  container.querySelector('#btn-edit-detail').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/edit-debt?id=${debt.id}` } }));
  });
}
