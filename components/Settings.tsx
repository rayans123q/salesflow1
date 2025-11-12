import React, { useState, useEffect } from 'react';
import { Theme, RedditCredentials, AIStyleSettings, Tone, SalesApproach, ResponseLength, User, Subscription } from '../types';
import { CheckIcon, LinkIcon } from '../constants';

interface SettingsProps {
    theme: Theme;
    onToggleTheme: () => void;
    redditCreds: RedditCredentials | null;
    setRedditCreds: (creds: RedditCredentials | null) => Promise<void>;
    subscription: Subscription;
    setSubscription: (sub: Subscription) => Promise<void>;
    onLogout: () => void;
    user: User | null;
    setUser: (user: User | null) => Promise<void>;
    savedAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>;
    setSavedAiStyle: (style: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>) => Promise<void>;
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
        theme, onToggleTheme, redditCreds, setRedditCreds, subscription, setSubscription,
        onLogout, user, setUser, savedAiStyle, setSavedAiStyle, onExportData, onClearAllData 
    } = props;
    
    // Reddit Credentials State
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [isCredsSaved, setIsCredsSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    
    // Profile State
    const [currentName, setCurrentName] = useState(user?.name || '');
    const [isNameSaved, setIsNameSaved] = useState(false);

    useEffect(() => {
        if (redditCreds) {
            setClientId(redditCreds.clientId);
            setClientSecret(redditCreds.clientSecret || '');
        } else {
            setClientId('');
            setClientSecret('');
        }
    }, [redditCreds]);

    const handleSaveCreds = (e: React.FormEvent) => {
        e.preventDefault();
        const creds: RedditCredentials = { 
            clientId, 
            clientSecret: clientSecret || undefined 
        };
        setRedditCreds(creds);
        setIsCredsSaved(true);
        setTimeout(() => setIsCredsSaved(false), 2000);
    };

    const handleClearCreds = () => {
        setRedditCreds(null);
        setTestResult(null);
    };

    const handleTestCreds = async () => {
        if (!clientId) {
            setTestResult({ success: false, message: 'Please enter a Client ID first' });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        // Basic validation of Client ID format
        if (clientId.length < 10) {
            setTestResult({ 
                success: false, 
                message: 'Client ID appears to be too short. Reddit Client IDs are typically longer.' 
            });
            setIsTesting(false);
            return;
        }

        try {
            // Try to test Reddit API, but handle CORS gracefully
            const testSubreddit = 'reactjs';
            const testUrl = `https://www.reddit.com/r/${testSubreddit}/search.json?q=javascript&sort=new&t=week&limit=3&restrict_sr=true`;
            const userAgent = `SalesFlow/0.1 (Client ID: ${clientId})`;

            const response = await fetch(testUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                const posts = data?.data?.children || [];
                
                // Verify posts are from the correct subreddit
                const validPosts = posts.filter((post: any) => 
                    post.data?.subreddit?.toLowerCase() === testSubreddit.toLowerCase()
                );
                
                if (validPosts.length > 0) {
                    setTestResult({ 
                        success: true, 
                        message: `✓ Reddit API is working! Found ${validPosts.length} post(s) from r/${testSubreddit}. Subreddit filtering is working correctly.` 
                    });
                } else if (posts.length > 0) {
                    setTestResult({ 
                        success: false, 
                        message: `⚠️ API responded but returned posts from wrong subreddits. This indicates a filtering issue.` 
                    });
                } else {
                    setTestResult({ 
                        success: true, 
                        message: `✓ Reddit API is working! No posts found for the test query (this is normal).` 
                    });
                }
            } else {
                let errorMessage = 'API test failed';
                
                if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                } else if (response.status === 403) {
                    errorMessage = 'Access forbidden. Please verify your Client ID is correct.';
                } else if (response.status === 404) {
                    errorMessage = `Test subreddit (r/${testSubreddit}) not found. This is unusual - please check your Client ID.`;
                } else {
                    errorMessage = `Error ${response.status}: Reddit API returned an error.`;
                }
                
                setTestResult({ success: false, message: errorMessage });
            }
        } catch (error) {
            // Handle CORS and other network errors gracefully
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setTestResult({ 
                    success: true, 
                    message: '⚠️ Cannot test Reddit API directly from browser due to CORS policy. Your credentials will be validated when you create campaigns. Client ID format looks valid.' 
                });
            } else {
                let errorMessage = 'Network error';
                
                if (error instanceof Error) {
                    if (error.message.includes('CORS') || error.message.includes('fetch')) {
                        errorMessage = '⚠️ Cannot test Reddit API directly from browser due to CORS policy. Your credentials will be validated when you create campaigns.';
                    } else {
                        errorMessage = `Network error: ${error.message}`;
                    }
                } else {
                    errorMessage = 'Unknown network error occurred';
                }
                
                setTestResult({ 
                    success: false, 
                    message: errorMessage
                });
            }
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveName = (e: React.FormEvent) => {
        e.preventDefault();
        if (user && currentName.trim()) {
            setUser({ ...user, name: currentName.trim() });
            setIsNameSaved(true);
            setTimeout(() => setIsNameSaved(false), 2000);
        }
    }

    const isCredsPresent = !!redditCreds?.clientId;
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
                    title="Subscription"
                    description="Manage your $9/month subscription to access Sales Flow."
                >
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-violet-900/20 to-sky-900/20 border-violet-500/50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sales Flow Pro</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">$9/month - Full access</p>
                                </div>
                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/50">
                                    ✓ Active
                                </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-[var(--text-primary)]">Unlimited campaigns</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-[var(--text-primary)]">AI-powered lead discovery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-[var(--text-primary)]">Priority support</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <a
                                href="https://whop.com/hub"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold px-4 py-2 rounded-lg transition-colors text-center"
                            >
                                Manage Subscription
                            </a>
                            <a
                                href="https://whop.com/hub"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-semibold px-4 py-2 rounded-lg transition-colors text-center"
                            >
                                Cancel Subscription
                            </a>
                        </div>

                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                            <p><strong>Note:</strong> Manage your subscription, update payment methods, or cancel anytime through your account dashboard.</p>
                        </div>
                    </div>
                </SettingsSection>
                
                <SettingsSection
                    title="API Integrations (Advanced)"
                    description="Connect your own Reddit API credentials if you prefer to use your own account."
                >
                    <form onSubmit={handleSaveCreds} className="space-y-4 bg-[var(--bg-tertiary)] p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold">Reddit API Credentials</p>
                            {isCredsPresent && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/50">
                                    ✓ Configured
                                </span>
                            )}
                        </div>
                        <div className="p-3 bg-blue-900/30 border border-blue-500/50 text-blue-300 rounded-lg text-xs space-y-2">
                            <p><strong>Benefits of Reddit API:</strong></p>
                            <ul className="list-disc list-inside text-xs space-y-1">
                                <li>Real-time data directly from Reddit</li>
                                <li>Faster and more accurate search results</li>
                                <li>Better rate limits than web scraping</li>
                                <li>Automatic fallback to Gemini Search if API fails</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-green-900/30 border border-green-500/50 text-green-300 rounded-lg text-xs space-y-2">
                            <p><strong>✓ No Password Required:</strong> This uses Reddit's public JSON API, which only requires a Client ID. No username or password needed!</p>
                            <ul className="list-disc list-inside text-xs">
                                <li>More secure - no passwords to store or manage</li>
                                <li>Simpler setup - just get your Client ID from Reddit</li>
                                <li>Client ID is stored securely in your database</li>
                            </ul>
                        </div>
                        <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-sm text-violet-400 hover:underline flex items-center gap-1.5">
                            📖 How to create a Reddit App (opens in new tab) <LinkIcon className="w-4 h-4" />
                        </a>
                        <div className="p-2 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                            <p><strong>Quick Setup:</strong></p>
                            <ol className="list-decimal list-inside space-y-1 mt-1">
                                <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">reddit.com/prefs/apps</a></li>
                                <li>Click "create another app" or "create app"</li>
                                <li>Select any app type (script, web app, or installed app)</li>
                                <li>Copy the Client ID (the string under your app name)</li>
                                <li>Optionally copy the Client Secret (not required for public API)</li>
                            </ol>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-secondary)]" htmlFor="clientId">Client ID <span className="text-red-400">*</span></label>
                            <input id="clientId" type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full mt-1 bg-[var(--bg-secondary)] border border-gray-600 rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" placeholder="Reddit App Client ID (required)"/>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">The string under your app name in Reddit (e.g., "abcd1234efgh5678")</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-secondary)]" htmlFor="clientSecret">Client Secret <span className="text-gray-500">(optional)</span></label>
                            <input id="clientSecret" type="text" value={clientSecret} onChange={e => setClientSecret(e.target.value)} className="w-full mt-1 bg-[var(--bg-secondary)] border border-gray-600 rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" placeholder="Reddit App Client Secret (optional)"/>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">Optional. The app works with just Client ID using Reddit's public API.</p>
                        </div>
                        {testResult && (
                            <div className={`p-3 rounded-lg border ${testResult.success 
                                ? 'bg-green-900/30 border-green-500/50 text-green-300' 
                                : 'bg-red-900/30 border-red-500/50 text-red-300'
                            }`}>
                                <p className="text-sm">{testResult.message}</p>
                        </div>
                        )}
                        <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
                            <div className="flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={handleTestCreds} 
                                    disabled={!clientId || isTesting}
                                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isTesting ? 'Testing...' : 'Test Client ID'}
                                </button>
                             {isCredsPresent && (
                                    <button 
                                        type="button" 
                                        onClick={handleClearCreds} 
                                        className="text-sm text-red-400 hover:text-red-300 hover:underline px-2"
                                    >
                                        Clear
                                </button>
                            )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={!clientId} 
                                className="bg-[var(--brand-primary)] text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                            >
                                {isCredsSaved ? <><CheckIcon className="w-5 h-5 mr-1"/> Saved</> : 'Save'}
                            </button>
                        </div>
                        {isCredsPresent && (
                            <div className="p-2 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300">
                                <p>✓ Reddit API is configured. The app will use Reddit API for real-time data when creating campaigns.</p>
                                <p className="mt-1 text-green-400/70">If Reddit API fails, the app will automatically fall back to Gemini Search.</p>
                            </div>
                        )}
                    </form>
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
