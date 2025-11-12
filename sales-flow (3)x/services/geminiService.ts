

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIStyleSettings, Campaign, Post, LeadSource, CommentVariations } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not set');
}
const genAI = new GoogleGenerativeAI(apiKey);

export const generateComment = async (
  post: Post,
  campaign: Campaign,
  styleSettings: AIStyleSettings
): Promise<CommentVariations> => {

  const prompt = `
    Your task is to generate a JSON object containing three high-quality, engaging, and context-aware comment variations for a social media post. Your goal is to be helpful to the original poster and subtly introduce a relevant product/service without sounding like a spammer. You are acting as a representative of the product.

    **CAMPAIGN CONTEXT:**
    - **Product Description:** ${campaign.description}
    - **Target Keywords:** ${campaign.keywords.join(', ')}
    - **Platform:** ${post.source}

    **POST ANALYSIS CONTEXT:**
    - **Source:** '${post.sourceName}'.
    - **Post Title:** "${post.title}".
    - **Post Content:** "${post.content}".
    - **User's Core Problem (Pain Point):** "${post.painPoint}"

    **COMMENT GENERATION INSTRUCTIONS:**
    - **Primary Goal: BE HELPFUL.** Your first priority is to address the user's core problem.
    - **Tone:** Adopt a '${styleSettings.tone}' tone.
    - **Sales Approach:** Use a '${styleSettings.salesApproach}' approach.
    - **Custom Offer/Angle:** Focus on this aspect of the product: ${styleSettings.customOffer}
    - **Length:** The comment should be of '${styleSettings.length}' length.
    - **Linking:** ${styleSettings.includeWebsiteLink && campaign.websiteUrl ? `If you include the website link, use this URL: ${campaign.websiteUrl}. Do it naturally at theend.` : 'Do not include any links.'}
    - **Authenticity:** Do not sound like a corporate bot. Avoid marketing jargon.

    **GENERATE THREE COMMENT VARIATIONS:**
    1.  **Helpful:** A comment focused purely on empathy and providing value. The product mention should be very subtle, almost an afterthought.
    2.  **Questioning:** A comment that asks a thoughtful follow-up question to encourage a reply, then gently introduces the product as a potential solution to explore.
    3.  **Direct:** A more confident comment that, after acknowledging the user's problem, directly suggests the product as a solution.

    Based on all instructions, generate the JSON object now.
  `;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  
  const response = await model.generateContent(prompt);

  try {
      const jsonStr = response.response.text().trim();
      return JSON.parse(jsonStr) as CommentVariations;
  } catch (e) {
      console.error("Failed to parse comment variations from Gemini:", e);
      throw new Error("Failed to generate valid comment variations.");
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
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const response = await model.generateContent(prompt);
    
    const jsonStr = response.response.text();
    if (!jsonStr) {
        console.error("Received no response text from Gemini for URL generation.");
        throw new Error("Failed to get a valid response from the AI. The URL might be inaccessible or the content is not suitable.");
    }

    try {
        return JSON.parse(jsonStr.trim());
    } catch (e) {
        console.error("Failed to parse JSON for URL generation:", e);
        console.error("Original text from Gemini:", jsonStr);
        throw new Error("Failed to parse AI response. The format was unexpected.");
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

    if (cleanUrl.startsWith('/r/')) {
        cleanUrl = `https://www.reddit.com${cleanUrl}`;
    } else if (!/^(https?:)?\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
    }

    try {
        const parsedUrl = new URL(cleanUrl);

        if (!/^(www\.|old\.|new\.)?reddit\.com$/.test(parsedUrl.hostname)) {
            console.warn(`URL is not from a recognized Reddit domain, filtering out: ${cleanUrl}`);
            return '';
        }

        if (!parsedUrl.pathname.includes('/comments/')) {
            console.warn(`URL is not a Reddit post link (missing '/comments/'), filtering out: ${cleanUrl}`);
            return '';
        }

        // Reconstruct a clean URL to remove trackers, queries, and hash.
        return `https://www.reddit.com${parsedUrl.pathname}`;

    } catch (e) {
        console.warn(`Could not parse invalid URL, filtering out: ${cleanUrl}`);
        return '';
    }
};

const normalizeDiscordUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
        return '';
    }
    let cleanUrl = url.trim();

    if (!/^(https?:)?\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
    }
    
    try {
        const parsedUrl = new URL(cleanUrl);

        if (parsedUrl.hostname !== 'discord.com') {
            console.warn(`URL is not from Discord, filtering out: ${cleanUrl}`);
            return '';
        }

        const pathRegex = /^\/channels\/\d+\/\d+\/\d+$/;
        if (!pathRegex.test(parsedUrl.pathname)) {
            console.warn(`URL is not a Discord message link (invalid path), filtering out: ${cleanUrl}`);
            return '';
        }

        return `${parsedUrl.origin}${parsedUrl.pathname}`;

    } catch (e) {
        console.warn(`Could not parse invalid Discord URL, filtering out: ${cleanUrl}`);
        return '';
    }
};


