require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs-extra');

// Import Zawgyi AI Framework
const ZawgyiCore = require('./core/zawgyi-core');
const ZawgyiGateway = require('./core/zawgyi-gateway');

// Import capabilities
const EmailCapability = require('./capabilities/email');
const CalendarCapability = require('./capabilities/calendar');
const FlightCapability = require('./capabilities/flight');
const InboxCapability = require('./capabilities/inbox');
const UniverseCapability = require('./capabilities/universe');

class ZawgyiAI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Initialize Zawgyi AI Framework
        this.core = new ZawgyiCore();
        this.gateway = new ZawgyiGateway(this.core);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeCapabilities();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'Zawgyi AI is running', 
                timestamp: new Date().toISOString(),
                framework: 'Zawgyi AI Framework v1.0.0'
            });
        });

        // System status
        this.app.get('/status', (req, res) => {
            const coreStatus = this.core.getStatus();
            const gatewayStatus = this.gateway.getStatus();
            
            res.json({
                core: coreStatus,
                gateway: gatewayStatus,
                timestamp: new Date().toISOString()
            });
        });

        // Main processing endpoint
        this.app.post('/process', this.gateway.expressMiddleware());

        // Web interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }

    async initializeCapabilities() {
        console.log('🔧 Initializing Zawgyi AI Capabilities...');

        // Register capabilities with the core
        this.core.addCapability('email', new EmailCapability());
        this.core.addCapability('calendar', new CalendarCapability());
        this.core.addCapability('flight', new FlightCapability());
        this.core.addCapability('inbox', new InboxCapability());
        this.core.addCapability('universe', new UniverseCapability());

        console.log('✅ All capabilities initialized');
    }

    async start() {
        try {
            // Ensure data directories exist
            await fs.ensureDir('./data/memory');
            await fs.ensureDir('./data/inbox');
            await fs.ensureDir('./data/whatsapp');
            
            // Start the server
            this.app.listen(this.port, () => {
                console.log(`🚀 Zawgyi AI started on port ${this.port}`);
                console.log(`🌐 Web interface: http://localhost:${this.port}`);
                console.log(`🤖 Framework: Zawgyi AI Framework v1.0.0`);
                console.log(`📱 Multi-platform support enabled`);
            });

            // Start gateway platforms
            await this.gateway.start();
            
        } catch (error) {
            console.error('❌ Failed to start Zawgyi AI:', error);
            process.exit(1);
        }
    }
}

// Start the application
const zawgyi = new ZawgyiAI();
zawgyi.start().catch(console.error);

module.exports = ZawgyiAI;
