import { describe, it, expect } from 'vitest'
import { groupBillsByProvider, mergeConsolidatedDebts } from '../src/utils/billGrouping.js'
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

describe('mergeConsolidatedDebts', () => {
  it('should merge consolidated-provider debts into one virtual debt', () => {
    const debts = [
      { id: 1, name: 'Kredivo HP', type: 'PayLater', principal: 2000000, minPayment: 500000, interestRate: 60, dueDate: 10, providerId: 'kredivo' },
      { id: 2, name: 'Kredivo Laptop', type: 'PayLater', principal: 1000000, minPayment: 300000, interestRate: 90, dueDate: 5, providerId: 'kredivo' },
      { id: 3, name: 'AdaKami', type: 'Pinjol', principal: 500000, minPayment: 200000, interestRate: 100, dueDate: 20, providerId: 'adakami' },
    ]
    const merged = mergeConsolidatedDebts(debts)
    expect(merged).toHaveLength(2)
    const kredivo = merged.find(d => String(d.id).startsWith('provider:'))
    expect(kredivo.principal).toBe(3000000)
    expect(kredivo.minPayment).toBe(800000)
    expect(kredivo.interestRate).toBe(70) // weighted: (60*2jt + 90*1jt) / 3jt
    expect(kredivo.dueDate).toBe(5)
  })

  it('should leave per-loan and provider-less debts untouched', () => {
    const debts = [
      { id: 1, name: 'SPayLater A', principal: 100, minPayment: 10, interestRate: 50, dueDate: 5, providerId: 'spaylater' },
      { id: 2, name: 'KPR', principal: 200, minPayment: 20, interestRate: 10, dueDate: 1 },
    ]
    expect(mergeConsolidatedDebts(debts)).toHaveLength(2)
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
