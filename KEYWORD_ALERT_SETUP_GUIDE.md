# Keyword Alert System - Setup Guide

## ✅ What's Been Implemented

### Complete System Components:

1. **Backend Services:**
   - `keywordAlertsService.ts` - Manages keyword alerts CRUD operations
   - `pushNotificationService.ts` - Handles browser push notifications
   - `monitor-keyword-alerts.js` - Netlify function that checks Reddit comments every 5 minutes
   - `send-push-notifications.js` - Netlify function that sends push notifications every 5 minutes

2. **Frontend UI:**
   - `KeywordAlertManager.tsx` - Complete UI for creating and managing keyword alerts
   - Push notification enable/disable toggle
   - Alert creation modal with keyword and subreddit management
   - Alert statistics display

3. **Service Worker:**
   - Updated `service-worker.js` with push notification handling
   - Notification click handling
   - Background notification support

4. **Database:**
   - Schema already created in `keyword_alerts_migration.sql`
   - Tables: keyword_alerts, keyword_alert_matches, keyword_alert_stats

## 🚀 Setup Steps

### Step 1: Run Database Migration

Run the SQL from `keyword_alerts_migration.sql` in your Supabase SQL Editor.

### Step 2: Generate VAPID Keys for Push Notifications

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY...
Private Key: abcdefghijklmnopqrstuvwxyz123456789...
```

### Step 3: Add Environment Variables to Netlify

Go to: https://app.netlify.com/sites/salesflow1/configuration/env

Add these environment variables:

1. **VAPID_PUBLIC_KEY**
   - Value: Your generated public key

2. **VAPID_PRIVATE_KEY**
   - Value: Your generated private key

3. **RESEND_API_KEY** (if not already added)
   - Value: `re_6pbSzuXX_3q1P6dcmf5qzrdHfVbKZjswN`

### Step 4: Update VAPID Public Key in Code

Edit `services/pushNotificationService.ts` line 15:

```typescript
private vapidPublicKey = 'YOUR_ACTUAL_PUBLIC_KEY_HERE';
```

Replace with your generated public key.

### Step 5: Install Dependencies

The deployment will automatically install:
- `web-push` - For sending push notifications
- `resend` - For email notifications

### Step 6: Deploy

Push to GitHub (already done!) and wait for Netlify to deploy.

## 📱 How It Works

### For Users:

1. **Go to Settings Page**
2. **Scroll to "Keyword Alerts" section**
3. **Enable Browser Push Notifications** (if desired)
   - Click "Enable" button
   - Browser will ask for permission
   - Grant permission
   - Test notification will appear

4. **Create a Keyword Alert:**
   - Click "Create Alert"
   - Enter alert name (e.g., "CRM Opportunities")
   - Add keywords (e.g., "looking for CRM", "need sales software")
   - Optionally add specific subreddits
   - Click "Create Alert"

5. **Receive Notifications:**
   - **Email:** Every 15 minutes (batched)
   - **Push:** Every 5 minutes (instant)
   - **Bell icon** appears on device
   - Click notification → Opens Reddit comment

### System Flow:

```
Every 5 minutes:
1. monitor-keyword-alerts.js runs
2. Fetches recent Reddit comments
3. Checks against all active keyword alerts
4. Creates notifications for matches
5. Adds to notification_queue

Every 5 minutes:
1. send-push-notifications.js runs
2. Gets pending notifications
3. Checks user preferences
4. Sends push to all user devices
5. Logs to notification_history

Every 15 minutes:
1. send-email-notifications.js runs
2. Gets pending notifications
3. Batches by user
4. Sends email via Resend
5. Marks as sent
```

## 🎯 Features

### Keyword Alert Features:
- ✅ Monitor specific keywords in Reddit comments
- ✅ Filter by subreddits (or monitor popular ones)
- ✅ Negative keywords support
- ✅ Pause/resume alerts
- ✅ View statistics (total, today, this week)
- ✅ Delete alerts

### Push Notification Features:
- ✅ Browser push notifications
- ✅ Works on desktop (Chrome, Firefox, Edge)
- ✅ Works on Android (Chrome, Firefox)
- ✅ Bell icon with sound
- ✅ Click to open Reddit comment
- ✅ Multiple device support
- ❌ iOS Safari (Apple limitation)

### Email Notification Features:
- ✅ HTML email templates
- ✅ Batched notifications
- ✅ Direct links to comments
- ✅ Works everywhere
- ✅ Respects user preferences

## 🧪 Testing

### Test Push Notifications:

1. Go to Settings
2. Enable push notifications
3. You should see a test notification immediately
4. Create a keyword alert
5. Wait 5 minutes for monitoring to run
6. Check if notifications appear

### Test Email Notifications:

1. Create a keyword alert
2. Wait 15 minutes
3. Check your email inbox
4. Should receive email with matches

### Manual Testing:

You can manually trigger the functions:

```bash
# Test keyword monitoring
curl -X POST https://salesflow1.netlify.app/.netlify/functions/monitor-keyword-alerts

