-- Enhanced Admin Panel Database Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- SECTION 1: CREATE NEW TABLES
-- ============================================================================

-- Table for tracking website visitors
CREATE TABLE IF NOT EXISTS visitor_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_ip TEXT,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    session_id TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    country TEXT,
    city TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    visit_duration INTEGER DEFAULT 0, -- in seconds
    page_views INTEGER DEFAULT 1,
    is_unique_visitor BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'user_deleted', 'subscription_changed', 'user_verified', etc.
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for system notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'new_signup', 'expired_subscription', 'reported_post', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: ENHANCE USERS TABLE
-- ============================================================================

-- Add verification status to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add last_login to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add total_posts to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_posts') THEN
        ALTER TABLE users ADD COLUMN total_posts INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for visitor_analytics
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created_at ON visitor_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_user_id ON visitor_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session_id ON visitor_analytics(session_id);

-- Indexes for admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);

-- Indexes for admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Indexes for enhanced users table
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for visitor_analytics (admin only read, system can insert)
CREATE POLICY "Admin can view all visitor analytics" ON visitor_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert visitor analytics" ON visitor_analytics
    FOR INSERT WITH CHECK (true);

-- Policies for admin_logs (admin only)
CREATE POLICY "Admin can view all admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policies for admin_notifications (admin only)
CREATE POLICY "Admin can view all notifications" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update notifications" ON admin_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SECTION 5: DATABASE FUNCTIONS
-- ============================================================================

-- Function to update user total_posts count
CREATE OR REPLACE FUNCTION update_user_total_posts()
RETURNS TRIGGER AS $$
DECLARE
    affected_user_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get user_id from campaign
        SELECT user_id INTO affected_user_id
        FROM campaigns
        WHERE id = NEW.campaign_id;
        
        IF affected_user_id IS NOT NULL THEN
            UPDATE users 
            SET total_posts = (
                SELECT COUNT(*) 
                FROM posts p
                JOIN campaigns c ON p.campaign_id = c.id
                WHERE c.user_id = affected_user_id
            )
            WHERE id = affected_user_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Get user_id from campaign
        SELECT user_id INTO affected_user_id
        FROM campaigns
        WHERE id = OLD.campaign_id;
        
        IF affected_user_id IS NOT NULL THEN
            UPDATE users 
            SET total_posts = (
                SELECT COUNT(*) 
                FROM posts p
                JOIN campaigns c ON p.campaign_id = c.id
                WHERE c.user_id = affected_user_id
            )
            WHERE id = affected_user_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    notification_type TEXT,
    notification_title TEXT,
    notification_message TEXT,
    notification_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO admin_notifications (type, title, message, data)
    VALUES (notification_type, notification_title, notification_message, notification_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_id UUID,
    action_type TEXT,
    target_user_id UUID DEFAULT NULL,
    action_details JSONB DEFAULT '{}',
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_logs (admin_user_id, action_type, target_user_id, action_details, ip_address, user_agent)
    VALUES (admin_id, action_type, target_user_id, action_details, ip_address, user_agent)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify admins on new user signup
CREATE OR REPLACE FUNCTION notify_admin_new_signup()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_admin_notification(
        'new_signup',
        'New User Signup',
        'New user ' || NEW.name || ' has signed up',
        jsonb_build_object('user_id', NEW.id, 'user_email', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: DATABASE TRIGGERS
-- ============================================================================

-- Create trigger to automatically update total_posts
DROP TRIGGER IF EXISTS trigger_update_user_total_posts ON posts;
CREATE TRIGGER trigger_update_user_total_posts
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_posts();

-- Create trigger to notify admins on new user signup
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON users;
CREATE TRIGGER trigger_notify_admin_new_signup
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_signup();

-- ============================================================================
-- SECTION 7: DATABASE VIEWS
-- ============================================================================

-- Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    -- User stats
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as users_today,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as users_this_week,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_this_month,
    (SELECT COUNT(*) FROM users WHERE is_verified = true) as verified_users,
    
    -- Subscription stats (from user_settings table)
    (SELECT COUNT(*) FROM user_settings WHERE subscription_status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM user_settings WHERE subscription_status = 'expired') as expired_subscriptions,
    (SELECT COUNT(*) FROM user_settings WHERE subscription_status = 'cancelled') as cancelled_subscriptions,
    
    -- Campaign and post stats
    (SELECT COUNT(*) FROM campaigns) as total_campaigns,
    (SELECT COUNT(*) FROM campaigns WHERE created_at >= CURRENT_DATE) as campaigns_today,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM posts WHERE created_at >= CURRENT_DATE) as posts_today,
    
    -- Visitor stats
    (SELECT COUNT(*) FROM visitor_analytics) as total_visits,
    (SELECT COUNT(*) FROM visitor_analytics WHERE created_at >= CURRENT_DATE) as visits_today,
    (SELECT COUNT(*) FROM visitor_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as visits_this_week,
    (SELECT COUNT(*) FROM visitor_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as visits_this_month,
    (SELECT COUNT(DISTINCT visitor_ip) FROM visitor_analytics WHERE created_at >= CURRENT_DATE) as unique_visitors_today,
    
    -- Revenue estimation (assuming $9/month per active subscription)
    (SELECT COUNT(*) FROM user_settings WHERE subscription_status = 'active') * 9 as estimated_monthly_revenue;

-- ============================================================================
-- SECTION 8: INITIAL DATA POPULATION (OPTIONAL)
-- ============================================================================

-- Update existing users' total_posts count
UPDATE users 
SET total_posts = (
    SELECT COUNT(*) 
    FROM posts p
    JOIN campaigns c ON p.campaign_id = c.id
    WHERE c.user_id = users.id
);

-- ============================================================================
-- ROLLBACK SCRIPT (Keep for reference, do not run)
-- ============================================================================

/*
-- To rollback this migration, run the following:

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_user_total_posts ON posts;
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON users;

-- Drop functions
DROP FUNCTION IF EXISTS update_user_total_posts();
DROP FUNCTION IF EXISTS create_admin_notification(TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_admin_action(UUID, TEXT, UUID, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS notify_admin_new_signup();

-- Drop view
DROP VIEW IF EXISTS admin_dashboard_stats;

-- Drop tables
DROP TABLE IF EXISTS admin_notifications;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS visitor_analytics;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS total_posts;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Enhanced Admin Panel database migration completed successfully!' as status;
