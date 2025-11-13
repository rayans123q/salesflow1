# 🚀 Fresh Netlify Deployment - Complete Guide

## ✅ Pre-Deployment Checklist

- [x] Code is ready and working locally
- [x] All environment variables documented
- [x] GitHub repository is up to date
- [x] Build command verified: `npm run build`
- [x] Publish directory: `dist`

---

## 📋 Step-by-Step Deployment

### **Step 1: Login to Netlify**
1. Go to [app.netlify.com](https://app.netlify.com)
2. Login with your **new** Netlify account
3. Make sure you're on the correct account (check top-right corner)

### **Step 2: Create New Site from GitHub**
1. Click **"Add new site"** button
2. Select **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify (if not already authorized)
5. Search for: **`salesflow1`**
6. Click on the repository

### **Step 3: Configure Build Settings**

Enter these **exact** settings:

```
Branch to deploy: main
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

**⚠️ IMPORTANT: Don't click "Deploy site" yet!**

### **Step 4: Add Environment Variables**

Click **"Add environment variables"** and import this file:

**Copy and paste ALL 15 variables below:**

```
VITE_SUPABASE_URL=https://zimlbwfmiakbwijwmcpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU
VITE_GEMINI_API_KEY_1=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A
VITE_GEMINI_API_KEY_2=AIzaSyCJuGhAJHjVtE_kfPLi4P3E7jfC1eWaIQo
VITE_GEMINI_API_KEY_3=AIzaSyBFIwaAsZBctJ2zLTI1SCDKrW6MfQd4ULo
VITE_GEMINI_API_KEY_4=AIzaSyDWZPk2nkzTFV4pR-0wy850kx6sZfPnoWs
VITE_GEMINI_API_KEY_5=AIzaSyBTaTgASSoZ8P-Xr-QxAsU5UyYOaa6OWzo
VITE_WHOP_API_KEY=apik_m9puYcn4xFWaG_C3758738_1319103e963bb4ba69a3e76ed709af5752cbfa136e28c4ad0071d2408c4f5e6c
VITE_WHOP_COMPANY_ID=launchflow-3c98
VITE_WHOP_PRODUCT_ID=prod_D84DbDnltuHtI
VITE_WHOP_PLAN_ID=plan_VES4tpsLKJdMH
VITE_COMPANY_REDDIT_CLIENT_ID=TvA2XcpsJVjEzGoGEGZVjQ
VITE_COMPANY_REDDIT_CLIENT_SECRET=rPtdWIJFoThHWG2OqnVOyOk70qrEaA
VITE_COMPANY_REDDIT_USERNAME=u/Objective-Wait-9298
VITE_COMPANY_REDDIT_PASSWORD=rayans123q
```

**Verify you have exactly 15 variables added!**

### **Step 5: Deploy!**
1. After adding all 15 variables, click **"Deploy site"**
2. Wait 2-3 minutes for build to complete
3. Watch the deploy logs for any errors
4. When you see "Site is live" - you're done! 🎉

### **Step 6: Get Your Site URL**
Your site will be at:
- Random URL: `https://random-name-123456.netlify.app`
- Or customize it: **Site settings** → **Change site name** → `salesflow-new`

### **Step 7: Update External Services**

#### Update Whop Redirect URL:
1. Go to [whop.com/apps](https://whop.com/apps)
2. Find your SalesFlow app
3. Update redirect URL to: `https://your-new-site.netlify.app/`

#### Update Supabase Allowed URLs:
1. Go to [Supabase dashboard](https://supabase.com/dashboard)
2. Select your project
3. **Authentication** → **URL Configuration**
4. Add: `https://your-new-site.netlify.app/**`

### **Step 8: Test Everything**
- [ ] Site loads without errors
- [ ] Login works
- [ ] Create a campaign
- [ ] Reddit posts fetch correctly
- [ ] Payment button works
- [ ] Admin panel accessible at `/admin`

---

## 🎯 Quick Reference

### Build Settings
```
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

### Total Environment Variables: 15
- 2 Supabase
- 5 Gemini API Keys
- 4 Whop
- 4 Reddit

### Important URLs
- Netlify: https://app.netlify.com
- Whop: https://whop.com/apps
- Supabase: https://supabase.com/dashboard
- Your Whop Checkout: https://whop.com/checkout/plan_VES4tpsLKJdMH

---

## 🚨 Common Issues

### Build fails
- Check environment variables are all added
- Verify build command is `npm run build`
- Check deploy logs for specific error

### Site loads but shows errors
- Clear browser cache and local storage
- Check browser console for specific errors
- Verify all 15 environment variables are set

### Payment not working
- Verify Whop redirect URL is updated
- Check VITE_WHOP_PLAN_ID is correct
- Test checkout URL: https://whop.com/checkout/plan_VES4tpsLKJdMH

---

## ✅ Success Checklist

After deployment, verify:
- [ ] Site is live and accessible
- [ ] No console errors
- [ ] Login/signup works
- [ ] Dashboard loads
- [ ] Can create campaigns
- [ ] Reddit posts fetch
- [ ] Payment flow works
- [ ] Admin panel works (`/admin` with password `admin123`)
- [ ] All features functional

---

**🎉 Your SalesFlow app is ready to go!**

Site will auto-deploy on every GitHub push to `main` branch.