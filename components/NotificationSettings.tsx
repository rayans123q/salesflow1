import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface NotificationPreferences {
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'hourly' | 'daily';
  pushEnabled: boolean;
  newLeadsEnabled: boolean;
  highPotentialEnabled: boolean;
  campaignUpdatesEnabled: boolean;
}

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    emailFrequency: 'instant',
    pushEnabled: false,
    newLeadsEnabled: true,
    highPotentialEnabled: true,
    campaignUpdatesEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          emailEnabled: data.email_enabled,
          emailFrequency: data.email_frequency,
          pushEnabled: data.push_enabled,
          newLeadsEnabled: data.new_leads_enabled,
          highPotentialEnabled: data.high_potential_enabled,
          campaignUpdatesEnabled: data.campaign_updates_enabled
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_enabled: preferences.emailEnabled,
          email_frequency: preferences.emailFrequency,
          push_enabled: preferences.pushEnabled,
          new_leads_enabled: preferences.newLeadsEnabled,
          high_potential_enabled: preferences.highPotentialEnabled,
          campaign_updates_enabled: preferences.campaignUpdatesEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Notification preferences saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
        <div className="animate-pulse">
          <div className="h-6 bg-[var(--bg-tertiary)] rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-full"></div>
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-5/6"></div>
          </div>
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
            Notification Settings
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose how and when you want to be notified about new leads
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-300' 
            : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span>📧</span>
                Email Notifications
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Receive email alerts when new leads are found
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {preferences.emailEnabled && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email Frequency
              </label>
              <select
                value={preferences.emailFrequency}
                onChange={(e) => setPreferences({ ...preferences, emailFrequency: e.target.value as any })}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
              >
                <option value="instant">Instant (as they happen)</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
              </select>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span>📱</span>
                Push Notifications
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Get instant browser notifications (coming soon)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer opacity-50">
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-color)]">
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            What to notify me about
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-[var(--text-primary)] font-medium">New Leads</div>
                <div className="text-sm text-[var(--text-secondary)]">When any new lead is found</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.newLeadsEnabled}
                onChange={(e) => setPreferences({ ...preferences, newLeadsEnabled: e.target.checked })}
                className="w-5 h-5 text-violet-600 bg-[var(--bg-secondary)] border-[var(--border-color)] rounded focus:ring-violet-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-[var(--text-primary)] font-medium">High Potential Leads</div>
                <div className="text-sm text-[var(--text-secondary)]">Only notify for high-quality leads</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.highPotentialEnabled}
                onChange={(e) => setPreferences({ ...preferences, highPotentialEnabled: e.target.checked })}
                className="w-5 h-5 text-violet-600 bg-[var(--bg-secondary)] border-[var(--border-color)] rounded focus:ring-violet-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-[var(--text-primary)] font-medium">Campaign Updates</div>
                <div className="text-sm text-[var(--text-secondary)]">Auto-refresh and campaign status changes</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.campaignUpdatesEnabled}
                onChange={(e) => setPreferences({ ...preferences, campaignUpdatesEnabled: e.target.checked })}
                className="w-5 h-5 text-violet-600 bg-[var(--bg-secondary)] border-[var(--border-color)] rounded focus:ring-violet-500"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
