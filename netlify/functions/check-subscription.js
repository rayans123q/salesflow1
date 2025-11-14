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

    console.log('🔍 Checking subscription for:', userEmail);

    // Check user's membership status via Whop API v5
    const response = await fetch(`https://api.whop.com/api/v5/memberships?email=${encodeURIComponent(userEmail)}`, {
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
    console.log('📦 Whop API response:', JSON.stringify(data, null, 2));
    
    // Find active membership for this user
    const memberships = data.data || [];
    const activeMembership = memberships.find(membership => {
      const isActive = membership.status === 'active';
      const notCancelled = !membership.cancel_at_period_end;
      const isValid = membership.valid !== false;
      
      console.log(`🔍 Checking membership ${membership.id}:`, {
        status: membership.status,
        isActive,
        notCancelled,
        isValid,
        email: membership.email
      });
      
      return isActive && notCancelled && isValid;
    });

    if (activeMembership) {
      console.log('✅ Active subscription found:', activeMembership.id);
    } else {
      console.log('❌ No active subscription found');
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
