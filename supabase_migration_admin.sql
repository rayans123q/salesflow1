-- Migration to add admin panel support
-- Run this SQL in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add subscription_plan column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise'));

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_plan ON user_settings(subscription_plan);

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN user_settings.subscription_plan IS 'Subscription plan: free, starter, pro, or enterprise';
