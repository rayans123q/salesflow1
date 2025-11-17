// Reddit Rules Scraper - Extracts real rules from Reddit HTML
// Since Reddit API blocks us, we scrape the actual webpage

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { subreddit } = JSON.parse(event.body);

        if (!subreddit) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Subreddit name is required' })
            };
        }

        const cleanSubreddit = subreddit.replace(/^r\//, '');
        console.log(`🕷️ Scraping rules for r/${cleanSubreddit}...`);

        // Try multiple URLs
        const urls = [
            `https://old.reddit.com/r/${cleanSubreddit}/about/rules`,
            `https://old.reddit.com/r/${cleanSubreddit}`,
            `https://www.reddit.com/r/${cleanSubreddit}`
        ];

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        for (const url of urls) {
            try {
                console.log(`📡 Trying: ${url}`);
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept': 'text/html,application/xhtml+xml',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (!response.ok) {
                    console.log(`⚠️ Failed: ${response.status}`);
                    continue;
                }

                const html = await response.text();
                console.log(`✅ Got HTML (${html.length} chars)`);

                // Extract rules from HTML
                const rules = extractRulesFromHTML(html, cleanSubreddit);

                if (rules.length > 0) {
                    console.log(`✅ Extracted ${rules.length} rules`);
                    
                    return {
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            subreddit: cleanSubreddit,
                            rules: rules,
                            source: url
                        })
                    };
                }

            } catch (error) {
                console.log(`⚠️ Error with ${url}:`, error.message);
                continue;
            }
        }

        // No rules found
        console.log('❌ Could not extract rules from any source');
        
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Could not extract rules',
                subreddit: cleanSubreddit,
                rules: []
            })
        };

    } catch (error) {
        console.error('❌ Scraping error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Scraping failed',
                message: error.message
            })
        };
    }
};

/**
 * Extract rules from Reddit HTML
 */
function extractRulesFromHTML(html, subreddit) {
    const rules = [];

    try {
        // Method 1: Look for rules in old.reddit.com format
        // Pattern: <div class="md">...</div> in rules section
        const rulePattern = /<div class="md">[\s\S]*?<ol>([\s\S]*?)<\/ol>/gi;
        const ruleMatch = html.match(rulePattern);

        if (ruleMatch) {
            const listItems = ruleMatch[0].match(/<li>([\s\S]*?)<\/li>/gi);
            if (listItems) {
                listItems.forEach((item, index) => {
                    const text = item
                        .replace(/<[^>]*>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .trim();
                    
                    if (text) {
                        // Split on first colon or dash to get title and description
                        const parts = text.split(/[:\-]/);
                        const title = parts[0].trim();
                        const description = parts.slice(1).join(':').trim() || title;
                        
                        rules.push({
                            title: title || `Rule ${index + 1}`,
                            description: description
                        });
                    }
                });
            }
        }

        // Method 2: Look for sidebar rules
        if (rules.length === 0) {
            const sidebarPattern = /<div class="md">[\s\S]*?<h\d>.*?rules?.*?<\/h\d>([\s\S]*?)<\/div>/gi;
            const sidebarMatch = html.match(sidebarPattern);
            
            if (sidebarMatch) {
                const lines = sidebarMatch[0].split(/<br\s*\/?>/gi);
                lines.forEach((line, index) => {
                    const text = line
                        .replace(/<[^>]*>/g, '')
                        .replace(/&amp;/g, '&')
                        .trim();
                    
                    if (text && text.length > 10 && !text.match(/^</) && index > 0) {
                        rules.push({
                            title: `Rule ${rules.length + 1}`,
                            description: text
                        });
                    }
                });
            }
        }

        // Method 3: Look for numbered rules (1., 2., etc.)
        if (rules.length === 0) {
            const numberedPattern = /\d+\.\s+([^\n]+)/g;
            let match;
            while ((match = numberedPattern.exec(html)) !== null) {
                const text = match[1]
                    .replace(/<[^>]*>/g, '')
                    .replace(/&amp;/g, '&')
                    .trim();
                
                if (text && text.length > 10 && text.length < 200) {
                    rules.push({
                        title: `Rule ${rules.length + 1}`,
                        description: text
                    });
                }
                
                if (rules.length >= 10) break; // Limit to 10 rules
            }
        }

        console.log(`📋 Extracted ${rules.length} rules using HTML parsing`);

    } catch (error) {
        console.error('❌ HTML parsing error:', error);
    }

    return rules;
}
