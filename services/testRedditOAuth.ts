// Test utility for Reddit OAuth
import { redditOAuthService } from './redditOAuthService';

export const testRedditOAuth = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    if (!redditOAuthService.isConfigured()) {
      return {
        success: false,
        message: '❌ Reddit OAuth not configured. Please add credentials to .env.local',
      };
    }

    console.log('🧪 Testing Reddit OAuth...');

    // Test 1: Get user info
    const userInfo = await redditOAuthService.getUserInfo();
    console.log('✅ User authenticated:', userInfo.name);

    // Test 2: Search for posts
    const posts = await redditOAuthService.searchReddit({
      query: 'javascript',
      subreddit: 'reactjs',
      sort: 'new',
      time: 'week',
      limit: 5,
    });

    console.log(`✅ Found ${posts.length} posts`);

    return {
      success: true,
      message: `✅ Reddit OAuth working! Authenticated as u/${userInfo.name}. Found ${posts.length} test posts.`,
      data: {
        username: userInfo.name,
        karma: userInfo.total_karma,
        postsFound: posts.length,
      },
    };
  } catch (error) {
    console.error('❌ Reddit OAuth test failed:', error);
    return {
      success: false,
      message: `❌ OAuth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
