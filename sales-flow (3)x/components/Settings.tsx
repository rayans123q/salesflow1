import React, { useState, useEffect } from 'react';
import { Theme, AIStyleSettings, Tone, SalesApproach, ResponseLength, User, RedditCredentials } from '../types';
import { CheckIcon, CloseIcon } from '../constants';

interface SettingsProps {
    theme: Theme;
    onToggleTheme: () => void;
    onLogout: () => void;
    user: User | null;
    setUser: (user: User | null) => void;
    savedAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>;
    setSavedAiStyle: (style: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>) => void;
    redditCreds: RedditCredentials | null;
    setRedditCreds: (creds: RedditCredentials | null) => void;
    onExportData: () => void;
    onClearAllData: () => void;
}

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
        <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">{title}</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6">{description}</p>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Settings: React.FC<SettingsProps> = (props) => {
    const { 
        theme, onToggleTheme, onLogout, user, setUser,
        savedAiStyle, setSavedAiStyle, redditCreds, setRedditCreds,
        onExportData, onClearAllData 
    } = props;
    
    // Profile State
    const [currentName, setCurrentName] = useState(user?.name || '');
    const [isNameSaved, setIsNameSaved] = useState(false);
    
    // Reddit Credentials State
    const [redditClientId, setRedditClientId] = useState('');
    const [redditClientSecret, setRedditClientSecret] = useState('');
    const [areCredsSaved, setAreCredsSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (redditCreds) {
            setRedditClientId(redditCreds.clientId);
            setRedditClientSecret(redditCreds.clientSecret);
        } else {
            setRedditClientId('');
            setRedditClientSecret('');
        }
        setTestStatus('idle');
    }, [redditCreds]);

    const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRedditClientId(e.target.value);
        setTestStatus('idle');
    };

    const handleClientSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRedditClientSecret(e.target.value);
        setTestStatus('idle');
    };

    const handleSaveName = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && currentName.trim()) {
            setUser({ ...user, name: currentName.trim() });
            setIsNameSaved(true);
            setTimeout(() => setIsNameSaved(false), 2000);
        }
    }
    
    const handleSaveRedditCreds = (e: React.FormEvent) => {
        e.preventDefault();
        if (redditClientId.trim() && redditClientSecret.trim()) {
            setRedditCreds({
                clientId: redditClientId.trim(),
                clientSecret: redditClientSecret.trim(),
            });
            setAreCredsSaved(true);
            setTimeout(() => setAreCredsSaved(false), 2000);
        }
    };

    const handleTestConnection = async () => {
        if (!redditClientId.trim() || !redditClientSecret.trim()) return;

        setTestStatus('testing');
        const clientId = redditClientId.trim();
        const clientSecret = redditClientSecret.trim();

        try {
            // In a real production app, this should be done on a backend server to protect the client secret.
            // For this self-contained app, we perform it client-side.
            const response = await fetch('https://www.reddit.com/api/v1/access_token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (response.ok) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
        } catch (error) {
            console.error('Reddit connection test failed:', error);
            setTestStatus('error');
        }
    };
    
    const handleClearRedditCreds = () => {
        setRedditCreds(null);
    };

    const salesApproachValues: SalesApproach[] = ['Subtle', 'Moderate', 'Direct', 'Aggressive'];

    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Settings</h1>
            <div className="max-w-3xl mx-auto space-y-8">
                
                <SettingsSection
                    title="Profile"
                    description="Manage your personal information."
                >
                    <form onSubmit={handleSaveName} className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label className="text-sm text-[var(--text-secondary)]" htmlFor="userName">Your Name</label>
                            <input id="userName" type="text" value={currentName} onChange={e => setCurrentName(e.target.value)} className="w-full mt-1 bg-[var(--bg-tertiary)] border border-gray-600 rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"/>
                        </div>
                        <button type="submit" disabled={!currentName.trim() || currentName === user?.name} className="bg-[var(--brand-primary)] text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-32">
                            {isNameSaved ? <><CheckIcon className="w-5 h-5 mr-1"/> Saved</> : 'Save'}
                        </button>
                    </form>
                    <div className="border-t border-[var(--border-color)] pt-4">
                        <button
                            onClick={onLogout}
                            className="bg-red-500/20 text-red-400 font-semibold px-5 py-2.5 rounded-lg hover:bg-red-500/30 transition-colors w-full sm:w-auto"
                        >
                            Log Out
                        </button>
                    </div>
                </SettingsSection>
                
                <SettingsSection
                    title="Integrations"
                    description="Connect your accounts to enhance lead discovery. Credentials are stored locally in your browser."
                >
                    <form onSubmit={handleSaveRedditCreds}>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Reddit API Credentials</h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-3">
                                    Provides more reliable data fetching. Create a 'script' app on Reddit{' '}
                                    <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                                        here
                                    </a>.
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-secondary)]" htmlFor="redditClientId">Client ID</label>
                                <input id="redditClientId" type="text" value={redditClientId} onChange={handleClientIdChange} placeholder="e.g., aBCdEf1gHiJkLm" className="w-full mt-1 bg-[var(--bg-tertiary)] border border-gray-600 rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"/>
                            </div>
                             <div>
                                <label className="text-sm text-[var(--text-secondary)]" htmlFor="redditClientSecret">Client Secret</label>
                                <input id="redditClientSecret" type="password" value={redditClientSecret} onChange={handleClientSecretChange} placeholder="••••••••••••••••••••••••" className="w-full mt-1 bg-[var(--bg-tertiary)] border border-gray-600 rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"/>
                            </div>
                        </div>
                         <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={!redditClientId.trim() || !redditClientSecret.trim()} className="bg-[var(--brand-primary)] text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-44">
                                {areCredsSaved ? <><CheckIcon className="w-5 h-5 mr-1"/> Saved</> : 'Save Reddit Keys'}
                            </button>
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={!redditClientId.trim() || !redditClientSecret.trim() || testStatus === 'testing'}
                                className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors w-full sm:w-auto flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {testStatus === 'testing' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Testing...
                                    </>
                                ) : 'Test Connection'}
                            </button>
                            {redditCreds && (
                                <button type="button" onClick={handleClearRedditCreds} className="text-sm text-gray-400 hover:text-white hover:underline sm:ml-auto">
                                    Clear Credentials
                                </button>
                            )}
                        </div>
                        <div className="mt-3 text-sm h-5">
                            {testStatus === 'success' && (
                                <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                                    <CheckIcon className="w-5 h-5" />
                                    Connection successful!
                                </div>
                            )}
                            {testStatus === 'error' && (
                                <div className="flex items-center gap-2 text-red-400 animate-fade-in">
                                    <CloseIcon className="w-5 h-5" />
                                    Connection failed. Please check your credentials.
                                </div>
                            )}
                        </div>
                    </form>
                </SettingsSection>

                <SettingsSection
                    title="Default AI Style"
                    description="Set the default style for AI-generated comments. You can override this for any specific comment."
                >
                    <div>
                         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Tone</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(['Friendly & Warm', 'Professional', 'Casual & Relaxed', 'Expert & Authoritative'] as Tone[]).map(tone => (
                                <button key={tone} onClick={() => setSavedAiStyle({...savedAiStyle, tone})} className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${savedAiStyle.tone === tone ? 'border-[var(--brand-primary)] bg-violet-500/10 text-[var(--text-primary)]' : 'border-transparent bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-gray-600'}`}>
                                    {tone}
                                </button>
                            ))}
                         </div>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Sales Approach ({savedAiStyle.salesApproach})</label>
                         <input type="range" min="0" max="3" value={salesApproachValues.indexOf(savedAiStyle.salesApproach)} 
                            onChange={(e) => setSavedAiStyle({...savedAiStyle, salesApproach: salesApproachValues[parseInt(e.target.value)]})}
                            className="w-full"
                         />
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Length</label>
                         <div className="grid grid-cols-3 gap-3">
                            {(['Short', 'Medium', 'Long'] as ResponseLength[]).map(length => (
                                <button key={length} onClick={() => setSavedAiStyle({...savedAiStyle, length})} className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${savedAiStyle.length === length ? 'border-[var(--brand-primary)] bg-violet-500/10 text-[var(--text-primary)]' : 'border-transparent bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-gray-600'}`}>
                                    {length}
                                </button>
                            ))}
                         </div>
                    </div>
                    <label className="flex items-center bg-[var(--bg-tertiary)] p-3 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={savedAiStyle.includeWebsiteLink} onChange={(e) => setSavedAiStyle({...savedAiStyle, includeWebsiteLink: e.target.checked})} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-violet-500 focus:ring-violet-500"/>
                        <span className="ml-3 text-sm text-[var(--text-primary)]">Include Website Link by default</span>
                    </label>
                </SettingsSection>

                <SettingsSection
                    title="Appearance"
                    description="Customize the look and feel of the app."
                >
                    <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-4 rounded-lg">
                        <div>
                            <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
                            <p className="text-xs text-[var(--text-secondary)]">Reduce eye strain and save energy.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
                        </label>
                    </div>
                </SettingsSection>
                
                <SettingsSection
                    title="Data Management"
                    description="Export your data for backup or clear everything to start over."
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={onExportData}
                            className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2.5 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors flex-grow"
                        >
                            Export All Data
                        </button>
                        <button
                            onClick={onClearAllData}
                            className="bg-red-500/20 text-red-400 font-semibold px-5 py-2.5 rounded-lg hover:bg-red-500/30 transition-colors flex-grow"
                        >
                            Clear All Data
                        </button>
                    </div>
                </SettingsSection>

            </div>
        </div>
    );
};

export default Settings;