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
    try {
      console.log(`🐦 Searching Twitter via Netlify Function for: "${query}"`);

      // Call Netlify Function instead of Twitter API directly (bypasses CORS)
      const response = await fetch('/.netlify/functions/twitter-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: query.split(' OR ').map(k => k.trim()),
          maxResults
        })
      });

      if (!response.ok) {
        console.error('❌ Netlify function error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('📊 Twitter search response:', data);

      if (!data.tweets || data.tweets.length === 0) {
        console.log('📭 No tweets found for query:', query);
        return [];
      }

      // Transform Netlify function response to our format
      const results: TwitterSearchResult[] = data.tweets.map((tweet: any) => ({
        postUrl: tweet.postUrl,
        title: tweet.title,
        content: tweet.content,
        author: tweet.author,
        authorUrl: tweet.authorUrl,
        score: this.calculateEngagementScore(tweet.engagement),
        source: 'twitter',
        createdAt: tweet.createdAt,
        engagement: tweet.engagement,
      }));

      console.log(`✅ Found ${results.length} tweets`);
      return results;

    } catch (error) {
      console.error('❌ Twitter search failed:', error);
      return [];
    }
  }

  private calculateEngagementScore(engagement: any): number {
    let score = 70; // Base score

    // Boost score based on engagement
    if (engagement) {
      if (engagement.likes > 10) score += 5;
      if (engagement.retweets > 5) score += 5;
      if (engagement.replies > 3) score += 5;
    }

    return Math.min(100, Math.round(score));
  }
}

export const twitterService = new TwitterService();
