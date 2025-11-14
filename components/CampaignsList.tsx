import React, { useState } from 'react';
import { Campaign } from '../types';
import { RedditIcon, TwitterIcon, TrashIcon } from '../constants';
import ConfirmationModal from './ConfirmationModal';

interface CampaignsListProps {
    campaigns: Campaign[];
    onCreateCampaign: () => void;
    onViewPosts: (campaignId: number) => void;
    onDeleteCampaign: (campaignId: number) => void;
}

const CampaignCard: React.FC<{ campaign: Campaign; onViewPosts: (id: number) => void; onDelete: (campaign: Campaign) => void }> = ({ campaign, onViewPosts, onDelete }) => {
    return (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between hover:border-violet-500/50 transition-all duration-300 relative hover:-translate-y-1">
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(campaign); }}
                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors z-10 p-1"
                aria-label="Delete campaign"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            <div>
                <div className="flex justify-between items-start gap-4 mb-4 pr-8">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] line-clamp-2">{campaign.name}</h3>
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full uppercase flex-shrink-0">{campaign.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{campaign.leadsFound}</p>
                        <p className="text-sm text-[var(--text-secondary)]">Leads Found</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{campaign.highPotential}</p>
                        <p className="text-sm text-[var(--text-secondary)]">High Potential</p>
                    </div>
                     <div>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{campaign.contacted}</p>
                        <p className="text-sm text-[var(--text-secondary)]">Contacted</p>
                    </div>
                </div>
                <p className="text-[var(--text-primary)] text-sm mb-4 line-clamp-2">{campaign.description}</p>

                <div className="mb-4">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Lead Sources</p>
                    <div className="flex flex-wrap gap-2">
                        {campaign.leadSources.map(source => (
                            <span key={source} className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5">
                                {source === 'reddit' && <RedditIcon className="w-4 h-4 text-orange-500"/>}
                                {source === 'twitter' && <TwitterIcon className="w-4 h-4 text-sky-400"/>}
                                {source.charAt(0).toUpperCase() + source.slice(1)}
                            </span>
                        ))}
                    </div>
                </div>
                
                {campaign.subreddits && campaign.subreddits.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Target Subreddits</p>
                        <div className="flex flex-wrap gap-2">
                            {campaign.subreddits.map(sub => (
                                <span key={sub} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                    <RedditIcon className="w-3 h-3"/>r/{sub}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                            {campaign.keywords.slice(0, 5).map(kw => (
                                <span key={kw} className="bg-violet-500/20 text-violet-300 text-xs font-medium px-2 py-1 rounded-full">{kw}</span>
                            ))}
                        </div>
                    </div>
                    {campaign.negativeKeywords && campaign.negativeKeywords.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">Negative Keywords</p>
                            <div className="flex flex-wrap gap-2">
                                {campaign.negativeKeywords.slice(0, 5).map(kw => (
                                    <span key={kw} className="bg-red-500/20 text-red-300 text-xs font-medium px-2 py-1 rounded-full">{kw}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button 
                onClick={() => onViewPosts(campaign.id)}
                className="w-full bg-violet-500/80 text-white font-semibold py-3 rounded-lg hover:bg-[var(--brand-primary)] transition-colors mt-auto"
            >
                View Posts
            </button>
        </div>
    );
};

const CampaignsList: React.FC<CampaignsListProps> = ({ campaigns, onCreateCampaign, onViewPosts, onDeleteCampaign }) => {
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

    const handleConfirmDelete = () => {
        if (campaignToDelete) {
            onDeleteCampaign(campaignToDelete.id);
            setCampaignToDelete(null);
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Campaigns</h1>
                <button 
                    onClick={onCreateCampaign}
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                    + Create Campaign
                </button>
            </div>
            
            {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
                    {campaigns.map((campaign, index) => (
                        <div key={campaign.id} style={{ animationDelay: `${index * 100}ms` }}>
                            <CampaignCard campaign={campaign} onViewPosts={onViewPosts} onDelete={setCampaignToDelete}/>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">
                     <h3 className="text-xl font-semibold mb-2">No Campaigns Yet</h3>
                     <p className="text-[var(--text-secondary)] mb-6">Start by creating a new campaign to find your leads.</p>
                     <button 
                        onClick={onCreateCampaign}
                        className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity"
                    >
                        Create Your First Campaign
                    </button>
                </div>
            )}
            <ConfirmationModal 
                isOpen={!!campaignToDelete}
                onClose={() => setCampaignToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Campaign"
                message={`Are you sure you want to delete the "${campaignToDelete?.name}" campaign? This action cannot be undone.`}
                confirmButtonText="Delete"
            />
        </div>
    );
};

export default CampaignsList;
