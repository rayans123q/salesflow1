import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../constants';

interface SubredditRule {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

interface SubredditRulesProps {
    subreddit: string;
    onClose: () => void;
    hasSubscription?: boolean;
    onSubscriptionRequired?: () => void;
}

const SubredditRules: React.FC<SubredditRulesProps> = ({ 
    subreddit, 
    onClose,
    hasSubscription = false,
    onSubscriptionRequired
}) => {
    const [rules, setRules] = useState<SubredditRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [postingRequirements, setPostingRequirements] = useState<string>('');

    useEffect(() => {
        // Check subscription before fetching rules
        if (!hasSubscription) {
            setIsLoading(false);
            return;
        }

        const fetchRules = async () => {
            setIsLoading(true);
            try {
                const { subredditRulesService } = await import('../services/subredditRulesService');
                const data = await subredditRulesService.fetchRules(subreddit);
                setRules(data.rules);
                setPostingRequirements(data.postingRequirements);
            } catch (error) {
                console.error('Failed to fetch rules:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRules();
    }, [subreddit, hasSubscription]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl relative max-h-[90vh] flex flex-col">
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold mb-2">📋 r/{subreddit} Rules</h2>
                    <p className="text-[var(--text-secondary)] mb-6">Follow these rules to avoid getting banned</p>

                    {!hasSubscription ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="text-6xl">🔒</div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Subreddit Rules Locked</h3>
                                <p className="text-[var(--text-secondary)] max-w-md">
                                    Upgrade to Pro to view detailed subreddit rules and posting requirements. 
                                    This helps you create compliant posts that won't get removed!
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (onSubscriptionRequired) {
                                        onSubscriptionRequired();
                                    }
                                }}
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
                            >
                                🚀 Upgrade to Pro
                            </button>
                            <div className="text-xs text-[var(--text-secondary)] text-center max-w-sm">
                                <p>✨ Unlock AI post generation</p>
                                <p>📋 View all subreddit rules</p>
                                <p>💬 Generate unlimited comments</p>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {postingRequirements && (
                                <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-4">
                                    <h3 className="font-bold text-violet-400 mb-2">📌 Posting Requirements</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{postingRequirements}</p>
                                </div>
                            )}

                            {rules.length === 0 ? (
                                <div className="space-y-4">
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                        <h3 className="font-bold text-yellow-400 mb-2">⚠️ No Specific Rules Found</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            This subreddit may not have published rules via the API, or they may be private. 
                                            Always check the subreddit's sidebar and follow Reddit's general guidelines.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <h3 className="font-bold text-[var(--text-primary)] mb-3">📜 General Reddit Guidelines</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">🤝</span>
                                                <div>
                                                    <h4 className="font-semibold text-sm">Be Respectful</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Treat others with respect. No harassment or personal attacks.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">🚫</span>
                                                <div>
                                                    <h4 className="font-semibold text-sm">No Spam</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Avoid excessive self-promotion. Contribute meaningfully.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">🎯</span>
                                                <div>
                                                    <h4 className="font-semibold text-sm">Stay On Topic</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Keep posts relevant to the subreddit's theme.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">📖</span>
                                                <div>
                                                    <h4 className="font-semibold text-sm">Follow Reddit Policy</h4>
                                                    <p className="text-xs text-[var(--text-secondary)]">Adhere to Reddit's site-wide content policy.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                rules.map((rule, index) => (
                                    <div
                                        key={index}
                                        className={`border-2 rounded-lg p-4 ${getPriorityColor(rule.priority)}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getPriorityIcon(rule.priority)}</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold mb-1">{rule.title}</h4>
                                                <p className="text-sm opacity-90">{rule.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-2">💡 Pro Tips</h3>
                                <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                                    <li>• Read the full rules on Reddit before posting</li>
                                    <li>• Check if the subreddit requires minimum karma</li>
                                    <li>• Look at top posts to understand the community culture</li>
                                    <li>• Avoid being overly promotional in your first posts</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                        <button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubredditRules;
