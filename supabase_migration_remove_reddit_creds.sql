-- Migration to remove Reddit username and password fields
-- Run this SQL if you already ran the previous migration and want to remove username/password fields

-- Remove username and password columns from user_settings table
ALTER TABLE user_settings 
DROP COLUMN IF EXISTS reddit_username,
DROP COLUMN IF EXISTS reddit_password;

-- Note: This migration is safe to run even if the columns don't exist
-- The IF EXISTS clause prevents errors if the columns were already removed

