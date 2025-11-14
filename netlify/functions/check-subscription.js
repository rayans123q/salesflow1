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

    if (!whopApiKey || !whopCompanyId) {
      console.error('Whop credentials not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Whop not configured' })
      };
    }

    // Check user's membership status via Whop API
    const response = await fetch(`https://api.whop.com/api/v2/memberships`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Whop API error:', response.status);
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
    
    // Find active membership for this user
    const activeMembership = data.data?.find(membership => 
      membership.email?.toLowerCase() === userEmail.toLowerCase() &&
      membership.status === 'active' &&
      !membership.cancel_at_period_end
    );

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
    console.error('Subscription check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        hasActiveSubscription: false 
      })
    };
  }
};
