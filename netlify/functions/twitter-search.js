// Netlify Function to search Twitter API (bypasses CORS)
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { keywords, maxResults = 10 } = JSON.parse(event.body);

    if (!keywords || keywords.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Keywords are required' })
      };
    }

    // Get Twitter bearer token from environment
    const bearerToken = process.env.VITE_TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      console.warn('⚠️ Twitter bearer token not configured');
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Twitter API not configured',
          tweets: []
        })
      };
    }

    console.log('🐦 Searching Twitter for:', keywords);

    // Build search query
    const searchQuery = keywords.join(' OR ');
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Twitter API v2 endpoint
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,profile_image_url`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Twitter API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: `Twitter API error: ${response.status}`,
          tweets: []
        })
      };
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      console.log('📭 No tweets found');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ tweets: [] })
      };
    }

    // Map users by ID
    const usersMap = new Map();
    if (data.includes?.users) {
      data.includes.users.forEach(user => {
        usersMap.set(user.id, user);
      });
    }

    // Transform Twitter data to our format
    const tweets = data.data.map(tweet => {
      const author = usersMap.get(tweet.author_id);
      const username = author?.username || 'unknown';
      const authorName = author?.name || username;

      return {
        postUrl: `https://twitter.com/${username}/status/${tweet.id}`,
        title: `Tweet by @${username}`,
        content: tweet.text,
        author: authorName,
        authorUrl: `https://twitter.com/${username}`,
        createdAt: tweet.created_at,
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
        }
      };
    });

    console.log(`✅ Found ${tweets.length} tweets`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ tweets })
    };

  } catch (error) {
    console.error('❌ Twitter search error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to search Twitter',
        message: error.message,
        tweets: []
      })
    };
  }
};
