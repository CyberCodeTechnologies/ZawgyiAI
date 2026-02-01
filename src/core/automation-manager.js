const cron = require('node-cron');

class AutomationManager {
    constructor(skillManager, gateway) {
        this.skillManager = skillManager;
        this.gateway = gateway;
    }

    start() {
        console.log('🤖 Automation Manager started');
        this.scheduleNetworkCheck();
        this.scheduleInboxCheck();
        this.scheduleCalendarCheck();
        this.scheduleNewsCheck();
        // this.scheduleFlightCheck(); // Disabled by default to avoid excessive browser launching
    }

    async executeSkill(skillName, action, params) {
        try {
            const skill = this.skillManager.get(skillName);
            if (!skill) return null;

            // Handle ZawgyiCapability structure
            // Capability.execute(action, params, userId)
            const result = await skill.execute(action, params, 'system');
            
            // If result is wrapped in { success, result: ... }, unwrap it for logic checking
            // But return the full structure if needed
            if (result && result.result) {
                // Merge inner result properties to top level for backward compatibility
                return { ...result, ...result.result };
            }
            
            return result;
        } catch (error) {
            console.error(`Error executing skill ${skillName}.${action}:`, error);
            return { success: false, error: error.message };
        }
    }

    scheduleNetworkCheck() {
        // Check every 30 minutes
        cron.schedule('*/30 * * * *', async () => {
            try {
                const result = await this.executeSkill('network', 'check_connection', { host: 'https://www.google.com' });
                
                if (result && (!result.success || result.status === 'Offline')) {
                    await this.gateway.notifyAll(`⚠️ Network Alert: Internet seems to be offline. Error: ${result.error || 'Unknown'}`);
                }
            } catch (error) {
                console.error('Network check failed:', error);
            }
        });
    }

    scheduleInboxCheck() {
        // Check every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            try {
                // Check for unread emails in INBOX
                const result = await this.executeSkill('inbox', 'read', { folder: 'INBOX', limit: 5, unread_only: true });
                
                if (result && result.success && result.messages && result.messages.length > 0) {
                    // Check if any match "important" criteria (simple subject check for now)
                    const importantKeywords = ['urgent', 'important', 'alert', 'security'];
                    const importantEmails = result.messages.filter(msg => 
                        msg.subject && importantKeywords.some(k => msg.subject.toLowerCase().includes(k))
                    );

                    if (importantEmails.length > 0) {
                        const summary = importantEmails.map(e => `- ${e.subject} (from ${e.from})`).join('\n');
                        await this.gateway.notifyAll(`📧 You have ${importantEmails.length} new important email(s):\n${summary}`);
                    }
                }
            } catch (error) {
                console.error('Inbox check failed:', error);
            }
        });
    }

    scheduleCalendarCheck() {
        // Check every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            try {
                // Check events for the next 2 hours
                const now = new Date();
                const nextTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                
                const result = await this.executeSkill('calendar', 'read', { 
                    start_date: now.toISOString(),
                    end_date: nextTwoHours.toISOString(),
                    limit: 5
                });

                if (result && result.success && result.events && result.events.length > 0) {
                    const summary = result.events.map(e => `- ${e.title || e.summary} at ${new Date(e.start.dateTime || e.start).toLocaleTimeString()}`).join('\n');
                    await this.gateway.notifyAll(`📅 Upcoming events in next 2 hours:\n${summary}`);
                }
            } catch (error) {
                console.error('Calendar check failed:', error);
            }
        });
    }

    scheduleNewsCheck() {
        // Check news every 4 hours (at minute 0)
        cron.schedule('0 */4 * * *', async () => {
            try {
                console.log('📰 Running automated news check...');
                const result = await this.executeSkill('news', 'get_daily_summary', {});
                
                if (result && result.success) {
                    await this.gateway.notifyAll(result.message);
                }
            } catch (error) {
                console.error('News check failed:', error);
            }
        });
    }
}

module.exports = AutomationManager;
