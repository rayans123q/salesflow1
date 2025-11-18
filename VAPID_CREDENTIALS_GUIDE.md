# VAPID Credentials Setup Guide

## What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are cryptographic credentials that identify your application to push notification services. They're required for sending browser push notifications.

**Think of it like:**
- Public Key = Your app's public ID (safe to share)
- Private Key = Your app's secret password (keep it safe!)

---

## Step 1: Generate VAPID Keys

### Option A: Using Node.js (Recommended)

**Prerequisites:**
- Node.js installed on your computer
- npm (comes with Node.js)

**Steps:**

1. Open your terminal/command prompt
2. Navigate to your project directory:
   ```bash
   cd "c:\Users\user\Desktop\test2\tr\vioe\sales-flow (2)"
   ```

3. Run the web-push command:
   ```bash
   npx web-push generate-vapid-keys
   ```

4. You'll see output like:
   ```
   Public Key:
   BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY4Z5-7MQbb5aLSstRUVjQtGo5HhTe8uWWAw...

   Private Key:
   abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789...
   ```

5. **Copy both keys** - you'll need them in the next steps

### Option B: Using Online Generator (Not Recommended for Production)

If you can't use Node.js, you can use an online tool:
- https://web-push-codelab.glitch.me/

**Warning:** Only use this for testing. For production, use Option A.

---

## Step 2: Add Keys to Netlify Environment Variables

### Go to Netlify Dashboard:

1. Open: https://app.netlify.com/sites/salesflow1/configuration/env

2. Click **"Edit variables"** or **"Add a variable"**

3. Add **VAPID_PUBLIC_KEY:**
   - **Key:** `VAPID_PUBLIC_KEY`
   - **Value:** Paste your public key from Step 1
   - Click **Save**

4. Add **VAPID_PRIVATE_KEY:**
   - **Key:** `VAPID_PRIVATE_KEY`
   - **Value:** Paste your private key from Step 1
   - Click **Save**

**Your Netlify env variables should now look like:**
```
VAPID_PUBLIC_KEY = BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY...
VAPID_PRIVATE_KEY = abcdefghijklmnopqrstuvwxyz123456789ABCDEFGH...
VITE_SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY = re_6pbSzuXX_3q1P6dcmf5qzrdHfVbKZjswN
```

---

## Step 3: Update Public Key in Code

The public key also needs to be in your frontend code.

### Edit `services/pushNotificationService.ts`:

1. Open the file: `services/pushNotificationService.ts`

2. Find line 15:
   ```typescript
   private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY';
   ```

3. Replace with your actual public key:
   ```typescript
   private vapidPublicKey = 'YOUR_ACTUAL_PUBLIC_KEY_HERE';
   ```

   Example:
   ```typescript
   private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY4Z5-7MQbb5aLSstRUVjQtGo5HhTe8uWWAw...';
   ```

4. Save the file

5. Commit and push:
   ```bash
   git add services/pushNotificationService.ts
   git commit -m "Update VAPID public key"
   git push origin main
   ```

---

## Step 4: Run Database Migration

Copy the entire SQL code from `keyword_alerts_migration.sql` and run it in Supabase:

### Steps:

1. Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new

2. Copy all SQL from `keyword_alerts_migration.sql`

3. Paste into Supabase SQL Editor

4. Click **"Run"** button

5. You should see: "Success. No rows returned"

**This creates:**
- `keyword_alerts` table
- `keyword_alert_matches` table
- `keyword_alert_stats` table
- `push_notification_tokens` table
- All indexes and RLS policies

---

## Step 5: Deploy

Push your changes to GitHub:

```bash
git add -A
git commit -m "Add VAPID keys and database migration"
git push origin main
```

Netlify will automatically deploy. Wait 2-3 minutes for deployment to complete.

---

## Complete SQL Code

Here's the complete SQL to run in Supabase:

