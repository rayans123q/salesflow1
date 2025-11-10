# Reddit API Subscription Setup Guide

## Overview
This application now supports a subscription-based Reddit API service. Users can subscribe to use the company's Reddit API instead of setting up their own credentials.

## Features

1. **Company Reddit API Service**: Users with an active subscription automatically use the company's Reddit API credentials
2. **Monthly Recurring Revenue**: Subscription-based pricing model
3. **Automatic Fallback**: Falls back to user's own credentials or Gemini Search if subscription is inactive
4. **No Setup Required**: Subscribed users don't need to configure their own API credentials

## Database Setup

### Run the Subscription Migration

1. Go to your Supabase SQL Editor
2. Run the migration script: `supabase_migration_subscription.sql`

This will add the following fields to the `user_settings` table:
- `reddit_api_subscribed` (BOOLEAN) - Whether the user is subscribed
- `subscription_status` (TEXT) - Status: 'active', 'inactive', 'cancelled', 'expired'
- `subscription_started_at` (TIMESTAMP) - When the subscription started
- `subscription_expires_at` (TIMESTAMP) - When the subscription expires

## Environment Variables

Add the following to your `.env.local` file:

```env
# Company Reddit API Credentials (for subscribed users)
VITE_COMPANY_REDDIT_CLIENT_ID=your_company_reddit_client_id
VITE_COMPANY_REDDIT_CLIENT_SECRET=your_company_reddit_client_secret
```

## How It Works

### For Subscribed Users:
1. User subscribes through the Settings page
2. Subscription status is stored in the database
3. When searching for leads, the app uses company Reddit API credentials
4. Company credentials are loaded from environment variables

### For Non-Subscribed Users:
1. User can still use their own Reddit API credentials (if configured)
2. Falls back to Gemini Search if no credentials are available
3. Same functionality, just using different API credentials

## Subscription Management

### Activating a Subscription:
- User clicks "Subscribe Now" in Settings
- Subscription is activated immediately (in production, this would redirect to a payment page)
- Subscription expires 1 month from activation date

### Cancelling a Subscription:
- User clicks "Cancel Subscription" in Settings
- Subscription status changes to 'cancelled'
- User can still use their own API credentials or Gemini Search

## Payment Integration (Future)

To integrate with a payment provider (Stripe, PayPal, etc.):

1. Replace the subscription button action with a redirect to your payment page
2. Create a webhook endpoint to handle payment success
3. Update subscription status in the database when payment is confirmed
4. Set up recurring payment processing for monthly renewals

## Testing

1. **Test Subscription Activation**:
   - Go to Settings → Reddit API Subscription
   - Click "Subscribe Now"
   - Verify subscription status shows as "Active"
   - Create a campaign and verify it uses company Reddit API

2. **Test Subscription Cancellation**:
   - Click "Cancel Subscription"
   - Verify subscription status changes to "Cancelled"
   - Verify the app falls back to user credentials or Gemini Search

3. **Test Fallback**:
   - Cancel subscription
   - Verify campaigns still work (using user credentials or Gemini Search)

## Pricing

Current pricing: **$9.99/month**

You can modify the price in `components/Settings.tsx`:
```typescript
Subscribe Now - $9.99/month
```

## Security Notes

1. **Company Credentials**: Store company Reddit API credentials in environment variables, never in the code
2. **User Credentials**: User's own credentials are stored securely in Supabase
3. **Subscription Status**: Always check subscription status before using company credentials
4. **Expiration**: Check subscription expiration dates and update status accordingly

## Next Steps

1. Set up company Reddit API credentials
2. Add environment variables
3. Run database migration
4. Test subscription flow
5. Integrate payment provider (Stripe, PayPal, etc.)
6. Set up recurring payment processing
7. Add subscription expiration checks

