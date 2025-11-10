-- Migration to integrate Supabase Auth with Sales Flow
-- Run this SQL in your Supabase SQL Editor AFTER running the initial migration

-- First, drop existing policies to recreate them with proper auth.uid() checks
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view posts for their campaigns" ON posts;
DROP POLICY IF EXISTS "Users can insert posts for their campaigns" ON posts;
DROP POLICY IF EXISTS "Users can update posts for their campaigns" ON posts;
DROP POLICY IF EXISTS "Users can delete posts for their campaigns" ON posts;
DROP POLICY IF EXISTS "Users can view comment history for their posts" ON comment_history;
DROP POLICY IF EXISTS "Users can insert comment history" ON comment_history;
DROP POLICY IF EXISTS "Users can delete comment history" ON comment_history;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- Add email column to users table (optional, can get from auth.users if needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Remove default UUID generation from users table since we'll use auth.uid() directly
-- This ensures the ID always matches the auth user ID
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Update users table to use auth.uid() as the primary key
-- Note: We'll use a trigger to automatically create user records when auth users sign up

-- Create function to handle new user creation when they sign up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record when auth user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to use auth.uid()
-- Users can only see and modify their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Posts policies (users can only access posts from their own campaigns)
CREATE POLICY "Users can view posts for their campaigns" ON posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = posts.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert posts for their campaigns" ON posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = posts.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update posts for their campaigns" ON posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = posts.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete posts for their campaigns" ON posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = posts.campaign_id
            AND campaigns.user_id = auth.uid()
        )
    );

-- Comment history policies
CREATE POLICY "Users can view comment history for their posts" ON comment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts
            JOIN campaigns ON campaigns.id = posts.campaign_id
            WHERE posts.id = comment_history.post_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert comment history" ON comment_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            JOIN campaigns ON campaigns.id = posts.campaign_id
            WHERE posts.id = comment_history.post_id
            AND campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete comment history" ON comment_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM posts
            JOIN campaigns ON campaigns.id = posts.campaign_id
            WHERE posts.id = comment_history.post_id
            AND campaigns.user_id = auth.uid()
        )
    );

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

