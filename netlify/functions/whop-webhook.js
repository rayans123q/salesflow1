// Whop Webhook Handler
// Handles subscription lifecycle events: created, renewed, cancelled, expired
// This ensures automatic subscription management without manual intervention

const crypto = require('crypto');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Whop-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify webhook signature for security
    const signature = event.headers['x-whop-signature'];
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(event.body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    }

    const payload = JSON.parse(event.body);
    console.log('📥 Whop webhook received:', payload.action);

    const { action, data } = payload;
    const membership = data;

    // Get user email from membership
    const userEmail = membership.email || membership.user?.email;
    
    if (!userEmail) {
      console.error('❌ No email found in webhook payload');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No email in payload' })
      };
    }

    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Handle different webhook events
    switch (action) {
      case 'membership.created':
      case 'membership.went_valid':
      case 'payment.succeeded':
        // Activate subscription
        console.log('✅ Activating subscription for:', userEmail);
        
        const { error: upsertError } = await supabase
          .from('subscribed_users')
          .upsert({
            email: userEmail.toLowerCase(),
            status: 'active',
            subscribed_at: new Date().toISOString(),
            whop_membership_id: membership.id,
            expires_at: membership.expires_at ? new Date(membership.expires_at * 1000).toISOString() : null
          }, {
            onConflict: 'email'
          });

        if (upsertError) {
          console.error('❌ Failed to activate subscription:', upsertError);
          throw upsertError;
        }

        console.log('✅ Subscription activated successfully');
        break;

      case 'membership.cancelled':
      case 'membership.went_invalid':
      case 'membership.expired':
        // Deactivate subscription
        console.log('❌ Deactivating subscription for:', userEmail);
        
        const { error: updateError } = await supabase
          .from('subscribed_users')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('email', userEmail.toLowerCase());

        if (updateError) {
          console.error('❌ Failed to deactivate subscription:', updateError);
          throw updateError;
        }

        console.log('✅ Subscription deactivated successfully');
        break;

      case 'membership.renewed':
        // Renew subscription
        console.log('🔄 Renewing subscription for:', userEmail);
        
        const { error: renewError } = await supabase
          .from('subscribed_users')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            expires_at: membership.expires_at ? new Date(membership.expires_at * 1000).toISOString() : null
          })
          .eq('email', userEmail.toLowerCase());

        if (renewError) {
          console.error('❌ Failed to renew subscription:', renewError);
          throw renewError;
        }

        console.log('✅ Subscription renewed successfully');
        break;

      default:
        console.log('ℹ️ Unhandled webhook action:', action);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully'
      })
    };

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
