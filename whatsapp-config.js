const path = require('path');
const fs = require('fs-extra');

// WhatsApp Configuration
const WhatsAppConfig = {
    // Session path for WhatsApp Web session
    sessionPath: './data/whatsapp-v7',
    clientId: 'zawgyi-ai-client-v7',
    
    // Puppeteer configuration for browser automation
    puppeteer: {
        headless: true,
        timeout: 120000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-features=VizDisplayCompositor',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--safebrowsing-disable-auto-update',
            '--disable-component-extensions',
            '--disable-background-extensions',
            '--disable-extensions-except',
            '--disable-extensions-http',
            '--disable-extensions-file-access',
            '--disable-extensions-http-throttling',
            '--disable-extensions-history',
            '--disable-extensions-notifications',
            '--disable-extensions-pdf-viewer',
            '--disable-extensions-plugins',
            '--disable-extensions-printing',
            '--disable-extensions-privacy',
            '--disable-extensions-screenshots',
            '--disable-extensions-autoupdate',
            '--disable-extensions-webstore'
        ]
    },
    
    // Web version cache configuration
    webVersionCache: {
        type: 'local',
        path: './data/wwebjs_cache'
    }
};

// Validate configuration
function validateConfig() {
    try {
        // Ensure session directory exists
        if (!fs.existsSync(WhatsAppConfig.sessionPath)) {
            fs.ensureDirSync(WhatsAppConfig.sessionPath);
        }
        
        // Ensure web version cache directory exists
        if (!fs.existsSync(WhatsAppConfig.webVersionCache.path)) {
            fs.ensureDirSync(WhatsAppConfig.webVersionCache.path);
        }
        
        return true;
    } catch (error) {
        console.error('WhatsApp config validation error:', error);
        return false;
    }
}

// Create WhatsApp client
function createWhatsAppClient(options = {}) {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    
    // Merge default config with options
    const config = {
        authStrategy: new LocalAuth({
            dataPath: WhatsAppConfig.sessionPath,
            clientId: WhatsAppConfig.clientId
        }),
        puppeteer: WhatsAppConfig.puppeteer,
        webVersionCache: WhatsAppConfig.webVersionCache,
        ...options
    };
    
    return new Client(config);
}

// Get QR code terminal
function getQRCodeTerminal() {
    return qrcode;
}

module.exports = {
    WhatsAppConfig,
    validateConfig,
    createWhatsAppClient
};
