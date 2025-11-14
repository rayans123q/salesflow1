
import { GoogleGenAI, Type } from "@google/genai";
import { AIStyleSettings, Campaign, Post, RedditCredentials, LeadSource } from '../types';
import apiKeyManager from './apiKeyManager';
import { redditOAuthService } from './redditOAuthService';
import { twitterService } from './twitterService';

// Initialize Gemini AI client with first available API key
let currentApiKey = apiKeyManager.getNextApiKey();
let ai = new GoogleGenAI({ apiKey: currentApiKey });

console.log('🔑 Initialized Gemini AI with API key:', currentApiKey.substring(0, 10) + '...');

// Function to get a working AI client (with fallback to other keys)
const getAiClient = () => {
    return ai;
};

// Function to handle API errors and switch to next key
const handleApiError = (error: any): boolean => {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Check if it's an API key related error
    if (errorMessage.includes('API key') || 
        errorMessage.includes('401') || 
        errorMessage.includes('403') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('permission')) {
        
        console.warn('❌ Current API key failed, trying next one...');
        apiKeyManager.markKeyAsFailed(currentApiKey);
        
        // Get next key and reinitialize
        currentApiKey = apiKeyManager.getNextApiKey();
        ai = new GoogleGenAI({ apiKey: currentApiKey });
        console.log('🔄 Switched to API key:', currentApiKey.substring(0, 10) + '...');
        
        return true; // Indicates we switched keys
    }
    
    return false; // Not an API key error
};

// --- Reddit API Service Logic (integrated here for simplicity) ---
// Using Reddit's public JSON API which doesn't require authentication
// Just needs a Client ID for identification (optional but recommended)
const REDDIT_JSON_API_BASE = 'https://www.reddit.com';

// Company Reddit API credentials (from environment variables)
// These are used when users have an active subscription
const COMPANY_REDDIT_CLIENT_ID = (import.meta as any).env?.VITE_COMPANY_REDDIT_CLIENT_ID;
const COMPANY_REDDIT_CLIENT_SECRET = (import.meta as any).env?.VITE_COMPANY_REDDIT_CLIENT_SECRET;

// Helper function to get Reddit credentials
// Returns company credentials if user has subscription, otherwise user's own credentials
export const getRedditCredentials = (
  userHasSubscription: boolean,
  userCreds: RedditCredentials | null
): RedditCredentials | null => {
  // If user has active subscription, use company credentials
  if (userHasSubscription && COMPANY_REDDIT_CLIENT_ID) {
    console.log('🔑 Using company Reddit API (subscribed user)');
    return {
      clientId: COMPANY_REDDIT_CLIENT_ID,
      clientSecret: COMPANY_REDDIT_CLIENT_SECRET || undefined,
    };
  }
  
  // Otherwise, use user's own credentials if provided
  if (userCreds?.clientId) {
    console.log('🔑 Using user Reddit API credentials');
    return userCreds;
  }
  
  // No credentials available
  return null;
};

interface RawRedditPost {
    title: string;
    selftext: string;
    permalink: string;
    subreddit_name_prefixed: string;
}

