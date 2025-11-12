import React from 'react';
import { Page, User } from '../types';
import { DashboardIcon, CampaignIcon, SettingsIcon } from '../constants';

interface SidebarProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    usage: { campaigns: number; refreshes: number; aiResponses: number };
    limits: { campaigns: number; refreshes: number; aiResponses: number };
    user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, usage, limits, user }) => {
    const navItems: { page: Page; label: string; icon: React.ReactNode, id: string }[] = [
        { page: 'DASHBOARD', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6 mb-1 md:w-5 md:h-5 md:mb-0" />, id: 'sidebar-dashboard-btn' },
        { page: 'CAMPAIGNS', label: 'Campaigns', icon: <CampaignIcon className="w-6 h-6 mb-1 md:w-5 md:h-5 md:mb-0" />, id: 'sidebar-campaigns-btn' },
        { page: 'SETTINGS', label: 'Settings', icon: <SettingsIcon className="w-6 h-6 mb-1 md:w-5 md:h-5 md:mb-0" />, id: 'sidebar-settings-btn' },
    ];

    const getInitials = (name: string | undefined): string => {
        if (!name) return '...';
        const parts = name.trim().split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <aside className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] 
                         md:relative md:w-64 md:h-screen md:flex md:flex-col md:p-4 md:border-r md:border-t-0">
            <div className="hidden md:block text-2xl font-bold text-[var(--text-primary)] mb-10">Sales Flow</div>
            <nav className="h-full md:flex-1">
                <ul className="flex items-center justify-around h-full md:flex-col md:items-stretch md:justify-start">
                    {navItems.map(item => (
                        <li key={item.page} className="h-full md:h-auto md:mb-2">
                            <button
                                id={item.id}
                                onClick={() => setPage(item.page)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-colors duration-200 w-24 h-full
                                    md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:py-2 md:text-left
                                    ${
                                    currentPage === item.page
                                        ? 'text-[var(--brand-secondary)] md:bg-[var(--brand-primary)] md:text-white md:shadow-lg'
                                        : 'text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {item.icon}
                                <span className="text-xs font-medium md:text-base">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="hidden md:block mt-auto">
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(user?.name)}
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--text-primary)] truncate">{user?.name || 'Guest'}</p>
                            <p className="text-sm text-[var(--text-secondary)]">Starter</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg text-sm">
                    <p className="text-[var(--text-secondary)] mb-2">Usage</p>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Campaigns</span>
                            <span className="font-mono text-[var(--text-primary)]">{usage.campaigns}/{limits.campaigns}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Refreshes</span>
                            <span className="font-mono text-[var(--text-primary)]">{usage.refreshes}/{limits.refreshes}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>AI Responses</span>
                            <span className="font-mono text-[var(--text-primary)]">{usage.aiResponses}/{limits.aiResponses}</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;