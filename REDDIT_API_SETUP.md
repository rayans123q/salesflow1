# Reddit API Setup Guide

## Overview
This application supports fetching real-time data directly from Reddit's public JSON API. When a Reddit Client ID is provided, the app will use the Reddit API for faster and more accurate results. If no Client ID is provided or the API fails, it automatically falls back to Gemini Search.

**✅ No Password Required!** This uses Reddit's public JSON API which only requires a Client ID. No username or password needed!

## Benefits of Using Reddit API

1. **Real-time Data**: Get the most up-to-date posts from Reddit
2. **Faster Results**: Direct API access is faster than web scraping
3. **Better Accuracy**: Access to full post data and metadata
4. **Simple Setup**: Only requires a Client ID (no password!)
5. **Secure**: No passwords to store or manage
6. **Automatic Fallback**: Falls back to Gemini Search if API fails

## Step 1: Create a Reddit App

1. Go to [Reddit Apps Preferences](https://www.reddit.com/prefs/apps)
2. Scroll down to the **"developed applications"** section
3. Click **"create another app..."** or **"create app"**
4. Fill in the form:
   - **Name**: Your app name (e.g., "Sales Flow Lead Finder")
   - **App type**: Select **any type** (script, web app, or installed app all work)
   - **Description**: Brief description of your app (optional)
   - **About URL**: (Optional) Your website URL
   - **Redirect URI**: Enter `http://localhost:3000` (required but not used for public API)
5. Click **"create app"**

## Step 2: Get Your Client ID

After creating the app, you'll see:
- **Client ID**: The string under your app name (looks like: `abcd1234efgh5678`)
- **Client Secret**: (Optional) The "secret" field - not required for public API access

**Note**: 
- You only need the **Client ID** - the public API doesn't require authentication
- Client Secret is optional and not used
- The Client ID is the string that appears directly under your app name

## Step 3: Add Client ID to the App

1. Open the Sales Flow application
2. Go to **Settings** (click the gear icon in the sidebar)
3. Scroll down to **"API Integrations"** section
4. Enter your Reddit Client ID:
   - **Client ID**: Your Reddit app client ID (required)
   - **Client Secret**: (Optional) Not required for public API
5. Click **"Test Client ID"** to verify it works
6. Click **"Save"** to store your credentials

## Step 5: Verify It's Working

1. Create a new campaign or refresh an existing one
2. Check the browser console (F12) for messages:
   - ✅ **"Attempting search with Reddit API credentials..."** - Reddit API is being used
   - ⚠️ **"Using Google Search via Gemini for Reddit posts..."** - Falling back to Gemini Search

## How It Works

### With Reddit Client ID:
1. App uses Reddit's public JSON API (no authentication required)
2. Searches Reddit directly using `https://www.reddit.com/search.json`
3. Gets real-time post data from Reddit
4. Uses Gemini AI to score posts for relevance
5. Returns filtered, relevant posts

### Without Reddit Client ID (Fallback):
1. App uses Gemini's Google Search capability
2. Gemini searches the web for Reddit posts
3. Gemini analyzes and scores posts
4. Returns filtered, relevant posts

**Note**: The public JSON API doesn't require OAuth2 authentication. It's a read-only API that works with just a Client ID for identification purposes.

## Troubleshooting

### Error: "Reddit Search Error: 429"
- **Cause**: Rate limit exceeded
- **Solution**: 
  - Wait a few minutes before trying again
  - Reddit public API has rate limits (typically 60 requests per minute per IP)
  - The app will automatically fall back to Gemini Search if rate limited

### Error: "Reddit Search Error: 403"
- **Cause**: Access forbidden or subreddit is private
- **Solution**: 
  - Verify your Client ID is correct
  - Check that the subreddit you're searching is public
  - Some subreddits may block API access

### No Posts Found
- **Cause**: Search query too specific or no matching posts
- **Solution**: 
  - Try broader keywords
  - Check that your date range isn't too restrictive
  - Verify the subreddits you're targeting have recent activity
  - Reddit's search may not return results for very recent posts

### App Falls Back to Gemini Search
- **Cause**: Reddit Client ID not set or API request failed
- **Solution**: 
  - Check that Client ID is filled in Settings
  - Verify Client ID is correct using the "Test Client ID" button
  - Check browser console for error messages
  - The app will automatically use Gemini Search as fallback

## Rate Limits

Reddit's public JSON API has the following rate limits:
- **Public API requests**: 60 requests per minute per IP address
- **No authentication required**: Uses public endpoints
- The app will automatically fall back to Gemini Search if rate limited

## Security Best Practices

1. **No Passwords**: Public API doesn't require passwords - more secure!
2. **Secure Storage**: Client ID is stored securely in Supabase database
3. **Follow Reddit's Terms**: Ensure your app complies with Reddit's API Terms of Service
4. **Rate Limiting**: Be respectful of Reddit's rate limits
5. **User-Agent**: The app identifies itself properly in requests

## Reddit API Documentation

- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Reddit OAuth2 Guide](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Reddit API Rules](https://www.reddit.com/wiki/api)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your credentials are correct
3. Test your Reddit app credentials using Reddit's API directly
4. Check Reddit's status page for API outages

## Notes

- Reddit Client ID is stored securely in your Supabase database
- Only Client ID is needed - no password required!
- The app automatically falls back to Gemini Search if Reddit API fails
- Both methods (Reddit API and Gemini Search) work, but Reddit API is preferred for real-time data
- Reddit's public JSON API is free and doesn't require authentication
- The Client ID is used for identification in the User-Agent header