// Search Reddit using OAuth (when username/password are available)
const searchRedditWithOAuth = async (campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>, creds: RedditCredentials): Promise<{
    title: string;
    content: string;
    postUrl: string;
    subreddit: string;
}[]> => {
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const fullQuery = campaign.negativeKeywords?.length
        ? `${keywordsQuery} NOT (${campaign.negativeKeywords.join(' OR ')})`
        : keywordsQuery;
    
    const dateRangeMap = {
        lastDay: 'day',
        lastWeek: 'week',
        lastMonth: 'month',
    };
    const time = dateRangeMap[campaign.dateRange];

    const normalizedSubreddits = campaign.subreddits && campaign.subreddits.length > 0
        ? campaign.subreddits.map(sr => sr.replace(/^r\//, '').toLowerCase())
        : [];

    const allResults: { title: string; content: string; postUrl: string; subreddit: string }[] = [];

    if (normalizedSubreddits.length > 0) {
        console.log(`🔍 OAuth: Searching ${normalizedSubreddits.length} subreddit(s): ${normalizedSubreddits.join(', ')}`);
        
        for (const subreddit of normalizedSubreddits) {
            try {
                const posts = await redditOAuthService.searchReddit({
                    query: fullQuery,
                    subreddit: subreddit,
                    sort: 'new',
                    time: time as any,
                    limit: 25,
                });

                const subredditResults = posts.map(p => ({
                    title: p.title,
                    content: p.content,
                    postUrl: p.postUrl,
                    subreddit: p.subreddit,
                }));

                console.log(`  ✅ OAuth: Found ${subredditResults.length} posts from r/${subreddit}`);
                allResults.push(...subredditResults);
            } catch (error) {
                console.warn(`  ⚠️ OAuth: Error searching r/${subreddit}:`, error instanceof Error ? error.message : 'Unknown error');
                continue;
            }
        }
    } else {
        console.log('🔍 OAuth: Searching all of Reddit');
        try {
            const posts = await redditOAuthService.searchReddit({
                query: fullQuery,
                sort: 'new',
                time: time as any,
                limit: 25,
            });

            const globalResults = posts.map(p => ({
                title: p.title,
                content: p.content,
                postUrl: p.postUrl,
                subreddit: p.subreddit,
            }));

            console.log(`  ✅ OAuth: Found ${globalResults.length} posts from all of Reddit`);
            allResults.push(...globalResults);
        } catch (error) {
            console.error('❌ OAuth: Error searching Reddit:', error);
            throw error;
        }
    }

    // Remove duplicates
    const uniqueResults = Array.from(
        new Map(allResults.map(post => [post.postUrl, post])).values()
    );

    console.log(`📊 OAuth: Total unique posts found: ${uniqueResults.length}`);
    return uniqueResults;
};

const searchRedditApi = async (campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>, creds: RedditCredentials): Promise<{
    title: string;
    content: string;
    postUrl: string;
    subreddit: string;
}[]> => {
    // Check if OAuth service is configured (has username/password)
    // Only use OAuth in production (when Netlify functions are available)
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    if (redditOAuthService.isConfigured() && isProduction) {
        console.log('🔐 Using Reddit OAuth authentication (Production)');
        try {
            return await searchRedditWithOAuth(campaign, creds);
        } catch (error) {
            console.warn('⚠️ OAuth failed, falling back to public API:', error);
            // Fall through to public API
        }
    }
    
    // Fall back to public API with Basic auth
    console.log('🔓 Using Reddit public API with Basic auth');
    
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const fullQuery = campaign.negativeKeywords?.length
        ? `${keywordsQuery} NOT (${campaign.negativeKeywords.join(' OR ')})`
        : keywordsQuery;
    
    const dateRangeMap = {
        lastDay: 'day',
        lastWeek: 'week',
        lastMonth: 'month',
    };
    const time = dateRangeMap[campaign.dateRange];

    // Use proper User-Agent format for Reddit API
    const userAgent = creds.clientId 
        ? `SalesFlow/0.1 (Client ID: ${creds.clientId})`
        : 'SalesFlow/0.1';

    // Normalize subreddit names (remove r/ prefix if present, convert to lowercase)
    const normalizedSubreddits = campaign.subreddits && campaign.subreddits.length > 0
        ? campaign.subreddits.map(sr => sr.replace(/^r\//, '').toLowerCase())
        : [];

    const allResults: { title: string; content: string; postUrl: string; subreddit: string }[] = [];

    // If specific subreddits are specified, search each one individually
    // This ensures we only get posts from the specified subreddits
    if (normalizedSubreddits.length > 0) {
        console.log(`🔍 Searching ${normalizedSubreddits.length} subreddit(s): ${normalizedSubreddits.join(', ')}`);
        
        // Search each subreddit individually to ensure accurate results
        for (const subreddit of normalizedSubreddits) {
            try {
                const searchPath = `/r/${subreddit}/search.json`;
                const searchParams = new URLSearchParams();
                searchParams.set('q', fullQuery);
                searchParams.set('sort', 'new');
                searchParams.set('t', time);
                searchParams.set('limit', '25');
                searchParams.set('restrict_sr', 'true'); // Restrict to this subreddit only

                const searchUrl = `${REDDIT_JSON_API_BASE}${searchPath}?${searchParams.toString()}`;
                console.log(`  → Searching r/${subreddit}: ${searchUrl}`);

                let response;
                
                // Check if we're in production (Netlify) or development
                const isProduction = window.location.hostname !== 'localhost';
                const hasNetlifyFunction = isProduction || window.location.hostname.includes('netlify');
                
                console.log(`  🌐 Hostname: ${window.location.hostname}`);
                console.log(`  🔍 isProduction: ${isProduction}`);
                console.log(`  🔍 hasNetlifyFunction: ${hasNetlifyFunction}`);
                
                if (hasNetlifyFunction) {
                    // Use Netlify Function proxy in production or Netlify preview
                    console.log('  📡 Using Netlify Function proxy for Reddit API...');
                    const proxyUrl = '/.netlify/functions/reddit-proxy';
                    
                    console.log(`  📤 Sending to proxy:`, {
                        url: searchUrl,
                        hasClientId: !!creds?.clientId,
                        hasClientSecret: !!creds?.clientSecret
                    });
                    
                    response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            url: searchUrl,
                            clientId: creds?.clientId,
                            clientSecret: creds?.clientSecret
                        })
                    });
                    
                    console.log(`  📥 Proxy response status: ${response.status}`);
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`  ❌ Proxy error response:`, errorText);
                    }
                } else {
                    // Direct API call in development (will likely fail due to CORS)
                    console.log('  🔧 Development mode: Direct Reddit API call');
                    response = await fetch(searchUrl, {
                        headers: {
                            'User-Agent': userAgent,
                            'Accept': 'application/json',
                        }
                    });
                }

    if (!response.ok) {
                    if (response.status === 404) {
                        console.warn(`  ⚠️ Subreddit r/${subreddit} not found or is private`);
                        continue;
                    } else if (response.status === 429) {
                        console.warn(`  ⚠️ Rate limit hit while searching r/${subreddit}, continuing...`);
                        continue;
                    } else {
                        console.warn(`  ⚠️ Error searching r/${subreddit}: ${response.status}`);
                        continue;
                    }
    }

    const results = await response.json();
    
                if (results.data && results.data.children) {
                    const subredditResults = results.data.children
                        .map(({ data }: { data: RawRedditPost }) => ({
                            title: data.title,
                            content: data.selftext || '',
                            postUrl: `https://www.reddit.com${data.permalink}`,
                            subreddit: data.subreddit_name_prefixed,
                        }))
                        // Double-check that results are from the correct subreddit
                        .filter(post => {
                            const postSubreddit = post.subreddit.replace(/^r\//, '').toLowerCase();
                            return postSubreddit === subreddit;
                        });
                    
                    console.log(`  ✅ Found ${subredditResults.length} posts from r/${subreddit}`);
                    allResults.push(...subredditResults);
                }
            } catch (error) {
                if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    console.warn(`  ⚠️ CORS error searching r/${subreddit} - this is expected in development`);
                } else {
                    console.warn(`  ⚠️ Error searching r/${subreddit}:`, error instanceof Error ? error.message : 'Unknown error');
                }
                continue;
            }
        }
    } else {
        // No specific subreddits - search all of Reddit
        console.log('🔍 Searching all of Reddit (no specific subreddits specified)');
        const searchPath = '/search.json';
        const searchParams = new URLSearchParams();
        searchParams.set('q', fullQuery);
        searchParams.set('sort', 'new');
        searchParams.set('t', time);
        searchParams.set('limit', '25');

        const searchUrl = `${REDDIT_JSON_API_BASE}${searchPath}?${searchParams.toString()}`;
        console.log(`  → Search URL: ${searchUrl}`);

        let response;
        
        // Check if we're in production (Netlify) or development
        const isProduction = window.location.hostname !== 'localhost';
        const hasNetlifyFunction = isProduction || window.location.hostname.includes('netlify');
        
        if (hasNetlifyFunction) {
            // Use Netlify Function proxy in production or Netlify preview
            console.log('  📡 Using Netlify Function proxy for Reddit API...');
            const proxyUrl = '/.netlify/functions/reddit-proxy';
            
            response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: searchUrl,
                    clientId: creds?.clientId,
                    clientSecret: creds?.clientSecret
                })
            });
        } else {
            // Direct API call in development
            response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/json',
                }
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Reddit Search Error: ${response.status}`;
            
            if (response.status === 429) {
                errorMessage = 'Reddit API Rate limit exceeded. Please wait a moment before trying again.';
            } else if (response.status === 403) {
                errorMessage = 'Reddit API Access forbidden. The search query may not be allowed.';
            } else {
                errorMessage = `Reddit Search Error (${response.status}): ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }

        const results = await response.json();
        
        if (results.data && results.data.children) {
            const globalResults = results.data.children.map(({ data }: { data: RawRedditPost }) => ({
        title: data.title,
                content: data.selftext || '',
        postUrl: `https://www.reddit.com${data.permalink}`,
        subreddit: data.subreddit_name_prefixed,
    }));
            
            console.log(`  ✅ Found ${globalResults.length} posts from all of Reddit`);
            allResults.push(...globalResults);
        }
    }

    // Remove duplicates based on post URL
    const uniqueResults = Array.from(
        new Map(allResults.map(post => [post.postUrl, post])).values()
    );

    console.log(`📊 Total unique posts found: ${uniqueResults.length}`);
    
    return uniqueResults;
};
// --- End Reddit API Service Logic ---

