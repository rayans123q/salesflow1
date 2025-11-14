# 🚀 Sales Flow - Launch Checklist

## Pre-Launch Tasks

### 1. Database Setup ✅
- [ ] Run `supabase_migration_usage_tracking.sql` in Supabase SQL Editor
- [ ] Run `reset_all_usage.sql` to reset all users to 0
- [ ] Verify columns exist: `usage_campaigns`, `usage_refreshes`, `usage_ai_responses`, `usage_reset_date`

### 2. Environment Variables ✅
Verify these are set in Netlify:
- [ ] `VITE_GEMINI_API_KEYS` - 5 API keys (comma-separated)
- [ ] `VITE_COMPANY_REDDIT_CLIENT_ID` - Reddit API client ID
- [ ] `VITE_COMPANY_REDDIT_CLIENT_SECRET` - Reddit API secret
- [ ] `VITE_REDDIT_USERNAME` - Reddit username
- [ ] `VITE_REDDIT_PASSWORD` - Reddit password
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `WHOP_API_KEY` - Whop API key for subscriptions
- [ ] `TWITTER_BEARER_TOKEN` - Twitter API bearer token (optional)

### 3. Supabase Configuration ✅
- [ ] Site URL set to: `https://salesflow1.netlify.app`
- [ ] Redirect URLs include: `https://salesflow1.netlify.app/**`
- [ ] Google OAuth configured
- [ ] RLS policies enabled on all tables
- [ ] `subscribed_users` table exists with your email whitelisted

### 4. Features Working ✅
Test these on production:
- [ ] Google OAuth login works
- [ ] Reddit API searches work (using company credentials)
- [ ] Twitter API searches work (or gracefully falls back)
- [ ] Campaign creation works
- [ ] Campaign refresh works (increments usage counter)
- [ ] AI response generation works (increments usage counter)
- [ ] Usage limits display correctly in sidebar
- [ ] Subscription check works (Whop integration)
- [ ] Thank you page redirects work

### 5. Usage Limits ✅
Verify these match pricing page:
- [ ] Campaigns: Unlimited (∞)
- [ ] Refreshes: 50/month
- [ ] AI Responses: 250/month
- [ ] Limits reset automatically after 30 days

### 6. UI/UX Polish ✅
- [ ] Landing page looks professional
- [ ] Rotating text animation works
- [ ] Pricing section is clear
- [ ] Login/signup flow is smooth
- [ ] Dashboard is intuitive
- [ ] Mobile responsive

### 7. Error Handling ✅
- [ ] API rate limits trigger key rotation
- [ ] Gemini quota exceeded switches to next key
- [ ] Reddit API errors show helpful messages
- [ ] Twitter API errors fall back gracefully
- [ ] Usage limit errors are clear

### 8. Performance ✅
- [ ] Page loads quickly
- [ ] No console errors
- [ ] API calls are optimized
- [ ] Images are optimized
- [ ] Tailwind CDN warning (acceptable for now)

## Launch Steps

### Step 1: Final Database Setup
```sql
-- In Supabase SQL Editor:

-- 1. Run the usage tracking migration
-- (Copy from supabase_migration_usage_tracking.sql)

-- 2. Reset all users to 0
-- (Copy from reset_all_usage.sql)

-- 3. Verify it worked
SELECT user_id, usage_campaigns, usage_refreshes, usage_ai_responses 
FROM user_settings 
LIMIT 5;
```

### Step 2: Test Production
1. Open https://salesflow1.netlify.app
2. Clear browser cache (Ctrl+Shift+Delete)
3. Test full user flow:
   - Sign up with Google
   - Create a campaign
   - Refresh campaign (check usage counter)
   - Generate AI response (check usage counter)
   - Check sidebar shows correct usage

### Step 3: Monitor
Watch for:
- Netlify deploy logs
- Supabase logs
- Browser console errors
- User feedback

### Step 4: Announce 🎉
Once everything works:
- Share on social media
- Post in relevant communities
- Email your list
- Update Product Hunt (if applicable)

## Post-Launch Monitoring

### Daily Checks (First Week)
- [ ] Check Netlify analytics
- [ ] Monitor Supabase usage
- [ ] Review error logs
- [ ] Check Gemini API quota usage
- [ ] Monitor Reddit API rate limits

### Weekly Tasks
- [ ] Review user feedback
- [ ] Check usage patterns
- [ ] Optimize based on data
- [ ] Plan next features

## Known Issues (Non-Blocking)

1. **Tailwind CDN Warning**: Using CDN in production (acceptable for MVP)
   - Fix: Install Tailwind properly later
   
2. **Twitter API 500 Error**: Twitter function may need debugging
   - Workaround: Falls back to Gemini search
   
3. **Some Subreddits Return 404**: Private/banned subreddits
   - Expected: System handles gracefully

## Emergency Rollback

If something breaks:
```bash
# Revert to previous deploy
git revert HEAD
git push

# Or in Netlify dashboard:
# Deploys → Click previous deploy → "Publish deploy"
```

## Support Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Netlify Dashboard: https://app.netlify.com
- Gemini API Console: https://ai.google.dev
- Reddit API Docs: https://www.reddit.com/dev/api
- Whop Dashboard: https://whop.com/dashboard

## Success Metrics

Track these:
- [ ] User signups
- [ ] Campaigns created
- [ ] Posts found
- [ ] AI responses generated
- [ ] Subscription conversions
- [ ] User retention (30-day)

---

## 🎯 Ready to Launch?

Once all checkboxes are ✅, you're good to go!

**Final command:**
```bash
git push origin main
```

Then watch the magic happen at: https://salesflow1.netlify.app 🚀
