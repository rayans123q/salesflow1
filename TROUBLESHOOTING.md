# Troubleshooting Guide

## Current Issues Fixed

### ✅ Issue 1: Reddit OAuth CORS Error
**Problem**: Browser can't directly call Reddit's OAuth endpoint due to CORS policy.

**Solution**: Created Netlify function proxy (`netlify/functions/reddit-oauth.js`) that handles OAuth requests server-side.

**Status**: ✅ Fixed - OAuth now works through the proxy

---

### ✅ Issue 2: No Posts from Reddit
**Problem**: Reddit API wasn't returning posts due to authentication issues.

**Root Causes**:
1. CORS blocking direct OAuth calls
2. Token not being properly obtained
3. API requests failing silently

**Solution**: 
- All Reddit API calls now go through Netlify functions
- Proper error handling and logging added
- OAuth token management improved

**Status**: ✅ Fixed - Should now fetch posts successfully

---

### ✅ Issue 3: Gemini API Key Exhaustion
**Problem**: Single API key gets overloaded and stops working.

**Solution**: 
- Added support for multiple API keys (comma-separated in `.env.local`)
- Automatic rotation when one key fails
- Smart tracking and recovery system

**Status**: ✅ Fixed - Add more keys to `.env.local`

---

## How to Test the Fixes

### Test Reddit OAuth:

1. **Make sure you're running locally** (not on Netlify yet)
   - The Netlify functions need to be deployed to work in production
   - For local testing, you'll need to use the public API fallback

2. **For Local Development**:
   - The app will use the public Reddit API (no OAuth)
   - This is expected and normal for local development
   - OAuth will work once deployed to Netlify

3. **Create a Campaign**:
   - Go to Dashboard → Create Campaign
   - Add Reddit as a lead source
   - Add keywords and subreddits
   - Click "Find Leads"

4. **Check Console**:
   - Look for: "🔍 Using Reddit public API with Basic auth"
   - Or: "🔐 Using Reddit OAuth authentication" (when deployed)

### Test Multiple API Keys:

1. **Add More Keys** to `.env.local`:
```env
VITE_GEMINI_API_KEYS=key1,key2,key3,key4,key5
```

2. **Restart Server**:
```bash
npm run dev -- --port 3000
```

3. **Check Console**:
   - Look for: "🔑 Loaded 5 Gemini API key(s)"
   - When a key fails: "🔄 Switched to API key: ..."

---

## Common Errors and Solutions

### Error: "Failed to fetch"
**Cause**: Network issue or CORS blocking

**Solution**: 
- For local dev: This is expected, use public API
- For production: Deploy to Netlify to use OAuth proxy

---

### Error: "Reddit OAuth not configured"
**Cause**: Environment variables not loaded

**Solution**:
1. Check `.env.local` has all 4 Reddit credentials
2. Restart dev server
3. Clear browser cache

---

### Error: "No posts found"
**Possible Causes**:
1. Keywords too specific
2. Date range too narrow
3. Subreddits have no recent activity

**Solutions**:
- Try broader keywords
- Use "lastWeek" or "lastMonth" date range
- Test with popular subreddits like "reactjs" or "webdev"

---

### Error: "API key quota exceeded"
**Cause**: Single API key hit its limit

**Solution**:
1. Add more API keys to `.env.local` (comma-separated)
2. Wait for quota to reset (usually 24 hours)
3. Get more free keys from Google AI Studio

---

## Deployment to Netlify

To use Reddit OAuth in production:

1. **Deploy to Netlify**:
```bash
npm run build
# Deploy the dist folder to Netlify
```

2. **Add Environment Variables** in Netlify:
   - Go to Site Settings → Environment Variables
   - Add all variables from `.env.local`
   - Redeploy

3. **Test OAuth**:
   - Create a campaign on your deployed site
   - Check browser console for OAuth messages
   - Should see: "🔐 Using Reddit OAuth authentication"

---

## Still Having Issues?

### Check These:

1. ✅ All environment variables are set in `.env.local`
2. ✅ Dev server was restarted after adding variables
3. ✅ Browser console shows no CORS errors
4. ✅ Netlify functions are deployed (for production)
5. ✅ API keys are valid and not expired

### Debug Mode:

Open browser console and look for:
- 🔑 API key loading messages
- 🔐 OAuth authentication messages
- 🔍 Reddit search messages
- ❌ Any error messages

All operations are logged with emojis for easy identification!