// Demo data generators removed - using real API data only


export const generateComment = async (
  post: Post,
  campaign: Campaign,
  styleSettings: AIStyleSettings
): Promise<string> => {
  const platformAuthenticity = post.source === 'twitter'
      ? `For X/Twitter, use concise, engaging language. Keep it under 280 characters if possible. Use natural tone and avoid overly promotional language.`
      : `For Reddit, use natural language. Use platform-specific formatting (like *italics* for emphasis) if appropriate. Be mindful of subreddit-specific rules and etiquette.`;

  const prompt = `
    Your task is to generate a high-quality, engaging, and context-aware comment for a social media post. Your goal is to be helpful to the original poster and subtly introduce a relevant product/service without sounding like a spammer. You are acting as a representative of the product.

    **CAMPAIGN CONTEXT:**
    -   **Campaign Name:** ${campaign.name}
    -   **Campaign Goal:** Find potential customers by identifying posts where users are discussing problems our product can solve. The aim is to engage helpfully and introduce the product naturally.
    -   **Product Description:** ${campaign.description}
    -   **Target Keywords:** ${campaign.keywords.join(', ')}
    -   **Platform:** ${post.source}

    **POST ANALYSIS CONTEXT:**
    1.  **Source:** '${post.sourceName}'. Analyze its primary topic, community culture, and common post/comment style (e.g., formal, technical, supportive, meme-heavy). Your comment's tone must match the source's culture.
    2.  **Post Title:** "${post.title}".
    3.  **Post Content:** "${post.content}". Understand the author's problem, question, or story. What are their explicit and implicit needs?
    4.  **Sentiment:** Gauge the sentiment of the post. Is the author frustrated, curious, happy, seeking validation? Your comment should be empathetic to this sentiment.

    **COMMENT GENERATION INSTRUCTIONS:**
    -   **Primary Goal: BE HELPFUL.** Your first priority is to address the user's core problem or question directly. Offer genuine advice, share a relatable experience, or ask a thoughtful follow-up question. The product mention should feel like a natural extension of the help you're providing, not the main point.
    -   **Tone:** Adopt a '${styleSettings.tone}' tone.
    -   **Sales Approach:** Use a '${styleSettings.salesApproach}' approach.
        -   'Subtle': The product is a secondary suggestion, a an afterthought.
        -   'Moderate': A balanced approach, suggesting the product as a solid option among others or after providing initial value.
        -   'Direct': Straightforwardly suggest the product if the user is explicitly asking for solutions like yours.
        -   'Aggressive': Avoid this. It's not suitable for this context.
    -   **Custom Offer/Angle:** For this specific comment, focus on this aspect of the product: ${styleSettings.customOffer}
    -   **Integration:** If you mention the product, integrate it smoothly. For example: "I struggled with this too, and something that helped me frame my thoughts was using an app called PowerMinds..." is better than "You should check out PowerMinds."
    -   **Length:** The comment should be of '${styleSettings.length}' length.
    -   **Linking:** ${styleSettings.includeWebsiteLink && campaign.websiteUrl ? `If you include the website link, use this URL: ${campaign.websiteUrl}. Do it naturally at the end of the comment.` : 'Do not include any links.'}
    -   **Authenticity:** Do not sound like a corporate bot. ${platformAuthenticity} Avoid marketing jargon.

    Based on this comprehensive analysis and all the instructions, generate the comment now.
  `;
  
  try {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ?? '';
  } catch (error) {
    if (handleApiError(error)) {
      // Retry with new key
      return generateComment(post, campaign, styleSettings);
    }
    throw error;
  }
};