```sql
-- Keyword Alerts System Migration
-- Creates tables for real-time keyword monitoring and alerts

-- ============================================
-- 1. Keyword Alerts Table
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    negative_keywords TEXT[] DEFAULT NULL,
    subreddits TEXT[] DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    alert_frequency TEXT DEFAULT 'instant',
    last_triggered TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Keyword Alert Matches Table
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_alert_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES keyword_alerts(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    matched_keywords TEXT[] NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 0.0,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alert_id, post_id)
);

-- ============================================
-- 3. Alert Statistics Table
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_alert_stats (
    alert_id UUID PRIMARY KEY REFERENCES keyword_alerts(id) ON DELETE CASCADE,
    total_matches INTEGER DEFAULT 0,
    matches_today INTEGER DEFAULT 0,
    matches_this_week INTEGER DEFAULT 0,
    matches_this_month INTEGER DEFAULT 0,
    last_match_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Push Notification Tokens Table
-- ============================================
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_keyword_alerts_user_active 
ON keyword_alerts(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_keyword_alerts_keywords 
ON keyword_alerts USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_keyword_alert_matches_alert 
ON keyword_alert_matches(alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_keyword_alert_matches_notification 
ON keyword_alert_matches(notification_sent, created_at) WHERE notification_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active
ON push_notification_tokens(user_id, is_active) WHERE is_active = TRUE;

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Keyword Alerts
ALTER TABLE keyword_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own keyword alerts" ON keyword_alerts;
CREATE POLICY "Users can manage their own keyword alerts" ON keyword_alerts
    FOR ALL USING (user_id = auth.uid());

-- Keyword Alert Matches
ALTER TABLE keyword_alert_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own alert matches" ON keyword_alert_matches;
CREATE POLICY "Users can view their own alert matches" ON keyword_alert_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM keyword_alerts ka 
            WHERE ka.id = keyword_alert_matches.alert_id 
            AND ka.user_id = auth.uid()
        )
    );

-- Alert Statistics
ALTER TABLE keyword_alert_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own alert stats" ON keyword_alert_stats;
CREATE POLICY "Users can view their own alert stats" ON keyword_alert_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM keyword_alerts ka 
            WHERE ka.id = keyword_alert_stats.alert_id 
            AND ka.user_id = auth.uid()
        )
    );

-- Push Notification Tokens
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_notification_tokens;
CREATE POLICY "Users can manage their own push tokens" ON push_notification_tokens
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 7. Functions
-- ============================================

-- Function: Create Keyword Alert
CREATE OR REPLACE FUNCTION create_keyword_alert(
    p_user_id UUID,
    p_name TEXT,
    p_keywords TEXT[],
    p_negative_keywords TEXT[] DEFAULT NULL,
    p_subreddits TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO keyword_alerts (
        user_id,
        name,
        keywords,
        negative_keywords,
        subreddits
    ) VALUES (
        p_user_id,
        p_name,
        p_keywords,
        p_negative_keywords,
        p_subreddits
    ) RETURNING id INTO v_alert_id;
    
    -- Initialize stats
    INSERT INTO keyword_alert_stats (alert_id) VALUES (v_alert_id);
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Comments
-- ============================================
COMMENT ON TABLE keyword_alerts IS 'User-defined keyword monitoring alerts for real-time notifications';
COMMENT ON TABLE keyword_alert_matches IS 'Posts/comments that matched keyword alerts';
COMMENT ON TABLE keyword_alert_stats IS 'Statistics for keyword alert performance';
COMMENT ON TABLE push_notification_tokens IS 'Browser push notification subscriptions';

-- ============================================
-- 9. Grant Permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON keyword_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON keyword_alert_matches TO authenticated;
GRANT SELECT ON keyword_alert_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notification_tokens TO authenticated;
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] VAPID keys generated
- [ ] VAPID_PUBLIC_KEY added to Netlify
- [ ] VAPID_PRIVATE_KEY added to Netlify
- [ ] Public key updated in `pushNotificationService.ts`
- [ ] SQL migration run in Supabase
- [ ] Changes pushed to GitHub
- [ ] Netlify deployment complete
- [ ] No errors in Netlify function logs

---

## Testing Push Notifications

Once everything is set up:

1. Go to Settings page
2. Scroll to "Keyword Alerts"
3. Click "Enable" for push notifications
4. Browser will ask for permission
5. Grant permission
6. You should see a test notification
7. Create a keyword alert
8. Wait 5 minutes
9. Check for notifications!

---

## Troubleshooting

### "VAPID keys not configured" error

**Solution:** Check that both environment variables are set in Netlify:
- https://app.netlify.com/sites/salesflow1/configuration/env

### Push notifications not working

**Check:**
1. Browser supports push (Chrome, Firefox, Edge)
2. Permission granted in browser settings
3. Service worker is active (DevTools → Application → Service Workers)
4. VAPID keys are correct

### "Invalid VAPID keys" error

**Solution:** Regenerate keys:
```bash
npx web-push generate-vapid-keys
```

Then update both Netlify and code.

---

## Security Notes

- ✅ Public key is safe to share (it's in your code)
- ⚠️ Private key is SECRET - never commit to GitHub
- ✅ Netlify environment variables are encrypted
- ✅ Keys are only used server-side for sending notifications

---

## Next Steps

1. Generate VAPID keys
2. Add to Netlify
3. Update code
4. Run SQL migration
5. Deploy
6. Test!

You're all set! 🚀
