import React, { useState, useCallback, useEffect } from 'react';
import { Page, Campaign, Post, AIStyleSettings, Theme, RedditCredentials, User, Subscription } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CampaignsList from './components/CampaignsList';
import CampaignCreator from './components/CampaignCreator';
import FindingLeads from './components/FindingLeads';
import CampaignPosts from './components/CampaignPosts';
import Settings from './components/Settings';
import AdminDashboard from './components/AdminDashboard';
import Notification from './components/Notification';
import SubscriptionBanner from './components/SubscriptionBanner';
import { findLeads } from './services/geminiService';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import ConfirmationModal from './components/ConfirmationModal';
import OnboardingTour from './components/OnboardingTour';
import PaymentGate from './components/PaymentGate';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import { whopService } from './services/whopService';
import { visitorTrackingService } from './services/visitorTrackingService';

// Keep theme in localStorage for immediate access before user loads
const THEME_STORAGE_KEY = 'salesflow_theme';
const ONBOARDING_KEY = 'salesflow_onboarding_complete';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true to check session
    const [isInitializing, setIsInitializing] = useState(true);
    const isLoggedIn = !!user;

    const [page, setPage] = useState<Page>('DASHBOARD');
    
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [commentHistory, setCommentHistory] = useState<Record<number, string[]>>({});
    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [findingLeadsCampaign, setFindingLeadsCampaign] = useState<Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'> | null>(null);
    const [isClearDataModalOpen, setClearDataModalOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasSubscription, setHasSubscription] = useState(false);
    const [showPaymentGate, setShowPaymentGate] = useState(false);
    const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(true);

    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'dark';
    });

    const [redditCreds, setRedditCreds] = useState<RedditCredentials | null>(null);
    const [subscription, setSubscription] = useState<Subscription>({ subscribed: false, status: 'inactive' });

    const [limits] = useState({ campaigns: 10, refreshes: 50, aiResponses: 250 });
    const [usage, setUsage] = useState({ campaigns: 0, refreshes: 0, aiResponses: 0 });

    const defaultAiStyle: Omit<AIStyleSettings, 'customOffer' | 'saveStyle'> = {
        tone: 'Friendly & Warm',
        salesApproach: 'Moderate',
        length: 'Medium',
        includeWebsiteLink: true,
    };

    const [savedAiStyle, setSavedAiStyle] = useState<Omit<AIStyleSettings, 'customOffer' | 'saveStyle'>>(defaultAiStyle);

    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({type, message});
    }, []);

    // Check for existing session and listen for auth state changes
    useEffect(() => {
        // Initialize app - check session and setup auth listener
        const initializeApp = async () => {
            try {
                // Check if we're coming back from OAuth (hash contains access_token)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                
                if (accessToken) {
                    console.log('🔑 OAuth callback detected, setting session...');
                    
                    // Set the session from OAuth tokens (non-blocking)
                    supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    }).then(({ data, error }) => {
                        if (error) {
                            console.error('❌ Failed to set session:', error);
                        } else {
                            console.log('✅ Session set successfully:', data.user?.email);
                        }
                    }).catch(err => {
                        console.error('❌ Error setting session:', err);
                    });
                    
                    // Immediately redirect to clean URL (don't wait for session)
                    console.log('🔄 Redirecting to clean URL...');
                    setTimeout(() => {
                        window.location.href = window.location.origin;
                    }, 500); // Small delay to ensure session is being set
                    return; // Stop further execution
                }
                
                // Check session with timeout (increased to 5 seconds for OAuth)
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 5000)
                );
                const sessionPromise = supabase.auth.getSession();
                const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
                const session = result?.data?.session;
                
                console.log('🔍 Initial session check:', session ? `User: ${session.user.email}` : 'No session');
                
                if (session?.user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id, name, email, role')
                        .eq('id', session.user.id)
                        .single();

                    if (userData) {
                        setUser(userData);
                        
                        // Grant access to all users (payment gate disabled)
                        setHasSubscription(true);
                        setShowPaymentGate(false);
                    } else {
                        const newUser = {
                            id: session.user.id,
                            name: session.user.user_metadata?.name || 'User',
                            email: session.user.email,
                            role: 'user',
                        };
                        setUser(newUser);
                        
                        // Grant access to all users (payment gate disabled)
                        setHasSubscription(true);
                        setShowPaymentGate(false);
                    }
                }
            } catch (error) {
                console.log('Session check skipped');
            } finally {
                setIsInitializing(false);
                setIsLoading(false);
            }
        };

        initializeApp();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔔 Auth event:', event, 'User:', session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
                const newUser = {
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email,
                    role: 'user',
                };
                
                // Set user state immediately (non-blocking)
                setUser(newUser);
                setIsInitializing(false); // Make sure we're not in initializing state
                console.log('✅ User set:', newUser.email);
                
                // Check subscription status in background (non-blocking)
                (async () => {
                    try {
                        const hasActive = await whopService.hasActiveSubscription(newUser.email!);
                        setHasSubscription(hasActive);
                        console.log('💳 Subscription check:', hasActive ? 'ACTIVE' : 'INACTIVE');
                    } catch (error) {
                        console.error('Failed to check subscription:', error);
                        setHasSubscription(false);
                    }
                })();
                
                setShowPaymentGate(false);
                
                // Ensure user exists in database (BLOCKING - must complete before user can create campaigns)
                (async () => {
                    try {
                        console.log('👤 Ensuring user exists in database:', newUser.email);
                        
                        // Check if user exists
                        const { data: existingUser, error: checkError } = await supabase
                            .from('users')
                            .select('id')
                            .eq('id', newUser.id)
                            .single();
                        
                        if (checkError && checkError.code === 'PGRST116') {
                            // User doesn't exist, create them
                            console.log('➕ Creating new user in database...');
                            const { error: insertError } = await supabase
                                .from('users')
                                .insert({
                                    id: newUser.id,
                                    email: newUser.email,
                                    name: newUser.name,
                                    role: 'user',
                                    created_at: new Date().toISOString(),
                                });
                            
                            if (insertError) {
                                console.error('❌ Failed to create user:', insertError);
                                // Retry once if it fails
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                const { error: retryError } = await supabase
                                    .from('users')
                                    .insert({
                                        id: newUser.id,
                                        email: newUser.email,
                                        name: newUser.name,
                                        role: 'user',
                                        created_at: new Date().toISOString(),
                                    });
                                if (retryError) {
                                    console.error('❌ Retry failed:', retryError);
                                } else {
                                    console.log('✅ User created successfully on retry');
                                }
                            } else {
                                console.log('✅ User created successfully in database');
                            }
                        } else if (existingUser) {
                            console.log('✅ User already exists in database');
                        }
                    } catch (error) {
                        console.error('❌ Error ensuring user exists:', error);
                    }
                })();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setHasSubscription(false);
                setShowPaymentGate(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Handle URL-based routing for /admin path
    useEffect(() => {
        const handleUrlChange = () => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/admin')) {
                if (user?.role === 'admin') {
                    setPage('ADMIN');
                } else if (isLoggedIn) {
                    // Non-admin users trying to access /admin get redirected to dashboard
                    window.history.replaceState({}, '', '/');
                    setPage('DASHBOARD');
                }
            }
        };

        // Check URL on mount and when user changes
        handleUrlChange();

        // Listen for popstate events (back/forward button)
        window.addEventListener('popstate', handleUrlChange);
        return () => window.removeEventListener('popstate', handleUrlChange);
    }, [user?.role, isLoggedIn]);

    // Sync page state to URL
    useEffect(() => {
        if (page === 'ADMIN' && user?.role === 'admin') {
            window.history.pushState({}, '', '/admin');
        } else if (page === 'DASHBOARD') {
            window.history.pushState({}, '', '/');
        }
    }, [page, user?.role]);

    // Load user data from Supabase when user logs in
    useEffect(() => {
        if (!user?.id) {
            // Clear data when user logs out
            setCampaigns([]);
            setPosts([]);
            setCommentHistory({});
            setSavedAiStyle(defaultAiStyle);
            setUsage({ campaigns: 0, refreshes: 0, aiResponses: 0 });
            setRedditCreds(null);
            setSubscription({ subscribed: false, status: 'inactive' });
            return;
        }

        const loadUserData = async () => {
            setIsLoading(true);
            try {
                // Load campaigns, posts, settings, and comment history in parallel
                const [campaignsData, postsData, settingsData, commentHistoryData] = await Promise.all([
                    databaseService.getCampaigns(user.id!),
                    databaseService.getPosts(user.id!),
                    databaseService.getUserSettings(user.id!),
                    databaseService.getCommentHistory(user.id!),
                ]);

                setCampaigns(campaignsData);
                setPosts(postsData);
                setTheme(settingsData.theme);
                setSavedAiStyle(settingsData.aiStyle);
                setRedditCreds(settingsData.redditCreds);
                setSubscription(settingsData.subscription);
                setUsage(settingsData.usage);
                setCommentHistory(commentHistoryData);
        } catch (error) {
                console.error('Failed to load user data:', error);
                showNotification('error', 'Failed to load data from database.');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [user?.id, showNotification]);

    // Periodic subscription check disabled - free access for all users

    // Handle onboarding when subscription becomes active
    useEffect(() => {
        if (hasSubscription && user?.id && !showPaymentGate) {
            const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
            if (!hasOnboarded) {
                setShowOnboarding(true);
            }
        }
    }, [hasSubscription, user?.id, showPaymentGate]);

    // Track visitor analytics
    useEffect(() => {
        const trackVisitor = async () => {
            try {
                await visitorTrackingService.trackPageVisit(user?.id);
            } catch (error) {
                console.error('Failed to track visitor:', error);
            }
        };

        trackVisitor();
    }, [user?.id]);

    // Update usage when campaigns change
    useEffect(() => {
        if (user?.id) {
            databaseService.updateUserSettings(user.id, {
                usage: { campaigns: campaigns.length }
            }).catch(err => console.error('Failed to update usage:', err));
        }
        setUsage(prev => ({ ...prev, campaigns: campaigns.length }));
    }, [campaigns.length, user?.id]);

    // Update theme in localStorage and Supabase
    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        if (user?.id) {
            databaseService.updateUserSettings(user.id, { theme }).catch(err => console.error('Failed to update theme:', err));
        }
    }, [theme, user?.id]);

    const handleLogin = () => {
        setShowLoginModal(true);
    };

    const handlePerformLogin = async (userData: { id: string; email: string; name: string }) => {
        try {
            console.log('📞 handlePerformLogin called with user:', userData.email);
            // Just close the modal and show success
            // The onAuthStateChange listener will handle setting user and checking subscription
            setShowLoginModal(false);
            showNotification('success', 'Successfully signed in!');
            console.log('✅ Login modal closed and notification shown');
        } catch (error) {
            console.error('Failed to login:', error);
            showNotification('error', 'Failed to login. Please try again.');
        }
    }
    
    // Handle payment success redirect
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment');
        
        if (paymentSuccess === 'success') {
            // Clear URL parameter
            window.history.replaceState({}, '', '/');
            
            if (user?.id) {
                // User is logged in, verify subscription
                showNotification('success', 'Payment successful! Verifying your subscription...');
                
                setTimeout(async () => {
                    const hasActive = await whopService.hasActiveSubscription(user.id);
                    setHasSubscription(hasActive);
                    setShowPaymentGate(!hasActive);
                    
                    if (hasActive) {
                        showNotification('success', 'Welcome to Sales Flow! Your subscription is active.');
                        
                        // Show onboarding if first time
                        const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
                        if (!hasOnboarded) {
                            setShowOnboarding(true);
                        }
                    }
                }, 1500);
            } else {
                // User not logged in, show login modal
                showNotification('success', 'Payment successful! Please log in to access your subscription.');
                setShowLoginModal(true);
            }
        }
    }, [user?.id, showNotification]);
    
    const handleOnboardingComplete = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
                showNotification('error', 'Failed to sign out. Please try again.');
            } else {
                setUser(null);
                setPage('DASHBOARD'); // Reset to default page on logout
                showNotification('success', 'Successfully signed out!');
            }
        } catch (error) {
            console.error('Error signing out:', error);
            showNotification('error', 'Failed to sign out. Please try again.');
        }
    };

    const handleToggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (user?.id) {
            try {
                await databaseService.updateUserSettings(user.id, { theme: newTheme });
            } catch (error) {
                console.error('Failed to update theme:', error);
            }
        }
    };

    const handleExportData = () => {
        const dataToExport = {
            user,
            campaigns,
            posts,
            savedAiStyle,
            usage,
            commentHistory,
            redditCreds,
            theme,
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
    
    const handleClearAllData = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            // Delete all campaigns (posts and comment history will be deleted via CASCADE)
            const userCampaigns = await databaseService.getCampaigns(user.id);
            await Promise.all(userCampaigns.map(c => databaseService.deleteCampaign(c.id)));
            
            // Reset settings
            await databaseService.updateUserSettings(user.id, {
                aiStyle: defaultAiStyle,
                redditCreds: null,
                usage: { campaigns: 0, refreshes: 0, aiResponses: 0 },
            });
            
        // Clear state
        setCampaigns([]);
        setPosts([]);
        setCommentHistory({});
        setSavedAiStyle(defaultAiStyle);
        setUsage({ campaigns: 0, refreshes: 0, aiResponses: 0 });
        setRedditCreds(null);
        
        setClearDataModalOpen(false);
        showNotification('success', 'All application data has been cleared.');
            setPage('DASHBOARD');
        } catch (error) {
            console.error('Failed to clear data:', error);
            showNotification('error', 'Failed to clear data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleCreateCampaign = async (newCampaignData: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>) => {
        if (!user?.id) return;
        
        if (usage.campaigns >= limits.campaigns) {
            showNotification('error', `Campaign limit reached (${limits.campaigns}/${limits.campaigns}).`);
            setPage('CAMPAIGNS');
            return;
        }
        
        setFindingLeadsCampaign(newCampaignData);
        setPage('FINDING_LEADS');
        
        let generatedPosts: any[] = [];
        let searchError: string | null = null;
        
        // Try to find leads, but don't fail if it doesn't work
        try {
            const hasActiveSubscription = subscription.subscribed && subscription.status === 'active';
            generatedPosts = await findLeads(newCampaignData, redditCreds, hasActiveSubscription);
            console.log(`✅ Found ${generatedPosts.length} posts`);
        } catch (error) {
            console.error("⚠️ Failed to find leads, but will create campaign anyway:", error);
            searchError = error instanceof Error ? error.message : 'Unknown error';
            generatedPosts = []; // Empty array, campaign will have 0 posts
        }

        // ALWAYS create the campaign, even if no posts found
        try {
            const newCampaign: Campaign = await databaseService.createCampaign(user.id, {
                ...newCampaignData,
                status: 'active',
                leadsFound: generatedPosts.length,
                highPotential: generatedPosts.filter(p => p.relevance > 95).length,
                contacted: 0,
                createdAt: new Date().toISOString(),
                lastRefreshed: new Date().toISOString(),
            });

            // Create posts in database (if any were found)
            if (generatedPosts.length > 0) {
                const postsToCreate = generatedPosts.map(p => ({
                    ...p,
                    campaignId: newCampaign.id,
                    status: 'new' as const,
                }));
                
                const createdPosts = await databaseService.createPosts(postsToCreate);
                setPosts(prev => [...prev, ...createdPosts]);
            }

            setCampaigns(prev => [...prev, newCampaign]);
            setPage('CAMPAIGNS');
            
            // Show appropriate notification
            if (generatedPosts.length > 0) {
                showNotification('success', `Campaign "${newCampaign.name}" created with ${generatedPosts.length} posts!`);
            } else if (searchError) {
                showNotification('error', `Campaign created, but no posts found. ${searchError.includes('overloaded') ? 'API is overloaded - try refreshing later.' : 'Try adjusting your keywords or refresh later.'}`);
            } else {
                showNotification('success', `Campaign "${newCampaign.name}" created! No posts found yet - try refreshing.`);
            }

        } catch (error) {
            console.error("❌ Failed to create campaign:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("❌ Error details:", errorMessage);
            
            // Check if it's a user not found error
            if (errorMessage.includes('user') || errorMessage.includes('foreign key')) {
                showNotification('error', 'Please wait a moment and try again. Your account is still being set up.');
            } else {
                showNotification('error', `Failed to create campaign: ${errorMessage}`);
            }
            setPage('CREATE_CAMPAIGN');
        } finally {
            setFindingLeadsCampaign(null);
        }
    };

    const handleDeleteCampaign = async (campaignId: number) => {
        const campaignToDelete = campaigns.find(c => c.id === campaignId);
        if (!campaignToDelete) {
            console.warn('Campaign not found:', campaignId);
            return;
        }
        
        try {
            console.log('🗑️ Deleting campaign:', campaignId, campaignToDelete.name);
            await databaseService.deleteCampaign(campaignId);
            console.log('✅ Campaign deleted successfully');
            
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            setPosts(prev => prev.filter(p => p.campaignId !== campaignId));
            showNotification('success', `Campaign "${campaignToDelete.name}" deleted.`);
            
            if (page === 'CAMPAIGN_POSTS' && selectedCampaignId === campaignId) {
                setPage('CAMPAIGNS');
            }
        } catch (error) {
            console.error('❌ Failed to delete campaign:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error details:', errorMessage);
            showNotification('error', `Failed to delete campaign: ${errorMessage}`);
        }
    };
    
    const handleRefreshCampaign = async (campaignId: number): Promise<number> => {
        if (!user?.id) return 0;
        
        if (usage.refreshes >= limits.refreshes) {
            showNotification('error', `Refresh limit reached (${limits.refreshes}/${limits.refreshes}).`);
            return 0;
        }

        const campaignToRefresh = campaigns.find(c => c.id === campaignId);
        if (!campaignToRefresh) {
            showNotification('error', 'Campaign not found.');
            return 0;
        }
        
        const newUsage = {...usage, refreshes: usage.refreshes + 1};
        setUsage(newUsage);
        if (user.id) {
            databaseService.updateUserSettings(user.id, { usage: newUsage }).catch(err => console.error('Failed to update usage:', err));
        }

        try {
            const { id, status, leadsFound, highPotential, contacted, createdAt, lastRefreshed, ...campaignData } = campaignToRefresh;
            const hasActiveSubscription = subscription.subscribed && subscription.status === 'active';
            const generatedPosts = await findLeads(campaignData, redditCreds, hasActiveSubscription);

            const existingPostUrls = new Set(posts.filter(p => p.campaignId === campaignId).map(p => p.url));
            const newPostsFromApi = generatedPosts.filter(p => !existingPostUrls.has(p.url));

            if (newPostsFromApi.length === 0) {
                showNotification('success', 'No new posts found.');
                const updatedCampaign = await databaseService.updateCampaign(campaignId, {
                    lastRefreshed: new Date().toISOString(),
                });
                setCampaigns(prev => prev.map(c => c.id === campaignId ? updatedCampaign : c));
                return 0;
            }

            const postsToCreate = newPostsFromApi.map(p => ({
                ...p,
                campaignId: campaignId,
                status: 'new' as const,
            }));

            const createdPosts = await databaseService.createPosts(postsToCreate);
            const updatedCampaign = await databaseService.updateCampaign(campaignId, {
                leadsFound: campaignToRefresh.leadsFound + createdPosts.length,
                highPotential: campaignToRefresh.highPotential + createdPosts.filter(p => p.relevance > 95).length,
                        lastRefreshed: new Date().toISOString(),
            });

            setPosts(prev => [...prev, ...createdPosts]);
            setCampaigns(prev => prev.map(c => c.id === campaignId ? updatedCampaign : c));
            
            showNotification('success', `${createdPosts.length} new posts found for "${campaignToRefresh.name}".`);
            return createdPosts.length;
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

    const markPostAsContacted = async (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (!post || post.status === 'contacted') return;
        
        try {
            await databaseService.updatePost(postId, { status: 'contacted' });
            const campaign = campaigns.find(c => c.id === post.campaignId);
            if (campaign) {
                const updatedCampaign = await databaseService.updateCampaign(post.campaignId, {
                    contacted: campaign.contacted + 1,
                });
                setCampaigns(prev => prev.map(c => c.id === post.campaignId ? updatedCampaign : c));
            }
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'contacted' } : p));
        } catch (error) {
            console.error('Failed to mark post as contacted:', error);
            showNotification('error', 'Failed to update post. Please try again.');
        }
    }

    const handleGenerateAiResponse = async (): Promise<boolean> => {
        if (!user?.id) return false;
        
        if (usage.aiResponses >= limits.aiResponses) {
            showNotification('error', `AI response limit reached (${limits.aiResponses}/${limits.aiResponses}).`);
            return false;
        }
        const newUsage = { ...usage, aiResponses: usage.aiResponses + 1 };
        setUsage(newUsage);
        try {
            await databaseService.updateUserSettings(user.id, { usage: newUsage });
        } catch (error) {
            console.error('Failed to update usage:', error);
        }
        showNotification('success', `AI response used (${newUsage.aiResponses}/${limits.aiResponses}).`);
        return true;
    };

    const handleAddCommentToHistory = async (postId: number, comment: string) => {
        try {
            await databaseService.addCommentToHistory(postId, comment);
            // Reload comment history for this post
            if (user?.id) {
                const history = await databaseService.getCommentHistory(user.id, postId);
                setCommentHistory(prev => ({ ...prev, ...history }));
            }
        } catch (error) {
            console.error('Failed to add comment to history:', error);
        }
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
                            redditCreds={redditCreds}
                            setRedditCreds={async (creds) => {
                                setRedditCreds(creds);
                                if (user?.id) {
                                    try {
                                        await databaseService.updateUserSettings(user.id, { redditCreds: creds });
                                    } catch (error) {
                                        console.error('Failed to save Reddit credentials:', error);
                                        showNotification('error', 'Failed to save Reddit credentials.');
                                    }
                                }
                            }}
                            subscription={subscription}
                            setSubscription={async (sub) => {
                                setSubscription(sub);
                                if (user?.id) {
                                    try {
                                        await databaseService.updateUserSettings(user.id, { subscription: sub });
                                        if (sub.subscribed && sub.status === 'active') {
                                            showNotification('success', 'Reddit API subscription activated!');
                                        } else if (!sub.subscribed) {
                                            showNotification('success', 'Reddit API subscription cancelled.');
                                        }
                                    } catch (error) {
                                        console.error('Failed to update subscription:', error);
                                        showNotification('error', 'Failed to update subscription.');
                                    }
                                }
                            }}
                            onLogout={handleLogout}
                            user={user}
                            setUser={async (updatedUser) => {
                                if (updatedUser && user?.id && updatedUser.name !== user.name) {
                                    try {
                                        // Update user name in database
                                        const updated = await databaseService.updateUserName(user.id, updatedUser.name);
                                        setUser(updated);
                                    } catch (error) {
                                        console.error('Failed to update user:', error);
                                        showNotification('error', 'Failed to update user name.');
                                    }
                                } else {
                                    setUser(updatedUser);
                                }
                            }}
                            savedAiStyle={savedAiStyle}
                            setSavedAiStyle={async (style) => {
                                setSavedAiStyle(style);
                                if (user?.id) {
                                    try {
                                        await databaseService.updateUserSettings(user.id, { aiStyle: style });
                                    } catch (error) {
                                        console.error('Failed to save AI style:', error);
                                        showNotification('error', 'Failed to save AI style settings.');
                                    }
                                }
                            }}
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
                if (selectedCampaign && user) {
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
                                userEmail={user.email}
                            />;
                }
                setPage('CAMPAIGNS'); // Fallback
                return null;
            case 'ADMIN':
                if (user?.role === 'admin') {
                    return <AdminDashboard />;
                }
                setPage('DASHBOARD');
                return null;
            default:
                return <Dashboard campaigns={campaigns} posts={posts} onCreateCampaign={() => setPage('CREATE_CAMPAIGN')} />;
        }
    };

    // Show loading state while checking session
    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
                <div className="text-[var(--text-primary)]">Loading...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        console.log('🔴 Not logged in - showing landing page', { user, isLoggedIn, isInitializing });
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
    
    console.log('✅ User is logged in - showing dashboard', { user: user?.email, isLoggedIn });

    // Show payment gate if user doesn't have subscription
    if (showPaymentGate && user?.id) {
        return (
            <PaymentGate
                userId={user.id}
                onAccessGranted={() => {
                    setHasSubscription(true);
                    setShowPaymentGate(false);
                    showNotification('success', 'Welcome! Your subscription is active.');
                }}
            />
        );
    }

    return (
        <div className="md:flex md:h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
            <Sidebar currentPage={page} setPage={setPage} usage={usage} limits={limits} user={user} />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Subscription Banner - Show when user doesn't have subscription */}
                {!hasSubscription && showSubscriptionBanner && user && (
                    <SubscriptionBanner
                        onUpgrade={() => {
                            if (user.email) {
                                whopService.redirectToCheckout(user.email);
                            }
                        }}
                        onDismiss={() => setShowSubscriptionBanner(false)}
                    />
                )}
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
