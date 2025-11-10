# ✅ Quick Deploy Checklist

## 📦 What to Upload
- **Folder**: `dist`
- **Location**: `c:\Users\user\Desktop\test2\tr\vioe\sales-flow (2)\dist`

## 🔐 Environment Variables to Add in Netlify

Copy and paste these into Netlify's Environment Variables section:

```
GEMINI_API_KEY
AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A

VITE_COMPANY_REDDIT_CLIENT_ID
sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw

VITE_COMPANY_REDDIT_CLIENT_SECRET
FfBhxWVwB-jNkba4tUuSdQ

VITE_SUPABASE_URL
https://zimlbwfmiakbwijwmcpq.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU
```

## ✅ Pre-Deploy Checklist

- [x] Production build created
- [x] Netlify Function for Reddit API created
- [x] Supabase credentials configured
- [x] CORS issue fixed
- [x] All environment variables documented

## 🚀 Deploy Steps

1. Go to https://app.netlify.com
2. Drag the `dist` folder to Netlify
3. Go to Site Settings → Environment Variables
4. Add all 5 variables above
5. Go to Deploys → Trigger deploy → Clear cache and deploy site
6. Wait ~1 minute
7. Visit your live URL!

## 🎯 What Will Work

✅ Real Reddit API (no CORS)
✅ User authentication
✅ Campaign management
✅ Lead finding with AI
✅ Admin panel at /admin
✅ All features functional

## 📊 Status: 100% READY TO DEPLOY!
