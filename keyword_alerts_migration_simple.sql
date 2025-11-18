-- Keyword Alerts System Migration - SIMPLE VERSION
-- Creates tables for real-time keyword monitoring and alerts
-- This version removes complex indexes that cause issues

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
-- 5. Simple Indexes (no WHERE clauses)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_keyword_alerts_user 
ON keyword_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_keyword_alerts_keywords 
ON keyword_alerts USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_keyword_alert_matches_alert 
ON keyword_alert_matches(alert_id);

CREATE INDEX IF NOT EXISTS idx_keyword_alert_matches_created 
ON keyword_alert_matches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user
ON push_notification_tokens(user_id);

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
