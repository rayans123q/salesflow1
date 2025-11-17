-- Clean up existing policies and tables, then run fresh migration
-- Run this if you get "already exists" errors

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own discovered subreddits" ON discovered_subreddits;
DROP POLICY IF EXISTS "Users can view their own discovered subreddits" ON discovered_subreddits;
DROP POLICY IF EXISTS "Users can insert their own discovered subreddits" ON discovered_subreddits;
DROP POLICY IF EXISTS "Users can update their own discovered subreddits" ON discovered_subreddits;
DROP POLICY IF EXISTS "Users can delete their own discovered subreddits" ON discovered_subreddits;

DROP POLICY IF EXISTS "Anyone can view subreddit rules" ON subreddit_rules;
DROP POLICY IF EXISTS "Authenticated users can manage subreddit rules" ON subreddit_rules;
DROP POLICY IF EXISTS "System can insert subreddit rules" ON subreddit_rules;
DROP POLICY IF EXISTS "System can update subreddit rules" ON subreddit_rules;

DROP POLICY IF EXISTS "Users can manage their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can insert their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON scheduled_posts;

-- Step 2: Drop existing tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS discovered_subreddits CASCADE;
DROP TABLE IF EXISTS subreddit_rules CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- Step 3: Drop function if exists
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Step 4: Create fresh tables
CREATE TABLE discovered_subreddits (
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

CREATE TABLE subreddit_rules (
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

CREATE TABLE scheduled_posts (
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

-- Step 5: Create indexes
CREATE INDEX idx_discovered_subreddits_campaign ON discovered_subreddits(campaign_id);
CREATE INDEX idx_discovered_subreddits_user ON discovered_subreddits(user_id);
CREATE INDEX idx_discovered_subreddits_score ON discovered_subreddits(match_score DESC);
CREATE INDEX idx_subreddit_rules_name ON subreddit_rules(subreddit_name);
CREATE INDEX idx_scheduled_posts_campaign ON scheduled_posts(campaign_id);
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

-- Step 6: Enable RLS
ALTER TABLE discovered_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subreddit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Users can manage their own discovered subreddits"
    ON discovered_subreddits
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Anyone can view subreddit rules"
    ON subreddit_rules FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage subreddit rules"
    ON subreddit_rules
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own scheduled posts"
    ON scheduled_posts
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Step 8: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Grant permissions
GRANT ALL ON discovered_subreddits TO authenticated;
GRANT ALL ON subreddit_rules TO authenticated;
GRANT ALL ON scheduled_posts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success!
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Created tables: discovered_subreddits, subreddit_rules, scheduled_posts';
    RAISE NOTICE 'All RLS policies and triggers are in place.';
END $$;
