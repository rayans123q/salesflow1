# Google OAuth - Quick Start

## ✅ Code Implementation: DONE
The "Sign in with Google" button has been added to your login modal!

## 🔧 What You Need to Do

Follow these steps in order:

### Step 1: Get Your Supabase Callback URL
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** in the list
5. Copy the **Callback URL** - it looks like:
   ```
   https://zimlbwfmiakbwijwmcpq.supabase.co/auth/v1/callback
   ```
6. **SAVE THIS URL** - you'll need it in Step 2

### Step 2: Create Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to **APIs & Services** > **OAuth consent screen**
4. Configure the consent screen:
   - App name: `Sales Flow`
   - User support email: Your email
   - Authorized domains: `netlify.app` and `supabase.co`
   - Developer contact: Your email
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **OAuth client ID**
7. Select **Web application**
8. Add **Authorized JavaScript origins:**
   - `https://your-site.netlify.app`
   - `http://localhost:5173` (for local testing)
9. Add **Authorized redirect URIs:**
   - Paste the Supabase callback URL from Step 1
10. Click **Create**
11. **COPY** the Client ID and Client Secret

### Step 3: Configure Supabase
1. Go back to Supabase Dashboard
2. Go to **Authentication** > **Providers**
3. Find **Google** and toggle it **ON**
4. Paste your **Client ID** from Google
5. Paste your **Client Secret** from Google
6. Click **Save**

### Step 4: Test It!
1. Wait for Netlify deployment to complete
2. Hard refresh your browser (Ctrl+Shift+R)
3. Click "Sign In" on your landing page
4. You should see the "Sign in with Google" button
5. Click it and test!

## 📋 Checklist

- [ ] Got Supabase callback URL
- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth client ID
- [ ] Added Supabase callback URL to Google
- [ ] Copied Client ID and Secret
- [ ] Enabled Google provider in Supabase
- [ ] Pasted credentials in Supabase
- [ ] Deployed to Netlify
- [ ] Hard refreshed browser
- [ ] Tested Google sign-in

## 🎯 Expected Result

When working correctly:
1. User clicks "Sign in with Google"
2. Redirects to Google sign-in page
3. User signs in with Google account
4. Redirects back to your app
5. User is logged in automatically
6. Their name and email are imported from Google

## 📖 Need Detailed Instructions?

See `GOOGLE_OAUTH_SETUP_GUIDE.md` for:
- Step-by-step screenshots
- Troubleshooting guide
- Security best practices
- Production deployment tips

## ⚠️ Common Issues

### "redirect_uri_mismatch"
- Make sure Supabase callback URL is EXACTLY in Google's redirect URIs
- No trailing slashes
- Wait 5 minutes after making changes

### Button doesn't appear
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Verify Supabase provider is enabled

### "Access blocked"
- Add your email to test users in Google OAuth consent screen
- Make sure consent screen status is "Testing" or "Published"

## 🚀 That's It!

Once configured, Google OAuth will work automatically. Users can sign in with one click!
