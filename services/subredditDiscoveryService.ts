// Subreddit Discovery Service - Phase 1
// Discovers relevant subreddits based on campaign keywords and scores them

import { supabase } from './supabaseClient';
import { GoogleGenAI } from '@google/genai';
import apiKeyManager from './apiKeyManager';

interface DiscoveredSubreddit {
    id?: number;
    campaign_id: number;
    subreddit_name: string;
    match_score: number;
    subscriber_count: number;
    description: string;
    rules_fetched: boolean;
    is_added_to_campaign: boolean;
}

interface SubredditSearchResult {
    name: string;
    display_name: string;
    subscribers: number;
    public_description: string;
    over18: boolean;
    url: string;
}

class SubredditDiscoveryService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = apiKeyManager.getNextApiKey();
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Discover relevant subreddits for a campaign
     */
    async discoverSubreddits(
        campaignId: number,
        keywords: string[],
        description: string,
        maxResults: number = 20
    ): Promise<DiscoveredSubreddit[]> {
        console.log(`🔍 Discovering subreddits for campaign ${campaignId}...`);

        try {
            // Step 1: Search Reddit for subreddits using keywords
            const searchResults = await this.searchRedditSubreddits(keywords);
            
            if (searchResults.length === 0) {
                console.log('📭 No subreddits found');
                return [];
            }

            console.log(`📊 Found ${searchResults.length} potential subreddits`);

            // Step 2: Use AI to score relevance
            const scoredSubreddits = await this.scoreSubredditsWithAI(
                searchResults,
                description,
                keywords
            );

            // Step 3: Filter and sort by score
            const topSubreddits = scoredSubreddits
                .filter(s => s.match_score >= 60) // Only keep relevant ones
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, maxResults);

            // Step 4: Save to database
            const saved = await this.saveDiscoveredSubreddits(campaignId, topSubreddits);

            console.log(`✅ Discovered ${saved.length} relevant subreddits`);
            return saved;

        } catch (error) {
            console.error('❌ Subreddit discovery failed:', error);
            throw error;
        }
    }

    /**
     * Search Reddit for subreddits
     */
    private async searchRedditSubreddits(keywords: string[]): Promise<SubredditSearchResult[]> {
        const results: SubredditSearchResult[] = [];
        const seenSubreddits = new Set<string>();

        // Search for each keyword
        for (const keyword of keywords) {
            try {
                const query = encodeURIComponent(keyword);
                const url = `https://www.reddit.com/subreddits/search.json?q=${query}&limit=25`;

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'SalesFlow/1.0'
                    }
                });

                if (!response.ok) {
                    console.warn(`⚠️ Reddit search failed for "${keyword}": ${response.status}`);
                    continue;
                }

                const data = await response.json();
                
                if (data.data?.children) {
                    for (const child of data.data.children) {
                        const sub = child.data;
                        const subName = sub.display_name.toLowerCase();

                        // Avoid duplicates and NSFW
                        if (!seenSubreddits.has(subName) && !sub.over18) {
                            seenSubreddits.add(subName);
                            results.push({
                                name: sub.display_name,
                                display_name: sub.display_name_prefixed,
                                subscribers: sub.subscribers || 0,
                                public_description: sub.public_description || '',
                                over18: sub.over18,
                                url: `https://www.reddit.com${sub.url}`
                            });
                        }
                    }
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.warn(`⚠️ Error searching for "${keyword}":`, error);
            }
        }

        return results;
    }

    /**
     * Use AI to score subreddit relevance
     */
    private async scoreSubredditsWithAI(
        subreddits: SubredditSearchResult[],
        campaignDescription: string,
        keywords: string[]
    ): Promise<DiscoveredSubreddit[]> {
        const prompt = `You are a Reddit marketing expert. Score how relevant each subreddit is for this campaign.

Campaign Description: ${campaignDescription}
Keywords: ${keywords.join(', ')}

Subreddits to evaluate:
${subreddits.map((s, i) => `${i + 1}. r/${s.name} (${s.subscribers.toLocaleString()} subscribers)
   Description: ${s.public_description || 'No description'}`).join('\n\n')}

For each subreddit, provide a relevance score from 0-100 based on:
- Topic alignment with campaign
- Audience fit
- Community size and activity
- Likelihood of engagement

Return ONLY a JSON array with this exact format:
[
  {"subreddit": "subreddit_name", "score": 85, "reason": "brief explanation"},
  ...
]`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: prompt
            });

            const text = response.text.trim();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            
            if (!jsonMatch) {
                throw new Error('AI did not return valid JSON');
            }

            const scores = JSON.parse(jsonMatch[0]);

            // Map scores back to subreddits
            const scored: DiscoveredSubreddit[] = [];
            for (const score of scores) {
                const sub = subreddits.find(s => 
                    s.name.toLowerCase() === score.subreddit.toLowerCase()
                );

                if (sub) {
                    scored.push({
                        campaign_id: 0, // Will be set when saving
                        subreddit_name: sub.name,
                        match_score: Math.min(100, Math.max(0, score.score)),
                        subscriber_count: sub.subscribers,
                        description: sub.public_description || score.reason || '',
                        rules_fetched: false,
                        is_added_to_campaign: false
                    });
                }
            }

            return scored;

        } catch (error) {
            console.error('❌ AI scoring failed:', error);
            // Fallback: basic scoring based on keyword match
            return subreddits.map(sub => ({
                campaign_id: 0,
                subreddit_name: sub.name,
                match_score: this.calculateBasicScore(sub, keywords),
                subscriber_count: sub.subscribers,
                description: sub.public_description || '',
                rules_fetched: false,
                is_added_to_campaign: false
            }));
        }
    }

    /**
     * Fallback scoring method
     */
    private calculateBasicScore(sub: SubredditSearchResult, keywords: string[]): number {
        let score = 50; // Base score

        const text = `${sub.name} ${sub.public_description}`.toLowerCase();

        // Check keyword matches
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                score += 10;
            }
        }

        // Bonus for subscriber count
        if (sub.subscribers > 100000) score += 10;
        else if (sub.subscribers > 10000) score += 5;

        return Math.min(100, score);
    }

    /**
     * Save discovered subreddits to database
     */
    private async saveDiscoveredSubreddits(
        campaignId: number,
        subreddits: DiscoveredSubreddit[]
    ): Promise<DiscoveredSubreddit[]> {
        const toInsert = subreddits.map(s => ({
            ...s,
            campaign_id: campaignId
        }));

        const { data, error } = await supabase
            .from('discovered_subreddits')
            .upsert(toInsert, {
                onConflict: 'campaign_id,subreddit_name',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Failed to save discovered subreddits:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get discovered subreddits for a campaign
     */
    async getDiscoveredSubreddits(campaignId: number): Promise<DiscoveredSubreddit[]> {
        const { data, error } = await supabase
            .from('discovered_subreddits')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('match_score', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch discovered subreddits:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Add discovered subreddit to campaign
     */
    async addToCampaign(discoveredSubredditId: number): Promise<void> {
        const { error } = await supabase
            .from('discovered_subreddits')
            .update({ is_added_to_campaign: true })
            .eq('id', discoveredSubredditId);

        if (error) {
            console.error('❌ Failed to add subreddit to campaign:', error);
            throw error;
        }
    }

    /**
     * Remove discovered subreddit
     */
    async removeDiscoveredSubreddit(discoveredSubredditId: number): Promise<void> {
        const { error } = await supabase
            .from('discovered_subreddits')
            .delete()
            .eq('id', discoveredSubredditId);

        if (error) {
            console.error('❌ Failed to remove discovered subreddit:', error);
            throw error;
        }
    }
}

export const subredditDiscoveryService = new SubredditDiscoveryService();
