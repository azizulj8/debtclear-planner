import { describe, it, expect } from 'vitest';
import { sortByStrategy, calculatePayoffSchedule, compareStrategies } from '../src/utils/strategy.js';

describe('Strategy Payoff Engine', () => {
  const mockDebts = [
    { id: 1, name: 'Pinjol A', principal: 2000000, interestRate: 120, minPayment: 400000, isPaidOff: false }, // high interest, medium balance
    { id: 2, name: 'KPR B', principal: 10000000, interestRate: 12, minPayment: 500000, isPaidOff: false }, // low interest, high balance
    { id: 3, name: 'Kartu Kredit C', principal: 1000000, interestRate: 24, minPayment: 100000, isPaidOff: false } // medium interest, low balance
  ];

  describe('sortByStrategy', () => {
    it('should sort correctly for snowball (smallest principal first)', () => {
      const sorted = sortByStrategy(mockDebts, 'snowball');
      expect(sorted[0].id).toBe(3); // 1M
      expect(sorted[1].id).toBe(1); // 2M
      expect(sorted[2].id).toBe(2); // 10M
    });

    it('should sort correctly for avalanche (highest interest rate first)', () => {
      const sorted = sortByStrategy(mockDebts, 'avalanche');
      expect(sorted[0].id).toBe(1); // 120%
      expect(sorted[1].id).toBe(3); // 24%
      expect(sorted[2].id).toBe(2); // 12%
    });
  });

  describe('calculatePayoffSchedule', () => {
    it('should simulate a simple payoff correctly', () => {
      const singleDebt = [
        { id: 1, name: 'Simple Debt', principal: 1000000, interestRate: 12, minPayment: 200000, isPaidOff: false }
      ];
      
      const { schedule, totalInterest, months, isInfinite } = calculatePayoffSchedule(singleDebt, 'snowball', 0);
      
      expect(isInfinite).toBe(false);
      expect(months).toBeGreaterThan(0);
      expect(totalInterest).toBeGreaterThan(0);
      
      // The final balance should be 0
      expect(schedule[schedule.length - 1].totalRemaining).toBe(0);
    });
  });

  describe('compareStrategies', () => {
    it('should compare snowball vs avalanche side-by-side', () => {
      const comparison = compareStrategies(mockDebts, 100000);
      
      expect(comparison).toHaveProperty('snowball');
      expect(comparison).toHaveProperty('avalanche');
      expect(comparison).toHaveProperty('betterStrategy');
      expect(comparison).toHaveProperty('interestSaved');
      expect(comparison).toHaveProperty('monthsSaved');
    });
  });
});
