-- Seed Popular Subreddit Rules
-- Pre-populate database with known rules for common subreddits
-- This prevents API calls for these popular communities

-- Clear existing data for these subreddits (optional - remove if you want to keep existing)
-- DELETE FROM subreddit_rules WHERE subreddit_name IN (
--     'CommercialRealEstate', 'RealEstateTechnology', 'Realestatefinance',
--     'microsaas', 'B2Bsaas', 'buildinpublic', 'Founders',
--     'startup_sales', 'growthhacking', 'marketing'
-- );

-- Insert known rules for popular subreddits
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

-- r/CommercialRealEstate
(
    'CommercialRealEstate',
    '[
        {
            "title": "Focus on CRE Discussion",
            "description": "All posts must be related to commercial real estate. Residential real estate discussions should go to other subreddits.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Irrelevant Self-Promotion",
            "description": "Self-promotion must be relevant to CRE and provide value to the community. No spam or low-effort promotional posts.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Stay On Topic",
            "description": "Keep discussions focused on commercial real estate topics including office, retail, industrial, multifamily, and land development.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Be Professional",
            "description": "Maintain professional discourse. This is a business-focused community.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Focus on commercial real estate discussion. No irrelevant self-promotion. Stay on topic around commercial real estate.',
    10,
    7,
    true,
    true,
    true,
    NOW()
),

-- r/RealEstateTechnology
(
    'RealEstateTechnology',
    '[
        {
            "title": "Tech in Real Estate Focus",
            "description": "Posts must relate to technology in the real estate industry. PropTech, software, tools, and innovations are welcome.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Pure Sales Posts",
            "description": "Avoid blatant sales pitches. Share tools or innovations with educational value, not just advertisements.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Share Tools or Innovations",
            "description": "When sharing products, focus on the innovation, problem solved, or educational aspect rather than just promoting.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Provide Value",
            "description": "Posts should help others learn about real estate technology, not just sell to them.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Tech in real estate focus. Avoid pure sales posts. Share tools or innovations with educational value.',
    5,
    3,
    true,
    true,
    true,
    NOW()
),

-- r/Realestatefinance
(
    'Realestatefinance',
    '[
        {
            "title": "Financing & Lending Focus",
            "description": "Discussions must relate to real estate financing, loans, lending, mortgages, or investment strategies.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Blatant Ads",
            "description": "Self-promotion of lending services must be subtle and provide genuine value. No spam or aggressive advertising.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Educational Content Welcome",
            "description": "Share knowledge about financing strategies, loan products, or market insights.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Be Helpful",
            "description": "Focus on helping others understand real estate finance, not just promoting your services.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Financing, loans, lending discussions. No blatant ads. Provide educational value.',
    10,
    7,
    true,
    true,
    false,
    NOW()
),

-- r/microsaas
(
    'microsaas',
    '[
        {
            "title": "Micro-SaaS Founders Only",
            "description": "This community is for micro-SaaS founders building small, focused software products. Share your journey, challenges, and wins.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "Self-Promo in Specific Threads",
            "description": "Self-promotion is only allowed in designated threads (usually weekly). Do not create separate promotional posts.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Share Your Journey",
            "description": "Focus on sharing your building experience, metrics, challenges, and learnings rather than just promoting your product.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Be Genuine",
            "description": "Authentic posts about your micro-SaaS journey are valued. Avoid marketing speak.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Micro-SaaS founders community. Self-promotion only in specific threads. Share genuine building journey.',
    20,
    14,
    true,
    true,
    true,
    NOW()
),

-- r/B2Bsaas
(
    'B2Bsaas',
    '[
        {
            "title": "B2B SaaS Focus",
            "description": "Content must be relevant to business-to-business SaaS companies, founders, or operators.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "Be Helpful to Others",
            "description": "Posts must provide value to other founders and operators. Share insights, ask thoughtful questions, or offer help.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "No Low-Effort Promotion",
            "description": "Self-promotion must be wrapped in educational content or genuine discussion. No spam or link dumps.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Quality Over Quantity",
            "description": "Focus on quality contributions that help the B2B SaaS community grow and learn.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Business-to-business SaaS community. Content must be helpful to other founders/operators. No low-effort promotion.',
    15,
    10,
    true,
    true,
    true,
    NOW()
),

-- r/buildinpublic
(
    'buildinpublic',
    '[
        {
            "title": "Share Building Journey",
            "description": "Share your actual building process, progress, challenges, and learnings. This is about transparency and community.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Sneaky Product Drops",
            "description": "Do not use building in public as a disguise for product launches. Focus on the journey, not the destination.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Actual Learning",
            "description": "Share real insights, metrics, failures, and successes. The community values authenticity over polish.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Be Transparent",
            "description": "The whole point is transparency. Share the good, the bad, and the ugly of building your project.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Share your building journey transparently. No sneaky product drops. Focus on actual learning and authenticity.',
    10,
    7,
    true,
    true,
    true,
    NOW()
),

-- r/Founders
(
    'Founders',
    '[
        {
            "title": "Founders Discussion",
            "description": "This is a community for startup founders to discuss challenges, share experiences, and support each other.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "Respect Others",
            "description": "Treat fellow founders with respect. Everyone is on their own journey with unique challenges.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "No Spam",
            "description": "Self-promotion should be minimal and relevant. Focus on discussion and helping others, not selling.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Thoughtful Advice",
            "description": "When giving advice, be thoughtful and considerate. Share from experience, not theory.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Founders discussion community. Respect others, no spam, provide thoughtful advice from experience.',
    25,
    14,
    true,
    true,
    true,
    NOW()
),

-- r/startup_sales
(
    'startup_sales',
    '[
        {
            "title": "Sales Strategies for Startups",
            "description": "Focus on sales strategies, tactics, and challenges specific to startup environments.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Generic Product Pitches",
            "description": "Avoid generic buy my app posts. If mentioning your product, wrap it in a genuine sales strategy discussion.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Share Real Experiences",
            "description": "Share what actually worked (or didnt) in your startup sales journey. Real stories are valued.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Help Others Sell",
            "description": "The goal is to help other startup founders improve their sales, not to sell to them.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Sales strategies for startups. No generic buy my app posts. Share real experiences and help others sell.',
    15,
    10,
    true,
    true,
    true,
    NOW()
),

-- r/growthhacking
(
    'growthhacking',
    '[
        {
            "title": "Growth Experiments",
            "description": "Share growth experiments, tactics, and results. Focus on actionable growth strategies.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "No Plug-and-Dump",
            "description": "Do not just drop your product link and leave. Share the growth strategy, experiment, or tactic you used.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "Data-Driven Content",
            "description": "Back up your growth claims with data, metrics, or concrete results. The community values evidence.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Teach, Dont Sell",
            "description": "Focus on teaching growth tactics, not selling your services. Educational content is welcome.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Growth experiments and tactics. No plug-and-dump. Share data-driven content and teach, dont sell.',
    20,
    14,
    true,
    true,
    true,
    NOW()
),

-- r/marketing
(
    'marketing',
    '[
        {
            "title": "Marketing Advice",
            "description": "Posts must relate to marketing strategies, tactics, campaigns, or industry discussion.",
            "kind": "all",
            "priority": 0
        },
        {
            "title": "Educate or Ask Good Questions",
            "description": "Posts must either educate the community or ask thoughtful, specific questions. No low-effort content.",
            "kind": "all",
            "priority": 1
        },
        {
            "title": "No Pure Sales Posts",
            "description": "Do not just sell your marketing services or tools. Provide value through education or discussion.",
            "kind": "all",
            "priority": 2
        },
        {
            "title": "Quality Content",
            "description": "Focus on quality marketing insights, case studies, or discussions that help others improve their marketing.",
            "kind": "all",
            "priority": 3
        }
    ]'::jsonb,
    'Marketing advice and discussion. Posts must educate or ask good questions, not just sell.',
    10,
    7,
    true,
    true,
    true,
    NOW()
)

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

-- Verify the data was inserted
SELECT 
    subreddit_name,
    jsonb_array_length(rules) as rule_count,
    posting_requirements,
    last_fetched
FROM subreddit_rules
WHERE subreddit_name IN (
    'CommercialRealEstate', 'RealEstateTechnology', 'Realestatefinance',
    'microsaas', 'B2Bsaas', 'buildinpublic', 'Founders',
    'startup_sales', 'growthhacking', 'marketing'
)
ORDER BY subreddit_name;
