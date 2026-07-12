import Dexie from 'dexie'
import { scheduleNativeReminders } from './notifications.js'

// Initialize Dexie database
export const db = new Dexie('debtclear')

// Define database schema
db.version(2).stores({
  debts: '++id, name, type, principal, interestRate, minPayment, dueDate, isPaidOff, createdAt',
  deleted_debts: '++id, localId, updatedAt'
})

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
  await scheduleNativeReminders(debts)
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
  await scheduleNativeReminders(debts)
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
  const debts = await getAllDebts()
  await scheduleNativeReminders(debts)
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
  await scheduleNativeReminders(debts)
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


