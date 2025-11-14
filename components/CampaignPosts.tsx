import React, { useState, useEffect } from 'react';
import { Campaign, Post, AIStyleSettings } from '../types';
import { StarIcon, FilterIcon, ClockIcon, CloseIcon, LinkIcon, RedditIcon, TwitterIcon, LockIcon } from '../constants';
import CommentModal from './CommentModal';
import AiResponseGeneratorModal from './AiResponseGeneratorModal';
import ConfirmationModal from './ConfirmationModal';
import { generateComment } from '../services/geminiService';
import { whopService } from '../services/whopService';

interface CampaignPostsProps {
    campaign: Campaign;
    posts: Post[];
    onBack: () => void;
    onPostContacted: (postId: number) => void;
    savedAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>;
    setSavedAiStyle: (style: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>) => void;
    onDeleteCampaign: (campaignId: number) => void;
    onRefreshCampaign: (campaignId: number) => Promise<number>;
    onGenerateAiResponse: () => Promise<boolean>;
    commentHistory: Record<number, string[]>;
    onAddCommentToHistory: (postId: number, comment: string) => Promise<void>;
    userEmail: string; // Add user email for subscription check
}

const PostCard: React.FC<{ 
    post: Post; 
    onComment: (post: Post) => void; 
    onViewPost: (post: Post) => void;
    websiteUrl?: string;
    hasSubscription: boolean;
}> = ({ post, onComment, onViewPost, websiteUrl, hasSubscription }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const buttonLabel = post.status === 'contacted' ? 'Engaged' : 'Generate AI Comment';
    const buttonDisabled = post.status === 'contacted';
    
    const relevanceColor = post.relevance > 90 ? 'bg-green-500/20 text-green-300' : post.relevance > 80 ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300';

    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col transition-all duration-300 hover:border-[var(--brand-primary)]/50 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                        {post.source === 'reddit' && <RedditIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />}
                        {post.source === 'twitter' && <TwitterIcon className="w-5 h-5 text-sky-400 flex-shrink-0" />}
                        <p className="font-semibold text-[var(--text-primary)] text-opacity-80 truncate">{post.sourceName}</p>
                    </div>
                    <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-full text-sm ${relevanceColor} flex-shrink-0`}>
                        <StarIcon className="w-4 h-4" />
                        <span>{post.relevance}%</span>
                    </div>
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-3 leading-tight">{post.title}</h3>
                <p className={`text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>{post.content}</p>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="text-violet-400 text-sm font-semibold mt-3 hover:underline"
                >
                    {isExpanded ? 'Show Less' : 'Show More'}
                </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50">
                {websiteUrl && (
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2 rounded-lg text-sm hover:bg-black/30 dark:hover:bg-white/20 transition-colors">
                        <LinkIcon className="w-4 h-4" />
                        Visit Website
                    </a>
                )}
                <button 
                    onClick={() => onViewPost(post)}
                    className={`flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm transition-colors ${
                        hasSubscription 
                            ? 'bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-black/30 dark:hover:bg-white/20' 
                            : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600/70 cursor-pointer'
                    }`}
                    title={!hasSubscription ? 'Click to subscribe and unlock' : ''}
                >
                    {!hasSubscription && <LockIcon className="w-4 h-4" />}
                    View on {post.source === 'reddit' ? 'Reddit' : 'Twitter'}
                </button>
                 <button 
                    onClick={() => onComment(post)}
                    className={`flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm shadow-md transition-opacity ${
                        hasSubscription
                            ? 'bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed'
                            : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600/70 cursor-pointer'
                    }`}
                    disabled={buttonDisabled && hasSubscription}
                    title={!hasSubscription ? 'Click to subscribe and unlock' : ''}
                >
                    {!hasSubscription && <LockIcon className="w-4 h-4" />}
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
};

const statusOptions: Post['status'][] = ['new', 'contacted'];

