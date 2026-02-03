const { ZawgyiCapability } = require('../core/zawgyi-capability');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const { WhatsAppConfig, validateConfig, createWhatsAppClient } = require('../../whatsapp-config');

class WhatsAppCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('whatsapp', 'WhatsApp Automation - Send and receive messages via WhatsApp');

        this.gateway = gateway;
        this.standaloneClient = null;
        this.isReady = false;
        this.config = WhatsAppConfig;

        // Validate configuration
        if (!validateConfig()) {
            console.warn('⚠️ WhatsApp configuration validation failed or using defaults');
        }

        // Ensure directories exist
        fs.ensureDirSync(this.config.session.dataPath);
        fs.ensureDirSync(this.config.media.downloadPath);

        this.setupActions();
    }

    setupActions() {
        this.addAction('send_message', this.sendMessageAction.bind(this), {
            description: 'Send a text message to a WhatsApp contact',
            parameters: ['to', 'message']
        });

        this.addAction('send_media', this.sendMediaAction.bind(this), {
            description: 'Send media (image, video, etc.) to a WhatsApp contact',
            parameters: ['to', 'mediaPath', 'caption']
        });

        this.addAction('get_contacts', this.getContacts.bind(this), {
            description: 'Get list of WhatsApp contacts',
            parameters: []
        });

        this.addAction('get_chats', this.getChats.bind(this), {
            description: 'Get list of active WhatsApp chats',
            parameters: []
        });

        this.addAction('status', this.getStatusAction.bind(this), {
            description: 'Get current WhatsApp connection status',
            parameters: []
        });
    }

    /**
     * Internal helper to get the active WhatsApp client.
     * Prioritizes the client from the gateway if available.
     */
    getActiveClient() {
        if (this.gateway) {
            const platform = this.gateway.platforms.get('whatsapp');
            if (platform && platform.client) {
                return platform.client;
            }
        }
        return this.standaloneClient;
    }

    checkReady() {
        const client = this.getActiveClient();
        if (!client) {
            throw new Error('WhatsApp client is not initialized. Please ensure the WhatsApp platform is started in the gateway.');
        }
        return client;
    }

    async initialize() {
        if (this.getActiveClient()) {
            console.log('📱 WhatsApp capability using existing gateway client');
            this.isReady = true;
            return true;
        }

        try {
            console.log('📱 Initializing standalone WhatsApp capability...');
            this.standaloneClient = createWhatsAppClient();
            this.setupEventListeners(this.standaloneClient);
            await this.standaloneClient.initialize();
            return true;
        } catch (error) {
            console.error('❌ Standalone WhatsApp initialization failed:', error.message);
            throw error;
        }
    }

    setupEventListeners(client) {
        client.on('qr', (qr) => {
            console.log('📸 WhatsApp QR Code received!');
            qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
        });

        client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failure:', msg);
            this.isReady = false;
        });

        client.on('disconnected', (reason) => {
            console.log('📱 WhatsApp client disconnected:', reason);
            this.isReady = false;
        });
    }

    async sendMessageAction(params, userId) {
        const { to, message } = params;
        if (!to || !message) throw new Error('Recipient and message are required');

        const client = this.checkReady();

        let target = to;
        if (!target.includes('@')) {
            target = `${target}@c.us`;
        }

        console.log(`📤 Sending WhatsApp message to ${target}: ${message}`);
        const result = await client.sendMessage(target, message);

        if (this.gateway) {
            this.gateway.addMessageToHistory('whatsapp', 'Zawgyi AI', String(message), 'outgoing', 'Zawgyi AI');
        }

        return {
            success: true,
            recipient: target,
            message_id: result.id._serialized,
            timestamp: new Date().toISOString()
        };
    }

    async sendMediaAction(params, userId) {
        const { to, mediaPath, caption = '' } = params;
        if (!to || !mediaPath) throw new Error('Recipient and mediaPath are required');

        const client = this.checkReady();
        const { MessageMedia } = require('whatsapp-web.js');

        let target = to;
        if (!target.includes('@')) {
            target = `${target}@c.us`;
        }

        const media = MessageMedia.fromFilePath(mediaPath);
        const result = await client.sendMessage(target, media, { caption });

        return {
            success: true,
            recipient: target,
            caption: caption,
            message_id: result.id._serialized,
            timestamp: new Date().toISOString()
        };
    }

    async getContacts() {
        const client = this.checkReady();
        const contacts = await client.getContacts();
        return contacts.filter(contact => contact.isMyContact).map(c => ({
            id: c.id._serialized,
            name: c.name || c.pushname,
            number: c.number
        }));
    }

    async getChats() {
        const client = this.checkReady();
        const chats = await client.getChats();
        return chats.map(c => ({
            id: c.id._serialized,
            name: c.name,
            unreadCount: c.unreadCount,
            lastMessage: c.lastMessage ? c.lastMessage.body : null
        }));
    }

    async getStatusAction() {
        const client = this.getActiveClient();
        return {
            isReady: this.isReady || (!!client),
            hasClient: !!client,
            fromGateway: !!(this.gateway && this.gateway.platforms.get('whatsapp')?.client),
            sessionId: this.config.session.clientId
        };
    }

    async disconnect() {
        if (this.standaloneClient) {
            await this.standaloneClient.destroy();
            this.isReady = false;
        }
    }
}

module.exports = WhatsAppCapability;
