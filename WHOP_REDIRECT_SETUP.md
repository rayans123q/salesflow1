# Whop Post-Payment Redirect Setup

## 🎯 Goal
After a user completes payment on Whop, automatically redirect them back to your app so they can immediately access the features.

---

## 📋 Current Flow vs Desired Flow

### Current Flow (Manual):
1. User clicks "Get Started" → Whop checkout
2. User pays → Whop success page
3. User manually navigates back to your app
4. User logs in → Access granted

### Desired Flow (Automatic):
1. User clicks "Get Started" → Whop checkout
2. User pays → **Automatically redirected to your app**
3. User logs in (if not already) → Access granted immediately

---

## 🔧 Setup Instructions

### Step 1: Configure Redirect URL in Whop

1. Go to your Whop product page:
   ```
   https://whop.com/dashboard/biz_1kVyh7ulv7fGUR/products/prod_D84DbDnltuHtI
   ```

2. Look for **"Checkout Settings"** or **"Redirect URL"** section

3. Set the redirect URL to your app:
   - **Development:** `http://localhost:3000/?payment=success`
   - **Production:** `https://your-domain.com/?payment=success`

4. Save the settings

### Step 2: Update Checkout URL with Redirect Parameter

You can also pass the redirect URL as a parameter in the checkout link:

```
https://whop.com/checkout/plan_VES4tpsLKJdMH?redirect_url=https://your-domain.com/?payment=success
```

---

## 💻 Code Implementation

### Option A: Add Redirect Parameter to Checkout URL

Update `services/whopService.ts`:

```typescript
// Get checkout URL for subscription
getCheckoutUrl(planId?: string, redirectUrl?: string): string {
  const defaultPlanId = (import.meta as any).env?.VITE_WHOP_PLAN_ID;
  const plan = planId || defaultPlanId;
  const appUrl = window.location.origin;

  if (!plan) {
    console.error('❌ Whop plan ID not configured');
    return '#';
  }

  // Construct Whop checkout URL with redirect
  let checkoutUrl = `https://whop.com/checkout/${plan}`;
  
  if (redirectUrl) {
    checkoutUrl += `?redirect_url=${encodeURIComponent(redirectUrl)}`;
  } else {
    // Default redirect to app with success parameter
    checkoutUrl += `?redirect_url=${encodeURIComponent(appUrl + '/?payment=success')}`;
  }

  return checkoutUrl;
}
```

### Option B: Handle Payment Success in App

Update `App.tsx` to detect when user returns from payment:

```typescript
// Add this useEffect in App.tsx
useEffect(() => {
  // Check if user just completed payment
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get('payment');
  
  if (paymentSuccess === 'success') {
    // Clear the URL parameter
    window.history.replaceState({}, '', '/');
    
    // Show success message
    showNotification('success', 'Payment successful! Welcome to Sales Flow!');
    
    // Refresh subscription status
    if (user?.id) {
      whopService.hasActiveSubscription(user.id).then(hasActive => {
        setHasSubscription(hasActive);
        setShowPaymentGate(!hasActive);
      });
    }
  }
}, [user?.id]);
```

---

## 🎨 Enhanced User Experience

### Add a "Processing Payment" Screen

Create a new component `components/PaymentSuccess.tsx`:

```typescript
import React, { useEffect } from 'react';

interface PaymentSuccessProps {
  onComplete: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onComplete }) => {
  useEffect(() => {
    // Verify subscription after 2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Payment Successful!
        </h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Verifying your subscription...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
```

---

## 🔄 Complete Flow Implementation

### 1. Update `services/whopService.ts`

Add redirect URL support:

```typescript
getCheckoutUrl(planId?: string): string {
  const defaultPlanId = (import.meta as any).env?.VITE_WHOP_PLAN_ID;
  const plan = planId || defaultPlanId;

  if (!plan) {
    console.error('❌ Whop plan ID not configured');
    return '#';
  }

  // Get current app URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${appUrl}/?payment=success`;

  // Construct Whop checkout URL with redirect
  return `https://whop.com/checkout/${plan}?redirect_url=${encodeURIComponent(redirectUrl)}`;
}
```

### 2. Update `App.tsx`

Handle payment success:

```typescript
// Add state for payment processing
const [isProcessingPayment, setIsProcessingPayment] = useState(false);

// Add useEffect to detect payment success
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get('payment');
  
  if (paymentSuccess === 'success' && user?.id) {
    setIsProcessingPayment(true);
    
    // Clear URL parameter
    window.history.replaceState({}, '', '/');
    
    // Verify subscription
    setTimeout(async () => {
      const hasActive = await whopService.hasActiveSubscription(user.id);
      setHasSubscription(hasActive);
      setShowPaymentGate(!hasActive);
      setIsProcessingPayment(false);
      
      if (hasActive) {
        showNotification('success', 'Welcome to Sales Flow! Your subscription is active.');
        
        // Show onboarding if first time
        const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
        if (!hasOnboarded) {
          setShowOnboarding(true);
        }
      }
    }, 2000);
  }
}, [user?.id]);

// In render, show processing screen if needed
if (isProcessingPayment) {
  return <PaymentSuccess onComplete={() => setIsProcessingPayment(false)} />;
}
```

---

## ✅ Testing the Flow

### Local Testing:
1. Start dev server: `npm run dev -- --port 3000`
2. Go to http://localhost:3000/
3. Click "Get Started"
4. Complete payment on Whop
5. Should redirect back to http://localhost:3000/?payment=success
6. App verifies subscription and grants access

### Production Testing:
1. Deploy to Netlify
2. Update Whop redirect URL to your production domain
3. Test complete payment flow
4. Verify user gets immediate access

---

## 🎯 Alternative: Use Whop's Built-in Redirect

Whop may have a default redirect setting in the product configuration. Check:

1. Go to: https://whop.com/dashboard/biz_1kVyh7ulv7fGUR/products/prod_D84DbDnltuHtI
2. Look for "Success URL" or "Redirect URL" in settings
3. Set it to: `https://your-domain.com/?payment=success`

This way, you don't need to pass it as a URL parameter every time.

---

## 📝 Summary

**To enable automatic redirect after payment:**

1. ✅ Add redirect URL parameter to checkout link
2. ✅ Configure redirect URL in Whop product settings
3. ✅ Handle `?payment=success` parameter in your app
4. ✅ Verify subscription and grant access
5. ✅ Show success message and onboarding

**Result:** Seamless payment experience where users are automatically brought back to your app and granted access immediately after payment! 🎉
