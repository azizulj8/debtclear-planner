/**
 * Quick-add "bahasa pinjol" conversion.
 * Pinjol never quotes an annual rate; users know three numbers:
 * how much they received, how much they pay per installment, and
 * how many installments. This derives the debt-record fields.
 */

/**
 * Derives full debt fields from the three quick-add numbers.
 * Annual rate is a simple annualization of the total markup —
 * good enough for strategy sorting; Model A drives everything else.
 *
 * @param {Object} input
 * @param {number} input.amountReceived - Cash the user actually received
 * @param {number} input.installment - Payment per installment (monthly)
 * @param {number} input.tenorMonths - Number of installments
 * @returns {{principal: number, minPayment: number, tenorMonths: number,
 *   interestRate: number, totalObligation: number, totalMarkup: number}|null}
 *   null when any input is missing/invalid
 */
export function deriveDebtFromQuickAdd({ amountReceived, installment, tenorMonths }) {
  if (
    !amountReceived || amountReceived <= 0 ||
    !installment || installment <= 0 ||
    !tenorMonths || tenorMonths <= 0
  ) {
    return null;
  }

  const totalObligation = installment * tenorMonths;
  const totalMarkup = Math.max(0, totalObligation - amountReceived);
  // Simple annualized rate from the total markup over the tenor,
  // capped at the validation ceiling (pinjol rates can exceed 100%/yr)
  const interestRate = Math.min(
    600,
    Math.round((totalMarkup / amountReceived) * (12 / tenorMonths) * 100 * 10) / 10
  );

  return {
    principal: amountReceived,
    minPayment: installment,
    tenorMonths,
    interestRate,
    totalObligation,
    totalMarkup,
  };
}
