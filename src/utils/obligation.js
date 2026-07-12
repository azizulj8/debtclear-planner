/**
 * Model A "sisa kewajiban" calculations.
 * Total obligation = fixed installment (minPayment) x tenor.
 * Each recorded payment reduces the obligation by one installment.
 * Debts without tenor have no computed obligation (returns null).
 */

/**
 * Total amount the user must pay over the loan's lifetime.
 * @param {Object} debt
 * @returns {number|null} Total obligation, or null when the debt has no tenor
 */
export function getTotalObligation(debt) {
  if (!debt.tenorMonths || debt.tenorMonths <= 0) return null;
  return debt.minPayment * debt.tenorMonths;
}

/**
 * Number of installments considered paid: payments made before the debt
 * was recorded (priorPayments) plus payments recorded in the app.
 * @param {Object} debt
 * @param {number} recordedPayments - Count of payment records in the app
 * @returns {number}
 */
export function getPaidInstallments(debt, recordedPayments = 0) {
  return (debt.priorPayments || 0) + recordedPayments;
}

/**
 * Remaining amount to pay under Model A, never below zero.
 * @param {Object} debt
 * @param {number} recordedPayments - Count of payment records in the app
 * @returns {number|null} Remaining obligation, or null when the debt has no tenor
 */
export function getRemainingObligation(debt, recordedPayments = 0) {
  const total = getTotalObligation(debt);
  if (total === null) return null;
  const paid = getPaidInstallments(debt, recordedPayments) * debt.minPayment;
  return Math.max(0, total - paid);
}

/**
 * A tenor debt is fully paid when paid installments reach the tenor.
 * @param {Object} debt
 * @param {number} recordedPayments - Count of payment records in the app
 * @returns {boolean}
 */
export function isFullyPaid(debt, recordedPayments = 0) {
  if (!debt.tenorMonths || debt.tenorMonths <= 0) return false;
  return getPaidInstallments(debt, recordedPayments) >= debt.tenorMonths;
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1); // month index m = next month
  return toMonthKey(d);
}

/**
 * Builds the month-by-month installment schedule of a tenor debt.
 * Rows cover the remaining installments after priorPayments, starting from
 * the earliest recorded payment (or the current month if none/later).
 *
 * @param {Object} debt
 * @param {Array} payments - Payment records ({ month: "YYYY-MM", paidAt, amount })
 * @param {Date} [now]
 * @returns {Array|null} Rows { month, status: 'paid'|'late'|'due'|'upcoming', amount, paidAt? },
 *   or null when the debt has no tenor
 */
export function buildInstallmentSchedule(debt, payments = [], now = new Date()) {
  if (!debt.tenorMonths || debt.tenorMonths <= 0) return null;

  const rowsNeeded = debt.tenorMonths - (debt.priorPayments || 0);
  if (rowsNeeded <= 0) return [];

  const paidByMonth = new Map(payments.map(p => [p.month, p]));
  const currentKey = toMonthKey(now);
  const paidMonths = payments.map(p => p.month).sort();
  let key = paidMonths.length && paidMonths[0] < currentKey ? paidMonths[0] : currentKey;

  const rows = [];
  while (rows.length < rowsNeeded) {
    const payment = paidByMonth.get(key);
    if (payment) {
      rows.push({ month: key, status: 'paid', amount: payment.amount, paidAt: payment.paidAt });
    } else if (key < currentKey) {
      rows.push({ month: key, status: 'late', amount: debt.minPayment });
    } else if (key === currentKey) {
      rows.push({
        month: key,
        status: now.getDate() > debt.dueDate ? 'late' : 'due',
        amount: debt.minPayment,
      });
    } else {
      rows.push({ month: key, status: 'upcoming', amount: debt.minPayment });
    }
    key = nextMonthKey(key);
  }
  return rows;
}
