// Netlify Function to search Reddit API (bypasses CORS)
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
    const { keywords, subreddits, timeRange, limit = 25 } = JSON.parse(event.body);

    if (!keywords || keywords.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Keywords are required' })
      };
    }

    console.log('🔍 Searching Reddit for:', keywords);

    // Build search query
    const searchQuery = keywords.join(' OR ');
    const subredditFilter = subreddits && subreddits.length > 0 
      ? `subreddit:${subreddits.join('|')}` 
      : '';
    
    const fullQuery = subredditFilter 
      ? `${searchQuery} ${subredditFilter}` 
      : searchQuery;

    // Map time range
    const timeMap = {
      'lastDay': 'day',
      'lastWeek': 'week',
      'lastMonth': 'month'
    };
    const time = timeMap[timeRange] || 'week';

    // Search Reddit using public JSON API
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(fullQuery)}&sort=relevance&t=${time}&limit=${limit}`;
    
    console.log('📡 Reddit API URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SalesFlow/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Reddit data to our format
    const posts = data.data.children
      .filter(child => child.kind === 't3') // Only posts, not comments
      .map(child => {
        const post = child.data;
        return {
          postUrl: `https://www.reddit.com${post.permalink}`,
          subreddit: `r/${post.subreddit}`,
          title: post.title,
          content: post.selftext || post.title,
          author: post.author,
          score: post.score,
          numComments: post.num_comments,
          createdAt: new Date(post.created_utc * 1000).toISOString()
        };
      });

    console.log(`✅ Found ${posts.length} Reddit posts`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ posts })
    };

  } catch (error) {
    console.error('❌ Reddit search error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to search Reddit',
        message: error.message 
      })
    };
  }
};
