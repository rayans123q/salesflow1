// Activate Subscription Function
// Activates a subscription after verifying payment with Whop

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, membershipId } = JSON.parse(event.body || '{}');

    if (!email || !membershipId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email and membership ID are required',
          success: false 
        })
      };
    }

    const whopApiKey = process.env.VITE_WHOP_API_KEY;

    if (!whopApiKey) {
      console.error('❌ Whop API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Whop not configured',
          success: false 
        })
      };
    }

    console.log('🔍 Activating subscription for:', email, 'with membership:', membershipId);

    // First, verify the membership is valid
    const verifyResponse = await fetch(`https://api.whop.com/api/v5/memberships/${membershipId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      console.error('❌ Whop API error:', verifyResponse.status);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid membership',
          success: false 
        })
      };
    }

    const membership = await verifyResponse.json();

    // Verify membership is active
    const isValid = membership.valid === true;
    const isActive = membership.status === 'active' || membership.status === 'trialing';
    const notCancelled = !membership.cancel_at_period_end;

    if (!isValid || !isActive || !notCancelled) {
      console.error('❌ Membership not active:', { isValid, isActive, notCancelled });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Membership is not active',
          success: false 
        })
      };
    }

    // Verify email matches membership
    const membershipEmail = membership.email || membership.user?.email;
    if (membershipEmail && membershipEmail.toLowerCase() !== email.toLowerCase()) {
      console.error('❌ Email mismatch:', { provided: email, membership: membershipEmail });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email does not match membership',
          success: false 
        })
      };
    }

    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Add/update subscription in database
    const { error: upsertError } = await supabase
      .from('subscribed_users')
      .upsert({
        email: email.toLowerCase(),
        status: 'active',
        subscribed_at: new Date().toISOString(),
        whop_membership_id: membershipId,
        expires_at: membership.expires_at ? new Date(membership.expires_at * 1000).toISOString() : null,
        payment_verified: true
      }, {
        onConflict: 'email'
      });

    if (upsertError) {
      console.error('❌ Database error:', upsertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to activate subscription',
          success: false 
        })
      };
    }

    console.log('✅ Subscription activated successfully for:', email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Subscription activated successfully'
      })
    };

  } catch (error) {
    console.error('❌ Activation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        success: false
      })
    };
  }
};
