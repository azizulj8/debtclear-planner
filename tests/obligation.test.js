import { describe, it, expect } from 'vitest'
import {
  getTotalObligation,
  getPaidInstallments,
  getRemainingObligation,
  isFullyPaid,
  buildInstallmentSchedule,
} from '../src/utils/obligation.js'

const tenorDebt = { minPayment: 1230000, tenorMonths: 3, priorPayments: 0 }
const noTenorDebt = { minPayment: 500000, tenorMonths: null }

describe('Obligation Utils (Model A)', () => {
  describe('getTotalObligation', () => {
    it('should compute installment x tenor', () => {
      expect(getTotalObligation(tenorDebt)).toBe(3690000)
    })

    it('should return null for debts without tenor', () => {
      expect(getTotalObligation(noTenorDebt)).toBeNull()
    })
  })

  describe('getPaidInstallments', () => {
    it('should add prior payments to recorded payments', () => {
      expect(getPaidInstallments({ ...tenorDebt, priorPayments: 2 }, 1)).toBe(3)
    })

    it('should treat missing priorPayments as zero', () => {
      expect(getPaidInstallments({ minPayment: 100, tenorMonths: 6 }, 2)).toBe(2)
    })
  })

  describe('getRemainingObligation', () => {
    it('should reduce by one installment per payment', () => {
      expect(getRemainingObligation(tenorDebt, 1)).toBe(2460000)
    })

    it('should include prior payments in the reduction', () => {
      expect(getRemainingObligation({ ...tenorDebt, priorPayments: 2 }, 0)).toBe(1230000)
    })

    it('should never go below zero', () => {
      expect(getRemainingObligation(tenorDebt, 10)).toBe(0)
    })

    it('should return null for debts without tenor', () => {
      expect(getRemainingObligation(noTenorDebt, 2)).toBeNull()
    })
  })

  describe('isFullyPaid', () => {
    it('should be false while installments remain', () => {
      expect(isFullyPaid(tenorDebt, 2)).toBe(false)
    })

    it('should be true when payments reach the tenor', () => {
      expect(isFullyPaid(tenorDebt, 3)).toBe(true)
    })

    it('should combine prior and recorded payments', () => {
      expect(isFullyPaid({ ...tenorDebt, priorPayments: 2 }, 1)).toBe(true)
    })

    it('should never be true for debts without tenor', () => {
      expect(isFullyPaid(noTenorDebt, 99)).toBe(false)
    })
  })

  describe('buildInstallmentSchedule', () => {
    const debt = { minPayment: 1000, tenorMonths: 3, dueDate: 5, priorPayments: 0 }
    const now = new Date(2026, 6, 12) // 12 Juli 2026 (after due day 5)

    it('should return null for debts without tenor', () => {
      expect(buildInstallmentSchedule(noTenorDebt, [], now)).toBeNull()
    })

    it('should start from current month with no payments', () => {
      const rows = buildInstallmentSchedule(debt, [], now)
      expect(rows.map(r => r.month)).toEqual(['2026-07', '2026-08', '2026-09'])
      expect(rows[0].status).toBe('late') // due day 5 already passed
      expect(rows[1].status).toBe('upcoming')
    })

    it('should mark current month as due before the due day', () => {
      const early = new Date(2026, 6, 3)
      const rows = buildInstallmentSchedule(debt, [], early)
      expect(rows[0].status).toBe('due')
    })

    it('should mark paid months and skipped past months', () => {
      const payments = [{ month: '2026-06', paidAt: 1, amount: 1000 }]
      const rows = buildInstallmentSchedule(debt, payments, now)
      expect(rows.map(r => [r.month, r.status])).toEqual([
        ['2026-06', 'paid'],
        ['2026-07', 'late'],
        ['2026-08', 'upcoming'],
      ])
    })

    it('should reduce rows by prior payments', () => {
      const rows = buildInstallmentSchedule({ ...debt, priorPayments: 2 }, [], now)
      expect(rows).toHaveLength(1)
    })

    it('should return empty when prior payments cover the tenor', () => {
      expect(buildInstallmentSchedule({ ...debt, priorPayments: 3 }, [], now)).toEqual([])
    })

    it('should handle year rollover', () => {
      const rows = buildInstallmentSchedule(
        { ...debt, tenorMonths: 4 },
        [],
        new Date(2026, 10, 2)
      )
      expect(rows.map(r => r.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    })
  })
})
