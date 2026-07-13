import { describe, it, expect } from 'vitest'
import { groupBillsByProvider } from '../src/utils/billGrouping.js'
import { findProviderPreset } from '../src/data/auditProviders.js'

describe('Bill Grouping', () => {
  it('should collapse consolidated-provider debts into one group row', () => {
    const debts = [
      { id: 1, name: 'Kredivo HP', minPayment: 500000, dueDate: 10, providerId: 'kredivo' },
      { id: 2, name: 'Kredivo Laptop', minPayment: 300000, dueDate: 5, providerId: 'kredivo' },
    ]
    const rows = groupBillsByProvider(debts)
    expect(rows).toHaveLength(1)
    expect(rows[0].type).toBe('group')
    expect(rows[0].total).toBe(800000)
    expect(rows[0].dueDate).toBe(5) // earliest due day wins
    expect(rows[0].debts).toHaveLength(2)
  })

  it('should keep per-loan provider debts as individual rows', () => {
    const debts = [
      { id: 1, name: 'SPayLater A', minPayment: 100, dueDate: 5, providerId: 'spaylater' },
      { id: 2, name: 'SPayLater B', minPayment: 100, dueDate: 5, providerId: 'spaylater' },
    ]
    const rows = groupBillsByProvider(debts)
    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.type === 'single')).toBe(true)
  })

  it('should keep provider-less debts as singles and sort by due date', () => {
    const debts = [
      { id: 1, name: 'KPR', minPayment: 100, dueDate: 25, providerId: null },
      { id: 2, name: 'Kredivo X', minPayment: 100, dueDate: 3, providerId: 'kredivo' },
      { id: 3, name: 'Pinjol Z', minPayment: 100, dueDate: 10 },
    ]
    const rows = groupBillsByProvider(debts)
    expect(rows.map(r => (r.type === 'group' ? r.provider.id : r.debt.name))).toEqual([
      'kredivo', 'Pinjol Z', 'KPR',
    ])
  })
})

describe('findProviderPreset', () => {
  it('should match by primary word, case-insensitive', () => {
    expect(findProviderPreset('kredivo cicilan hp')?.id).toBe('kredivo')
    expect(findProviderPreset('SPayLater')?.id).toBe('spaylater')
    expect(findProviderPreset('GoPay Later')?.id).toBe('gopaylater')
  })

  it('should return null when nothing matches', () => {
    expect(findProviderPreset('Utang ke Budi')).toBeNull()
    expect(findProviderPreset('')).toBeNull()
  })
})
