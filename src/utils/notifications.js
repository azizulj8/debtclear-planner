import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks if the app is running on a native device (Android/iOS)
 * @returns {boolean}
 */
export function isNative() {
  return Capacitor.isNativePlatform();
}

/**
 * Requests native push notification permissions if running on a native platform.
 * @returns {Promise<boolean>} True if permission granted or not native
 */
export async function requestNotificationPermission() {
  if (!isNative()) {
    console.log('Not running on native platform. Notification permission skipped.');
    return true;
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }

    const requestStatus = await LocalNotifications.requestPermissions();
    return requestStatus.display === 'granted';
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Schedules native reminders for all active debts.
 * Automatically clears previous scheduled reminders first to avoid duplicates.
 * Reminders are scheduled at H-1 (one day before) the due date at 09:00 AM.
 * 
 * @param {Array} debts - List of debt objects
 */
export async function scheduleNativeReminders(debts) {
  if (!isNative()) return;

  try {
    // 1. Cancel all existing scheduled notifications first
    const pending = await LocalNotifications.getPending();
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }

    // Filter unpaid debts and debts that have reminders enabled
    const activeDebts = debts.filter(d => !d.isPaidOff && d.reminderEnabled !== false);
    if (activeDebts.length === 0) {
      console.log('No active debts requiring reminders.');
      return;
    }

    const notifications = [];

    activeDebts.forEach((debt) => {
      // Due date is a day of the month (1-31)
      const dueDay = parseInt(debt.dueDate, 10);
      if (isNaN(dueDay)) return;

      const now = new Date();
      let scheduledDate = new Date(now.getFullYear(), now.getMonth(), dueDay - 1, 9, 0, 0);

      // If scheduled date is in the past (e.g. today is 15th, due date is 10th), schedule for next month
      if (scheduledDate < now) {
        scheduledDate.setMonth(scheduledDate.getMonth() + 1);
      }

      notifications.push({
        id: debt.id,
        title: '⏰ Besok Jatuh Tempo!',
        body: `Jangan lupa membayar cicilan ${debt.name} sebesar Rp ${Number(debt.minPayment).toLocaleString('id-ID')}`,
        schedule: {
          at: scheduledDate,
          allowWhileIdle: true
        },
        sound: null,
        attachments: null,
        actionTypeId: '',
        extra: null
      });
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Successfully scheduled ${notifications.length} native reminders.`);
    }
  } catch (err) {
    console.error('Failed to schedule native reminders:', err);
  }
}
