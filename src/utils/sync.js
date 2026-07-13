import { supabase } from './supabase.js';
import {
  db,
  getAllDebts,
  getDeletedDebts,
  clearDeletedDebts,
  getAllPayments,
  getDeletedPayments,
  clearDeletedPayments,
} from './storage.js';
import { isProUser } from './premium.js';

let isSyncing = false;

/**
 * Checks if the sync process is currently running.
 * @returns {boolean}
 */
export function getSyncStatus() {
  return isSyncing;
}

/**
 * Triggers a full synchronization between local Dexie IndexedDB and Supabase.
 * @param {string} userId - The logged in user ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function syncAll(userId) {
  if (!userId) {
    return { success: false, message: 'User not logged in' };
  }

  const isPro = await isProUser();
  if (!isPro) {
    console.log('User is on Free plan. Cloud sync disabled.');
    return { success: false, message: 'Fitur sinkronisasi cloud hanya untuk member Pro.' };
  }

  if (isSyncing) {
    return { success: false, message: 'Sync already in progress' };
  }

  isSyncing = true;
  console.log('Sync started...');
  
  // Trigger a custom event so the UI can show a spinner/syncing status
  window.dispatchEvent(new CustomEvent('sync-state-change', { detail: { syncing: true } }));

  try {
    // 1. Process offline deletions first
    const deletedQueue = await getDeletedDebts();
    if (deletedQueue.length > 0) {
      console.log(`Processing ${deletedQueue.length} local deletions...`);
      for (const item of deletedQueue) {
        // Delete from Supabase. We query by user_id and local_id.
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('user_id', userId)
          .eq('local_id', item.localId);

        if (error) {
          console.warn(`Failed to delete remote debt local_id ${item.localId}:`, error);
        }

        // Cascade: remove the deleted debt's payment history in the cloud
        await supabase
          .from('payments')
          .delete()
          .eq('user_id', userId)
          .eq('debt_local_id', item.localId);
      }
      await clearDeletedDebts();
    }

    // 2. Fetch all local debts and remote debts
    const localDebts = await getAllDebts();
    const { data: remoteDebts, error: fetchError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      throw fetchError;
    }

    console.log('Local debts:', localDebts.length, 'Remote debts:', remoteDebts?.length || 0);

    // 3. Match and sync records (LWS - Last Write Wins)
    const remoteDebtsMap = new Map();
    if (remoteDebts) {
      remoteDebtsMap.forEach(d => remoteDebtsMap.set(d.local_id, d));
      remoteDebts.forEach(d => {
        remoteDebtsMap.set(d.local_id, d);
      });
    }

    // A. Sync Local to Cloud (Insert/Update)
    for (const local of localDebts) {
      const remote = remoteDebtsMap.get(local.id);

      const payload = {
        user_id: userId,
        local_id: local.id,
        name: local.name,
        type: local.type,
        principal: Number(local.principal),
        interest_rate: Number(local.interestRate),
        min_payment: Number(local.minPayment),
        due_date: Number(local.dueDate),
        is_paid_off: Boolean(local.isPaidOff),
        reminder_enabled: local.reminderEnabled !== false,
        tenor_months: local.tenorMonths || null,
        prior_payments: local.priorPayments || null,
        provider_id: local.providerId || null,
        updated_at: new Date(local.updatedAt || local.createdAt || Date.now()).toISOString(),
      };

      if (!remote) {
        // Does not exist in cloud, insert
        console.log(`Pushing new debt to cloud: ${local.name}`);
        const { error } = await supabase.from('debts').insert([payload]);
        if (error) console.error('Error inserting debt to cloud:', error);
      } else {
        // Exists in cloud, compare timestamps
        const localTime = local.updatedAt || local.createdAt || 0;
        const remoteTime = new Date(remote.updated_at).getTime();

        if (localTime > remoteTime) {
          // Local is newer, update cloud
          console.log(`Updating cloud debt (local is newer): ${local.name}`);
          const { error } = await supabase
            .from('debts')
            .update(payload)
            .eq('user_id', userId)
            .eq('local_id', local.id);
          if (error) console.error('Error updating debt in cloud:', error);
        } else if (remoteTime > localTime) {
          // Cloud is newer, update local IndexedDB
          console.log(`Updating local debt (cloud is newer): ${remote.name}`);
          await db.debts.update(local.id, {
            name: remote.name,
            type: remote.type,
            principal: remote.principal,
            interestRate: remote.interest_rate,
            minPayment: remote.min_payment,
            dueDate: remote.due_date,
            isPaidOff: remote.is_paid_off,
            reminderEnabled: remote.reminder_enabled,
            tenorMonths: remote.tenor_months || null,
            priorPayments: remote.prior_payments || null,
            providerId: remote.provider_id || null,
            updatedAt: remoteTime
          });
        }
      }
    }

    // B. Sync Cloud to Local (New records from other devices)
    const localDebtsMap = new Map();
    localDebts.forEach(d => localDebtsMap.set(d.id, d));

    for (const remote of (remoteDebts || [])) {
      if (!localDebtsMap.has(remote.local_id)) {
        // Check if this was deleted locally in the queue (to avoid bringing it back)
        const deletedQueue = await getDeletedDebts();
        const wasDeleted = deletedQueue.some(item => item.localId === remote.local_id);

        if (!wasDeleted) {
          console.log(`Pulling new debt from cloud: ${remote.name}`);
          // Put into Dexie. We specify the auto-increment ID to match the remote local_id
          await db.debts.put({
            id: remote.local_id,
            name: remote.name,
            type: remote.type,
            principal: remote.principal,
            interestRate: remote.interest_rate,
            minPayment: remote.min_payment,
            dueDate: remote.due_date,
            isPaidOff: remote.is_paid_off,
            reminderEnabled: remote.reminder_enabled,
            tenorMonths: remote.tenor_months || null,
            priorPayments: remote.prior_payments || null,
            providerId: remote.provider_id || null,
            createdAt: new Date(remote.created_at || Date.now()).getTime(),
            updatedAt: new Date(remote.updated_at || Date.now()).getTime()
          });
        }
      }
    }

    // 4. Sync payment records
    await syncPayments(userId);

    console.log('Sync successfully completed.');
    window.dispatchEvent(new CustomEvent('sync-state-change', { detail: { syncing: false, error: false } }));
    return { success: true, message: 'Sinkronisasi berhasil!' };
  } catch (err) {
    console.error('Sync failed:', err);
    window.dispatchEvent(new CustomEvent('sync-state-change', { detail: { syncing: false, error: true } }));
    return { success: false, message: `Sinkronisasi gagal: ${err.message || 'Network error'}` };
  } finally {
    isSyncing = false;
  }
}

/**
 * Two-way sync of payment records (paid bills per month).
 * Presence-based with an unmark queue: local unmarks delete remote rows,
 * then local and remote are merged in both directions.
 * @param {string} userId
 */
