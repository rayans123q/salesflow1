-- Seed 100 Popular Subreddits with Common Rules
-- Comprehensive database seeding for maximum cache coverage
-- Run this in Supabase SQL Editor to pre-populate all popular communities

-- Helper function to generate standard rules
CREATE OR REPLACE FUNCTION generate_standard_rules(
    subreddit_name TEXT, 
    specific_focus TEXT DEFAULT 'this community'
)
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
            'description', 'Avoid spam/self-promotion unless allowed in specific threads. Provide value to the community first.',
            'kind', 'all',
            'priority', 1
        ),
        jsonb_build_object(
            'title', 'Provide Value',
            'description', 'Posts should provide context, details, and lessons. Share genuine insights, not advertisements.',
            'kind', 'all',
            'priority', 2
        ),
        jsonb_build_object(
            'title', 'Be Respectful',
            'description', 'Treat all members with respect. Follow site-wide rules. No harassment or toxic behavior.',
            'kind', 'all',
            'priority', 3
        ),
        jsonb_build_object(
            'title', 'Disclose Affiliations',
            'description', 'When relevant, disclose any affiliations, partnerships, or financial interests.',
            'kind', 'all',
            'priority', 4
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Insert all 100 subreddits
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

-- Core Startup & Entrepreneurship (15)
('startups', generate_standard_rules('startups', 'startups and entrepreneurship'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 50, 30, true, true, true, NOW()),
('Entrepreneur', generate_standard_rules('Entrepreneur', 'entrepreneurship'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, true, NOW()),
('IndieHackers', generate_standard_rules('IndieHackers', 'indie hacking'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('founders', generate_standard_rules('founders', 'startup founders'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 30, 14, true, true, true, NOW()),
('bootstrapped', generate_standard_rules('bootstrapped', 'bootstrapped businesses'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 7, true, true, true, NOW()),
('solopreneur', generate_standard_rules('solopreneur', 'solopreneurs'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('Indiebiz', generate_standard_rules('Indiebiz', 'indie businesses'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartupsForStartups', generate_standard_rules('StartupsForStartups', 'startups helping startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('TechStartups', generate_standard_rules('TechStartups', 'tech startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('YoungEntrepreneurs', generate_standard_rules('YoungEntrepreneurs', 'young entrepreneurs'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('EntrepreneurRideAlong', generate_standard_rules('EntrepreneurRideAlong', 'entrepreneur journeys'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('Startup_Ideas', generate_standard_rules('Startup_Ideas', 'startup ideas'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('LaunchMyStartup', generate_standard_rules('LaunchMyStartup', 'launching startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('StartupsWithoutBS', generate_standard_rules('StartupsWithoutBS', 'honest startup discussion'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('LeanStartup', generate_standard_rules('LeanStartup', 'lean startup methodology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),

-- Regional Startups (7)
('StartupsUK', generate_standard_rules('StartupsUK', 'UK startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartupsIndia', generate_standard_rules('StartupsIndia', 'Indian startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartupsCanada', generate_standard_rules('StartupsCanada', 'Canadian startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartupsAustralia', generate_standard_rules('StartupsAustralia', 'Australian startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartupsAfrica', generate_standard_rules('StartupsAfrica', 'African startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('StartupsEurope', generate_standard_rules('StartupsEurope', 'European startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('StartUpsGermany', generate_standard_rules('StartUpsGermany', 'German startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),

-- SaaS & Software (10)
('SaaS', generate_standard_rules('SaaS', 'SaaS businesses'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, true, NOW()),
('micro_saas', generate_standard_rules('micro_saas', 'micro-SaaS'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('B2BSaaS', generate_standard_rules('B2BSaaS', 'B2B SaaS'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('SideProject', generate_standard_rules('SideProject', 'side projects'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('buildinpublic', generate_standard_rules('buildinpublic', 'building in public'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('NoCode', generate_standard_rules('NoCode', 'no-code development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('LowCode', generate_standard_rules('LowCode', 'low-code development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('SaaSFounders', generate_standard_rules('SaaSFounders', 'SaaS founders'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('SaaSMarketing', generate_standard_rules('SaaSMarketing', 'SaaS marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('NoCodeTech', generate_standard_rules('NoCodeTech', 'no-code technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),

-- Product & Design (5)
('ProductManagement', generate_standard_rules('ProductManagement', 'product management'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('UXDesign', generate_standard_rules('UXDesign', 'UX design'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('UI_Design', generate_standard_rules('UI_Design', 'UI design'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('ProductDesign', generate_standard_rules('ProductDesign', 'product design'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('ProductHunt', generate_standard_rules('ProductHunt', 'product launches'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),

-- Marketing & Growth (12)
('marketing', generate_standard_rules('marketing', 'marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('digitalmarketing', generate_standard_rules('digitalmarketing', 'digital marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('growthhacking', generate_standard_rules('growthhacking', 'growth hacking'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('socialmedia', generate_standard_rules('socialmedia', 'social media'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('content_marketing', generate_standard_rules('content_marketing', 'content marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('SEO', generate_standard_rules('SEO', 'search engine optimization'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('EmailMarketing', generate_standard_rules('EmailMarketing', 'email marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('InfluencerMarketing', generate_standard_rules('InfluencerMarketing', 'influencer marketing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('ContentCreators', generate_standard_rules('ContentCreators', 'content creation'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('CreatorEconomy', generate_standard_rules('CreatorEconomy', 'creator economy'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('GrowthTech', generate_standard_rules('GrowthTech', 'growth technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('CustomerSuccess', generate_standard_rules('CustomerSuccess', 'customer success'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),

-- Real Estate (5)
('CommercialRealEstate', generate_standard_rules('CommercialRealEstate', 'commercial real estate'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('realestateinvesting', generate_standard_rules('realestateinvesting', 'real estate investing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('RealEstate', generate_standard_rules('RealEstate', 'real estate'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('RealEstateTechnology', generate_standard_rules('RealEstateTechnology', 'real estate technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('Realestatefinance', generate_standard_rules('Realestatefinance', 'real estate finance'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),

-- Business & Finance (10)
('smallbusiness', generate_standard_rules('smallbusiness', 'small business'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('business', generate_standard_rules('business', 'business'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('finance', generate_standard_rules('finance', 'finance'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, false, NOW()),
('economics', generate_standard_rules('economics', 'economics'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 30, 14, true, true, false, NOW()),
('venturecapital', generate_standard_rules('venturecapital', 'venture capital'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 50, 30, true, true, true, NOW()),
('FinanceforStartups', generate_standard_rules('FinanceforStartups', 'startup finance'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('SmallBusinessOwners', generate_standard_rules('SmallBusinessOwners', 'small business owners'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('AngelInvesting', generate_standard_rules('AngelInvesting', 'angel investing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 30, 14, true, true, true, NOW()),
('SeedInvesting', generate_standard_rules('SeedInvesting', 'seed investing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, true, NOW()),
('Fintech', generate_standard_rules('Fintech', 'financial technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),

-- Development & Tech (12)
('webdev', generate_standard_rules('webdev', 'web development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('frontend', generate_standard_rules('frontend', 'frontend development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('backend', generate_standard_rules('backend', 'backend development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('programming', generate_standard_rules('programming', 'programming'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('learnprogramming', generate_standard_rules('learnprogramming', 'learning programming'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('technology', generate_standard_rules('technology', 'technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, true, NOW()),
('AIstartups', generate_standard_rules('AIstartups', 'AI startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('MachineLearning', generate_standard_rules('MachineLearning', 'machine learning'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 30, 14, true, true, true, NOW()),
('artificial', generate_standard_rules('artificial', 'artificial intelligence'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('DataScience', generate_standard_rules('DataScience', 'data science'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 25, 14, true, true, true, NOW()),
('BigData', generate_standard_rules('BigData', 'big data'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('Analytics', generate_standard_rules('Analytics', 'analytics'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),

-- Work & Freelance (7)
('freelance', generate_standard_rules('freelance', 'freelancing'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('consulting', generate_standard_rules('consulting', 'consulting'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('WorkOnline', generate_standard_rules('WorkOnline', 'working online'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),
('SideHustle', generate_standard_rules('SideHustle', 'side hustles'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('sales', generate_standard_rules('sales', 'sales'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('CRM', generate_standard_rules('CRM', 'CRM systems'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('JustStart', generate_standard_rules('JustStart', 'getting started'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),

-- Indie & Maker Communities (7)
('IndieDev', generate_standard_rules('IndieDev', 'indie development'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('IndieWeb', generate_standard_rules('IndieWeb', 'indie web'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('indiegames', generate_standard_rules('indiegames', 'indie games'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('IndieBiz', generate_standard_rules('IndieBiz', 'indie business'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('makers', generate_standard_rules('makers', 'makers and creators'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('MakerTech', generate_standard_rules('MakerTech', 'maker technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('LaunchYourApp', generate_standard_rules('LaunchYourApp', 'app launches'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 5, 3, true, true, true, NOW()),

-- Accelerators & Funding (4)
('Accelerators', generate_standard_rules('Accelerators', 'startup accelerators'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('YC', generate_standard_rules('YC', 'Y Combinator'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 30, 14, true, true, true, NOW()),
('FoundersForHire', generate_standard_rules('FoundersForHire', 'founder hiring'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),
('LegalAdviceForStartups', generate_standard_rules('LegalAdviceForStartups', 'startup legal advice'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, false, NOW()),

-- Specialized Tech (6)
('BlockchainStartups', generate_standard_rules('BlockchainStartups', 'blockchain startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('CryptoStartups', generate_standard_rules('CryptoStartups', 'crypto startups'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 20, 14, true, true, true, NOW()),
('PropTech', generate_standard_rules('PropTech', 'property technology'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('AdOps', generate_standard_rules('AdOps', 'ad operations'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('PPC', generate_standard_rules('PPC', 'pay-per-click advertising'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW()),
('Microentrepreneurship', generate_standard_rules('Microentrepreneurship', 'micro-entrepreneurship'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 10, 7, true, true, true, NOW()),

-- Final Entry (Bootstrapping)
('Bootstrapping', generate_standard_rules('Bootstrapping', 'bootstrapping businesses'), 'Stay on topic; avoid spam/self-promotion unless in specific threads; provide value with context and lessons; be respectful; disclose affiliations.', 15, 10, true, true, true, NOW())

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

-- Show summary
SELECT 
    COUNT(*) as total_subreddits_seeded,
    AVG(jsonb_array_length(rules)) as avg_rules_per_subreddit,
    MIN(karma_requirement) as min_karma,
    MAX(karma_requirement) as max_karma,
    AVG(karma_requirement)::int as avg_karma,
    MIN(account_age_days) as min_account_age,
    MAX(account_age_days) as max_account_age
FROM subreddit_rules;

-- Show all seeded subreddits
SELECT 
    subreddit_name,
    jsonb_array_length(rules) as rule_count,
    karma_requirement,
    account_age_days
FROM subreddit_rules
ORDER BY subreddit_name;
