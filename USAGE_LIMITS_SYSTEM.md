# Usage Limits System - Monthly Reset

## Overview
Sales Flow implements a monthly usage tracking system that automatically resets every 30 days. All users (free and paid) have the same limits that reset monthly.

## Current Limits (Per Month)
- **Campaigns**: Unlimited ✨
- **Refreshes**: 50 per month
- **AI Responses**: 250 per month

These limits match what's shown on the pricing page and reset automatically every 30 days.

## How It Works

### 1. Database Tracking
Usage is tracked in the `user_settings` table with these columns:
- `usage_campaigns` - Number of campaigns created this month
- `usage_refreshes` - Number of campaign refreshes this month  
- `usage_ai_responses` - Number of AI responses generated this month
- `usage_reset_date` - Timestamp of last reset (used to calculate when to reset)

### 2. Automatic Monthly Reset
When a user logs in or loads their settings, the system:
1. Checks if 30 days have passed since `usage_reset_date`
2. If yes, resets all counters to 0 and updates `usage_reset_date` to NOW()
3. Returns the current (possibly reset) usage numbers

This happens automatically via the `check_and_reset_user_usage()` PostgreSQL function.

### 3. Usage Increment
When users perform actions:

**Creating a Campaign:**
```typescript
// After campaign is created successfully
const newUsage = { ...usage, campaigns: usage.campaigns + 1 };
setUsage(newUsage);
await databaseService.updateUserSettings(user.id, { usage: newUsage });
```

**Refreshing a Campaign:**
```typescript
// Before refresh starts
if (usage.refreshes >= limits.refreshes) {
    showNotification('error', 'Refresh limit reached (50/50).');
    return 0;
}
const newUsage = {...usage, refreshes: usage.refreshes + 1};
setUsage(newUsage);
await databaseService.updateUserSettings(user.id, { usage: newUsage });
```

**Generating AI Response:**
```typescript
// Before generating response
if (usage.aiResponses >= limits.aiResponses) {
    showNotification('error', 'AI response limit reached (250/250).');
    return false;
}
const newUsage = { ...usage, aiResponses: usage.aiResponses + 1 };
setUsage(newUsage);
await databaseService.updateUserSettings(user.id, { usage: newUsage });
```

## Database Setup

### Run the Migration
Execute `supabase_migration_usage_tracking.sql` in your Supabase SQL editor:

```sql
-- This will:
-- 1. Add usage tracking columns
-- 2. Create reset functions
-- 3. Set up automatic monthly resets
```

### Manual Reset (for testing)
```sql
-- Reset all users
SELECT reset_monthly_usage();

-- Reset specific user
SELECT * FROM check_and_reset_user_usage('user@example.com');
```

## User Experience

### What Users See
In the sidebar, users see their current usage:
```
Campaigns: 4/∞
Refreshes: 12/50
AI Responses: 31/250
```

### When Limits Are Reached
- **Campaigns**: No limit - users can create unlimited campaigns
- **Refreshes**: Shows error "Refresh limit reached (50/50)" and prevents refresh
- **AI Responses**: Shows error "AI response limit reached (250/250)" and prevents generation

### Monthly Reset
- Happens automatically after 30 days
- No user action required
- Counters reset to 0
- Users can continue using the app normally

## Implementation Files

### Database
- `supabase_migration_usage_tracking.sql` - Migration to add columns and functions
- `services/databaseService.ts` - `checkAndResetMonthlyUsage()` function

### Frontend
- `App.tsx` - Usage state management and increment logic
- `components/Sidebar.tsx` - Usage display
- `components/CampaignPosts.tsx` - Refresh limit enforcement
- `components/AiResponseGeneratorModal.tsx` - AI response limit enforcement

## Future Enhancements

### Different Tiers (Optional)
If you want to add premium tiers with higher limits:

```typescript
// In App.tsx
const getLimits = (subscription: Subscription) => {
  if (subscription.status === 'active') {
    // Premium tier
    return { campaigns: Infinity, refreshes: 200, aiResponses: 1000 };
  }
  // Free tier
  return { campaigns: Infinity, refreshes: 50, aiResponses: 250 };
};
```

### Analytics
Track usage patterns:
```sql
-- See average usage across all users
SELECT 
  AVG(usage_campaigns) as avg_campaigns,
  AVG(usage_refreshes) as avg_refreshes,
  AVG(usage_ai_responses) as avg_responses
FROM user_settings;
```

## Testing

### Test Monthly Reset
```sql
-- Set a user's reset date to 31 days ago
UPDATE user_settings 
SET usage_reset_date = NOW() - INTERVAL '31 days'
WHERE user_id = 'test@example.com';

-- Then log in as that user - usage should reset automatically
```

### Test Limits
1. Create campaigns until you see the counter increment
2. Refresh campaigns 50 times - should see limit error on 51st
3. Generate AI responses 250 times - should see limit error on 251st

## Notes
- Reset happens on login/settings load, not at a specific time
- Each user's reset is independent (30 days from their last reset)
- Usage is stored in database, not localStorage (persists across devices)
- Limits are enforced client-side but could be enforced server-side for security
