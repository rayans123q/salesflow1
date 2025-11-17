import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { SparkleIcon, CloseIcon, CheckIcon } from '../constants';

interface PostComposerProps {
    campaign: Campaign;
    selectedSubreddits: string[];
    onClose: () => void;
    onPostsCreated: (posts: any[]) => void;
    hasSubscription?: boolean;
    onSubscriptionRequired?: () => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ 
    campaign, 
    selectedSubreddits, 
    onClose, 
    onPostsCreated,
    hasSubscription = false,
    onSubscriptionRequired
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedSubreddit, setSelectedSubreddit] = useState(selectedSubreddits[0] || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [ruleCompliance, setRuleCompliance] = useState<{ compliant: boolean; issues: string[] } | null>(null);
    const [isCheckingRules, setIsCheckingRules] = useState(false);

    const handleGeneratePost = async () => {
        // Check subscription before generating
        if (!hasSubscription) {
            if (onSubscriptionRequired) {
                onSubscriptionRequired();
            }
            return;
        }

        if (!selectedSubreddit) return;
        
        setIsGenerating(true);
        try {
            const { postComposerService } = await import('../services/postComposerService');
            const generatedPost = await postComposerService.generateRuleAwarePost(
                campaign.description,
                selectedSubreddit,
                campaign.websiteUrl || ''
            );
            setTitle(generatedPost.title);
            setContent(generatedPost.content);
        } catch (error) {
            console.error('Failed to generate post:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const checkRuleCompliance = async () => {
        if (!title || !content || !selectedSubreddit) return;
        
        setIsCheckingRules(true);
        try {
            const { postComposerService } = await import('../services/postComposerService');
            const compliance = await postComposerService.checkRuleCompliance(
                title,
                content,
                selectedSubreddit
            );
            setRuleCompliance(compliance);
        } catch (error) {
            console.error('Failed to check compliance:', error);
        } finally {
            setIsCheckingRules(false);
        }
    };

    useEffect(() => {
        if (title && content && selectedSubreddit) {
            const debounce = setTimeout(() => {
                checkRuleCompliance();
            }, 1000);
            return () => clearTimeout(debounce);
        }
    }, [title, content, selectedSubreddit]);

    const handleSave = () => {
        const post = {
            title,
            content,
            subreddit: selectedSubreddit,
            campaignId: campaign.id,
            status: 'draft'
        };
        onPostsCreated([post]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] w-full max-w-4xl rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl relative max-h-[90vh] flex flex-col">
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold mb-2">✍️ Rule-Aware Post Composer</h2>
                    <p className="text-[var(--text-secondary)] mb-6">Create posts that comply with subreddit rules</p>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Subreddit Selector */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Target Subreddit
                            </label>
                            <select
                                value={selectedSubreddit}
                                onChange={(e) => setSelectedSubreddit(e.target.value)}
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                            >
                                {selectedSubreddits.map(sub => (
                                    <option key={sub} value={sub}>r/{sub}</option>
                                ))}
                            </select>
                        </div>

                        {/* AI Generate Button */}
                        <button
                            onClick={handleGeneratePost}
                            disabled={isGenerating || !selectedSubreddit}
                            className={`w-full font-semibold px-4 py-3 rounded-lg flex items-center justify-center gap-2 relative ${
                                !hasSubscription 
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white cursor-pointer'
                                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-60'
                            }`}
                        >
                            {!hasSubscription && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    🔒 Pro
                                </span>
                            )}
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <SparkleIcon className="w-5 h-5" />
                                    {!hasSubscription ? 'Unlock AI Post Generation' : 'Generate AI Post'}
                                </>
                            )}
                        </button>

                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Post Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter an engaging title..."
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                                maxLength={300}
                            />
                            <p className="text-xs text-gray-500 mt-1">{title.length}/300 characters</p>
                        </div>

                        {/* Content Input */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Post Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your post content here..."
                                rows={10}
                                className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)] outline-none resize-none"
                            />
                        </div>

                        {/* Rule Compliance Checker */}
                        {ruleCompliance && (
                            <div className={`border-2 rounded-lg p-4 ${
                                ruleCompliance.compliant 
                                    ? 'bg-green-500/10 border-green-500/50' 
                                    : 'bg-red-500/10 border-red-500/50'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {ruleCompliance.compliant ? (
                                        <>
                                            <CheckIcon className="w-5 h-5 text-green-400" />
                                            <span className="font-bold text-green-400">Rule Compliant ✓</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl">⚠️</span>
                                            <span className="font-bold text-red-400">Potential Issues</span>
                                        </>
                                    )}
                                </div>
                                {!ruleCompliance.compliant && ruleCompliance.issues.length > 0 && (
                                    <ul className="text-sm space-y-1 ml-7">
                                        {ruleCompliance.issues.map((issue, i) => (
                                            <li key={i} className="text-red-300">• {issue}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {isCheckingRules && (
                            <div className="text-center text-sm text-[var(--text-secondary)]">
                                Checking rule compliance...
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mt-6 pt-4 border-t border-[var(--border-color)]">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-6 py-3 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title || !content || (ruleCompliance && !ruleCompliance.compliant)}
                            className="flex-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60"
                        >
                            Save Draft
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostComposer;
