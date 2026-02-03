require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs-extra');

// Import ZawgyiAI Framework
const ZawgyiCore = require('./core/zawgyi-core');
const ZawgyiGateway = require('./core/zawgyi-gateway');

class ZawgyiAI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3005;
        
        // Initialize Zawgyi AI Framework
        this.core = new ZawgyiCore();
        this.gateway = new ZawgyiGateway(this.core);

        this.setupMiddleware();
        this.setupRoutes();
        this.initializeCapabilities();
    }

    setupMiddleware() {
        // Basic security headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
        });

        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'Zawgyi AI is running',
                timestamp: new Date().toISOString(),
                framework: 'Zawgyi AI Framework v1.0.0'
            });
        });

        // System status endpoint
        this.app.get('/status', (req, res) => {
            try {
                const coreStatus = this.core.getStatus();
                const gatewayStatus = this.gateway.getStatus();

                res.json({
                    success: true,
                    status: 'Zawgyi AI is running',
                    core: coreStatus,
                    gateway: gatewayStatus,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({
                    success: true,
                    status: 'Zawgyi AI is running',
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                    note: 'Status check completed'
                });
            }
        });

        // Capabilities endpoint
        this.app.get('/api/capabilities', (req, res) => {
            try {
                if (this.core && this.core.capabilityRegistry) {
                    const capabilities = this.core.capabilityRegistry.list();
                    res.json({
                        success: true,
                        capabilities: capabilities,
                        count: capabilities.length,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    res.json({
                        success: true,
                        capabilities: [],
                        count: 0,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Capabilities error:', error);
                res.status(500).json({ 
                    success: false,
                    error: error.message 
                });
            }
        });

        // Messages endpoint
        this.app.get('/api/messages', (req, res) => {
            try {
                const messages = this.gateway.messageHistory || [];
                res.json({
                    success: true,
                    messages: messages,
                    count: messages.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Messages error:', error);
                res.status(500).json({ 
                    success: false,
                    error: error.message 
                });
            }
        });

        // WhatsApp status endpoint
        this.app.get('/api/whatsapp/status', (req, res) => {
            try {
                const whatsapp = this.gateway.platforms.get('whatsapp');
                if (whatsapp && whatsapp.client) {
                    res.json({
                        success: true,
                        status: 'WhatsApp is connected',
                        client: whatsapp.client.isReady ? 'ready' : 'initializing',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    res.json({
                        success: true,
                        status: 'WhatsApp is not connected',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('WhatsApp status error:', error);
                res.status(500).json({ 
                    success: false,
                    error: error.message 
                });
            }
        });

        // WhatsApp send message endpoint
        this.app.post('/api/whatsapp/send', async (req, res) => {
            try {
                const { to, message } = req.body;
                if (!to || !message) {
                    return res.status(400).json({
                        success: false,
                        error: 'Recipient and message are required'
                    });
                }

                const whatsapp = this.gateway.platforms.get('whatsapp');
                if (whatsapp && whatsapp.client) {
                    const result = await whatsapp.client.sendMessage(to, message);
                    res.json({
                        success: true,
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'WhatsApp client not available'
                    });
                }
            } catch (error) {
                console.error('WhatsApp send error:', error);
                res.status(500).json({ 
                    success: false,
                    error: error.message 
                });
            }
        });

        // Main processing endpoint
        this.app.post('/process', this.gateway.expressMiddleware());

        // Web interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // Catch all for 404
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });
    }

    async initializeCapabilities() {
        console.log('🔧 Initializing ZawgyiAI Capabilities...');
        
        try {
            // Ensure data directories exist
            await fs.ensureDir('./data/memory');
            await fs.ensureDir('./data/inbox');
            await fs.ensureDir('./data/viber');
            await fs.ensureDir('./data/surveillance');
            await fs.ensureDir('./data/files');
            
            console.log('✅ Data directories ensured');
            
            // Initialize basic capabilities
            console.log('⚡ Basic capabilities initialized');
            
        } catch (error) {
            console.error('❌ Capability initialization error:', error);
        }
    }

    async start() {
        try {
            // Try to start on preferred port, then fallback to available ports
            const preferredPort = process.env.PORT || 3005;
            let port = preferredPort;
            
            // Function to check if port is available
            const isPortAvailable = async (port) => {
                return new Promise((resolve) => {
                    const net = require('net');
                    const server = net.createServer();
                    
                    server.listen(port, () => {
                        server.once('close', () => {
                            resolve(true);
                        });
                        server.close();
                    });
                    
                    server.on('error', () => {
                        resolve(false);
                    });
                });
            };
            
            // Find an available port
            for (let i = 0; i < 10; i++) {
                const testPort = preferredPort + i;
                if (await isPortAvailable(testPort)) {
                    port = testPort;
                    break;
                }
            }
            
            // Start the server
            this.app.listen(port, () => {
                console.log(`🚀 ZawgyiAI started on port ${port}`);
                console.log(`🌐 Web interface: http://localhost:${port}`);
                console.log(`🤖 Framework: ZawgyiAI Framework v1.0.0`);
                console.log(`🌌 Digital Universe Creator Online`);
                console.log(`📱 Multi-platform support enabled`);
                
                // Start gateway platforms
                this.startGateway();
            });
            
            // Update the port property
            this.port = port;
            
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    async startGateway() {
        try {
            console.log('🚀 Starting ZawgyiAI Gateway platforms...');
            await this.gateway.start();
        } catch (error) {
            console.error('❌ Gateway start error:', error);
        }
    }
}

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
const app = new ZawgyiAI();
app.start();

module.exports = ZawgyiAI;