export const generateCampaignDetailsFromUrl = async (url: string): Promise<{ description: string; keywords: string[]; subreddits: string[] }> => {
    // In a real app, you might first fetch the URL content on a server-side proxy
    // to avoid CORS issues, then pass the content to the model.
    // Here, we'll just pass the URL and instruct the model to act as if it has read it.
    
    const prompt = `
        You are an expert digital marketing strategist. Analyze the content of the following website URL: ${url}

        Based on your analysis, provide the following in a JSON format:
        1.  **description**: A concise, one-paragraph summary of the product/service, framed as a value proposition for a potential customer. This should be good enough to be used as a base for ad copy.
        2.  **keywords**: A list of 5-10 highly relevant keywords suitable for finding potential customers on Reddit.
        3.  **subreddits**: A list of 3-5 relevant subreddit names (without the 'r/' prefix) where potential customers might be found.

        The goal is to understand the business so well that we can create targeted ads or find organic marketing opportunities.
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            description: {
                type: Type.STRING,
                description: 'A concise, one-paragraph summary of the product or service.',
            },
            keywords: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
                description: 'A list of 5-10 relevant keywords for Reddit.',
            },
            subreddits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 3-5 relevant subreddit names (without the 'r/' prefix)."
            }
        },
        required: ['description', 'keywords', 'subreddits'],
    };

    try {
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonStr = response.text;
        if (!jsonStr) {
            console.error("Received no response text from Gemini for URL generation.");
            throw new Error("Failed to get a valid response from the AI. The URL might be inaccessible or the content is not suitable.");
        }

        return JSON.parse(jsonStr.trim());
    } catch (error) {
        console.error("Failed to generate campaign details:", error);
        
        // Check if it's an overload error (don't retry on overload)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('overloaded') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
            throw new Error('The AI service is currently overloaded. Please try again in a moment or enter campaign details manually.');
        }
        
        // Only retry on API key errors
        if (handleApiError(error)) {
            // Retry with new key
            return generateCampaignDetailsFromUrl(url);
        }
        
        throw new Error('Failed to generate campaign details from URL. Please enter details manually.');
    }
};

const parseGeminiResponse = (responseText: string): any[] => {
    if (!responseText) {
        console.warn("Gemini response text is empty or undefined. This might happen if the query returned no results or was blocked.");
        return [];
    }
    let cleanedText = responseText.trim();
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        cleanedText = jsonMatch[1].trim();
    }

    // Try parsing the whole string first for the common, clean case.
    try {
        const maybeArray = JSON.parse(cleanedText);
        if (Array.isArray(maybeArray)) {
            return maybeArray;
        }
    } catch (e) {
        // Not a single valid JSON array, so proceed to find arrays within the text.
    }

    const allPosts: any[] = [];
    let searchIndex = 0;

    while (searchIndex < cleanedText.length) {
        const startIndex = cleanedText.indexOf('[', searchIndex);
        if (startIndex === -1) {
            break; // No more arrays found
        }

        let openBrackets = 1;
        let endIndex = -1;

        // Start searching for the closing bracket from the character after the opening one.
        for (let i = startIndex + 1; i < cleanedText.length; i++) {
            if (cleanedText[i] === '[') {
                openBrackets++;
            } else if (cleanedText[i] === ']') {
                openBrackets--;
            }
            if (openBrackets === 0) {
                endIndex = i;
                break;
            }
        }

        if (endIndex !== -1) {
            const jsonString = cleanedText.substring(startIndex, endIndex + 1);
            try {
                const parsedArray = JSON.parse(jsonString);
                if (Array.isArray(parsedArray)) {
                    allPosts.push(...parsedArray);
                }
            } catch (e) {
                // This segment looked like an array but wasn't valid JSON.
                // We can log this for debugging but continue searching the rest of the string.
                console.warn("Could not parse a potential JSON array segment:", jsonString);
            }
            // Continue searching from after the end of the parsed segment.
            searchIndex = endIndex + 1;
        } else {
            // Found an opening bracket that was never closed.
            // Stop searching to avoid an infinite loop.
            break;
        }
    }
    
    // It's possible to find and parse multiple valid arrays that are all empty.
    // In that case, allPosts will be empty.
    return allPosts;
};


const normalizeRedditUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
        return '';
    }
    let cleanUrl = url.trim();

    // Handle relative permalinks like '/r/...'
    if (cleanUrl.startsWith('/r/')) {
        cleanUrl = `https://www.reddit.com${cleanUrl}`;
    } 
    // Handle URLs missing a protocol like 'www.reddit.com/...' or 'reddit.com/...'
    else if (!/^(https?:)?\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
    }

    try {
        const parsedUrl = new URL(cleanUrl);

        // Rule 1: Must be a reddit.com domain.
        if (!parsedUrl.hostname.endsWith('reddit.com')) {
            console.warn(`URL is not from Reddit, filtering out: ${cleanUrl}`);
            return '';
        }

        // Rule 2: Must be a link to a post (pathname must include /comments/).
        // This prevents links to subreddits (e.g., /r/reactjs) or user profiles.
        if (!parsedUrl.pathname.includes('/comments/')) {
            console.warn(`URL is not a Reddit post link (missing '/comments/'), filtering out: ${cleanUrl}`);
            return '';
        }

        // Reconstruct a clean URL to remove trackers and hash.
        return `${parsedUrl.origin}${parsedUrl.pathname}`;

    } catch (e) {
        console.warn(`Could not parse invalid URL, filtering out: ${cleanUrl}`);
        return ''; // Invalid URL format
    }
};

