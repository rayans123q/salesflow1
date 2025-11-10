-- Migration to add Reddit API subscription support
-- Run this SQL in your Supabase SQL Editor

-- Add subscription fields to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS reddit_api_subscribed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_settings_subscription ON user_settings(reddit_api_subscribed, subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN user_settings.reddit_api_subscribed IS 'Whether the user is subscribed to the company Reddit API service';
COMMENT ON COLUMN user_settings.subscription_status IS 'Subscription status: active, inactive, cancelled, expired';
COMMENT ON COLUMN user_settings.subscription_started_at IS 'When the subscription started';
COMMENT ON COLUMN user_settings.subscription_expires_at IS 'When the subscription expires (for monthly recurring)';

