# 🔧 Database Migration Troubleshooting

If you're getting errors when running the migration, follow this guide.

---

## ❌ Error: "policy already exists"

### What it means:
You've already run part of the migration, and some policies or tables already exist.

### Solution: Use the Cleanup Script (Recommended)

Use `supabase_cleanup_and_migrate.sql` to clean up and start fresh:

1. Open Supabase SQL Editor
2. Copy contents of `supabase_cleanup_and_migrate.sql`
3. Click "Run"

**This will:**
- Drop existing policies
- Drop existing tables (⚠️ deletes data!)
- Create fresh tables
- Set up all policies and triggers

**Note:** Only use this if you haven't added important data yet!

---

## ❌ Error: "operator does not exist: uuid = text"

### What it means:
Your `campaigns` table has a `user_id` column that's UUID type, but the migration is trying to compare it with TEXT.

### Solution 1: Use the Simple Migration (Recommended)

Use `supabase_migration_phases_1_3_simple.sql` instead:

1. Open Supabase SQL Editor
2. Copy contents of `supabase_migration_phases_1_3_simple.sql`
3. Click "Run"

This version:
- Adds `user_id` directly to new tables
- Uses simpler RLS policies
- Doesn't depend on campaigns table structure

---

## Solution 2: Fix Type Casting

If you want to use the original migration, check your campaigns table structure first:

```sql
-- Check the type of user_id in campaigns table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name = 'user_id';
```

**If user_id is UUID:**
Replace `auth.uid()::text` with just `auth.uid()` in the migration

**If user_id is TEXT:**
Keep `auth.uid()::text` as is

---

## Solution 3: Drop and Recreate (If tables already exist)

If you ran the migration partially and got errors:

```sql
-- Drop existing tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS discovered_subreddits CASCADE;
DROP TABLE IF EXISTS subreddit_rules CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- Then run the simple migration
```

---

## ✅ Verify Migration Success

After running the migration, verify tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('discovered_subreddits', 'subreddit_rules', 'scheduled_posts');
```

You should see all 3 tables listed.

---

## 🔍 Check RLS Policies

Verify RLS policies were created:

```sql
-- Check policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('discovered_subreddits', 'subreddit_rules', 'scheduled_posts');
```

---

## 🐛 Common Issues

### Issue: "relation already exists"
**Solution:** Tables already exist. Either:
- Skip the migration (tables are already there)
- Drop tables first (see Solution 3 above)

### Issue: "permission denied"
**Solution:** Make sure you're running as a superuser or have proper permissions

### Issue: "function does not exist"
**Solution:** The trigger function might already exist. This is usually fine, just continue.

---

## 📝 Manual Table Creation

If all else fails, create tables manually:

```sql
-- Minimal version - just the tables, no RLS
CREATE TABLE discovered_subreddits (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    user_id TEXT NOT NULL,
    subreddit_name TEXT NOT NULL,
    match_score INTEGER,
    subscriber_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subreddit_rules (
    id SERIAL PRIMARY KEY,
    subreddit_name TEXT UNIQUE NOT NULL,
    rules JSONB,
    posting_requirements TEXT,
    last_fetched TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scheduled_posts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    user_id TEXT NOT NULL,
    subreddit_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);
```

Then add RLS policies later if needed.

---

## 🆘 Still Having Issues?

1. **Check Supabase logs** - Look for detailed error messages
2. **Verify auth.uid()** - Make sure authentication is working
3. **Test with simple query** - Try: `SELECT auth.uid();`
4. **Check existing schema** - Your database might have custom setup

---

## ✅ Success Checklist

After migration, you should be able to:

- [ ] See 3 new tables in Supabase Table Editor
- [ ] Insert a test row into `subreddit_rules`
- [ ] Query tables without errors
- [ ] RLS policies are active (check in Supabase UI)

---

## 🔄 Rollback (If Needed)

To completely remove the migration:

```sql
-- Remove tables
DROP TABLE IF EXISTS discovered_subreddits CASCADE;
DROP TABLE IF EXISTS subreddit_rules CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- Remove function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## 💡 Pro Tips

1. **Always backup** before running migrations
2. **Test in development** first
3. **Run migrations one at a time** if you get errors
4. **Check Supabase docs** for your specific version

---

## 📞 Need More Help?

If you're still stuck:

1. Copy the exact error message
2. Check which line is failing
3. Verify your Supabase version
4. Check if you have custom auth setup

The simple migration should work in 99% of cases!
