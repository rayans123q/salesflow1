// Subreddit Rules Service - Phase 2
// Fetches and manages subreddit posting rules

import { supabase } from './supabaseClient';
import { redditOAuthService } from './redditOAuthService';

interface SubredditRule {
    title: string;
    description: string;
    kind: string; // 'all', 'link', 'comment'
    priority: number;
}

interface SubredditRules {
    id?: number;
    subreddit_name: string;
    rules: SubredditRule[];
    posting_requirements: string;
    karma_requirement: number;
    account_age_days: number;
    allows_links: boolean;
    allows_images: boolean;
    allows_videos: boolean;
    last_fetched: string;
}

class SubredditRulesService {
    /**
     * Fetch rules for a subreddit from Reddit API
     */
    async fetchRules(subredditName: string): Promise<SubredditRules> {
        console.log(`📋 Fetching rules for r/${subredditName}...`);

        try {
            // Check if we have cached rules (less than 7 days old)
            const cached = await this.getCachedRules(subredditName);
            if (cached && this.isCacheValid(cached.last_fetched)) {
                console.log(`✅ Using cached rules for r/${subredditName}`);
                return cached;
            }

            // Fetch fresh rules from Reddit
            const rules = await this.fetchFromReddit(subredditName);
            
            // Save to database
            await this.saveRules(rules);

            console.log(`✅ Fetched ${rules.rules.length} rules for r/${subredditName}`);
            return rules;

        } catch (error) {
            console.error(`❌ Failed to fetch rules for r/${subredditName}:`, error);
            
            // Return cached rules if available, even if expired
            const cached = await this.getCachedRules(subredditName);
            if (cached) {
                console.log(`⚠️ Using expired cached rules for r/${subredditName}`);
                return cached;
            }

            throw error;
        }
    }

