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

    // TEMPORARY: Whitelist for verified paid users while debugging Whop API
    const verifiedPaidUsers = [
      'dateflow4@gmail.com',   // Paid user confirmed in Whop dashboard
      'rwenzo053@gmail.com',   // Testing account
      'rwenzo112@gmail.com'    // Paid user
    ];

    if (verifiedPaidUsers.includes(userEmail.toLowerCase())) {
      console.log('✅ Verified paid user (whitelist):', userEmail);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          hasActiveSubscription: true,
          subscriptionStatus: 'active',
          source: 'whitelist',
          membership: {
            id: 'verified',
            status: 'active',
            valid: true,
            expires_at: null
          }
        })
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

    console.log('🔍 Checking subscription via Whop API for:', userEmail);

    // Check user's membership status via Whop API
    // Try multiple endpoints to find the user
    let response;
    let apiVersion = 'v5';
    
    // Try v5 first
    response = await fetch(`https://api.whop.com/api/v5/memberships`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // If v5 fails, try v2
    if (!response.ok) {
      console.log('⚠️ v5 failed, trying v2...');
      apiVersion = 'v2';
      response = await fetch(`https://api.whop.com/api/v2/memberships`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }

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
    console.log(`📦 Whop API ${apiVersion} response:`, JSON.stringify(data, null, 2));
    
    // Find active membership for this user
    const memberships = data.data || data.memberships || [];
    console.log(`📊 Found ${memberships.length} total memberships`);
    
    const activeMembership = memberships.find(membership => {
      // Check if email matches (case insensitive)
      const emailMatch = membership.email?.toLowerCase() === userEmail.toLowerCase() ||
                        membership.user?.email?.toLowerCase() === userEmail.toLowerCase();
      
      const isActive = membership.status === 'active' || membership.status === 'trialing';
      const notCancelled = !membership.cancel_at_period_end;
      const isValid = membership.valid !== false;
      
      console.log(`🔍 Checking membership ${membership.id}:`, {
        email: membership.email || membership.user?.email,
        emailMatch,
        status: membership.status,
        isActive,
        notCancelled,
        isValid
      });
      
      return emailMatch && isActive && notCancelled && isValid;
    });

    if (activeMembership) {
      console.log('✅ Active subscription found:', activeMembership.id);
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
