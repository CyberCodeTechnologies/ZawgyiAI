const { Telegraf } = require('telegraf');
const express = require('express');

class Gateway {
    constructor(agent) {
        this.agent = agent;
        this.telegramBot = null;
        this.whatsappClient = null;
        this.facebookMessengerBot = null;
        this.viberBot = null;
        this.wechatBot = null;
        this.lineBot = null;
        this.app = express();
        this.lastTelegramChatId = null;
        this.lastWhatsAppChatId = null;
        this.lastFacebookChatId = null;
        this.lastViberChatId = null;
        this.lastWeChatChatId = null;
        this.lastLineChatId = null;
    }

    async notifyAll(message) {
        let sent = false;
        if (this.telegramBot && this.lastTelegramChatId) {
            try {
                await this.telegramBot.telegram.sendMessage(this.lastTelegramChatId, `🔔 ${message}`);
                sent = true;
            } catch (e) { console.error('Failed to notify Telegram:', e.message); }
        }
        if (this.whatsappClient && this.lastWhatsAppChatId) {
            try {
                await this.whatsappClient.sendMessage(this.lastWhatsAppChatId, `🔔 ${message}`);
                sent = true;
            } catch (e) { console.error('Failed to notify WhatsApp:', e.message); }
        }
        if (!sent) {
            console.log(`[Notification] ${message} (No active chat sessions to notify)`);
        }
    }

    async start() {
        await this.initializeTelegram();
        await this.initializeWhatsApp();
        await this.initializeFacebookMessenger();
        await this.initializeViber();
        await this.initializeWeChat();
        await this.initializeLine();
        console.log('🔗 Gateway initialized');
    }

    async initializeTelegram() {
        if (!process.env.TELEGRAM_BOT_TOKEN || 
            process.env.TELEGRAM_BOT_TOKEN === 'your_telegram_bot_token' ||
            process.env.TELEGRAM_BOT_TOKEN.length < 20) {
            console.log('⚠️  Telegram bot token not configured or invalid. Skipping Telegram initialization.');
            console.log('   To enable Telegram: Set TELEGRAM_BOT_TOKEN in your .env file');
            return;
        }

        try {
            this.telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

            this.telegramBot.on('message', async (ctx) => {
                try {
                    this.lastTelegramChatId = ctx.chat.id;
                    const userId = ctx.from.id.toString();
                    const message = ctx.message.text;
                    const response = await this.agent.processMessage(userId, message, 'telegram');
                    await ctx.reply(response);
                } catch (error) {
                    console.error('Telegram error:', error);
                    await ctx.reply('Sorry, I encountered an error processing your request.');
                }
            });

            await this.telegramBot.launch();
            console.log('📱 Telegram bot started');
        } catch (error) {
            // Check for 404 specifically (invalid token)
            if (error.response && error.response.error_code === 404) {
                 console.error('❌ Telegram Bot Error: Invalid Token (404 Not Found)');
                 console.log('   Please update TELEGRAM_BOT_TOKEN in .env with a valid token from @BotFather');
            } else {
                 console.error('❌ Failed to start Telegram bot:', error.message);
                 console.log('   Please check your TELEGRAM_BOT_TOKEN is valid');
            }
        }
    }

