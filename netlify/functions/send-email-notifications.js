// Email Notification Service using Resend
// Processes pending notifications and sends emails

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

exports.handler = async (event) => {
  console.log('📧 Email notification service started');
  
  try {
    // Get pending notifications
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
      console.log('✅ No pending notifications');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No pending notifications', count: 0 })
      };
    }
    
    console.log(`📊 Found ${notifications.length} pending notifications`);
    
    // Group notifications by user for batching
    const notificationsByUser = {};
    notifications.forEach(notif => {
      if (!notificationsByUser[notif.user_id]) {
        notificationsByUser[notif.user_id] = {
          email: notif.user_email,
          notifications: []
        };
      }
      notificationsByUser[notif.user_id].notifications.push(notif);
    });
    
    // Send emails
    const results = [];
    for (const [userId, userData] of Object.entries(notificationsByUser)) {
      try {
        // Check user preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('email_enabled, email_frequency')
          .eq('user_id', userId)
          .single();
        
        if (!prefs || !prefs.email_enabled) {
          console.log(`⏭️ Email disabled for user ${userId}`);
          continue;
        }
        
        // Send email
        const emailHtml = generateEmailHtml(userData.notifications);
        const emailText = generateEmailText(userData.notifications);
        
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'SalesFlow <notifications@salesflow.app>',
          to: userData.email,
          subject: `🎯 ${userData.notifications.length} New Lead${userData.notifications.length > 1 ? 's' : ''} Found!`,
          html: emailHtml,
          text: emailText
        });
        
        if (emailError) {
          console.error(`❌ Email failed for ${userData.email}:`, emailError);
          
          // Mark as failed
          for (const notif of userData.notifications) {
            await supabase
              .from('notification_queue')
              .update({ status: 'failed', sent_at: new Date().toISOString() })
              .eq('id', notif.id);
          }
          
          results.push({ userId, success: false, error: emailError.message });
        } else {
          console.log(`✅ Email sent to ${userData.email}`);
          
          // Mark as sent
          for (const notif of userData.notifications) {
            await supabase
              .from('notification_queue')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', notif.id);
            
            // Add to history
            await supabase
              .from('notification_history')
              .insert({
                user_id: userId,
                notification_type: notif.notification_type,
                channel: 'email',
                status: 'sent',
                metadata: { notification_id: notif.id, email_id: emailResult.id }
              });
          }
          
          results.push({ userId, success: true, count: userData.notifications.length });
        }
      } catch (err) {
        console.error(`❌ Error processing user ${userId}:`, err);
        results.push({ userId, success: false, error: err.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Email notifications completed: ${successCount}/${results.length} successful`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email notifications processed',
        total: results.length,
        successful: successCount,
        results
      })
    };
    
  } catch (error) {
    console.error('❌ Email notification service failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function generateEmailHtml(notifications) {
  const notificationItems = notifications.map(n => `
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${n.title}</h3>
      <p style="margin: 0 0 12px 0; color: #666;">${n.message}</p>
      <div style="display: flex; gap: 12px;">
        <a href="${n.data.post_url || '#'}" style="background: #8B5CF6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">View Post</a>
        <a href="https://salesflow1.netlify.app" style="background: #e5e7eb; color: #1a1a1a; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">Open Dashboard</a>
      </div>
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #8B5CF6; margin: 0;">🎯 SalesFlow</h1>
          <p style="color: #666; margin: 8px 0 0 0;">New leads found matching your campaigns</p>
        </div>
        
        ${notificationItems}
        
        <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
          <p style="color: #999; font-size: 14px; margin: 0;">
            You're receiving this because you have email notifications enabled.<br>
            <a href="https://salesflow1.netlify.app/settings" style="color: #8B5CF6;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateEmailText(notifications) {
  const notificationText = notifications.map(n => `
${n.title}
${n.message}
View: ${n.data.post_url || 'N/A'}
---
  `).join('\n');
  
  return `
SalesFlow - New Leads Found!

${notificationText}

Open Dashboard: https://salesflow1.netlify.app

---
Manage notification preferences: https://salesflow1.netlify.app/settings
  `;
}
