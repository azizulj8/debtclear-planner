import { describe, it, expect } from 'vitest';
import { sortDebts } from '../src/components/DebtList.js';

describe('Debt List Utils', () => {
  describe('sortDebts', () => {
    const mockDebts = [
      { id: 1, name: 'Utang B', principal: 1000000, interestRate: 10, isPaidOff: false, dueDate: 15 },
      { id: 2, name: 'Utang A', principal: 5000000, interestRate: 15, isPaidOff: false, dueDate: 5 },
      { id: 3, name: 'Utang C', principal: 2000000, interestRate: 5, isPaidOff: false, dueDate: 20 },
      { id: 4, name: 'Utang Lunas', principal: 500000, interestRate: 12, isPaidOff: true, dueDate: 10 }
    ];

    it('should sort by principal-desc and keep paid off debts at the bottom', () => {
      const sorted = sortDebts(mockDebts, 'principal-desc');
      
      // Expected active debts: Utang A (5M), Utang C (2M), Utang B (1M)
      // Expected paid off debts: Utang Lunas (500K) at the very bottom
      expect(sorted[0].id).toBe(2); // 5M
      expect(sorted[1].id).toBe(3); // 2M
      expect(sorted[2].id).toBe(1); // 1M
      expect(sorted[3].id).toBe(4); // Lunas
    });

    it('should sort by principal-asc', () => {
      const sorted = sortDebts(mockDebts, 'principal-asc');
      expect(sorted[0].id).toBe(1); // 1M
      expect(sorted[1].id).toBe(3); // 2M
      expect(sorted[2].id).toBe(2); // 5M
      expect(sorted[3].id).toBe(4); // Lunas
    });

    it('should sort by interest-desc', () => {
      const sorted = sortDebts(mockDebts, 'interest-desc');
      expect(sorted[0].id).toBe(2); // 15%
      expect(sorted[1].id).toBe(1); // 10%
      expect(sorted[2].id).toBe(3); // 5%
      expect(sorted[3].id).toBe(4); // Lunas
    });

    it('should sort by name-asc', () => {
      const sorted = sortDebts(mockDebts, 'name-asc');
      expect(sorted[0].name).toBe('Utang A');
      expect(sorted[1].name).toBe('Utang B');
      expect(sorted[2].name).toBe('Utang C');
      expect(sorted[3].name).toBe('Utang Lunas');
    });

    it('should sort by due-date', () => {
      const sorted = sortDebts(mockDebts, 'due-date');
      expect(sorted[0].id).toBe(2); // day 5
      expect(sorted[1].id).toBe(1); // day 15
      expect(sorted[2].id).toBe(3); // day 20
      expect(sorted[3].id).toBe(4); // Lunas
    });
  });
});
