require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🔧 Final WhatsApp Fix');

const client = new Client({
    authStrategy: new LocalAuth({ 
        dataPath: './data/whatsapp-session',
        clientId: 'final-fix'
    }),
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR Code Generated - WhatsApp WORKS!');
});

client.on('ready', () => {
    console.log('🎉 WhatsApp Ready!');
});

client.initialize().catch(err => {
    console.log('❌ Final fix failed:', err.message);
    console.log('💡 WhatsApp needs VPN or different network');
});
