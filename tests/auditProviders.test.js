import { describe, it, expect } from 'vitest'
import { AUDIT_PROVIDERS, isProviderRecorded } from '../src/data/auditProviders.js'

const kredivo = AUDIT_PROVIDERS.find(p => p.id === 'kredivo')
const spaylater = AUDIT_PROVIDERS.find(p => p.id === 'spaylater')

describe('Audit Providers', () => {
  it('should expose a non-empty provider list with categories', () => {
    expect(AUDIT_PROVIDERS.length).toBeGreaterThan(10)
    expect(AUDIT_PROVIDERS.every(p => p.id && p.name && p.category)).toBe(true)
  })

  describe('isProviderRecorded', () => {
    it('should match a debt named exactly like the provider', () => {
      expect(isProviderRecorded(kredivo, [{ name: 'Kredivo' }])).toBe(true)
    })

    it('should match case-insensitively and inside longer names', () => {
      expect(isProviderRecorded(kredivo, [{ name: 'cicilan KREDIVO hp' }])).toBe(true)
    })

    it('should match the primary word of a compound provider name', () => {
      expect(isProviderRecorded(spaylater, [{ name: 'SPayLater' }])).toBe(true)
    })

    it('should not match unrelated debts', () => {
      expect(isProviderRecorded(kredivo, [{ name: 'KPR BTN' }, { name: 'AdaKami' }])).toBe(false)
    })

    it('should return false for empty debts', () => {
      expect(isProviderRecorded(kredivo, [])).toBe(false)
    })
  })
})
