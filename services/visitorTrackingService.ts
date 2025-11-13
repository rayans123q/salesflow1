// Enhanced Visitor Tracking Service
// Production-ready visitor analytics for admin dashboard

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

interface TrackingStatus {
  isEnabled: boolean;
  sessionId: string;
  totalTracked: number;
  lastError?: string;
}

class VisitorTrackingService {
  private sessionId: string;
  private isEnabled: boolean = true;
  private trackingCount: number = 0;
  private lastError?: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.trackingCount = parseInt(sessionStorage.getItem('salesflow_tracking_count') || '0');
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
   * Track a page visit (production version)
   */
  async trackPageVisit(userId?: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
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

      this.trackingCount++;
      sessionStorage.setItem('salesflow_tracking_count', this.trackingCount.toString());
      this.lastError = undefined;
      
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Visitor tracking failed:', this.lastError);
      
      // Disable tracking if database table doesn't exist
      if (this.lastError.includes('relation "visitor_analytics" does not exist')) {
        this.isEnabled = false;
        console.warn('🚨 Visitor tracking disabled: Database table not found. Run the SQL migration first.');
      }
      
      return false;
    }
  }

  /**
   * Update visitor with user ID when user logs in
   */
  async updateVisitorWithUserId(userId: string): Promise<boolean> {
    return await this.trackPageVisit(userId);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get tracking status for admin dashboard
   */
  getTrackingStatus(): TrackingStatus {
    return {
      isEnabled: this.isEnabled,
      sessionId: this.sessionId,
      totalTracked: this.trackingCount,
      lastError: this.lastError
    };
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Reset tracking for new session
   */
  resetSession(): void {
    sessionStorage.removeItem('salesflow_visitor_session');
    sessionStorage.removeItem('salesflow_tracking_count');
    this.sessionId = this.getOrCreateSessionId();
    this.trackingCount = 0;
    this.lastError = undefined;
  }

  /**
   * Test tracking functionality
   */
  async testTracking(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.trackPageVisit();
      return {
        success: result,
        message: result ? 'Tracking is working correctly' : 'Tracking failed - check console for errors'
      };
    } catch (error) {
      return {
        success: false,
        message: `Tracking test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const visitorTrackingService = new VisitorTrackingService();

// Expose to window for testing (development only)
if (typeof window !== 'undefined') {
  (window as any).visitorTrackingService = visitorTrackingService;
  (window as any).testVisitorTracking = () => {
    console.log('🧪 Testing visitor tracking...');
    return visitorTrackingService.testTracking();
  };
}