// Discord URL normalization removed - only Reddit and Twitter are supported


// Validate and normalize Twitter URL
const normalizeTwitterUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return '';
    
    try {
        const cleanUrl = url.trim();
        const parsedUrl = new URL(cleanUrl);
        
        // Must be twitter.com or x.com
        if (!['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'].includes(parsedUrl.hostname)) {
            console.warn(`Invalid Twitter URL (wrong domain): ${cleanUrl}`);
            return '';
        }
        
        // Must have /status/ in path for a valid tweet
        if (!parsedUrl.pathname.includes('/status/')) {
            console.warn(`Invalid Twitter URL (not a tweet): ${cleanUrl}`);
            return '';
        }
        
        return cleanUrl;
    } catch (e) {
        console.warn(`Could not parse Twitter URL: ${url}`);
        return '';
    }
};

const processResults = (posts: any[], source: LeadSource): Omit<Post, 'id' | 'campaignId' | 'status'>[] => {
    return posts
        .map(p => {
            if (!p) return null;
            const url = p.url || p.postUrl;
            if (!url) return null;

            // Validate and normalize URL based on source
            const normalizedUrl = source === 'reddit' 
                ? normalizeRedditUrl(url) 
                : source === 'twitter'
                ? normalizeTwitterUrl(url)
                : '';

            if (!normalizedUrl) {
                console.warn(`❌ Filtered out ${source} post with invalid URL:`, p.title?.substring(0, 50), url);
                return null;
            }
            
            console.log(`✅ Valid ${source} post:`, normalizedUrl);
            
            return {
                url: normalizedUrl,
                source: source,
                sourceName: p.sourceName || p.subreddit || 'twitter',
                title: p.title,
                content: p.content,
                relevance: p.relevance,
            };
        })
        .filter((p): p is Omit<Post, 'id' | 'campaignId' | 'status'> => 
            !!p && 
            typeof p.relevance === 'number' && p.relevance >= 70 &&
            p.url && p.sourceName && p.title && p.content
        );
};

