// Visitor Tracking Service
// Automatically tracks website visitors for admin analytics

import { databaseService } from './databaseService';

interface VisitorInfo {
  sessionId: string;
  pageUrl: string;
  referrer?: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  userId?: string;
}

class VisitorTrackingService {
  private sessionId: string;
  private hasTrackedThisSession: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for this visitor
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('salesflow_visitor_session');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('salesflow_visitor_session', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           '_' + Date.now();
  }

  /**
   * Detect device type from user agent
   */
  private getDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
    const ua = userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\\sce|palm|smartphone|iemobile/.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Extract browser name from user agent
   */
  private getBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
    
    return 'Unknown';
  }

  /**
   * Extract OS name from user agent
   */
  private getOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    
    return 'Unknown';
  }

  /**
   * Track a page visit
   */
  async trackPageVisit(userId?: string): Promise<void> {
    try {
      // Only track once per session to avoid spam
      if (this.hasTrackedThisSession) {
        return;
      }

      const visitorInfo: VisitorInfo = {
        sessionId: this.sessionId,
        pageUrl: window.location.href,
        referrer: document.referrer || undefined,
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(navigator.userAgent),
        browser: this.getBrowser(navigator.userAgent),
        os: this.getOS(navigator.userAgent),
        userId: userId,
      };

      await databaseService.trackVisitor({
        sessionId: visitorInfo.sessionId,
        pageUrl: visitorInfo.pageUrl,
        referrer: visitorInfo.referrer,
        userAgent: visitorInfo.userAgent,
        deviceType: visitorInfo.deviceType,
        browser: visitorInfo.browser,
        os: visitorInfo.os,
        userId: visitorInfo.userId,
      });

      this.hasTrackedThisSession = true;
      
      console.log('✅ Visitor tracked:', {
        sessionId: this.sessionId,
        deviceType: visitorInfo.deviceType,
        browser: visitorInfo.browser,
        userId: userId || 'anonymous'
      });
    } catch (error) {
      console.error('❌ Failed to track visitor:', error);
      // Don't throw error to avoid breaking the app
    }
  }

  /**
   * Update visitor with user ID when user logs in
   */
  async updateVisitorWithUserId(userId: string): Promise<void> {
    try {
      // Track again with user ID if we haven't tracked yet
      if (!this.hasTrackedThisSession) {
        await this.trackPageVisit(userId);
      }
    } catch (error) {
      console.error('❌ Failed to update visitor with user ID:', error);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset tracking for new session (useful for testing)
   */
  resetSession(): void {
    sessionStorage.removeItem('salesflow_visitor_session');
    this.sessionId = this.getOrCreateSessionId();
    this.hasTrackedThisSession = false;
  }
}

// Export singleton instance
export const visitorTrackingService = new VisitorTrackingService();
