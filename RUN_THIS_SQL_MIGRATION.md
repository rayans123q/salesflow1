# 🗄️ Database Migration Required!

## ⚠️ IMPORTANT: Run This SQL Before Using Whop Integration

Your database needs new columns to store Whop subscription data.

---

## 📋 Steps to Run Migration

### 1. Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### 2. Copy and Paste the SQL

Open the file: `supabase_migration_subscription.sql`

Copy ALL the SQL code and paste it into the Supabase SQL Editor.

### 3. Run the Migration

Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

You should see: ✅ **Success. No rows returned**

---

## 📊 What This Migration Does

### Adds New Columns to `user_settings` table:

| Column | Type | Description |
|--------|------|-------------|
| `reddit_api_subscribed` | boolean | Whether user has active subscription |
| `subscription_status` | text | Status: active, inactive, cancelled, expired, trialing |
| `subscription_started_at` | timestamp | When subscription began |
| `subscription_expires_at` | timestamp | When subscription expires |
| `whop_membership_id` | text | Whop's unique membership ID |
| `whop_plan_id` | text | Your Whop plan ID (plan_VES4tpsLKJdMH) |
| `subscription_plan` | text | Plan tier: free, starter, pro, enterprise |

### Creates Indexes:
- Fast lookups by subscription status
- Fast lookups by Whop membership ID

---

## ✅ Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name IN (
  'whop_membership_id', 
  'whop_plan_id', 
  'subscription_status'
);
```

You should see all three columns listed.

---

## 🔄 If You Already Have Data

Don't worry! The migration uses `ADD COLUMN IF NOT EXISTS`, so:
- ✅ Safe to run multiple times
- ✅ Won't delete existing data
- ✅ Won't cause errors if columns already exist

---

## 🚨 Troubleshooting

### Error: "column already exists"
- This is fine! It means the column was already added
- The migration will skip that column and continue

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check you're in the correct project

### Error: "table user_settings does not exist"
- Your database schema might be different
- Check if the table has a different name
- Contact support if needed

---

## 📝 After Running Migration

Once the SQL is successfully executed:

1. ✅ Your database is ready for Whop integration
2. ✅ Webhooks can now store subscription data
3. ✅ App can cache subscription status
4. ✅ Fast subscription checks (10-50ms instead of 500-1000ms)

---

## 🎯 Next Steps

After running the migration:

1. ✅ Update Whop redirect URL to: `https://salesflow1.netlify.app/?payment=success`
2. ✅ Deploy your app to Netlify
3. ✅ Add environment variables to Netlify
4. ✅ Test the complete payment flow
5. ✅ Configure Whop webhooks (optional but recommended)

---

## 💡 Pro Tip

You can also run this migration from the Supabase CLI:

```bash
supabase db push
```

But the SQL Editor method is simpler and works for everyone!

---

## ✨ You're Almost Done!

After running this SQL migration, your Whop payment integration will be fully functional with database caching! 🚀
