import React from 'react';
import { Campaign } from '../types';

interface AutoRefreshSettingsProps {
  campaign: Campaign;
  onUpdate: (updates: Partial<Campaign>) => void;
}

const AutoRefreshSettings: React.FC<AutoRefreshSettingsProps> = ({ campaign, onUpdate }) => {
  const handleToggle = () => {
    const enabled = !campaign.autoRefreshEnabled;
    const updates: Partial<Campaign> = {
      autoRefreshEnabled: enabled
    };
    
    // If enabling, set next refresh time
    if (enabled) {
      const interval = campaign.autoRefreshInterval || 'daily';
      updates.nextAutoRefresh = calculateNextRefresh(interval);
    } else {
      updates.nextAutoRefresh = null;
    }
    
    onUpdate(updates);
  };
  
  const handleIntervalChange = (interval: Campaign['autoRefreshInterval']) => {
    onUpdate({
      autoRefreshInterval: interval,
      nextAutoRefresh: campaign.autoRefreshEnabled ? calculateNextRefresh(interval!) : null
    });
  };
  
  const calculateNextRefresh = (interval: string): string => {
    const now = new Date();
    
    switch (interval) {
      case 'every3hours':
        now.setHours(now.getHours() + 3);
        break;
      case 'every6hours':
        now.setHours(now.getHours() + 6);
        break;
      case 'every12hours':
        now.setHours(now.getHours() + 12);
        break;
      case 'daily':
      default:
        now.setHours(now.getHours() + 24);
        break;
    }
    
    return now.toISOString();
  };
  
  const formatNextRefresh = (timestamp: string | null) => {
    if (!timestamp) return 'Not scheduled';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours === 0) return `in ${diffMins} minutes`;
    if (diffHours < 24) return `in ${diffHours} hours`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };
  
  return (
    <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>🔄</span>
            Auto-Refresh
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Automatically find new leads on a schedule without visiting the app
          </p>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={campaign.autoRefreshEnabled || false}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
        </label>
      </div>
      
      {campaign.autoRefreshEnabled && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Refresh Interval
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'every3hours', label: 'Every 3 Hours', desc: '8x/day' },
                { value: 'every6hours', label: 'Every 6 Hours', desc: '4x/day' },
                { value: 'every12hours', label: 'Every 12 Hours', desc: '2x/day' },
                { value: 'daily', label: 'Daily', desc: '1x/day' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleIntervalChange(option.value as Campaign['autoRefreshInterval'])}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    campaign.autoRefreshInterval === option.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {option.label}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {campaign.nextAutoRefresh && (
            <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Next refresh:</span>
                <span className="text-sm font-semibold text-violet-400">
                  {formatNextRefresh(campaign.nextAutoRefresh)}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {new Date(campaign.nextAutoRefresh).toLocaleString()}
              </div>
            </div>
          )}
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 <strong>Tip:</strong> Auto-refresh uses your refresh quota. Make sure you have enough refreshes available for scheduled runs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRefreshSettings;
