-- Migration for Phases 1-3: Subreddit Discovery, Rules, and Post Composer
-- SIMPLIFIED VERSION - Run this if the main migration fails
-- This version uses simpler RLS policies

-- Phase 1: AI Subreddit Discovery
CREATE TABLE IF NOT EXISTS discovered_subreddits (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    user_id TEXT NOT NULL,
    subreddit_name TEXT NOT NULL,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    subscriber_count INTEGER DEFAULT 0,
    description TEXT,
    rules_fetched BOOLEAN DEFAULT false,
    is_added_to_campaign BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(campaign_id, subreddit_name)
);

-- Phase 2: Community Rules (Public data, no user_id needed)
CREATE TABLE IF NOT EXISTS subreddit_rules (
    id SERIAL PRIMARY KEY,
    subreddit_name TEXT UNIQUE NOT NULL,
    rules JSONB,
    posting_requirements TEXT,
    karma_requirement INTEGER DEFAULT 0,
    account_age_days INTEGER DEFAULT 0,
    allows_links BOOLEAN DEFAULT true,
    allows_images BOOLEAN DEFAULT true,
    allows_videos BOOLEAN DEFAULT true,
    last_fetched TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: Rule-Aware Post Composer
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    user_id TEXT NOT NULL,
    subreddit_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    post_type TEXT DEFAULT 'text',
    link_url TEXT,
    scheduled_time TIMESTAMP,
    status TEXT DEFAULT 'draft',
    reddit_post_id TEXT,
    posted_at TIMESTAMP,
    engagement_score INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovered_subreddits_campaign ON discovered_subreddits(campaign_id);
CREATE INDEX IF NOT EXISTS idx_discovered_subreddits_user ON discovered_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_subreddits_score ON discovered_subreddits(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_subreddit_rules_name ON subreddit_rules(subreddit_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_campaign ON scheduled_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

-- Enable RLS
ALTER TABLE discovered_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subreddit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies for discovered_subreddits
CREATE POLICY "Users can manage their own discovered subreddits"
    ON discovered_subreddits
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- RLS Policies for subreddit_rules (public read)
CREATE POLICY "Anyone can view subreddit rules"
    ON subreddit_rules FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage subreddit rules"
    ON subreddit_rules
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Simple RLS Policies for scheduled_posts
CREATE POLICY "Users can manage their own scheduled posts"
    ON scheduled_posts
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for scheduled_posts
DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON discovered_subreddits TO authenticated;
GRANT ALL ON subreddit_rules TO authenticated;
GRANT ALL ON scheduled_posts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! Tables created: discovered_subreddits, subreddit_rules, scheduled_posts';
END $$;
