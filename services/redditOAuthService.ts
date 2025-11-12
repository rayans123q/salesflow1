// Reddit OAuth Service
// Handles authentication and API requests using Reddit OAuth2

interface RedditOAuthCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface RedditAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  expiresAt: number; // Timestamp when token expires
}

class RedditOAuthService {
  private accessToken: RedditAccessToken | null = null;
  private credentials: RedditOAuthCredentials | null = null;

  // Initialize with credentials from environment variables
  constructor() {
    const clientId = (import.meta as any).env?.VITE_COMPANY_REDDIT_CLIENT_ID;
    const clientSecret = (import.meta as any).env?.VITE_COMPANY_REDDIT_CLIENT_SECRET;
    const username = (import.meta as any).env?.VITE_COMPANY_REDDIT_USERNAME;
    const password = (import.meta as any).env?.VITE_COMPANY_REDDIT_PASSWORD;

    if (clientId && clientSecret && username && password) {
      this.credentials = { clientId, clientSecret, username, password };
      console.log('🔑 Reddit OAuth credentials loaded');
    } else {
      console.warn('⚠️ Reddit OAuth credentials not found in environment variables');
    }
  }

  // Get OAuth access token
  private async getAccessToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('Reddit OAuth credentials not configured');
    }

    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
      return this.accessToken.access_token;
    }

    console.log('🔄 Fetching new Reddit OAuth token...');

    try {
      // Use Netlify function proxy to avoid CORS
      const proxyUrl = '/.netlify/functions/reddit-oauth';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getToken',
          clientId: this.credentials.clientId,
          clientSecret: this.credentials.clientSecret,
          username: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Reddit OAuth error:', errorData);
        throw new Error(`Reddit OAuth failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      // Store token with expiration time
      this.accessToken = {
        ...data,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Subtract 1 minute for safety
      };

      console.log('✅ Reddit OAuth token obtained successfully');
      return this.accessToken.access_token;
    } catch (error) {
      console.error('❌ Failed to get Reddit OAuth token:', error);
      throw error;
    }
  }

  // Search Reddit using OAuth
  async searchReddit(params: {
    query: string;
    subreddit?: string;
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
  }): Promise<any[]> {
    if (!this.credentials) {
      throw new Error('Reddit OAuth not configured');
    }

    const token = await this.getAccessToken();
    
    // Build search URL
    const searchParams = new URLSearchParams({
      q: params.query,
      sort: params.sort || 'new',
      t: params.time || 'week',
      limit: (params.limit || 25).toString(),
      raw_json: '1',
    });

    if (params.subreddit) {
      searchParams.set('restrict_sr', 'true');
    }

    const baseUrl = params.subreddit
      ? `https://oauth.reddit.com/r/${params.subreddit}/search`
      : 'https://oauth.reddit.com/search';

    const url = `${baseUrl}?${searchParams.toString()}`;

    console.log(`🔍 Searching Reddit OAuth: ${url}`);

    try {
      // Use Netlify function proxy for API requests
      const proxyUrl = '/.netlify/functions/reddit-oauth';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apiRequest',
          token: token,
          url: url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Reddit API error:', errorData);
        
        // If token expired, clear it and retry once
        if (response.status === 401) {
          console.log('🔄 Token expired, retrying...');
          this.accessToken = null;
          return this.searchReddit(params);
        }
        
        throw new Error(`Reddit API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.children) {
        console.warn('⚠️ No results found');
        return [];
      }

      const posts = data.data.children.map((child: any) => ({
        title: child.data.title,
        content: child.data.selftext || '',
        postUrl: `https://www.reddit.com${child.data.permalink}`,
        subreddit: child.data.subreddit_name_prefixed,
        author: child.data.author,
        score: child.data.score,
        num_comments: child.data.num_comments,
        created_utc: child.data.created_utc,
      }));

      console.log(`✅ Found ${posts.length} posts via OAuth`);
      return posts;
    } catch (error) {
      console.error('❌ Reddit OAuth search failed:', error);
      throw error;
    }
  }

  // Get user info (to verify authentication)
  async getUserInfo(): Promise<any> {
    if (!this.credentials) {
      throw new Error('Reddit OAuth not configured');
    }

    const token = await this.getAccessToken();

    try {
      const proxyUrl = '/.netlify/functions/reddit-oauth';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apiRequest',
          token: token,
          url: 'https://oauth.reddit.com/api/v1/me',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Reddit user authenticated:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Failed to get Reddit user info:', error);
      throw error;
    }
  }

  // Check if OAuth is configured
  isConfigured(): boolean {
    return this.credentials !== null;
  }
}

// Export singleton instance
export const redditOAuthService = new RedditOAuthService();
