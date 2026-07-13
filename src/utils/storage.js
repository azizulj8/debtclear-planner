import Dexie from 'dexie'
import { scheduleNativeReminders } from './notifications.js'
import { isFullyPaid } from './obligation.js'
import { findProviderPreset } from '../data/auditProviders.js'

// Initialize Dexie database
export const db = new Dexie('debtclear')

// Define database schema
db.version(2).stores({
  debts: '++id, name, type, principal, interestRate, minPayment, dueDate, isPaidOff, createdAt',
  deleted_debts: '++id, localId, updatedAt'
})

// v3: payment records per debt per month ("YYYY-MM")
db.version(3).stores({
  debts: '++id, name, type, principal, interestRate, minPayment, dueDate, isPaidOff, createdAt',
  deleted_debts: '++id, localId, updatedAt',
  payments: '++id, debtId, month, [debtId+month], paidAt'
})

/**
 * Returns the month key ("YYYY-MM") for a given date.
 * @param {Date} [date]
 * @returns {string}
 */
export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Builds a Set of "debtId:YYYY-MM" for all recorded payments,
 * used by the reminder scheduler to skip already-paid bills.
 * @returns {Promise<Set<string>>}
 */
async function getPaidSet() {
  const payments = await db.payments.toArray()
  return new Set(payments.map(p => `${p.debtId}:${p.month}`))
}

async function rescheduleReminders(debts) {
  await scheduleNativeReminders(debts, await getPaidSet())
}

/**
 * Adds a new debt to the database.
 * @param {Object} debtData - The debt data to save
 * @returns {Promise<number>} Resolves with the new ID
 */
export async function addDebt(debtData) {
  const now = Date.now();
  const debt = {
    ...debtData,
    isPaidOff: false,
    createdAt: now,
    updatedAt: now,
  }
  const id = await db.debts.add(debt)
  const debts = await getAllDebts()
  await rescheduleReminders(debts)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
  return id
}

/**
 * Retrieves all debts from the database.
 * @returns {Promise<Array>} List of debts
 */
export async function getAllDebts() {
  return await db.debts.toArray()
}

/**
 * Retrieves a single debt by ID.
 * @param {number} id - The debt ID
 * @returns {Promise<Object|undefined>} The debt object
 */
export async function getDebt(id) {
  return await db.debts.get(id);
}

/**
 * Updates a debt by ID.
 * @param {number} id - The debt ID
 * @param {Object} debtData - The updated debt data
 * @returns {Promise<number>} Number of updated records
 */
export async function updateDebt(id, debtData) {
  const result = await db.debts.update(id, {
    ...debtData,
    updatedAt: Date.now()
  });
  const debts = await getAllDebts()
  await rescheduleReminders(debts)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
  return result
}

/**
 * Deletes a debt by ID.
 * @param {number} id - The debt ID
 * @returns {Promise<void>} Resolves when deleted
 */
export async function deleteDebt(id) {
  // Record deletion offline for sync engine
  await db.deleted_debts.add({
    localId: id,
    updatedAt: Date.now()
  });
  const result = await db.debts.delete(id);
  // Remove payment history belonging to this debt
  await db.payments.where('debtId').equals(id).delete();
  const debts = await getAllDebts()
  await rescheduleReminders(debts)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
  return result
}

/**
 * Bulk inserts debts into IndexedDB.
 * @param {Array} debtsList - Array of debt objects without id/createdAt/isPaidOff
 * @returns {Promise<any>} Resolves when added
 */
export async function bulkAddDebts(debtsList) {
  const now = Date.now();
  const prepared = debtsList.map(d => ({
    ...d,
    isPaidOff: false,
    createdAt: now,
    updatedAt: now
  }));
  const result = await db.debts.bulkAdd(prepared);
  const debts = await getAllDebts()
  await rescheduleReminders(debts)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
  return result
}


/**
 * Gets all locally deleted debts queued for cloud sync.
 * @returns {Promise<Array>}
 */
export async function getDeletedDebts() {
  return await db.deleted_debts.toArray();
}

/**
 * Clears the queue of deleted debts after successful cloud sync.
 * @returns {Promise<void>}
 */
export async function clearDeletedDebts() {
  return await db.deleted_debts.clear();
}

/**
 * Marks a debt's bill as paid for a given month.
 * Idempotent: replaces an existing record for the same debt & month.
 * @param {number} debtId
 * @param {string} month - Month key "YYYY-MM"
 * @param {number} amount - Amount paid
 * @returns {Promise<number>} The payment record ID
 */
export async function markBillPaid(debtId, month, amount) {
  const existing = await db.payments.where('[debtId+month]').equals([debtId, month]).first();
  let id;
  if (existing) {
    await db.payments.update(existing.id, { amount, paidAt: Date.now() });
    id = existing.id;
  } else {
    id = await db.payments.add({ debtId, month, amount, paidAt: Date.now() });
  }
  await refreshPaidOffStatus(debtId);
  await rescheduleReminders(await getAllDebts());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
  return id;
}

/**
 * Removes the paid mark for a debt's bill in a given month.
 * @param {number} debtId
 * @param {string} month - Month key "YYYY-MM"
 * @returns {Promise<void>}
 */
export async function unmarkBillPaid(debtId, month) {
  await db.payments.where('[debtId+month]').equals([debtId, month]).delete();
  await refreshPaidOffStatus(debtId);
  await rescheduleReminders(await getAllDebts());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('local-db-changed'));
  }
}

/**
 * Retrieves all payment records for a given month.
 * @param {string} month - Month key "YYYY-MM"
 * @returns {Promise<Array>}
 */
export async function getPaymentsByMonth(month) {
  return await db.payments.where('month').equals(month).toArray();
}

/**
 * Retrieves the full payment history of a debt, newest first.
 * @param {number} debtId
 * @returns {Promise<Array>}
 */
export async function getPaymentsByDebt(debtId) {
  const list = await db.payments.where('debtId').equals(debtId).toArray();
  return list.sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Counts recorded payments per debt.
 * @returns {Promise<Map<number, number>>} Map of debtId -> payment count
 */
export async function getPaymentCountsPerDebt() {
  const payments = await db.payments.toArray();
  const counts = new Map();
  for (const p of payments) {
    counts.set(p.debtId, (counts.get(p.debtId) || 0) + 1);
  }
  return counts;
}

/**
 * One-time backfill: links debts created before the provider concept
 * existed to a provider preset when their name clearly matches one,
 * so consolidated billing groups them correctly.
 * @returns {Promise<number>} Number of debts linked
 */
export async function backfillProviderIds() {
  const debts = await db.debts.toArray();
  let linked = 0;
  for (const debt of debts) {
    if (debt.providerId !== undefined) continue;
    const preset = findProviderPreset(debt.name);
    // Store null too so the debt is not re-checked on every startup
    await db.debts.update(debt.id, { providerId: preset ? preset.id : null });
    if (preset) linked++;
  }
  return linked;
}

/**
 * Model A auto-lunas: a tenor debt becomes paid off when
 * prior + recorded installments reach the tenor, and reverts
 * when payments are unmarked below it.
 * @param {number} debtId
 */
async function refreshPaidOffStatus(debtId) {
  const debt = await db.debts.get(debtId);
  if (!debt || !debt.tenorMonths) return;
  const recorded = await db.payments.where('debtId').equals(debtId).count();
  const shouldBePaidOff = isFullyPaid(debt, recorded);
  if (debt.isPaidOff !== shouldBePaidOff) {
    await db.debts.update(debtId, { isPaidOff: shouldBePaidOff, updatedAt: Date.now() });
  }
}


