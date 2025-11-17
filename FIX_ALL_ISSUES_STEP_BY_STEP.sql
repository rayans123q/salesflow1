-- ============================================
-- STEP-BY-STEP FIX FOR ALL ISSUES
-- Run each section separately if needed
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING FUNCTIONS
-- ============================================
-- Run this first to clean up any existing functions

DROP FUNCTION IF EXISTS get_daily_visitor_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_device_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_traffic_sources(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_recent_visitors(INTEGER) CASCADE;

-- ============================================
-- STEP 2: CREATE ANALYTICS TABLE
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- ============================================
-- STEP 3: ADD is_admin COLUMN
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================
-- STEP 4: ENABLE RLS ON ANALYTICS
-- ============================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admins can read analytics" ON analytics_events;

-- Create new policies
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

-- ============================================
-- STEP 5: CREATE ANALYTICS FUNCTIONS
-- ============================================

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

-- ============================================
-- STEP 6: CREATE POST DRAFTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_drafts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_id ON post_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_campaign_id ON post_drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_is_published ON post_drafts(is_published);

-- ============================================
-- STEP 7: ENABLE RLS ON POST DRAFTS
-- ============================================

ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can insert own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can delete own drafts" ON post_drafts;

-- Create policies
CREATE POLICY "Users can view own drafts" ON post_drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts" ON post_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON post_drafts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON post_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: ADD STATUS TO POSTS TABLE
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'status'
    ) THEN
        ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

UPDATE posts SET status = 'active' WHERE status IS NULL;

-- ============================================
-- STEP 9: CREATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_drafts_updated_at ON post_drafts;

CREATE TRIGGER update_post_drafts_updated_at
    BEFORE UPDATE ON post_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Analytics table exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events');

SELECT 'Post drafts table exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_drafts');

SELECT 'Functions created' as status
WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_daily_visitor_stats');

-- ============================================
-- DONE!
-- ============================================
