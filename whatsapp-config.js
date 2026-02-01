const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const WhatsAppConfig = {
    session: {
        dataPath: path.join(process.cwd(), 'data', 'whatsapp'),
        clientId: 'zawgyi-ai-client'
    },
    puppeteer: {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ],
        // Default viewport for better compatibility
        defaultViewport: {
            width: 800,
            height: 600
        }
    },
    media: {
        downloadPath: path.join(process.cwd(), 'downloads', 'whatsapp')
    }
};

const validateConfig = () => {
    // Basic validation
    return true;
};

const createWhatsAppClient = () => {
    return new Client({
        authStrategy: new LocalAuth({
            dataPath: WhatsAppConfig.session.dataPath,
            clientId: WhatsAppConfig.session.clientId
        }),
        puppeteer: WhatsAppConfig.puppeteer,
        // Add robust caching settings if supported by the version
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
    });
};

module.exports = {
    WhatsAppConfig,
    validateConfig,
    createWhatsAppClient
};
