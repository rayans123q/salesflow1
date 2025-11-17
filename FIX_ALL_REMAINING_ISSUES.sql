-- ============================================
-- FIX ALL REMAINING ISSUES
-- ============================================
-- This migration fixes:
-- 1. Visitor tracker showing zero
-- 2. Draft posts functionality
-- 3. Analytics database functions
-- ============================================

-- ============================================
-- 1. CREATE ANALYTICS TABLE (if not exists)
-- ============================================

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Add is_admin column to user_settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Policy: Only admins can read analytics
CREATE POLICY "Admins can read analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_settings
            WHERE user_settings.user_id = auth.uid()
            AND user_settings.is_admin = true
        )
    );

-- ============================================
-- 2. CREATE ANALYTICS DATABASE FUNCTIONS
-- ============================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_daily_visitor_stats(INTEGER);
DROP FUNCTION IF EXISTS get_device_stats(INTEGER);
DROP FUNCTION IF EXISTS get_traffic_sources(INTEGER);
DROP FUNCTION IF EXISTS get_recent_visitors(INTEGER);

-- Function: Get daily visitor stats
CREATE OR REPLACE FUNCTION get_daily_visitor_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_visitors BIGINT,
    unique_visitors BIGINT,
    page_views BIGINT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get device stats
CREATE OR REPLACE FUNCTION get_device_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    device_type TEXT,
    visitor_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH device_counts AS (
        SELECT 
            COALESCE(device_type, 'Unknown') as device_type,
            COUNT(DISTINCT session_id) as visitor_count
        FROM analytics_events
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY device_type
    ),
    total_visitors AS (
        SELECT SUM(visitor_count) as total FROM device_counts
    )
    SELECT 
        dc.device_type,
        dc.visitor_count,
        ROUND((dc.visitor_count::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) as percentage
    FROM device_counts dc
    CROSS JOIN total_visitors tv
    ORDER BY dc.visitor_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get traffic sources
CREATE OR REPLACE FUNCTION get_traffic_sources(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    source TEXT,
    visitor_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH source_counts AS (
        SELECT 
            CASE 
                WHEN utm_source IS NOT NULL THEN utm_source
                WHEN referrer IS NOT NULL AND referrer != '' THEN 
                    CASE 
                        WHEN referrer LIKE '%google%' THEN 'Google'
                        WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                        WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
                        WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
                        ELSE 'Referral'
                    END
                ELSE 'Direct'
            END as source,
            COUNT(DISTINCT session_id) as visitor_count
        FROM analytics_events
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND event_type = 'page_view'
        GROUP BY source
    ),
    total_visitors AS (
        SELECT SUM(visitor_count) as total FROM source_counts
    )
    SELECT 
        sc.source,
        sc.visitor_count,
        ROUND((sc.visitor_count::NUMERIC / NULLIF(tv.total, 0)) * 100, 2) as percentage
    FROM source_counts sc
    CROSS JOIN total_visitors tv
    ORDER BY sc.visitor_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent visitors
CREATE OR REPLACE FUNCTION get_recent_visitors(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    session_id TEXT,
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    page_views BIGINT,
    device_type TEXT,
    browser TEXT,
    source TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.session_id,
        MIN(ae.created_at) as first_seen,
        MAX(ae.created_at) as last_seen,
        COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as page_views,
        MAX(ae.device_type) as device_type,
        MAX(ae.browser) as browser,
        COALESCE(MAX(ae.utm_source), 'Direct') as source,
        MAX(ae.user_id) as user_id
    FROM analytics_events ae
    WHERE ae.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY ae.session_id
    ORDER BY last_seen DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ADD DRAFT STATUS TO POSTS TABLE
-- ============================================

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'status'
    ) THEN
        ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Update existing posts to have 'active' status
UPDATE posts SET status = 'active' WHERE status IS NULL;

-- Add constraint to ensure valid status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'posts_status_check'
    ) THEN
        ALTER TABLE posts ADD CONSTRAINT posts_status_check 
        CHECK (status IN ('draft', 'active', 'contacted', 'archived'));
    END IF;
END $$;

-- ============================================
-- 4. CREATE DRAFTS TABLE FOR AI-GENERATED POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS post_drafts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'text', -- 'text', 'link', 'image'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_id ON post_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_campaign_id ON post_drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_is_published ON post_drafts(is_published);

-- Enable RLS
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own drafts
CREATE POLICY "Users can view own drafts" ON post_drafts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own drafts
CREATE POLICY "Users can insert own drafts" ON post_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own drafts
CREATE POLICY "Users can update own drafts" ON post_drafts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own drafts
CREATE POLICY "Users can delete own drafts" ON post_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to post_drafts
DROP TRIGGER IF EXISTS update_post_drafts_updated_at ON post_drafts;
CREATE TRIGGER update_post_drafts_updated_at
    BEFORE UPDATE ON post_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if analytics table exists
SELECT 'analytics_events table exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events');

-- Check if post_drafts table exists
SELECT 'post_drafts table exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_drafts');

-- Check if functions exist
SELECT 'get_daily_visitor_stats function exists' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_daily_visitor_stats');

SELECT 'get_device_stats function exists' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_device_stats');

SELECT 'get_traffic_sources function exists' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_traffic_sources');

SELECT 'get_recent_visitors function exists' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_recent_visitors');

-- ============================================
-- DONE!
-- ============================================
-- After running this migration:
-- 1. Visitor tracker will work properly
-- 2. Draft posts functionality will be available
-- 3. Analytics functions will return data
-- ============================================
