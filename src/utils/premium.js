import { getCurrentUser, getUserSubscription } from './supabase.js';

/**
 * Checks if the current user has an active Pro subscription.
 * @returns {Promise<boolean>} True if user is Pro
 */
export async function isProUser() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const subscription = await getUserSubscription(user.id);
    if (!subscription) return false;
    
    const isActive = subscription.status === 'active';
    const isNotExpired = new Date(subscription.expires_at) > new Date();
    
    return isActive && isNotExpired;
  } catch (err) {
    console.error('Error checking Pro status:', err);
    return false;
  }
}
