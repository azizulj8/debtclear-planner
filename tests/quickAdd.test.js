import { describe, it, expect } from 'vitest'
import { deriveDebtFromQuickAdd } from '../src/utils/quickAdd.js'

describe('Quick-Add Utils', () => {
  it('should derive full debt fields from the three pinjol numbers', () => {
    // Pinjam 1jt, bayar 3x Rp 410rb
    const d = deriveDebtFromQuickAdd({ amountReceived: 1000000, installment: 410000, tenorMonths: 3 })
    expect(d.principal).toBe(1000000)
    expect(d.minPayment).toBe(410000)
    expect(d.tenorMonths).toBe(3)
    expect(d.totalObligation).toBe(1230000)
    expect(d.totalMarkup).toBe(230000)
    expect(d.interestRate).toBe(92) // 23% markup over 3 months, annualized
  })

  it('should return zero markup when total equals received', () => {
    const d = deriveDebtFromQuickAdd({ amountReceived: 1200000, installment: 400000, tenorMonths: 3 })
    expect(d.totalMarkup).toBe(0)
    expect(d.interestRate).toBe(0)
  })

  it('should never produce negative markup', () => {
    const d = deriveDebtFromQuickAdd({ amountReceived: 2000000, installment: 400000, tenorMonths: 3 })
    expect(d.totalMarkup).toBe(0)
  })

  it('should cap the annualized rate at 600', () => {
    // Extreme: pinjam 100rb, bayar 1x 200rb → 1200%/yr uncapped
    const d = deriveDebtFromQuickAdd({ amountReceived: 100000, installment: 200000, tenorMonths: 1 })
    expect(d.interestRate).toBe(600)
  })

  it('should return null for missing or invalid inputs', () => {
    expect(deriveDebtFromQuickAdd({ amountReceived: 0, installment: 1, tenorMonths: 1 })).toBeNull()
    expect(deriveDebtFromQuickAdd({ amountReceived: 1, installment: 0, tenorMonths: 1 })).toBeNull()
    expect(deriveDebtFromQuickAdd({ amountReceived: 1, installment: 1, tenorMonths: 0 })).toBeNull()
  })
})
