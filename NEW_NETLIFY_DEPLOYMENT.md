# 🚀 Deploy to New Netlify Account - Complete Guide

## ✅ Prerequisites
- ✅ Netlify CLI installed
- ✅ New Netlify account created
- ✅ GitHub repository ready

## 📋 Deployment Methods

### **Method 1: GitHub Integration (Recommended)**

#### Step 1: Login to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Login with your new account

#### Step 2: Import from GitHub
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub
4. Select repository: `rayans123q/salesflow1`

#### Step 3: Configure Build Settings
```
Build command: npm run build
Publish directory: dist
Base directory: (leave empty)
```

#### Step 4: Add Environment Variables
Click **"Add environment variables"** and add all variables from the list below.

#### Step 5: Deploy
Click **"Deploy site"** and wait for build to complete!

---

### **Method 2: Netlify CLI Deployment**

#### Step 1: Login to Netlify CLI
```bash
netlify login
```
This will open your browser to authorize the CLI.

#### Step 2: Initialize Site
```bash
netlify init
```

Follow the prompts:
- **Create & configure a new site**: Yes
- **Team**: Select your team
- **Site name**: salesflow1 (or your preferred name)
- **Build command**: `npm run build`
- **Directory to deploy**: `dist`

#### Step 3: Set Environment Variables
```bash
netlify env:set VITE_SUPABASE_URL "your_value"
netlify env:set VITE_SUPABASE_ANON_KEY "your_value"
netlify env:set VITE_GEMINI_API_KEY_1 "your_value"
netlify env:set VITE_GEMINI_API_KEY_2 "your_value"
netlify env:set VITE_GEMINI_API_KEY_3 "your_value"
netlify env:set VITE_GEMINI_API_KEY_4 "your_value"
netlify env:set VITE_GEMINI_API_KEY_5 "your_value"
netlify env:set VITE_WHOP_API_KEY "your_value"
netlify env:set VITE_WHOP_COMPANY_ID "your_value"
netlify env:set VITE_WHOP_PRODUCT_ID "your_value"
netlify env:set VITE_COMPANY_REDDIT_CLIENT_ID "your_value"
netlify env:set VITE_COMPANY_REDDIT_CLIENT_SECRET "your_value"
netlify env:set VITE_COMPANY_REDDIT_USERNAME "your_value"
netlify env:set VITE_COMPANY_REDDIT_PASSWORD "your_value"
```

#### Step 4: Deploy
```bash
netlify deploy --prod
```

---

## 🔐 Required Environment Variables

### Supabase
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Gemini API Keys (5 keys for rotation)
```
VITE_GEMINI_API_KEY_1=your_key_1
VITE_GEMINI_API_KEY_2=your_key_2
VITE_GEMINI_API_KEY_3=your_key_3
VITE_GEMINI_API_KEY_4=your_key_4
VITE_GEMINI_API_KEY_5=your_key_5
```

### Whop Payment Integration
```
VITE_WHOP_API_KEY=your_whop_api_key
VITE_WHOP_COMPANY_ID=your_company_id
VITE_WHOP_PRODUCT_ID=your_product_id
```

### Reddit OAuth
```
VITE_COMPANY_REDDIT_CLIENT_ID=your_client_id
VITE_COMPANY_REDDIT_CLIENT_SECRET=your_client_secret
VITE_COMPANY_REDDIT_USERNAME=your_username
VITE_COMPANY_REDDIT_PASSWORD=your_password
```

---

## 🎯 Quick CLI Commands

### Deploy to production
```bash
netlify deploy --prod
```

### Deploy preview
```bash
netlify deploy
```

### Open site in browser
```bash
netlify open:site
```

### Open admin dashboard
```bash
netlify open:admin
```

### View logs
```bash
netlify logs
```

### Check build status
```bash
netlify status
```

---

## 🔧 Post-Deployment Steps

### 1. Update Whop Redirect URLs
Go to your Whop dashboard and update redirect URLs to your new Netlify domain:
```
https://your-new-site.netlify.app/
```

### 2. Update Supabase Allowed URLs
In Supabase dashboard → Authentication → URL Configuration:
- Add your new Netlify URL to allowed redirect URLs

### 3. Test Your Site
- Visit your new Netlify URL
- Test login functionality
- Test payment flow
- Test Reddit post fetching
- Test admin panel at `/admin`

---

## 📊 Netlify Free Tier Limits

- **Bandwidth**: 100GB/month
- **Build minutes**: 300/month
- **Sites**: 1 per account
- **Functions**: 125K invocations/month

**💡 Tip**: If you hit limits again, you can:
1. Create another free account with different email
2. Upgrade to Pro ($19/month) for unlimited bandwidth
3. Optimize your site to reduce bandwidth usage

---

## 🚨 Troubleshooting

### Build fails
- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs in Netlify dashboard

### Site not loading
- Check if build completed successfully
- Verify publish directory is set to `dist`
- Check browser console for errors

### Functions not working
- Verify functions are in `netlify/functions/` directory
- Check function logs in Netlify dashboard
- Ensure environment variables are accessible to functions

---

## ✅ Success Checklist

- [ ] New Netlify account created
- [ ] Site deployed successfully
- [ ] All environment variables added
- [ ] Site loads correctly
- [ ] Login works
- [ ] Payment flow works
- [ ] Reddit fetching works
- [ ] Admin panel accessible
- [ ] Whop redirect URLs updated
- [ ] Supabase URLs updated

---

**🎉 Your SalesFlow app is now live on your new Netlify account!**