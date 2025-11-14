# Google OAuth Setup Guide - Complete Instructions

## Overview
This guide will walk you through setting up Google OAuth for your Sales Flow app using Supabase.

---

## Part 1: Create Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Open https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or Select Existing)
1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: `Sales Flow` (or your preferred name)
4. Click "Create"
5. Wait for project creation, then select it

### Step 3: Enable Google+ API
1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it
4. Click "Enable"

### Step 4: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click "Create"

**Fill in the form:**
- **App name:** `Sales Flow`
- **User support email:** Your email
- **App logo:** (Optional - upload your logo)
- **Application home page:** Your Netlify URL (e.g., `https://your-site.netlify.app`)
- **Authorized domains:** 
  - Add: `netlify.app`
  - Add: `supabase.co`
- **Developer contact email:** Your email
4. Click "Save and Continue"

**Scopes:**
5. Click "Add or Remove Scopes"
6. Select these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
7. Click "Update"
8. Click "Save and Continue"

**Test users (for development):**
9. Click "Add Users"
10. Add your email address
11. Click "Save and Continue"
12. Click "Back to Dashboard"

### Step 5: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Application type:** "Web application"
4. **Name:** `Sales Flow Web Client`

**Authorized JavaScript origins:**
5. Click "Add URI"
6. Add your Netlify URL: `https://your-site.netlify.app`
7. For local testing, also add: `http://localhost:5173`

**Authorized redirect URIs:**
8. Click "Add URI"
9. You need to get this from Supabase (see Part 2 below)
10. It will look like: `https://your-project.supabase.co/auth/v1/callback`

**IMPORTANT:** Don't click "Create" yet! First, get the redirect URI from Supabase.

---

## Part 2: Configure Supabase

### Step 1: Get Your Supabase Redirect URI
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** > **Providers**
4. Scroll down to find **Google**
5. You'll see: **Callback URL (for OAuth)**
6. Copy this URL - it looks like:
   ```
   https://zimlbwfmiakbwijwmcpq.supabase.co/auth/v1/callback
   ```

### Step 2: Go Back to Google Cloud Console
1. Return to the OAuth client creation page
2. In **Authorized redirect URIs**, paste the Supabase callback URL
3. Click "Create"

### Step 3: Copy Your Google Credentials
You'll see a popup with:
- **Client ID** - Copy this (looks like: `123456789-abc123.apps.googleusercontent.com`)
- **Client Secret** - Copy this (looks like: `GOCSPX-abc123xyz`)

**SAVE THESE!** You'll need them in the next step.

### Step 4: Configure Google Provider in Supabase
1. Go back to Supabase Dashboard
2. Go to **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle it to **Enabled**
5. Paste your **Client ID** from Google
6. Paste your **Client Secret** from Google
7. Click "Save"

---

## Part 3: Update Your App Configuration

### Step 1: No Environment Variables Needed!
Good news - Supabase handles everything. You don't need to add any Google credentials to your `.env.local` or Netlify environment variables.

### Step 2: Update Authorized Domains (Production)
When you deploy to production:
1. Go back to Google Cloud Console
2. Go to **APIs & Services** > **Credentials**
3. Click on your OAuth client
4. Under **Authorized JavaScript origins**, add your production domain:
   - `https://your-custom-domain.com` (if you have one)
5. Click "Save"

---

## Part 4: Testing

### Local Testing
1. Make sure `http://localhost:5173` is in Google's Authorized JavaScript origins
2. Run your app locally: `npm run dev`
3. Click "Sign in with Google"
4. You should see Google's consent screen
5. Sign in and authorize
6. You should be redirected back to your app

### Production Testing
1. Deploy your app to Netlify
2. Make sure your Netlify URL is in Google's Authorized JavaScript origins
3. Visit your deployed site
4. Click "Sign in with Google"
5. Sign in and authorize
6. You should be redirected back to your app

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Problem:** The redirect URI doesn't match what's configured in Google.

**Solution:**
1. Check that the Supabase callback URL is EXACTLY in Google's Authorized redirect URIs
2. Make sure there are no trailing slashes
3. Wait 5 minutes after making changes (Google caches settings)

### Error: "Access blocked: This app's request is invalid"
**Problem:** OAuth consent screen not properly configured.

**Solution:**
1. Go to Google Cloud Console > OAuth consent screen
2. Make sure status is "Testing" or "Published"
3. Add your email to test users if status is "Testing"

### Error: "The OAuth client was not found"
**Problem:** Client ID is incorrect or project is wrong.

**Solution:**
1. Double-check you copied the correct Client ID
2. Make sure you're in the right Google Cloud project
3. Regenerate credentials if needed

### Google Sign-In Button Not Appearing
**Problem:** Supabase provider not enabled or configured.

**Solution:**
1. Check Supabase Dashboard > Authentication > Providers
2. Make sure Google is toggled ON
3. Verify Client ID and Secret are saved

---

## Security Notes

### For Production:
1. **Publish your OAuth consent screen:**
   - Go to Google Cloud Console > OAuth consent screen
   - Click "Publish App"
   - This removes the "unverified app" warning

2. **Restrict your OAuth client:**
   - Only add necessary redirect URIs
   - Only add your actual domains
   - Remove localhost URIs in production

3. **Monitor usage:**
   - Check Google Cloud Console > APIs & Services > Dashboard
   - Monitor OAuth usage and quotas

---

## Quick Reference

### What You Need:
1. ✅ Google Cloud Project
2. ✅ OAuth consent screen configured
3. ✅ OAuth client ID created
4. ✅ Client ID and Secret
5. ✅ Supabase callback URL added to Google
6. ✅ Google provider enabled in Supabase

### URLs You'll Use:
- **Google Cloud Console:** https://console.cloud.google.com/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Your Supabase Callback URL:** `https://[your-project].supabase.co/auth/v1/callback`

---

## Next Steps

After completing this setup:
1. The code implementation will be added to your app automatically
2. A "Sign in with Google" button will appear in your login modal
3. Users can sign in with one click
4. Their Google profile info (name, email) will be automatically imported

---

## Need Help?

If you get stuck:
1. Check the Troubleshooting section above
2. Verify all URLs match exactly (no typos)
3. Wait 5 minutes after making changes in Google Cloud Console
4. Try in incognito mode to rule out cache issues
5. Check browser console for error messages
