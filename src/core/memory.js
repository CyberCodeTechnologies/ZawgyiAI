const fs = require('fs-extra');
const path = require('path');

class Memory {
    constructor(memoryPath) {
        this.memoryPath = memoryPath;
        this.userContexts = new Map();
    }

    async initialize() {
        await fs.ensureDir(this.memoryPath);
        await this.loadUserContexts();
    }

    async loadUserContexts() {
        try {
            const files = await fs.readdir(this.memoryPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const userId = path.basename(file, '.json');
                    const context = await fs.readJson(path.join(this.memoryPath, file));
                    this.userContexts.set(userId, context);
                }
            }
        } catch (error) {
            console.error('Error loading user contexts:', error);
        }
    }

    async getUserContext(userId) {
        if (!this.userContexts.has(userId)) {
            this.userContexts.set(userId, {
                userId,
                preferences: {},
                history: [],
                lastInteraction: null,
                created: new Date().toISOString()
            });
        }
        return this.userContexts.get(userId);
    }

    async updateUserContext(userId, updates) {
        const context = await this.getUserContext(userId);
        
        if (updates.lastMessage && updates.lastResponse) {
            context.history.push({
                timestamp: new Date().toISOString(),
                message: updates.lastMessage,
                response: updates.lastResponse
            });
            
            // Keep only last 50 interactions
            if (context.history.length > 50) {
                context.history = context.history.slice(-50);
            }
        }

        if (updates.preferences) {
            context.preferences = { ...context.preferences, ...updates.preferences };
        }

        context.lastInteraction = new Date().toISOString();
        
        this.userContexts.set(userId, context);
        await this.saveUserContext(userId);
    }

    async saveUserContext(userId) {
        try {
            const context = this.userContexts.get(userId);
            if (context) {
                await fs.writeJson(
                    path.join(this.memoryPath, `${userId}.json`),
                    context,
                    { spaces: 2 }
                );
            }
        } catch (error) {
            console.error('Error saving user context:', error);
        }
    }

    async setPreference(userId, key, value) {
        const context = await this.getUserContext(userId);
        context.preferences[key] = value;
        await this.saveUserContext(userId);
    }

    async getPreference(userId, key, defaultValue = null) {
        const context = await this.getUserContext(userId);
        return context.preferences[key] || defaultValue;
    }

    async getHistory(userId, limit = 10) {
        const context = await this.getUserContext(userId);
        return context.history.slice(-limit);
    }

    async clearHistory(userId) {
        const context = await this.getUserContext(userId);
        context.history = [];
        await this.saveUserContext(userId);
    }

    async deleteUserContext(userId) {
        this.userContexts.delete(userId);
        try {
            await fs.remove(path.join(this.memoryPath, `${userId}.json`));
        } catch (error) {
            console.error('Error deleting user context:', error);
        }
    }

    async getAllUsers() {
        return Array.from(this.userContexts.keys());
    }

    async getStats() {
        const users = await this.getAllUsers();
        const stats = {
            totalUsers: users.length,
            totalInteractions: 0,
            activeUsers24h: 0
        };

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const userId of users) {
            const context = this.userContexts.get(userId);
            if (context) {
                stats.totalInteractions += context.history.length;
                
                const lastInteraction = new Date(context.lastInteraction);
                if (lastInteraction > yesterday) {
                    stats.activeUsers24h++;
                }
            }
        }

        return stats;
    }
}

module.exports = Memory;
