// Post Composer Service - Phase 3
// Creates rule-aware posts using AI with proper error handling and credit management

import { supabase } from './supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { deepseekService } from './deepseekService';
import { grokService } from './grokService';
import apiKeyManager from './apiKeyManager';

// Initialize Gemini AI client
let currentApiKey = apiKeyManager.getNextApiKey();
let ai = new GoogleGenAI({ apiKey: currentApiKey });

// Function to handle API errors and switch to next key
const handleApiError = (error: any): boolean => {
    const errorMessage = error?.message || error?.toString() || '';
    const errorStatus = error?.status || '';
    
    if (errorMessage.includes('API key') || 
        errorMessage.includes('401') || 
        errorMessage.includes('403') ||
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorStatus === 'RESOURCE_EXHAUSTED') {
        
        console.warn('❌ Current API key failed, trying next one...');
        apiKeyManager.markKeyAsFailed(currentApiKey);
        currentApiKey = apiKeyManager.getNextApiKey();
        ai = new GoogleGenAI({ apiKey: currentApiKey });
        console.log('🔄 Switched to API key:', currentApiKey.substring(0, 10) + '...');
        return true;
    }
    return false;
};

interface GeneratedPost {
    title: string;
    content: string;
    category?: 'storytelling' | 'achievement' | 'help' | 'question' | 'discussion';
    categoryReason?: string;
}

interface RuleCompliance {
    compliant: boolean;
    issues: string[];
}

interface SpamCheck {
    isSpam: boolean;
    spamScore: number; // 0-100
    issues: string[];
    suggestions: string[];
}

