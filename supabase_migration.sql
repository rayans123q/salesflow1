-- Sales Flow Database Schema Migration
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused')),
    leads_found INTEGER DEFAULT 0,
    high_potential INTEGER DEFAULT 0,
    contacted INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    negative_keywords TEXT[],
    subreddits TEXT[],
    website_url TEXT,
    date_range TEXT NOT NULL CHECK (date_range IN ('lastDay', 'lastWeek', 'lastMonth')),
    lead_sources TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_refreshed TIMESTAMP WITH TIME ZONE
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('reddit', 'discord')),
    source_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    relevance INTEGER NOT NULL CHECK (relevance >= 0 AND relevance <= 100),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_history table
CREATE TABLE IF NOT EXISTS comment_history (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
    ai_tone TEXT NOT NULL DEFAULT 'Friendly & Warm',
    ai_sales_approach TEXT NOT NULL DEFAULT 'Moderate' CHECK (ai_sales_approach IN ('Subtle', 'Moderate', 'Direct', 'Aggressive')),
    ai_length TEXT NOT NULL DEFAULT 'Medium' CHECK (ai_length IN ('Short', 'Medium', 'Long')),
    ai_custom_offer TEXT NOT NULL DEFAULT '',
    ai_include_website_link BOOLEAN NOT NULL DEFAULT true,
    reddit_client_id TEXT,
    reddit_client_secret TEXT,
    usage_campaigns INTEGER DEFAULT 0,
    usage_refreshes INTEGER DEFAULT 0,
    usage_ai_responses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);
CREATE INDEX IF NOT EXISTS idx_comment_history_post_id ON comment_history(post_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR true); -- Allow all for now, can be restricted later

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true); -- Allow all for now

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true); -- Allow all for now

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (true); -- Allow all for now, can filter by user_id in app

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (true);

-- Posts policies
CREATE POLICY "Users can view posts for their campaigns" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert posts for their campaigns" ON posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update posts for their campaigns" ON posts
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete posts for their campaigns" ON posts
    FOR DELETE USING (true);

-- Comment history policies
CREATE POLICY "Users can view comment history for their posts" ON comment_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert comment history" ON comment_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete comment history" ON comment_history
    FOR DELETE USING (true);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (true);

-- Note: Since we're using anon key and not Supabase Auth, the RLS policies above allow all operations.
-- In production, you should implement proper user authentication and update these policies accordingly.
-- For now, we'll handle user filtering in the application layer using user_id.

