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
    let username = (import.meta as any).env?.VITE_COMPANY_REDDIT_USERNAME;
    const password = (import.meta as any).env?.VITE_COMPANY_REDDIT_PASSWORD;

    // Remove u/ prefix from username if present
    if (username && username.startsWith('u/')) {
      username = username.substring(2);
      console.log('🔧 Removed u/ prefix from Reddit username');
    }

    if (clientId && clientSecret && username && password) {
      this.credentials = { clientId, clientSecret, username, password };
      console.log('🔑 Reddit OAuth credentials loaded successfully');
      console.log('   Client ID:', clientId?.substring(0, 8) + '...');
      console.log('   Username:', username);
    } else {
      console.warn('⚠️ Reddit OAuth credentials not found in environment variables');
      console.warn('   Missing:', {
        clientId: !clientId,
        clientSecret: !clientSecret,
        username: !username,
        password: !password
      });
    }
  }

  // Get OAuth access token
  private async getAccessToken(): Promise<string> {
    if (!this.credentials) {
      console.error('❌ Reddit OAuth credentials not configured');
      throw new Error('Reddit OAuth credentials not configured - check environment variables');
    }

    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
      console.log('✅ Using cached Reddit OAuth token');
      return this.accessToken.access_token;
    }

    console.log('🔄 Fetching new Reddit OAuth token...');

    try {
      // Use Netlify function proxy to avoid CORS
      const proxyUrl = '/.netlify/functions/reddit-oauth';
      
      const requestBody = {
        action: 'getToken',
        clientId: this.credentials.clientId,
        clientSecret: this.credentials.clientSecret,
        username: this.credentials.username,
        password: this.credentials.password,
      };
      
      console.log('📤 Requesting OAuth token from Netlify function');
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() };
        }
        console.error('❌ Reddit OAuth error:', response.status, errorData);
        throw new Error(`Reddit OAuth failed (${response.status}): ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        console.error('❌ No access token in response:', data);
        throw new Error('Reddit OAuth response missing access_token');
      }
      
      // Store token with expiration time
      this.accessToken = {
        ...data,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Subtract 1 minute for safety
      };

      console.log('✅ Reddit OAuth token obtained successfully, expires in', data.expires_in, 'seconds');
      return this.accessToken.access_token;
    } catch (error) {
      console.error('❌ Failed to get Reddit OAuth token:', error);
      // Clear credentials so we don't keep trying
      this.accessToken = null;
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

    let token: string;
    try {
      token = await this.getAccessToken();
    } catch (error) {
      console.error('❌ Failed to get OAuth token:', error);
      throw new Error(`Failed to get Reddit OAuth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (!token || token.trim() === '') {
      console.error('❌ OAuth token is empty or invalid');
      throw new Error('Reddit OAuth token is empty');
    }
    
    console.log(`✅ OAuth token obtained, length: ${token.length}`)
    
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
    console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}, Length: ${token?.length || 0}`);

    try {
      // Use Netlify function proxy for API requests
      const proxyUrl = '/.netlify/functions/reddit-oauth';
      
      // Double-check token before sending
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('❌ Token validation failed before sending:', { token, type: typeof token });
        throw new Error('Invalid token before API request');
      }
      
      const requestBody = {
        action: 'apiRequest',
        token: token,
        url: url,
      };
      
      console.log('📤 Sending API request to Netlify function:', { 
        action: requestBody.action, 
        hasToken: !!requestBody.token, 
        tokenLength: requestBody.token?.length,
        tokenPreview: requestBody.token?.substring(0, 10) + '...',
        url: requestBody.url 
      });
      
      const requestBodyString = JSON.stringify(requestBody);
      console.log('📦 Request body size:', requestBodyString.length, 'bytes');
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBodyString,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() };
        }
        console.error('❌ Reddit API error:', response.status, errorData);
        
        // If token expired, clear it and retry once
        if (response.status === 401) {
          console.log('🔄 Token expired, clearing cache and retrying...');
          this.accessToken = null;
          return this.searchReddit(params);
        }
        
        throw new Error(`Reddit API error (${response.status}): ${errorData.error || response.statusText}`);
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
