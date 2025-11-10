# Netlify Deployment Guide

## ✅ Build Status: READY FOR DEPLOYMENT

Your production build has been created successfully in the `dist` folder.

## 📁 Files to Deploy

### Option 1: Deploy via Drag & Drop (Easiest)

**Folder to upload**: `dist`

Location: `c:\Users\user\Desktop\test2\tr\vioe\sales-flow (2)\dist`

This folder contains:
- `index.html` - Your app's entry point
- `assets/index-H-YT4If1.js` - Bundled JavaScript (717 KB)

### Option 2: Deploy via Git (Recommended for Updates)

Push your entire project to GitHub/GitLab/Bitbucket and connect to Netlify.

## 🚀 Step-by-Step Deployment Instructions

### Method 1: Manual Deploy (Quick Start)

1. **Go to Netlify**
   - Visit https://app.netlify.com
   - Sign up/Login

2. **Drag and Drop Deploy**
   - On the dashboard, look for "Sites" section
   - Find the drag & drop area that says "Want to deploy a new site without connecting to Git?"
   - **Drag the `dist` folder** (NOT the entire project) to this area
   - Wait for upload to complete

3. **Your site is live!**
   - Netlify will give you a URL like: `https://amazing-einstein-123456.netlify.app`

### Method 2: Git-based Deploy (Production Ready)

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click "Deploy site"

## 🔐 Environment Variables (CRITICAL)

### Required Variables to Set in Netlify:

1. **Go to Site Settings** → **Environment Variables**
2. **Add these variables**:

```env
# Gemini API (Required for AI features)
GEMINI_API_KEY=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A

# Reddit API (Your company credentials)
VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw
VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ

# Supabase (Required for database)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### ⚠️ IMPORTANT: Supabase Setup

You MUST add your Supabase credentials or the app won't work!

1. Go to https://supabase.com
2. Open your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/Public Key** → `VITE_SUPABASE_ANON_KEY`

## 📋 Pre-Deployment Checklist

- [x] Production build created (`dist` folder)
- [x] Netlify configuration file (`netlify.toml`)
- [x] Environment variables documented
- [ ] Supabase credentials obtained
- [ ] Domain name (optional)

## 🌐 Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to **Site Settings** → **Domain Management**
2. Click **Add custom domain**
3. Follow Netlify's instructions for DNS configuration

## 🔧 Post-Deployment Configuration

### 1. Test Core Features
- [ ] User authentication works
- [ ] Campaign creation works
- [ ] Reddit API searches work (will use Gemini fallback due to CORS)
- [ ] Admin panel accessible at `/admin` (for admin users)

### 2. Known Production Behaviors
- **Reddit API**: Will fall back to Gemini Search due to CORS
- **For full Reddit API**: Implement a backend/serverless function
- **Admin Panel**: Accessible at `your-site.netlify.app/admin`

### 3. Monitoring
- Check Netlify's **Functions** logs for errors
- Monitor **Analytics** for usage
- Set up **Form notifications** if using Netlify Forms

## 🚨 Troubleshooting

### Site shows blank page
- Check browser console for errors
- Verify all environment variables are set
- Check Netlify deploy logs

### "Failed to fetch" errors
- Verify Supabase credentials are correct
- Check CORS settings in Supabase

### Reddit search not working
- This is expected due to CORS
- App will use Gemini Search as fallback
- For production Reddit API, implement serverless functions

## 📦 What Gets Deployed

```
dist/
├── index.html (4.56 KB)
└── assets/
    └── index-H-YT4If1.js (717 KB)
```

**Total Size**: ~722 KB (179 KB gzipped)

## 🎯 Quick Deploy Summary

1. **Drag the `dist` folder** to Netlify
2. **Add environment variables** in Netlify settings
3. **Add Supabase credentials** (get from Supabase dashboard)
4. **Test your live site**

## 🔄 Updating Your Site

### For Drag & Drop deploys:
1. Run `npm run build` locally
2. Drag new `dist` folder to your site in Netlify dashboard

### For Git-based deploys:
1. Make changes
2. Run `npm run build` (optional, Netlify will do this)
3. Commit and push to Git
4. Netlify auto-deploys

## 📝 Notes

- **Build Time**: ~7 seconds
- **Deploy Time**: ~30 seconds
- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Custom Domain**: Free SSL certificate included

## 🎉 Success!

Once deployed, your Sales Flow app will be live with:
- ✅ User authentication
- ✅ Campaign management
- ✅ AI-powered lead finding
- ✅ Admin panel (for admin users)
- ✅ Reddit API integration (with Gemini fallback)

---

**Ready to deploy!** Just drag the `dist` folder to Netlify and add your environment variables.
