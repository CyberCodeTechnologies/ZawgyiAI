require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs-extra');

// Import ZawgyiAI Framework
const ZawgyiCore = require('./core/zawgyi-core');
const ZawgyiGateway = require('./core/zawgyi-gateway');
const AutomationManager = require('./core/automation-manager');

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Don't exit immediately to allow pending tasks to finish or logging to complete
    // process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Import capabilities
const EmailCapability = require('./capabilities/email');
const CalendarCapability = require('./capabilities/calendar');
const FlightCapability = require('./capabilities/flight');
const InboxCapability = require('./capabilities/inbox');
const UniverseCapability = require('./capabilities/universe');
const FacebookCapability = require('./capabilities/facebook');
const NewsCapability = require('./capabilities/news');
const KnowledgeCapability = require('./capabilities/knowledge');
const NetworkCapability = require('./capabilities/network');
const BusinessCapability = require('./capabilities/business');
const WhatsAppCapability = require('./capabilities/whatsapp');
const VoiceCapability = require('./capabilities/voice');
const FilesCapability = require('./capabilities/files');
const AnalyticsCapability = require('./capabilities/analytics');
const PersonalAssistantCapability = require('./capabilities/personal-assistant');
const ProductivityPlanningCapability = require('./capabilities/productivity-planning');
const ResearchKnowledgeCapability = require('./capabilities/research-knowledge');
const DevelopmentTechnicalCapability = require('./capabilities/development-technical');
const AutomationIntegrationsCapability = require('./capabilities/automation-integrations');
const MultiAgentCapability = require('./capabilities/multi-agent');
const FunSocialCapability = require('./capabilities/fun-social');
const ZohoIntegrationCapability = require('./capabilities/zoho-integration');
const AutoSMSMyanmarCapability = require('./capabilities/auto-sms-myanmar');

class ZawgyiAI {
    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000', 10);
        
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

        // API endpoints
        this.app.get('/api/messages', (req, res) => {
            res.json({ messages: this.gateway.messageHistory || [] });
        });

        this.app.get('/api/news', async (req, res) => {
            try {
                // Find news capability
                const newsCapability = this.core.capabilityRegistry.get('news');
                
                if (newsCapability) {
                    const news = await newsCapability.getHeadlines('all', 10);
                    res.json(news);
                } else {
                    res.status(404).json({ error: 'News capability not found' });
                }
            } catch (error) {
                console.error('Failed to fetch news:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    async initializeCapabilities() {
        console.log('🔧 Initializing ZawgyiAI Capabilities...');

        // Register capabilities with the core
        this.core.addCapability('email', new EmailCapability());
        this.core.addCapability('calendar', new CalendarCapability());
        this.core.addCapability('flight', new FlightCapability());
        this.core.addCapability('inbox', new InboxCapability());
        this.core.addCapability('universe', new UniverseCapability());
        this.core.addCapability('facebook', new FacebookCapability());
        this.core.addCapability('news', new NewsCapability());
        this.core.addCapability('knowledge', new KnowledgeCapability());
        this.core.addCapability('network', new NetworkCapability());
        this.core.addCapability('business', new BusinessCapability());
        this.core.addCapability('whatsapp', new WhatsAppCapability());
        this.core.addCapability('voice', new VoiceCapability());
        this.core.addCapability('files', new FilesCapability());
        this.core.addCapability('analytics', new AnalyticsCapability());
        this.core.addCapability('personal-assistant', new PersonalAssistantCapability());
        this.core.addCapability('productivity-planning', new ProductivityPlanningCapability());
        this.core.addCapability('research-knowledge', new ResearchKnowledgeCapability());
        this.core.addCapability('development-technical', new DevelopmentTechnicalCapability());
        this.core.addCapability('automation-integrations', new AutomationIntegrationsCapability());
        this.core.addCapability('multi-agent', new MultiAgentCapability());
        this.core.addCapability('fun-social', new FunSocialCapability());
        this.core.addCapability('zoho-integration', new ZohoIntegrationCapability());
        this.core.addCapability('auto-sms-myanmar', new AutoSMSMyanmarCapability());

        // Initialize and start Automation Manager
        this.automationManager = new AutomationManager(this.core.capabilityRegistry, this.gateway);
        this.automationManager.start();

        console.log('✅ All capabilities initialized');
    }

    async start() {
        try {
            // Ensure data directories exist
            await fs.ensureDir('./data/memory');
            await fs.ensureDir('./data/inbox');
            await fs.ensureDir('./data/whatsapp');
            await fs.ensureDir('./data/whatsapp-session');
            await fs.ensureDir('./data/files');
            await fs.ensureDir('./data/analytics');
            await fs.ensureDir('./data/personal-assistant');
            await fs.ensureDir('./data/productivity-planning');
            await fs.ensureDir('./data/knowledge-base');
            await fs.ensureDir('./data/development');
            await fs.ensureDir('./data/automation');
            await fs.ensureDir('./data/multi-agent');
            await fs.ensureDir('./data/fun-social');
            await fs.ensureDir('./data/zoho-integration');
            await fs.ensureDir('./data/auto-sms-myanmar');
            
            // Start the server with port fallback
            await this.startServer(this.port);

            // Start gateway platforms
            await this.gateway.start();
            
        } catch (error) {
            console.error('❌ Failed to start ZawgyiAI v1.1.0:', error);
            process.exit(1);
        }
    }

    startServer(port) {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(port, () => {
                this.port = port; // Update port if changed
                console.log(`🚀 ZawgyiAI started on port ${this.port}`);
                console.log(`🌐 Web interface: http://localhost:${this.port}`);
                console.log(`🤖 Framework: ZawgyiAI Framework v1.1.0`);
                console.log(`🌌 Digital Universe Creator Online`);
                console.log(`📱 Multi-platform support enabled`);
                console.log(`🎯 26 Comprehensive Capabilities Active`);
                resolve(server);
            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
                    resolve(this.startServer(port + 1));
                } else {
                    console.error('❌ Server error:', error);
                    reject(error);
                }
            });
        });
    }
}

// Start the application
const zawgyi = new ZawgyiAI();
zawgyi.start().catch(console.error);

module.exports = ZawgyiAI;
