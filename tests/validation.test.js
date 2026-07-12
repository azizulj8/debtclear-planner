import { describe, it, expect } from 'vitest'
import { validateDebtForm } from '../src/utils/validation.js'
import { STRINGS } from '../src/data/strings.js'

describe('Validation Utils', () => {
  describe('validateDebtForm', () => {
    it('should return isValid true for valid data', () => {
      const validData = {
        name: 'Pinjol A',
        type: 'Pinjaman Online',
        principal: 1500000,
        interestRate: 12,
        minPayment: 500000,
        dueDate: 15,
      }

      const result = validateDebtForm(validData)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('should catch missing or invalid name', () => {
      const resultEmpty = validateDebtForm({ ...getValidData(), name: '' })
      expect(resultEmpty.isValid).toBe(false)
      expect(resultEmpty.errors.name).toBe(STRINGS.ERR_REQUIRED_NAME)

      const longName = 'a'.repeat(101)
      const resultLong = validateDebtForm({ ...getValidData(), name: longName })
      expect(resultLong.isValid).toBe(false)
      expect(resultLong.errors.name).toBe(STRINGS.ERR_MAX_LENGTH_NAME)
    })

    it('should catch invalid principal amounts', () => {
      const resultZero = validateDebtForm({ ...getValidData(), principal: 0 })
      expect(resultZero.isValid).toBe(false)
      expect(resultZero.errors.principal).toBe(STRINGS.ERR_INVALID_PRINCIPAL)

      const resultNegative = validateDebtForm({ ...getValidData(), principal: -1000 })
      expect(resultNegative.isValid).toBe(false)
      expect(resultNegative.errors.principal).toBe(STRINGS.ERR_INVALID_PRINCIPAL)

      const resultString = validateDebtForm({ ...getValidData(), principal: '1000' })
      expect(resultString.isValid).toBe(false)
      expect(resultString.errors.principal).toBe(STRINGS.ERR_INVALID_PRINCIPAL)
    })

    it('should catch invalid interest rates', () => {
      const resultNegative = validateDebtForm({ ...getValidData(), interestRate: -1 })
      expect(resultNegative.isValid).toBe(false)
      expect(resultNegative.errors.interestRate).toBe(STRINGS.ERR_INVALID_INTEREST)

      const resultTooHigh = validateDebtForm({ ...getValidData(), interestRate: 101 })
      expect(resultTooHigh.isValid).toBe(false)
      expect(resultTooHigh.errors.interestRate).toBe(STRINGS.ERR_INVALID_INTEREST)
    })

    it('should catch invalid due date', () => {
      const resultNegative = validateDebtForm({ ...getValidData(), dueDate: 0 })
      expect(resultNegative.isValid).toBe(false)
      expect(resultNegative.errors.dueDate).toBe(STRINGS.ERR_INVALID_DUE_DATE)

      const resultTooHigh = validateDebtForm({ ...getValidData(), dueDate: 32 })
      expect(resultTooHigh.isValid).toBe(false)
      expect(resultTooHigh.errors.dueDate).toBe(STRINGS.ERR_INVALID_DUE_DATE)
    })
  })
})

function getValidData() {
  return {
    name: 'Test Debt',
    type: 'KPR',
    principal: 1000000,
    interestRate: 10,
    minPayment: 100000,
    dueDate: 5,
  }
}
