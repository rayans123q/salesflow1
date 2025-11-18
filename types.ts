
export type Page = 'DASHBOARD' | 'CAMPAIGNS' | 'SETTINGS' | 'CREATE_CAMPAIGN' | 'FINDING_LEADS' | 'CAMPAIGN_POSTS' | 'ADMIN';

export type CampaignDateRange = 'lastDay' | 'lastWeek' | 'lastMonth';

export type Theme = 'light' | 'dark';

export type LeadSource = 'reddit' | 'twitter';

export interface User {
  id?: string;
  name: string;
  email?: string;
  role?: 'user' | 'admin';
}

export interface Campaign {
  id: number;
  name: string;
  status: 'active' | 'paused';
  leadsFound: number;
  highPotential: number;
  contacted: number;
  description: string;
  keywords: string[];
  negativeKeywords?: string[];
  subreddits?: string[];
  websiteUrl?: string;
  dateRange: CampaignDateRange;
  createdAt: string;
  lastRefreshed: string | null;
  leadSources: LeadSource[];
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: 'daily' | 'every12hours' | 'every6hours' | 'every3hours';
  nextAutoRefresh?: string | null;
}

export interface Post {
  id: number;
  url: string; 
  campaignId: number;
  source: LeadSource;
  sourceName: string; // e.g., 'r/reactjs' or 'DiscordServer#general'
  title: string;
  content: string;
  relevance: number;
  status: 'new' | 'contacted' | 'hidden';
}

export type Tone = 'Friendly & Warm' | 'Professional' | 'Casual & Relaxed' | 'Expert & Authoritative';
export type SalesApproach = 'Subtle' | 'Moderate' | 'Direct' | 'Aggressive';
export type ResponseLength = 'Short' | 'Medium' | 'Long';

export interface AIStyleSettings {
  tone: Tone;
  salesApproach: SalesApproach;
  length: ResponseLength;
  customOffer: string;
  includeWebsiteLink: boolean;
  saveStyle: boolean;
}

export interface RedditCredentials {
  clientId: string;
  clientSecret?: string; // Optional, not required for public API access
}

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Subscription {
  subscribed: boolean;
  status: SubscriptionStatus;
  startedAt?: string;
  expiresAt?: string;
  plan?: SubscriptionPlan;
}

export interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  beaconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Advanced Features Types
export interface DiscoveredSubreddit {
  name: string;
  matchScore: number;
  subscriberCount: number;
  description: string;
  activeUsers?: number;
  postsPerDay?: number;
}

export interface SubredditRule {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SubredditRulesData {
  subreddit: string;
  rules: SubredditRule[];
  postingRequirements: string;
  karmaRequired?: number;
  accountAgeRequired?: number;
  lastFetched: string;
}

export interface ScheduledPost {
  id: number;
  campaignId: number;
  subreddit: string;
  title: string;
  content: string;
  scheduledTime: string;
  status: 'pending' | 'posted' | 'failed';
  redditPostId?: string;
  engagementScore?: number;
  postedAt?: string;
}

export interface SubredditInsight {
  subreddit: string;
  bestPostingTimes: { hour: number; score: number }[];
  avgEngagement: number;
  topKeywords: string[];
  topPostExamples: { title: string; score: number; url: string }[];
  lastAnalyzed: string;
}

export interface TrackedLink {
  id: number;
  shortCode: string;
  originalUrl: string;
  campaignId: number;
  clicks: number;
  createdAt: string;
}

export interface LinkClick {
  id: number;
  linkId: number;
  clickedAt: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
}

export interface AutoReplySettings {
  id: number;
  campaignId: number;
  enabled: boolean;
  maxRepliesPerHour: number;
  triggerKeywords: string[];
  lastReplyAt?: string;
}

export interface Project {
  id: number;
  userId: string;
  name: string;
  websiteUrl?: string;
  description: string;
  createdAt: string;
}