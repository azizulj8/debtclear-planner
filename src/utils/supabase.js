import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client instance for the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up a new user using email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Supabase auth response
 */
export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password });
}

/**
 * Sign in an existing user using email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Supabase auth response
 */
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} Supabase auth response
 */
export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

/**
 * Sign out the current user
 * @returns {Promise<Object>} Supabase response
 */
export async function signOut() {
  return await supabase.auth.signOut();
}

/**
 * Retrieves the currently logged-in user session
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Gets the subscription details for the current user.
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Subscription data or null
 */
export async function getUserSubscription(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to get subscription:', err);
    return null;
  }
}
