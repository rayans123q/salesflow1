import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';

interface DailyStats {
  date: string;
  total_visitors: number;
  unique_visitors: number;
  page_views: number;
}

interface DeviceStats {
  device_type: string;
  visitor_count: number;
  percentage: number;
}

interface TrafficSource {
  source: string;
  visitor_count: number;
  percentage: number;
}

interface RecentVisitor {
  session_id: string;
  first_seen: string;
  last_seen: string;
  page_views: number;
  device_type: string;
  browser: string;
  source: string;
  user_id: string | null;
}

const AdminAnalytics: React.FC = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<RecentVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [daily, devices, sources, visitors] = await Promise.all([
        analyticsService.getDailyStats(timeRange),
        analyticsService.getDeviceStats(timeRange),
        analyticsService.getTrafficSources(timeRange),
        analyticsService.getRecentVisitors(50),
      ]);

      setDailyStats(daily || []);
      setDeviceStats(devices || []);
      setTrafficSources(sources || []);
      setRecentVisitors(visitors || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('google')) return '🔍';
    if (s.includes('facebook')) return '👥';
    if (s.includes('twitter') || s.includes('x')) return '🐦';
    if (s.includes('linkedin')) return '💼';
    if (s.includes('reddit')) return '🤖';
    if (s === 'direct') return '🔗';
    return '🌐';
  };

  // Calculate totals
  const totalVisitors = dailyStats.reduce((sum, day) => sum + Number(day.total_visitors), 0);
  const totalPageViews = dailyStats.reduce((sum, day) => sum + Number(day.page_views), 0);
  const avgVisitorsPerDay = dailyStats.length > 0 ? Math.round(totalVisitors / dailyStats.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="text-[var(--text-secondary)] text-sm mb-2">Total Visitors</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{totalVisitors.toLocaleString()}</div>
          <div className="text-[var(--text-secondary)] text-xs mt-2">
            {avgVisitorsPerDay} avg/day
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="text-[var(--text-secondary)] text-sm mb-2">Page Views</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{totalPageViews.toLocaleString()}</div>
          <div className="text-[var(--text-secondary)] text-xs mt-2">
            {totalVisitors > 0 ? (totalPageViews / totalVisitors).toFixed(1) : 0} pages/visitor
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="text-[var(--text-secondary)] text-sm mb-2">Active Sessions</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{recentVisitors.length}</div>
          <div className="text-[var(--text-secondary)] text-xs mt-2">Recent visitors</div>
        </div>
      </div>

      {/* Visitor Trend Chart */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Visitor Trend</h3>
        <div className="space-y-2">
          {dailyStats.slice(0, 14).reverse().map((day, index) => {
            const maxVisitors = Math.max(...dailyStats.map(d => Number(d.total_visitors)));
            const width = maxVisitors > 0 ? (Number(day.total_visitors) / maxVisitors) * 100 : 0;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="text-xs text-[var(--text-secondary)] w-16">{formatDate(day.date)}</div>
                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-8 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-full rounded-full transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                    {Number(day.total_visitors)} visitors
                  </div>
                </div>
                <div className="text-xs text-[var(--text-secondary)] w-20 text-right">
                  {Number(day.page_views)} views
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device & Source Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Devices</h3>
          <div className="space-y-3">
            {deviceStats.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getDeviceIcon(device.device_type)}</span>
                  <span className="text-[var(--text-primary)] capitalize">{device.device_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[var(--text-secondary)] text-sm">{Number(device.visitor_count).toLocaleString()}</div>
                  <div className="bg-[var(--bg-tertiary)] px-2 py-1 rounded text-xs font-medium text-[var(--brand-primary)]">
                    {Number(device.percentage).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {trafficSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSourceIcon(source.source)}</span>
                  <span className="text-[var(--text-primary)]">{source.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[var(--text-secondary)] text-sm">{Number(source.visitor_count).toLocaleString()}</div>
                  <div className="bg-[var(--bg-tertiary)] px-2 py-1 rounded text-xs font-medium text-[var(--brand-primary)]">
                    {Number(source.percentage).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Visitors</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Browser</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Source</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Pages</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">User</th>
              </tr>
            </thead>
            <tbody>
              {recentVisitors.map((visitor, index) => (
                <tr key={index} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="py-3 px-4 text-sm text-[var(--text-primary)]">
                    {formatDateTime(visitor.first_seen)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="flex items-center gap-2">
                      {getDeviceIcon(visitor.device_type)}
                      <span className="text-[var(--text-primary)] capitalize">{visitor.device_type}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{visitor.browser}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="flex items-center gap-2">
                      {getSourceIcon(visitor.source)}
                      <span className="text-[var(--text-primary)]">{visitor.source}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{Number(visitor.page_views)}</td>
                  <td className="py-3 px-4 text-sm">
                    {visitor.user_id ? (
                      <span className="text-green-400">✓ Signed up</span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">Anonymous</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
