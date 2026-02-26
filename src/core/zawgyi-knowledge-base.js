/**
 * Zawgyi Global Knowledge Base
 * Stores and indexes autonomous insights learned from the internet, financial data, and business news.
 */
const fs = require('fs-extra');
const path = require('path');

class ZawgyiKnowledgeBase {
    constructor(core) {
        this.core = core;
        this.knowledgeDir = path.join(process.cwd(), 'data', 'knowledge');
        this.insightsFile = path.join(this.knowledgeDir, 'global_insights.json');
        
        this.initialize();
    }

    async initialize() {
        await fs.ensureDir(this.knowledgeDir);
        if (!await fs.pathExists(this.insightsFile)) {
            await fs.writeJson(this.insightsFile, { 
                market_trends: [], 
                tech_innovations: [], 
                business_intelligence: [],
                global_events: [],
                art_and_culture: [],
                sports_and_golf: [],
                science_and_universe: [],
                lastUpdated: null 
            });
        }
        console.log('📚 Zawgyi Knowledge Base Synchronized');
    }

    /**
     * Add a learned insight to the knowledge base
     */
    async addInsight(category, data) {
        try {
            const insights = await fs.readJson(this.insightsFile);
            if (!insights[category]) insights[category] = [];
            
            const entry = {
                id: Date.now().toString(36),
                timestamp: new Date().toISOString(),
                ...data
            };

            insights[category].unshift(entry);
            // Limit to last 500 insights per category
            if (insights[category].length > 500) insights[category].pop();
            
            insights.lastUpdated = new Date().toISOString();
            await fs.writeJson(this.insightsFile, insights, { spaces: 2 });
            
            this.core.events.emit('insight_added', { category, entry });
            this.core.events.emit('log', { 
                type: 'success', 
                message: `🧠 New Insight Learned: [${category}] ${entry.title || 'Untitled'}` 
            });
        } catch (e) {
            console.error('Failed to store insight:', e);
        }
    }

    async getInsights() {
        return await fs.readJson(this.insightsFile);
    }
}

module.exports = ZawgyiKnowledgeBase;
