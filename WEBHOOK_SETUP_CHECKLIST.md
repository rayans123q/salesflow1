# Whop Webhook Setup - Complete Checklist

## ✅ What You Have So Far

1. ✅ Webhook secret: `ws_f8484dd3293819a7abc6bebf6b5da69e0c4d42590671567a674d6101d00ee089`
2. ✅ Webhook permissions enabled in API key
3. ✅ Backend functions created (whop-webhook.js)
4. ✅ Payment verification system ready

---

## 📋 Next Steps

### Step 1: Add Webhook Secret to Netlify (5 minutes)

1. Go to: https://app.netlify.com
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Click **"Add a variable"** or **"Import from file"**
5. Add this variable:
   ```
   Key: WHOP_WEBHOOK_SECRET
   Value: ws_f8484dd3293819a7abc6bebf6b5da69e0c4d42590671567a674d6101d00ee089
   ```
6. Click **"Save"**

**OR** Import the entire `netlify-env-import.txt` file which now includes the webhook secret.

### Step 2: Configure Webhook Endpoint in Whop (5 minutes)

1. In Whop Dashboard, go to **Developer** section
2. Find **"Webhooks"** or **"Webhook Endpoints"**
3. Click **"Add Endpoint"** or **"Create Webhook"**
4. Enter your webhook URL:
   ```
   https://your-app-name.netlify.app/.netlify/functions/whop-webhook
   ```
   Replace `your-app-name` with your actual Netlify site name

5. Select these events (check all that apply):
   - ✅ `membership.created`
   - ✅ `membership.went_valid`
   - ✅ `membership.went_invalid`
   - ✅ `membership.cancelled`
   - ✅ `membership.expired`
   - ✅ `membership.renewed`
   - ✅ `payment.succeeded`

6. The webhook secret should already be set (the one you copied)
7. Click **"Save"** or **"Create"**

### Step 3: Run Database Migration (5 minutes)

1. Go to Supabase: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **"New query"**
5. Copy and paste the contents from: `supabase_migration_secure_subscriptions.sql`
6. Click **"Run"**
7. You should see: "Success. No rows returned"

This creates:
- New columns for webhook data
- `webhook_logs` table for debugging
- Function to clean up expired subscriptions

### Step 4: Test the Webhook (10 minutes)

#### Option A: Test with Whop Test Events
1. In Whop Dashboard → Developer → Webhooks
2. Find your webhook endpoint
3. Click **"Test"** or **"Send test event"**
4. Select event type: `membership.created`
5. Click **"Send"**

#### Option B: Make a Real Test Payment
1. Use Whop test mode
2. Create a test membership
3. Complete payment
4. Check if webhook was received

### Step 5: Verify Webhook is Working

1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard
   - Click on **Functions**
   - Click on `whop-webhook`
   - View recent logs
   - Look for: "📥 Whop webhook received"

2. **Check Supabase Webhook Logs:**
   ```sql
   SELECT * FROM webhook_logs 
   ORDER BY processed_at DESC 
   LIMIT 10;
   ```
   You should see logged webhook events

3. **Check Subscription Status:**
   ```sql
   SELECT email, status, payment_verified, whop_membership_id
   FROM subscribed_users
   ORDER BY subscribed_at DESC;
   ```

---

## 🔍 Troubleshooting

### Webhook Not Receiving Events

**Check 1: Netlify Function Deployed**
- Go to Netlify → Functions
- Verify `whop-webhook` is listed
- If not, redeploy your site

**Check 2: Webhook URL Correct**
- Should be: `https://your-site.netlify.app/.netlify/functions/whop-webhook`
- No trailing slash
- Must be HTTPS

**Check 3: Webhook Secret Matches**
- Netlify env var: `WHOP_WEBHOOK_SECRET`
- Should match the secret from Whop

**Check 4: Events Selected**
- Make sure you selected the membership events in Whop

### Webhook Receiving But Not Processing

**Check Netlify Logs:**
```
Netlify Dashboard → Functions → whop-webhook → View logs
```

Look for error messages like:
- "Invalid signature" → Secret doesn't match
- "Database error" → Supabase credentials wrong
- "No email in payload" → Whop event format issue

**Check Supabase Logs:**
```sql
SELECT * FROM webhook_logs 
WHERE success = false
ORDER BY processed_at DESC;
```

### Manual Testing

You can manually trigger the webhook function:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/whop-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "membership.created",
    "data": {
      "id": "mem_test123",
      "email": "test@example.com",
      "status": "active",
      "valid": true,
      "cancel_at_period_end": false,
      "expires_at": null
    }
  }'
```

---

## 📊 What Happens Now

### When User Subscribes:
1. User completes payment on Whop
2. Whop sends `membership.created` webhook
3. Your function receives it
4. Subscription activated in database
5. User redirected to thank you page
6. User enters email and gets access

### When Subscription Expires:
1. Subscription reaches expiration date
2. Whop sends `membership.expired` webhook
3. Your function receives it
4. Subscription deactivated in database
5. User loses access to locked features

### When User Renews:
1. User re-subscribes
2. Whop sends `membership.renewed` webhook
3. Your function receives it
4. Subscription re-activated in database
5. User regains access immediately

---

## 🎯 Success Criteria

You'll know everything is working when:

✅ Webhook endpoint shows "Active" in Whop dashboard
✅ Test events appear in Netlify function logs
✅ Webhook events logged in Supabase `webhook_logs` table
✅ Test subscription activates in `subscribed_users` table
✅ User can access locked features after payment
✅ Expired subscriptions automatically deactivated

---

## 🔄 Backup: Polling System

If webhooks don't work for any reason, you have a backup!

The `sync-subscriptions` function runs every hour and:
- Checks all active subscriptions with Whop API
- Deactivates expired ones
- Activates renewed ones
- Finds new subscriptions

**To enable polling:**
1. It's already configured in `netlify.toml`
2. Runs automatically every hour
3. No additional setup needed

**To test polling manually:**
```
https://your-site.netlify.app/.netlify/functions/sync-subscriptions
```

---

## 📞 Need Help?

### Check These First:
1. Netlify function logs
2. Supabase webhook_logs table
3. Whop webhook delivery logs

### Common Issues:
- **401 Unauthorized**: Webhook secret doesn't match
- **404 Not Found**: Webhook URL is wrong
- **500 Server Error**: Check Netlify function logs for details

### Still Stuck?
- Check `SECURE_PAYMENT_SYSTEM.md` for detailed docs
- Check `PAYMENT_SECURITY_SUMMARY.md` for quick reference
- Test with polling system as backup

---

## ✅ Final Checklist

Before going live:

- [ ] Webhook secret added to Netlify
- [ ] Webhook endpoint configured in Whop
- [ ] Database migration run in Supabase
- [ ] Test webhook sent successfully
- [ ] Webhook logs showing in Supabase
- [ ] Test payment flow works end-to-end
- [ ] Subscription activates after payment
- [ ] Locked features unlock after subscription

---

**You're almost done!** Just complete Steps 1-5 above and your secure payment system will be fully operational! 🚀