class PostComposerService {
    /**
     * Generate a rule-aware post for a specific subreddit
     * Includes proper error handling and fallback to DeepSeek
     */
    async generateRuleAwarePost(
        productDescription: string,
        subreddit: string,
        websiteUrl: string = ''
    ): Promise<GeneratedPost> {
        console.log(`🎨 Generating post for r/${subreddit}...`);
        
        // Fetch subreddit rules
        const rules = await this.fetchSubredditRules(subreddit);
        const rulesText = rules.length > 0 
            ? rules.map((r, i) => `${i + 1}. ${r.title}: ${r.description}`).join('\n')
            : 'No specific rules found. Follow general Reddit etiquette.';
        
        const prompt = `You are an expert Reddit marketer. Create an engaging, authentic post for r/${subreddit}.

**PRODUCT/SERVICE:**
${productDescription}
${websiteUrl ? `Website: ${websiteUrl}` : ''}

**CRITICAL: Use the EXACT product description above. Do NOT make up features, capabilities, or details that aren't mentioned. If the product finds leads on Reddit, say Reddit. If it uses email, say email. Be accurate.**

**SUBREDDIT RULES:**
${rulesText}

**REQUIREMENTS:**
1. The post MUST comply with all subreddit rules
2. Be authentic and conversational, NOT salesy or promotional
3. Write like a real person sharing their experience, not a marketer
4. Focus on the problem you solved or value you got, not features
5. Use casual language - avoid marketing buzzwords like "game-changer", "revolutionary", "amazing"
6. If self-promotion is restricted, ask for feedback or share your journey
7. Keep title under 300 characters
8. Content should be 150-400 words
9. Be specific about what the product actually does based on the description
10. Don't exaggerate or oversell - be honest and helpful

**CRITICAL - NATURAL HUMAN WRITING:**
❌ NEVER use these AI markers in the content:
- Underscores for emphasis (_like this_)
- Hashtags (#likeThis)
- Asterisks for bold (**like this**)
- Excessive bullet points or numbered lists
- Section headers with formatting
- Any markdown or formatting that screams "AI wrote this"

✅ INSTEAD, write naturally:
- Use regular punctuation and capitalization
- Write in flowing paragraphs with natural breaks
- Use "quotes" for emphasis if needed
- Write exactly how a real person would post on Reddit

**TONE EXAMPLES:**
❌ BAD (too salesy): "This **amazing** tool _revolutionized_ my workflow! It's a game-changer! #productivity"
✅ GOOD (authentic): "Been using this for a few weeks and it's helped me save about 5 hours/week on lead gen"

❌ BAD (generic): "It helps you find leads and grow your business!"
✅ GOOD (specific): "It scans Reddit for people asking about [specific problem] and helps me reach out"

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "title": "Engaging post title here",
  "content": "Full post content here - write naturally like a human, NO formatting markers"
}
\`\`\`

Generate the post now. Make it indistinguishable from a real human post:`;

        try {
            // Try Gemini first
            console.log('🤖 Using Gemini AI...');
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const responseText = response.text;
            if (!responseText) {
                throw new Error('Empty response from Gemini');
            }
            
            return this.parsePostResponse(responseText);
            
        } catch (error: any) {
            console.error('❌ Gemini failed:', error);
            
            // Check if it's an overload error (503)
            const isOverloaded = error?.message?.includes('503') || 
                               error?.message?.includes('overloaded') || 
                               error?.message?.includes('UNAVAILABLE');
            
            if (isOverloaded && deepseekService.isConfigured()) {
                console.warn('⚠️ Gemini overloaded, falling back to DeepSeek...');
                try {
                    const deepseekResponse = await deepseekService.generateContent(prompt);
                    return this.parsePostResponse(deepseekResponse);
                } catch (deepseekError) {
                    console.error('❌ DeepSeek fallback also failed:', deepseekError);
                    // Try Grok as final fallback
                    if (grokService.isConfigured()) {
                        console.warn('⚠️ DeepSeek failed, trying Grok (xAI) as final fallback...');
                        try {
                            const grokResponse = await grokService.generateContent(prompt);
                            return this.parsePostResponse(grokResponse);
                        } catch (grokError) {
                            console.error('❌ All AI services failed (Gemini, DeepSeek, Grok)');
                            throw new Error('All AI services are currently unavailable. Please try again in a moment.');
                        }
                    }
                    throw new Error('Both AI services are currently unavailable. Please try again in a moment.');
                }
            }
            
            // Try switching API keys for other errors
            if (handleApiError(error)) {
                console.log('🔄 Retrying with new API key...');
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    return this.parsePostResponse(response.text);
                } catch (retryError: any) {
                    // If retry also fails with overload, try DeepSeek
                    if ((retryError?.message?.includes('503') || retryError?.message?.includes('overloaded')) && 
                        deepseekService.isConfigured()) {
                        console.warn('⚠️ Gemini still overloaded, using DeepSeek...');
                        const deepseekResponse = await deepseekService.generateContent(prompt);
                        return this.parsePostResponse(deepseekResponse);
                    }
                    throw retryError;
                }
            }
            
            throw new Error('Failed to generate post. Please try again or enter manually.');
        }
    }

    /**
     * Check if a post complies with subreddit rules
     */
    async checkRuleCompliance(
        title: string,
        content: string,
        subreddit: string
    ): Promise<RuleCompliance> {
        console.log(`✅ Checking rule compliance for r/${subreddit}...`);
        
        const rules = await this.fetchSubredditRules(subreddit);
        if (rules.length === 0) {
            return { compliant: true, issues: [] };
        }
        
        const rulesText = rules.map((r, i) => `${i + 1}. ${r.title}: ${r.description}`).join('\n');
        
        const prompt = `Analyze this Reddit post for rule compliance.

**SUBREDDIT:** r/${subreddit}

**RULES:**
${rulesText}

**POST:**
Title: ${title}
Content: ${content}

**TASK:**
Check if the post violates any rules. Return JSON:
\`\`\`json
{
  "compliant": true/false,
  "issues": ["list of rule violations if any"]
}
\`\`\``;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const responseText = response.text || '{}';
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            
            return JSON.parse(jsonStr.trim());
        } catch (error) {
            console.error('❌ Rule compliance check failed:', error);
            // Return compliant by default if check fails
            return { compliant: true, issues: [] };
        }
    }

    /**
     * Fetch subreddit rules from Reddit API via proxy
     */
    private async fetchSubredditRules(subreddit: string): Promise<Array<{title: string; description: string}>> {
        try {
            const cleanSubreddit = subreddit.replace(/^r\//, '');
            console.log(`📋 Fetching rules for r/${cleanSubreddit}...`);
            
            // Check if we're in production (use Netlify function) or development
            const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
            
            let rulesData;
            
            if (isProduction) {
                // Use Netlify function proxy in production
                console.log('📡 Using Netlify function proxy...');
                const response = await fetch('/.netlify/functions/reddit-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: `https://www.reddit.com/r/${cleanSubreddit}/about/rules.json`
                    })
                });
                
                if (!response.ok) {
                    console.warn(`⚠️ Proxy failed for r/${cleanSubreddit}: ${response.status}`);
                    return this.getDefaultRules();
                }
                
                rulesData = await response.json();
            } else {
                // Direct fetch in development (may fail due to CORS)
                console.log('🔧 Development mode: Direct fetch...');
                try {
                    const response = await fetch(`https://www.reddit.com/r/${cleanSubreddit}/about/rules.json`, {
                        headers: { 'User-Agent': 'SalesFlow/1.0' }
                    });
                    
                    if (!response.ok) {
                        console.warn(`⚠️ Could not fetch rules for r/${cleanSubreddit}`);
                        return this.getDefaultRules();
                    }
                    
                    rulesData = await response.json();
                } catch (corsError) {
                    console.warn('⚠️ CORS error in development, using default rules');
                    return this.getDefaultRules();
                }
            }
            
            const rules = rulesData.rules || [];
            
            if (rules.length === 0) {
                console.log(`ℹ️ No specific rules found for r/${cleanSubreddit}`);
                return this.getDefaultRules();
            }
            
            const parsedRules = rules.map((rule: any) => ({
                title: rule.short_name || rule.violation_reason || 'Rule',
                description: rule.description || rule.violation_reason || ''
            }));
            
            console.log(`✅ Found ${parsedRules.length} rules for r/${cleanSubreddit}`);
            return parsedRules;
            
        } catch (error) {
            console.error('❌ Error fetching subreddit rules:', error);
            return this.getDefaultRules();
        }
    }

    /**
     * Get default Reddit rules when specific subreddit rules aren't available
     */
    private getDefaultRules(): Array<{title: string; description: string}> {
        return [
            {
                title: 'Be Respectful',
                description: 'Treat others with respect. No harassment, hate speech, or personal attacks.'
            },
            {
                title: 'No Spam',
                description: 'Avoid excessive self-promotion. Contribute to the community meaningfully.'
            },
            {
                title: 'Stay On Topic',
                description: 'Keep posts relevant to the subreddit\'s theme and purpose.'
            },
            {
                title: 'Follow Reddit Content Policy',
                description: 'Adhere to Reddit\'s site-wide rules and guidelines.'
            }
        ];
    }

    /**
     * Check post for spam and quality issues
     */
    async checkSpamAndQuality(title: string, content: string, subreddit: string): Promise<SpamCheck> {
        console.log(`🔍 Checking spam/quality for r/${subreddit}...`);
        
        const prompt = `Analyze this Reddit post for spam and quality issues.

**POST:**
Title: ${title}
Content: ${content}
Subreddit: r/${subreddit}

**CHECK FOR:**
1. Excessive self-promotion or spam
2. Aggressive marketing language
3. Too many links or calls-to-action
4. Lack of value to the community
5. Overly salesy tone

**RETURN JSON:**
\`\`\`json
{
  "isSpam": true/false,
  "spamScore": 0-100,
  "issues": ["list of specific problems"],
  "suggestions": ["how to fix each issue"]
}
\`\`\`

Score 0-30: Good quality
Score 31-60: Needs improvement
Score 61-100: Likely spam`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const responseText = response.text || '{}';
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            
            const result = JSON.parse(jsonStr.trim());
            console.log(`✅ Spam check complete: ${result.spamScore}/100`);
            return result;
        } catch (error) {
            console.error('❌ Spam check failed:', error);
            // Return safe default
            return {
                isSpam: false,
                spamScore: 0,
                issues: [],
                suggestions: []
            };
        }
    }

    /**
     * Suggest content category for post
     */
    async suggestCategory(title: string, content: string): Promise<{
        category: 'storytelling' | 'achievement' | 'help' | 'question' | 'discussion';
        reason: string;
        alternatives: Array<{category: string; reason: string}>;
    }> {
        console.log(`🎯 Suggesting content category...`);
        
        const prompt = `Analyze this post and suggest the best content category.

**POST:**
Title: ${title}
Content: ${content}

**CATEGORIES:**
- storytelling: Sharing a personal story or journey
- achievement: Celebrating a win or milestone
- help: Asking for advice or assistance
- question: Seeking specific information
- discussion: Starting a conversation or debate

**RETURN JSON:**
\`\`\`json
{
  "category": "best_category",
  "reason": "why this category fits best",
  "alternatives": [
    {"category": "alternative1", "reason": "why this could also work"},
    {"category": "alternative2", "reason": "another option"}
  ]
}
\`\`\``;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const responseText = response.text || '{}';
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            
            const result = JSON.parse(jsonStr.trim());
            console.log(`✅ Category suggested: ${result.category}`);
            return result;
        } catch (error) {
            console.error('❌ Category suggestion failed:', error);
            return {
                category: 'discussion',
                reason: 'Default category',
                alternatives: []
            };
        }
    }

    /**
     * Parse AI response to extract post title and content
     */
    private parsePostResponse(responseText: string): GeneratedPost {
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            
            const parsed = JSON.parse(jsonStr.trim());
            
            if (!parsed.title || !parsed.content) {
                throw new Error('Invalid response format');
            }
            
            return {
                title: parsed.title,
                content: parsed.content
            };
        } catch (error) {
            console.error('❌ Failed to parse post response:', error);
            throw new Error('Failed to parse AI response. Please try again.');
        }
    }
}

export const postComposerService = new PostComposerService();
