# Reddit API Integration - Troubleshooting Guide

## How It Works

The app uses **real Reddit API** to fetch posts when you provide your Reddit API credentials. Here's the flow:

### 1. **Credential Priority**
```
1. Company Reddit API (if user has active subscription)
   ↓ (if not subscribed)
2. User's own Reddit API credentials (Client ID + Secret)
   ↓ (if no credentials)
3. Gemini Search fallback (uses Google Search)
   ↓ (if Gemini fails)
4. Demo data (for development/testing)
```

### 2. **Reddit API Search Process**

When you have Reddit credentials configured:

1. **Direct API Call**: The app calls `https://www.reddit.com/r/{subreddit}/search.json` or `https://www.reddit.com/search.json`
2. **Real-Time Data**: Gets actual Reddit posts from the last day/week/month
3. **AI Analysis**: Gemini AI analyzes the posts and scores relevance (0-100)
4. **Filtering**: Only posts with relevance ≥ 70 are shown

## Common Issues & Solutions

### Issue 1: "No posts found" or Empty Results

**Possible Causes:**
- ✅ **Reddit API is working, but no posts match your criteria**
- Search keywords are too specific
- Date range is too restrictive (e.g., "last day" in a slow subreddit)
- Subreddits don't have recent activity matching keywords

**Solutions:**
1. **Broaden your keywords**: Use more general terms
2. **Expand date range**: Try "last week" or "last month" instead of "last day"
3. **Check subreddit activity**: Visit the subreddit on Reddit to verify there are recent posts
4. **Try different subreddits**: Some subreddits are more active than others

### Issue 2: CORS Errors in Browser Console

**What it means:**
- This is **expected in development** when running locally
- Reddit's API blocks direct browser requests due to CORS policy
- The app will automatically fall back to Gemini Search

**Solutions:**
- ✅ **This is normal** - the fallback system handles it
- For production, use a backend proxy to avoid CORS
- Or rely on the subscription-based company API

### Issue 3: Rate Limiting (429 Error)

**What it means:**
- You've made too many requests to Reddit API
- Reddit limits requests per minute

**Solutions:**
1. Wait 1-2 minutes before trying again
2. Reduce the number of subreddits you're searching
3. Use the subscription-based company API (higher rate limits)

### Issue 4: Invalid Client ID

**Symptoms:**
- 403 Forbidden errors
- "Access forbidden" messages

**Solutions:**
1. Verify your Client ID is correct:
   - Go to https://www.reddit.com/prefs/apps
   - Copy the string **under** your app name (not the name itself)
   - It should look like: `abcd1234efgh5678`

2. Make sure you created a Reddit app:
   - Type: "script", "web app", or "installed app" (any works)
   - Redirect URI: `http://localhost` (required but not used)

## How to Get Reddit API Credentials

### Step 1: Create a Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Scroll to bottom and click **"create another app"** or **"create app"**
3. Fill in:
   - **Name**: Any name (e.g., "SalesFlow Bot")
   - **App type**: Select "script" (easiest)
   - **Description**: Optional
   - **About URL**: Optional
   - **Redirect URI**: `http://localhost` (required)
4. Click **"create app"**

### Step 2: Get Your Credentials

After creating the app, you'll see:
```
personal use script
[YOUR_CLIENT_ID]  ← This is what you need!

secret
[YOUR_CLIENT_SECRET]  ← Optional, but recommended
```

### Step 3: Add to SalesFlow

1. Go to **Settings** in SalesFlow
2. Scroll to **"API Integrations (Advanced)"**
3. Paste your **Client ID** (required)
4. Paste your **Client Secret** (optional)
5. Click **"Test Client ID"** to verify
6. Click **"Save"**

## Testing Your Setup

### Quick Test

1. Create a campaign with:
   - **Keywords**: `javascript`, `react`
   - **Subreddits**: `reactjs`, `webdev`
   - **Date Range**: Last week
   - **Lead Sources**: Reddit only

2. Click "Find Leads"

