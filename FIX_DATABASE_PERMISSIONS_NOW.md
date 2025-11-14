# URGENT: Fix Database Permissions

## The Problem

New users cannot be created because Supabase Row Level Security (RLS) is blocking the insert:

```
❌ Failed to create user: 403 Forbidden
```

This prevents:
- New user sign-ups from working properly
- Campaign creation (foreign key constraint)
- User settings from being saved

## The Solution

Run the SQL migration to fix permissions.

## Steps to Fix

### 1. Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### 2. Run the Migration
1. Click **New Query**
2. Copy the ENTIRE contents of `FIX_USER_CREATION_PERMISSIONS.sql`
3. Paste into the SQL editor
4. Click **Run** (or press Ctrl+Enter)

### 3. Verify Success
You should see output showing the policies were created:
```
schemaname | tablename | policyname
-----------+-----------+---------------------------
public     | users     | Users can insert their own record
public     | users     | Users can view their own record
public     | users     | Users can update their own record
...
```

### 4. Test
1. Go back to your app
2. Sign up with a new email
3. Should work without errors!
4. Check browser console - should see:
   ```
   ✅ User created successfully in database
   ```

## What This Fixes

✅ Users can create their own database record
✅ Users can view their own data
✅ Users can update their own settings
✅ Visitor analytics can be tracked
✅ Campaign creation will work

## Security

These policies are secure because:
- Users can ONLY create/view/update their OWN records
- Uses `auth.uid()` to verify identity
- No user can access another user's data
- Admin access is separate

## If You Get Errors

### "relation does not exist"
- Make sure you're in the right project
- Check that tables exist: `users`, `user_settings`, `visitor_analytics`

### "permission denied"
- You need to be the project owner
- Or have admin access to run SQL

### Still not working?
1. Check Supabase logs (Dashboard → Logs)
2. Try signing up again
3. Share the error message

## After Running This

1. All new sign-ups will work
2. Existing users are unaffected
3. Database operations will succeed
4. No more 403/406/409 errors

---

**Run this SQL migration NOW to fix user creation!**
