# Notification System Setup Guide

## ✅ What's Been Implemented

### Backend Infrastructure
- **Database Tables:**
  - `notification_preferences` - User notification settings
  - `notification_queue` - Pending notifications to be sent
  - `notification_history` - Log of sent notifications
  - `push_notification_tokens` - For future push notification support

- **Email Service:**
  - Netlify function: `send-email-notifications.js`
  - Uses Resend API for reliable email delivery
  - Batches notifications by user
  - Respects user preferences (frequency, enabled/disabled)
  - Beautiful HTML email templates with branding

- **Notification Types:**
  - New leads found
  - High potential leads
  - Campaign updates (auto-refresh)
  - Keyword alerts (coming soon)

### Frontend UI
- **NotificationSettings Component:**
  - Located in Settings page
  - Toggle email notifications on/off
  - Choose frequency: instant, hourly, or daily
  - Select what to be notified about:
    - New leads
    - High potential leads only
    - Campaign updates
  - Push notifications (coming soon)

## 🚀 Setup Steps

### 1. Run Database Migration
Copy and run the SQL from `notification_system_migration.sql` in your Supabase SQL Editor.

### 2. Add Resend API Key to Netlify
1. Go to: https://app.netlify.com/sites/salesflow1/configuration/env
2. Add environment variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_6pbSzuXX_3q1P6dcmf5qzrdHfVbKZjswN`
3. Redeploy the site

### 3. Configure Netlify Function Schedule
The email notification function runs automatically every 15 minutes via the schedule in `netlify.toml`:

```toml
[[functions]]
  path = "netlify/functions/send-email-notifications.js"
  schedule = "*/15 * * * *"
```

## 📧 How It Works

### Notification Flow:
1. **Trigger:** When new posts are found or campaigns refresh
2. **Queue:** Notification is added to `notification_queue` table
3. **Processing:** Scheduled function runs every 15 minutes
4. **Batching:** Groups notifications by user
5. **Preferences:** Checks user's notification settings
6. **Delivery:** Sends email via Resend API
7. **History:** Logs sent notification to `notification_history`

### Email Features:
- Professional HTML templates with SalesFlow branding
- Direct links to posts and dashboard
- Batched notifications (multiple leads in one email)
- Plain text fallback for email clients
- Unsubscribe/manage preferences link

## 🎯 User Experience

### For Users:
1. Go to **Settings** page
2. Scroll to **Notification Settings** section
3. Toggle email notifications on/off
4. Choose frequency (instant, hourly, daily)
5. Select notification types
6. Click **Save Preferences**

### Default Settings:
- Email notifications: **Enabled**
- Frequency: **Instant**
- New leads: **Enabled**
- High potential: **Enabled**
- Campaign updates: **Enabled**

## 🔮 Future Enhancements

### Push Notifications (Coming Soon):
- Browser push notifications
- Mobile app notifications
- Real-time alerts

### Keyword Alerts (In Progress):
- Monitor specific keywords
- Instant alerts when matched
- Separate from campaign keywords

### Advanced Features:
- Slack integration
- Discord webhooks
- SMS notifications (Twilio)
- Custom notification rules

## 🧪 Testing

### Test Email Notifications:
1. Create a campaign and find leads
2. Check `notification_queue` table for pending notifications
3. Wait for scheduled function (or trigger manually)
4. Check email inbox
5. Verify notification appears in `notification_history`

### Manual Trigger:
You can manually trigger the email function:
```bash
curl -X POST https://salesflow1.netlify.app/.netlify/functions/send-email-notifications
```

## 📊 Monitoring

### Check Notification Status:
```sql
-- Pending notifications
SELECT * FROM notification_queue WHERE status = 'pending';

-- Recent sent notifications
SELECT * FROM notification_history 
ORDER BY created_at DESC 
LIMIT 10;

-- User preferences
SELECT * FROM notification_preferences;
```

### Netlify Function Logs:
1. Go to: https://app.netlify.com/sites/salesflow1/functions
2. Click on `send-email-notifications`
3. View execution logs

## 🛠️ Troubleshooting

### Emails Not Sending:
1. Check Resend API key is set in Netlify
2. Verify user has email notifications enabled
3. Check `notification_queue` for pending items
4. Review Netlify function logs for errors

### Wrong Email Frequency:
- Frequency is checked when processing queue
- Instant: sends immediately
- Hourly: batches notifications from last hour
- Daily: batches notifications from last 24 hours

### Missing Notifications:
1. Check if notification was created in queue
2. Verify RLS policies allow user access
3. Check user's notification preferences
4. Review function execution logs

## 📝 Notes

- Resend has a free tier: 100 emails/day, 3,000/month
- For production, upgrade Resend plan as needed
- Email templates are customizable in the function
- All notifications respect user preferences
- Users can unsubscribe via settings page

## 🎉 Status

✅ Database schema created
✅ Email service implemented
✅ UI for managing preferences
✅ Scheduled function configured
✅ Resend package added to dependencies
⏳ Waiting for database migration
⏳ Waiting for Resend API key in Netlify

Once you complete steps 1-2 above, the notification system will be fully operational!
