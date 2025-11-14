# Campaign Creation Fix - CRITICAL

## The Problem

**Error:** `insert or update on table "campaigns" violates foreign key constraint "campaigns_user_id_fkey"`

**What was happening:**
1. User signs up with email/password
2. Supabase Auth creates authentication record
3. User is logged into the app
4. **BUT** - No record was created in the `users` table
5. User tries to create a campaign
6. Campaign creation fails because `user_id` doesn't exist in `users` table

## The Root Cause

The `onAuthStateChange` listener was only setting the React state, but NOT creating the user record in the database. This caused a foreign key constraint violation when trying to create campaigns.

## The Fix

Updated `App.tsx` to automatically create user records in the database when users sign in:

```typescript
// When user signs in
if (event === 'SIGNED_IN' && session?.user) {
    // Check if user exists in database
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', newUser.id)
        .single();
    
    // If user doesn't exist, create them
    if (!existingUser) {
        await supabase.from('users').insert({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: 'user',
            created_at: new Date().toISOString(),
        });
    }
}
```

## What This Fixes

✅ New users can now create campaigns immediately after sign-up
✅ No more foreign key constraint errors
✅ Works for both email/password and Google OAuth sign-ins
✅ Existing users are unaffected (check prevents duplicates)

## Testing Steps

### For New Users:
1. Sign up with a new email
2. Verify you see the dashboard
3. Create a campaign
4. Campaign should be created successfully
5. You should see the "Finding leads..." screen
6. Posts should appear after search completes

### For Existing Users:
1. Sign in with existing account
2. Everything should work as before
3. No duplicate user records created

## What to Check

After deployment:
1. **Sign up a new test user**
2. **Immediately try to create a campaign**
3. **Check browser console** - should see:
   ```
   👤 Ensuring user exists in database: user@email.com
   ➕ Creating new user in database...
   ✅ User created successfully in database
   ```
4. **Campaign should be created** without errors

## Database Impact

- Automatically creates user records on first sign-in
- No manual database operations needed
- Works seamlessly with Supabase Auth
- Handles both new and existing users

## For Existing Users with Issues

If you have existing users who signed up before this fix and can't create campaigns:

### Option 1: Have them sign out and sign in again
1. User signs out
2. User signs in
3. System will create their database record
4. They can now create campaigns

### Option 2: Manually create user records (if needed)
Run this SQL in Supabase SQL Editor:
```sql
-- Get all auth users without database records
INSERT INTO users (id, email, name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    'user',
    au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;
```

## Prevention

This fix ensures that:
- Every authenticated user has a database record
- Foreign key constraints are always satisfied
- Campaign creation works immediately after sign-up
- No manual intervention needed

## Next Steps

1. Deploy this fix to production
2. Test with a new sign-up
3. Verify campaign creation works
4. Monitor for any related errors

The fix is backward compatible and won't affect existing users!
