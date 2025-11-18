// Keyword Alerts Service
// Manages real-time keyword monitoring and alerts

import { supabase } from './supabaseClient';
import { KeywordAlert, KeywordAlertMatch, KeywordAlertStats } from '../types';

class KeywordAlertsService {
  // Create a new keyword alert
  async createAlert(alertData: Omit<KeywordAlert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<KeywordAlert> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('create_keyword_alert', {
        p_user_id: user.user.id,
        p_name: alertData.name,
        p_keywords: alertData.keywords,
        p_negative_keywords: alertData.negativeKeywords || null,
        p_subreddits: alertData.subreddits || null
      });

    if (error) throw error;

    // Fetch the created alert
    return this.getAlert(data);
  }

  // Get all alerts for the current user
  async getAlerts(): Promise<KeywordAlert[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('keyword_alerts')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapAlertFromDb);
  }

  // Get a specific alert
  async getAlert(alertId: string): Promise<KeywordAlert> {
    const { data, error } = await supabase
      .from('keyword_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (error) throw error;
    return this.mapAlertFromDb(data);
  }

  // Update an alert
  async updateAlert(alertId: string, updates: Partial<KeywordAlert>): Promise<KeywordAlert> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
    if (updates.negativeKeywords !== undefined) updateData.negative_keywords = updates.negativeKeywords;
    if (updates.subreddits !== undefined) updateData.subreddits = updates.subreddits;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.notificationEmail !== undefined) updateData.notification_email = updates.notificationEmail;
    if (updates.notificationPush !== undefined) updateData.notification_push = updates.notificationPush;
    if (updates.alertFrequency !== undefined) updateData.alert_frequency = updates.alertFrequency;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('keyword_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return this.mapAlertFromDb(data);
  }

  // Delete an alert
  async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('keyword_alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;
  }

  // Get matches for an alert
  async getAlertMatches(alertId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('keyword_alert_matches')
      .select(`
        *,
        posts (
          id,
          title,
          content,
          url,
          source_name,
          created_at
        )
      `)
      .eq('alert_id', alertId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(match => ({
      id: match.id,
      alertId: match.alert_id,
      postId: match.post_id,
      matchedKeywords: match.matched_keywords,
      relevanceScore: parseFloat(match.relevance_score),
      notificationSent: match.notification_sent,
      createdAt: match.created_at,
      post: match.posts
    }));
  }

  // Get alert statistics
  async getAlertStats(alertId: string): Promise<KeywordAlertStats | null> {
    const { data, error } = await supabase
      .from('keyword_alert_stats')
      .select('*')
      .eq('alert_id', alertId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      alertId: data.alert_id,
      totalMatches: data.total_matches,
      matchesToday: data.matches_today,
      matchesThisWeek: data.matches_this_week,
      matchesThisMonth: data.matches_this_month,
      lastMatchAt: data.last_match_at,
      updatedAt: data.updated_at
    };
  }

  // Get all alerts with their stats
  async getAlertsWithStats(): Promise<Array<KeywordAlert & { stats?: KeywordAlertStats }>> {
    const alerts = await this.getAlerts();
    
    const alertsWithStats = await Promise.all(
      alerts.map(async (alert) => {
        const stats = await this.getAlertStats(alert.id);
        return { ...alert, stats };
      })
    );

    return alertsWithStats;
  }

  // Map database record to KeywordAlert type
  private mapAlertFromDb(data: any): KeywordAlert {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      keywords: data.keywords,
      negativeKeywords: data.negative_keywords || undefined,
      subreddits: data.subreddits || undefined,
      isActive: data.is_active,
      notificationEmail: data.notification_email,
      notificationPush: data.notification_push,
      alertFrequency: data.alert_frequency,
      lastTriggered: data.last_triggered,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const keywordAlertsService = new KeywordAlertsService();
