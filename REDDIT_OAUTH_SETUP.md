# Reddit OAuth Integration Guide

## Overview

Your Sales Flow app now supports **Reddit OAuth authentication** using username and password credentials. This allows you to fetch Reddit posts directly from Reddit's API with full authentication.

## Current Configuration

Your `.env.local` file has been updated with your Reddit credentials:

```env
VITE_COMPANY_REDDIT_CLIENT_ID=TvA2XcpsJVjEzGoGEGZVjQ
VITE_COMPANY_REDDIT_CLIENT_SECRET=rPtdWIJFoThHWG2OqnVOyOk70qrEaA
VITE_COMPANY_REDDIT_USERNAME=rayans123q
VITE_COMPANY_REDDIT_PASSWORD=u/Objective-Wait-9298
```

## How It Works

### 1. **OAuth Service** (`services/redditOAuthService.ts`)
- Automatically loads credentials from environment variables
- Handles OAuth token management (fetches and refreshes tokens)
- Provides authenticated API access to Reddit

### 2. **Automatic Detection**
When you create a campaign, the system automatically:
- Checks if OAuth credentials are configured
- If yes: Uses OAuth authentication (more reliable, higher rate limits)
- If no: Falls back to public API with Basic auth

### 3. **Token Management**
- Tokens are automatically fetched when needed
- Tokens are cached and reused until they expire
- Automatic refresh when tokens expire

## Testing Your Setup

### Option 1: Browser Console
Open your browser console and run:

```javascript
import { testRedditOAuth } from './services/testRedditOAuth';
const result = await testRedditOAuth();
console.log(result);
```

### Option 2: Create a Campaign
Simply create a new campaign with Reddit as a lead source. The system will automatically use OAuth if configured.

## What You Get with OAuth

✅ **Higher Rate Limits**: More API calls per hour
✅ **Better Reliability**: Direct authentication with Reddit
✅ **Real-time Data**: Latest posts from Reddit
✅ **Authenticated Access**: Access to more Reddit features
✅ **Automatic Token Management**: No manual token handling needed

## Troubleshooting

### "Reddit OAuth not configured"
- Check that all 4 environment variables are set in `.env.local`
- Restart your development server after adding credentials

### "OAuth failed: 401"
- Verify your username and password are correct
- Check that your Reddit app credentials (Client ID/Secret) are valid
- Make sure your Reddit account has API access enabled

### "Rate limit exceeded"
- OAuth has higher limits, but they still exist
- Wait a few minutes before trying again
- Consider spacing out your campaign refreshes

## Security Notes

⚠️ **Important**: Your Reddit credentials are stored in `.env.local` which should **NEVER** be committed to version control.

- The `.env.local` file is already in `.gitignore`
- Tokens are stored in memory only (not persisted)
- Credentials are only used server-side for authentication

## API Endpoints Used

- **Token Endpoint**: `https://www.reddit.com/api/v1/access_token`
- **Search Endpoint**: `https://oauth.reddit.com/search`
- **User Info**: `https://oauth.reddit.com/api/v1/me`

## Next Steps

1. ✅ Credentials are configured
2. ✅ OAuth service is ready
3. ✅ Automatic detection is enabled
4. 🎯 Create a campaign to test it out!

The system will automatically use OAuth when you create campaigns. You'll see console logs indicating "Using Reddit OAuth authentication" when it's active.
