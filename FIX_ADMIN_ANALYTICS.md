# 🔧 Fix Admin Analytics - Visitor Tracking Not Working

## ❌ Problem

Admin Analytics shows "Total Visitors: 179" but "0 today" - visitor tracking is not working properly.

## 🔍 Root Cause

The analytics database functions haven't been created yet. The app is tracking events, but the admin dashboard can't retrieve them because the SQL functions are missing.

## ✅ Solution

Run the SQL migration to create the analytics functions.

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Migration
Copy and paste the entire `FIX_ALL_ISSUES_STEP_BY_STEP.sql` file and click "Run"

**OR** run just the analytics section below:

```sql
-- ============================================
-- FIX ADMIN ANALYTICS - VISITOR TRACKING
-- ============================================

-- STEP 1: Drop existing functions (if any)
DROP FUNCTION IF EXISTS get_daily_visitor_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_device_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_traffic_sources(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_recent_visitors(INTEGER) CASCADE;

-- STEP 2: Create analytics table (if not exists)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    page_path TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- STEP 3: Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admins can read analytics" ON analytics_events;

CREATE POLICY "Anyone can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_settings
            WHERE user_settings.user_id = auth.uid()
            AND user_settings.is_admin = true
        )
    );

-- STEP 4: Create analytics functions

-- Function 1: Get daily visitor stats
CREATE FUNCTION get_daily_visitor_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_visitors BIGINT,
    unique_visitors BIGINT,
    page_views BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT session_id) as total_visitors,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_visitors,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views
    FROM analytics_events
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END;
$$;

-- Function 2: Get device stats
CREATE FUNCTION get_device_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    device_type TEXT,
    visitor_count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH device_counts AS (
        SELECT 
            COALESCE(ae.device_type, 'Unknown') as dev_type,
            COUNT(DISTINCT ae.session_id) as vis_count
        FROM analytics_events ae
        WHERE ae.created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY ae.device_type
    ),
    total_visitors AS (
        SELECT SUM(vis_count) as total FROM device_counts
    )
    SELECT 
        dc.dev_type::TEXT,
        dc.vis_count,
        ROUND((dc.vis_count::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) as percentage
    FROM device_counts dc
    CROSS JOIN total_visitors tv
    ORDER BY dc.vis_count DESC;
END;
$$;

-- Function 3: Get traffic sources
CREATE FUNCTION get_traffic_sources(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    source TEXT,
    visitor_count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH source_counts AS (
        SELECT 
            CASE 
                WHEN ae.utm_source IS NOT NULL THEN ae.utm_source
                WHEN ae.referrer IS NOT NULL AND ae.referrer != '' THEN 
                    CASE 
                        WHEN ae.referrer LIKE '%google%' THEN 'Google'
                        WHEN ae.referrer LIKE '%facebook%' THEN 'Facebook'
                        WHEN ae.referrer LIKE '%twitter%' OR ae.referrer LIKE '%t.co%' THEN 'Twitter'
                        WHEN ae.referrer LIKE '%linkedin%' THEN 'LinkedIn'
                        ELSE 'Referral'
                    END
                ELSE 'Direct'
            END as src,
            COUNT(DISTINCT ae.session_id) as vis_count
        FROM analytics_events ae
        WHERE ae.created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND ae.event_type = 'page_view'
        GROUP BY src
    ),
    total_visitors AS (
        SELECT SUM(vis_count) as total FROM source_counts
    )
    SELECT 
        sc.src::TEXT,
        sc.vis_count,
        ROUND((sc.vis_count::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) as percentage
    FROM source_counts sc
    CROSS JOIN total_visitors tv
    ORDER BY sc.vis_count DESC;
END;
$$;

-- Function 4: Get recent visitors
CREATE FUNCTION get_recent_visitors(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    session_id TEXT,
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    page_views BIGINT,
    device_type TEXT,
    browser TEXT,
    source TEXT,
    user_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.session_id::TEXT,
        MIN(ae.created_at) as first_seen,
        MAX(ae.created_at) as last_seen,
        COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as page_views,
        MAX(ae.device_type)::TEXT as device_type,
        MAX(ae.browser)::TEXT as browser,
        COALESCE(MAX(ae.utm_source), 'Direct')::TEXT as source,
        MAX(ae.user_id)::TEXT as user_id
    FROM analytics_events ae
    WHERE ae.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY ae.session_id
    ORDER BY MAX(ae.created_at) DESC
    LIMIT limit_count;
END;
$$;

-- STEP 5: Verify it worked
SELECT 
    'Analytics functions created successfully!' as status,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM analytics_events;
```

### Step 3: Verify Success

You should see output like:
```
status: "Analytics functions created successfully!"
total_events: 179
unique_sessions: 50
first_event: 2024-01-15 10:30:00
last_event: 2024-01-20 15:45:00
```

### Step 4: Test in Admin Dashboard

1. Go to your app
2. Click "Admin" in the sidebar
3. You should now see:
   - Total Visitors (with correct count)
   - Page Views
   - Visitor Trend chart
   - Device breakdown
   - Traffic sources
   - Recent visitors table

---

## 🧪 Troubleshooting

### Issue: "Function does not exist"
**Solution:** Make sure you ran the entire SQL script above.

### Issue: "Permission denied"
**Solution:** Make sure you're logged in as admin in Supabase.

### Issue: Still showing "0 today"
**Solution:** 
1. Check if analytics is being tracked:
```sql
SELECT COUNT(*) FROM analytics_events WHERE created_at >= CURRENT_DATE;
```

2. If count is 0, analytics isn't being tracked. Check browser console for errors.

3. If count > 0, refresh the admin dashboard.

### Issue: "relation analytics_events does not exist"
**Solution:** Run the table creation part of the script first (STEP 2).

---

## 📊 What Gets Fixed

After running this migration:

✅ **Daily visitor stats** - Shows visitors per day
✅ **Device breakdown** - Mobile, desktop, tablet percentages
✅ **Traffic sources** - Where visitors come from
✅ **Recent visitors** - Real-time visitor list
✅ **Visitor trend chart** - Visual graph of traffic
✅ **Page views tracking** - Total page views per day

---

## 🎯 Expected Results

**Before Fix:**
- Total Visitors: 179
- 0 today
- Empty charts
- No device stats
- No traffic sources

**After Fix:**
- Total Visitors: 179 (correct)
- X today (actual count)
- Populated charts
- Device breakdown (e.g., 60% desktop, 30% mobile, 10% tablet)
- Traffic sources (e.g., 50% direct, 30% Google, 20% social)
- Recent visitors table with real data

---

## 🚀 Next Steps

After fixing analytics:

1. **Monitor Traffic** - Check admin dashboard daily
2. **Track Conversions** - See which sources convert best
3. **Optimize for Devices** - Focus on most-used devices
4. **Marketing Insights** - Use traffic source data for campaigns

---

## 📝 Summary

**Problem:** Admin analytics not showing visitor data
**Cause:** Missing database functions
**Solution:** Run SQL migration to create functions
**Time:** 5 minutes
**Result:** Fully functional analytics dashboard

**Run `FIX_ALL_ISSUES_STEP_BY_STEP.sql` in Supabase to fix!** 🎉
