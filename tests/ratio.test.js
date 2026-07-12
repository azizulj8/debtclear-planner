import { describe, it, expect } from 'vitest'
import { getMonthlyCommitment, computeRatio } from '../src/utils/ratio.js'

describe('Ratio Utils (Takar)', () => {
  describe('getMonthlyCommitment', () => {
    it('should sum minPayment of active debts only', () => {
      const debts = [
        { minPayment: 1000000, isPaidOff: false },
        { minPayment: 500000, isPaidOff: true },
        { minPayment: 300000, isPaidOff: false },
      ]
      expect(getMonthlyCommitment(debts)).toBe(1300000)
    })

    it('should return 0 for empty list', () => {
      expect(getMonthlyCommitment([])).toBe(0)
    })
  })

  describe('computeRatio', () => {
    it('should return null without valid income', () => {
      expect(computeRatio(1000000, 0)).toBeNull()
      expect(computeRatio(1000000, null)).toBeNull()
      expect(computeRatio(1000000, NaN)).toBeNull()
    })

    it('should classify below 30% as green', () => {
      const r = computeRatio(1450000, 5000000) // 29%
      expect(r.pct).toBe(29)
      expect(r.zone).toBe('green')
    })

    it('should classify 30-50% as yellow', () => {
      expect(computeRatio(1500000, 5000000).zone).toBe('yellow') // 30%
      expect(computeRatio(2500000, 5000000).zone).toBe('yellow') // 50%
    })

    it('should classify above 50% as red', () => {
      expect(computeRatio(2600000, 5000000).zone).toBe('red') // 52%
    })

    it('should flag ratios above 100%', () => {
      const r = computeRatio(6000000, 5000000)
      expect(r.exceedsIncome).toBe(true)
      expect(r.zone).toBe('red')
    })

    it('should handle zero commitment as 0% green', () => {
      const r = computeRatio(0, 5000000)
      expect(r.pct).toBe(0)
      expect(r.zone).toBe('green')
      expect(r.exceedsIncome).toBe(false)
    })
  })
})
