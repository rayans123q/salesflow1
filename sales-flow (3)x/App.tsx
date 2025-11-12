import React, { useState, useCallback, useEffect } from 'react';
import { Page, Campaign, Post, AIStyleSettings, Theme, User, RedditCredentials } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CampaignsList from './components/CampaignsList';
import CampaignCreator from './components/CampaignCreator';
import FindingLeads from './components/FindingLeads';
import CampaignPosts from './components/CampaignPosts';
import Settings from './components/Settings';
import Notification from './components/Notification';
import { findLeads } from './services/geminiService';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import ConfirmationModal from './components/ConfirmationModal';
import OnboardingTour from './components/OnboardingTour';

const CAMPAIGNS_STORAGE_KEY = 'salesflow_campaigns';
const POSTS_STORAGE_KEY = 'salesflow_posts';
const AI_STYLE_STORAGE_KEY = 'salesflow_ai_style';
const THEME_STORAGE_KEY = 'salesflow_theme';
const USAGE_STORAGE_KEY = 'salesflow_usage';
const COMMENT_HISTORY_STORAGE_KEY = 'salesflow_comment_history';
const USER_STORAGE_KEY = 'salesflow_user';
const ONBOARDING_KEY = 'salesflow_onboarding_complete';
const REDDIT_CREDS_STORAGE_KEY = 'salesflow_reddit_creds';


