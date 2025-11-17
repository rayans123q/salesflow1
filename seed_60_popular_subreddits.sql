-- Seed 60 Popular Subreddits with Common Rules
-- Pre-populate database with known rules for the most popular startup/business subreddits
-- This prevents API calls and provides instant results for users

-- Function to generate standard rules for most subreddits
CREATE OR REPLACE FUNCTION generate_standard_rules(subreddit_name TEXT, specific_focus TEXT DEFAULT 'this community')
RETURNS jsonb AS $$
BEGIN
    RETURN jsonb_build_array(
        jsonb_build_object(
            'title', 'Stay On Topic',
            'description', format('All posts must be relevant to %s. Off-topic content will be removed.', specific_focus),
            'kind', 'all',
            'priority', 0
        ),
        jsonb_build_object(
            'title', 'No Spam or Self-Promotion',
            'description', 'Avoid excessive self-promotion, spam, or low-effort promotional posts. Provide value to the community first.',
            'kind', 'all',
            'priority', 1
        ),
        jsonb_build_object(
            'title', 'Provide Value',
            'description', 'Posts should educate, inform, or spark meaningful discussion. Share genuine insights, not advertisements.',
            'kind', 'all',
            'priority', 2
        ),
        jsonb_build_object(
            'title', 'Be Respectful',
            'description', 'Treat all community members with respect. No harassment, personal attacks, or toxic behavior.',
            'kind', 'all',
            'priority', 3
        ),
        jsonb_build_object(
            'title', 'Share Genuine Insights',
            'description', 'Focus on sharing real experiences, learnings, and insights rather than promotional content.',
            'kind', 'all',
            'priority', 4
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Insert all 60 popular subreddits
INSERT INTO subreddit_rules (
    subreddit_name,
    rules,
    posting_requirements,
    karma_requirement,
    account_age_days,
    allows_links,
    allows_images,
    allows_videos,
    last_fetched
) VALUES

-- Startup & Entrepreneurship (10)
('startups', generate_standard_rules('startups', 'startups and entrepreneurship'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 50, 30, true, true, true, NOW()),
('Entrepreneur', generate_standard_rules('Entrepreneur', 'entrepreneurship'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 25, 14, true, true, true, NOW()),
('IndieHackers', generate_standard_rules('IndieHackers', 'indie hacking and bootstrapping'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('founders', generate_standard_rules('founders', 'startup founders'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 30, 14, true, true, true, NOW()),
('bootstrapped', generate_standard_rules('bootstrapped', 'bootstrapped businesses'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 7, true, true, true, NOW()),
('solopreneur', generate_standard_rules('solopreneur', 'solopreneurs'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('Indiebiz', generate_standard_rules('Indiebiz', 'indie businesses'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('StartupsForStartups', generate_standard_rules('StartupsForStartups', 'startups helping startups'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('TechStartups', generate_standard_rules('TechStartups', 'tech startups'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('YoungEntrepreneurs', generate_standard_rules('YoungEntrepreneurs', 'young entrepreneurs'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),

-- SaaS & Software (7)
('SaaS', generate_standard_rules('SaaS', 'SaaS businesses'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 25, 14, true, true, true, NOW()),
('micro_saas', generate_standard_rules('micro_saas', 'micro-SaaS'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('B2BSaaS', generate_standard_rules('B2BSaaS', 'B2B SaaS'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('SideProject', generate_standard_rules('SideProject', 'side projects'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('buildinpublic', generate_standard_rules('buildinpublic', 'building in public'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('NoCode', generate_standard_rules('NoCode', 'no-code development'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('LowCode', generate_standard_rules('LowCode', 'low-code development'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),

-- Product & Design (4)
('ProductManagement', generate_standard_rules('ProductManagement', 'product management'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('UXDesign', generate_standard_rules('UXDesign', 'UX design'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('UI_Design', generate_standard_rules('UI_Design', 'UI design'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('ProductDesign', generate_standard_rules('ProductDesign', 'product design'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),

-- Marketing & Growth (6)
('marketing', generate_standard_rules('marketing', 'marketing'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('digitalmarketing', generate_standard_rules('digitalmarketing', 'digital marketing'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('growthhacking', generate_standard_rules('growthhacking', 'growth hacking'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('socialmedia', generate_standard_rules('socialmedia', 'social media'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('content_marketing', generate_standard_rules('content_marketing', 'content marketing'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('sales', generate_standard_rules('sales', 'sales'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),

-- Real Estate (5)
('CommercialRealEstate', generate_standard_rules('CommercialRealEstate', 'commercial real estate'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('realestateinvesting', generate_standard_rules('realestateinvesting', 'real estate investing'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('RealEstate', generate_standard_rules('RealEstate', 'real estate'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('RealEstateTechnology', generate_standard_rules('RealEstateTechnology', 'real estate technology'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('Realestatefinance', generate_standard_rules('Realestatefinance', 'real estate finance'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),

-- Business & Finance (7)
('smallbusiness', generate_standard_rules('smallbusiness', 'small business'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('business', generate_standard_rules('business', 'business'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('Finance', generate_standard_rules('Finance', 'finance'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 25, 14, true, true, false, NOW()),
('Economics', generate_standard_rules('Economics', 'economics'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 30, 14, true, true, false, NOW()),
('venturecapital', generate_standard_rules('venturecapital', 'venture capital'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 50, 30, true, true, true, NOW()),
('FinanceforStartups', generate_standard_rules('FinanceforStartups', 'startup finance'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('SmallBusinessOwners', generate_standard_rules('SmallBusinessOwners', 'small business owners'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),

-- Development & Tech (8)
('webdev', generate_standard_rules('webdev', 'web development'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('Frontend', generate_standard_rules('Frontend', 'frontend development'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('Backend', generate_standard_rules('Backend', 'backend development'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('programming', generate_standard_rules('programming', 'programming'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('learnprogramming', generate_standard_rules('learnprogramming', 'learning programming'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('technology', generate_standard_rules('technology', 'technology'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 25, 14, true, true, true, NOW()),
('AIstartups', generate_standard_rules('AIstartups', 'AI startups'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW()),
('MachineLearning', generate_standard_rules('MachineLearning', 'machine learning'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 30, 14, true, true, true, NOW()),

-- Work & Freelance (5)
('freelance', generate_standard_rules('freelance', 'freelancing'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('consulting', generate_standard_rules('consulting', 'consulting'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 15, 10, true, true, true, NOW()),
('WorkOnline', generate_standard_rules('WorkOnline', 'working online'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('SideHustle', generate_standard_rules('SideHustle', 'side hustles'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('EntrepreneurRideAlong', generate_standard_rules('EntrepreneurRideAlong', 'entrepreneur journeys'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),

-- Misc (8)
('Startup_Ideas', generate_standard_rules('Startup_Ideas', 'startup ideas'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('LaunchMyStartup', generate_standard_rules('LaunchMyStartup', 'launching startups'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('StartUpsGermany', generate_standard_rules('StartUpsGermany', 'German startups'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('JustStart', generate_standard_rules('JustStart', 'getting started'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 5, 3, true, true, true, NOW()),
('LegalAdviceForStartups', generate_standard_rules('LegalAdviceForStartups', 'startup legal advice'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, false, NOW()),
('CRM', generate_standard_rules('CRM', 'CRM systems'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 10, 7, true, true, true, NOW()),
('artificial', generate_standard_rules('artificial', 'artificial intelligence'), 'Stay on topic, avoid spam/self-promotion, provide value, be respectful, share genuine insights.', 20, 14, true, true, true, NOW())

ON CONFLICT (subreddit_name) 
DO UPDATE SET
    rules = EXCLUDED.rules,
    posting_requirements = EXCLUDED.posting_requirements,
    karma_requirement = EXCLUDED.karma_requirement,
    account_age_days = EXCLUDED.account_age_days,
    allows_links = EXCLUDED.allows_links,
    allows_images = EXCLUDED.allows_images,
    allows_videos = EXCLUDED.allows_videos,
    last_fetched = EXCLUDED.last_fetched;

-- Drop the helper function
DROP FUNCTION IF EXISTS generate_standard_rules(TEXT, TEXT);

-- Verify the data was inserted
SELECT 
    subreddit_name,
    jsonb_array_length(rules) as rule_count,
    karma_requirement,
    account_age_days,
    last_fetched
FROM subreddit_rules
ORDER BY subreddit_name;

-- Show summary statistics
SELECT 
    COUNT(*) as total_subreddits,
    AVG(jsonb_array_length(rules)) as avg_rules_per_subreddit,
    MIN(karma_requirement) as min_karma,
    MAX(karma_requirement) as max_karma,
    AVG(karma_requirement) as avg_karma
FROM subreddit_rules;
