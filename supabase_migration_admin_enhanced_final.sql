-- Enhanced Admin Panel Migration (Final Safe Version)
-- This version handles all edge cases including existing views

-- ============================================
-- 1. DROP EXISTING VIEWS FIRST (TO AVOID CONFLICTS)
-- ============================================

DROP VIEW IF EXISTS admin_dashboard_stats;

-- ============================================
-- 2. CREATE TABLES (IF NOT EXISTS)
-- ============================================

-- Visitor Analytics Table
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_ip TEXT,
  user_agent TEXT,
  page_url TEXT NOT NULL,
  referrer TEXT,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ADD COLUMNS TO USERS TABLE (SAFE)
-- ============================================

DO $$ 
BEGIN
  -- Add is_verified column
  BEGIN
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, do nothing
      NULL;
  END;

  -- Add last_login column
  BEGIN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, do nothing
      NULL;
  END;

  -- Add total_posts column
  BEGIN
    ALTER TABLE users ADD COLUMN total_posts INTEGER DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, do nothing
      NULL;
  END;

  -- Add role column
  BEGIN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, do nothing
      NULL;
  END;
END $$;

-- ============================================
-- 4. CREATE INDEXES (IF NOT EXISTS)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session ON visitor_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_user ON visitor_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created ON visitor_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- ============================================
-- 5. DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- ============================================

-- Drop visitor_analytics policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin can view all visitor analytics" ON visitor_analytics;
  DROP POLICY IF EXISTS "Service can insert visitor analytics" ON visitor_analytics;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Drop admin_logs policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin can view all logs" ON admin_logs;
  DROP POLICY IF EXISTS "Admin can insert logs" ON admin_logs;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Drop admin_notifications policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin can view all notifications" ON admin_notifications;
  DROP POLICY IF EXISTS "Admin can update notifications" ON admin_notifications;
  DROP POLICY IF EXISTS "Service can insert notifications" ON admin_notifications;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Visitor Analytics Policies
CREATE POLICY "Admin can view all visitor analytics"
  ON visitor_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service can insert visitor analytics"
  ON visitor_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin Logs Policies
CREATE POLICY "Admin can view all logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admin Notifications Policies
CREATE POLICY "Admin can view all notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service can insert notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 8. CREATE OR REPLACE FUNCTIONS
-- ============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_details TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_user_id, action, details, metadata)
  VALUES (p_admin_user_id, p_action, p_details, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (type, title, message)
  VALUES (p_type, p_title, p_message)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user post count
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET total_posts = (
      SELECT COUNT(*) 
      FROM posts 
      JOIN campaigns ON posts.campaign_id = campaigns.id 
      WHERE campaigns.user_id = (
        SELECT user_id FROM campaigns WHERE id = NEW.campaign_id
      )
    )
    WHERE id = (SELECT user_id FROM campaigns WHERE id = NEW.campaign_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET total_posts = (
      SELECT COUNT(*) 
      FROM posts 
      JOIN campaigns ON posts.campaign_id = campaigns.id 
      WHERE campaigns.user_id = (
        SELECT user_id FROM campaigns WHERE id = OLD.campaign_id
      )
    )
    WHERE id = (SELECT user_id FROM campaigns WHERE id = OLD.campaign_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. CREATE OR REPLACE TRIGGERS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_post_count ON posts;

-- Create trigger to update post counts
CREATE TRIGGER trigger_update_user_post_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_post_count();

-- ============================================
-- 10. CREATE VIEW (AFTER ALL TABLES ARE READY)
-- ============================================

CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
  (
    SELECT COUNT(*) 
    FROM user_settings 
    WHERE subscription_status = 'active'
  ) as active_subscriptions,
  (SELECT COUNT(DISTINCT session_id) FROM visitor_analytics) as total_visitors,
  (
    SELECT COUNT(DISTINCT session_id) 
    FROM visitor_analytics 
    WHERE created_at >= CURRENT_DATE
  ) as visitors_today,
  (SELECT COUNT(*) FROM posts) as total_posts;

-- ============================================
-- 11. INITIALIZE DATA
-- ============================================

-- Update existing users' post counts
UPDATE users 
SET total_posts = COALESCE((
  SELECT COUNT(*) 
  FROM posts 
  JOIN campaigns ON posts.campaign_id = campaigns.id 
  WHERE campaigns.user_id = users.id
), 0)
WHERE total_posts IS NULL OR total_posts = 0;

-- Create initial admin notification
INSERT INTO admin_notifications (type, title, message)
SELECT 'success', 'Admin Panel Ready', 'Enhanced Admin Panel has been successfully set up!'
WHERE NOT EXISTS (
  SELECT 1 FROM admin_notifications 
  WHERE title = 'Admin Panel Ready'
);

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- ============================================
-- MIGRATION COMPLETE - VERIFICATION
-- ============================================

-- Verify the migration
SELECT 
  'Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM visitor_analytics) as total_visitors,
  (SELECT COUNT(*) FROM admin_logs) as total_logs,
  (SELECT COUNT(*) FROM admin_notifications) as total_notifications,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('visitor_analytics', 'admin_logs', 'admin_notifications')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_verified', 'last_login', 'total_posts', 'role')) as columns_added;