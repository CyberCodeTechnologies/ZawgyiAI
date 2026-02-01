const axios = require('axios');
const os = require('os');

class NetworkSkill {
    constructor() {
        this.description = 'Monitor network connectivity and system status';
        this.actions = ['check_connection', 'system_info', 'speed_test'];
        this.parameters = {
            check_connection: ['host'],
            system_info: [],
            speed_test: []
        };
    }

    async execute(action, parameters, userId) {
        switch (action) {
            case 'check_connection':
                return await this.checkConnection(parameters);
            case 'system_info':
                return await this.getSystemInfo();
            case 'speed_test':
                return await this.simulateSpeedTest();
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    async checkConnection(params) {
        const { host = 'https://www.google.com' } = params;
        try {
            const start = Date.now();
            await axios.get(host);
            const latency = Date.now() - start;
            return {
                success: true,
                message: `Connected to ${host}`,
                latency: `${latency}ms`,
                status: 'Online'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to connect to ${host}`,
                error: error.message,
                status: 'Offline'
            };
        }
    }

    async getSystemInfo() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        return {
            success: true,
            message: 'System Information',
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

    async simulateSpeedTest() {
        // Simulating a speed test as real one requires heavy libraries
        // This is a placeholder for the concept
        return {
            success: true,
            message: 'Network Speed (Simulated)',
            download: '150 Mbps',
            upload: '45 Mbps',
            ping: '12ms'
        };
    }
}

module.exports = NetworkSkill;
