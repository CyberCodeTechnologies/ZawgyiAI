/**
 * ZawgyiAI Gateway Framework
 * Multi-platform communication gateway
 */

const fs = require('fs-extra');
const path = require('path');

class ZawgyiGateway {
    constructor(core) {
        this.core = core;
        this.platforms = new Map();
        this.middleware = [];
        this.routes = new Map();
        this.messageHistory = []; // Store recent messages
        
        this.initializeGateway();
    }

    initializeGateway() {
        console.log('🌐 ZawgyiAI Gateway - Multi-Platform Communication System');
        
        this.setupMiddleware();
        this.setupRouting();
        this.setupPlatformHandlers();
        
        console.log('✅ Gateway Ready');
    }

    setupMiddleware() {
        // Logging middleware
        this.use(async (req, res, next) => {
            console.log(`📨 ${req.platform} request from ${req.userId}: ${req.message}`);
            
            // Store message in history
            this.messageHistory.unshift({
                timestamp: new Date().toISOString(),
                platform: req.platform,
                userId: req.userId,
                message: req.message,
                type: 'incoming'
            });
            
            // Keep only last 100 messages
            if (this.messageHistory.length > 100) {
                this.messageHistory = this.messageHistory.slice(0, 100);
            }
            
            await next();
        });

        // Authentication middleware
        this.use(async (req, res, next) => {
            req.userId = this.sanitizeUserId(req.userId);
            await next();
        });

        // Rate limiting middleware
        this.use(async (req, res, next) => {
            const key = `${req.platform}:${req.userId}`;
            const lastRequest = this.core.contextManager.get(key, 'lastRequest', 0);
            const now = Date.now();
            
            if (now - lastRequest < 1000) { // 1 second rate limit
                res.send('Please wait a moment before sending another message.');
                return;
            }
            
            this.core.contextManager.set(key, 'lastRequest', now);
            await next();
        });
    }

