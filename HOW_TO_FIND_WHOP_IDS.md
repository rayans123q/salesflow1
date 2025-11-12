# How to Find Your Whop Product & Plan IDs

## 🎯 Quick Guide

You need two IDs from Whop to complete the integration:
1. **Product ID** (starts with `prod_`)
2. **Plan ID** (starts with `plan_`)

---

## 📍 Step-by-Step Instructions

### Step 1: Go to Whop Dashboard

1. Visit: https://whop.com/dashboard
2. Log in to your account

### Step 2: Navigate to Your Product

1. Click on **"Products"** in the left sidebar
2. Select your Sales Flow product (or create one if you haven't)

### Step 3: Find Product ID

1. Once you're on your product page, look at the URL:
   ```
   https://whop.com/dashboard/products/prod_XXXXXXXXXX
   ```
2. Copy the part that starts with `prod_` - this is your **Product ID**

### Step 4: Find Plan ID

1. On the same product page, scroll down to **"Plans"** section
2. Click on your $9/month plan
3. Look at the URL or plan details:
   ```
   https://whop.com/dashboard/products/prod_XXX/plans/plan_XXXXXXXXXX
   ```
4. Copy the part that starts with `plan_` - this is your **Plan ID**

---

## 🔧 Alternative Method

### Using Whop API:

If you can't find the IDs in the dashboard, you can use the API:

1. Open your browser console (F12)
2. Run this command:

```javascript
fetch('https://api.whop.com/v1/products', {
  headers: {
    'Authorization': 'Bearer apik_m9puYcn4xFWaG_C3758738_1319103e963bb4ba69a3e76ed709af5752cbfa136e28c4ad0071d2408c4f5e6c'
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

This will show all your products with their IDs and plans.

---

## 📝 Once You Have the IDs

Update your `.env.local` file:

```env
VITE_WHOP_PRODUCT_ID=prod_YOUR_ACTUAL_ID_HERE
VITE_WHOP_PLAN_ID=plan_YOUR_ACTUAL_ID_HERE
```

Then restart your dev server:

```bash
npm run dev -- --port 3000
```

---

## ✅ How to Test

1. Go to http://localhost:3000/
2. Click "Get Started" button
3. You should be redirected to:
   ```
   https://whop.com/checkout/prod_YOUR_ID?plan=plan_YOUR_ID
   ```
4. If the checkout page loads, your IDs are correct! ✅

---

## 🆘 Still Can't Find Them?

### Option 1: Create a New Product

1. Go to https://whop.com/dashboard/products
2. Click "Create Product"
3. Set up your product:
   - Name: "Sales Flow"
   - Price: $9/month
   - Description: "AI-powered lead generation tool"
4. After creating, the IDs will be visible

### Option 2: Contact Whop Support

- Email: support@whop.com
- They can help you find your product and plan IDs

---

## 📋 Example IDs

Your IDs will look like this:

```env
VITE_WHOP_PRODUCT_ID=prod_abc123xyz789
VITE_WHOP_PLAN_ID=plan_def456uvw012
```

- Product ID: Always starts with `prod_`
- Plan ID: Always starts with `plan_`

---

## 🎉 Once Configured

After adding the IDs:
1. ✅ "Get Started" button redirects to Whop checkout
2. ✅ Users pay $9/month
3. ✅ After payment, they get access to your app
4. ✅ Subscription managed through Whop

Your payment system will be fully functional! 💰
