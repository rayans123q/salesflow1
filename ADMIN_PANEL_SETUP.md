# Admin Panel Setup Guide

## Overview

The Admin Panel allows administrators to manage users, view their plans, campaigns, and modify subscription levels. Only users with the `admin` role can access this feature.

## Features

- **View All Users**: See a complete list of all registered users
- **User Search**: Filter users by name or email
- **User Details**: View user information including:
  - Email address
  - User ID
  - Join date
  - Number of campaigns
  - Current subscription plan and status
- **Subscription Management**: Change user subscription plans and status
- **Role Management**: Promote users to admin or demote them to regular users

## Subscription Plans

The system supports four subscription tiers:

1. **Free** - Default plan for new users
2. **Starter** - Entry-level paid plan
3. **Pro** - Advanced features and higher limits
4. **Enterprise** - Custom solutions for large organizations

## Subscription Status

- **Active** - User has an active subscription
- **Inactive** - User does not have an active subscription
- **Cancelled** - User cancelled their subscription
- **Expired** - User's subscription has expired

## Database Setup

### Step 1: Run the Admin Migration

Run the following SQL in your Supabase SQL Editor to add the necessary columns:

```sql
-- Migration to add admin panel support
-- Run this SQL in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add subscription_plan column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise'));

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_plan ON user_settings(subscription_plan);

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN user_settings.subscription_plan IS 'Subscription plan: free, starter, pro, or enterprise';
```

Or use the provided migration file: `supabase_migration_admin.sql`

### Step 2: Make Your First Admin

To make a user an admin, run this SQL in Supabase:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email address.

## Accessing the Admin Panel

### Method 1: Via Sidebar
1. **Log in** to your Sales Flow account
2. **Check your role**: Only users with the `admin` role will see the Admin link
3. **Click "Admin"** in the sidebar to access the Admin Panel
4. **Manage users**: 
   - Search for users by name or email
   - Click on a user to view their details
   - Change their subscription plan and status
   - Update their role (user/admin)

### Method 2: Via URL
1. **Log in** to your Sales Flow account as an admin user
2. **Navigate to** `http://localhost:3000/admin` (or your deployed URL + `/admin`)
3. The app will automatically route you to the Admin Panel if you have admin privileges
4. Non-admin users attempting to access `/admin` will be redirected to the dashboard

## How to Use

### Viewing Users

1. The left panel shows all registered users
2. Use the search box to filter by name or email
3. Click on a user to view their full details

### Changing Subscription Plans

1. Select a user from the list
2. In the right panel, locate the "Subscription Management" section
3. Use the "Change Plan" dropdown to select a new plan
4. Use the "Subscription Status" dropdown to set the status
5. Click "Update Subscription" to save changes

### Managing User Roles

1. Select a user from the list
2. In the "User Information" section, click either "User" or "Admin" button
3. The role will be updated immediately

## API Integration

The admin panel uses the following database service methods:

- `getAllUsers()` - Fetch all users
- `getUserWithSubscription(userId)` - Get detailed user info with subscription
- `updateUserSubscription(userId, plan, status)` - Update user's subscription
- `updateUserRole(userId, role)` - Update user's role

## Security Notes

- Admin access is controlled via the `role` column in the `users` table
- The Admin Panel UI only shows for users with `role = 'admin'`
- All database operations check the user's role before allowing access
- Consider implementing additional backend validation for production use

## Troubleshooting

### Admin Panel not showing
- Verify your user has `role = 'admin'` in the database
- Check the browser console for any errors
- Try refreshing the page

### Cannot update subscription
- Ensure the user exists in the database
- Check that the subscription plan is one of: free, starter, pro, enterprise
- Check that the status is one of: active, inactive, cancelled, expired
- Review browser console for error messages

### Users not loading
- Check your Supabase connection
- Verify that the `users` table has the `role` column
- Verify that the `user_settings` table has the `subscription_plan` column
- Check browser console for API errors

## Future Enhancements

Potential features to add:
- Campaign management per user
- Usage analytics and reporting
- Bulk subscription updates
- Admin activity logs
- User deletion/deactivation
- Custom subscription limits per plan
- Billing history and invoices
