// Send Push Notifications
// Processes pending notifications and sends browser push notifications

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure VAPID details
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@salesflow.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

exports.handler = async (event) => {
  console.log('📱 Push notification service started');
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️ VAPID keys not configured, skipping push notifications');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'VAPID keys not configured', skipped: true })
    };
  }
  
  try {
    // Get pending notifications that need push delivery
    const { data: notifications, error } = await supabase
      .rpc('get_pending_notifications', { limit_count: 50 });
    
    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('✅ No pending push notifications');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No pending notifications', count: 0 })
      };
    }
    
    console.log(`📊 Found ${notifications.length} pending notifications`);
    
    // Group notifications by user
    const notificationsByUser = {};
    notifications.forEach(notif => {
      if (!notificationsByUser[notif.user_id]) {
        notificationsByUser[notif.user_id] = [];
      }
      notificationsByUser[notif.user_id].push(notif);
    });
    
    const results = [];
    
    // Send push notifications
    for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
      try {
        // Check user preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled')
          .eq('user_id', userId)
          .single();
        
        if (!prefs || !prefs.push_enabled) {
          console.log(`⏭️ Push disabled for user ${userId}`);
          continue;
        }
        
        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_notification_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);
        
        if (!subscriptions || subscriptions.length === 0) {
          console.log(`⏭️ No push subscriptions for user ${userId}`);
          continue;
        }
        
        // Send to each subscription (device)
        for (const subscription of subscriptions) {
          for (const notif of userNotifications) {
            try {
              const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh_key,
                  auth: subscription.auth_key
                }
              };
              
              const payload = JSON.stringify({
                title: notif.title,
                message: notif.message,
                body: notif.message,
                icon: '/icon-192.png',
                badge: '/icon-96.png',
                url: notif.data?.comment_url || notif.data?.post_url || '/',
                data: notif.data,
                alert_id: notif.data?.alert_id,
                timestamp: Date.now()
              });
              
              await webpush.sendNotification(pushSubscription, payload);
              console.log(`✅ Push sent to device for user ${userId}`);
              
              // Log to history
              await supabase
                .from('notification_history')
                .insert({
                  user_id: userId,
                  notification_type: notif.notification_type,
                  channel: 'push',
                  status: 'sent',
                  metadata: { 
                    notification_id: notif.id,
                    endpoint: subscription.endpoint
                  }
                });
              
            } catch (error) {
              console.error(`❌ Push failed for device:`, error);
              
              // If subscription is invalid/expired, deactivate it
              if (error.statusCode === 410 || error.statusCode === 404) {
                await supabase
                  .from('push_notification_tokens')
                  .update({ is_active: false })
                  .eq('id', subscription.id);
                console.log(`🗑️ Removed expired subscription`);
              }
            }
          }
        }
        
        results.push({ userId, success: true, count: userNotifications.length });
        
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Push notifications completed: ${successCount}/${results.length} successful`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Push notifications processed',
        total: results.length,
        successful: successCount,
        results
      })
    };
    
  } catch (error) {
    console.error('❌ Push notification service failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