const findRedditPostsInternal = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>,
    redditCreds: RedditCredentials | null,
    userHasSubscription: boolean = false
): Promise<any[]> => {
    // Get the appropriate Reddit credentials (company API if subscribed, user's own if not)
    const effectiveCreds = getRedditCredentials(userHasSubscription, redditCreds);
    
    // Try Reddit API first if credentials are available
    if (effectiveCreds?.clientId) {
        try {
            const apiSource = userHasSubscription ? 'Company Reddit API' : 'User Reddit API';
            console.log(`🔴 Using ${apiSource} for real-time data...`);
            const redditPosts = await searchRedditApi(campaign, effectiveCreds);

            if (redditPosts.length === 0) {
                console.log("⚠️ Reddit API returned no posts. This could mean:");
                console.log("   - No posts match your search criteria");
                console.log("   - The date range is too restrictive");
                console.log("   - The subreddits specified don't have recent activity");
                return [];
            }
            
            console.log(`✅ Reddit API found ${redditPosts.length} posts. Analyzing with AI...`);
            
            const postMap = new Map(redditPosts.map(p => [normalizeRedditUrl(p.postUrl), { title: p.title, content: p.content, subreddit: p.subreddit }]));
            const postsForAnalysis = redditPosts.map(p => ({ postUrl: normalizeRedditUrl(p.postUrl), title: p.title, content: p.content }));

            const prompt = `You are an elite lead qualification expert specializing in Reddit. I have a list of posts from the Reddit API. Your task is to analyze this list and provide a relevance score for each post.
              **CAMPAIGN CONTEXT:**
              - **Product Description:** ${campaign.description}
              - **Target Keywords:** ${campaign.keywords.join(', ')}
              **INSTRUCTIONS:**
              1.  **Analyze Posts:** Read the title and content for each post in the JSON array below.
              2.  **Score Relevance (0-100):** 
                  *   90-100: User is EXPLICITLY asking for a tool/service that matches the product.
                  *   70-89: User is describing a problem the product solves, but not asking for a solution.
                  *   <70: General discussion. DO NOT INCLUDE these.
              3.  **Output:** Return a JSON array for posts with a score >= 70. Each object must contain ONLY the original \`postUrl\` and your calculated \`relevance\` score.
              **POSTS TO ANALYZE:**
              ${JSON.stringify(postsForAnalysis)}
              If no posts are relevant, return an empty array: \`[]\`.`;

            const geminiResponse = await ai.models.generateContent({ model: "gemini-2.5-pro", contents: prompt });
            const scoredPosts = parseGeminiResponse(geminiResponse.text);
            
            const filteredPosts = scoredPosts.map((scoredPost: { postUrl: string; relevance: number }) => {
                if (!scoredPost?.postUrl) return null;
                const normalizedUrl = normalizeRedditUrl(scoredPost.postUrl);
                
                // Validate URL format
                if (!normalizedUrl.startsWith('https://www.reddit.com/r/') && !normalizedUrl.startsWith('https://reddit.com/r/')) {
                    console.warn('⚠️ Invalid Reddit URL format:', normalizedUrl);
                    return null;
                }
                
                const originalPostData = postMap.get(normalizedUrl);
                return originalPostData ? { ...originalPostData, postUrl: normalizedUrl, relevance: scoredPost.relevance } : null;
            }).filter(Boolean);
            
            console.log(`✅ Reddit API: Found ${filteredPosts.length} relevant posts after AI analysis`);
            return filteredPosts;
        } catch (error) {
            console.error("❌ Reddit API search failed:", error);
            console.log("⚠️ No fallback available - Reddit API is required for accurate results");
            throw new Error("Reddit API failed. Please check your credentials or try again later.");
        }
    } else {
        console.log("⚠️ No Reddit API credentials available");
        throw new Error("Reddit API credentials required. Please add them in Settings.");
    }
    
    // Remove Gemini Search fallback - it returns fake/irrelevant posts
    // Only use real Reddit API data
    console.log("❌ Gemini Search fallback removed - only real Reddit posts are returned");
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const negativeKeywordsQuery = campaign.negativeKeywords?.length ? ` (excluding posts with these keywords: ${campaign.negativeKeywords.join(', ')})` : '';
    const subredditsQuery = campaign.subreddits?.length ? `within these subreddits: ${campaign.subreddits.map(s => `r/${s}`).join(', ')}` : 'across all of Reddit';
    const dateQuery = { lastDay: 'within the last 24 hours', lastWeek: 'within the last 7 days', lastMonth: 'within the last month' }[campaign.dateRange];

    const prompt = `You are a lead generation expert. Search Reddit for recent posts where people are discussing problems related to: ${campaign.description}

**SEARCH TASK:**
Use Google Search with "site:reddit.com" to find posts about: ${keywordsQuery}
${negativeKeywordsQuery ? `EXCLUDE posts containing: ${campaign.negativeKeywords?.join(', ')}` : ''}
${campaign.subreddits?.length ? `Focus on subreddits: ${campaign.subreddits.map(s => `r/${s}`).join(', ')}` : 'Search across all Reddit'}
Timeframe: ${dateQuery}

**CRITICAL REQUIREMENTS:**
1. Each postUrl MUST be a real, direct Reddit permalink (format: https://www.reddit.com/r/subreddit/comments/abc123/title/)
2. VERIFY the URL exists and is accessible before including it
3. The content MUST be the actual post text, not a summary
4. The subreddit MUST match the URL (e.g., if URL is r/webdev, subreddit should be "r/webdev")
5. Only include posts where someone is asking for help, describing a problem, or looking for solutions
6. Score 90-100: Explicitly asking for a tool/solution. Score 70-89: Describing a clear problem
7. EXCLUDE: promotional posts, spam, irrelevant content, or posts with score below 70

**OUTPUT FORMAT (JSON only):**
\`\`\`json
[
  {
    "postUrl": "https://www.reddit.com/r/subreddit/comments/abc123/title/",
    "subreddit": "r/subreddit",
    "title": "exact post title",
    "content": "exact post text here",
    "relevance": 85
  }
]
\`\`\`

If no relevant posts found, return empty array: \`[]\`

IMPORTANT: Only return posts with REAL, VERIFIED URLs. Do not make up or guess URLs.`;
    
    try {
        if (!currentApiKey || currentApiKey === 'PLACEHOLDER_API_KEY') {
            console.error("❌ Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.");
            throw new Error('Gemini API key is required. Please configure it in your environment variables.');
        }
        console.log("🤖 Using Gemini AI for Reddit search with API key...");
        
        // Try with gemini-2.5-pro first, fallback to gemini-2.5-flash if overloaded
        let geminiResponse;
        try {
            geminiResponse = await ai.models.generateContent({ 
                model: "gemini-2.5-pro", 
                contents: prompt, 
                config: { tools: [{googleSearch: {}}] } 
            });
        } catch (proError: any) {
            if (proError?.message?.includes('503') || proError?.message?.includes('overloaded')) {
                console.warn("⚠️ Gemini Pro model overloaded, trying Flash model...");
                geminiResponse = await ai.models.generateContent({ 
                    model: "gemini-2.5-flash", 
                    contents: prompt, 
                    config: { tools: [{googleSearch: {}}] } 
                });
            } else {
                throw proError;
            }
        }
        
        return parseGeminiResponse(geminiResponse.text);
    } catch (error) {
        console.error("❌ Gemini API search failed:", error);
        if (error instanceof Error) {
            if (error.message.includes('503') || error.message.includes('overloaded')) {
                console.warn("⚠️ Both Gemini models are overloaded. Please try again in a few moments.");
                return [];
            }
            if (error.message.includes('API key') || error.message.includes('quota')) {
                throw new Error('Gemini API error: ' + error.message);
            }
        }
        // For other errors, return empty array
        return [];
    }
};

