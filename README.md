<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sales Flow - AI-Powered Lead Finding Platform

An AI-powered B2B SaaS tool that helps users find potential customers (leads) on Reddit and Discord by creating campaigns, scanning for relevant posts, and generating engaging comments.

View your app in AI Studio: https://ai.studio/apps/drive/1xdh8YymjB1mSKfg0asbw_HY3Wl1oLlEu

## Features

- 🎯 **Targeted Lead Discovery**: Set up campaigns with keywords, negative keywords, and target communities
- 🤖 **AI-Powered Engagement**: Generate high-quality, context-aware comments using Google Gemini AI
- 📊 **Campaign Management**: Track found leads, contacted users, and high-potential posts
- 🔴 **Reddit API Integration**: Fetch real-time data directly from Reddit (optional, falls back to Gemini Search)
- 💳 **Subscription Service**: Monthly recurring revenue model for Reddit API access
- 💾 **Supabase Database**: All data stored securely in Supabase
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light theme

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
   - See [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) for details

3. Set up Supabase database:
   - Run the SQL migration in `supabase_migration.sql` in your Supabase SQL Editor
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details

4. (Optional) Set up Reddit API:
   - **Option A (Recommended)**: Subscribe to company Reddit API service in Settings → Reddit API Subscription
   - **Option B**: Add your own Reddit API credentials in Settings → API Integrations
   - See [REDDIT_API_SETUP.md](./REDDIT_API_SETUP.md) for details
   - See [SUBSCRIPTION_SETUP.md](./SUBSCRIPTION_SETUP.md) for subscription setup

5. (For Company Reddit API) Add company Reddit API credentials:
   - Add `VITE_COMPANY_REDDIT_CLIENT_ID` and `VITE_COMPANY_REDDIT_CLIENT_SECRET` to `.env.local`
   - These are used when users have an active subscription

6. Run the subscription migration:
   - Run `supabase_migration_subscription.sql` in your Supabase SQL Editor
   - See [SUBSCRIPTION_SETUP.md](./SUBSCRIPTION_SETUP.md) for details

7. Run the app:
   ```bash
   npm run dev
   ```

## Documentation

- [Gemini API Setup](./GEMINI_API_SETUP.md) - How to configure Google Gemini API
- [Supabase Setup](./SUPABASE_SETUP.md) - Database setup and migration guide
- [Reddit API Setup](./REDDIT_API_SETUP.md) - How to configure Reddit API for real-time data
- [Subscription Setup](./SUBSCRIPTION_SETUP.md) - How to set up the Reddit API subscription service

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **API Integration**: Reddit API (optional), Gemini Search (fallback)
