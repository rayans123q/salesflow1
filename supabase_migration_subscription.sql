-- Migration to add Whop Payment Integration subscription support
-- Run this SQL in your Supabase SQL Editor

-- Add subscription fields to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS reddit_api_subscribed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whop_membership_id TEXT,
ADD COLUMN IF NOT EXISTS whop_plan_id TEXT;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_settings_subscription ON user_settings(reddit_api_subscribed, subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_settings_whop_membership ON user_settings(whop_membership_id);

-- Add comments for documentation
COMMENT ON COLUMN user_settings.reddit_api_subscribed IS 'Whether the user is subscribed to the service';
COMMENT ON COLUMN user_settings.subscription_status IS 'Subscription status: active, inactive, cancelled, expired, trialing';
COMMENT ON COLUMN user_settings.subscription_started_at IS 'When the subscription started';
COMMENT ON COLUMN user_settings.subscription_expires_at IS 'When the subscription expires';
COMMENT ON COLUMN user_settings.whop_membership_id IS 'Whop membership ID for tracking';
COMMENT ON COLUMN user_settings.whop_plan_id IS 'Whop plan ID (e.g., plan_VES4tpsLKJdMH)';

-- Optional: Add subscription plan column if you want to track different tiers
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise'));

