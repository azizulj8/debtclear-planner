import { STRINGS } from '../data/strings.js'

/**
 * Validates the debt form data.
 * @param {Object} data - The form data
 * @param {string} data.name - Debt name
 * @param {string} data.type - Debt type
 * @param {number} data.principal - Remaining principal amount
 * @param {number} data.interestRate - Annual interest rate (0-100)
 * @param {number} data.minPayment - Minimum monthly payment
 * @param {number} data.dueDate - Due date day (1-31)
 * @returns {Object} Object containing an isValid boolean and an errors object map
 */
export function validateDebtForm(data) {
  const errors = {}

  if (!data.name || data.name.trim() === '') {
    errors.name = STRINGS.ERR_REQUIRED_NAME
  } else if (data.name.length > 100) {
    errors.name = STRINGS.ERR_MAX_LENGTH_NAME
  }

  if (!data.type) {
    errors.type = STRINGS.ERR_REQUIRED_TYPE
  }

  if (typeof data.principal !== 'number' || isNaN(data.principal) || data.principal <= 0) {
    errors.principal = STRINGS.ERR_INVALID_PRINCIPAL
  }

  // Ceiling 600%: annualized daily pinjol rates legitimately exceed 100%/yr
  if (
    typeof data.interestRate !== 'number' ||
    isNaN(data.interestRate) ||
    data.interestRate < 0 ||
    data.interestRate > 600
  ) {
    errors.interestRate = STRINGS.ERR_INVALID_INTEREST
  }

  if (typeof data.minPayment !== 'number' || isNaN(data.minPayment) || data.minPayment <= 0) {
    errors.minPayment = STRINGS.ERR_INVALID_MIN_PAYMENT
  }

  if (
    typeof data.dueDate !== 'number' ||
    isNaN(data.dueDate) ||
    data.dueDate < 1 ||
    data.dueDate > 31
  ) {
    errors.dueDate = STRINGS.ERR_INVALID_DUE_DATE
  }

  // Tenor is optional; validate only when provided
  if (data.tenorMonths !== null && data.tenorMonths !== undefined) {
    if (
      typeof data.tenorMonths !== 'number' ||
      isNaN(data.tenorMonths) ||
      data.tenorMonths < 1 ||
      data.tenorMonths > 600
    ) {
      errors.tenorMonths = STRINGS.ERR_INVALID_TENOR
    }
  }

  // Prior payments is optional; must be >= 0 and below the tenor (a debt
  // whose installments are all paid should not be recorded as active)
  if (data.priorPayments !== null && data.priorPayments !== undefined) {
    const invalidNumber =
      typeof data.priorPayments !== 'number' ||
      isNaN(data.priorPayments) ||
      data.priorPayments < 0
    const exceedsTenor =
      typeof data.tenorMonths === 'number' &&
      !isNaN(data.tenorMonths) &&
      data.priorPayments >= data.tenorMonths
    if (invalidNumber || exceedsTenor) {
      errors.priorPayments = STRINGS.ERR_INVALID_PRIOR_PAYMENTS
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
