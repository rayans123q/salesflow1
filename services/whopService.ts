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

  // Check if user has active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('⚠️ Whop not configured, allowing access');
      return true; // Allow access if Whop not configured (for development)
    }

    try {
      // First check database for cached subscription status
      const settings = await databaseService.getUserSettings(userId);
      const dbStatus = settings.subscription.status;
      
      // If database shows active or trialing, trust it (faster)
      if (dbStatus === 'active' || dbStatus === 'trialing') {
        console.log('✅ Subscription active (from database)');
        return true;
      }
      
      // If database shows inactive/cancelled/expired, verify with Whop API
      console.log('🔄 Verifying subscription with Whop API...');
      const subscription = await this.getUserSubscription(userId);
      const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
      
      // Update database with latest status
      if (subscription) {
        await this.syncSubscriptionToDatabase(userId, subscription);
      }
      
      return isActive;
    } catch (error) {
      console.error('❌ Failed to check subscription:', error);
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
      const response = await fetch(`${this.baseUrl}/memberships?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

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
      console.error('❌ Failed to get subscription:', error);
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
  getCheckoutUrl(planId?: string): string {
    const defaultPlanId = (import.meta as any).env?.VITE_WHOP_PLAN_ID;
    const plan = planId || defaultPlanId;

    if (!plan) {
      console.error('❌ Whop plan ID not configured');
      return '#';
    }

    // Get current app URL for redirect after payment
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${appUrl}/?payment=success`;

    // Construct Whop checkout URL with redirect parameter
    return `https://whop.com/checkout/${plan}?redirect_url=${encodeURIComponent(redirectUrl)}`;
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
