// Reddit API Proxy - Handles CORS issues for Reddit API requests
// This function proxies requests to Reddit's API to avoid CORS restrictions

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { url, clientId, clientSecret } = JSON.parse(event.body);

        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL is required' })
            };
        }

        // Validate that it's a Reddit URL
        if (!url.includes('reddit.com')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Only Reddit URLs are allowed' })
            };
        }

        console.log(`📡 Proxying request to: ${url}`);

        const headers = {
            'User-Agent': 'SalesFlow/1.0 (Netlify Proxy)',
            'Accept': 'application/json'
        };

        // Add Basic Auth if credentials provided
        if (clientId && clientSecret) {
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
            console.log('🔐 Using Basic Auth with client credentials');
        }

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        console.log(`📥 Reddit response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Reddit API error: ${response.status} ${response.statusText}`);
            console.error(`Error body: ${errorText}`);
            
            return {
                statusCode: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ 
                    error: `Reddit API error: ${response.status}`,
                    message: response.statusText,
                    details: errorText
                })
            };
        }

        const data = await response.json();
        console.log(`✅ Successfully proxied Reddit request`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('❌ Proxy error:', error);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                error: 'Proxy request failed',
                message: error.message,
                stack: error.stack
            })
        };
    }
};