// Discord support removed - only Reddit and Twitter are supported now

const findTwitterPostsInternal = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>
): Promise<any[]> => {
    console.log("🐦 Searching Twitter/X for leads...");
    
    // Note: Twitter API cannot be called from browser due to CORS restrictions
    // We use Gemini Search as the primary method for Twitter
    console.log("🔵 Using Gemini Search for Twitter/X (Twitter API requires backend proxy)...");
    
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const dateQuery = { lastDay: 'within the last 24 hours', lastWeek: 'within the last 7 days', lastMonth: 'within the last month' }[campaign.dateRange];
    
    const prompt = `You are a lead generation expert. Search Twitter/X ONLY (NOT Reddit) for recent tweets where people are discussing problems related to: ${campaign.description}

**SEARCH TASK:**
Use Google Search with "site:twitter.com" OR "site:x.com" to find tweets about: ${keywordsQuery}
Timeframe: ${dateQuery}

**CRITICAL REQUIREMENTS:**
1. ONLY TWITTER/X URLS - Each URL MUST start with "https://twitter.com/" or "https://x.com/"
2. DO NOT include Reddit URLs (reddit.com) - we only want Twitter/X posts
3. Format: https://twitter.com/username/status/1234567890 or https://x.com/username/status/1234567890
4. VERIFY the URL exists and is accessible before including it
5. The content MUST be the actual tweet text, not a summary
6. Only include tweets where someone is asking for help, describing a problem, or looking for solutions
7. Score 90-100: Explicitly asking for a tool/solution. Score 70-89: Describing a clear problem
8. EXCLUDE: promotional tweets, spam, irrelevant content, Reddit posts, or tweets with score below 70

**OUTPUT FORMAT (JSON only):**
\`\`\`json
[
  {
    "postUrl": "https://twitter.com/username/status/1234567890",
    "subreddit": "twitter",
    "title": "Tweet by @username",
    "content": "exact tweet text here",
    "relevance": 85
  }
]
\`\`\`

If no relevant tweets found, return empty array: \`[]\`

IMPORTANT: 
- Only return TWITTER/X URLs (twitter.com or x.com)
- DO NOT return Reddit URLs (reddit.com)
- Only return tweets with REAL, VERIFIED URLs
- Do not make up or guess URLs`;
    
    try {
        let geminiResponse;
        try {
            geminiResponse = await ai.models.generateContent({ 
                model: "gemini-2.5-pro", 
                contents: prompt, 
                config: { tools: [{googleSearch: {}}] } 
            });
        } catch (proError: any) {
            if (proError?.message?.includes('503') || proError?.message?.includes('overloaded')) {
                console.warn("⚠️ Gemini Pro overloaded, trying Flash...");
                geminiResponse = await ai.models.generateContent({ 
                    model: "gemini-2.5-flash", 
                    contents: prompt, 
                    config: { tools: [{googleSearch: {}}] } 
                });
            } else {
                throw proError;
            }
        }
        
        return parseGeminiResponse(geminiResponse.text);
    } catch (error) {
        console.error("❌ Twitter/Gemini search failed:", error);
        return [];
    }
};


