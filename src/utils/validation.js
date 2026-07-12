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

  if (
    typeof data.interestRate !== 'number' ||
    isNaN(data.interestRate) ||
    data.interestRate < 0 ||
    data.interestRate > 100
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
