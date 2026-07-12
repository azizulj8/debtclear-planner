import { formatRupiah } from '../utils/format.js';
import {
  getAllDebts,
  getMonthKey,
  getPaymentsByMonth,
  markBillPaid,
  unmarkBillPaid,
} from '../utils/storage.js';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Renders the combined monthly bills panel: every active debt's installment
 * for the viewed month across all providers, with a paid/unpaid checklist.
 * @param {HTMLElement} container
 * @param {Array} debts - All debts
 * @param {Function} [onChange] - Called after a bill is (un)marked as paid
 */
export function renderMonthlyBills(container, debts, onChange) {
  // Month being viewed, offset from the current month
  let monthOffset = 0;

  const render = async () => {
    const viewedDate = new Date();
    viewedDate.setDate(1);
    viewedDate.setMonth(viewedDate.getMonth() + monthOffset);
    const monthKey = getMonthKey(viewedDate);
    const monthLabel = `${MONTH_NAMES[viewedDate.getMonth()]} ${viewedDate.getFullYear()}`;
    const isCurrentMonth = monthOffset === 0;

    // Re-fetch so auto-paid-off debts drop out immediately
    try {
      debts = await getAllDebts();
    } catch (err) {
      console.error('Failed to reload debts:', err);
    }

    let payments = [];
    try {
      payments = await getPaymentsByMonth(monthKey);
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
    const paidByDebtId = new Map(payments.map(p => [p.debtId, p]));

    // Show active debts, plus paid-off debts that have a payment recorded
    // in the viewed month (so history stays visible and un-checkable)
    const activeDebts = debts
      .filter(d => !d.isPaidOff || paidByDebtId.has(d.id))
      .sort((a, b) => a.dueDate - b.dueDate || a.name.localeCompare(b.name));

    if (activeDebts.length === 0) {
      container.innerHTML = '';
      return;
    }

    const totalBill = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);
    const totalPaid = activeDebts.reduce(
      (sum, d) => sum + (paidByDebtId.has(d.id) ? d.minPayment : 0), 0
    );
    const remaining = totalBill - totalPaid;
    const paidCount = activeDebts.filter(d => paidByDebtId.has(d.id)).length;
    const progressPct = totalBill > 0 ? Math.round((totalPaid / totalBill) * 100) : 0;
    const allPaid = paidCount === activeDebts.length;

    const today = new Date();
    const todayDay = today.getDate();

    const rowsHTML = activeDebts.map(debt => {
      const payment = paidByDebtId.get(debt.id);
      const isPaid = !!payment;
      const isOverdue = isCurrentMonth && !isPaid && debt.dueDate < todayDay;
      const isDueSoon = isCurrentMonth && !isPaid && !isOverdue && debt.dueDate - todayDay <= 3;

      let statusBadge = '';
      if (isPaid) {
        const paidDateStr = new Date(payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        statusBadge = `<span class="badge badge--success">✓ Dibayar ${paidDateStr}</span>`;
      } else if (isOverdue) {
        statusBadge = `<span class="badge badge--danger">Terlambat</span>`;
      } else if (isDueSoon) {
        statusBadge = `<span class="badge badge--warning">Segera Jatuh Tempo</span>`;
      }

      return `
        <label class="bill-row ${isPaid ? 'bill-row--paid' : ''} ${isOverdue ? 'bill-row--overdue' : ''}">
          <input type="checkbox" class="bill-checkbox" data-id="${debt.id}" ${isPaid ? 'checked' : ''} />
          <div class="bill-row__info">
            <div class="flex items-center gap-2" style="flex-wrap: wrap;">
              <span class="bill-row__name">${debt.name}</span>
              ${statusBadge}
            </div>
            <span class="bill-row__meta text-secondary">Jatuh tempo tgl ${debt.dueDate} · ${debt.type}</span>
          </div>
          <span class="bill-row__amount font-bold ${isPaid ? 'text-secondary' : ''}">${formatRupiah(debt.minPayment)}</span>
        </label>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card monthly-bills-card mb-6">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold" style="font-size: var(--font-size-lg);">🧾 Tagihan Bulan Ini</h3>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn--secondary btn--sm" id="bills-prev-month" title="Bulan sebelumnya">◀</button>
            <span class="font-bold" style="min-width: 130px; text-align: center; font-size: var(--font-size-sm);">${monthLabel}</span>
            <button type="button" class="btn btn--secondary btn--sm" id="bills-next-month" title="Bulan berikutnya">▶</button>
          </div>
        </div>

        <div class="bills-summary grid-2 gap-4 mb-3">
          <div>
            <span class="text-secondary" style="font-size: var(--font-size-xs); display:block;">Total Tagihan (${activeDebts.length} utang)</span>
            <span class="font-bold" style="font-size: var(--font-size-lg);">${formatRupiah(totalBill)}</span>
          </div>
          <div>
            <span class="text-secondary" style="font-size: var(--font-size-xs); display:block;">Sisa Belum Dibayar</span>
            <span class="font-bold ${remaining > 0 ? 'text-danger' : 'text-primary'}" style="font-size: var(--font-size-lg);">${formatRupiah(remaining)}</span>
          </div>
        </div>

        <div class="bills-progress mb-4">
          <div class="bills-progress__track">
            <div class="bills-progress__fill" style="width: ${progressPct}%;"></div>
          </div>
          <span class="text-secondary" style="font-size: var(--font-size-xs);">${paidCount}/${activeDebts.length} tagihan dibayar (${progressPct}%)</span>
          ${allPaid ? `<div class="alert alert--success mt-2" style="padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-md); font-size: var(--font-size-sm);">🎉 Semua tagihan bulan ${monthLabel} sudah dibayar!</div>` : ''}
        </div>

        <div class="bills-list">
          ${rowsHTML}
        </div>
      </div>
    `;

    // Month navigation
    container.querySelector('#bills-prev-month').addEventListener('click', () => {
      monthOffset -= 1;
      render();
    });
    container.querySelector('#bills-next-month').addEventListener('click', () => {
      monthOffset += 1;
      render();
    });

    // Paid/unpaid checklist
    container.querySelectorAll('.bill-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const debtId = parseInt(e.target.getAttribute('data-id'), 10);
        const debt = activeDebts.find(d => d.id === debtId);
        if (!debt) return;

        try {
          if (e.target.checked) {
            await markBillPaid(debtId, monthKey, debt.minPayment);
          } else {
            await unmarkBillPaid(debtId, monthKey);
          }
        } catch (err) {
          console.error('Failed to update payment status:', err);
          alert('Gagal menyimpan status pembayaran.');
        }

        await render();
        if (onChange) onChange();
      });
    });
  };

  render();
}