export const findLeads = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>,
    redditCreds: RedditCredentials | null,
    userHasSubscription: boolean = false
): Promise<Omit<Post, 'id' | 'campaignId' | 'status'>[]> => {
    
    const promises: Promise<Omit<Post, 'id' | 'campaignId' | 'status'>[]>[] = [];

    if (campaign.leadSources.includes('reddit')) {
        promises.push(
            findRedditPostsInternal(campaign, redditCreds, userHasSubscription)
                .then(posts => processResults(posts, 'reddit'))
                .catch(err => { 
                    console.error("Error finding Reddit posts:", err); 
                    // Return empty array on error - fallback already handled in findRedditPostsInternal
                    return []; 
                })
        );
    }

    if (campaign.leadSources.includes('twitter')) {
        promises.push(
            findTwitterPostsInternal(campaign)
                .then(tweets => processResults(tweets, 'twitter'))
                .catch(err => { console.error("Error finding Twitter posts:", err); return []; })
        );
    }
    
    try {
        const results = await Promise.all(promises);
        const allFoundPosts = results.flat();
        
        // Combine, sort, and limit final results
        return allFoundPosts
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 15);
    } catch (error) {
        console.error("Error during lead finding:", error);
        throw new Error("Failed to find leads. Please try again.");
    }
};