3. Check browser console (F12) for logs:
   ```
   🔑 Using user Reddit API credentials
   🔍 Searching 2 subreddit(s): reactjs, webdev
     → Searching r/reactjs: https://www.reddit.com/r/reactjs/search.json?...
     ✅ Found X posts from r/reactjs
   📊 Total unique posts found: X
   ✅ Reddit API found X posts. Analyzing with AI...
   ```

### What Success Looks Like

✅ **Console shows**:
- "Using user Reddit API credentials" or "Using Company Reddit API"
- "Found X posts from r/subreddit"
- "Reddit API found X posts. Analyzing with AI..."

✅ **Results show**:
- Real Reddit posts with actual titles and content
- Posts from the subreddits you specified
- Recent posts (within your date range)

### What Failure Looks Like

❌ **Console shows**:
- "CORS error detected - using demo data"
- "Reddit API search failed"
- "Using Gemini Search (fallback method)"

❌ **Results show**:
- Demo posts with generic content
- Or posts that don't match your subreddits exactly

## Understanding the Fallback System

The app has a **4-tier fallback system** to ensure you always get results:

### Tier 1: Company Reddit API (Best)
- **When**: User has active subscription
- **Pros**: Highest rate limits, no CORS issues, maintained by us
- **How to get**: Subscribe in Settings → Reddit API Subscription

### Tier 2: User Reddit API (Good)
- **When**: User provides their own Client ID
- **Pros**: Real-time data, accurate subreddit filtering
- **Cons**: CORS issues in development, lower rate limits
- **How to get**: Follow steps above to create Reddit app

### Tier 3: Gemini Search (Okay)
- **When**: No Reddit credentials available
- **Pros**: Works without Reddit API, no CORS issues
- **Cons**: May not respect subreddit filters exactly, slower
- **How to get**: Automatic fallback

### Tier 4: Demo Data (Development Only)
- **When**: All other methods fail or API keys missing
- **Pros**: Always works, good for testing UI
- **Cons**: Fake data, not useful for real campaigns
- **How to get**: Automatic fallback

## Debugging Checklist

When posts aren't showing up, check:

- [ ] Reddit credentials are saved in Settings
- [ ] Client ID is correct (check Reddit apps page)
- [ ] Browser console shows "Using user Reddit API credentials"
- [ ] Subreddits exist and are spelled correctly (no r/ prefix needed)
- [ ] Keywords are not too specific
- [ ] Date range is appropriate for subreddit activity
- [ ] Not hitting rate limits (wait 1-2 minutes between searches)
- [ ] Gemini API key is configured (for AI analysis)

## Pro Tips

### For Best Results:

1. **Use 2-4 subreddits** - More isn't always better
2. **Use broader keywords** - "web development" vs "next.js 14 app router"
3. **Start with "last week"** - Then narrow down if too many results
4. **Test one subreddit first** - Verify it works before adding more
5. **Check Reddit directly** - Visit the subreddit to see if posts exist

### For Production:

1. **Use subscription** - Company API has better rate limits
2. **Implement backend proxy** - Avoids CORS issues
3. **Cache results** - Don't search same criteria repeatedly
4. **Monitor rate limits** - Track API usage

## Still Having Issues?

If you've tried everything above and still not getting real Reddit posts:

1. **Check browser console** (F12 → Console tab) for error messages
2. **Verify Gemini API key** is configured (needed for AI analysis)
3. **Test with popular subreddits** like `r/AskReddit` or `r/technology`
4. **Try the subscription** - Company API is more reliable
5. **Check Reddit's status** - https://www.redditstatus.com/

## Code Fix Applied

**Fixed Issue**: Undefined `apiKey` variable causing fallback to demo data

**What was wrong**:
```javascript
if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {  // ❌ apiKey undefined
```

**Fixed to**:
```javascript
if (!currentApiKey || currentApiKey === 'PLACEHOLDER_API_KEY') {  // ✅ Uses correct variable
```

This fix ensures the Gemini Search fallback works properly when Reddit API isn't available.
