// Whop Payment Service
// Handles subscription verification and payment processing

import { databaseService } from './databaseService';
import { SubscriptionStatus } from '../types';

interface WhopSubscription {
  id: string;
  status: SubscriptionStatus;
  plan_id: string;
  user_id: string;
  created_at: number;
  expires_at: number | null;
  cancel_at_period_end: boolean;
}

interface WhopUser {
  id: string;
  email: string;
  username: string;
  subscriptions: WhopSubscription[];
}

class WhopService {
  private apiKey: string;
  private baseUrl = 'https://api.whop.com/v1';

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_WHOP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Whop API key not configured');
    } else {
      console.log('✅ Whop service initialized');
    }
  }

  // Check if user has active subscription (uses backend verification)
  async hasActiveSubscription(userEmail: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('⚠️ Whop not configured, denying access');
      return false; // Deny access if Whop not configured
    }

    try {
      console.log('🔄 Verifying subscription via backend...');
      
      // Add timeout to prevent hanging - 3 seconds max
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        // Call our secure backend function
        const response = await fetch('/.netlify/functions/check-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userEmail }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('❌ Backend subscription check failed:', response.status);
          return false;
        }

        const data = await response.json();
        const isActive = data.hasActiveSubscription;
        
        console.log(isActive ? '✅ Subscription active' : '❌ No active subscription');
        return isActive;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('❌ Subscription check timeout (3s)');
        } else {
          throw fetchError;
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to check subscription:', error);
      // On error, deny access for security
      return false;
    }
  }

  // Sync Whop subscription data to database
  async syncSubscriptionToDatabase(userId: string, subscription: WhopSubscription): Promise<void> {
    try {
      await databaseService.updateUserSettings(userId, {
        subscription: {
          subscribed: subscription.status === 'active' || subscription.status === 'trialing',
          status: subscription.status as SubscriptionStatus,
          startedAt: new Date(subscription.created_at * 1000).toISOString(),
          expiresAt: subscription.expires_at ? new Date(subscription.expires_at * 1000).toISOString() : undefined,
        }
      });
      console.log('✅ Synced subscription to database');
    } catch (error) {
      console.error('❌ Failed to sync subscription to database:', error);
    }
  }

  // Get user's subscription details
  async getUserSubscription(userId: string): Promise<WhopSubscription | null> {
    if (!this.apiKey) return null;

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.baseUrl}/memberships?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Return the first active subscription
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ Whop API timeout');
      } else {
        console.error('❌ Failed to get subscription:', error);
      }
      return null;
    }
  }

  // Verify subscription by membership ID
  async verifyMembership(membershipId: string): Promise<WhopSubscription | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${this.baseUrl}/memberships/${membershipId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Whop API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Failed to verify membership:', error);
      return null;
    }
  }

  // Get checkout URL for subscription
  getCheckoutUrl(userEmail: string, planId?: string): string {
    const defaultPlanId = (import.meta as any).env?.VITE_WHOP_PLAN_ID;
    const plan = planId || defaultPlanId;

    if (!plan) {
      console.error('❌ Whop plan ID not configured');
      return '#';
    }

    // Get current app URL for redirect after payment
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${appUrl}/?payment=success`;

    // Construct Whop checkout URL with redirect parameter and email
    const params = new URLSearchParams({
      redirect_url: redirectUrl,
      email: userEmail,
    });

    return `https://whop.com/checkout/${plan}?${params.toString()}`;
  }

  // Redirect to checkout page
  redirectToCheckout(userEmail: string, planId?: string): void {
    const checkoutUrl = this.getCheckoutUrl(userEmail, planId);
    console.log('🔗 Redirecting to Whop checkout:', checkoutUrl);
    window.location.href = checkoutUrl;
  }

  // Check if Whop is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Get subscription status display text
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  // Format expiration date
  formatExpirationDate(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// Export singleton instance
export const whopService = new WhopService();
export type { WhopSubscription, WhopUser };