    setupRouting() {
        // Route requests to appropriate handlers
        this.routes.set('process', async (req, res) => {
            try {
                const result = await this.core.process(req.message, req.userId, req.platform);
                
                // Determine the best response format
                let responseToSend;
                
                // Handle ZawgyiCapability wrapped responses
                const actualResult = (result && result.result && result.capability) ? result.result : result;

                if (typeof actualResult === 'string') {
                    responseToSend = actualResult;
                } else if (actualResult.response) {
                    responseToSend = actualResult.response;
                } else if (actualResult.message) {
                    responseToSend = actualResult.message;
                } else if (actualResult.text) {
                    responseToSend = actualResult.text;
                } else {
                    responseToSend = JSON.stringify(actualResult, null, 2);
                }

                res.send(responseToSend);
            } catch (error) {
                console.error('Route processing error:', error);
                res.send('Sorry, I encountered an error processing your request.');
            }
        });

        this.routes.set('status', async (req, res) => {
            const status = this.core.getStatus();
            res.json(status);
        });

        this.routes.set('health', async (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                platform: req.platform 
            });
        });

        this.routes.set('messages', async (req, res) => {
            res.json({
                messages: this.messageHistory
            });
        });
    }

    setupPlatformHandlers() {
        // Register all platforms
        this.registerWebPlatform();
        this.registerTelegramPlatform();
        this.registerWhatsAppPlatform();
    }
    
    async notifyAll(message) {
        let sent = false;
        
        // Try to notify via Telegram
        const telegramPlatform = this.platforms.get('telegram');
        if (telegramPlatform && telegramPlatform.client && telegramPlatform.lastChatId) {
            try {
                await telegramPlatform.client.telegram.sendMessage(telegramPlatform.lastChatId, `🔔 ${message}`);
                sent = true;
                console.log('📢 Notification sent via Telegram');
            } catch (e) { 
                console.error('Failed to notify Telegram:', e.message); 
            }
        }
        
        // Try to notify via WhatsApp
        const whatsappPlatform = this.platforms.get('whatsapp');
        if (whatsappPlatform && whatsappPlatform.client && whatsappPlatform.lastChatId) {
            try {
                await whatsappPlatform.client.sendMessage(whatsappPlatform.lastChatId, `🔔 ${message}`);
                sent = true;
                console.log('📱 Notification sent via WhatsApp');
            } catch (e) { 
                console.error('Failed to notify WhatsApp:', e.message); 
            }
        }
        
        if (!sent) {
            console.log(`[Notification] ${message} (No active chat sessions to notify)`);
        }
        
        return sent;
    }


    // Web platform handler
    registerWebPlatform() {
        this.registerPlatform('web', {
            handle: async (req, res) => {
                req.platform = 'web';
                await this.routeRequest(req, res);
            }
        });
    }

    // Telegram platform handler
    registerTelegramPlatform() {
        // Telegram platform handler
        this.registerPlatform('telegram', {
            initialize: async () => {
                const { Telegraf } = require('telegraf');
                
                if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === 'your_telegram_bot_token') {
                    console.log('⚠️ Telegram bot token not configured or using placeholder value');
                    console.log('   Please set a valid TELEGRAM_BOT_TOKEN in .env');
                    return null;
                }

                const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
                
                // Handle /start command (Get Started)
                bot.start((ctx) => {
                    const welcomeMsg = `🤖 *Welcome to Zawgyi AI!*

I am your intelligent digital assistant. I can help you with:

📧 *Communication* (Email, Inbox)
📅 *Planning* (Calendar, Flights)
🌌 *Simulation* (Digital Universe, Physics)
🧠 *Knowledge* (Questions, Research)

Just type what you need, or ask me a question!
_Example: "Check my emails" or "What is quantum physics?"_`;
                    ctx.replyWithMarkdown(welcomeMsg);
                });

                bot.on('message', async (ctx) => {
                    // Ignore non-text messages
                    if (!ctx.message || !ctx.message.text) return;

                    // Store last chat ID for notifications
                    const platform = this.platforms.get('telegram');
                    if (platform) platform.lastChatId = ctx.chat.id;
                    
                    const req = {
                        userId: ctx.from.id.toString(),
                        message: ctx.message.text,
                        platform: 'telegram',
                        raw: ctx
                    };
                    
                    const res = {
                        send: async (message) => {
                            // The gateway already extracts the message content, so just send it
                            await ctx.reply(String(message));
                        },
                        json: async (data) => {
                            await ctx.reply(JSON.stringify(data, null, 2));
                        }
                    };
                    
                    await this.routeRequest(req, res);
                });

                bot.catch((err, ctx) => {
                    console.error(`❌ Telegram Error for ${ctx.updateType}:`, err);
                });

                // Check if another instance is likely running by trying to delete a lock file
                const lockFile = path.join(process.cwd(), 'telegram.lock');
                try {
                    // Try to update lock file
                    await fs.writeFile(lockFile, process.pid.toString());
                } catch (err) {
                    console.log('⚠️ Could not write lock file, but proceeding...');
                }

                bot.launch({
                    dropPendingUpdates: true 
                }).catch(error => {
                    if (error.response && error.response.error_code === 409) {
                        console.error('❌ Telegram Bot Conflict (409): Another instance is running.');
                        console.log('   The bot is already running elsewhere. This instance will skip Telegram initialization.');
                    } else if (error.response && error.response.error_code === 404) {
                        console.error('❌ Telegram Bot Error: Invalid Token (404 Not Found)');
                        console.log('   Please check TELEGRAM_BOT_TOKEN in .env');
                    } else {
                        console.error('❌ Telegram Bot Error:', error.message);
                    }
                    return null;
                });
                
                // Enable graceful stop
                const stopBot = (signal) => {
                    try {
                        bot.stop(signal);
                        // Clean up lock file
                        if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
                    } catch (e) { /* ignore */ }
                };

                process.once('SIGINT', () => stopBot('SIGINT'));
                process.once('SIGTERM', () => stopBot('SIGTERM'));

                console.log('📱 Telegram platform initialized');
                return bot;
            }
        });
    }

    registerWhatsAppPlatform() {
        // WhatsApp platform handler
        this.registerPlatform('whatsapp', {
            initialize: async () => {
                try {
                    // DNS check removed to allow Puppeteer to handle connectivity
                    /*
                    try {
                        const dns = require('dns').promises;
                        await dns.lookup('web.whatsapp.com');
                    } catch (dnsError) {
                        console.log('⚠️ WhatsApp Web DNS resolution failed');
                        console.log('   WhatsApp platform will be disabled for this session');
                        console.log('   To enable WhatsApp: Check your internet connection or try a different network');
                        return null;
                    }
                    */

                    const { Client, LocalAuth } = require('whatsapp-web.js');
                    const qrcode = require('qrcode-terminal');

                    console.log('🔄 Initializing WhatsApp platform...');

                    // Initialize WhatsApp client
        const sessionPath = './data/whatsapp-v7';
        try {
            // Skip force clean to avoid EBUSY
            // await fs.remove(sessionPath);
            await fs.ensureDir(sessionPath);
            console.log('   WhatsApp session directory ensured');
        } catch (error) {
            // Ignore cleanup errors and continue
            console.log('   Session cleanup warning:', error.message);
        }

        const client = new Client({
            authStrategy: new LocalAuth({ 
                dataPath: sessionPath,
                clientId: 'zawgyi-ai-client-v7'
            }),
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            },
            puppeteer: { 
                headless: true,
                timeout: 60000,
                dumpio: true,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-extensions',
                    '--disable-sync',
                    '--disable-translate',
                    '--metrics-recording-only',
                    '--safebrowsing-disable-auto-update'
                ]
            }
        });

                    client.on('qr', (qr) => {
                        console.log('📱 WhatsApp QR Code:');
                        qrcode.generate(qr, { small: true });
                    });

                    client.on('ready', () => {
                        console.log('✅ WhatsApp platform ready');
                    });

                    client.on('disconnected', (reason) => {
                        console.log('⚠️ WhatsApp disconnected:', reason);
                    });

                    client.on('auth_failure', (msg) => {
                        console.error('❌ WhatsApp auth failure:', msg);
                    });

                    client.on('message', async (message) => {
                        if (message.isStatus) return;

                        // Store last chat ID for notifications
                        handler.lastChatId = message.from;

                        const req = {
                            userId: message.from,
                            message: message.body,
                            platform: 'whatsapp',
                            raw: message
                        };
                        
                        const res = {
                            send: async (response) => {
                                await message.reply(response);
                            }
                        };
                        
                        await this.routeRequest(req, res);
                    });

                    console.log('   Starting WhatsApp client initialization...');
                    
                    try {
                        // Add timeout for initialization
                        const initPromise = client.initialize();
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('WhatsApp initialization timed out after 120s')), 120000)
                        );
                        
                        await Promise.race([initPromise, timeoutPromise]);
                        console.log('   WhatsApp client initialization started successfully');
                        return client;
                    } catch (initError) {
                        const errorMessage = initError.message || String(initError);
                        
                        // Handle network connectivity issues
                        if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || 
                            errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
                            console.log('   ⚠️  Network connectivity issue detected');
                            console.log('   💡 WhatsApp servers unreachable - this is expected in some regions');
                            console.log('   📱 WhatsApp platform will be disabled but other features work normally');
                            throw new Error('WhatsApp servers unreachable. Try using VPN or different network.');
                        }
                        
                        // Handle browser conflicts
                        if (errorMessage.includes('browser is already running')) {
                            console.log('   Attempting to clean up existing session...');
                            try {
                                await client.destroy();
                                console.log('   Cleaned up existing session, retrying...');
                                await client.initialize();
                                console.log('   WhatsApp client initialization successful on retry');
                                return client;
                            } catch (retryError) {
                                console.log('   Retry failed, continuing without WhatsApp');
                                throw new Error('WhatsApp initialization failed after retry');
                            }
                        }
                        
                        // Handle other initialization errors
                        console.log('   WhatsApp initialization failed:', errorMessage);
                        throw initError;
                    }
                } catch (error) {
                    const errorMessage = error.message || String(error);
                    console.error('❌ WhatsApp initialization failed:', errorMessage);
                    
                    // Handle network connectivity issues (most common)
                    if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || 
                        errorMessage.includes('net::ERR_NAME_NOT_RESOLVED') ||
                        errorMessage.includes('WhatsApp servers unreachable')) {
                        console.log('   ⚠️  WhatsApp platform disabled due to network connectivity');
                        console.log('   💡 Other features (Telegram, Web, etc.) will continue working normally');
                        console.log('   🔧 To fix: Try VPN, change DNS to 8.8.8.8, or use different network');
                        return null;
                    }
                    
                    // Handle browser conflicts
                    if (errorMessage.includes('browser is already running')) {
                        console.log('   Attempting to clean up existing session...');
                        try {
                            // Force clean the session directory
                            await fs.remove('./data/whatsapp');
                            await fs.ensureDir('./data/whatsapp');
                            console.log('   Session cleaned. Please restart the application.');
                        } catch (cleanupError) {
                            console.error('   Failed to clean session:', cleanupError.message);
                        }
                        return null;
                    }
                    
                    // Handle timeout and other errors gracefully
                    if (errorMessage.includes('timed out') || 
                        errorMessage.includes('context was destroyed') ||
                        errorMessage.includes('Execution context was destroyed')) {
                        console.log('   ⚠️  WhatsApp initialization failed - this is common in some environments');
                        console.log('   💡 WhatsApp platform disabled but other features continue working');
                        return null;
                    }
                    
                    // Generic error handling
                    console.log('   📱 WhatsApp platform will be disabled for this session');
                    console.log('   💡 All other Zawgyi AI features remain fully functional');
                    return null;
                }
            }
        });
    }

    // Middleware system
    use(middleware) {
        this.middleware.push(middleware);
    }

    // Platform registration
    registerPlatform(name, handler) {
        this.platforms.set(name, handler);
        console.log(`🔗 Platform registered: ${name}`);
    }

    // Request routing
    async routeRequest(req, res) {
        // Apply middleware
        for (const middleware of this.middleware) {
            await new Promise((resolve, reject) => {
                const next = () => resolve();
                middleware(req, res, next).catch(reject);
            });
        }

        // Route to appropriate handler
        const route = req.route || 'process';
        const handler = this.routes.get(route);
        
        if (handler) {
            await handler(req, res);
        } else {
            res.send('Route not found');
        }
    }

    // Helper function to sanitize user IDs
    sanitizeUserId(userId) {
        return userId.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    // Start all platforms
    async start() {
        console.log('🚀 Starting ZawgyiAI Gateway platforms...');
        
        const platformPromises = [];
        
        for (const [name, platform] of this.platforms) {
            platformPromises.push(
                (async () => {
                    try {
                        if (platform.initialize) {
                            const instance = await platform.initialize();
                            if (instance) {
                                console.log(`✅ ${name} platform started`);
                                return { name, status: 'success' };
                            } else {
                                console.log(`⚠️ ${name} platform disabled`);
                                return { name, status: 'disabled' };
                            }
                        }
                        return { name, status: 'skipped' };
                    } catch (error) {
                        console.error(`❌ Failed to start ${name} platform:`, error.message);
                        return { name, status: 'failed', error: error.message };
                    }
                })()
            );
        }
        
        const results = await Promise.allSettled(platformPromises);
        const successful = results.filter(r => r.value?.status === 'success').length;
        const total = this.platforms.size;
        
        console.log(`🌐 Platform initialization complete: ${successful}/${total} platforms active`);
    }

    // Express.js integration
    expressMiddleware() {
        return (req, res) => {
            const request = {
                userId: req.body.userId || req.ip,
                message: req.body.message,
                platform: req.body.platform || 'web',
                route: req.body.route || 'process',
                raw: req
            };
            
            const response = {
                send: async (message) => {
                    res.json({ response: message });
                },
                json: async (data) => {
                    res.json(data);
                }
            };
            
            this.routeRequest(request, response);
        };
    }

    // Get gateway status
    getStatus() {
        return {
            platforms: Array.from(this.platforms.keys()),
            middleware: this.middleware.length,
            routes: Array.from(this.routes.keys()),
            uptime: process.uptime()
        };
    }
}

module.exports = ZawgyiGateway;