async function syncPayments(userId) {
  // A. Process queued unmarks first so they are not resurrected by the pull
  const unmarkQueue = await getDeletedPayments();
  for (const item of unmarkQueue) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId)
      .eq('debt_local_id', item.debtId)
      .eq('month', item.month);
    if (error) {
      console.warn(`Failed to delete remote payment ${item.debtId}/${item.month}:`, error);
      return; // keep the queue; retry next sync
    }
  }
  await clearDeletedPayments();

  // B. Push local payments to cloud (idempotent upsert)
  const localPayments = await getAllPayments();
  if (localPayments.length > 0) {
    const payload = localPayments.map(p => ({
      user_id: userId,
      debt_local_id: p.debtId,
      month: p.month,
      amount: Number(p.amount) || 0,
      paid_at: new Date(p.paidAt || Date.now()).toISOString(),
    }));
    const { error } = await supabase
      .from('payments')
      .upsert(payload, { onConflict: 'user_id,debt_local_id,month' });
    if (error) console.error('Error pushing payments to cloud:', error);
  }

  // C. Pull remote payments recorded on other devices
  const { data: remotePayments, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId);
  if (fetchError) {
    console.error('Error fetching remote payments:', fetchError);
    return;
  }

  const localKeys = new Set(localPayments.map(p => `${p.debtId}:${p.month}`));
  const localDebtIds = new Set((await getAllDebts()).map(d => d.id));
  for (const remote of remotePayments || []) {
    const key = `${remote.debt_local_id}:${remote.month}`;
    // Only pull payments for debts that exist locally (debts sync ran first)
    if (!localKeys.has(key) && localDebtIds.has(remote.debt_local_id)) {
      await db.payments.add({
        debtId: remote.debt_local_id,
        month: remote.month,
        amount: Number(remote.amount) || 0,
        paidAt: new Date(remote.paid_at || Date.now()).getTime(),
      });
    }
  }
}

// Auto-sync listener on internet connection restore
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Internet connection restored. Triggering auto-sync...');
      syncAll(user.id);
    }
  });

  window.addEventListener('local-db-changed', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && navigator.onLine) {
      console.log('Local database changed. Triggering auto-sync...');
      syncAll(user.id);
    }
  });
}

