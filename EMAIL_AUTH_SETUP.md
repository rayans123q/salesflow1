# Email Authentication Setup Guide

This guide explains how to set up email/password authentication using Supabase Auth in the Sales Flow application.

## What Was Changed

### 1. Database Migration
- Created `supabase_migration_auth.sql` to integrate Supabase Auth with the existing database
- Added email column to users table
- Created trigger function to automatically create user records when users sign up via Supabase Auth
- Updated RLS (Row Level Security) policies to use `auth.uid()` for proper access control

### 2. Login Modal Component
- Updated `components/LoginModal.tsx` to support:
  - Email/password sign up
  - Email/password sign in
  - Password reset functionality
  - Toggle between sign up and sign in modes
  - Error handling and loading states

### 3. App Component
- Updated `App.tsx` to:
  - Check for existing Supabase Auth sessions on app load
  - Listen for auth state changes (sign in/sign out)
  - Automatically create user records in the database when users sign up
  - Handle logout by signing out from Supabase Auth

### 4. Database Service
- The database service continues to work with user IDs, now sourced from Supabase Auth
- User records are automatically created via database trigger when users sign up

## Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `zimlbwfmiakbwijwmcpq`
3. Go to the SQL Editor
4. Run the `supabase_migration_auth.sql` file:
   - Copy the contents of `supabase_migration_auth.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

### Step 2: Configure Email Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled (it should be enabled by default)
3. Configure email settings:
   - **Enable email confirmations**: You can disable this for development, or enable it for production
   - **Site URL**: Set to `http://localhost:3000` for development
   - **Redirect URLs**: Add `http://localhost:3000` and your production URL

### Step 3: Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link (if using)

### Step 4: Set Up Custom SMTP (Recommended for Production)

1. Go to **Project Settings** > **Auth** > **SMTP Settings**
2. Configure your SMTP server for production use
3. The default Supabase email service has rate limits (2 emails per hour)

### Step 5: Test the Authentication

1. Start your development server: `npm run dev`
2. Open the app in your browser: `http://localhost:3000`
3. Click "Get Started" or "Sign In"
4. Try signing up with a new account:
   - Enter your name (optional)
   - Enter your email
   - Enter a password (at least 6 characters)
   - Click "Sign Up"
5. If email confirmation is enabled, check your email and confirm your account
6. Sign in with your credentials
7. Test password reset:
   - Click "Forgot password?"
   - Enter your email
   - Check your email for the reset link

## Features

### Sign Up
- Users can create accounts with email and password
- Name is optional (will use email username if not provided)
- Password must be at least 6 characters
- Email confirmation can be enabled/disabled in Supabase dashboard

### Sign In
- Users can sign in with email and password
- Sessions are persisted across page refreshes
- Automatic session restoration on app load

### Password Reset
- Users can request a password reset via "Forgot password?" link
- Reset email is sent to the user's email address
- Reset link redirects to the app (you may want to create a reset password page)

### Security
- Row Level Security (RLS) policies ensure users can only access their own data
- Passwords are securely hashed by Supabase
- Sessions are managed by Supabase Auth
- All database operations are protected by RLS policies

## Troubleshooting

### Email Not Sending
- Check your SMTP configuration in Supabase dashboard
- Verify the email address is valid
- Check Supabase logs for errors
- For development, you can disable email confirmation in Supabase settings

### User Not Created in Database
- Check if the trigger function `handle_new_user()` was created
- Verify the trigger `on_auth_user_created` is active
- Check Supabase logs for errors
- The trigger should automatically create user records when users sign up

### RLS Policy Errors
- Verify the RLS policies were created correctly
- Check that `auth.uid()` is working (user must be authenticated)
- Review the migration SQL for any errors

### Session Not Persisting
- Check browser console for errors
- Verify Supabase client is configured correctly
- Check that the anon key is correct in `services/supabaseClient.ts`

## Next Steps

1. **Create a Password Reset Page**: Currently, the reset link redirects to the home page. You may want to create a dedicated password reset page.

2. **Add Email Verification**: Consider adding email verification UI to show when users need to verify their email.

3. **Add Social Authentication**: You can add Google, GitHub, or other OAuth providers in the Supabase dashboard.

4. **Customize Email Templates**: Update the email templates in Supabase to match your brand.

5. **Production Setup**: 
   - Configure custom SMTP
   - Set up proper redirect URLs
   - Enable email confirmations
   - Set up proper CORS settings

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/passwords)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

