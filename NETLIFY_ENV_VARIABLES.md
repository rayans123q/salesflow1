# 🔐 Netlify Environment Variables Setup

## Required Environment Variables for New Netlify Account

Go to: **Site settings** → **Environment variables** → **Add a variable**

### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Gemini API Keys (Multiple for rotation)
```
VITE_GEMINI_API_KEY_1=your_first_gemini_api_key
VITE_GEMINI_API_KEY_2=your_second_gemini_api_key
VITE_GEMINI_API_KEY_3=your_third_gemini_api_key
VITE_GEMINI_API_KEY_4=your_fourth_gemini_api_key
VITE_GEMINI_API_KEY_5=your_fifth_gemini_api_key
```

### Whop Integration (Payment System)
```
VITE_WHOP_API_KEY=your_whop_api_key
VITE_WHOP_COMPANY_ID=your_whop_company_id
VITE_WHOP_PRODUCT_ID=your_whop_product_id
```

### Reddit OAuth (Company Credentials)
```
VITE_COMPANY_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_COMPANY_REDDIT_CLIENT_SECRET=your_reddit_client_secret
VITE_COMPANY_REDDIT_USERNAME=your_reddit_username
VITE_COMPANY_REDDIT_PASSWORD=your_reddit_password
```

## 📋 How to Add Variables in Netlify

1. Go to your site dashboard
2. Click **Site settings** (in the top navigation)
3. Click **Environment variables** (in the left sidebar)
4. Click **Add a variable**
5. For each variable:
   - Enter the **Key** (e.g., `VITE_SUPABASE_URL`)
   - Enter the **Value** (your actual value)
   - Select **All scopes** (or specific deploy contexts)
   - Click **Create variable**

## ⚠️ Important Notes

- All variables starting with `VITE_` are exposed to the client
- Never commit these values to Git
- After adding variables, trigger a new deploy
- Variables are encrypted and secure in Netlify

## 🔄 After Adding Variables

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete
4. Your site will be live with all environment variables!

## 🎯 Quick Copy-Paste Template

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Gemini API Keys
VITE_GEMINI_API_KEY_1=
VITE_GEMINI_API_KEY_2=
VITE_GEMINI_API_KEY_3=
VITE_GEMINI_API_KEY_4=
VITE_GEMINI_API_KEY_5=

# Whop
VITE_WHOP_API_KEY=
VITE_WHOP_COMPANY_ID=
VITE_WHOP_PRODUCT_ID=

# Reddit
VITE_COMPANY_REDDIT_CLIENT_ID=
VITE_COMPANY_REDDIT_CLIENT_SECRET=
VITE_COMPANY_REDDIT_USERNAME=
VITE_COMPANY_REDDIT_PASSWORD=
```

Fill in the values from your `.env.local` file!