# Test push notifications
curl -X POST https://salesflow1.netlify.app/.netlify/functions/send-push-notifications

# Test email notifications
curl -X POST https://salesflow1.netlify.app/.netlify/functions/send-email-notifications
```

## 📊 Monitoring

### Check Netlify Function Logs:

1. Go to: https://app.netlify.com/sites/salesflow1/functions
2. Click on function name
3. View execution logs

### Check Database:

```sql
-- Active keyword alerts
SELECT * FROM keyword_alerts WHERE is_active = true;

-- Recent matches
SELECT * FROM keyword_alert_matches 
ORDER BY created_at DESC 
LIMIT 10;

-- Alert statistics
SELECT ka.name, kas.* 
FROM keyword_alert_stats kas
JOIN keyword_alerts ka ON ka.id = kas.alert_id;

-- Push subscriptions
SELECT user_id, COUNT(*) as device_count
FROM push_notification_tokens 
WHERE is_active = true
GROUP BY user_id;
```

## 🔧 Troubleshooting

### Push Notifications Not Working:

1. **Check browser support:**
   - Chrome/Edge: ✅ Supported
   - Firefox: ✅ Supported
   - Safari: ⚠️ Limited support
   - iOS Safari: ❌ Not supported

2. **Check permission:**
   - Browser settings → Notifications
   - Ensure site has permission

3. **Check VAPID keys:**
   - Verify keys are set in Netlify
   - Verify public key in code matches

4. **Check service worker:**
   - Open DevTools → Application → Service Workers
   - Should show "activated and running"

### Keyword Alerts Not Triggering:

1. **Check alert is active:**
   - Go to Settings → Keyword Alerts
   - Ensure alert shows "● Active"

2. **Check keywords:**
   - Make sure keywords are common enough
   - Try broader keywords first

3. **Check function logs:**
   - Netlify → Functions → monitor-keyword-alerts
   - Look for errors

4. **Check Reddit API:**
   - Function might be rate-limited
   - Check if Reddit is accessible

### Email Notifications Not Sending:

1. **Check Resend API key:**
   - Verify key is set in Netlify
   - Check Resend dashboard for errors

2. **Check user preferences:**
   - Settings → Notification Settings
   - Ensure email is enabled

3. **Check spam folder:**
   - Emails might be filtered

## 🎉 What Users Will See

### In Settings Page:

1. **Notification Settings** (existing)
   - Email toggle
   - Frequency selection
   - Notification types

2. **Keyword Alerts** (new!)
   - Browser push notification toggle
   - List of active alerts
   - Create alert button
   - Alert statistics
   - Pause/delete controls

### Notifications:

**Push Notification:**
```
🎯 Keyword Alert: CRM Opportunities
New comment matching "looking for CRM"

[View] [Dismiss]
```

**Email:**
```
Subject: 🎯 Keyword Alert: CRM Opportunities

New comment matching "looking for CRM"

Comment: "I'm looking for CRM software for my startup..."
Subreddit: r/entrepreneur
Post: "What tools do you use?"

[View Comment] [Open Dashboard]
```

## 📝 Next Steps

After setup is complete:

1. ✅ Run database migration
2. ✅ Generate and add VAPID keys
3. ✅ Update public key in code
4. ✅ Deploy and test
5. ✅ Create your first keyword alert
6. ✅ Enable push notifications
7. ✅ Monitor for matches!

## 🚀 Status

✅ All code implemented
✅ Services created
✅ UI components built
✅ Scheduled functions configured
✅ Service worker updated
⏳ Waiting for database migration
⏳ Waiting for VAPID keys
⏳ Waiting for deployment

The complete keyword alert system with push notifications and comment monitoring is ready to go live!
