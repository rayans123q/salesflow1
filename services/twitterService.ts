// Twitter/X API Service for SalesFlow
// Searches Twitter for leads based on keywords

interface TwitterPost {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface TwitterSearchResult {
  postUrl: string;
  title: string;
  content: string;
  author: string;
  authorUrl: string;
  score: number;
  source: string;
  createdAt: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

class TwitterService {
  private bearerToken: string;

  constructor() {
    this.bearerToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN || '';
  }

  isConfigured(): boolean {
    return !!this.bearerToken;
  }

  async searchTweets(query: string, maxResults: number = 10): Promise<TwitterSearchResult[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Twitter API not configured - Bearer token missing');
      console.log('💡 Add VITE_TWITTER_BEARER_TOKEN to .env.local to enable Twitter search');
      return [];
    }

    try {
      console.log(`🐦 Searching Twitter for: "${query}"`);

      // Twitter API v2 endpoint
      const searchQuery = encodeURIComponent(query);
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,profile_image_url`;

      console.log('🔗 Twitter API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Twitter API error:', response.status, errorText);
        
        // Check for common errors
        if (response.status === 401) {
          console.error('🔑 Twitter API authentication failed - check your bearer token');
        } else if (response.status === 403) {
          console.error('🚫 Twitter API access forbidden - your app may not have access to this endpoint');
        } else if (response.status === 429) {
          console.error('⏱️ Twitter API rate limit exceeded');
        }
        
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Twitter API response:', data);

      if (!data.data || data.data.length === 0) {
        console.log('📭 No tweets found for query:', query);
        console.log('💡 Try different keywords or check if tweets exist for this search');
        return [];
      }

      // Map users by ID for easy lookup
      const usersMap = new Map<string, TwitterUser>();
      if (data.includes?.users) {
        data.includes.users.forEach((user: TwitterUser) => {
          usersMap.set(user.id, user);
        });
      }

      // Transform Twitter data to our format
      const results: TwitterSearchResult[] = data.data.map((tweet: TwitterPost) => {
        const author = usersMap.get(tweet.author_id);
        const username = author?.username || 'unknown';
        const authorName = author?.name || username;

        return {
          postUrl: `https://twitter.com/${username}/status/${tweet.id}`,
          title: `Tweet by @${username}`,
          content: tweet.text,
          author: authorName,
          authorUrl: `https://twitter.com/${username}`,
          score: this.calculateRelevanceScore(tweet, query),
          source: 'twitter',
          createdAt: tweet.created_at,
          engagement: {
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
        };
      });

      console.log(`✅ Found ${results.length} tweets`);
      return results;

    } catch (error) {
      console.error('❌ Twitter search failed:', error);
      return [];
    }
  }

  private calculateRelevanceScore(tweet: TwitterPost, query: string): number {
    let score = 70; // Base score

    // Boost score based on engagement
    const metrics = tweet.public_metrics;
    if (metrics) {
      if (metrics.like_count > 10) score += 5;
      if (metrics.retweet_count > 5) score += 5;
      if (metrics.reply_count > 3) score += 5;
    }

    // Boost if query terms appear in tweet
    const queryTerms = query.toLowerCase().split(' ');
    const tweetText = tweet.text.toLowerCase();
    const matchingTerms = queryTerms.filter(term => tweetText.includes(term));
    score += (matchingTerms.length / queryTerms.length) * 15;

    return Math.min(100, Math.round(score));
  }
}

export const twitterService = new TwitterService();
