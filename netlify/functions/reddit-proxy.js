// Netlify Function to proxy Reddit API requests
// This bypasses CORS issues by making server-side requests

exports.handler = async (event, context) => {
  // Enable CORS for the frontend
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Reddit proxy function called');
    console.log('Event body:', event.body);
    
    // Parse the request
    const { url, clientId, clientSecret } = JSON.parse(event.body || '{}');
    
    console.log('Parsed URL:', url);
    console.log('Has clientId:', !!clientId);
    console.log('Has clientSecret:', !!clientSecret);
    
    if (!url) {
      console.error('No URL provided in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Make the Reddit API request
    const redditHeaders = {
      'User-Agent': 'SalesFlow/1.0.0'
    };

    // Add authentication if credentials provided
    if (clientId && clientSecret) {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      redditHeaders['Authorization'] = `Basic ${auth}`;
      console.log('Added Basic auth header');
    }

    console.log(`Proxying Reddit API request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: redditHeaders
    });

    if (!response.ok) {
      console.error(`Reddit API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Reddit API error: ${response.statusText}`,
          status: response.status,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('Reddit API success! Posts found:', data?.data?.children?.length || 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error('Proxy error:', error);
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
