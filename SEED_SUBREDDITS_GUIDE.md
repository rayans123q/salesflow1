# 🌱 Seed Subreddit Rules - Quick Guide

## ✅ Pre-Populate Database with 60 Popular Subreddits

This guide shows you how to seed your database with rules for 60 popular subreddits, giving **instant results** for all users with **zero API calls**!

---

## 🎯 What This Does

Seeds the database with common rules for 60 popular subreddits including:
- **Startup & Entrepreneurship:** startups, Entrepreneur, IndieHackers, founders, bootstrapped, etc.
- **SaaS & Software:** SaaS, micro_saas, B2BSaaS, SideProject, buildinpublic, etc.
- **Marketing & Growth:** marketing, digitalmarketing, growthhacking, sales, etc.
- **Real Estate:** CommercialRealEstate, realestateinvesting, RealEstate, etc.
- **Business & Finance:** smallbusiness, business, Finance, venturecapital, etc.
- **Development & Tech:** webdev, Frontend, Backend, programming, AIstartups, etc.
- **Work & Freelance:** freelance, consulting, WorkOnline, SideHustle, etc.
- **And more!**

---

## 🚀 How to Run

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Seed Script
1. Open the file: `seed_60_popular_subreddits.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" or press `Ctrl+Enter`

### Step 3: Verify Success
You should see output showing:
```
60 rows inserted/updated
Summary statistics showing:
- total_subreddits: 60
- avg_rules_per_subreddit: 5
- min_karma: 5
- max_karma: 50
```

---

## 📊 What Gets Seeded

### Standard Rules for Each Subreddit:
1. **Stay On Topic** - Relevant to the community
2. **No Spam or Self-Promotion** - Provide value first
3. **Provide Value** - Educate, inform, spark discussion
4. **Be Respectful** - No harassment or toxic behavior
5. **Share Genuine Insights** - Real experiences, not ads

### Customized Settings:
- **Karma Requirements:** 5-50 (based on subreddit strictness)
- **Account Age:** 3-30 days (based on subreddit rules)
- **Content Types:** Links, images, videos (based on subreddit)
- **Last Fetched:** Current timestamp (fresh cache)

---

## 💰 Cost Savings

### Before Seeding:
- User views r/startups rules → API call ($0.001)
- 1,000 users × 60 subreddits = 60,000 API calls
- **Cost: $60**

### After Seeding:
- User views r/startups rules → Database query (free!)
- 1,000 users × 60 subreddits = 0 API calls
- **Cost: $0**
- **Savings: $60 (100%)**

---

## 🔄 When to Re-Run

### Automatic Refresh:
- Cache expires after 7 days
- System will auto-refresh from Reddit when needed
- No action required!

### Manual Refresh (Optional):
Run the script again if:
- Subreddit rules change significantly
- You want to update all rules at once
- You're adding new subreddits

---

## 📝 Customization

### Add More Subreddits:
Copy this template and add to the script:

```sql
('your_subreddit', 
 generate_standard_rules('your_subreddit', 'your topic'), 
 'Custom posting requirements here.', 
 10,    -- karma_requirement
 7,     -- account_age_days
 true,  -- allows_links
 true,  -- allows_images
 true,  -- allows_videos
 NOW()
),
```

### Customize Specific Rules:
For subreddits with unique rules, replace `generate_standard_rules()` with custom JSON:

```sql
('[
    {
        "title": "Custom Rule 1",
        "description": "Description here",
        "kind": "all",
        "priority": 0
    },
    {
        "title": "Custom Rule 2",
        "description": "Description here",
        "kind": "all",
        "priority": 1
    }
]'::jsonb)
```

---

## 🧪 Testing

### Verify Seeding Worked:
```sql
-- Check total count
SELECT COUNT(*) FROM subreddit_rules;
-- Should return: 60 (or more if you had existing data)

-- Check specific subreddit
SELECT * FROM subreddit_rules WHERE subreddit_name = 'startups';

-- Check cache freshness
SELECT 
    subreddit_name,
    last_fetched,
    NOW() - last_fetched as age
FROM subreddit_rules
ORDER BY last_fetched DESC
LIMIT 10;
```

### Test in App:
1. Open your app
2. View rules for any of the 60 subreddits
3. Check console - should see: "✅ Using fresh cached rules (no API call needed!)"
4. Response should be instant (< 100ms)

---

## 📈 Expected Results

After seeding, you should see:
- ✅ **Instant results** for 60 popular subreddits
- ✅ **Zero API calls** for these subreddits
- ✅ **100% cost savings** on cached subreddits
- ✅ **Better user experience** (faster load times)
- ✅ **Scalability** (can handle unlimited users)

### Console Logs:
```
📋 Fetching rules for r/startups...
🔍 Checking database for cached rules...
📦 Found cached rules (0 days old)
✅ Using fresh cached rules for r/startups (no API call needed!)
```

---

## 🎯 Best Practices

### For Production:
1. ✅ Run this script **before** launching to users
2. ✅ Seed during off-peak hours (if updating existing data)
3. ✅ Monitor cache hit rate after deployment
4. ✅ Add more subreddits as you discover popular ones

### For Development:
1. ✅ Run on local database first to test
2. ✅ Verify all 60 subreddits inserted correctly
3. ✅ Test a few subreddits in the app
4. ✅ Then run on production database

---

## 🔧 Troubleshooting

### "Duplicate key error":
- This is normal if subreddits already exist
- The script uses `ON CONFLICT DO UPDATE` to handle this
- Existing data will be updated with new rules

### "Function already exists":
- The script creates a temporary function
- It's automatically dropped at the end
- If error persists, run: `DROP FUNCTION IF EXISTS generate_standard_rules(TEXT, TEXT);`

### "Permission denied":
- Make sure you're logged into Supabase as admin
- Check that you have write access to `subreddit_rules` table

---

## 📊 Monitoring

### Check Cache Performance:
```sql
-- Cache hit rate (should be high for seeded subreddits)
SELECT 
    COUNT(*) FILTER (WHERE last_fetched > NOW() - INTERVAL '7 days') as fresh_cache,
    COUNT(*) FILTER (WHERE last_fetched <= NOW() - INTERVAL '7 days') as expired_cache,
    COUNT(*) as total
FROM subreddit_rules;

-- Most popular subreddits (add view tracking if needed)
SELECT subreddit_name, last_fetched 
FROM subreddit_rules 
ORDER BY last_fetched DESC 
LIMIT 10;
```

---

## 🎉 Summary

**What You Get:**
- ✅ 60 popular subreddits pre-seeded
- ✅ Instant results for all users
- ✅ Zero API calls for cached subreddits
- ✅ 100% cost savings on popular subreddits
- ✅ Better user experience
- ✅ Scalable to unlimited users

**Next Steps:**
1. Run `seed_60_popular_subreddits.sql` in Supabase
2. Verify 60 subreddits were inserted
3. Test in your app
4. Monitor cache hit rate
5. Add more subreddits as needed

**The first user pays nothing, everyone benefits!** 🚀
