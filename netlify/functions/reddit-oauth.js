// Netlify Function to handle Reddit OAuth token requests
// This bypasses CORS by making server-side requests

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
    const { action, clientId, clientSecret, username, password, token, url } = JSON.parse(event.body || '{}');

    // Action 1: Get OAuth token
    if (action === 'getToken') {
      if (!clientId || !clientSecret || !username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing credentials' })
        };
      }

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const params = new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
      });

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SalesFlow/1.0.0',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reddit OAuth error:', response.status, errorText);
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: `Reddit OAuth failed: ${response.statusText}`,
            details: errorText
          })
        };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // Action 2: Make authenticated API request
    if (action === 'apiRequest') {
      if (!token || !url) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing token or url' })
        };
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'SalesFlow/1.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: `Reddit API error: ${response.statusText}`,
            details: errorText
          })
        };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('OAuth proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
