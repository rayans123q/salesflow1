import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://zimlbwfmiakbwijwmcpq.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'salesflow-auth',
  },
});

// Handle invalid refresh tokens gracefully
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  }
});

// Clear invalid tokens on initialization
const clearInvalidTokens = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && (error.message.includes('refresh_token') || error.message.includes('Invalid Refresh Token'))) {
      console.warn('⚠️ Invalid refresh token detected, clearing session...');
      await supabase.auth.signOut();
      localStorage.removeItem('salesflow-auth');
      localStorage.removeItem('supabase.auth.token');
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
};

clearInvalidTokens();

