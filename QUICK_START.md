# ⚡ Quick Start Guide - Advanced Features

Get up and running with the new features in 5 minutes!

---

## 🎯 What You'll Do

1. Set up the database
2. Add discovery button to campaign creator
3. Test the new features
4. Start using them in your campaigns

---

## Step 1: Database Setup (2 minutes)

### Run the Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase_migration_phases_1_3.sql`
4. Click "Run"
5. Verify success ✅

**What this does:**
- Creates `discovered_subreddits` table
- Creates `subreddit_rules` table
- Creates `scheduled_posts` table

---

## Step 2: Add Discovery to Campaign Creator (2 minutes)

### Edit `components/CampaignCreator.tsx`

Add these imports at the top:

```typescript
import SubredditDiscovery from './SubredditDiscovery';
import { SparkleIcon } from '../constants';
```

Add state variable:

```typescript
const [showSubredditDiscovery, setShowSubredditDiscovery] = useState(false);
```

Add button in the subreddit input section (around line 150):

```typescript
<button
  type="button"
  onClick={() => setShowSubredditDiscovery(true)}
  className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 flex items-center gap-2 transition-colors"
>
  <SparkleIcon className="w-4 h-4" />
  Discover with AI
</button>
```

Add modal before the closing `</div>`:

```typescript
{showSubredditDiscovery && (
  <SubredditDiscovery
    campaignDescription={description}
    keywords={keywords}
    onSubredditsSelected={(subs) => {
      setSubreddits([...subreddits, ...subs]);
      setShowSubredditDiscovery(false);
    }}
    onClose={() => setShowSubredditDiscovery(false)}
  />
)}
```

---

## Step 3: Test It! (1 minute)

### Try Subreddit Discovery

1. Go to "Create Campaign"
2. Enter description: "AI-powered sales automation tool"
3. Add keywords: "sales", "automation", "AI"
4. Click "Discover with AI"
5. Wait for results
6. Select subreddits
7. Click "Add Subreddits"

**Expected result:** Subreddits added to your campaign! 🎉

---

## Step 4: Add Rules Viewer (Optional)

### Edit `components/CampaignPosts.tsx`

Add imports:

```typescript
import SubredditRules from './SubredditRules';
```

Add state:

```typescript
const [selectedSubredditForRules, setSelectedSubredditForRules] = useState<string | null>(null);
```

Add button next to subreddit name in PostCard:

```typescript
<button
  onClick={() => setSelectedSubredditForRules(post.sourceName.replace('r/', ''))}
  className="text-violet-400 hover:underline text-sm ml-2"
>
  📋 Rules
</button>
```

Add modal:

```typescript
{selectedSubredditForRules && (
  <SubredditRules
    subreddit={selectedSubredditForRules}
    onClose={() => setSelectedSubredditForRules(null)}
  />
)}
```

---

## Step 5: Add Post Composer (Optional)

### Create new page or add to campaign view

```typescript
import PostComposer from './PostComposer';

// Add state
const [showPostComposer, setShowPostComposer] = useState(false);

// Add button
<button
  onClick={() => setShowPostComposer(true)}
  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 flex items-center gap-2"
>
  ✍️ Create Post
</button>

// Add modal
{showPostComposer && (
  <PostComposer
    campaign={campaign}
    selectedSubreddits={campaign.subreddits || []}
    onClose={() => setShowPostComposer(false)}
    onPostsCreated={(posts) => {
      console.log('Posts created:', posts);
      setShowPostComposer(false);
    }}
  />
)}
```

---

## 🎉 You're Done!

You now have:
- ✅ AI Subreddit Discovery
- ✅ Rules Viewer
- ✅ Post Composer

---

## 🧪 Testing Checklist

- [ ] Discovery finds relevant subreddits
- [ ] Match scores are reasonable (60-100%)
- [ ] Subreddits are added to campaign
- [ ] Rules viewer shows subreddit rules
- [ ] Post composer generates posts
- [ ] Rule compliance checker works
- [ ] Posts can be saved as drafts

---

## 🐛 Troubleshooting

### Discovery not working?
- Check console for errors
- Verify Gemini API key is set
- Check network tab for API calls

### Rules not loading?
- Verify Reddit API credentials
- Check if subreddit exists
- Try a popular subreddit first (e.g., "AskReddit")

### Post generation failing?
- Check Gemini API quota
- Verify campaign has description
- Try with simpler keywords

---

## 📚 Next Steps

1. **Read the full guide**: `ADVANCED_FEATURES_INTEGRATION_GUIDE.md`
2. **Follow the checklist**: `IMPLEMENTATION_CHECKLIST.md`
3. **Check what's new**: `WHATS_NEW.md`
4. **Test with real campaigns**: Start small!

---

## 💡 Pro Tips

1. **Test with throwaway accounts** before using your main account
2. **Start with 1-2 subreddits** to test the flow
3. **Read subreddit rules** before posting anything
4. **Use AI suggestions** but always review and customize
5. **Monitor for bans** - check r/ShadowBan if suspicious

---

## 🚀 What's Next?

After you're comfortable with these features, check out the roadmap for upcoming features:

- Insights & Analytics
- Smart Scheduling
- Click Tracking
- Auto Comment Replies
- Account Warmup
- Ban-Safety Features
- Multiple Projects

---

## 🤝 Need Help?

1. Check the console for errors
2. Review the integration guide
3. Test with simple examples first
4. Use throwaway accounts for testing

---

**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy  
**Prerequisites:** Basic React knowledge

Happy building! 🎊
