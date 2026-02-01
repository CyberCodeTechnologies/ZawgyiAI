const { ZawgyiCapability } = require('../core/zawgyi-capability');
const Parser = require('rss-parser');

class NewsCapability extends ZawgyiCapability {
    constructor() {
        super('news', 'Fetches latest news and headlines from various sources');
        this.parser = new Parser({
            timeout: 5000, // 5 seconds timeout per feed
            headers: {
                'User-Agent': 'ZawgyiAI/1.0'
            }
        });
        
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

        this.setupActions();
    }

    setupActions() {
        this.addAction('get_news', this.getHeadlinesAction.bind(this), {
            description: 'Get latest headlines',
            parameters: ['category', 'limit']
        });

        this.addAction('get_daily_summary', this.getDailySummary.bind(this), {
            description: 'Get a summary of daily news'
        });
    }

    async getHeadlinesAction(params, userId) {
        return await this.getHeadlines(params.category || 'tech', params.limit || 5);
    }

    async getHeadlines(category = 'tech', limit = 5) {
        // Normalize category
        category = category.toLowerCase();
        if (!this.feeds[category]) {
            if (category === 'all' || category === 'latest') {
                return await this.getMixedHeadlines(limit);
            }
            category = 'tech';
        }

        const categoryFeeds = this.feeds[category];
        const results = [];
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
            return { message: 'Could not fetch any news at the moment.' };
        }

        // Format output
        let responseText = `📰 *Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News:*\n\n`;
        results.slice(0, limit).forEach((item, index) => {
            responseText += `${index + 1}. *${item.title}* (${item.source})\n   ${item.link}\n\n`;
        });

        return {
            message: responseText,
            data: results
        };
    }

    async getMixedHeadlines(limit) {
        const categories = Object.keys(this.feeds);
        let allResults = [];
        
        for (const cat of categories) {
            const res = await this.getHeadlines(cat, 2); // Get 2 from each category
            if (res.data) {
                allResults = allResults.concat(res.data);
            }
        }
        
        // Shuffle and limit
        allResults = allResults.sort(() => 0.5 - Math.random()).slice(0, limit);
        
        let responseText = `📰 *Latest Mixed News:*\n\n`;
        allResults.forEach((item, index) => {
            responseText += `${index + 1}. *${item.title}* (${item.source})\n   ${item.link}\n\n`;
        });

        return {
            message: responseText,
            data: allResults
        };
    }

    async getDailySummary(params, userId) {
        // Simple summary implementation
        const tech = await this.getHeadlines('tech', 3);
        const world = await this.getHeadlines('world', 3);
        
        return {
            message: `🌅 *Daily Briefing*\n\n${tech.message}\n${world.message}`,
            type: 'daily_summary'
        };
    }
}

module.exports = NewsCapability;
