import React, { useState, useEffect } from 'react';
import { KeywordAlert } from '../types';
import { keywordAlertsService } from '../services/keywordAlertsService';
import { pushNotificationService } from '../services/pushNotificationService';

const KeywordAlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<KeywordAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    loadAlerts();
    checkPushStatus();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await keywordAlertsService.getAlertsWithStats();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    const supported = pushNotificationService.isSupported();
    setPushSupported(supported);
    
    if (supported) {
      const subscribed = await pushNotificationService.isSubscribed();
      setPushEnabled(subscribed);
    }
  };

  const handleEnablePush = async () => {
    try {
      await pushNotificationService.subscribe();
      setPushEnabled(true);
      
      // Test notification
      await pushNotificationService.sendTestNotification();
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      alert('Failed to enable push notifications. Please check your browser settings.');
    }
  };

  const handleDisablePush = async () => {
    try {
      await pushNotificationService.unsubscribe();
      setPushEnabled(false);
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this keyword alert?')) return;
    
    try {
      await keywordAlertsService.deleteAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alert: KeywordAlert) => {
    try {
      const updated = await keywordAlertsService.updateAlert(alert.id, {
        isActive: !alert.isActive
      });
      setAlerts(alerts.map(a => a.id === alert.id ? updated : a));
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--bg-tertiary)] rounded w-1/3"></div>
          <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>🔔</span>
            Keyword Alerts
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Get notified when specific keywords appear in Reddit comments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Create Alert
        </button>
      </div>

      {/* Push Notification Status */}
      {pushSupported && (
        <div className="mb-6 bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span>📱</span>
                Browser Push Notifications
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {pushEnabled 
                  ? 'You will receive instant notifications on this device' 
                  : 'Enable to receive instant alerts on this device'}
              </p>
            </div>
            {pushEnabled ? (
              <button
                onClick={handleDisablePush}
                className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={handleEnablePush}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No Keyword Alerts Yet
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Create your first alert to monitor Reddit for specific keywords
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      {alert.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {alert.isActive ? '● Active' : '○ Paused'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">Keywords: </span>
                      <span className="text-[var(--text-primary)]">
                        {alert.keywords.map((k, i) => (
                          <span key={i} className="inline-block bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded mr-1 mb-1">
                            "{k}"
                          </span>
                        ))}
                      </span>
                    </div>
                    
                    {alert.subreddits && alert.subreddits.length > 0 && (
                      <div>
                        <span className="text-[var(--text-secondary)]">Subreddits: </span>
                        <span className="text-[var(--text-primary)]">
                          {alert.subreddits.map((s, i) => (
                            <span key={i} className="inline-block bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded mr-1 mb-1">
                              r/{s}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                    
                    {(alert as any).stats && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-[var(--text-secondary)]">
                          Total: <span className="text-[var(--text-primary)] font-medium">{(alert as any).stats.totalMatches}</span>
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          Today: <span className="text-[var(--text-primary)] font-medium">{(alert as any).stats.matchesToday}</span>
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          This Week: <span className="text-[var(--text-primary)] font-medium">{(alert as any).stats.matchesThisWeek}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAlert(alert)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2"
                    title={alert.isActive ? 'Pause alert' : 'Activate alert'}
                  >
                    {alert.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                    title="Delete alert"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <CreateAlertModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newAlert) => {
            setAlerts([newAlert, ...alerts]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Alert Modal Component
const CreateAlertModal: React.FC<{
  onClose: () => void;
  onCreated: (alert: KeywordAlert) => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [subredditInput, setSubredditInput] = useState('');
  const [creating, setCreating] = useState(false);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleAddSubreddit = () => {
    const sub = subredditInput.trim().replace(/^r\//, '');
    if (sub && !subreddits.includes(sub)) {
      setSubreddits([...subreddits, sub]);
      setSubredditInput('');
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || keywords.length === 0) {
      alert('Please provide a name and at least one keyword');
      return;
    }

    setCreating(true);
    try {
      const alert = await keywordAlertsService.createAlert({
        name: name.trim(),
        keywords,
        subreddits: subreddits.length > 0 ? subreddits : undefined,
        isActive: true,
        notificationEmail: true,
        notificationPush: true,
        alertFrequency: 'instant'
      });
      onCreated(alert);
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Create Keyword Alert
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Alert Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CRM Opportunities"
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Keywords to Monitor
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="e.g., looking for CRM"
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleAddKeyword}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    "{keyword}"
                    <button
                      onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                      className="text-violet-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Subreddits (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={subredditInput}
                  onChange={(e) => setSubredditInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubreddit()}
                  placeholder="e.g., sales, entrepreneur"
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleAddSubreddit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subreddits.map((sub, i) => (
                  <span
                    key={i}
                    className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    r/{sub}
                    <button
                      onClick={() => setSubreddits(subreddits.filter((_, idx) => idx !== i))}
                      className="text-blue-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {subreddits.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Leave empty to monitor popular subreddits (sales, entrepreneur, smallbusiness, startups)
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || keywords.length === 0}
              className="flex-1 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordAlertManager;
