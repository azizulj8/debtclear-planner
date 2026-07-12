import { describe, it, expect } from 'vitest'
import { formatRupiah, parseRupiah } from '../src/utils/format.js'

describe('Format Utils', () => {
  describe('formatRupiah', () => {
    it('should format number correctly', () => {
      // NOTE: Using non-breaking spaces as Intl.NumberFormat might output them.
      // Easiest is to check contains instead of exact match for whitespace differences,
      // or normalize spaces.
      const formatted = formatRupiah(1500000)
      expect(formatted.replace(/\s/g, '')).toBe('Rp1.500.000')
    })

    it('should handle zero correctly', () => {
      const formatted = formatRupiah(0)
      expect(formatted.replace(/\s/g, '')).toBe('Rp0')
    })

    it('should handle string inputs correctly', () => {
      const formatted = formatRupiah('1500000')
      expect(formatted.replace(/\s/g, '')).toBe('Rp1.500.000')
    })

    it('should handle invalid inputs gracefully', () => {
      expect(formatRupiah(null)).toBe('')
      expect(formatRupiah(undefined)).toBe('')
      expect(formatRupiah('')).toBe('')
      expect(formatRupiah('abc')).toBe('')
    })
  })

  describe('parseRupiah', () => {
    it('should parse formatted string back to number', () => {
      expect(parseRupiah('Rp 1.500.000')).toBe(1500000)
      expect(parseRupiah('1.500.000')).toBe(1500000)
      expect(parseRupiah('1500000')).toBe(1500000)
    })

    it('should handle invalid inputs gracefully', () => {
      expect(parseRupiah(null)).toBe(0)
      expect(parseRupiah('')).toBe(0)
      expect(parseRupiah('Rp abc')).toBe(0)
    })
  })
})
