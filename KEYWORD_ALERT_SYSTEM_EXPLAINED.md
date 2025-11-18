# Keyword Alert System - Complete Explanation

## 🎯 Overview

The Keyword Alert System monitors Reddit posts and comments for specific keywords and sends real-time notifications to users via email and browser push notifications.

## 📊 System Architecture

### Current State (What's Built)

#### 1. Email Notifications for New Leads
**How it works:**
```
Campaign Created → Find Posts → Match Keywords → Add to Queue → Email Sent
```

**Flow:**
1. User creates a campaign with keywords (e.g., "CRM software", "sales automation")
2. System searches Reddit for posts matching those keywords
3. When posts are found, notification added to `notification_queue`
4. Scheduled function (every 15 min) processes queue
5. Email sent to user with post details

**Limitations:**
- Only monitors **new posts** (not comments)
- Only for campaign keywords
- No real-time alerts (15-minute delay)
- No browser notifications

---

### What You're Asking For (Keyword Alert System)

#### 1. Keyword Monitoring for Comments
**Goal:** Monitor ongoing Reddit conversations for specific keywords

**How it would work:**
```
User Sets Keywords → Monitor Comments → Match Found → Instant Alert
```

**Example Use Case:**
- User sets keyword alert: "looking for CRM"
- Someone comments "I'm looking for CRM recommendations" on a post
- User gets instant notification
- User can reply immediately while conversation is active

#### 2. Browser/Device Notifications (Bell Icon)
**Goal:** Real-time push notifications to user's device

**How it works:**
```
Keyword Match → Push Notification → Bell Icon → User Clicks → Opens Post
```

**Technologies:**
- **Web Push API** - Browser notifications
- **Service Worker** - Background processing
- **Push Notification Tokens** - Device registration

---

## 🔧 Technical Implementation

### Phase 1: Comment Monitoring System

#### A. Database Schema (Already Created)
```sql
-- Keyword alerts table
CREATE TABLE keyword_alerts (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,                    -- "CRM Mentions"
    keywords TEXT[],              -- ["looking for CRM", "need CRM"]
    negative_keywords TEXT[],     -- ["free", "open source"]
    subreddits TEXT[],           -- ["r/sales", "r/entrepreneur"]
    is_active BOOLEAN,
    notification_email BOOLEAN,
    notification_push BOOLEAN,
    alert_frequency TEXT          -- instant, hourly, daily
);

-- Matches table
CREATE TABLE keyword_alert_matches (
    id UUID PRIMARY KEY,
    alert_id UUID,
    post_id INTEGER,
    matched_keywords TEXT[],
    relevance_score DECIMAL,
    notification_sent BOOLEAN
);
```

#### B. Comment Monitoring Service (Need to Build)

**Option 1: Real-time Monitoring (Expensive)**
```javascript
// Continuously poll Reddit for new comments
setInterval(async () => {
  // Get all active keyword alerts
  const alerts = await getActiveAlerts();
  
  // For each alert, check recent comments
  for (const alert of alerts) {
    const comments = await fetchRecentComments(alert.subreddits);
    
    // Check each comment against keywords
    for (const comment of comments) {
      if (matchesKeywords(comment, alert.keywords)) {
        // Create notification
        await createNotification(alert.user_id, comment);
      }
    }
  }
}, 60000); // Every minute
```

**Option 2: Webhook-based (Recommended)**
```javascript
// Use Reddit's Pushshift API or similar
// Subscribe to comment streams for specific subreddits
// Process comments as they arrive
```

**Option 3: Scheduled Batch Processing (Most Practical)**
```javascript
// Netlify scheduled function (every 5-15 minutes)
exports.handler = async () => {
  const alerts = await getActiveAlerts();
  
  for (const alert of alerts) {
    // Get comments since last check
    const lastCheck = alert.last_triggered || '1 hour ago';
    const comments = await fetchCommentsSince(lastCheck, alert.subreddits);
    
    // Match against keywords
    const matches = comments.filter(c => 
      matchesKeywords(c, alert.keywords, alert.negative_keywords)
    );
    
    // Create notifications
    for (const match of matches) {
      await createNotification({
        user_id: alert.user_id,
        alert_id: alert.id,
        type: 'keyword_alert',
        title: `Keyword Alert: "${alert.name}"`,
        message: `New comment matching "${match.matched_keywords.join(', ')}"`,
        data: {
          comment_url: match.url,
          comment_text: match.body,
          subreddit: match.subreddit,
          post_title: match.post_title
        }
      });
    }
  }
};
```

### Phase 2: Browser Push Notifications

#### A. Service Worker Setup (Already Exists)
Your `public/service-worker.js` handles offline caching. Need to add push notification handling:

```javascript
// Add to service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    data: {
      url: data.url
    },
    actions: [
      { action: 'view', title: 'View Post' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url);
  }
});
```

#### B. Push Notification Registration

**Frontend Component:**
```typescript
// components/PushNotificationSetup.tsx
const PushNotificationSetup = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  const requestPermission = async () => {
    // Request notification permission
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      // Register service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
      
      // Save subscription to database
      await savePushSubscription(subscription);
    }
  };
  
  return (
    <button onClick={requestPermission}>
      {permission === 'granted' ? '✓ Notifications Enabled' : '🔔 Enable Notifications'}
    </button>
  );
};
```

