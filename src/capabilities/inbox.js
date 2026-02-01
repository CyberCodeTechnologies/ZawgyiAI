const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');

class InboxCapability extends ZawgyiCapability {
    constructor() {
        super('inbox', 'Smart inbox management and automation');
        
        this.inboxPath = './data/inbox';
        this.rules = [];
        this.stats = {
            total_processed: 0,
            auto_organized: 0,
            spam_detected: 0
        };
        
        this.setupActions();
        this.initializeInbox();
    }

    setupActions() {
        this.addAction('read', this.readInbox.bind(this), {
            description: 'Read inbox messages',
            parameters: ['folder', 'limit', 'unread_only']
        });

        this.addAction('organize', this.organizeInbox.bind(this), {
            description: 'Organize inbox with smart rules',
            parameters: ['rules', 'dry_run']
        });

        this.addAction('filter', this.filterMessages.bind(this), {
            description: 'Filter messages based on criteria',
            parameters: ['criteria', 'action']
        });

        this.addAction('stats', this.getInboxStats.bind(this), {
            description: 'Get inbox statistics',
            parameters: ['folder']
        });

        this.addAction('auto_clean', this.autoClean.bind(this), {
            description: 'Automatically clean old messages',
            parameters: ['days_old']
        });
    }

    async initializeInbox() {
        await fs.ensureDir(this.inboxPath);
        await fs.ensureDir(path.join(this.inboxPath, 'processed'));
        await fs.ensureDir(path.join(this.inboxPath, 'important'));
        await fs.ensureDir(path.join(this.inboxPath, 'spam'));
        
        this.loadDefaultRules();
        
        // Schedule auto-cleanup every day at 2 AM
        cron.schedule('0 2 * * *', () => {
            this.autoClean({ days_old: 30 }, 'system');
        });
        
        console.log('📥 Inbox capability initialized');
    }

    loadDefaultRules() {
        this.rules = [
            {
                name: 'Important emails',
                criteria: { 
                    subject: ['urgent', 'important', 'asap', 'critical'],
                    from: [],
                    priority: 'high'
                },
                action: 'move_to_important'
            },
            {
                name: 'Newsletter filtering',
                criteria: { 
                    subject: ['newsletter', 'unsubscribe', 'weekly digest'],
                    from: [],
                    priority: 'medium'
                },
                action: 'move_to_newsletter'
            },
            {
                name: 'Spam detection',
                criteria: { 
                    subject: ['winner', 'congratulations', 'free money', 'claim now'],
                    from: [],
                    priority: 'low'
                },
                action: 'move_to_spam'
            },
            {
                name: 'Work related',
                criteria: { 
                    subject: ['meeting', 'project', 'deadline', 'report'],
                    from: [],
                    priority: 'high'
                },
                action: 'move_to_work'
            }
        ];
    }

    async readInbox(params, userId) {
        const { folder = 'inbox', limit = 20, unread_only = false } = params;
        
        try {
            const folderPath = path.join(this.inboxPath, folder);
            await fs.ensureDir(folderPath);
            
            const files = await fs.readdir(folderPath);
            const messageFiles = files.filter(file => file.endsWith('.json'));
            
            let messages = [];
            for (const file of messageFiles.slice(-limit)) {
                const messagePath = path.join(folderPath, file);
                const message = await fs.readJson(messagePath);
                
                if (!unread_only || message.unread) {
                    messages.push(message);
                }
            }

            this.stats.total_processed += messages.length;

            return {
                message: `Found ${messages.length} messages in ${folder}`,
                messages: messages.reverse(),
                folder,
                unread_only,
                stats: this.stats
            };
        } catch (error) {
            throw new Error(`Failed to read inbox: ${error.message}`);
        }
    }

    async organizeInbox(params, userId) {
        const { rules = this.rules, dry_run = false } = params;
        
        try {
            const folderPath = path.join(this.inboxPath, 'inbox');
            const files = await fs.readdir(folderPath);
            const messageFiles = files.filter(file => file.endsWith('.json'));
            
            let organized = 0;
            const actions = [];

            for (const file of messageFiles) {
                const messagePath = path.join(folderPath, file);
                const message = await fs.readJson(messagePath);
                
                for (const rule of rules) {
                    if (this.matchesRule(message, rule.criteria)) {
                        actions.push({
                            messageId: message.id,
                            rule: rule.name,
                            action: rule.action,
                            priority: rule.criteria.priority
                        });
                        
                        if (!dry_run) {
                            await this.applyRule(message, rule.action);
                            organized++;
                        }
                        break;
                    }
                }
            }

            if (!dry_run) {
                this.stats.auto_organized += organized;
            }

            return {
                message: dry_run 
                    ? `Would organize ${actions.length} messages (dry run)`
                    : `Organized ${organized} messages`,
                actions: actions.sort((a, b) => b.priority.localeCompare(a.priority)),
                dry_run: dry_run,
                stats: this.stats
            };
        } catch (error) {
            throw new Error(`Failed to organize inbox: ${error.message}`);
        }
    }

