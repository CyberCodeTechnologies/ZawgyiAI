const { ZawgyiCapability } = require('../core/zawgyi-capability');

class DiscordCapability extends ZawgyiCapability {
    constructor() {
        super('discord', 'Discord Messaging Platform Support');
        this.setupActions();
    }

    setupActions() {
        this.addAction('send_message', this.sendMessage.bind(this), {
            description: 'Send a message to a Discord channel',
            parameters: ['channelId', 'message']
        });

        this.addAction('get_guilds', this.getGuilds.bind(this), {
            description: 'Get list of Discord servers the bot is in',
            parameters: []
        });
    }

    async sendMessage(params, userId) {
        const { channelId, message } = params;
        console.log(`[Discord] Sending to channel ${channelId}: ${message}`);

        return {
            success: true,
            platform: 'discord',
            channelId: channelId,
            message_sent: message,
            timestamp: new Date().toISOString()
        };
    }

    async getGuilds(params, userId) {
        return {
            guilds: [
                { id: '123456789', name: 'ZawgyiAI Support' }
            ]
        };
    }
}

module.exports = DiscordCapability;
