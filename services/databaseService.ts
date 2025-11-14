import { supabase } from './supabaseClient';
import { User, Campaign, Post, AIStyleSettings, RedditCredentials, Theme, Subscription } from '../types';

// User Operations
export const databaseService = {
  // User operations
  async createUser(name: string): Promise<User & { id: string }> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id, name: data.name };
  },

  async getUser(userId: string): Promise<(User & { id: string }) | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return { id: data.id, name: data.name };
  },

  async findUserByName(name: string): Promise<(User & { id: string }) | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return { id: data.id, name: data.name };
  },

  async createOrGetUser(name: string): Promise<User & { id: string }> {
    // Try to find existing user
    const existing = await this.findUserByName(name);
    if (existing) return existing;
    
    // Create new user if not found
    return await this.createUser(name);
  },

  async updateUserName(userId: string, name: string): Promise<User & { id: string }> {
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id, name: data.name };
  },

  // Admin operations
  async getAllUsers(): Promise<(User & { id: string; email?: string; role?: string })[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email || undefined,
      role: u.role || undefined,
    }));
  },

  async getUserWithSubscription(userId: string): Promise<any> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      subscription: settings ? {
        plan: settings.subscription_plan || 'free',
        status: settings.subscription_status || 'inactive',
        subscribed: settings.reddit_api_subscribed || false,
        startedAt: settings.subscription_started_at,
        expiresAt: settings.subscription_expires_at,
      } : { plan: 'free', status: 'inactive', subscribed: false },
      campaignCount: campaigns?.length || 0,
    };
  },

  async updateUserSubscription(userId: string, plan: string, status: string): Promise<void> {
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    const updateData = {
      subscription_plan: plan,
      subscription_status: status,
      reddit_api_subscribed: status === 'active',
      subscription_started_at: status === 'active' ? new Date().toISOString() : null,
    };

    if (existing) {
      const { error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...updateData }]);
      if (error) throw error;
    }
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Campaign operations
  async getCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      leadsFound: c.leads_found,
      highPotential: c.high_potential,
      contacted: c.contacted,
      description: c.description,
      keywords: c.keywords,
      negativeKeywords: c.negative_keywords || undefined,
      subreddits: c.subreddits || undefined,
      websiteUrl: c.website_url || undefined,
      dateRange: c.date_range,
      createdAt: c.created_at,
      lastRefreshed: c.last_refreshed,
      leadSources: c.lead_sources,
    }));
  },

  async createCampaign(userId: string, campaign: Omit<Campaign, 'id' | 'createdAt' | 'lastRefreshed'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        user_id: userId,
        name: campaign.name,
        status: campaign.status,
        leads_found: campaign.leadsFound,
        high_potential: campaign.highPotential,
        contacted: campaign.contacted,
        description: campaign.description,
        keywords: campaign.keywords,
        negative_keywords: campaign.negativeKeywords || null,
        subreddits: campaign.subreddits || null,
        website_url: campaign.websiteUrl || null,
        date_range: campaign.dateRange,
        lead_sources: campaign.leadSources,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      leadsFound: data.leads_found,
      highPotential: data.high_potential,
      contacted: data.contacted,
      description: data.description,
      keywords: data.keywords,
      negativeKeywords: data.negative_keywords || undefined,
      subreddits: data.subreddits || undefined,
      websiteUrl: data.website_url || undefined,
      dateRange: data.date_range,
      createdAt: data.created_at,
      lastRefreshed: data.last_refreshed,
      leadSources: data.lead_sources,
    };
  },

  async updateCampaign(campaignId: number, updates: Partial<Campaign>): Promise<Campaign> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.leadsFound !== undefined) updateData.leads_found = updates.leadsFound;
    if (updates.highPotential !== undefined) updateData.high_potential = updates.highPotential;
    if (updates.contacted !== undefined) updateData.contacted = updates.contacted;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
    if (updates.negativeKeywords !== undefined) updateData.negative_keywords = updates.negativeKeywords || null;
    if (updates.subreddits !== undefined) updateData.subreddits = updates.subreddits || null;
    if (updates.websiteUrl !== undefined) updateData.website_url = updates.websiteUrl || null;
    if (updates.dateRange !== undefined) updateData.date_range = updates.dateRange;
    if (updates.lastRefreshed !== undefined) updateData.last_refreshed = updates.lastRefreshed;
    if (updates.leadSources !== undefined) updateData.lead_sources = updates.leadSources;
    
    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      leadsFound: data.leads_found,
      highPotential: data.high_potential,
      contacted: data.contacted,
      description: data.description,
      keywords: data.keywords,
      negativeKeywords: data.negative_keywords || undefined,
      subreddits: data.subreddits || undefined,
      websiteUrl: data.website_url || undefined,
      dateRange: data.date_range,
      createdAt: data.created_at,
      lastRefreshed: data.last_refreshed,
      leadSources: data.lead_sources,
    };
  },

  async deleteCampaign(campaignId: number): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
    
    if (error) throw error;
  },

  // Post operations
  async getPosts(userId: string, campaignId?: number): Promise<Post[]> {
    // First get campaign IDs for this user
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);
    
    if (!campaigns || campaigns.length === 0) return [];
    
    const campaignIds = campaigns.map(c => c.id);
    
    let query = supabase
      .from('posts')
      .select('*')
      .in('campaign_id', campaignIds);
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      campaignId: p.campaign_id,
      url: p.url,
      source: p.source,
      sourceName: p.source_name,
      title: p.title,
      content: p.content,
      relevance: p.relevance,
      status: p.status,
    }));
  },

  async createPosts(posts: Omit<Post, 'id'>[]): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .insert(posts.map(p => ({
        campaign_id: p.campaignId,
        url: p.url,
        source: p.source,
        source_name: p.sourceName,
        title: p.title,
        content: p.content,
        relevance: p.relevance,
        status: p.status,
      })))
      .select();
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      campaignId: p.campaign_id,
      url: p.url,
      source: p.source,
      sourceName: p.source_name,
      title: p.title,
      content: p.content,
      relevance: p.relevance,
      status: p.status,
    }));
  },

  async updatePost(postId: number, updates: Partial<Post>): Promise<Post> {
    const updateData: any = {};
    
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.sourceName !== undefined) updateData.source_name = updates.sourceName;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.relevance !== undefined) updateData.relevance = updates.relevance;
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      campaignId: data.campaign_id,
      url: data.url,
      source: data.source,
      sourceName: data.source_name,
      title: data.title,
      content: data.content,
      relevance: data.relevance,
      status: data.status,
    };
  },

  async deletePostsByCampaign(campaignId: number): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('campaign_id', campaignId);
    
    if (error) throw error;
  },

  // Comment history operations
  async getCommentHistory(userId: string, postId?: number): Promise<Record<number, string[]>> {
    // First get post IDs for this user's campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);
    
    if (!campaigns || campaigns.length === 0) return {};
    
    const campaignIds = campaigns.map(c => c.id);
    
    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .in('campaign_id', campaignIds);
    
    if (!posts || posts.length === 0) return {};
    
    const postIds = posts.map(p => p.id);
    
    let query = supabase
      .from('comment_history')
      .select('*')
      .in('post_id', postIds);
    
    if (postId) {
      query = query.eq('post_id', postId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const history: Record<number, string[]> = {};
    data.forEach(ch => {
      if (!history[ch.post_id]) {
        history[ch.post_id] = [];
      }
      history[ch.post_id].push(ch.comment);
    });
    
    return history;
  },

  async addCommentToHistory(postId: number, comment: string): Promise<void> {
    // Check if comment already exists for this post
    const { data: existing } = await supabase
      .from('comment_history')
      .select('id')
      .eq('post_id', postId)
      .eq('comment', comment)
      .single();
    
    if (existing) return; // Comment already exists
    
    const { error } = await supabase
      .from('comment_history')
      .insert([{ post_id: postId, comment }]);
    
    if (error) throw error;
  },

  async deleteCommentHistoryByPost(postId: number): Promise<void> {
    const { error } = await supabase
      .from('comment_history')
      .delete()
      .eq('post_id', postId);
    
    if (error) throw error;
  },

  // User settings operations
  async getUserSettings(userId: string): Promise<{
    theme: Theme;
    aiStyle: Omit<AIStyleSettings, 'saveStyle'>;
    redditCreds: RedditCredentials | null;
    subscription: { subscribed: boolean; status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing'; startedAt?: string; expiresAt?: string };
    usage: { campaigns: number; refreshes: number; aiResponses: number };
  }> {
    // First, check and reset usage if needed (monthly reset)
    await this.checkAndResetMonthlyUsage(userId);
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return {
          theme: 'dark',
          aiStyle: {
            tone: 'Friendly & Warm',
            salesApproach: 'Moderate',
            length: 'Medium',
            customOffer: '',
            includeWebsiteLink: true,
          },
          redditCreds: null,
          subscription: { subscribed: false, status: 'inactive' },
          usage: { campaigns: 0, refreshes: 0, aiResponses: 0 },
        };
      }
      throw error;
    }
    
    return {
      theme: data.theme,
      aiStyle: {
        tone: data.ai_tone,
        salesApproach: data.ai_sales_approach,
        length: data.ai_length,
        customOffer: data.ai_custom_offer,
        includeWebsiteLink: data.ai_include_website_link,
      },
      redditCreds: data.reddit_client_id ? {
        clientId: data.reddit_client_id,
        clientSecret: data.reddit_client_secret || undefined,
      } : null,
      subscription: {
        subscribed: data.reddit_api_subscribed || false,
        status: (data.subscription_status || 'inactive') as 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing',
        startedAt: data.subscription_started_at || undefined,
        expiresAt: data.subscription_expires_at || undefined,
      },
      usage: {
        campaigns: data.usage_campaigns || 0,
        refreshes: data.usage_refreshes || 0,
        aiResponses: data.usage_ai_responses || 0,
      },
    };
  },

  // Check and reset monthly usage if 30 days have passed
  async checkAndResetMonthlyUsage(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('check_and_reset_user_usage', { p_user_id: userId });
      
      if (error) {
        console.warn('⚠️ Could not check monthly usage reset:', error);
        return;
      }
      
      if (data && data.length > 0 && data[0].was_reset) {
        console.log('🔄 Monthly usage limits have been reset for user');
      }
    } catch (error) {
      console.warn('⚠️ Error checking monthly usage:', error);
    }
  },

  async updateUserSettings(
    userId: string,
    updates: {
      theme?: Theme;
      aiStyle?: Partial<Omit<AIStyleSettings, 'saveStyle'>>;
      redditCreds?: RedditCredentials | null;
      subscription?: Partial<{ subscribed: boolean; status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing'; startedAt?: string; expiresAt?: string }>;
      usage?: Partial<{ campaigns: number; refreshes: number; aiResponses: number }>;
    }
  ): Promise<void> {
    const updateData: any = {};
    
    if (updates.theme !== undefined) updateData.theme = updates.theme;
    if (updates.aiStyle?.tone !== undefined) updateData.ai_tone = updates.aiStyle.tone;
    if (updates.aiStyle?.salesApproach !== undefined) updateData.ai_sales_approach = updates.aiStyle.salesApproach;
    if (updates.aiStyle?.length !== undefined) updateData.ai_length = updates.aiStyle.length;
    if (updates.aiStyle?.customOffer !== undefined) updateData.ai_custom_offer = updates.aiStyle.customOffer;
    if (updates.aiStyle?.includeWebsiteLink !== undefined) updateData.ai_include_website_link = updates.aiStyle.includeWebsiteLink;
    
    if (updates.redditCreds !== undefined) {
      if (updates.redditCreds) {
        updateData.reddit_client_id = updates.redditCreds.clientId;
        updateData.reddit_client_secret = updates.redditCreds.clientSecret || null;
      } else {
        updateData.reddit_client_id = null;
        updateData.reddit_client_secret = null;
      }
    }
    
    if (updates.subscription !== undefined) {
      if (updates.subscription.subscribed !== undefined) updateData.reddit_api_subscribed = updates.subscription.subscribed;
      if (updates.subscription.status !== undefined) updateData.subscription_status = updates.subscription.status;
      if (updates.subscription.startedAt !== undefined) updateData.subscription_started_at = updates.subscription.startedAt || null;
      if (updates.subscription.expiresAt !== undefined) updateData.subscription_expires_at = updates.subscription.expiresAt || null;
    }
    
    if (updates.usage) {
      if (updates.usage.campaigns !== undefined) updateData.usage_campaigns = updates.usage.campaigns;
      if (updates.usage.refreshes !== undefined) updateData.usage_refreshes = updates.usage.refreshes;
      if (updates.usage.aiResponses !== undefined) updateData.usage_ai_responses = updates.usage.aiResponses;
    }
    
    // Try to update first
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Create new settings
      const { error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...updateData }]);
      
      if (error) throw error;
    }
  },

  // ============================================================================
  // ADMIN PANEL OPERATIONS
  // ============================================================================

  // Admin statistics
  async getAdminStats() {
    const { data, error } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (error) throw error;
    
    return {
      totalUsers: data.total_users || 0,
      newUsersToday: data.new_users_today || 0,
      activeSubscriptions: data.active_subscriptions || 0,
      totalVisitors: data.total_visitors || 0,
      visitorsToday: data.visitors_today || 0,
      totalPosts: data.total_posts || 0,

    };
  },

  // User management with details
  async getAllUsersWithDetails() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        campaigns:campaigns(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
      isVerified: user.is_verified || false,
      totalPosts: user.total_posts || 0,
      subscriptionStatus: user.subscription_status || 'inactive',
      subscriptionPlan: user.subscription_plan || 'free',
      campaignCount: user.campaigns?.[0]?.count || 0,
      role: user.role || 'user',
    }));
  },

  // Verify user
  async verifyUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', userId);

    if (error) throw error;
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Update user subscription (admin version)
  async updateUserSubscriptionAdmin(userId: string, plan: string, status: string): Promise<void> {
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        subscription_plan: plan,
        subscription_status: status 
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Also update user_settings if exists
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    const updateData = {
      subscription_plan: plan,
      subscription_status: status,
      reddit_api_subscribed: status === 'active',
      subscription_started_at: status === 'active' ? new Date().toISOString() : null,
    };

    if (existing) {
      const { error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...updateData }]);
      if (error) throw error;
    }
  },

  // Admin activity logging
  async logAdminAction(
    adminUserId: string, 
    actionType: string, 
    targetUserId?: string, 
    actionDetails?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: adminUserId,
        action_type: actionType,
        target_user_id: targetUserId,
        action_details: actionDetails || {},
      });

    if (error) throw error;
  },

  // Get admin logs
  async getAdminLogs() {
    const { data, error } = await supabase
      .from('admin_logs')
      .select(`
        *,
        admin_user:users!admin_logs_admin_user_id_fkey(name),
        target_user:users!admin_logs_target_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    return (data || []).map(log => ({
      id: log.id,
      adminUserId: log.admin_user_id,
      actionType: log.action_type,
      targetUserId: log.target_user_id,
      actionDetails: log.action_details,
      createdAt: log.created_at,
      adminName: log.admin_user?.name,
      targetUserName: log.target_user?.name,
    }));
  },

  // Get admin notifications
  async getAdminNotifications() {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return (data || []).map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at,
    }));
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Track visitor
  async trackVisitor(visitorData: {
    visitorIp?: string;
    userAgent?: string;
    pageUrl: string;
    referrer?: string;
    sessionId: string;
    userId?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('visitor_analytics')
      .insert({
        visitor_ip: visitorData.visitorIp,
        user_agent: visitorData.userAgent,
        page_url: visitorData.pageUrl,
        referrer: visitorData.referrer,
        session_id: visitorData.sessionId,
        user_id: visitorData.userId,
        device_type: visitorData.deviceType,
        browser: visitorData.browser,
        os: visitorData.os,
      });

    if (error) throw error;
  },
};

