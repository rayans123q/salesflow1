// Netlify Function to verify Whop subscription status
// This is a server-side check that cannot be bypassed

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
    const { userEmail } = JSON.parse(event.body || '{}');

    if (!userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User email is required' })
      };
    }

    // First check our subscribed_users table (manual activations from thank you page)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: subscribedUser, error: dbError } = await supabase
      .from('subscribed_users')
      .select('*')
      .eq('email', userEmail.toLowerCase())
      .eq('status', 'active')
      .single();

    if (subscribedUser) {
      console.log('✅ Found active subscription in database:', userEmail);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          hasActiveSubscription: true,
          subscriptionStatus: 'active',
          source: 'database',
          membership: {
            id: subscribedUser.id,
            status: 'active',
            valid: true,
            expires_at: null
          }
        })
      };
    }

    // If not in database, check Whop API
    const whopApiKey = process.env.VITE_WHOP_API_KEY;
    const whopCompanyId = process.env.VITE_WHOP_COMPANY_ID;

    if (!whopApiKey) {
      console.error('❌ Whop API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Whop not configured',
          hasActiveSubscription: false 
        })
      };
    }

    console.log('🔍 Checking subscription via Whop API for:', userEmail);

    // Check user's membership status via Whop API
    // Fetch all memberships and filter by email
    const response = await fetch(`https://api.whop.com/api/v5/memberships?per=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Whop API error:', response.status, errorText);
      
      // If user not found (404), they don't have a subscription
      if (response.status === 404) {
        console.log('ℹ️ No subscription found for:', userEmail);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            hasActiveSubscription: false,
            subscriptionStatus: 'inactive',
            membership: null
          })
        };
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to check subscription',
          hasActiveSubscription: false 
        })
      };
    }

    const data = await response.json();
    console.log(`📦 Whop API response - Total memberships:`, data.data?.length || 0);
    
    // Log all emails in memberships for debugging
    const memberships = data.data || [];
    const allEmails = memberships.map(m => m.email || m.user?.email || 'no-email').filter(e => e !== 'no-email');
    console.log(`📧 Emails in Whop:`, allEmails);
    console.log(`🔍 Looking for:`, userEmail.toLowerCase());
    
    // Find active membership for this user
    const activeMembership = memberships.find(membership => {
      // Check if email matches (case insensitive)
      const memberEmail = membership.email || membership.user?.email || '';
      const emailMatch = memberEmail.toLowerCase() === userEmail.toLowerCase();
      
      // Check if membership is active
      const isActive = membership.status === 'active' || membership.status === 'trialing';
      const notCancelled = !membership.cancel_at_period_end;
      const isValid = membership.valid !== false;
      
      if (emailMatch) {
        console.log(`🔍 Found membership for ${userEmail}:`, {
          id: membership.id,
          status: membership.status,
          isActive,
          notCancelled,
          isValid,
          product: membership.product?.name || 'Unknown'
        });
      }
      
      return emailMatch && isActive && notCancelled && isValid;
    });

    if (activeMembership) {
      console.log('✅ Active subscription found for:', userEmail);
    } else {
      console.log('❌ No active subscription found for:', userEmail);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasActiveSubscription: !!activeMembership,
        subscriptionStatus: activeMembership ? 'active' : 'inactive',
        membership: activeMembership ? {
          id: activeMembership.id,
          status: activeMembership.status,
          valid: activeMembership.valid,
          expires_at: activeMembership.expires_at
        } : null
      })
    };

  } catch (error) {
    console.error('❌ Subscription check error:', error);
    console.error('Error details:', error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        hasActiveSubscription: false 
      })
    };
  }
};
