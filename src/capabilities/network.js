const { ZawgyiCapability } = require('../core/zawgyi-capability');
const axios = require('axios');
const os = require('os');

class NetworkCapability extends ZawgyiCapability {
    constructor() {
        super('network', 'Monitor network connectivity and system status');
        this.setupActions();
    }
    
    setupActions() {
        this.addAction('check_connection', this.checkConnection.bind(this), {
            description: 'Check internet connectivity',
            parameters: ['host']
        });
        
        this.addAction('system_info', this.getSystemInfo.bind(this), {
            description: 'Get system information',
            parameters: []
        });

        this.addAction('broadcast', this.broadcastMessage.bind(this), {
            description: 'Broadcast message to other ZawgyiAI nodes',
            parameters: ['message', 'peers']
        });
    }

    async broadcastMessage(params, userId) {
        const { message, peers = [] } = params;
        
        if (!peers || peers.length === 0) {
             return { message: "No peers specified to broadcast to." };
        }

        console.log(`📡 Broadcasting to ${peers.length} network peers: ${message}`);
        
        const results = [];
        const selfId = process.env.ZAWGYI_NODE_ID || 'zawgyi-node-' + Date.now();

        for (const peerUrl of peers) {
             try {
                 // Ensure URL has protocol
                 const url = peerUrl.startsWith('http') ? peerUrl : `http://${peerUrl}`;
                 const endpoint = `${url}/process`;
                 
                 console.log(`   -> Sending to ${endpoint}...`);
                 
                 const response = await axios.post(endpoint, {
                     userId: selfId,
                     message: `[Broadcast from ${selfId}] ${message}`,
                     platform: 'network_p2p',
                     route: 'process'
                 }, { timeout: 5000 }); // 5s timeout

                 results.push({
                     peer: peerUrl,
                     status: 'success',
                     reply: response.data.response || response.data
                 });
             } catch (error) {
                 console.error(`   -> Failed to send to ${peerUrl}:`, error.message);
                 results.push({
                     peer: peerUrl,
                     status: 'failed',
                     error: error.message
                 });
             }
        }
        
        return {
            message: `Broadcast complete. Success: ${results.filter(r => r.status === 'success').length}/${peers.length}`,
            details: results,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
    }

    async checkConnection(params, userId) {
        const { host = 'https://www.google.com' } = params;
        try {
            const start = Date.now();
            await axios.get(host);
            const latency = Date.now() - start;
            return {
                message: `Connected to ${host} (${latency}ms)`,
                latency: `${latency}ms`,
                status: 'Online'
            };
        } catch (error) {
            return {
                message: `Failed to connect to ${host}`,
                error: error.message,
                status: 'Offline'
            };
        }
    }

    async getSystemInfo(params, userId) {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        return {
            message: 'System Information Retrieved',
            data: {
                platform: os.platform(),
                release: os.release(),
                hostname: os.hostname(),
                cpu_model: cpus[0].model,
                cpu_cores: cpus.length,
                memory_total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                memory_free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                uptime: `${(os.uptime() / 3600).toFixed(2)} hours`
            }
        };
    }
}

module.exports = NetworkCapability;