const processResults = (posts: any[], source: LeadSource): Omit<Post, 'id' | 'campaignId' | 'status'>[] => {
    return posts
        .map(p => {
            if (!p) return null;
            const url = p.url || p.postUrl;
            if (!url) return null;

            const normalizedUrl = source === 'reddit' 
                ? normalizeRedditUrl(url) 
                : source === 'discord' 
                    ? normalizeDiscordUrl(url) 
                    : '';

            if (!normalizedUrl) {
                console.warn(`Filtered out ${source} post with invalid URL:`, p.title, url);
                return null;
            }
            return {
                url: normalizedUrl,
                source: source,
                sourceName: p.sourceName || p.subreddit,
                title: p.title,
                content: p.content,
                relevance: p.relevance,
                painPoint: p.painPoint,
            };
        })
        .filter((p): p is Omit<Post, 'id' | 'campaignId' | 'status'> => 
            !!p && 
            typeof p.relevance === 'number' && p.relevance >= 70 &&
            p.url && p.sourceName && p.title && p.content && p.painPoint
        );
};

const findRedditPostsInternal = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>
): Promise<any[]> => {
    console.log("Using Google Search via Gemini for Reddit posts...");
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const negativeKeywordsQuery = campaign.negativeKeywords?.length ? ` (excluding posts with these keywords: ${campaign.negativeKeywords.join(', ')})` : '';
    const subredditsQuery = campaign.subreddits?.length ? `within these subreddits: ${campaign.subreddits.map(s => `r/${s}`).join(', ')}` : 'across all of Reddit';
    const dateQuery = { lastDay: 'within the last 24 hours', lastWeek: 'within the last 7 days', lastMonth: 'within the last month' }[campaign.dateRange];

    const prompt = `You are an expert lead prospector specializing in Reddit. Your main tool is constructing advanced Google search queries (dorks) to find hyper-relevant posts where users are discussing problems.

      **CAMPAIGN CONTEXT:**
      - **Product Description:** ${campaign.description}

      **SEARCH METHODOLOGY:**
      Your goal is to find posts where users are describing problems, seeking advice, or sharing negative experiences that our product can solve. To do this, you will construct sophisticated Google search queries that combine the campaign's keywords with "intent phrases".

      **Advanced Query Structure Example:**
      \`("Primary Keyword 1" OR "Primary Keyword 2") AND ("my biggest struggle" OR "I'm having issues with" OR "pain point") site:reddit.com inurl:comments\`
      This structure is extremely effective. You must use it.

      **SEARCH CRITERIA & KEYWORDS TO USE:**
      - **Primary Keywords:** Use these as your base: ${keywordsQuery}.
      - **Intent Phrases (Combine with Primary Keywords):** You must combine the primary keywords with a mix of the following phrases to find users expressing a need:
        - **Personal Experience:** \`intext:"I think"|"I feel"|"I experienced"|"my experience"|"in my opinion"|"IMO"|"my biggest struggle"|"my biggest fear"|"I found that"|"I learned"|"I realized"|"my advice"\`
        - **Problem Words:** \`"struggles"|"problems"|"issues"|"challenge"|"difficulties"|"hardships"|"pain point"\`
        - **Help Seeking:** \`"barriers"|"obstacles"|"concerns"|"frustrations"|"worries"|"what I wish I knew"|"what I regret"|"how do I solve"|"any suggestions for"\`
      - **Negative Keywords:** ${negativeKeywordsQuery || 'None.'} Ensure your search query excludes results with these terms.
      - **Subreddits:** Search ${subredditsQuery}. If specific subreddits are provided, add them to your query (e.g., \`site:reddit.com/r/subreddit_name\`).
      - **Timeframe:** Find posts created ${dateQuery}. Use Google Search's time filter tools for this.

      **INSTRUCTIONS:**
      1.  **Construct & Execute Query:** Create and execute advanced Google search queries based on the criteria. Find up to 10 highly relevant Reddit comment threads.
      2.  **Analyze & Score:** Score relevance from 0-100 (90-100 for explicit requests, 70-89 for clear problems). Exclude any post below 70.
      3.  **Extract Pain Point:** For each relevant post, write a single, concise sentence that summarizes the user's core problem. This is the 'painPoint'.
      4.  **Data Integrity:** Ensure \`postUrl\`, \`subreddit\`, \`title\`, \`content\`, and \`painPoint\` for each object belong to the *same* post. URLs must be clean permalinks.
      5.  **Final Output:** Return ONLY a JSON array of post objects for relevant posts (score >= 70).

      **JSON SCHEMA (Strictly adhere to this):**
      \`\`\`json
      [ { "postUrl": "full_permalink_to_the_post", "subreddit": "r/subreddit_name", "title": "post_title", "content": "verbatim_post_content_or_a_detailed_summary", "relevance": score_from_70_to_100, "painPoint": "The user's core problem summarized in one sentence." } ]
      \`\`\`
      If you find no relevant posts, you MUST return an empty array: \`[]\`.`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const geminiResponse = await model.generateContent(prompt);
    return parseGeminiResponse(geminiResponse.response.text());
};

