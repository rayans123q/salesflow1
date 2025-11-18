-- Notification System Migration
-- Creates tables and functions for push notifications and email alerts

-- ============================================
-- 1. Notification Preferences Table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    email_frequency TEXT DEFAULT 'instant', -- instant, hourly, daily
    notification_types JSONB DEFAULT '{"new_posts": true, "high_relevance": true, "campaign_updates": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Push Notification Tokens Table
-- ============================================
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT NOT NULL, -- 'ios', 'android', 'web'
    device_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- ============================================
-- 3. Notification Queue Table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'new_post', 'high_relevance', 'campaign_update'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Notification History Table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'email', 'push'
    status TEXT NOT NULL, -- 'sent', 'failed', 'opened'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_status 
ON notification_queue(user_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_created 
ON notification_queue(created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_push_tokens_user 
ON push_notification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_user 
ON notification_history(user_id, created_at DESC);

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Push Notification Tokens
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_notification_tokens;
CREATE POLICY "Users can manage their own push tokens" ON push_notification_tokens
    FOR ALL USING (user_id = auth.uid());

-- Notification Queue (read-only for users)
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
CREATE POLICY "Users can view their own notifications" ON notification_queue
    FOR SELECT USING (user_id = auth.uid());

-- Notification History
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
CREATE POLICY "Users can view their own notification history" ON notification_history
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 7. Function: Create Notification
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_campaign_id INTEGER,
    p_post_id INTEGER,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notification_queue (
        user_id,
        campaign_id,
        post_id,
        notification_type,
        title,
        message,
        data
    ) VALUES (
        p_user_id,
        p_campaign_id,
        p_post_id,
        p_notification_type,
        p_title,
        p_message,
        p_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Function: Get Pending Notifications
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_notifications(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    campaign_id INTEGER,
    post_id INTEGER,
    notification_type TEXT,
    title TEXT,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nq.id,
        nq.user_id,
        u.email as user_email,
        nq.campaign_id,
        nq.post_id,
        nq.notification_type,
        nq.title,
        nq.message,
        nq.data,
        nq.created_at
    FROM notification_queue nq
    JOIN auth.users u ON u.id = nq.user_id
    WHERE nq.status = 'pending'
    ORDER BY nq.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Comments
-- ============================================
COMMENT ON TABLE notification_preferences IS 'User notification preferences for email and push notifications';
COMMENT ON TABLE push_notification_tokens IS 'Device tokens for push notifications';
COMMENT ON TABLE notification_queue IS 'Queue of notifications to be sent';
COMMENT ON TABLE notification_history IS 'History of sent notifications';

-- ============================================
-- 10. Grant Permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notification_tokens TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON notification_history TO authenticated;
