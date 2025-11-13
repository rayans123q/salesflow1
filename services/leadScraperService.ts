import { apiKeyManager } from './apiKeyManager';
import { GroundingChunk, ScrapedContactInfo, PersonInfo, SocialMediaHandles } from '../types';

/**
 * A higher-order function that wraps an async function with retry logic.
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimitError = error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));

      if (isRateLimitError) {
        console.warn(`Rate limit error encountered. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        delay += Math.floor(Math.random() * 1000); // Add jitter
      } else {
        // Don't retry on other types of errors
        throw error;
      }
    }
  }
  // If all retries fail, throw the last captured error
  throw lastError;
};

export const findCompaniesWithComponent = async (componentQuery: string): Promise<GroundingChunk[]> => {
  try {
    const response = await withRetry(async () => {
      const result = await apiKeyManager.makeGeminiRequest({
        model: "gemini-2.5-flash",
        contents: `Your task is to act as a B2B market researcher. Your goal is to find the official homepages of companies that sell or are primarily known for providing the software component or service: '${componentQuery}'.

Please adhere to these strict guidelines:
1.  **Official Homepages Only**: The URLs you return MUST be the main, official homepage of the company (e.g., https://stripe.com, NOT a blog post, news article, documentation page, or GitHub repository).
2.  **High Relevance**: The company must be a direct provider or a well-known specialist in the requested component or service. Avoid companies that only mention it tangentially.
3.  **Actionable Results**: The goal is to find companies for a sales prospecting list. The results should be commercial entities.

Return a list of websites for these companies.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return result;
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && Array.isArray(groundingChunks)) {
      return groundingChunks.filter(chunk => chunk.web && chunk.web.uri) as GroundingChunk[];
    }
    
    return [];

  } catch (error) {
    console.error("Error calling Gemini API for company search:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
         throw new Error("API rate limit exceeded after multiple retries. Please check your Gemini API plan and billing details, or try again later.");
    }
    throw new Error("Failed to fetch data from the AI. Please try again.");
  }
};

const scrapeSingleChunk = async (chunk: GroundingChunk): Promise<ScrapedContactInfo> => {
    const { title, uri } = chunk.web;
    try {
        const prompt = `Your task is to act as a meticulous web data extractor. You have been given a potential company name, "${title}", and a starting URL, "${uri}". Your goal is to find the company's official website and extract accurate contact information.

**CRITICAL FIRST STEP: Website Verification**
1.  Analyze the provided URL: ${uri}.
2.  Determine if this URL is the company's official homepage.
3.  If it is NOT the homepage (e.g., it's a news article, blog post, review, or directory listing), you MUST perform a search to find the correct, official homepage for the company named "${title}".
4.  All subsequent data extraction MUST happen from the verified, official homepage.

Once you have the official homepage, perform targeted searches to extract the following information. **It is critical that you only return information you can verify as correct. Do not invent, guess, or assume any information, especially URLs.**

1.  **Final URL**: The final, canonical URL of the company's official website that you analyzed.
2.  **Generic Emails**: Any publicly listed generic contact email addresses (e.g., info@, sales@, contact@, support@).
3.  **Company Social Media**: Full URLs for the company's main social media profiles (YouTube, Facebook, Instagram, X/Twitter, LinkedIn). **Only include a URL if you can confirm it is the official, active company page. If a link cannot be verified, omit the key for that platform.**
4.  **People**: A list of key executives and decision-makers (e.g., CEO, CTO, Marketing Director, Head of Sales). For each person, extract:
    *   Their full name.
    *   Their role/title.
    *   Their professional email address, if publicly available.
    *   **Find their INDIVIDUAL professional social media profile URLs.** Focus on LinkedIn and X/Twitter. The link must be for the specific person (e.g., linkedin.com/in/john-doe), NOT the company's page. **Crucially, only include a URL if you can verify that it is a valid, working link leading to the correct person's profile. Do not guess or invent URLs. If you cannot find a verified link, omit the key for that platform.**

Return the data in the specified JSON format. If a piece of information isn't found, omit its key entirely.`;
        
        const response = await withRetry(async () => {
          return await apiKeyManager.makeGeminiRequest({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  url: { type: "string", description: "The final, canonical URL of the company's website that was analyzed." },
                  emails: {
                    type: "array",
                    description: "Publicly listed generic contact email addresses.",
                    items: { type: "string" }
                  },
                  socialMedia: {
                    type: "object",
                    description: "Full URLs for main company social media profiles. Omit keys for platforms not found.",
                    properties: {
                      youtube: { type: "string" },
                      facebook: { type: "string" },
                      instagram: { type: "string" },
                      x: { type: "string" },
                      linkedin: { type: "string" }
                    }
                  },
                  people: {
                    type: "array",
                    description: "List of key executives. For each person, include name, role, email, and *individual* social media URLs.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Full name." },
                        role: { type: "string", description: "Role or title." },
                        email: { type: "string", description: "Professional email address." },
                        socialMedia: {
                          type: "object",
                          description: "Full URLs for the person's professional social media profiles (e.g. LinkedIn, X/Twitter). Omit keys for platforms not found.",
                          properties: {
                            youtube: { type: "string" },
                            facebook: { type: "string" },
                            instagram: { type: "string" },
                            x: { type: "string" },
                            linkedin: { type: "string" }
                          }
                        }
                      },
                      required: ["name", "role"]
                    }
                  }
                },
                required: ["url", "people"]
              }
            }
          });
        });

        const resultText = response.text;
        const parsedJson = JSON.parse(resultText) as ScrapedContactInfo;

        return {
            url: parsedJson.url || uri,
            emails: parsedJson.emails || [],
            socialMedia: parsedJson.socialMedia || {},
            people: parsedJson.people || [],
        };
    } catch (error) {
        console.error(`Error scraping chunk ${title} (${uri}):`, error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
             throw new Error("API rate limit exceeded during scraping after multiple retries. The process has been stopped. Please check your billing details and try again later.");
        }
        // Return a partial result on other, non-fatal errors
        return {
            url: uri,
            emails: [],
            socialMedia: {},
            people: [],
        };
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scrapeContactInfoFromUrls = async (chunks: GroundingChunk[], onProgress: (scrapedItem: ScrapedContactInfo) => void): Promise<void> => {
  for (const chunk of chunks) {
    try {
      const scrapedItem = await scrapeSingleChunk(chunk);
      onProgress(scrapedItem);
      // Add a delay between requests to avoid hitting API rate limits.
      await sleep(2000); 
    } catch (error) {
      console.error("A fatal error occurred during scraping, stopping process:", error);
      // Re-throw the specific error message to be displayed in the UI
      throw error;
    }
  }
};

export const generateKeywords = async (source: { url?: string; description?: string }): Promise<string[]> => {
  let prompt: string;

  if (source.url) {
    prompt = `Based on public information available about the company at the website "${source.url}", what are its main products, services, or software components? Generate a list of 5 to 7 concise search keywords or phrases someone could use to find similar companies or competitors. These keywords should be specific and relevant for finding B2B prospects.`;
  } else if (source.description) {
    prompt = `Analyze the following business description: "${source.description}". Identify the core products, services, or software components offered. Based on this, generate a list of 5 to 7 concise search keywords or phrases someone could use to find similar companies or competitors. These keywords should be specific and relevant for finding B2B prospects.`;
  } else {
    throw new Error("A URL or a description must be provided to generate keywords.");
  }

  try {
    const response = await withRetry(async () => {
      return await apiKeyManager.makeGeminiRequest({
        model: "gemini-2.5-flash",
        contents: `${prompt}\n\nReturn the keywords as a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            description: "A list of 5 to 7 concise search keywords or phrases.",
            items: { type: "string" }
          }
        }
      });
    });
    
    const resultText = response.text;
    const parsedJson = JSON.parse(resultText) as string[];

    if (Array.isArray(parsedJson)) {
      return parsedJson;
    }

    return [];

  } catch (error) {
    console.error("Error calling Gemini API for keyword generation:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
         throw new Error("API rate limit exceeded after multiple retries. Please check your Gemini API plan and billing details, or try again later.");
    }
    throw new Error("Failed to generate keywords from the AI. Please check your input and try again.");
  }
};

export const generateOutreachMessage = async (
  personName: string,
  personRole: string,
  companyUrl: string,
  userOffer: string,
  messageType: 'email' | 'dm'
): Promise<string> => {
  const prompt = `
    You are an expert sales development representative specializing in highly personalized, effective outreach.
    Your task is to write a compelling outreach message.

    **My Product/Service Offer:**
    ${userOffer}

    **Prospect Information:**
    - Name: ${personName}
    - Role: ${personRole}
    - Company Website: ${companyUrl}

    **Message Type:**
    ${messageType}

    **Strict Instructions:**
    1.  **Personalize:** Start with a hook that is specific to the prospect's role or company. Briefly reference their company's work if possible (based on the URL). Do NOT use generic phrases like "I hope this email finds you well."
    2.  **Connect:** Clearly and concisely connect my offer to a potential challenge or goal relevant to their specific role. Show that you've thought about their needs.
    3.  **Value Proposition:** Briefly highlight the key benefit of my offer.
    4.  **Call to Action (CTA):** End with a clear, low-friction CTA. Suggest a brief call or ask a simple question to encourage a reply.
    5.  **Tone:** Maintain a professional, respectful, and confident tone. Avoid overly casual language or aggressive sales tactics.
    6.  **Format:**
        - If the type is 'email', the response MUST begin with a compelling, short subject line, followed by "---", and then the email body. Example: "Subject: Idea for [Company Name] --- Hello ${personName},..."
        - If the type is 'dm', the message must be a single block of text suitable for platforms like X (Twitter) or LinkedIn. It must be under 280 characters and should be slightly more conversational. Do not include a subject line.

    Generate the message now based on these instructions.
  `;

  try {
    const response = await withRetry(async () => {
      return await apiKeyManager.makeGeminiRequest({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for outreach message generation:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
      throw new Error("API rate limit exceeded after multiple retries. Please try again in a moment.");
    }
    throw new Error("Failed to generate the message. Please check your offer description and try again.");
  }
};