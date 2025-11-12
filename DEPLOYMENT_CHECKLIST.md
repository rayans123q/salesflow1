# 🚀 Deployment Checklist

## Complete this checklist before going live!

---

## ✅ Database Setup

- [ ] **Run SQL Migration**
  - Open `supabase_migration_subscription.sql`
  - Copy all SQL code
  - Paste into Supabase SQL Editor
  - Click "Run"
  - Verify: No errors, columns created
  - See: `RUN_THIS_SQL_MIGRATION.md` for detailed instructions

---

## ✅ Whop Configuration

- [ ] **Update Redirect URL in Whop**
  - Go to: https://whop.com/dashboard/biz_1kVyh7ulv7fGUR/products/prod_D84DbDnltuHtI
  - Find "Redirect after checkout" field
  - Set to: `https://salesflow1.netlify.app/?payment=success`
  - Click "Save"

- [ ] **Verify Product is Visible**
  - Product status: "Visible" ✅
  - Plan status: "Active" ✅
  - Price: $9/month ✅

- [ ] **Test Checkout Link**
  - Visit: https://whop.com/checkout/plan_VES4tpsLKJdMH
  - Should show checkout page (not "Nothing to see here")

---

## ✅ Netlify Deployment

- [ ] **Add Environment Variables**
  - Go to: Netlify Dashboard → Site Settings → Environment Variables
  - Add all variables from `.env.local`:
    ```
    VITE_GEMINI_API_KEYS=...
    VITE_COMPANY_REDDIT_CLIENT_ID=...
    VITE_COMPANY_REDDIT_CLIENT_SECRET=...
    VITE_COMPANY_REDDIT_USERNAME=...
    VITE_COMPANY_REDDIT_PASSWORD=...
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    VITE_WHOP_API_KEY=...
    VITE_WHOP_PRODUCT_ID=prod_D84DbDnltuHtI
    VITE_WHOP_PLAN_ID=plan_VES4tpsLKJdMH
    ```

- [ ] **Deploy to Netlify**
  - Push code to GitHub
  - Netlify auto-deploys
  - Or: Manual deploy via Netlify dashboard

- [ ] **Verify Deployment**
  - Visit: https://salesflow1.netlify.app/
  - Landing page loads ✅
  - Video background works ✅
  - "Get Started" button works ✅

---

## ✅ Payment Flow Testing

- [ ] **Test Complete Flow**
  1. Go to https://salesflow1.netlify.app/
  2. Click "Get Started"
  3. Should redirect to Whop checkout
  4. Complete test payment (use test card if available)
  5. Should redirect back to app with `?payment=success`
  6. Should show success message
  7. Login if needed
  8. Should grant access to dashboard

- [ ] **Verify Database Update**
  - Check Supabase `user_settings` table
  - User should have:
    - `subscription_status`: 'active'
    - `reddit_api_subscribed`: true
    - `whop_membership_id`: filled
    - `whop_plan_id`: 'plan_VES4tpsLKJdMH'

---

## ✅ Webhook Configuration (Optional but Recommended)

- [ ] **Set Up Whop Webhooks**
  - Go to: https://whop.com/dashboard/webhooks
  - Add webhook URL: `https://salesflow1.netlify.app/.netlify/functions/whop-webhook`
  - Select events:
    - ✅ membership.created
    - ✅ membership.updated
    - ✅ membership.cancelled
    - ✅ membership.expired
    - ✅ payment.succeeded
    - ✅ payment.failed
  - Save webhook

- [ ] **Test Webhook**
  - Whop dashboard → Send test webhook
  - Check Netlify function logs
  - Should see: "Webhook received" ✅

---

## ✅ Final Checks

- [ ] **Landing Page**
  - Video background plays ✅
  - Spotlight effect works on hover ✅
  - "Book a Call" button opens Calendly modal ✅
  - All links work ✅

- [ ] **Payment System**
  - Checkout redirects correctly ✅
  - Payment success detected ✅
  - Subscription verified ✅
  - Access granted ✅

- [ ] **Dashboard Access**
  - Logged-in users with subscription can access ✅
  - Users without subscription see payment gate ✅
  - Onboarding tour shows for new users ✅

- [ ] **Settings Page**
  - Subscription status displays ✅
  - User can manage account ✅

---

## 🎉 Launch!

Once all items are checked:

1. ✅ Database is configured
2. ✅ Whop is configured
3. ✅ App is deployed
4. ✅ Payment flow works
5. ✅ Webhooks are set up

**You're ready to launch!** 🚀

Share your link: https://salesflow1.netlify.app/

---

## 📞 Support

If you encounter issues:
- Check `TROUBLESHOOTING.md`
- Review Netlify function logs
- Check Supabase logs
- Verify Whop dashboard for subscription status

Good luck with your launch! 💰
