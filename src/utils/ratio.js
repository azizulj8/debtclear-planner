/**
 * Debt-to-income ratio ("Takar") calculations.
 * Zones follow the OJK-style credit affordability anchor:
 * green <30%, yellow 30-50%, red >50%.
 */

const INCOME_STORAGE_KEY = 'debtclear_income';

/**
 * Total monthly installment commitment across active debts.
 * @param {Array} debts
 * @returns {number}
 */
export function getMonthlyCommitment(debts) {
  return debts
    .filter(d => !d.isPaidOff)
    .reduce((sum, d) => sum + d.minPayment, 0);
}

/**
 * Computes the debt-to-income ratio and its zone.
 * @param {number} commitment - Total monthly installments
 * @param {number} income - Monthly income
 * @returns {{pct: number, zone: 'green'|'yellow'|'red', exceedsIncome: boolean}|null}
 *   null when income is missing or invalid
 */
export function computeRatio(commitment, income) {
  if (typeof income !== 'number' || isNaN(income) || income <= 0) return null;
  const pct = (commitment / income) * 100;
  let zone = 'green';
  if (pct > 50) zone = 'red';
  else if (pct >= 30) zone = 'yellow';
  return {
    pct: Math.round(pct),
    zone,
    exceedsIncome: pct > 100,
  };
}

/**
 * Reads the stored monthly income (device-local only).
 * @returns {number|null}
 */
export function getStoredIncome() {
  const raw = localStorage.getItem(INCOME_STORAGE_KEY);
  const value = raw ? parseInt(raw, 10) : NaN;
  return !isNaN(value) && value > 0 ? value : null;
}

/**
 * Stores the monthly income locally; pass null/0 to clear it.
 * @param {number|null} income
 */
export function setStoredIncome(income) {
  if (typeof income === 'number' && income > 0) {
    localStorage.setItem(INCOME_STORAGE_KEY, String(income));
  } else {
    localStorage.removeItem(INCOME_STORAGE_KEY);
  }
}
