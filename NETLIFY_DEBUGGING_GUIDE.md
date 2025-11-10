# 🔍 Netlify Debugging Guide - No Posts Issue

## Current Status
You've deployed to Netlify and set environment variables, but no posts are showing up.

## 📋 Step-by-Step Debugging

### **Step 1: Check Browser Console**

1. Open your deployed site
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Create a campaign and click "Find Leads"
5. Look for these log messages:

**What you should see:**
```
🌐 Hostname: your-site.netlify.app
🔍 isProduction: true
🔍 hasNetlifyFunction: true
📡 Using Netlify Function proxy for Reddit API...
📤 Sending to proxy: {url: "...", hasClientId: true, hasClientSecret: true}
📥 Proxy response status: 200
```

**If you see:**
- `hasNetlifyFunction: false` → Function not detected
- `Proxy response status: 404` → Function not deployed
- `Proxy response status: 500` → Function error
- `hasClientId: false` → Environment variables not set

### **Step 2: Check Netlify Function Logs**

1. Go to your Netlify dashboard
2. Click on your site
3. Go to **Functions** tab
4. Click on `reddit-proxy`
5. Check the **Function log**

**What you should see:**
```
Reddit proxy function called
Event body: {"url":"https://www.reddit.com/...","clientId":"...","clientSecret":"..."}
Parsed URL: https://www.reddit.com/r/marketing/search.json?...
Has clientId: true
Has clientSecret: true
Added Basic auth header
Proxying Reddit API request to: https://www.reddit.com/...
Reddit API success! Posts found: 15
```

**Common errors:**
- `No URL provided in request` → Frontend not sending URL
- `Reddit API error: 403` → Invalid credentials
- `Reddit API error: 429` → Rate limit exceeded
- `Function not found` → Function didn't deploy

### **Step 3: Verify Environment Variables**

1. Go to **Site Settings** → **Environment Variables**
2. Verify ALL 5 variables are set:

```
✅ GEMINI_API_KEY
✅ VITE_COMPANY_REDDIT_CLIENT_ID
✅ VITE_COMPANY_REDDIT_CLIENT_SECRET
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
```

3. **IMPORTANT**: After adding/changing env vars, you MUST:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

### **Step 4: Check Function Deployment**

1. Go to **Functions** tab in Netlify
2. You should see: `reddit-proxy`
3. Status should be: **Active**
4. If not listed:
   - Check `netlify.toml` is in root
   - Check `netlify/functions/reddit-proxy.js` exists
   - Redeploy

### **Step 5: Test the Function Directly**

Open browser console on your site and run:

```javascript
fetch('/.netlify/functions/reddit-proxy', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    url: 'https://www.reddit.com/r/test/search.json?q=test&limit=5',
    clientId: 'sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw',
    clientSecret: 'FfBhxWVwB-jNkba4tUuSdQ'
  })
})
.then(r => r.json())
.then(d => console.log('Function response:', d))
.catch(e => console.error('Function error:', e));
```

**Expected result:**
```javascript
{
  data: {
    children: [...] // Array of Reddit posts
  }
}
```

**If you get 404:**
- Function not deployed
- Check Functions tab in Netlify

**If you get 500:**
- Check Function logs for error details

## 🔧 Common Issues & Fixes

### **Issue 1: Function Returns 404**
**Cause**: Function not deployed
**Fix**:
1. Verify `netlify.toml` has:
   ```toml
   [build]
     functions = "netlify/functions"
   ```
2. Verify `netlify/functions/reddit-proxy.js` exists
3. Redeploy site

### **Issue 2: Function Returns 403 from Reddit**
**Cause**: Invalid Reddit credentials
**Fix**:
1. Double-check environment variables:
   - `VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw`
   - `VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ`
2. Clear cache and redeploy

### **Issue 3: Function Returns 429 (Rate Limit)**
**Cause**: Too many requests to Reddit
**Fix**:
- Wait 1-2 minutes
- Try again with fewer subreddits
- Reddit allows 60 requests/minute

### **Issue 4: No Posts Found (0 results)**
**Cause**: Search criteria too restrictive
**Fix**:
- Use broader keywords
- Try longer date range (week instead of day)
- Test with popular subreddits (r/test, r/AskReddit)

### **Issue 5: Environment Variables Not Working**
**Cause**: Variables not applied to build
**Fix**:
1. Set all 5 environment variables
2. **MUST DO**: Trigger deploy → **Clear cache and deploy site**
3. Wait for deploy to complete
4. Test again

### **Issue 6: Gemini Overload (503)**
**Cause**: Gemini AI service overloaded
**Fix**:
- This is temporary
- Wait 1-2 minutes
- Try again
- Function will automatically retry with Flash model

## 📊 Diagnostic Checklist

Run through this checklist:

```
□ Environment variables set (all 5)
□ Cleared cache and redeployed after setting env vars
□ Function shows in Functions tab
□ Function status is "Active"
□ Browser console shows "hasNetlifyFunction: true"
□ Browser console shows "Using Netlify Function proxy"
□ Function logs show "Reddit proxy function called"
□ Function logs show "Reddit API success"
□ No 403/429 errors in logs
```

## 🎯 Quick Test Campaign

Try this simple test:

1. **Campaign Name**: Test
2. **Keywords**: `javascript`, `help`
3. **Subreddits**: `test`
4. **Date Range**: Last week
5. **Lead Sources**: Reddit only

This should return results if everything is working.

## 📞 What to Check Next

If still not working, provide:

1. **Browser console logs** (copy all logs after clicking "Find Leads")
2. **Netlify Function logs** (from Functions tab)
3. **Environment variables screenshot** (blur sensitive parts)
4. **Functions tab screenshot** (showing reddit-proxy status)

## 🔄 Force Refresh Steps

If you made changes:

1. **Upload new `dist` folder** to Netlify
2. Go to **Deploys** → **Trigger deploy**
3. Select **Clear cache and deploy site**
4. Wait for deploy (green checkmark)
5. **Hard refresh** browser (Ctrl+Shift+R or Cmd+Shift+R)
6. Test again

## ✅ Success Indicators

You'll know it's working when you see:

**Browser Console:**
```
📡 Using Netlify Function proxy for Reddit API...
📥 Proxy response status: 200
✅ Found 15 posts from r/marketing
📊 Total unique posts found: 15
```

**Netlify Function Logs:**
```
Reddit API success! Posts found: 15
```

**UI:**
- Posts appear in the campaign
- Post titles and content are visible
- Relevance scores shown

---

## 🚨 Emergency Fix

If nothing works, try this:

1. Delete the site from Netlify
2. Re-upload `dist` folder (create new site)
3. Add all 5 environment variables BEFORE first deploy
4. Deploy
5. Test

This ensures clean deployment with all configs.