#### C. Backend Push Service

**Netlify Function:**
```javascript
// netlify/functions/send-push-notifications.js
const webpush = require('web-push');

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async () => {
  // Get pending push notifications
  const notifications = await getPendingPushNotifications();
  
  for (const notif of notifications) {
    // Get user's push subscriptions
    const subscriptions = await getUserPushTokens(notif.user_id);
    
    const payload = JSON.stringify({
      title: notif.title,
      message: notif.message,
      url: notif.data.post_url
    });
    
    // Send to all user's devices
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (error) {
        if (error.statusCode === 410) {
          // Subscription expired, remove it
          await removePushToken(sub.id);
        }
      }
    }
    
    // Mark as sent
    await markNotificationSent(notif.id);
  }
};
```

---

## 🎬 Complete User Flow

### Setting Up Keyword Alerts

1. **User goes to Settings → Keyword Alerts**
2. **Creates new alert:**
   - Name: "CRM Opportunities"
   - Keywords: ["looking for CRM", "need sales software", "CRM recommendations"]
   - Negative keywords: ["free", "open source"]
   - Subreddits: ["r/sales", "r/entrepreneur", "r/smallbusiness"]
   - Notification: Email + Push (instant)

3. **Enables browser notifications:**
   - Clicks "Enable Push Notifications"
   - Browser asks for permission
   - User grants permission
   - Device registered for push notifications

### Receiving Notifications

#### Scenario: Someone posts a comment

1. **Reddit Activity:**
   - User posts: "I'm looking for CRM software for my startup"
   - Comment appears in r/entrepreneur

2. **System Detection:**
   - Scheduled function runs (every 5 minutes)
   - Fetches recent comments from monitored subreddits
   - Matches comment against keyword alert
   - Finds match: "looking for CRM"

3. **Notification Creation:**
   - Creates notification in queue
   - Type: keyword_alert
   - Priority: instant (because user chose instant alerts)

4. **Delivery:**
   
   **Email (if enabled):**
   - Subject: "🎯 Keyword Alert: CRM Opportunities"
   - Body: "New comment matching 'looking for CRM'"
   - Link to comment
   - Preview of comment text
   
   **Push Notification (if enabled):**
   - Bell icon appears on device
   - Notification shows: "CRM Opportunities - New match found"
   - User clicks → Opens Reddit comment
   - User can reply immediately

5. **Tracking:**
   - Match saved to `keyword_alert_matches`
   - Statistics updated
   - User can see all matches in dashboard

---

## 📱 Browser Notification Behavior

### Desktop (Chrome, Firefox, Edge)
- **Bell icon** appears in system tray
- **Sound** plays (if enabled)
- **Banner** shows notification
- **Persists** until dismissed
- **Click** opens the Reddit post/comment

### Mobile (PWA)
- **Push notification** appears like native app
- **Badge** on app icon
- **Vibration** (if enabled)
- **Tap** opens app to the post

### iOS Safari (Limited)
- No push notifications (Apple restriction)
- Only email notifications work
- Must use native iOS app for push

---

## 🚀 Implementation Priority

### Phase 1: Basic Keyword Alerts (Email Only)
✅ Database schema created
✅ Email notification system working
⏳ Need: Comment monitoring service
⏳ Need: Keyword alert UI component

### Phase 2: Browser Push Notifications
⏳ Need: Service worker push handling
⏳ Need: Push subscription management
⏳ Need: VAPID key setup
⏳ Need: Push notification UI

### Phase 3: Advanced Features
⏳ Thread tracking (monitor entire conversations)
⏳ Smart notifications (AI-powered relevance)
⏳ Notification grouping (batch similar alerts)
⏳ Custom notification sounds

---

## 🔑 Key Differences

### Campaign Keywords vs Keyword Alerts

**Campaign Keywords:**
- Find **new posts** for lead generation
- Run when you refresh campaign
- Show in campaign dashboard
- For proactive outreach

**Keyword Alerts:**
- Monitor **ongoing conversations** (posts + comments)
- Run continuously in background
- Instant notifications
- For reactive engagement

### Email vs Push Notifications

**Email Notifications:**
- ✅ Works everywhere
- ✅ No permission needed
- ✅ Can batch multiple alerts
- ❌ Not instant (15-min delay)
- ❌ Can be missed in inbox

**Push Notifications:**
- ✅ Instant delivery
- ✅ Visible bell icon
- ✅ System-level alerts
- ❌ Requires permission
- ❌ Doesn't work on iOS Safari

---

## 💡 Recommended Approach

For your use case (monitoring keywords in comments with device notifications):

1. **Start with Email + Scheduled Monitoring**
   - Implement comment monitoring (every 5-15 minutes)
   - Send email alerts for matches
   - Quick to build, works everywhere

2. **Add Browser Push Notifications**
   - Implement Web Push API
   - Add permission UI
   - Enable instant alerts for desktop users

3. **Optimize with AI**
   - Use AI to score relevance
   - Filter out low-quality matches
   - Prioritize high-value opportunities

Would you like me to build the complete keyword alert system with comment monitoring and push notifications?