    async initializeWhatsApp() {
        try {
            const { Client, LocalAuth } = require('whatsapp-web.js');
            const qrcode = require('qrcode-terminal');

            console.log('🔄 Initializing WhatsApp client...');

            this.whatsappClient = new Client({
                authStrategy: new LocalAuth({ dataPath: './data/whatsapp' }),
                puppeteer: { 
                    headless: 'new',
                    args: [
                        '--no-sandbox', 
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                        '--dns-server=8.8.8.8'
                    ]
                }
            });

            this.whatsappClient.on('qr', (qr) => {
                console.log('📱 Scan this QR code to log in to WhatsApp:');
                qrcode.generate(qr, { small: true });
            });

            this.whatsappClient.on('ready', () => {
                console.log('✅ WhatsApp client is ready!');
            });

            this.whatsappClient.on('authenticated', () => {
                console.log('🔐 WhatsApp authenticated');
            });

            this.whatsappClient.on('auth_failure', (msg) => {
                console.error('❌ WhatsApp authentication failed:', msg);
            });

            this.whatsappClient.on('message', async (message) => {
                try {
                    // Ignore status updates
                    if (message.isStatus) return;

                    this.lastWhatsAppChatId = message.from;
                    const userId = message.from;
                    const body = message.body;
                    
                    console.log(`📩 Received WhatsApp message from ${userId}: ${body}`);
                    
                    const response = await this.agent.processMessage(userId, body, 'whatsapp');
                    await message.reply(response);
                } catch (error) {
                    console.error('WhatsApp processing error:', error);
                    await message.reply('Sorry, I encountered an error processing your request.');
                }
            });

            await this.whatsappClient.initialize();
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp:', error);
            console.log('ℹ️  Make sure whatsapp-web.js is installed: npm install whatsapp-web.js qrcode-terminal');
        }
    }

    async initializeFacebookMessenger() {
        if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 
            process.env.FACEBOOK_PAGE_ACCESS_TOKEN === 'your_facebook_page_access_token') {
            console.log('⚠️  Facebook Page Access Token not configured. Skipping Facebook Messenger initialization.');
            console.log('   To enable Facebook Messenger: Set FACEBOOK_PAGE_ACCESS_TOKEN in your .env file');
            return;
        }