const findDiscordMessagesInternal = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>
): Promise<any[]> => {
    console.log("Using Google Search via Gemini for Discord messages...");
    const keywordsQuery = campaign.keywords.map(kw => `"${kw}"`).join(' OR ');
    const negativeKeywordsQuery = campaign.negativeKeywords?.length ? ` (excluding messages with these keywords: ${campaign.negativeKeywords.join(', ')})` : '';
    const dateQuery = { lastDay: 'within the last 24 hours', lastWeek: 'within the last 7 days', lastMonth: 'within the last month' }[campaign.dateRange];

    const prompt = `You are an elite lead qualification expert for Discord. Use search to find recent, public Discord messages that are potential leads.
      **CAMPAIGN CONTEXT:**
      - **Product Description:** ${campaign.description}
      **INSTRUCTIONS:**
      1.  **Search & Analyze:** Find up to 10 highly relevant messages discussing: ${keywordsQuery}. Exclude ${negativeKeywordsQuery || 'None.'}. Find messages created ${dateQuery}. Focus on users describing a problem. Use search terms like "site:discord.com".
      2.  **Score Relevance (0-100):** 90-100 for explicit requests, 70-89 for clear problem descriptions. Exclude any message with a score below 70.
      3.  **Extract Pain Point:** For each relevant message, write a single, concise sentence that summarizes the user's core problem. This is the 'painPoint'.
      4.  **Data Integrity:** The \`url\` MUST be a direct permalink to a specific message. All data points (\`url\`, \`sourceName\`, \`title\`, \`content\`, \`painPoint\`) must belong to the *same* message.
      5.  **Final Output:** Return ONLY a JSON array of message objects for relevant messages (score >= 70).
      **JSON SCHEMA:**
      \`\`\`json
      [ { "url": "direct_and_public_permalink_to_the_specific_message", "sourceName": "ServerName#channel", "title": "Concise title, e.g., 'Message from username'", "content": "verbatim_message_content_truncated", "relevance": score_from_70_to_100, "painPoint": "The user's core problem summarized in one sentence." } ]
      \`\`\`
      If no relevant messages are found, return an empty array: \`[]\`.`;
        
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const geminiResponse = await model.generateContent(prompt);
    return parseGeminiResponse(geminiResponse.response.text());
};

export const generateUserProfileSummary = async (post: Post): Promise<string> => {
    const prompt = `You are a sales intelligence analyst. Use Google Search to analyze the author of the following post: ${post.url}. Find their user profile and public post/comment history. Synthesize this information into a concise, one-paragraph summary covering their likely profession, interests, sentiment, and any recurring problems they discuss. Focus on details relevant to B2B sales qualification. For example: "This user appears to be a senior software developer, frequently active in r/devops and r/programming. They have recently expressed frustration with CI/CD pipeline complexity and cloud hosting costs, suggesting they may be a decision-maker or key influencer on a small-to-medium-sized team." If you cannot find sufficient information, return the string "Could not gather sufficient profile information from public activity."`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const response = await model.generateContent(prompt);
    
    return response.response.text() ?? 'Could not generate a profile summary.';
};


export const findLeads = async (
    campaign: Omit<Campaign, 'id' | 'status' | 'leadsFound' | 'highPotential' | 'contacted' | 'createdAt' | 'lastRefreshed'>
): Promise<Omit<Post, 'id' | 'campaignId' | 'status'>[]> => {
    
    const promises: Promise<Omit<Post, 'id' | 'campaignId' | 'status'>[]>[] = [];

    if (campaign.leadSources.includes('reddit')) {
        promises.push(
            findRedditPostsInternal(campaign)
                .then(posts => processResults(posts, 'reddit'))
                .catch(err => { console.error("Error finding Reddit posts:", err); return []; })
        );
    }

    if (campaign.leadSources.includes('discord')) {
        promises.push(
            findDiscordMessagesInternal(campaign)
                .then(messages => processResults(messages, 'discord'))
                .catch(err => { console.error("Error finding Discord messages:", err); return []; })
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