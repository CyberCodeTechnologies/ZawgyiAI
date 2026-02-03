const { ZawgyiCapability } = require('../core/zawgyi-capability');

class SlackCapability extends ZawgyiCapability {
    constructor() {
        super('slack', 'Slack Messaging Platform Support');
        this.setupActions();
    }

    setupActions() {
        this.addAction('send_message', this.sendMessage.bind(this), {
            description: 'Send a message to a Slack channel',
            parameters: ['channel', 'message']
        });

        this.addAction('get_users', this.getUsers.bind(this), {
            description: 'Get list of users in the Slack workspace',
            parameters: []
        });
    }

    async sendMessage(params, userId) {
        const { channel, message } = params;
        console.log(`[Slack] Sending to channel ${channel}: ${message}`);

        return {
            success: true,
            platform: 'slack',
            channel: channel,
            message_sent: message,
            timestamp: new Date().toISOString()
        };
    }

    async getUsers(params, userId) {
        return {
            users: [
                { id: 'W12345', name: 'ZawgyiAI Admin' }
            ]
        };
    }
}

module.exports = SlackCapability;
