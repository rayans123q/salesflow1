# Fix Admin User Management

## Problem
Admins cannot edit or delete users because Row Level Security (RLS) policies only allow users to modify their own data.

## Solution
Run the SQL migration to add admin policies.

## Steps

### 1. Open Supabase Dashboard
Go to your Supabase project: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Copy and Run the SQL
Copy the entire contents of `FIX_ADMIN_USER_MANAGEMENT.sql` and paste it into the SQL editor, then click "Run".

### 4. Verify
After running, you should see a table showing the new policies:
- "Admins can update any user" on users table
- "Admins can delete any user" on users table  
- "Admins can update any user settings" on user_settings table

### 5. Test
- Go back to your admin panel
- Try editing a user's subscription
- Try deleting a test user
- Both should now work!

## What This Does
The SQL adds three new RLS policies that check if the current user has `role = 'admin'` before allowing:
- UPDATE operations on the users table
- DELETE operations on the users table
- UPDATE operations on the user_settings table

This allows admins to manage all users while keeping regular users restricted to their own data.

## Troubleshooting
If it still doesn't work:
1. Check browser console for errors (F12)
2. Verify your user account has `role = 'admin'` in the users table
3. Make sure you're logged in as an admin
4. Try logging out and back in
