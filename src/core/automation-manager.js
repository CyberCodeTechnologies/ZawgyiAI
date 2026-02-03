const cron = require('node-cron');

class AutomationManager {
    constructor(skillManager, gateway) {
        this.skillManager = skillManager;
        this.gateway = gateway;
    }

    start() {
        console.log('🤖 Automation Manager ready (Automated intervals disabled by USER)');
        // All intervals disabled as per user request to use short commands instead
        /*
        this.scheduleNetworkCheck();
        this.scheduleInboxCheck();
        this.scheduleCalendarCheck();
        this.scheduleNewsCheck();
        this.scheduleMultiAgentRollCall();
        this.scheduleSurveillance();
        */
    }

    scheduleMultiAgentRollCall() {
        cron.schedule('0 9 * * *', async () => {
            try {
                await this.executeSkill('multi-agent', 'daily_rollcall', {
                    agents: [{ id: 'worker_1' }, { id: 'analyzer_1' }],
                    checklist: ['system_check'],
                    reporting: 'summary'
                });
            } catch (error) { }
        });
    }

    async executeSkill(skillName, action, params) {
        try {
            const skill = this.skillManager.get(skillName);
            if (!skill) return null;
            const result = await skill.execute(action, params, 'system');
            if (result && result.result) {
                return { ...result, ...result.result };
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    scheduleNetworkCheck() { }
    scheduleInboxCheck() { }
    scheduleCalendarCheck() { }
    scheduleNewsCheck() { }
    scheduleSurveillance() { }
}

module.exports = AutomationManager;
