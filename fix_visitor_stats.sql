-- Fix Visitor Statistics Display
-- Run this in Supabase SQL Editor

-- Drop and recreate the admin dashboard stats view
DROP VIEW IF EXISTS admin_dashboard_stats;

CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
  (
    SELECT COUNT(*) 
    FROM user_settings 
    WHERE subscription_status = 'active'
  ) as active_subscriptions,
  (
    SELECT COUNT(DISTINCT session_id) 
    FROM visitor_analytics
  ) as total_visitors,
  (
    SELECT COUNT(DISTINCT session_id) 
    FROM visitor_analytics 
    WHERE created_at >= CURRENT_DATE
  ) as visitors_today,
  (SELECT COUNT(*) FROM posts) as total_posts;

-- Test the view
SELECT * FROM admin_dashboard_stats;

-- Check visitor_analytics table directly
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT DATE(created_at)) as days_with_visits,
  MAX(created_at) as last_visit
FROM visitor_analytics;

-- If no data, insert a test record
INSERT INTO visitor_analytics (
  session_id, 
  page_url, 
  user_agent, 
  device_type, 
  browser, 
  os
) 
SELECT 
  'test_session_' || gen_random_uuid()::text,
  'https://your-site.netlify.app/',
  'Mozilla/5.0 (Test Browser)',
  'desktop',
  'Chrome',
  'Windows'
WHERE NOT EXISTS (SELECT 1 FROM visitor_analytics);