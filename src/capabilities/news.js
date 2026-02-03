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

        this.addAction('search_news', this.searchNewsAction.bind(this), {
            description: 'Search news by keyword',
            parameters: ['searchTerm', 'limit']
        });

        this.addAction('get_trending', this.getTrendingNews.bind(this), {
            description: 'Get trending news from all categories'
        });
    }

    async getHeadlinesAction(params, userId) {
        return await this.getHeadlines(params.category || 'tech', params.limit || 5);
    }

    async searchNewsAction(params, userId) {
        return await this.searchNews(params.searchTerm || '', params.limit || 5);
    }

    async getTrendingNews(params, userId) {
        return await this.getMixedHeadlines(params.limit || 10);
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
        const sourcesToFetch = categoryFeeds.slice(0, 3); // Fetch from more sources
            
        for (const source of sourcesToFetch) {
            try {
                const feed = await this.parser.parseURL(source.url);
                const items = feed.items.slice(0, Math.ceil(limit / sourcesToFetch.length) + 1);
                
                items.forEach(item => {
                    results.push({
                        source: source.name,
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        snippet: item.contentSnippet ? item.contentSnippet.substring(0, 150) + '...' : '',
                        category: category,
                        image: this.extractImage(item),
                        timestamp: new Date(item.pubDate || Date.now()).toISOString()
                    });
                });
            } catch (err) {
                console.error(`Failed to fetch ${source.name}: ${err.message}`);
            }
        }

        if (results.length === 0) {
            return { message: 'Could not fetch any news at the moment.', data: [] };
        }

        // Sort by date and limit
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedResults = results.slice(0, limit);

        // Format output
        let responseText = `📰 *Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News:*
\n`;
        limitedResults.forEach((item, index) => {
            responseText += `${index + 1}. *${item.title}* (${item.source})\n   📅 ${new Date(item.timestamp).toLocaleDateString()}\n   🔗 ${item.link}\n\n`;
        });

        return {
            message: responseText,
            data: limitedResults,
            category: category,
            total: results.length
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
        // Get headlines from multiple categories
        const tech = await this.getHeadlines('tech', 3);
        const world = await this.getHeadlines('world', 3);
        const business = await this.getHeadlines('business', 2);
        const science = await this.getHeadlines('science', 2);
        
        const summary = {
            message: `🌅 *Daily Briefing - ${new Date().toLocaleDateString()}*\n\n📱 **Technology**\n${tech.message}\n🌍 **World News**\n${world.message}\n💼 **Business**\n${business.message}\n🔬 **Science**\n${science.message}`,
            categories: {
                tech: tech.data || [],
                world: world.data || [],
                business: business.data || [],
                science: science.data || []
            },
            timestamp: new Date().toISOString(),
            type: 'daily_summary'
        };
        
        return summary;
    }

    // Helper method to extract images from RSS items
    extractImage(item) {
        if (item.content && item.content.includes('<img')) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
        }
        if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
            return item['media:thumbnail'].$.url;
        }
        if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
            return item.enclosure.url;
        }
        return null;
    }

    // Add new action for getting news by search term
    async searchNews(searchTerm, limit = 5) {
        const allResults = [];
        const categories = Object.keys(this.feeds);
        
        for (const category of categories) {
            const result = await this.getHeadlines(category, 10);
            if (result.data) {
                const filtered = result.data.filter(item => 
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.snippet.toLowerCase().includes(searchTerm.toLowerCase())
                );
                allResults.push(...filtered);
            }
        }
        
        // Remove duplicates and limit
        const uniqueResults = allResults.filter((item, index, self) => 
            index === self.findIndex(t => t.title === item.title)
        ).slice(0, limit);
        
        if (uniqueResults.length === 0) {
            return { message: `No news found for "${searchTerm}"`, data: [] };
        }
        
        let responseText = `🔍 *News for "${searchTerm}":*\n\n`;
        uniqueResults.forEach((item, index) => {
            responseText += `${index + 1}. *${item.title}* (${item.source})\n   📅 ${new Date(item.timestamp).toLocaleDateString()}\n   🔗 ${item.link}\n\n`;
        });
        
        return {
            message: responseText,
            data: uniqueResults,
            searchTerm: searchTerm,
            total: uniqueResults.length
        };
    }
}

module.exports = NewsCapability;
