# 🚀 Deploy SalesFlow to Vercel (Alternative to Netlify)

## Why Vercel?
- **Better free tier limits**
- **Faster deployments**
- **Better performance**
- **No bandwidth limits on free tier**

## 📋 Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from your project directory
```bash
vercel --prod
```

### 4. Set Environment Variables
After deployment, go to your Vercel dashboard and add these environment variables:

**Required Environment Variables:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY_1=your_gemini_key_1
VITE_GEMINI_API_KEY_2=your_gemini_key_2
VITE_GEMINI_API_KEY_3=your_gemini_key_3
VITE_GEMINI_API_KEY_4=your_gemini_key_4
VITE_GEMINI_API_KEY_5=your_gemini_key_5
VITE_WHOP_API_KEY=your_whop_api_key
VITE_WHOP_COMPANY_ID=your_whop_company_id
VITE_WHOP_PRODUCT_ID=your_whop_product_id
VITE_COMPANY_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_COMPANY_REDDIT_CLIENT_SECRET=your_reddit_client_secret
VITE_COMPANY_REDDIT_USERNAME=your_reddit_username
VITE_COMPANY_REDDIT_PASSWORD=your_reddit_password
```

### 5. Update Domain (if needed)
- Your app will be available at `https://your-project-name.vercel.app`
- You can add a custom domain in Vercel dashboard

## 🔧 Alternative: GitHub Integration

### Option A: Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Import your `salesflow1` repository
4. Vercel will auto-deploy on every push

### Option B: Manual Upload
1. Run `npm run build` locally
2. Upload the `dist` folder to Vercel
3. Set environment variables in dashboard

## 📊 Vercel vs Netlify Limits

| Feature | Netlify Free | Vercel Free |
|---------|--------------|-------------|
| Bandwidth | 100GB/month | **Unlimited** |
| Build Minutes | 300/month | 6000/month |
| Functions | 125K/month | 100GB-hours |
| Sites | 1 | Unlimited |

## 🎯 Benefits of Vercel
- ✅ **No bandwidth limits**
- ✅ **Better performance**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Easy GitHub integration**
- ✅ **Better free tier**

## 🚨 If You Prefer to Stay on Netlify
1. Check your Netlify dashboard usage
2. Wait for monthly reset (if close to month end)
3. Upgrade to Pro plan ($19/month)
4. Optimize your site to reduce bandwidth usage

---

**Recommendation: Switch to Vercel for better free tier limits and performance!**