# Local Testing Guide - Reddit OAuth & Netlify Functions

## 🎯 How to Test Locally Before Deploying

You can test **everything** locally using Netlify CLI, which runs serverless functions on your machine!

---

## Step 1: Start Netlify Dev Server

Instead of `npm run dev`, use Netlify Dev:

```bash
netlify dev
```

This will:
- ✅ Start your Vite dev server
- ✅ Run Netlify functions locally
- ✅ Proxy requests to `/.netlify/functions/*`
- ✅ Simulate production environment

---

## Step 2: Test Reddit OAuth

### A. Create a Campaign

1. Open http://localhost:8888/ (Netlify Dev default port)
2. Log in to your account
3. Click "Create Campaign"
4. Fill in the form:
   - **Name**: "Test Campaign"
   - **Keywords**: "javascript", "react", "web development"
   - **Subreddits**: "reactjs", "webdev"
   - **Date Range**: "Last Week"
   - **Lead Sources**: Check "Reddit"
5. Click "Find Leads"

### B. Watch the Console

Open browser DevTools (F12) and watch for these messages:

**Success Messages:**
```
🔐 Using Reddit OAuth authentication
🔄 Fetching new Reddit OAuth token...
✅ Reddit OAuth token obtained successfully
🔍 OAuth: Searching 2 subreddit(s): reactjs, webdev
✅ OAuth: Found 15 posts from r/reactjs
✅ OAuth: Found 12 posts from r/webdev
📊 OAuth: Total unique posts found: 27
✅ Reddit API: Found 27 relevant posts after AI analysis
```

**If You See Errors:**
```
❌ Reddit OAuth error: [error details]
```
→ Check the troubleshooting section below

---

## Step 3: Test Multiple API Keys

### A. Add Multiple Keys

Edit `.env.local`:
```env
VITE_GEMINI_API_KEYS=key1,key2,key3,key4,key5
```

### B. Restart Netlify Dev

```bash
# Stop current server (Ctrl+C)
netlify dev
```

### C. Check Console

Look for:
```
🔑 Loaded 5 Gemini API key(s) from VITE_GEMINI_API_KEYS
```

### D. Trigger Key Rotation

Create multiple campaigns quickly to exhaust one key. You'll see:
```
❌ Current API key failed, trying next one...
🔄 Switched to API key: AIzaSyC99H...
```

---

## Step 4: Test Netlify Functions Directly

### Test Reddit OAuth Function

Open a new terminal and run:

```bash
curl -X POST http://localhost:8888/.netlify/functions/reddit-oauth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getToken",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "username": "u/Objective-Wait-9298",
    "password": "rayans123q"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "*"
}
```

---

## Step 5: Verify Everything Works

### Checklist:

- [ ] Netlify Dev server starts without errors
- [ ] Can access app at http://localhost:8888/
- [ ] Can create campaigns
- [ ] Reddit OAuth function returns token
- [ ] Posts are fetched from Reddit
- [ ] Multiple API keys are loaded
- [ ] Console shows success messages

---

## 🐛 Troubleshooting

### Issue: "netlify: command not found"

**Solution:**
```bash
npm install -g netlify-cli
```

---

### Issue: "Port 8888 already in use"

**Solution:**
```bash
netlify dev --port 3000
```

---

### Issue: "Function not found"

**Cause**: Functions folder not detected

**Solution:**
1. Check `netlify.toml` has: `functions = "netlify/functions"`
2. Verify files exist in `netlify/functions/`
3. Restart Netlify Dev

---

### Issue: "Reddit OAuth failed: 401"

**Possible Causes:**
1. Wrong username/password
2. Wrong client ID/secret
3. Reddit account locked

**Solution:**
1. Verify credentials in `.env.local`
2. Test credentials on Reddit.com
3. Check Reddit app settings

---

### Issue: "No posts found"

**Possible Causes:**
1. Keywords too specific
2. Subreddits have no recent posts
3. Date range too narrow

**Solution:**
1. Try broader keywords: "javascript", "react"
2. Use popular subreddits: "reactjs", "webdev", "programming"
3. Use "Last Week" or "Last Month"

---

## 📊 What Success Looks Like

### Console Output:
```
🔑 Loaded 5 Gemini API key(s) from VITE_GEMINI_API_KEYS
🔑 Initialized Gemini AI with API key: AIzaSyCcrd...
🔐 Using Reddit OAuth authentication
🔄 Fetching new Reddit OAuth token...
✅ Reddit OAuth token obtained successfully
🔍 OAuth: Searching 2 subreddit(s): reactjs, webdev
  ✅ OAuth: Found 15 posts from r/reactjs
  ✅ OAuth: Found 12 posts from r/webdev
📊 OAuth: Total unique posts found: 27
✅ Reddit API: Found 27 relevant posts after AI analysis
✅ Campaign "Test Campaign" created successfully!
```

### UI:
- Campaign appears in campaigns list
- Shows "27 Leads Found"
- Can click "View Posts" to see results
- Posts have titles, content, and relevance scores

---

## 🚀 Ready to Deploy?

Once everything works locally:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod
   ```

3. **Add Environment Variables:**
   - Go to Netlify Dashboard
   - Site Settings → Environment Variables
   - Add all variables from `.env.local`

4. **Test Production:**
   - Visit your deployed URL
   - Create a campaign
   - Verify OAuth works in production

---

## 🎉 You're All Set!

With Netlify Dev, you can test everything locally before deploying:
- ✅ Reddit OAuth authentication
- ✅ Netlify serverless functions
- ✅ Multiple API key rotation
- ✅ Full campaign creation flow

No surprises when you deploy! 🚀
