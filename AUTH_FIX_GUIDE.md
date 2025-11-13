# 🔧 Authentication Issues - Complete Fix Guide

## 🚨 Current Problems

1. **Login shows "Invalid credentials"** - Even with correct admin credentials
2. **Sign-up shows "Database error"** - New users can't register

## 🔍 Root Causes

### Issue 1: Email Confirmation Enabled
Supabase might have email confirmation enabled, which prevents immediate login after sign-up.

### Issue 2: User Doesn't Exist
The admin user (dateflow4@gmail.com) might not exist in Supabase Auth.

### Issue 3: Database Permissions
The `users` table might have RLS (Row Level Security) policies that prevent user creation.

## ✅ Complete Fix Steps

### Step 1: Disable Email Confirmation in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Settings**
4. Find **"Enable email confirmations"**
5. **Turn it OFF** (disable it)
6. Click **Save**

### Step 2: Create Admin User Manually

Run this in Supabase SQL Editor:

```sql
-- First, check if user exists in auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'dateflow4@gmail.com';

-- If user doesn't exist, you need to sign up through the app
-- If user exists but email_confirmed_at is NULL, confirm them:
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'dateflow4@gmail.com';

-- Check if user exists in public.users table
SELECT * FROM users WHERE email = 'dateflow4@gmail.com';

-- If not in public.users, create them:
INSERT INTO users (id, name, email, role)
SELECT id, 'Admin User', email, 'admin'
FROM auth.users
WHERE email = 'dateflow4@gmail.com'
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Fix RLS Policies for Users Table

Run this in Supabase SQL Editor:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create permissive policies
CREATE POLICY "Enable insert for authenticated users" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable select for users based on user_id" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Enable update for users based on user_id" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role has full access" 
ON users FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
```

### Step 4: Reset Password (If Needed)

If you forgot the password:

1. Go to Supabase Dashboard → Authentication → Users
2. Find dateflow4@gmail.com
3. Click the three dots → "Send password reset email"
4. Or manually set a new password in SQL:

```sql
-- This requires the service role key, not recommended
-- Better to use the password reset email
```

### Step 5: Test Sign-up with New Email

Try signing up with a completely new email address to test if sign-up works:
- Use a different email (not dateflow4@gmail.com)
- Use a simple password (at least 6 characters)
- Check browser console for errors

## 🧪 Testing Checklist

After applying fixes:

- [ ] Email confirmation is disabled in Supabase
- [ ] Admin user exists in auth.users with email_confirmed_at set
- [ ] Admin user exists in public.users table
- [ ] RLS policies allow user creation
- [ ] Can sign up with new email
- [ ] Can log in with admin credentials
- [ ] No database errors in console

## 🔒 Security Note

**After fixing authentication:**
1. Re-enable email confirmation if you want it
2. Adjust RLS policies to be more restrictive if needed
3. Make sure only authenticated users can create their own records

## 📞 If Still Not Working

If authentication still fails after all these steps:

1. **Check browser console** (F12) for specific error messages
2. **Check Supabase logs**: Dashboard → Logs → Auth logs
3. **Verify environment variables** are loaded in Netlify
4. **Try incognito mode** to rule out cached credentials

## 🚀 Quick Fix Command

Run this complete fix in Supabase SQL Editor:

```sql
-- Complete authentication fix
BEGIN;

-- 1. Confirm any unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Fix RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

CREATE POLICY "Enable insert for authenticated users" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable select for users based on user_id" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Enable update for users based on user_id" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access" 
ON users FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 3. Sync auth.users to public.users
INSERT INTO users (id, name, email, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    email,
    CASE WHEN email = 'dateflow4@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(users.name, EXCLUDED.name);

COMMIT;

-- Verify the fix
SELECT 'Auth Users:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Public Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Confirmed Users:', COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL;
```

This should fix all authentication issues! 🎉
