import React, { useState, useEffect } from 'react';
import { Campaign, Post, AIStyleSettings } from '../types';
import { StarIcon, FilterIcon, ClockIcon, CloseIcon, LinkIcon, RedditIcon, DiscordIcon, UserIcon, DownloadIcon } from '../constants';
import CommentModal from './CommentModal';
import AiResponseGeneratorModal from './AiResponseGeneratorModal';
import ConfirmationModal from './ConfirmationModal';
import { generateUserProfileSummary } from '../services/geminiService';

// Inlined ProfileSummaryModal component
const ProfileSummaryModal: React.FC<{
    post: Post | null;
    isAnalyzing: boolean;
    onClose: () => void;
}> = ({ post, isAnalyzing, onClose }) => {
    if (!post) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-3">
                    <UserIcon className="w-7 h-7" />
                    Author Profile Summary
                </h2>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg mb-6 max-h-32 overflow-y-auto">
                    <p className="text-sm text-violet-400 font-semibold">{post.sourceName}</p>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{post.title}</h3>
                </div>
                
                <div className="w-full bg-[var(--bg-tertiary)] border border-gray-600 rounded-lg p-4 text-[var(--text-primary)] text-sm min-h-[120px] whitespace-pre-wrap">
                    {isAnalyzing ? (
                        <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Analyzing author's public activity...
                        </div>
                    ) : (
                        post.authorProfileSummary || "No summary available."
                    )}
                </div>
            </div>
        </div>
    );
};

