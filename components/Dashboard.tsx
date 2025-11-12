import React from 'react';
import { Campaign, Post } from '../types';
import { SearchIcon, StarIcon, PostIcon, ContactIcon } from '../constants';

interface DashboardProps {
    campaigns: Campaign[];
    posts: Post[];
    onCreateCampaign: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start">
            <span className="text-[var(--text-secondary)]">{title}</span>
            <div className="text-[var(--brand-secondary)]">{icon}</div>
        </div>
        <p className="text-4xl font-bold mt-4 text-[var(--text-primary)]">{value}</p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ campaigns, posts, onCreateCampaign }) => {
    const totalFoundPosts = campaigns.reduce((acc, c) => acc + c.leadsFound, 0);
    const totalContacted = campaigns.reduce((acc, c) => acc + c.contacted, 0);
    const totalHighPotential = campaigns.reduce((acc, c) => acc + c.highPotential, 0);

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                <button 
                    id="create-campaign-btn"
                    onClick={onCreateCampaign}
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                    + New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Found Posts" value={totalFoundPosts} icon={<PostIcon className="w-6 h-6" />} />
                <StatCard title="Contacted Leads" value={totalContacted} icon={<ContactIcon className="w-6 h-6" />} />
                <StatCard title="High Potential" value={totalHighPotential} icon={<StarIcon className="w-6 h-6" />} />
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">High Potential Posts</h2>
                </div>

                {campaigns.length === 0 ? (
                    <div className="text-center py-10 sm:py-16">
                        <SearchIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] mb-4" />
                        <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No high potential posts found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">Create your first campaign to start finding leads</p>
                        <button 
                            onClick={onCreateCampaign}
                            className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition-opacity"
                        >
                            Create Campaign
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.filter(p => p.relevance > 95).slice(0, 3).map(post => (
                             <div key={post.id} className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--text-secondary)]">{post.sourceName}</p>
                                <p className="font-semibold text-[var(--text-primary)]">{post.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