    async filterMessages(params, userId) {
        const { criteria, action } = params;
        
        if (!criteria || !action) {
            throw new Error('Missing required fields: criteria, action');
        }

        return await this.organizeInbox({
            rules: [{ name: 'Custom filter', criteria, action }],
            dry_run: false
        }, userId);
    }

    async getInboxStats(params, userId) {
        const { folder = 'inbox' } = params;
        
        try {
            const folderPath = path.join(this.inboxPath, folder);
            const files = await fs.readdir(folderPath);
            const messageFiles = files.filter(file => file.endsWith('.json'));
            
            let total = 0;
            let unread = 0;
            let today = 0;
            const todayDate = new Date().toDateString();

            for (const file of messageFiles) {
                const messagePath = path.join(folderPath, file);
                const message = await fs.readJson(messagePath);
                
                total++;
                if (message.unread) unread++;
                
                const messageDate = new Date(message.date).toDateString();
                if (messageDate === todayDate) today++;
            }

            return {
                message: `Inbox statistics for ${folder}`,
                stats: {
                    total,
                    unread,
                    today,
                    read: total - unread,
                    auto_organized: this.stats.auto_organized,
                    spam_detected: this.stats.spam_detected
                },
                folder,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get inbox stats: ${error.message}`);
        }
    }

    async autoClean(params, userId) {
        const { days_old = 30 } = params;
        
        try {
            const cutoffDate = new Date(Date.now() - days_old * 24 * 60 * 60 * 1000);
            const folderPath = path.join(this.inboxPath, 'processed');
            
            const files = await fs.readdir(folderPath);
            const messageFiles = files.filter(file => file.endsWith('.json'));
            
            let deleted = 0;
            for (const file of messageFiles) {
                const messagePath = path.join(folderPath, file);
                const stats = await fs.stat(messagePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.remove(messagePath);
                    deleted++;
                }
            }

            return {
                message: `Auto-clean completed. Deleted ${deleted} messages older than ${days_old} days`,
                deleted,
                days_old,
                cutoff_date: cutoffDate.toISOString(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Auto-clean failed: ${error.message}`);
        }
    }

    matchesRule(message, criteria) {
        if (!criteria) return false;
        
        const subject = (message.subject || '').toLowerCase();
        const from = (message.from || '').toLowerCase();
        
        // Check subject criteria
        if (criteria.subject && criteria.subject.length > 0) {
            const matchesSubject = criteria.subject.some(keyword => 
                subject.includes(keyword.toLowerCase())
            );
            if (!matchesSubject) return false;
        }
        
        // Check from criteria
        if (criteria.from && criteria.from.length > 0) {
            const matchesFrom = criteria.from.some(email => 
                from.includes(email.toLowerCase())
            );
            if (!matchesFrom) return false;
        }
        
        return true;
    }

    async applyRule(message, action) {
        const currentPath = path.join(this.inboxPath, 'inbox', `${message.id}.json`);
        
        let targetFolder;
        switch (action) {
            case 'move_to_important':
                targetFolder = 'important';
                break;
            case 'move_to_spam':
                targetFolder = 'spam';
                this.stats.spam_detected++;
                break;
            case 'move_to_newsletter':
                targetFolder = 'newsletter';
                await fs.ensureDir(path.join(this.inboxPath, 'newsletter'));
                break;
            case 'move_to_work':
                targetFolder = 'work';
                await fs.ensureDir(path.join(this.inboxPath, 'work'));
                break;
            default:
                targetFolder = 'processed';
        }
        
        const targetPath = path.join(this.inboxPath, targetFolder, `${message.id}.json`);
        await fs.move(currentPath, targetPath);
        
        message.processed = true;
        message.processed_date = new Date().toISOString();
        message.processed_action = action;
        await fs.writeJson(targetPath, message);
    }

    // Helper method to add sample messages for testing
    async addSampleMessage(message) {
        const messageData = {
            id: `msg_${Date.now()}`,
            ...message,
            date: new Date().toISOString(),
            unread: true
        };
        
        const messagePath = path.join(this.inboxPath, 'inbox', `${messageData.id}.json`);
        await fs.writeJson(messagePath, messageData);
    }
}

module.exports = InboxCapability;
