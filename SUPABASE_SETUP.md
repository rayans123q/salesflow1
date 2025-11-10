# Supabase Integration Setup Guide

## Overview
This application has been integrated with Supabase for database storage. All data (campaigns, posts, settings, etc.) is now stored in Supabase instead of localStorage.

## Setup Instructions

### 1. Run the SQL Migration
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `zimlbwfmiakbwijwmcpq`
3. Navigate to the SQL Editor
4. Open the file `supabase_migration.sql` from this project
5. Copy and paste the entire SQL script into the SQL Editor
6. Click "Run" to execute the migration

This will create all necessary tables:
- `users` - User accounts
- `campaigns` - Marketing campaigns
- `posts` - Found leads/posts
- `comment_history` - History of generated comments
- `user_settings` - User preferences and settings

### 2. Verify Tables Created
After running the migration, verify that all tables were created:
- Go to Table Editor in Supabase dashboard
- You should see: `users`, `campaigns`, `posts`, `comment_history`, `user_settings`

### 3. API Keys
The application is already configured with your Supabase credentials:
- **Supabase URL**: `https://zimlbwfmiakbwijwmcpq.supabase.co`
- **Anon Key**: Already configured in `services/supabaseClient.ts`

### 4. Row Level Security (RLS)
The migration includes Row Level Security policies. Currently, all policies allow full access since we're using simple name-based authentication. In production, you should:
1. Implement proper user authentication
2. Update RLS policies to restrict access based on `user_id`
3. Use Supabase Auth for secure authentication

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `name` (TEXT) - User's name
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Campaigns Table
- `id` (BIGSERIAL) - Primary key
- `user_id` (UUID) - Foreign key to users
- `name` (TEXT) - Campaign name
- `status` (TEXT) - 'active' or 'paused'
- `leads_found` (INTEGER) - Number of leads found
- `high_potential` (INTEGER) - Number of high potential leads
- `contacted` (INTEGER) - Number of contacted leads
- `description` (TEXT) - Campaign description
- `keywords` (TEXT[]) - Array of keywords
- `negative_keywords` (TEXT[]) - Array of negative keywords
- `subreddits` (TEXT[]) - Array of subreddit names
- `website_url` (TEXT) - Optional website URL
- `date_range` (TEXT) - 'lastDay', 'lastWeek', or 'lastMonth'
- `lead_sources` (TEXT[]) - Array of lead sources ('reddit', 'discord')
- `created_at` (TIMESTAMP)
- `last_refreshed` (TIMESTAMP) - Optional

### Posts Table
- `id` (BIGSERIAL) - Primary key
- `campaign_id` (BIGINT) - Foreign key to campaigns
- `url` (TEXT) - Post URL
- `source` (TEXT) - 'reddit' or 'discord'
- `source_name` (TEXT) - Source name (e.g., 'r/reactjs')
- `title` (TEXT) - Post title
- `content` (TEXT) - Post content
- `relevance` (INTEGER) - Relevance score (0-100)
- `status` (TEXT) - 'new', 'contacted', or 'hidden'
- `created_at` (TIMESTAMP)

### Comment History Table
- `id` (BIGSERIAL) - Primary key
- `post_id` (BIGINT) - Foreign key to posts
- `comment` (TEXT) - Generated comment
- `created_at` (TIMESTAMP)

### User Settings Table
- `id` (BIGSERIAL) - Primary key
- `user_id` (UUID) - Foreign key to users (unique)
- `theme` (TEXT) - 'light' or 'dark'
- `ai_tone` (TEXT) - AI tone setting
- `ai_sales_approach` (TEXT) - Sales approach setting
- `ai_length` (TEXT) - Response length setting
- `ai_custom_offer` (TEXT) - Custom offer text
- `ai_include_website_link` (BOOLEAN) - Include website link
- `reddit_client_id` (TEXT) - Reddit API client ID (for public API access)
- `reddit_client_secret` (TEXT) - Reddit API client secret (optional)
- `usage_campaigns` (INTEGER) - Campaign usage count
- `usage_refreshes` (INTEGER) - Refresh usage count
- `usage_ai_responses` (INTEGER) - AI response usage count
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Note**: Reddit credentials only require Client ID. No username or password needed for the public JSON API.

## Migration from localStorage
If you have existing data in localStorage, you'll need to:
1. Export your data using the "Export All Data" feature in Settings
2. After running the migration, the app will automatically use Supabase
3. Your existing localStorage data will remain but won't be used
4. You can manually import data if needed (this feature can be added)

## Testing
1. Start the development server: `npm run dev`
2. Login with a name
3. Create a campaign
4. Verify data appears in Supabase dashboard
5. Refresh the page - data should persist

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the SQL migration script
- Check that all tables were created in the Table Editor

### Error: "permission denied"
- Check RLS policies in Supabase
- Verify the anon key is correct
- Check that policies allow the operations you're trying to perform

### Data not persisting
- Check browser console for errors
- Verify Supabase connection in Network tab
- Check Supabase logs for errors

## Security Notes
1. **Reddit Credentials**: Currently stored in plain text in the database. Consider encrypting these in production.
2. **RLS Policies**: Currently allow all operations. Update for production use.
3. **API Keys**: The anon key is safe to expose in client-side code, but the service role key should NEVER be exposed.

## Next Steps
1. Run the SQL migration
2. Test the application
3. Consider implementing proper authentication
4. Update RLS policies for production
5. Add data encryption for sensitive fields