    /**
     * Fetch rules directly from Reddit API via proxy
     * Falls back to default rules if Reddit blocks us
     */
    private async fetchFromReddit(subredditName: string): Promise<SubredditRules> {
        const cleanName = subredditName.replace(/^r\//, '');

        // Try Reddit API with improved proxy
        const rulesUrl = `https://www.reddit.com/r/${cleanName}/about/rules.json`;
        const aboutUrl = `https://www.reddit.com/r/${cleanName}/about.json`;

        try {
            console.log('📡 Fetching real rules from Reddit...');
            
            const rulesResponse = await fetch('/.netlify/functions/reddit-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: rulesUrl })
            });

            const aboutResponse = await fetch('/.netlify/functions/reddit-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: aboutUrl })
            });

            if (!rulesResponse.ok || !aboutResponse.ok) {
                console.warn(`⚠️ Reddit API failed (${rulesResponse.status}), using AI-generated rules`);
                return await this.getDefaultRules(cleanName);
            }

            const rulesData = await rulesResponse.json();
            const aboutData = await aboutResponse.json();

            const subredditInfo = aboutData.data;
            const rules: SubredditRule[] = [];

            // Parse rules
            if (rulesData.rules) {
                for (const rule of rulesData.rules) {
                    rules.push({
                        title: rule.short_name || rule.violation_reason || 'Rule',
                        description: rule.description || '',
                        kind: rule.kind || 'all',
                        priority: rule.priority || 0
                    });
                }
            }

            // Extract posting requirements
            const requirements = this.extractRequirements(subredditInfo);

            return {
                subreddit_name: cleanName,
                rules,
                posting_requirements: requirements.text,
                karma_requirement: requirements.karma,
                account_age_days: requirements.accountAge,
                allows_links: subredditInfo.link_type !== 'self',
                allows_images: subredditInfo.allow_images !== false,
                allows_videos: subredditInfo.allow_videos !== false,
                last_fetched: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Reddit API fetch failed for r/${cleanName}:`, error);
            console.log('🤖 Falling back to AI-generated rules...');
            return await this.getDefaultRules(cleanName);
        }
    }

    /**
     * Get subreddit-specific rules using AI when Reddit API is unavailable
     * This generates realistic rules based on the subreddit name and common patterns
     */
    private async getDefaultRules(subredditName: string): Promise<SubredditRules> {
        console.log(`🤖 Generating realistic rules for r/${subredditName} using AI...`);
        
        try {
            // Use Gemini to generate realistic subreddit-specific rules
            const { GoogleGenAI } = await import("@google/genai");
            const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
            
            if (!apiKey) {
                return this.getFallbackRules(subredditName);
            }
            
            const ai = new GoogleGenAI({ apiKey });
            
            const prompt = `Generate realistic posting rules for the subreddit r/${subredditName}.

Based on the subreddit name and common Reddit patterns, create 4-6 specific rules that would likely exist for this community.

**SUBREDDIT:** r/${subredditName}

**RETURN JSON:**
\`\`\`json
{
  "rules": [
    {
      "title": "Rule title",
      "description": "Detailed description of the rule"
    }
  ],
  "posting_requirements": "Brief summary of posting requirements",
  "allows_self_promotion": true/false
}
\`\`\`

Make the rules specific to this subreddit's likely topic and community culture.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const responseText = response.text || '{}';
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            const aiRules = JSON.parse(jsonStr.trim());
            
            console.log(`✅ Generated ${aiRules.rules.length} AI rules for r/${subredditName}`);
            
            return {
                subreddit_name: subredditName,
                rules: aiRules.rules.map((r: any, i: number) => ({
                    title: r.title,
                    description: r.description,
                    kind: 'all',
                    priority: i
                })),
                posting_requirements: aiRules.posting_requirements || 'Check subreddit sidebar before posting.',
                karma_requirement: 0,
                account_age_days: 0,
                allows_links: aiRules.allows_self_promotion !== false,
                allows_images: true,
                allows_videos: true,
                last_fetched: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ AI rule generation failed:', error);
            return this.getFallbackRules(subredditName);
        }
    }

    /**
     * Get generic fallback rules when both Reddit API and AI fail
     */
    private getFallbackRules(subredditName: string): SubredditRules {
        return {
            subreddit_name: subredditName,
            rules: [
                {
                    title: 'Be Respectful',
                    description: 'Treat others with respect. No harassment, hate speech, or personal attacks.',
                    kind: 'all',
                    priority: 0
                },
                {
                    title: 'No Spam',
                    description: 'Avoid excessive self-promotion. Contribute to the community meaningfully.',
                    kind: 'all',
                    priority: 0
                },
                {
                    title: 'Stay On Topic',
                    description: 'Keep posts relevant to the subreddit\'s theme and purpose.',
                    kind: 'all',
                    priority: 0
                },
                {
                    title: 'Follow Reddit Content Policy',
                    description: 'Adhere to Reddit\'s site-wide rules and guidelines.',
                    kind: 'all',
                    priority: 0
                }
            ],
            posting_requirements: 'Always check the subreddit sidebar for specific rules before posting.',
            karma_requirement: 0,
            account_age_days: 0,
            allows_links: true,
            allows_images: true,
            allows_videos: true,
            last_fetched: new Date().toISOString()
        };
    }

    /**
     * Extract posting requirements from subreddit info
     */
    private extractRequirements(subredditInfo: any): {
        text: string;
        karma: number;
        accountAge: number;
    } {
        const requirements: string[] = [];
        let karma = 0;
        let accountAge = 0;

        // Check submission text
        if (subredditInfo.submit_text) {
            requirements.push(subredditInfo.submit_text);
        }

        // Check for karma requirements (often in description)
        const description = subredditInfo.public_description || '';
        const karmaMatch = description.match(/(\d+)\s*karma/i);
        if (karmaMatch) {
            karma = parseInt(karmaMatch[1]);
            requirements.push(`Minimum ${karma} karma required`);
        }

        // Check for account age requirements
        const ageMatch = description.match(/(\d+)\s*days?\s*old/i);
        if (ageMatch) {
            accountAge = parseInt(ageMatch[1]);
            requirements.push(`Account must be ${accountAge} days old`);
        }

        // Check link type
        if (subredditInfo.link_type === 'self') {
            requirements.push('Text posts only (no links)');
        }

        // Check if restricted
        if (subredditInfo.subreddit_type === 'restricted') {
            requirements.push('Restricted subreddit - posting may be limited');
        }

        return {
            text: requirements.join('. '),
            karma,
            accountAge
        };
    }

    /**
     * Get cached rules from database
     */
    private async getCachedRules(subredditName: string): Promise<SubredditRules | null> {
        const cleanName = subredditName.replace(/^r\//, '');

        const { data, error } = await supabase
            .from('subreddit_rules')
            .select('*')
            .eq('subreddit_name', cleanName)
            .single();

        if (error || !data) {
            return null;
        }

        return data as SubredditRules;
    }

    /**
     * Check if cached rules are still valid (less than 7 days old)
     */
    private isCacheValid(lastFetched: string): boolean {
        const fetchedDate = new Date(lastFetched);
        const now = new Date();
        const daysDiff = (now.getTime() - fetchedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
    }

    /**
     * Save rules to database
     */
    private async saveRules(rules: SubredditRules): Promise<void> {
        const { error } = await supabase
            .from('subreddit_rules')
            .upsert({
                subreddit_name: rules.subreddit_name,
                rules: rules.rules,
                posting_requirements: rules.posting_requirements,
                karma_requirement: rules.karma_requirement,
                account_age_days: rules.account_age_days,
                allows_links: rules.allows_links,
                allows_images: rules.allows_images,
                allows_videos: rules.allows_videos,
                last_fetched: rules.last_fetched
            }, {
                onConflict: 'subreddit_name'
            });

        if (error) {
            console.error('❌ Failed to save rules:', error);
            throw error;
        }
    }

    /**
     * Get rules for multiple subreddits
     */
    async fetchMultipleRules(subredditNames: string[]): Promise<SubredditRules[]> {
        const results: SubredditRules[] = [];

        for (const name of subredditNames) {
            try {
                const rules = await this.fetchRules(name);
                results.push(rules);
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.warn(`⚠️ Skipping r/${name} due to error`);
            }
        }

        return results;
    }

    /**
     * Check if a post complies with subreddit rules
     */
    async checkCompliance(
        subredditName: string,
        postTitle: string,
        postContent: string,
        postType: 'text' | 'link' | 'image'
    ): Promise<{ compliant: boolean; violations: string[] }> {
        const rules = await this.fetchRules(subredditName);
        const violations: string[] = [];

        // Check post type restrictions
        if (postType === 'link' && !rules.allows_links) {
            violations.push('This subreddit does not allow link posts');
        }
        if (postType === 'image' && !rules.allows_images) {
            violations.push('This subreddit does not allow image posts');
        }

        // Check title length
        if (postTitle.length > 300) {
            violations.push('Title is too long (max 300 characters)');
        }
        if (postTitle.length < 3) {
            violations.push('Title is too short (min 3 characters)');
        }

        // Check for common spam indicators
        const spamPatterns = [
            /\b(buy now|click here|limited time|act now)\b/i,
            /\b(100% free|guaranteed|risk free)\b/i,
            /\$\$\$/,
            /!!!+/
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(postTitle) || pattern.test(postContent)) {
                violations.push('Content may be flagged as spam');
                break;
            }
        }

        return {
            compliant: violations.length === 0,
            violations
        };
    }
}

export const subredditRulesService = new SubredditRulesService();
export type { SubredditRules, SubredditRule };
