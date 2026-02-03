const { ZawgyiCapability } = require('../core/zawgyi-capability');

class LineCapability extends ZawgyiCapability {
    constructor() {
        super('line', 'LINE Messaging Platform Support');
        this.setupActions();
    }

    setupActions() {
        this.addAction('send_message', this.sendMessage.bind(this), {
            description: 'Send a message via LINE',
            parameters: ['to', 'message']
        });

        this.addAction('get_profile', this.getProfile.bind(this), {
            description: 'Get user profile information',
            parameters: ['userId']
        });
    }

    async sendMessage(params, userId) {
        const { to, message } = params;
        // This is a placeholder for actual LINE Messaging API integration
        console.log(`[LINE] Sending to ${to}: ${message}`);

        return {
            success: true,
            platform: 'line',
            recipient: to,
            message_sent: message,
            timestamp: new Date().toISOString()
        };
    }

    async getProfile(params, userId) {
        return {
            displayName: 'LINE User',
            userId: params.userId || 'U123456789',
            statusMessage: 'Available'
        };
    }
}

module.exports = LineCapability;
