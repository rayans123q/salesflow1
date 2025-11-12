// Netlify Function to handle Whop webhooks
// This updates subscription status when users subscribe/cancel

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Update user subscription in database
async function updateSubscription(userId, status, membershipData) {
  try {
    const updateData = {
      subscription_status: status,
      reddit_api_subscribed: status === 'active' || status === 'trialing',
      subscription_started_at: membershipData.created_at ? new Date(membershipData.created_at * 1000).toISOString() : null,
      subscription_expires_at: membershipData.expires_at ? new Date(membershipData.expires_at * 1000).toISOString() : null,
      whop_membership_id: membershipData.id,
      whop_plan_id: membershipData.plan_id,
    };

    // Check if user_settings exists
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) throw error;
      console.log(`✅ Updated subscription for user ${userId}`);
    } else {
      // Create new
      const { error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...updateData }]);
      
      if (error) throw error;
      console.log(`✅ Created subscription for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update subscription for user ${userId}:`, error);
    throw error;
  }
}

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

  try {
    console.log('📥 Whop webhook received');
    
    const payload = JSON.parse(event.body || '{}');
    const { type, data } = payload;

    console.log('Webhook type:', type);
    console.log('Webhook data:', JSON.stringify(data, null, 2));

    // Extract user ID from membership data
    const userId = data.user_id || data.user?.id;
    
    if (!userId) {
      console.warn('⚠️ No user ID found in webhook data');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true, warning: 'No user ID' })
      };
    }

    // Handle different webhook events
    switch (type) {
      case 'membership.created':
        console.log('✅ New subscription created:', data.id);
        await updateSubscription(userId, data.status || 'active', data);
        break;

      case 'membership.updated':
        console.log('🔄 Subscription updated:', data.id);
        await updateSubscription(userId, data.status || 'active', data);
        break;

      case 'membership.cancelled':
        console.log('❌ Subscription cancelled:', data.id);
        await updateSubscription(userId, 'cancelled', data);
        break;

      case 'membership.expired':
        console.log('⏰ Subscription expired:', data.id);
        await updateSubscription(userId, 'expired', data);
        break;

      case 'payment.succeeded':
        console.log('💰 Payment succeeded:', data.id);
        // Payment succeeded, membership should be active
        if (data.membership_id) {
          await updateSubscription(userId, 'active', data);
        }
        break;

      case 'payment.failed':
        console.log('⚠️ Payment failed:', data.id);
        // Don't change status on failed payment, just log it
        console.log(`Payment failed for user ${userId}`);
        break;

      default:
        console.log('ℹ️ Unhandled webhook type:', type);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message 
      })
    };
  }
};
