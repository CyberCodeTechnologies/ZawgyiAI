const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const { WhatsAppConfig, validateConfig, createWhatsAppClient } = require('../../whatsapp-config');

class WhatsAppCapability {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.messageHandler = null;
        this.config = WhatsAppConfig;
        
        // Validate configuration
        if (!validateConfig()) {
            throw new Error('Invalid WhatsApp configuration');
        }
        
        // Ensure directories exist
        fs.ensureDirSync(this.config.session.dataPath);
        fs.ensureDirSync(this.config.media.downloadPath);
    }

    async initialize() {
        try {
            console.log('📱 Initializing WhatsApp capability...');
            
            // Create client using configuration
            this.client = createWhatsAppClient();
            
            this.setupEventListeners();
            await this.client.initialize();
            
            console.log('✅ WhatsApp initialization started');
            return true;

        } catch (error) {
            console.error('❌ WhatsApp initialization failed:', error.message);
            
            if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
                console.log('💡 Network connectivity issue detected');
                console.log('Please check your internet connection or try using a VPN');
            }
            
            throw error;
        }
    }

    setupEventListeners() {
        this.client.on('qr', (qr) => {
            console.log('📸 WhatsApp QR Code received!');
            console.log('Please scan this QR code with your WhatsApp mobile app:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failure:', msg);
            this.isReady = false;
        });

        this.client.on('disconnected', (reason) => {
            console.log('📱 WhatsApp client disconnected:', reason);
            this.isReady = false;
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`📱 WhatsApp loading: ${percent}% - ${message}`);
        });

        this.client.on('message', (message) => {
            this.handleIncomingMessage(message);
        });
    }

    async handleIncomingMessage(message) {
        try {
            const from = message.from;
            const body = message.body;
            const isGroup = message.from.endsWith('@g.us');
            
            console.log(`📨 Received WhatsApp message from ${from}: ${body}`);
            
            if (this.messageHandler) {
                await this.messageHandler({
                    platform: 'whatsapp',
                    from: from,
                    body: body,
                    isGroup: isGroup,
                    timestamp: new Date(),
                    message: message
                });
            }
        } catch (error) {
            console.error('❌ Error handling WhatsApp message:', error);
        }
    }

    async sendMessage(to, message) {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            console.log(`📤 Sending WhatsApp message to ${to}: ${message}`);
            
            if (!to.includes('@')) {
                to = `${to}@c.us`;
            }

            const result = await this.client.sendMessage(to, message);
            console.log('✅ WhatsApp message sent successfully');
            return result;
        } catch (error) {
            console.error('❌ Failed to send WhatsApp message:', error);
            throw error;
        }
    }

    async sendMedia(to, mediaPath, caption = '') {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            const media = require('whatsapp-web.js').MessageMedia.fromFilePath(mediaPath);
            const result = await this.client.sendMessage(to, media, { caption });
            console.log('✅ WhatsApp media sent successfully');
            return result;
        } catch (error) {
            console.error('❌ Failed to send WhatsApp media:', error);
            throw error;
        }
    }

    async getContacts() {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            const contacts = await this.client.getContacts();
            return contacts.filter(contact => contact.isMyContact);
        } catch (error) {
            console.error('❌ Failed to get WhatsApp contacts:', error);
            throw error;
        }
    }

    async getChats() {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            const chats = await this.client.getChats();
            return chats;
        } catch (error) {
            console.error('❌ Failed to get WhatsApp chats:', error);
            throw error;
        }
    }

    setMessageHandler(handler) {
        this.messageHandler = handler;
    }

    getStatus() {
        return {
            isReady: this.isReady,
            phoneNumber: this.config.phoneNumber,
            hasClient: !!this.client,
            sessionId: this.config.session.clientId,
            config: {
                headless: this.config.puppeteer.headless,
                rateLimit: this.config.messaging.rateLimit
            }
        };
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.destroy();
                console.log('📱 WhatsApp client disconnected');
                this.isReady = false;
            } catch (error) {
                console.error('❌ Error disconnecting WhatsApp:', error);
            }
        }
    }
}

module.exports = WhatsAppCapability;
