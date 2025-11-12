# 🔴 FIXING THE 404 FUNCTION ERROR

## Problem
The Netlify Function returns **404 Not Found** because drag & drop deployment doesn't deploy functions.

## ✅ Solution: Deploy via GitHub

Netlify Functions require Git-based deployment. Follow these steps:

---

## 📋 Step-by-Step Instructions

### **Step 1: Create GitHub Repository**

1. Go to https://github.com
2. Click the **+** icon → **New repository**
3. Name it: `sales-flow` (or any name you want)
4. **DO NOT** initialize with README
5. Click **Create repository**
6. **Copy the repository URL** (looks like: `https://github.com/yourusername/sales-flow.git`)

### **Step 2: Push Your Code to GitHub**

**Option A: Use the Helper Script (Easiest)**

1. Double-click `PUSH_TO_GITHUB.bat`
2. Paste your GitHub repository URL when prompted
3. Wait for upload to complete

**Option B: Manual Commands**

Open terminal in your project folder and run:

```bash
git remote add origin https://github.com/yourusername/sales-flow.git
git branch -M main
git push -u origin main
```

### **Step 3: Connect Netlify to GitHub**

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub**
4. Authorize Netlify to access your GitHub
5. Select your `sales-flow` repository
6. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (should auto-detect)
7. Click **Deploy site**

### **Step 4: Add Environment Variables**

While the site is deploying:

1. Go to **Site settings** → **Environment variables**
2. Add these 5 variables:

```
GEMINI_API_KEY=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A
VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw
VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ
VITE_SUPABASE_URL=https://zimlbwfmiakbwijwmcpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU
```

3. After adding all variables, go to **Deploys** tab
4. Click **Trigger deploy** → **Clear cache and deploy site**

### **Step 5: Verify Function Deployed**

1. Wait for deploy to finish (green checkmark)
2. Go to **Functions** tab
3. You should see: `reddit-proxy` with status **Active**
4. If you see it, the function is deployed! ✅

### **Step 6: Test Your Site**

1. Visit your Netlify URL
2. Create a campaign
3. Click "Find Leads"
4. Check browser console (F12)

**You should see:**
```
📡 Using Netlify Function proxy for Reddit API...
📥 Proxy response status: 200
✅ Found X posts from r/subreddit
```

---

## 🎯 What This Fixes

### Before (Drag & Drop):
- ❌ Only `dist` folder uploaded
- ❌ No `netlify/functions/` deployed
- ❌ Function returns 404
- ❌ No Reddit posts

### After (Git Deployment):
- ✅ Entire project deployed
- ✅ `netlify/functions/reddit-proxy.js` deployed
- ✅ Function works (200 status)
- ✅ Real Reddit posts fetched!

---

## 🔧 Troubleshooting

### **"Permission denied" when pushing to GitHub**

You need to authenticate:

1. Install GitHub CLI: https://cli.github.com/
2. Run: `gh auth login`
3. Follow prompts
4. Try pushing again

OR use GitHub Desktop:
1. Download: https://desktop.github.com/
2. Clone your repo
3. Copy your project files
4. Commit and push

### **Function still shows 404 after deploy**

1. Check **Functions** tab - is `reddit-proxy` listed?
2. If not, check `netlify.toml` has:
   ```toml
   [build]
     functions = "netlify/functions"
   ```
3. Redeploy: **Trigger deploy** → **Clear cache and deploy site**

### **Build fails on Netlify**

1. Check **Deploy log** for errors
2. Most common: Missing dependencies
3. Fix: Ensure `package.json` has all dependencies
4. Redeploy

---

## 📊 Expected Results

### **Console Logs:**
```
🌐 Hostname: your-site.netlify.app
🔍 isProduction: true
🔍 hasNetlifyFunction: true
📡 Using Netlify Function proxy for Reddit API...
📤 Sending to proxy: {url: "...", hasClientId: true, hasClientSecret: true}
📥 Proxy response status: 200
✅ Found 15 posts from r/marketing
📊 Total unique posts found: 15
```

### **Netlify Function Logs:**
```
Reddit proxy function called
Parsed URL: https://www.reddit.com/r/marketing/search.json?...
Has clientId: true
Has clientSecret: true
Added Basic auth header
Reddit API success! Posts found: 15
```

### **UI:**
- Posts appear in campaign
- Titles and content visible
- Relevance scores shown
- AI comments generated

---

## ✅ Quick Checklist

```
□ Created GitHub repository
□ Pushed code to GitHub
□ Connected Netlify to GitHub repo
□ Set build command: npm run build
□ Set publish directory: dist
□ Added all 5 environment variables
□ Triggered redeploy after adding env vars
□ Verified reddit-proxy appears in Functions tab
□ Tested site - posts appearing
```

---

## 🎉 Success!

Once you complete these steps, your Netlify Function will be deployed and working. The 404 error will be gone, and you'll see real Reddit posts!

**Current Status:**
- ✅ Code committed to Git
- ⏳ Next: Push to GitHub and connect to Netlify

Run `PUSH_TO_GITHUB.bat` to continue!