const FilterPopover: React.FC<{
    activeStatuses: Post['status'][];
    onClose: () => void;
    onApply: (statuses: Post['status'][]) => void;
    onClear: () => void;
}> = ({ activeStatuses, onClose, onApply, onClear }) => {
    const [tempStatuses, setTempStatuses] = useState<Post['status'][]>(activeStatuses);

    const handleStatusChange = (status: Post['status']) => {
        setTempStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    const handleApplyClick = () => {
        onApply(tempStatuses);
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
            <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[var(--text-primary)]">Filter Posts</h3>
                     <button onClick={onClear} className="text-sm text-violet-400 hover:underline">Clear</button>
                </div>
                
                <div className="space-y-3">
                     <p className="text-sm font-medium text-[var(--text-secondary)]">By Status</p>
                     {statusOptions.map(status => (
                        <label key={status} className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={tempStatuses.includes(status)}
                                onChange={() => handleStatusChange(status)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-violet-500 focus:ring-offset-0 focus:ring-2 focus:ring-violet-500"
                            />
                            <span className="text-[var(--text-primary)] capitalize">{status === 'new' ? 'New' : status}</span>
                        </label>
                     ))}
                </div>

                <div className="mt-5 border-t border-[var(--border-color)] pt-4">
                     <button onClick={handleApplyClick} className="w-full bg-[var(--brand-primary)] text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">Apply Filters</button>
                </div>
            </div>
        </>
    )
}


const CampaignPosts: React.FC<CampaignPostsProps> = ({ campaign, posts, onBack, onPostContacted, savedAiStyle, setSavedAiStyle, onDeleteCampaign, onRefreshCampaign, onGenerateAiResponse, commentHistory, onAddCommentToHistory, userEmail }) => {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isCommentModalOpen, setCommentModalOpen] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ statuses: Post['status'][] }>({ statuses: [] });
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [previewText, setPreviewText] = useState('');
    const [refreshResult, setRefreshResult] = useState<number | null>(null);
    const [hasSubscription, setHasSubscription] = useState<boolean>(false);
    const [isCheckingSubscription, setIsCheckingSubscription] = useState<boolean>(true);

    // Check subscription status on mount and when user changes
    useEffect(() => {
        const checkSubscription = async () => {
            setIsCheckingSubscription(true);
            try {
                const isActive = await whopService.hasActiveSubscription(userEmail);
                setHasSubscription(isActive);
                console.log('💳 Subscription status:', isActive ? 'ACTIVE' : 'INACTIVE');
            } catch (error) {
                console.error('Failed to check subscription:', error);
                setHasSubscription(false);
            } finally {
                setIsCheckingSubscription(false);
            }
        };

        checkSubscription();
    }, [userEmail]);

    const handleOpenCommentModal = (post: Post) => {
        // Check subscription before opening modal
        if (!hasSubscription) {
            console.log('🔒 Subscription required - redirecting to checkout');
            whopService.redirectToCheckout(userEmail);
            return;
        }
        
        setSelectedPost(post);
        setCommentText('');
        setCommentModalOpen(true);
    };

    const handleViewPost = (post: Post) => {
        // Check subscription before allowing view
        if (!hasSubscription) {
            console.log('🔒 Subscription required - redirecting to checkout');
            whopService.redirectToCheckout(userEmail);
            return;
        }
        
        // Open post in new tab
        window.open(post.url, '_blank', 'noopener,noreferrer');
    };

    const handleCloseCommentModal = () => {
        setCommentModalOpen(false);
        setSelectedPost(null);
    };
    
    const handleGeneratePreview = async (styleSettings: AIStyleSettings) => {
        if (!selectedPost) return;

        const canGenerate = await onGenerateAiResponse();
        if (!canGenerate) {
            setAiModalOpen(false); // Close modal if limit is reached
            return;
        }

        setIsGenerating(true);
        setPreviewText(''); // Clear previous preview
        try {
            const response = await generateComment(selectedPost, campaign, styleSettings);
            setPreviewText(response);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseComment = async (comment: string) => {
        if (!selectedPost) return;

        await onAddCommentToHistory(selectedPost.id, comment);
        setCommentText(comment);
        setAiModalOpen(false);
        setCommentModalOpen(true);
        setPreviewText(''); // Reset preview text
    };
    
    const handleCloseAiModal = () => {
        setAiModalOpen(false);
        setPreviewText(''); // Reset on close
    };

    const handleRefreshClick = async () => {
        setIsRefreshing(true);
        setRefreshResult(null); // Clear previous result
        try {
            const newPostsCount = await onRefreshCampaign(campaign.id);
            setRefreshResult(newPostsCount);
        } catch (error) {
            // Error notification is handled in App.tsx
            console.error("Refresh failed in component", error);
            setRefreshResult(-1); // Indicate an error
        } finally {
            setIsRefreshing(false);
        }
    };
    
    const handleConfirmDelete = () => {
        onDeleteCampaign(campaign.id);
        setDeleteModalOpen(false);
    };

    const handleApplyFilters = (statuses: Post['status'][]) => {
        setActiveFilters({ statuses });
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setActiveFilters({ statuses: [] });
        setIsFilterOpen(false);
    };

    const sortedPosts = [...posts].sort((a, b) => b.relevance - a.relevance);

    const filteredPosts = sortedPosts.filter(post => {
        if (activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(post.status)) {
            return false;
        }
        return true;
    });

    return (
        <div className="p-4 sm:p-8 relative">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
                <div>
                     <button onClick={onBack} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2 text-sm">← Back to Campaigns</button>
                     <h1 className="text-3xl font-bold">{campaign.name}</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                     <button onClick={() => setDeleteModalOpen(true)} className="bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors">Delete Campaign</button>
                     <button onClick={handleRefreshClick} disabled={isRefreshing} className="bg-[var(--brand-primary)] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed">
                        {isRefreshing ? (
                             <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Refreshing...</>
                        ) : 'Refresh'}
                    </button>
                </div>
            </div>
            {campaign.lastRefreshed && <p className="text-xs text-gray-500 mb-8 flex items-center gap-1.5"><ClockIcon className="w-3 h-3"/> Last refreshed: {new Date(campaign.lastRefreshed).toLocaleString()}</p>}


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl text-center"><span className="text-3xl font-bold">{campaign.leadsFound}</span><p className="text-[var(--text-secondary)]">Total Posts Found</p></div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl text-center"><span className="text-3xl font-bold">{campaign.highPotential}</span><p className="text-[var(--text-secondary)]">High Potential</p></div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl text-center"><span className="text-3xl font-bold">{campaign.contacted}</span><p className="text-[var(--text-secondary)]">Contacted</p></div>
            </div>
            
            {refreshResult !== null && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg flex justify-between items-center mb-6 animate-fade-in">
                    <p className="font-semibold">
                        {refreshResult > 0 
                            ? `Success! Found ${refreshResult} new post${refreshResult > 1 ? 's' : ''}.`
                            : 'Refresh complete. No new posts were found.'}
                    </p>
                    <button onClick={() => setRefreshResult(null)} className="text-green-300 hover:text-white" aria-label="Dismiss">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            )}


            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Found Posts ({filteredPosts.length})</h2>
                 <div className="relative">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors ${
                            activeFilters.statuses.length > 0 
                            ? 'bg-violet-500/20 text-violet-300' 
                            : 'bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-black/30 dark:hover:bg-white/20'
                        }`}
                    >
                        <FilterIcon className="w-5 h-5" /> Filter
                    </button>
                    {isFilterOpen && (
                        <FilterPopover 
                           activeStatuses={activeFilters.statuses}
                           onClose={() => setIsFilterOpen(false)}
                           onApply={handleApplyFilters}
                           onClear={handleClearFilters}
                        />
                    )}
                </div>
            </div>
            
            <div className="space-y-6 stagger-in">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => (
                        <div key={post.id} style={{ animationDelay: `${index * 100}ms` }}>
                            <PostCard 
                                post={post} 
                                onComment={() => handleOpenCommentModal(post)} 
                                onViewPost={handleViewPost}
                                websiteUrl={campaign.websiteUrl} 
                                hasSubscription={hasSubscription}
                            />
                        </div>
                    ))
                ) : (
                     <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-color)]">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Posts Found Yet</h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                            {activeFilters.statuses.length > 0 
                                ? "No posts match your current filters. Try clearing filters or refreshing the campaign."
                                : "This campaign doesn't have any posts yet. The API might have been overloaded or no matching posts were found."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <button 
                                onClick={handleRefreshClick}
                                disabled={isRefreshing}
                                className="bg-[var(--brand-primary)] text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isRefreshing ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Refreshing...</>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Campaign
                                    </>
                                )}
                            </button>
                            {activeFilters.statuses.length > 0 && (
                                <button 
                                    onClick={handleClearFilters}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-4 py-2 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isCommentModalOpen && selectedPost && (
                <CommentModal 
                    post={selectedPost} 
                    onClose={handleCloseCommentModal}
                    onOpenAi={() => {
                        setCommentModalOpen(false);
                        setAiModalOpen(true);
                    }}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onPostContacted={onPostContacted}
                    history={commentHistory[selectedPost.id] || []}
                />
            )}
            {isAiModalOpen && selectedPost && (
                <AiResponseGeneratorModal
                    campaign={campaign}
                    onClose={handleCloseAiModal}
                    onGeneratePreview={handleGeneratePreview}
                    onUseComment={handleUseComment}
                    isGenerating={isGenerating}
                    savedAiStyle={savedAiStyle}
                    onSaveStyle={setSavedAiStyle}
                    preview={previewText}
                />
            )}
             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Campaign"
                message={`Are you sure you want to delete the "${campaign.name}" campaign? This action cannot be undone.`}
                confirmButtonText="Delete"
            />
        </div>
    );
};

export default CampaignPosts;
