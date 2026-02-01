const Parser = require('rss-parser');

class NewsSkill {
    constructor() {
        this.name = 'news';
        this.description = 'Fetches latest news and headlines from various sources';
        this.parser = new Parser();
        
        this.feeds = {
            tech: [
                { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
                { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
                { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
                { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' }
            ],
            world: [
                { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
                { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
                { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
            ],
            science: [
                { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml' },
                { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' }
            ],
            business: [
                { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
                { name: 'Financial Times', url: 'https://www.ft.com/?format=rss' }
            ]
        };
    }

    async execute(intent, params) {
        console.log(`📰 NewsSkill executing intent: ${intent}`);

        switch (intent) {
            case 'get_news':
            case 'get_headlines':
                return await this.getHeadlines(params.category || 'tech', params.limit || 5);
            
            case 'get_tech_news':
                return await this.getHeadlines('tech', params.limit || 5);
                
            case 'get_daily_summary':
                return await this.getDailySummary();

            default:
                return { 
                    success: false, 
                    message: `NewsSkill doesn't handle intent: ${intent}` 
                };
        }
    }

    async getHeadlines(category = 'tech', limit = 5) {
        // Normalize category
        category = category.toLowerCase();
        if (!this.feeds[category]) {
            // Try to fuzzy match or default to tech if "all" or unknown
            if (category === 'all' || category === 'latest') {
                return await this.getMixedHeadlines(limit);
            }
            category = 'tech';
        }

        const categoryFeeds = this.feeds[category];
        const results = [];

        try {
            // Pick a random feed from the category or iterate top ones
            // For now, let's just fetch from the first 2 sources to be fast
            const sourcesToFetch = categoryFeeds.slice(0, 2);
            
            for (const source of sourcesToFetch) {
                try {
                    const feed = await this.parser.parseURL(source.url);
                    const items = feed.items.slice(0, limit);
                    
                    items.forEach(item => {
                        results.push({
                            source: source.name,
                            title: item.title,
                            link: item.link,
                            pubDate: item.pubDate,
                            snippet: item.contentSnippet ? item.contentSnippet.substring(0, 100) + '...' : ''
                        });
                    });
                } catch (err) {
                    console.error(`Failed to fetch ${source.name}: ${err.message}`);
                }
            }

            if (results.length === 0) {
                return { success: false, message: 'Could not fetch any news at the moment.' };
            }

            // Format output for chat
            let responseText = `📰 *Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News:*\n\n`;
            results.slice(0, limit).forEach((item, index) => {
                responseText += `${index + 1}. *${item.title}* (${item.source})\n   ${item.link}\n\n`;
            });

            return {
                success: true,
                message: responseText,
                data: results
            };

        } catch (error) {
            console.error('Error fetching news:', error);
            return { success: false, error: error.message };
        }
    }

    async getMixedHeadlines(limit = 5) {
        // Fetch 1 from each category
        const results = [];
        const categories = Object.keys(this.feeds);

        for (const cat of categories) {
            try {
                const source = this.feeds[cat][0]; // First source of each category
                const feed = await this.parser.parseURL(source.url);
                if (feed.items.length > 0) {
                    const item = feed.items[0];
                    results.push({
                        category: cat,
                        source: source.name,
                        title: item.title,
                        link: item.link
                    });
                }
            } catch (err) {
                // Ignore individual failures
            }
        }

        let responseText = `🌍 *Top Headlines:* \n\n`;
        results.forEach(item => {
            responseText += `*${item.category.toUpperCase()}:* ${item.title} - ${item.source}\n${item.link}\n\n`;
        });

        return {
            success: true,
            message: responseText,
            data: results
        };
    }

    async getDailySummary() {
        // A more comprehensive summary for automation
        const tech = await this.getHeadlines('tech', 3);
        const world = await this.getHeadlines('world', 3);
        
        let summary = `🌅 *Daily Briefing*\n\n`;
        
        if (tech.success) {
            summary += `*📱 Tech Highlights:*\n`;
            tech.data.slice(0, 3).forEach(item => {
                summary += `- ${item.title}\n`;
            });
            summary += `\n`;
        }

        if (world.success) {
            summary += `*🌍 World News:*\n`;
            world.data.slice(0, 3).forEach(item => {
                summary += `- ${item.title}\n`;
            });
        }

        return {
            success: true,
            message: summary
        };
    }
}

module.exports = NewsSkill;
