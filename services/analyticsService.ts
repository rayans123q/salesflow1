import { supabase } from './supabaseClient';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Detect browser
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

// Detect OS
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

// Get UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
};

export interface AnalyticsEvent {
  event_type: 'page_view' | 'signup' | 'login' | 'campaign_created' | 'subscription_started';
  user_id?: string;
  page_path?: string;
  referrer?: string;
}

class AnalyticsService {
  private sessionId: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = getSessionId();
  }

  // Initialize analytics (call once on app load)
  async initialize(userId?: string) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Track initial page view
    await this.trackPageView(userId);
  }

  // Track page view
  async trackPageView(userId?: string) {
    try {
      const utmParams = getUTMParams();
      
      await supabase.from('analytics_events').insert({
        event_type: 'page_view',
        user_id: userId || null,
        session_id: this.sessionId,
        page_path: window.location.pathname,
        referrer: document.referrer || null,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug('Analytics tracking failed:', error);
    }
  }

  // Track custom event
  async trackEvent(event: AnalyticsEvent) {
    try {
      const utmParams = getUTMParams();
      
      await supabase.from('analytics_events').insert({
        event_type: event.event_type,
        user_id: event.user_id || null,
        session_id: this.sessionId,
        page_path: event.page_path || window.location.pathname,
        referrer: event.referrer || document.referrer || null,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
      });
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }

  // Admin functions to retrieve analytics data
  async getDailyStats(daysBack: number = 30) {
    const { data, error } = await supabase.rpc('get_daily_visitor_stats', { days_back: daysBack });
    if (error) throw error;
    return data;
  }

  async getDeviceStats(daysBack: number = 30) {
    const { data, error } = await supabase.rpc('get_device_stats', { days_back: daysBack });
    if (error) throw error;
    return data;
  }

  async getTrafficSources(daysBack: number = 30) {
    const { data, error } = await supabase.rpc('get_traffic_sources', { days_back: daysBack });
    if (error) throw error;
    return data;
  }

  async getRecentVisitors(limit: number = 100) {
    const { data, error } = await supabase.rpc('get_recent_visitors', { limit_count: limit });
    if (error) throw error;
    return data;
  }
}

export const analyticsService = new AnalyticsService();
