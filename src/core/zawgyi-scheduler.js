/**
 * Zawgyi Autonomous Scheduler & Learning Engine
 * Orchestrates 24/7 background tasks: Email, Calendar, Reminders, and proactive assistance.
 */
const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');

class ZawgyiScheduler {
    constructor(core) {
        this.core = core;
        this.jobs = new Map();
        this.learningData = path.join(process.cwd(), 'data', 'learning_memory.json');
        
        this.initialize();
    }

    async initialize() {
        await fs.ensureDir(path.join(process.cwd(), 'data'));
        if (!await fs.pathExists(this.learningData)) {
            await fs.writeJson(this.learningData, { habits: [], preferences: {}, lastSync: null });
        }

        this.setup247Workflows();
        console.log('🌌 Zawgyi 24/7 Autonomous Scheduler Online');
    }

    setup247Workflows() {
        // 1. Every 15 minutes: Check Emails & Inbox
        cron.schedule('*/15 * * * *', () => this.runAutonomousTask('Inbox Sync', [
            { capability: 'email', action: 'read', params: { limit: 5 } },
            { capability: 'inbox', action: 'summarize', params: {} }
        ]));

        // 2. Every Hour: Calendar & Schedule Review
        cron.schedule('0 * * * *', () => this.runAutonomousTask('Schedule Optimization', [
            { capability: 'calendar', action: 'read', params: { range: 'today' } },
            { capability: 'productivity-planning', action: 'optimize_schedule', params: {} }
        ]));

        // 3. Every 6 Hours: Global News & Security Audit
        cron.schedule('0 */6 * * *', () => this.runAutonomousTask('Global Pulse & Security', [
            { capability: 'news', action: 'get_news', params: { category: 'tech', limit: 10 } },
            { capability: 'research-knowledge', action: 'autonomous_learn', params: { category: 'market_trends' } },
            { capability: 'surveillance', action: 'detect_cameras', params: {} }
        ]));

        // 5. Every 4 Hours: Financial & Business Intelligence
        cron.schedule('0 */4 * * *', () => this.runAutonomousTask('Global Intelligence Sync', [
            { capability: 'research-knowledge', action: 'autonomous_learn', params: { category: 'business_intelligence' } },
            { capability: 'research-knowledge', action: 'autonomous_learn', params: { category: 'art_and_culture' } },
            { capability: 'research-knowledge', action: 'autonomous_learn', params: { category: 'sports_and_golf' } },
            { capability: 'research-knowledge', action: 'autonomous_learn', params: { category: 'science_and_universe' } },
            { capability: 'binance', action: 'get_ticker', params: { symbol: 'BTCUSDT' } }
        ]));

        // 4. Daily at 8 AM: Morning Briefing Preparation
        cron.schedule('0 8 * * *', () => this.runAutonomousTask('Daily Briefing', [
            { capability: 'personal-assistant', action: 'generate_briefing', params: {} },
            { capability: 'multi-platform-chat', action: 'broadcast', params: { message: "Good morning! Your daily briefing is ready." } }
        ]));
    }

    async runAutonomousTask(name, steps) {
        console.log(`🤖 [24/7 AUTO] Initiating: ${name}`);
        try {
            const task = await this.core.taskManager.createTask(
                `[AUTO] ${name}`, 
                "Autonomous background synchronization and processing", 
                steps,
                { source: 'scheduler', type: '24/7' }
            );
            
            // Record learning interaction
            await this.recordLearningEvent(name, 'success');
        } catch (error) {
            console.error(`❌ [24/7 AUTO] Failed: ${name}`, error);
        }
    }

    async recordLearningEvent(taskName, status) {
        try {
            const data = await fs.readJson(this.learningData);
            data.habits.push({
                timestamp: new Date().toISOString(),
                task: taskName,
                status: status
            });
            // Keep last 1000 learning events
            if (data.habits.length > 1000) data.habits.shift();
            data.lastSync = new Date().toISOString();
            await fs.writeJson(this.learningData, data, { spaces: 2 });
            
            this.core.events.emit('learning_update', data);
        } catch (e) {
            console.error('Learning engine failure:', e);
        }
    }
}

module.exports = ZawgyiScheduler;
