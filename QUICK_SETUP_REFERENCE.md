# Quick Setup Reference - Keyword Alert System

## 🚀 5-Minute Setup

### Step 1: Generate VAPID Keys (2 minutes)
```bash
cd "c:\Users\user\Desktop\test2\tr\vioe\sales-flow (2)"
npx web-push generate-vapid-keys
```

**Copy the output:**
- Public Key: `BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY...`
- Private Key: `abcdefghijklmnopqrstuvwxyz123456789...`

---

### Step 2: Add to Netlify (1 minute)

Go to: https://app.netlify.com/sites/salesflow1/configuration/env

Add two variables:
1. **VAPID_PUBLIC_KEY** = (paste public key)
2. **VAPID_PRIVATE_KEY** = (paste private key)

---

### Step 3: Update Code (1 minute)

Edit: `services/pushNotificationService.ts` line 15

Change:
```typescript
private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY';
```

To:
```typescript
private vapidPublicKey = 'YOUR_PUBLIC_KEY_HERE';
```

Then push:
```bash
git add services/pushNotificationService.ts
git commit -m "Update VAPID public key"
git push origin main
```

---

### Step 4: Run SQL Migration (1 minute)

1. Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
2. Copy all SQL from: `keyword_alerts_migration.sql`
3. Paste into Supabase
4. Click "Run"

---

## ✅ Done!

Wait 2-3 minutes for Netlify to deploy, then:

1. Go to Settings page
2. Scroll to "Keyword Alerts"
3. Click "Enable" for push notifications
4. Create your first alert
5. Get notified! 🎉

---

## 📋 Files Reference

| File | Purpose |
|------|---------|
| `keyword_alerts_migration.sql` | Database schema |
| `services/keywordAlertsService.ts` | Alert management |
| `services/pushNotificationService.ts` | Push notifications |
| `components/KeywordAlertManager.tsx` | UI component |
| `netlify/functions/monitor-keyword-alerts.js` | Comment monitoring |
| `netlify/functions/send-push-notifications.js` | Push delivery |
| `public/service-worker.js` | Notification handling |

---

## 🔑 VAPID Keys Explained

**Public Key:**
- Safe to share
- Goes in code and Netlify
- Identifies your app

**Private Key:**
- Keep secret!
- Only in Netlify
- Signs notifications

---

## 🧪 Test It

1. Settings → Keyword Alerts
2. Enable push notifications
3. See test notification
4. Create alert: "looking for CRM"
5. Wait 5 minutes
6. Get notified when keywords appear!

---

## 📞 Need Help?

- VAPID setup: See `VAPID_CREDENTIALS_GUIDE.md`
- Full guide: See `KEYWORD_ALERT_SETUP_GUIDE.md`
- System explained: See `KEYWORD_ALERT_SYSTEM_EXPLAINED.md`

---

## 🎯 What Users See

**In Settings:**
- Notification Settings (email)
- Keyword Alerts (new!)
  - Enable push notifications
  - Create alerts
  - View statistics

**When keyword matches:**
- 🔔 Bell notification on device
- 📧 Email (every 15 min)
- 📱 Push (every 5 min)

---

## ⚡ Quick Checklist

- [ ] Generated VAPID keys
- [ ] Added to Netlify env
- [ ] Updated code
- [ ] Ran SQL migration
- [ ] Pushed to GitHub
- [ ] Netlify deployed
- [ ] Tested push notifications
- [ ] Created first alert
- [ ] Receiving notifications ✅

Done! 🚀