// Inlined PostCard component
const PostCard: React.FC<{ post: Post, onComment: (post: Post) => void, onAnalyzeAuthor: (post: Post) => void, isAnalyzing: boolean }> = ({ post, onComment, onAnalyzeAuthor, isAnalyzing }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const buttonLabel = post.status === 'contacted' ? 'Engaged' : 'Generate Comment';
    const buttonDisabled = post.status === 'contacted';
    
    const relevanceColor = post.relevance > 90 ? 'bg-green-500/20 text-green-300' : post.relevance > 80 ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300';

    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col transition-all duration-300 hover:border-[var(--brand-primary)]/50 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                        {post.source === 'reddit' && <RedditIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />}
                        {post.source === 'discord' && <DiscordIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                        <p className="font-semibold text-[var(--text-primary)] text-opacity-80 truncate">{post.sourceName}</p>
                    </div>
                    <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-full text-sm ${relevanceColor} flex-shrink-0`}>
                        <StarIcon className="w-4 h-4" />
                        <span>{post.relevance}%</span>
                    </div>
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-3 leading-tight">{post.title}</h3>
                <blockquote className="border-l-4 border-violet-500/50 pl-4 my-4 text-violet-200/90 italic text-sm">
                    "{post.painPoint}"
                </blockquote>
                <p className={`text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>{post.content}</p>
                {post.content.length > 200 && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="text-violet-400 text-sm font-semibold mt-3 hover:underline"
                    >
                        {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50">
                 <button 
                    onClick={() => onAnalyzeAuthor(post)}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2 rounded-lg text-sm hover:bg-black/30 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <UserIcon className="w-4 h-4" />
                    {post.authorProfileSummary ? 'View Analysis' : 'Analyze Author'}
                </button>
                <div className="flex items-center gap-3">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-5 py-2 rounded-lg text-sm hover:bg-black/30 dark:hover:bg-white/20 transition-colors">
                        View on {post.source === 'reddit' ? 'Reddit' : 'Discord'}
                    </a>
                     <button 
                        onClick={() => onComment(post)}
                        className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed"
                        disabled={buttonDisabled}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CampaignPostsProps {
    campaign: Campaign;
    posts: Post[];
    onBack: () => void;
    onPostContacted: (postId: number) => void;
    savedAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>;
    setSavedAiStyle: (style: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>) => void;
    onDeleteCampaign: (campaignId: number) => void;
    onRefreshCampaign: (campaignId: number) => Promise<number>;
    onGenerateAiResponse: () => boolean;
    commentHistory: Record<number, string[]>;
    onAddCommentToHistory: (postId: number, comment: string) => void;
    onUpdatePost: (updatedPost: Post) => void;
    showNotification: (type: 'success' | 'error', message: string) => void;
}

const statusOptions: Post['status'][] = ['new', 'contacted'];

const FilterPopover: React.FC<{
    activeStatuses: Post['status'][];
    activeSources: string[];
    availableSources: string[];
    onClose: () => void;
    onApply: (filters: { statuses: Post['status'][]; sources: string[] }) => void;
    onClear: () => void;
}> = ({ activeStatuses, activeSources, availableSources, onClose, onApply, onClear }) => {
    const [tempStatuses, setTempStatuses] = useState<Post['status'][]>(activeStatuses);
    const [tempSources, setTempSources] = useState<string[]>(activeSources);

    const handleStatusChange = (status: Post['status']) => {
        setTempStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    const handleSourceChange = (source: string) => {
        setTempSources(prev => 
            prev.includes(source) 
                ? prev.filter(s => s !== source) 
                : [...prev, source]
        );
    };

    const handleApplyClick = () => {
        onApply({ statuses: tempStatuses, sources: tempSources });
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

                 {availableSources.length > 0 && (
                    <div className="mt-5 border-t border-[var(--border-color)] pt-4 space-y-3">
                        <p className="text-sm font-medium text-[var(--text-secondary)]">By Source</p>
                         <div className="max-h-40 overflow-y-auto pr-2 space-y-3">
                            {availableSources.map(source => (
                                <label key={source} className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={tempSources.includes(source)}
                                        onChange={() => handleSourceChange(source)}
                                        className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-violet-500 focus:ring-offset-0 focus:ring-2 focus:ring-violet-500"
                                    />
                                    <span className="text-[var(--text-primary)] capitalize truncate" title={source}>{source}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}


                <div className="mt-5 border-t border-[var(--border-color)] pt-4">
                     <button onClick={handleApplyClick} className="w-full bg-[var(--brand-primary)] text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">Apply Filters</button>
                </div>
            </div>
        </>
    )
}


const CampaignPosts: React.FC<CampaignPostsProps> = (props) => {
    const { 
        campaign, posts, onBack, onPostContacted, savedAiStyle, setSavedAiStyle, 
        onDeleteCampaign, onRefreshCampaign, onGenerateAiResponse, commentHistory, 
        onAddCommentToHistory, onUpdatePost, showNotification
    } = props;
    
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isCommentModalOpen, setCommentModalOpen] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ statuses: Post['status'][]; sources: string[] }>({ statuses: [], sources: [] });
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshResult, setRefreshResult] = useState<number | null>(null);
    
    // State for Author Profile Analysis
    const [postToAnalyze, setPostToAnalyze] = useState<Post | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleOpenCommentModal = (post: Post) => {
        setSelectedPost(post);
        setCommentText('');
        setCommentModalOpen(true);
    };

    const handleCloseCommentModal = () => {
        setCommentModalOpen(false);
        setSelectedPost(null);
    };

    const handleUseComment = (comment: string) => {
        if (!selectedPost) return;

        onAddCommentToHistory(selectedPost.id, comment);
        setCommentText(comment);
        setAiModalOpen(false);
        setCommentModalOpen(true);
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

    const handleApplyFilters = (filters: { statuses: Post['status'][]; sources: string[] }) => {
        setActiveFilters(filters);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setActiveFilters({ statuses: [], sources: [] });
        setIsFilterOpen(false);
    };

    const handleAnalyzeAuthor = async (post: Post) => {
        if (post.authorProfileSummary) { // If summary exists, just show it
            setPostToAnalyze(post);
            return;
        }

        const canGenerate = onGenerateAiResponse(); // Use an AI credit
        if (!canGenerate) return;
        
        setIsAnalyzing(true);
        setPostToAnalyze(post); // Show modal with loading state

        try {
            const summary = await generateUserProfileSummary(post);
            const updatedPost = { ...post, authorProfileSummary: summary };
            onUpdatePost(updatedPost); // Update post in App state
        } catch (error) {
            showNotification('error', 'Failed to analyze author profile.');
            setPostToAnalyze(null); // Close modal on error
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleExportToCSV = () => {
        const escapeCsvCell = (cellData: any): string => {
            if (cellData === null || cellData === undefined) return '';
            const stringData = String(cellData);
            if (/[",\n]/.test(stringData)) {
                return `"${stringData.replace(/"/g, '""')}"`;
            }
            return stringData;
        };

        let csvContent = "";
        const campaignDetails = [
            ["Campaign Details"],
            ["Name", campaign.name],
            ["Description", campaign.description],
            ["Keywords", campaign.keywords.join(', ')],
            ["Negative Keywords", campaign.negativeKeywords?.join(', ')],
            ["Subreddits", campaign.subreddits?.join(', ')],
            ["Leads Found", campaign.leadsFound],
            ["Contacted", campaign.contacted],
            ["High Potential", campaign.highPotential],
            ["Created At", new Date(campaign.createdAt).toLocaleString()],
            ["Last Refreshed", campaign.lastRefreshed ? new Date(campaign.lastRefreshed).toLocaleString() : 'N/A'],
        ];
        csvContent += campaignDetails.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
        csvContent += "\r\n\r\n";

        const postHeaders = [
            'ID', 'URL', 'Source', 'Source Name', 'Title', 'Content', 
            'Relevance', 'Status', 'Pain Point', 'Author Profile Summary'
        ];
        csvContent += postHeaders.join(',') + '\r\n';

        posts.forEach(post => {
            const row = [
                post.id, post.url, post.source, post.sourceName, post.title, post.content,
                post.relevance, post.status, post.painPoint, post.authorProfileSummary || ''
            ].map(escapeCsvCell).join(',');
            csvContent += row + '\r\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const safeCampaignName = campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const dateStamp = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `salesflow_campaign_${safeCampaignName}_${dateStamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('success', 'Campaign data exported successfully!');
    };

    const availableSources = [...new Set(posts.map(p => p.sourceName))].sort();
    
    const sortedPosts = [...posts].sort((a, b) => b.relevance - a.relevance);

    const filteredPosts = sortedPosts.filter(post => {
        if (activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(post.status)) {
            return false;
        }
        if (activeFilters.sources.length > 0 && !activeFilters.sources.includes(post.sourceName)) {
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
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                     <button 
                        onClick={handleExportToCSV} 
                        className="bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] font-semibold px-4 py-2 rounded-lg hover:bg-black/30 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <DownloadIcon className="w-4 h-4" /> Export CSV
                    </button>
                     <button onClick={handleRefreshClick} disabled={isRefreshing} className="bg-[var(--brand-primary)] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto">
                        {isRefreshing ? (
                             <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Refreshing...</>
                        ) : 'Refresh'}
                    </button>
                     <button onClick={() => setDeleteModalOpen(true)} className="bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors w-full sm:w-auto">Delete Campaign</button>
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
                            activeFilters.statuses.length > 0 || activeFilters.sources.length > 0
                            ? 'bg-violet-500/20 text-violet-300' 
                            : 'bg-black/20 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-black/30 dark:hover:bg-white/20'
                        }`}
                    >
                        <FilterIcon className="w-5 h-5" /> Filter
                    </button>
                    {isFilterOpen && (
                        <FilterPopover 
                           activeStatuses={activeFilters.statuses}
                           activeSources={activeFilters.sources}
                           availableSources={availableSources}
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
                            <PostCard post={post} onComment={() => handleOpenCommentModal(post)} onAnalyzeAuthor={handleAnalyzeAuthor} isAnalyzing={isAnalyzing && postToAnalyze?.id === post.id} />
                        </div>
                    ))
                ) : (
                     <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-color)]">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Posts Found</h3>
                        <p className="text-[var(--text-secondary)]">Try adjusting your filters or refreshing the campaign.</p>
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
                    post={selectedPost}
                    campaign={campaign}
                    onClose={() => setAiModalOpen(false)}
                    onGenerateAiResponse={onGenerateAiResponse}
                    onUseComment={handleUseComment}
                    savedAiStyle={savedAiStyle}
                    onSaveStyle={setSavedAiStyle}
                />
            )}
            <ProfileSummaryModal 
                post={postToAnalyze}
                isAnalyzing={isAnalyzing}
                onClose={() => setPostToAnalyze(null)}
            />
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