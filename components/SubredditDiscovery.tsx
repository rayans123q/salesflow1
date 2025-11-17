import React, { useState } from 'react';
import { SparkleIcon, CheckIcon, CloseIcon } from '../constants';

interface DiscoveredSubreddit {
    name: string;
    matchScore: number;
    subscriberCount: number;
    description: string;
    isSelected: boolean;
}

interface SubredditDiscoveryProps {
    campaignDescription: string;
    keywords: string[];
    onSubredditsSelected: (subreddits: string[]) => void;
    onClose: () => void;
}

const SubredditDiscovery: React.FC<SubredditDiscoveryProps> = ({ 
    campaignDescription, 
    keywords, 
    onSubredditsSelected,
    onClose 
}) => {
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveredSubreddits, setDiscoveredSubreddits] = useState<DiscoveredSubreddit[]>([]);
    const [selectedSubreddits, setSelectedSubreddits] = useState<Set<string>>(new Set());

    const handleDiscover = async () => {
        setIsDiscovering(true);
        try {
            const { subredditDiscoveryService } = await import('../services/subredditDiscoveryService');
            const results = await subredditDiscoveryService.discoverSubreddits(campaignDescription, keywords);
            setDiscoveredSubreddits(results.map(r => ({ ...r, isSelected: false })));
        } catch (error) {
            console.error('Discovery failed:', error);
        } finally {
            setIsDiscovering(false);
        }
    };

    const toggleSubreddit = (name: string) => {
        const newSelected = new Set(selectedSubreddits);
        if (newSelected.has(name)) {
            newSelected.delete(name);
        } else {
            newSelected.add(name);
        }
        setSelectedSubreddits(newSelected);
    };

    const handleApply = () => {
        onSubredditsSelected(Array.from(selectedSubreddits));
        onClose();
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400 bg-green-500/20';
        if (score >= 75) return 'text-blue-400 bg-blue-500/20';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-gray-400 bg-gray-500/20';
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-[var(--bg-secondary)] w-full max-w-3xl rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold mb-2">🔍 AI Subreddit Discovery</h2>
                    <p className="text-[var(--text-secondary)] mb-6">Find the most relevant communities for your campaign</p>

                    {discoveredSubreddits.length === 0 ? (
                        <div className="text-center py-12">
                            <SparkleIcon className="w-16 h-16 mx-auto mb-4 text-violet-400" />
                            <p className="text-[var(--text-secondary)] mb-6">
                                Click below to discover subreddits that match your campaign
                            </p>
                            <button
                                onClick={handleDiscover}
                                disabled={isDiscovering}
                                className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60 flex items-center gap-2 mx-auto"
                            >
                                {isDiscovering ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Discovering...
                                    </>
                                ) : (
                                    <>
                                        <SparkleIcon className="w-5 h-5" />
                                        Discover Subreddits
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Found {discoveredSubreddits.length} relevant communities
                                </p>
                                <p className="text-sm text-violet-400">
                                    {selectedSubreddits.size} selected
                                </p>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                                {discoveredSubreddits.map((sub) => (
                                    <div
                                        key={sub.name}
                                        onClick={() => toggleSubreddit(sub.name)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedSubreddits.has(sub.name)
                                                ? 'border-[var(--brand-primary)] bg-violet-500/10'
                                                : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[var(--text-primary)]">r/{sub.name}</span>
                                                {selectedSubreddits.has(sub.name) && (
                                                    <CheckIcon className="w-5 h-5 text-green-400" />
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(sub.matchScore)}`}>
                                                {sub.matchScore}% match
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">{sub.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {sub.subscriberCount.toLocaleString()} members
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleDiscover}
                                    disabled={isDiscovering}
                                    className="flex-1 bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-6 py-3 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors"
                                >
                                    Discover More
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={selectedSubreddits.size === 0}
                                    className="flex-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60"
                                >
                                    Add {selectedSubreddits.size} Subreddit{selectedSubreddits.size !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubredditDiscovery;
