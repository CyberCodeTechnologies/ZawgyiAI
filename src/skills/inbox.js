const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

class InboxSkill {
    constructor() {
        this.description = 'Manage and organize inbox with smart filtering and automation';
        this.actions = ['read', 'organize', 'filter', 'stats', 'auto_clean'];
        this.parameters = {
            read: ['folder', 'limit', 'unread_only'],
            organize: ['rules', 'dry_run'],
            filter: ['criteria', 'action'],
            stats: ['folder'],
            auto_clean: ['rules', 'schedule']
        };
        
        this.inboxPath = './data/inbox';
        this.rules = [];
        this.imapConfig = null;
        this.initializeInbox();
        this.initializeImapConfig();
    }

    async initializeInbox() {
        await fs.ensureDir(this.inboxPath);
        await fs.ensureDir(path.join(this.inboxPath, 'processed'));
        await fs.ensureDir(path.join(this.inboxPath, 'important'));
        await fs.ensureDir(path.join(this.inboxPath, 'spam'));
        
        // Load default rules
        this.loadDefaultRules();
        
        // Schedule auto-cleanup every hour
        cron.schedule('0 * * * *', () => {
            this.autoCleanup();
        });
    }

    initializeImapConfig() {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.imapConfig = {
                imap: {
                    user: process.env.EMAIL_USER,
                    password: process.env.EMAIL_PASS,
                    host: process.env.EMAIL_HOST ? process.env.EMAIL_HOST.replace('smtp', 'imap') : 'imap.gmail.com',
                    port: 993,
                    tls: true,
                    tlsOptions: { rejectUnauthorized: false },
                    authTimeout: 3000
                }
            };
        }
    }

    loadDefaultRules() {
        this.rules = [
            {
                name: 'Important emails',
                criteria: { subject: ['urgent', 'important', 'asap'], from: [] },
                action: 'move_to_important'
            },
            {
                name: 'Newsletter filtering',
                criteria: { subject: ['newsletter', 'unsubscribe'], from: [] },
                action: 'move_to_newsletter'
            },
            {
                name: 'Spam detection',
                criteria: { subject: ['winner', 'congratulations', 'free money'], from: [] },
                action: 'move_to_spam'
            }
        ];
    }

    async execute(action, parameters, userId) {
        switch (action) {
            case 'read':
                return await this.readInbox(parameters);
            case 'organize':
                return await this.organizeInbox(parameters);
            case 'filter':
                return await this.filterMessages(parameters);
            case 'stats':
                return await this.getInboxStats(parameters);
            case 'auto_clean':
                return await this.autoClean(parameters);
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    async readInbox(params) {
        if (!this.imapConfig) {
            return { success: false, error: 'Email not configured in .env' };
        }

        const { folder = 'INBOX', limit = 20, unread_only = false } = params;
        
        try {
            const connection = await imaps.connect(this.imapConfig);
            await connection.openBox(folder);

            const searchCriteria = [unread_only ? 'UNSEEN' : 'ALL'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT'],
                markSeen: false,
                struct: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);
            const recentMessages = messages.slice(-limit); // Get most recent
            
            const processedMessages = await Promise.all(recentMessages.map(async (item) => {
                const all = item.parts.find(part => part.which === 'TEXT');
                const id = item.attributes.uid;
                const idHeader = "Imap-Id: "+id+"\r\n";
                const parsed = await simpleParser(idHeader + all.body);
                
                return {
                    id: item.attributes.uid,
                    subject: parsed.subject,
                    from: parsed.from.text,
                    date: parsed.date,
                    text: parsed.text,
                    unread: item.attributes.flags && !item.attributes.flags.includes('\\Seen')
                };
            }));

            connection.end();

            return {
                success: true,
                message: `Found ${processedMessages.length} messages in ${folder}`,
                messages: processedMessages.reverse()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async organizeInbox(params) {
        // Placeholder for IMAP organization or keep local file logic (which won't work for IMAP)
        // For now, returning a message that it's not fully implemented for IMAP
        return { success: false, error: 'Organization not yet implemented for IMAP' };
    }

    matchesRule(message, criteria) {
        // Helper for matching rules (needed if organizeInbox is implemented)
        if (criteria.subject) {
            const subjectMatch = criteria.subject.some(keyword => 
                message.subject && message.subject.toLowerCase().includes(keyword.toLowerCase())
            );
            if (subjectMatch) return true;
        }
        return false;
    }

    async filterMessages(params) {
        return { success: false, error: 'Filtering not yet implemented for IMAP' };
    }

    async getInboxStats(params) {
         return { success: false, error: 'Stats not yet implemented for IMAP' };
    }

    async applyRule(message, action) {
        // Placeholder
    }

    async autoClean(params) {
        return { success: false, error: 'Auto-clean not yet implemented for IMAP' };
    }

    async autoCleanup() {
        // Cron job implementation
    }
}

module.exports = InboxSkill;
