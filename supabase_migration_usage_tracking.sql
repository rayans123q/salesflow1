-- Add usage tracking columns to user_settings table
-- This migration adds monthly usage limits that reset automatically

-- Add usage columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS usage_campaigns INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_refreshes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_ai_responses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMPTZ DEFAULT NOW();

-- Add comment to explain the columns
COMMENT ON COLUMN user_settings.usage_campaigns IS 'Number of campaigns created this month';
COMMENT ON COLUMN user_settings.usage_refreshes IS 'Number of campaign refreshes this month';
COMMENT ON COLUMN user_settings.usage_ai_responses IS 'Number of AI responses generated this month';
COMMENT ON COLUMN user_settings.usage_reset_date IS 'Date when usage counters were last reset (monthly)';

-- Create a function to reset usage counters monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset usage for users whose reset date is more than 30 days ago
  UPDATE user_settings
  SET 
    usage_campaigns = 0,
    usage_refreshes = 0,
    usage_ai_responses = 0,
    usage_reset_date = NOW()
  WHERE usage_reset_date < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Monthly usage reset completed';
END;
$$;

-- Create a function to check and reset usage for a specific user
CREATE OR REPLACE FUNCTION check_and_reset_user_usage(p_user_id TEXT)
RETURNS TABLE(
  campaigns INTEGER,
  refreshes INTEGER,
  ai_responses INTEGER,
  was_reset BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_date TIMESTAMPTZ;
  v_campaigns INTEGER;
  v_refreshes INTEGER;
  v_ai_responses INTEGER;
  v_was_reset BOOLEAN := FALSE;
BEGIN
  -- Get current usage and reset date
  SELECT 
    usage_reset_date,
    usage_campaigns,
    usage_refreshes,
    usage_ai_responses
  INTO 
    v_reset_date,
    v_campaigns,
    v_refreshes,
    v_ai_responses
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- If no record exists, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 0, FALSE;
    RETURN;
  END IF;
  
  -- Check if 30 days have passed since last reset
  IF v_reset_date < NOW() - INTERVAL '30 days' THEN
    -- Reset usage counters
    UPDATE user_settings
    SET 
      usage_campaigns = 0,
      usage_refreshes = 0,
      usage_ai_responses = 0,
      usage_reset_date = NOW()
    WHERE user_id = p_user_id;
    
    v_was_reset := TRUE;
    v_campaigns := 0;
    v_refreshes := 0;
    v_ai_responses := 0;
  END IF;
  
  -- Return current usage (after potential reset)
  RETURN QUERY SELECT v_campaigns, v_refreshes, v_ai_responses, v_was_reset;
END;
$$;

-- Create a scheduled job to reset usage monthly (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled
-- Run this manually if pg_cron is not available:
-- SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', 'SELECT reset_monthly_usage()');

-- For manual testing, you can run:
-- SELECT reset_monthly_usage();
-- Or for a specific user:
-- SELECT * FROM check_and_reset_user_usage('user-email@example.com');

-- OPTIONAL: Reset all users to 0 (run this if you want to give everyone a fresh start)
-- UPDATE user_settings SET usage_campaigns = 0, usage_refreshes = 0, usage_ai_responses = 0, usage_reset_date = NOW();
