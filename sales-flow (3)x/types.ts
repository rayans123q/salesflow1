
export type Page = 'DASHBOARD' | 'CAMPAIGNS' | 'SETTINGS' | 'CREATE_CAMPAIGN' | 'FINDING_LEADS' | 'CAMPAIGN_POSTS';

export type CampaignDateRange = 'lastDay' | 'lastWeek' | 'lastMonth';

export type Theme = 'light' | 'dark';

export type LeadSource = 'reddit' | 'discord';

export interface User {
  name: string;
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
  painPoint: string;
  authorProfileSummary?: string;
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

export interface CommentVariations {
  helpful: string;
  questioning: string;
  direct: string;
}

export interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  beaconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
}