const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem(USER_STORAGE_KEY);
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error('Failed to load user from localStorage:', error);
            return null;
        }
    });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const isLoggedIn = !!user;

    const [page, setPage] = useState<Page>('DASHBOARD');
    
    const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
        try {
            const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load campaigns from localStorage:', error);
            return [];
        }
    });

    const [posts, setPosts] = useState<Post[]>(() => {
        try {
            const saved = localStorage.getItem(POSTS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load posts from localStorage:', error);
            return [];
        }
    });

    const [commentHistory, setCommentHistory] = useState<Record<number, string[]>>(() => {
        try {
            const saved = localStorage.getItem(COMMENT_HISTORY_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load comment history from localStorage:', error);
            return {};
        }
    });

    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [findingLeadsCampaign, setFindingLeadsCampaign] = useState<Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'> | null>(null);
    const [isClearDataModalOpen, setClearDataModalOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'dark';
    });
    
    const [redditCreds, setRedditCreds] = useState<RedditCredentials | null>(() => {
        try {
            const saved = localStorage.getItem(REDDIT_CREDS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Failed to load Reddit credentials from localStorage:', error);
            return null;
        }
    });

    const [limits] = useState({ campaigns: 10, refreshes: 50, aiResponses: 250 });
    const [usage, setUsage] = useState(() => {
        try {
            const saved = localStorage.getItem(USAGE_STORAGE_KEY);
            return saved ? JSON.parse(saved) : { campaigns: 0, refreshes: 0, aiResponses: 0 };
        } catch {
            return { campaigns: 0, refreshes: 0, aiResponses: 0 };
        }
    });

    const defaultAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'> = {
        tone: 'Friendly & Warm',
        salesApproach: 'Moderate',
        length: 'Medium',
        includeWebsiteLink: true,
    };

    const [savedAiStyle, setSavedAiStyle] = useState<Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>>(() => {
        try {
            const saved = localStorage.getItem(AI_STYLE_STORAGE_KEY);
            return saved ? JSON.parse(saved) : defaultAiStyle;
        } catch (error) {
            console.error('Failed to load AI style from localStorage:', error);
            return defaultAiStyle;
        }
    });

    useEffect(() => localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns)), [campaigns]);
    useEffect(() => localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts)), [posts]);
    useEffect(() => localStorage.setItem(AI_STYLE_STORAGE_KEY, JSON.stringify(savedAiStyle)), [savedAiStyle]);
    useEffect(() => localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage)), [usage]);
    useEffect(() => localStorage.setItem(COMMENT_HISTORY_STORAGE_KEY, JSON.stringify(commentHistory)), [commentHistory]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, [user]);
    
    useEffect(() => {
        if (redditCreds) {
            localStorage.setItem(REDDIT_CREDS_STORAGE_KEY, JSON.stringify(redditCreds));
        } else {
            localStorage.removeItem(REDDIT_CREDS_STORAGE_KEY);
        }
    }, [redditCreds]);

    useEffect(() => {
        setUsage(prev => ({ ...prev, campaigns: campaigns.length }));
    }, [campaigns.length]);

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const handleLogin = () => {
        setShowLoginModal(true);
    };

    const handlePerformLogin = (name: string) => {
        const newUser = { name };
        setUser(newUser);
        setShowLoginModal(false);

        const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }
    }
    
    const handleOnboardingComplete = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    };

    const handleLogout = () => {
        setUser(null);
        setPage('DASHBOARD'); // Reset to default page on logout
    };

    const handleToggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({type, message});
    }, []);

    const handleExportData = () => {
        const dataToExport = {
            user,
            campaigns,
            posts,
            savedAiStyle,
            usage,
            commentHistory,
            theme,
            redditCreds,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `salesflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showNotification('success', 'Data exported successfully!');
    };
    
    const handleClearAllData = () => {
        // Clear state
        setCampaigns([]);
        setPosts([]);
        setCommentHistory({});
        setSavedAiStyle(defaultAiStyle);
        setRedditCreds(null);
        setUsage({ campaigns: 0, refreshes: 0, aiResponses: 0 });
        
        // Clear localStorage for app data, but leave user and theme
        localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
        localStorage.removeItem(POSTS_STORAGE_KEY);
        localStorage.removeItem(AI_STYLE_STORAGE_KEY);
        localStorage.removeItem(USAGE_STORAGE_KEY);
        localStorage.removeItem(COMMENT_HISTORY_STORAGE_KEY);
        localStorage.removeItem(REDDIT_CREDS_STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_KEY); // Also clear onboarding status
        
        setClearDataModalOpen(false);
        showNotification('success', 'All application data has been cleared.');
        setPage('DASHBOARD'); // Go to a safe page
    };


    const handleCreateCampaign = async (newCampaignData: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>) => {
        if (usage.campaigns >= limits.campaigns) {
            showNotification('error', `Campaign limit reached (${limits.campaigns}/${limits.campaigns}).`);
            setPage('CAMPAIGNS');
            return;
        }
        
        setFindingLeadsCampaign(newCampaignData);
        setPage('FINDING_LEADS');
        
        const tempCampaignId = (campaigns[campaigns.length - 1]?.id ?? 0) + 1;
        
        try {
            const generatedPosts = await findLeads(newCampaignData);

            const newPosts: Post[] = generatedPosts.map((p, index) => ({
                ...p,
                id: (posts[posts.length - 1]?.id ?? 0) + index + 1,
                campaignId: tempCampaignId,
                status: 'new',
            }));
            
            const newCampaign: Campaign = {
                id: tempCampaignId,
                ...newCampaignData,
                status: 'active',
                leadsFound: newPosts.length,
                highPotential: newPosts.filter(p => p.relevance > 95).length,
                contacted: 0,
                createdAt: new Date().toISOString(),
                lastRefreshed: new Date().toISOString(),
            };

            setCampaigns(prev => [...prev, newCampaign]);
            setPosts(prev => [...prev, ...newPosts]);
            setPage('CAMPAIGNS');
            showNotification('success', `Campaign "${newCampaign.name}" created successfully!`);

        } catch (error) {
            console.error("Failed to find leads:", error);
            showNotification('error', `Failed to find posts. Please try again.`);
            setPage('CREATE_CAMPAIGN');
        } finally {
            setFindingLeadsCampaign(null);
        }
    };

    const handleDeleteCampaign = (campaignId: number) => {
        const campaignToDelete = campaigns.find(c => c.id === campaignId);
        if (campaignToDelete) {
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            setPosts(prev => prev.filter(p => p.campaignId !== campaignId));
            showNotification('success', `Campaign "${campaignToDelete.name}" deleted.`);
            if (page === 'CAMPAIGN_POSTS' && selectedCampaignId === campaignId) {
                setPage('CAMPAIGNS');
            }
        }
    };
    
    const handleRefreshCampaign = async (campaignId: number): Promise<number> => {
        if (usage.refreshes >= limits.refreshes) {
            showNotification('error', `Refresh limit reached (${limits.refreshes}/${limits.refreshes}).`);
            return 0;
        }

        const campaignToRefresh = campaigns.find(c => c.id === campaignId);
        if (!campaignToRefresh) {
            showNotification('error', 'Campaign not found.');
            return 0;
        }
        
        setUsage(prev => ({...prev, refreshes: prev.refreshes + 1}));

        try {
            const { id, status, leadsFound, highPotential, contacted, createdAt, lastRefreshed, ...campaignData } = campaignToRefresh;
            const generatedPosts = await findLeads(campaignData);

            const existingPostUrls = new Set(posts.filter(p => p.campaignId === campaignId).map(p => p.url));
            const newPostsFromApi = generatedPosts.filter(p => !existingPostUrls.has(p.url));

            if (newPostsFromApi.length === 0) {
                showNotification('success', 'No new posts found.');
                setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, lastRefreshed: new Date().toISOString() } : c));
                return 0;
            }

            const newPosts: Post[] = newPostsFromApi.map((p, index) => ({
                ...p,
                id: (posts[posts.length - 1]?.id ?? 0) + index + 1,
                campaignId: campaignId,
                status: 'new',
            }));

            setPosts(prev => [...prev, ...newPosts]);
            setCampaigns(prev => prev.map(c => {
                if (c.id === campaignId) {
                    return {
                        ...c,
                        leadsFound: c.leadsFound + newPosts.length,
                        highPotential: c.highPotential + newPosts.filter(p => p.relevance > 95).length,
                        lastRefreshed: new Date().toISOString(),
                    };
                }
                return c;
            }));
            
            showNotification('success', `${newPosts.length} new posts found for "${campaignToRefresh.name}".`);
            return newPosts.length;
        } catch (error) {
            console.error("Failed to refresh campaign:", error);
            showNotification('error', `Failed to refresh campaign. Please try again.`);
            throw error;
        }
    };
    
    const handleViewPosts = useCallback((campaignId: number) => {
        setSelectedCampaignId(campaignId);
        setPage('CAMPAIGN_POSTS');
    }, []);

    const markPostAsContacted = (postId: number) => {
        setPosts(prevPosts => {
            const newPosts: Post[] = prevPosts.map(p => p.id === postId ? { ...p, status: 'contacted' } : p);
            const post = prevPosts.find(p => p.id === postId); 
            if(post && post.status !== 'contacted') {
                 setCampaigns(prevCampaigns => prevCampaigns.map(c => 
                    c.id === post.campaignId ? { ...c, contacted: c.contacted + 1 } : c
                ));
            }
            return newPosts;
        });
    }

    const handleGenerateAiResponse = (): boolean => {
        if (usage.aiResponses >= limits.aiResponses) {
            showNotification('error', `AI response limit reached (${limits.aiResponses}/${limits.aiResponses}).`);
            return false;
        }
        setUsage(prev => ({ ...prev, aiResponses: prev.aiResponses + 1 }));
        showNotification('success', `AI response used (${usage.aiResponses + 1}/${limits.aiResponses}).`);
        return true;
    };

    const handleAddCommentToHistory = (postId: number, comment: string) => {
        setCommentHistory(prev => {
            const newHistory = { ...prev };
            const postHistory = newHistory[postId] || [];
            if (!postHistory.includes(comment)) {
                // Add to the beginning so newest is first. Limit history to 10 per post.
                newHistory[postId] = [comment, ...postHistory].slice(0, 10);
            }
            return newHistory;
        });
    };
    
    const handleUpdatePost = (updatedPost: Post) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const renderPage = () => {
        const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

        switch (page) {
            case 'DASHBOARD':
                return <Dashboard campaigns={campaigns} posts={posts} onCreateCampaign={() => setPage('CREATE_CAMPAIGN')} />;
            case 'CAMPAIGNS':
                return <CampaignsList campaigns={campaigns} onCreateCampaign={() => setPage('CREATE_CAMPAIGN')} onViewPosts={handleViewPosts} onDeleteCampaign={handleDeleteCampaign} />;
            case 'SETTINGS':
                return <Settings 
                            theme={theme} 
                            onToggleTheme={handleToggleTheme}
                            onLogout={handleLogout}
                            user={user}
                            setUser={setUser}
                            savedAiStyle={savedAiStyle}
                            setSavedAiStyle={setSavedAiStyle}
                            redditCreds={redditCreds}
                            setRedditCreds={setRedditCreds}
                            onExportData={handleExportData}
                            onClearAllData={() => setClearDataModalOpen(true)}
                        />;
            case 'CREATE_CAMPAIGN':
                return <CampaignCreator 
                            onBack={() => setPage('DASHBOARD')} 
                            onCreate={handleCreateCampaign}
                        />;
            case 'FINDING_LEADS':
                return <FindingLeads campaignData={findingLeadsCampaign} />;
            case 'CAMPAIGN_POSTS':
                if (selectedCampaign) {
                     return <CampaignPosts 
                                campaign={selectedCampaign} 
                                posts={posts.filter(p => p.campaignId === selectedCampaignId)} 
                                onBack={() => setPage('CAMPAIGNS')}
                                onPostContacted={markPostAsContacted}
                                savedAiStyle={savedAiStyle}
                                setSavedAiStyle={setSavedAiStyle}
                                onDeleteCampaign={handleDeleteCampaign}
                                onRefreshCampaign={handleRefreshCampaign}
                                onGenerateAiResponse={handleGenerateAiResponse}
                                commentHistory={commentHistory}
                                onAddCommentToHistory={handleAddCommentToHistory}
                                onUpdatePost={handleUpdatePost}
                                showNotification={showNotification}
                            />;
                }
                setPage('CAMPAIGNS'); // Fallback
                return null;
            default:
                return <Dashboard campaigns={campaigns} posts={posts} onCreateCampaign={() => setPage('CREATE_CAMPAIGN')} />;
        }
    };

    if (!isLoggedIn) {
        return (
            <>
                <LandingPage onLogin={handleLogin} />
                <LoginModal 
                    isOpen={showLoginModal} 
                    onClose={() => setShowLoginModal(false)}
                    onLogin={handlePerformLogin}
                />
            </>
        )
    }

    return (
        <div className="md:flex md:h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
            <Sidebar currentPage={page} setPage={setPage} usage={usage} limits={limits} user={user} />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                <Notification notification={notification} onClose={() => setNotification(null)} />
                 <ConfirmationModal
                    isOpen={isClearDataModalOpen}
                    onClose={() => setClearDataModalOpen(false)}
                    onConfirm={handleClearAllData}
                    title="Clear All Data"
                    message="Are you sure you want to delete all campaigns, posts, and settings? This action is irreversible."
                    confirmButtonText="Yes, Clear Everything"
                />
                <div key={page} className="animate-page-enter">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;