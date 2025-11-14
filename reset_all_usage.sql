-- Reset all users' usage counters to 0
-- Run this in Supabase SQL Editor to give all users a fresh start

-- Reset all usage counters and set reset date to now
UPDATE user_settings
SET 
  usage_campaigns = 0,
  usage_refreshes = 0,
  usage_ai_responses = 0,
  usage_reset_date = NOW();

-- Show how many users were reset
SELECT COUNT(*) as users_reset FROM user_settings;

-- Verify the reset worked
SELECT 
  user_id,
  usage_campaigns,
  usage_refreshes,
  usage_ai_responses,
  usage_reset_date
FROM user_settings
ORDER BY usage_reset_date DESC
LIMIT 10;
