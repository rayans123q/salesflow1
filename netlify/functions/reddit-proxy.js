// Reddit API Proxy - Handles CORS issues for Reddit API requests
// Uses multiple strategies to fetch Reddit data

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { url, clientId, clientSecret } = JSON.parse(event.body);

        if (!url) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'URL is required' })
            };
        }

        // Validate that it's a Reddit URL
        if (!url.includes('reddit.com')) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Only Reddit URLs are allowed' })
            };
        }

        console.log(`📡 Proxying request to: ${url}`);

        // Strategy 1: Try with old.reddit.com (more reliable)
        const oldRedditUrl = url.replace('www.reddit.com', 'old.reddit.com').replace('reddit.com', 'old.reddit.com');
        
        // Strategy 2: Multiple User-Agent attempts
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'web:salesflow:v1.0.0 (by /u/salesflow)'
        ];

        let lastError = null;

        // Try each strategy
        for (const userAgent of userAgents) {
            try {
                const headers = {
                    'User-Agent': userAgent,
                    'Accept': 'application/json, text/html',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                };

                // Add Basic Auth if credentials provided
                if (clientId && clientSecret) {
                    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                    headers['Authorization'] = `Basic ${auth}`;
                }

                console.log(`🔄 Trying with User-Agent: ${userAgent.substring(0, 30)}...`);

                const response = await fetch(oldRedditUrl, {
                    method: 'GET',
                    headers,
                    redirect: 'follow'
                });

                console.log(`📥 Response status: ${response.status}`);

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    let data;

                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        // If HTML, try to parse it
                        const html = await response.text();
                        // For now, return error - we need JSON
                        throw new Error('Received HTML instead of JSON');
                    }

                    console.log(`✅ Successfully fetched from Reddit`);

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
                }

                lastError = `Status ${response.status}: ${response.statusText}`;
                console.log(`⚠️ Attempt failed: ${lastError}`);
                
            } catch (attemptError) {
                lastError = attemptError.message;
                console.log(`⚠️ Attempt failed: ${lastError}`);
                continue;
            }
        }

        // All attempts failed
        console.error(`❌ All attempts failed. Last error: ${lastError}`);
        
        return {
            statusCode: 503,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                error: 'Reddit API unavailable',
                message: 'All fetch attempts failed',
                lastError: lastError
            })
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
