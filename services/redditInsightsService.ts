// Reddit Insights Service - Analyzes subreddit performance and optimal posting times
import { SubredditInsight } from '../types';

class RedditInsightsService {
    private cache: Map<string, { data: SubredditInsight; timestamp: number }> = new Map();
    private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    async getSubredditInsights(subreddit: string): Promise<SubredditInsight> {
        // Check cache first
        const cached = this.cache.get(subreddit);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`📊 Using cached insights for r/${subreddit}`);
            return cached.data;
        }

        console.log(`📊 Analyzing r/${subreddit} for insights...`);

        try {
            // Fetch top posts from last 30 days
            const topPosts = await this.fetchTopPosts(subreddit, 100);
            
            // Analyze posting times
            const bestPostingTimes = this.analyzeBestPostingTimes(topPosts);
            
            // Calculate average engagement
            const avgEngagement = this.calculateAverageEngagement(topPosts);
            
            // Extract top keywords
            const topKeywords = this.extractTopKeywords(topPosts);
            
            // Get top post examples
            const topPostExamples = topPosts.slice(0, 5).map(post => ({
                title: post.title,
                score: post.score,
                url: post.url
            }));

            const insights: SubredditInsight = {
                subreddit,
                bestPostingTimes,
                avgEngagement,
                topKeywords,
                topPostExamples,
                lastAnalyzed: new Date().toISOString()
            };

            // Cache the results
            this.cache.set(subreddit, { data: insights, timestamp: Date.now() });

            return insights;
        } catch (error) {
            console.error(`❌ Failed to get insights for r/${subreddit}:`, error);
            throw error;
        }
    }

    private async fetchTopPosts(subreddit: string, limit: number = 100): Promise<any[]> {
        try {
            const url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=${limit}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SalesFlow/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data.children.map((child: any) => ({
                title: child.data.title,
                score: child.data.score,
                num_comments: child.data.num_comments,
                created_utc: child.data.created_utc,
                url: `https://reddit.com${child.data.permalink}`,
                selftext: child.data.selftext || ''
            }));
        } catch (error) {
            console.error('Failed to fetch top posts:', error);
            return [];
        }
    }

    private analyzeBestPostingTimes(posts: any[]): { hour: number; score: number }[] {
        // Group posts by hour of day
        const hourlyScores: { [hour: number]: { total: number; count: number } } = {};

        posts.forEach(post => {
            const date = new Date(post.created_utc * 1000);
            const hour = date.getUTCHours();
            
            if (!hourlyScores[hour]) {
                hourlyScores[hour] = { total: 0, count: 0 };
            }
            
            hourlyScores[hour].total += post.score;
            hourlyScores[hour].count += 1;
        });

        // Calculate average score per hour
        const bestTimes = Object.entries(hourlyScores).map(([hour, data]) => ({
            hour: parseInt(hour),
            score: Math.round(data.total / data.count)
        }));

        // Sort by score descending
        return bestTimes.sort((a, b) => b.score - a.score);
    }

    private calculateAverageEngagement(posts: any[]): number {
        if (posts.length === 0) return 0;
        
        const totalEngagement = posts.reduce((sum, post) => {
            return sum + post.score + post.num_comments;
        }, 0);

        return Math.round(totalEngagement / posts.length);
    }

    private extractTopKeywords(posts: any[]): string[] {
        // Combine all titles and content
        const allText = posts.map(p => `${p.title} ${p.selftext}`).join(' ').toLowerCase();
        
        // Remove common words
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
        
        // Extract words
        const words = allText.match(/\b[a-z]{4,}\b/g) || [];
        
        // Count frequency
        const wordCount: { [word: string]: number } = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });

        // Get top 10 keywords
        return Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Insights cache cleared');
    }
}

export const redditInsightsService = new RedditInsightsService();
