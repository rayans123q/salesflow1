# Remaining Issues to Fix

## ✅ FIXED - Reddit Proxy 500 Error
**Status:** Fixed in commit `4fd0755`
- Removed `node-fetch` dependency (fetch is built-in to Netlify Functions)
- Added better error handling and logging
- Should work now after Netlify rebuild

---

## 🔴 TODO - Draft Posts Accessibility

**Issue:** Users need easy access to view, manage, and edit draft posts.

**Current State:** Unknown - need to check if draft functionality exists

**Required:**
1. Save all AI-generated posts as drafts
2. Draft management UI (view, edit, delete)
3. Easy access from dashboard
4. Ability to publish drafts later

**Files to Check:**
- `components/CampaignPosts.tsx`
- Database schema for posts table
- Post status field ('draft', 'published', etc.)

---

## 🔴 TODO - Visitor Tracker Shows Zero

**Issue:** Visitor tracker shows 0 visits despite multiple visits

**Possible Causes:**
1. Analytics service not tracking properly
2. Database not recording visits
3. Cookie/session issues
4. Time zone problems (showing wrong day)

**Files to Check:**
- `services/analyticsService.ts`
- `components/AdminAnalytics.tsx`
- Database visitor tracking tables
- Event tracking implementation

**Debug Steps:**
1. Check if analytics events are firing
2. Verify database inserts
3. Check date/time calculations
4. Test with different browsers

---

## 🔴 TODO - Subreddit Rules Still Not Loading

**Issue:** Despite fixes, rules still show "No specific rules found"

**Current Status:** 
- ✅ Proxy function created
- ✅ CORS fixed
- ⚠️ Still getting 500 errors (just fixed, needs testing)

**Next Steps:**
1. Wait for Netlify rebuild (commit `4fd0755`)
2. Test with r/smallbusiness
3. Check Netlify function logs
4. Verify Reddit API responses
5. Add fallback to default rules if API fails

**Files:**
- `netlify/functions/reddit-proxy.js` (just fixed)
- `services/subredditRulesService.ts`
- `services/postComposerService.ts`
- `components/SubredditRules.tsx`

---

## Priority Order

1. **HIGH:** Test reddit-proxy fix (wait for deploy)
2. **HIGH:** Fix visitor tracker
3. **MEDIUM:** Implement draft posts management
4. **LOW:** Additional subreddit rules improvements

---

## Testing Checklist

After Netlify rebuild completes:

### Reddit Rules
- [ ] View rules for r/smallbusiness
- [ ] View rules for r/CRM
- [ ] Check Netlify function logs
- [ ] Verify no 500 errors
- [ ] Confirm rules display correctly

### Visitor Tracker
- [ ] Visit site multiple times
- [ ] Check analytics dashboard
- [ ] Verify visit count increases
- [ ] Test across different days

### Draft Posts
- [ ] Generate AI post
- [ ] Verify it saves as draft
- [ ] Find draft in UI
- [ ] Edit draft
- [ ] Publish draft

---

**Last Updated:** November 17, 2025  
**Latest Commit:** `4fd0755`
