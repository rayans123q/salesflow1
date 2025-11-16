// Verify Payment Function
// Verifies that a Whop membership ID is valid and active

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
    const { membershipId } = JSON.parse(event.body || '{}');

    if (!membershipId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Membership ID is required', verified: false })
      };
    }

    const whopApiKey = process.env.VITE_WHOP_API_KEY;

    if (!whopApiKey) {
      console.error('❌ Whop API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Whop not configured', verified: false })
      };
    }

    console.log('🔍 Verifying membership:', membershipId);

    // Verify membership with Whop API
    const response = await fetch(`https://api.whop.com/api/v5/memberships/${membershipId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Whop API error:', response.status);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid membership',
          verified: false 
        })
      };
    }

    const membership = await response.json();
    console.log('📦 Membership data:', membership);

    // Check if membership is valid and active
    const isValid = membership.valid === true;
    const isActive = membership.status === 'active' || membership.status === 'trialing';
    const notCancelled = !membership.cancel_at_period_end;

    const verified = isValid && isActive && notCancelled;

    if (verified) {
      console.log('✅ Payment verified for membership:', membershipId);
    } else {
      console.log('❌ Payment verification failed:', { isValid, isActive, notCancelled });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        verified,
        email: membership.email || membership.user?.email || null,
        membershipId: membership.id,
        status: membership.status,
        expiresAt: membership.expires_at
      })
    };

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        verified: false
      })
    };
  }
};