        try {
            const express = require('express');
            const bodyParser = require('body-parser');
            
            // Facebook Messenger webhook setup
            this.app.use(bodyParser.json());
            
            // Facebook webhook verification
            this.app.get('/webhook/facebook', (req, res) => {
                if (req.query['hub.mode'] === 'subscribe' && 
                    req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    res.sendStatus(403);
                }
            });

            // Handle Facebook messages
            this.app.post('/webhook/facebook', async (req, res) => {
                try {
                    const data = req.body;
                    if (data.object === 'page') {
                        for (const entry of data.entry) {
                            const webhookEvent = entry.messaging[0];
                            const senderPsid = webhookEvent.sender.id;
                            
                            if (webhookEvent.message) {
                                this.lastFacebookChatId = senderPsid;
                                const message = webhookEvent.message.text;
                                
                                console.log(`📩 Received Facebook message from ${senderPsid}: ${message}`);
                                
                                const response = await this.agent.processMessage(senderPsid, message, 'facebook');
                                await this.sendFacebookMessage(senderPsid, response);
                            }
                        }
                        res.status(200).send('EVENT_RECEIVED');
                    } else {
                        res.sendStatus(404);
                    }
                } catch (error) {
                    console.error('Facebook webhook error:', error);
                    res.sendStatus(500);
                }
            });

            console.log('📘 Facebook Messenger platform initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Facebook Messenger:', error.message);
        }
    }

    async sendFacebookMessage(recipientId, message) {
        if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) return;
        
        try {
            const axios = require('axios');
            await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}`, {
                recipient: { id: recipientId },
                message: { text: message }
            });
        } catch (error) {
            console.error('Failed to send Facebook message:', error.message);
        }
    }

    async initializeViber() {
        if (!process.env.VIBER_BOT_TOKEN || 
            process.env.VIBER_BOT_TOKEN === 'your_viber_bot_token') {
            console.log('⚠️  Viber bot token not configured. Skipping Viber initialization.');
            console.log('   To enable Viber: Set VIBER_BOT_TOKEN in your .env file');
            return;
        }

        try {
            const ViberBot = require('viber-bot').Bot;
            const BotEvents = require('viber-bot').Events;
            
            this.viberBot = new ViberBot({
                authToken: process.env.VIBER_BOT_TOKEN,
                name: "Zawgyi AI",
                avatar: "https://example.com/avatar.jpg" // Optional
            });

            this.viberBot.on(BotEvents.MESSAGE_RECEIVED, async (message, response) => {
                try {
                    this.lastViberChatId = response.userProfile.id;
                    const userId = response.userProfile.id;
                    const text = message.text;
                    
                    console.log(`📩 Received Viber message from ${userId}: ${text}`);
                    
                    const botResponse = await this.agent.processMessage(userId, text, 'viber');
                    response.send(new TextMessage(botResponse));
                } catch (error) {
                    console.error('Viber processing error:', error);
                    response.send(new TextMessage('Sorry, I encountered an error processing your request.'));
                }
            });

            // Viber webhook endpoint
            this.app.use('/webhook/viber', this.viberBot.middleware());

            console.log('📱 Viber platform initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Viber:', error.message);
            console.log('   Make sure viber-bot is installed: npm install viber-bot');
        }
    }

    async initializeWeChat() {
        if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
            console.log('⚠️  WeChat credentials not configured. Skipping WeChat initialization.');
            console.log('   To enable WeChat: Set WECHAT_APP_ID and WECHAT_APP_SECRET in your .env file');
            return;
        }

        try {
            // WeChat Work/Official Account API integration
            const express = require('express');
            const crypto = require('crypto');
            const axios = require('axios');
            
            // WeChat webhook endpoint
            this.app.get('/webhook/wechat', (req, res) => {
                const { signature, timestamp, nonce, echostr } = req.query;
                const token = process.env.WECHAT_TOKEN || 'your_wechat_token';
                
                const tmpStr = [token, timestamp, nonce].sort().join('');
                const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
                
                if (hash === signature) {
                    res.send(echostr);
                } else {
                    res.sendStatus(403);
                }
            });

            this.app.post('/webhook/wechat', async (req, res) => {
                try {
                    const xml2js = require('xml2js');
                    const parser = new xml2js.Parser();
                    
                    const result = await parser.parseStringPromise(req.body);
                    const message = result.xml;
                    
                    if (message.MsgType[0] === 'text') {
                        const userId = message.FromUserName[0];
                        const text = message.Content[0];
                        
                        this.lastWeChatChatId = userId;
                        console.log(`📩 Received WeChat message from ${userId}: ${text}`);
                        
                        const response = await this.agent.processMessage(userId, text, 'wechat');
                        await this.sendWeChatMessage(userId, response);
                    }
                    
                    res.send('success');
                } catch (error) {
                    console.error('WeChat webhook error:', error);
                    res.sendStatus(500);
                }
            });

            console.log('🟢 WeChat platform initialized');
        } catch (error) {
            console.error('❌ Failed to initialize WeChat:', error.message);
            console.log('   Make sure xml2js is installed: npm install xml2js');
        }
    }

    async sendWeChatMessage(openId, message) {
        if (!process.env.WECHAT_ACCESS_TOKEN) return;
        
        try {
            const axios = require('axios');
            const xml2js = require('xml2js');
            const builder = new xml2js.Builder();
            
            const xmlMessage = builder.buildObject({
                xml: {
                    ToUserName: { _cdata: openId },
                    FromUserName: { _cdata: process.env.WECHAT_APP_ID },
                    CreateTime: Date.now(),
                    MsgType: { _cdata: 'text' },
                    Content: { _cdata: message }
                }
            });
            
            await axios.post(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${process.env.WECHAT_ACCESS_TOKEN}`, {
                touser: openId,
                msgtype: 'text',
                text: { content: message }
            });
        } catch (error) {
            console.error('Failed to send WeChat message:', error.message);
        }
    }

    async handleTelegram(req, res) {
        // Handle webhook updates
        res.status(200).send('OK');
    }

    async handleWhatsApp(req, res) {
        // Handle webhook updates
        res.status(200).send('OK');
    }

    async handleGoogleAuth(req, res) {
        // Handle Google OAuth
        res.status(200).send('Google auth endpoint');
    }

    async handleGoogleCallback(req, res) {
        // Handle Google OAuth callback
        res.status(200).send('Google auth callback');
    }

    async stop() {
        if (this.telegramBot) {
            this.telegramBot.stop();
        }
        if (this.whatsappClient) {
            await this.whatsappClient.destroy();
        }
    }
}

module.exports = Gateway;
