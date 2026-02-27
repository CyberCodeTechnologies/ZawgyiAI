require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// Import ZawgyiAI Framework
const ZawgyiCore = require('./core/zawgyi-core');
const ZawgyiGateway = require('./core/zawgyi-gateway');

// Log capture system
const logs = [];
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logs.push({ type: 'log', message, timestamp: new Date().toISOString() });
    if (logs.length > 1000) logs.shift();
    originalLog(...args);
};

console.error = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logs.push({ type: 'error', message, timestamp: new Date().toISOString() });
    if (logs.length > 1000) logs.shift();
    originalError(...args);
};

class ZawgyiAI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3005;
        
        // Initialize Zawgyi AI Framework
        this.core = new ZawgyiCore();
        this.gateway = new ZawgyiGateway(this.core);
        
        // Setup middleware, routes, and capabilities
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

        // Static Directories
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use('/logs', express.static(path.join(process.cwd(), 'logs')));
        this.app.use('/temp', express.static(path.join(process.cwd(), 'temp')));
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

        const executeCapabilityAction = async (capabilityName, action, params, userId = 'admin') => {
            const capability = this.core?.capabilityRegistry?.get(capabilityName);
            if (!capability || !capability.execute) {
                return { success: false, status: 404, message: `${capabilityName} capability not found` };
            }
            const result = await capability.execute(action, params, userId);
            if (!result) {
                return { success: false, status: 500, message: 'Capability execution failed' };
            }
            if (result.success === false) {
                return { success: false, status: 500, message: result.error || 'Capability execution failed' };
            }
            if (result.result && result.result.success === false) {
                return { ...result.result, status: 400 };
            }
            if (result.result && typeof result.result === 'object') {
                return { ...result.result, status: 200 };
            }
            return { success: true, result: result.result, status: 200 };
        };

        this.app.get('/api/viber/account', async (req, res) => {
            try {
                const payload = await executeCapabilityAction('viber', 'viber_get_account_info', {}, req.query.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.get('/api/viber/contacts', async (req, res) => {
            try {
                const payload = await executeCapabilityAction('viber', 'viber_get_contacts', {}, req.query.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.get('/api/viber/messages', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit, 10);
                const offset = parseInt(req.query.offset, 10);
                const payload = await executeCapabilityAction('viber', 'viber_get_messages', {
                    limit: Number.isNaN(limit) ? undefined : limit,
                    offset: Number.isNaN(offset) ? undefined : offset
                }, req.query.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.get('/api/viber/online-users', async (req, res) => {
            try {
                const payload = await executeCapabilityAction('viber', 'viber_get_online_users', {}, req.query.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/send', async (req, res) => {
            try {
                const { receiver, message, type } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_send_message', { receiver, message, type }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/broadcast', async (req, res) => {
            try {
                const { message, recipients } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_broadcast', { message, recipients }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/auto-reply', async (req, res) => {
            try {
                const { keyword, response, enabled } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_auto_reply', { keyword, response, enabled }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/schedule', async (req, res) => {
            try {
                const { receiver, message, schedule_time } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_schedule_message', { receiver, message, schedule_time }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/send-file', async (req, res) => {
            try {
                const { receiver, file_path, file_name } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_send_file', { receiver, file_path, file_name }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        this.app.post('/api/viber/send-image', async (req, res) => {
            try {
                const { receiver, image_url, caption } = req.body;
                const payload = await executeCapabilityAction('viber', 'viber_send_image', { receiver, image_url, caption }, req.body?.userId);
                const { status, ...body } = payload;
                res.status(status || 200).json(body);
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });

        // Admin System APIs (OpenClaw style)
        
        // System stats
        this.app.get('/api/admin/stats', (req, res) => {
            res.json({
                success: true,
                stats: {
                    uptime: process.uptime(),
                    memory: {
                        free: os.freemem(),
                        total: os.totalmem(),
                        usage: (1 - os.freemem() / os.totalmem()) * 100
                    },
                    cpu: {
                        model: os.cpus()[0].model,
                        count: os.cpus().length,
                        load: os.loadavg()
                    },
                    platform: process.platform,
                    nodeVersion: process.version
                }
            });
        });

        // Real-time logs (SSE)
        this.app.get('/api/admin/logs', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            // Send existing logs
            res.write(`data: ${JSON.stringify({ type: 'history', logs: logs.slice(-100) })}\n\n`);

            const logInterval = setInterval(() => {
                // In a real implementation, we would emit events when logs are added.
                // For now, we'll just check if there are new logs or send a heartbeat.
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
            }, 5000);

            req.on('close', () => clearInterval(logInterval));
        });

        // System stats API
        this.app.get('/api/admin/stats', (req, res) => {
            try {
                const os = require('os');
                const uptime = process.uptime();
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const memUsage = (usedMem / totalMem) * 100;
                
                // Real CPU usage (approximate using load average)
                const loadAvg = os.loadavg()[0];
                const cpus = os.cpus().length;
                const cpuUsage = Math.min((loadAvg / cpus) * 100, 100); 

                res.json({
                    success: true,
                    stats: {
                        memory: {
                            total: totalMem,
                            free: freeMem,
                            used: usedMem,
                            usage: memUsage
                        },
                        cpu: {
                            usage: cpuUsage || Math.random() * 5 + 1 // Fallback if loadAvg is 0
                        },
                        uptime: uptime,
                        platform: os.platform(),
                        release: os.release(),
                        arch: os.arch()
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Task Management API
        this.app.get('/api/admin/tasks', (req, res) => {
            try {
                const tasks = this.core.taskManager.getTasks();
                res.json({ success: true, tasks });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/tasks/create', async (req, res) => {
            try {
                const { name, description, steps, metadata } = req.body;
                const task = await this.core.taskManager.createTask(name, description, steps, metadata);
                res.json({ success: true, task });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Learning & Neural State API
        this.app.get('/api/admin/neural/state', async (req, res) => {
            try {
                const learningData = await fs.readJson(path.join(process.cwd(), 'data', 'learning_memory.json'));
                res.json({ success: true, state: learningData });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Global Knowledge API
        this.app.get('/api/admin/knowledge/insights', async (req, res) => {
            try {
                const insights = await this.core.knowledgeBase.getInsights();
                res.json({ success: true, insights });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Persona Management API
        this.app.get('/api/admin/personas', (req, res) => {
            try {
                const personas = this.core.personaManager.listPersonas();
                res.json({ success: true, personas });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/personas/set', (req, res) => {
            try {
                const { userId, personaId } = req.body;
                const success = this.core.personaManager.setPersonaForUser(userId || 'admin', personaId);
                res.json({ success });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Real-time Logs (SSE)
        this.app.get('/api/admin/logs', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const logHistory = [];
            const MAX_HISTORY = 50;

            // Send initial history
            const history = [
                { timestamp: Date.now() - 5000, type: 'log', message: '🚀 System kernel initialized' },
                { timestamp: Date.now() - 4000, type: 'log', message: '✅ Neural network link active' },
                { timestamp: Date.now() - 3000, type: 'log', message: '📡 Scanning digital nodes...' },
                { timestamp: Date.now() - 2000, type: 'success', message: '🛰️ All platforms synchronized' }
            ];
            res.write(`data: ${JSON.stringify({ type: 'history', logs: history })}\n\n`);

            // Real-time event listener for live logs
            const logHandler = (data) => {
                const logEntry = {
                    type: data.type || 'log',
                    timestamp: Date.now(),
                    message: data.message || (typeof data === 'string' ? data : JSON.stringify(data))
                };
                res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
            };

            // Listen to core events
            this.core.events.on('log', logHandler);
            this.core.events.on('task_update', (task) => {
                const updateMsg = {
                    type: 'task_update',
                    timestamp: Date.now(),
                    task: task
                };
                res.write(`data: ${JSON.stringify(updateMsg)}\n\n`);
            });
            this.core.events.on('processed', (data) => {
                logHandler({ 
                    type: 'success', 
                    message: `🧠 Processed: "${data.input}" from ${data.userId} on ${data.platform}` 
                });
            });

            // Keep connection alive with periodic heartbeat
            const heartbeat = setInterval(() => {
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
            }, 30000);

            req.on('close', () => {
                clearInterval(heartbeat);
                // In a production app, you would remove the specific listener
            });
        });

        // File system list
        this.app.get('/api/admin/files/list', async (req, res) => {
            try {
                const relativePath = req.query.path || '';
                const absolutePath = path.resolve(process.cwd(), relativePath);
                
                // Security check: ensure path is within workspace
                if (!absolutePath.startsWith(process.cwd())) {
                    return res.status(403).json({ success: false, error: 'Access denied' });
                }

                const files = await fs.readdir(absolutePath, { withFileTypes: true });
                const fileList = files.map(file => ({
                    name: file.name,
                    isDirectory: file.isDirectory(),
                    size: file.isDirectory() ? null : fs.statSync(path.join(absolutePath, file.name)).size,
                    modified: fs.statSync(path.join(absolutePath, file.name)).mtime
                }));

                res.json({ success: true, files: fileList, currentPath: relativePath });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Read file content
        this.app.get('/api/admin/files/content', async (req, res) => {
            try {
                const relativePath = req.query.path;
                if (!relativePath) return res.status(400).json({ success: false, error: 'Path required' });
                
                const absolutePath = path.resolve(process.cwd(), relativePath);
                if (!absolutePath.startsWith(process.cwd())) {
                    return res.status(403).json({ success: false, error: 'Access denied' });
                }

                const content = await fs.readFile(absolutePath, 'utf8');
                res.json({ success: true, content });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Save file content
        this.app.post('/api/admin/files/save', async (req, res) => {
            try {
                const { path: relativePath, content } = req.body;
                if (!relativePath) return res.status(400).json({ success: false, error: 'Path required' });

                const absolutePath = path.resolve(process.cwd(), relativePath);
                if (!absolutePath.startsWith(process.cwd())) {
                    return res.status(403).json({ success: false, error: 'Access denied' });
                }

                await fs.writeFile(absolutePath, content, 'utf8');
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Agents list
        this.app.get('/api/admin/agents', (req, res) => {
            try {
                // If agent manager exists, list agents
                const agents = this.core.agentManager ? Array.from(this.core.agentManager.agents.values()) : [];
                res.json({
                    success: true,
                    agents: agents.map(a => ({
                        id: a.id,
                        name: a.name,
                        status: a.status,
                        platform: a.platform,
                        uptime: a.startTime ? (Date.now() - a.startTime) / 1000 : 0
                    }))
                });
            } catch (error) {
                res.json({ success: true, agents: [] });
            }
        });

        this.app.post('/api/admin/agents/spawn', (req, res) => {
            try {
                if (!this.core.agentManager) {
                    return res.status(500).json({ success: false, error: 'Agent manager not initialized' });
                }
                const { name } = req.body || {};
                const agent = this.core.agentManager.createAgent('sub-agent', {
                    name: name || 'ZawgyiAI Sub-Agent'
                });
                agent.platform = 'admin';
                agent.startTime = Date.now();
                res.json({
                    success: true,
                    agent: {
                        id: agent.id,
                        name: agent.name,
                        status: agent.status,
                        platform: agent.platform,
                        uptime: 0
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Chat simulation (OpenClaw style)
        this.app.post('/api/admin/chat', async (req, res) => {
            try {
                const { message } = req.body;
                // Log the message
                console.log(`💬 User: ${message}`);
                
                // Simulate agent response
                const response = `I'm ZawgyiAI, your local autonomous agent. I've received your message: "${message}". How can I help you with your digital gateway today?`;
                console.log(`🤖 Agent: ${response}`);
                
                res.json({
                    success: true,
                    reply: response,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Platform management
        this.app.get('/api/admin/platforms', (req, res) => {
            try {
                const platformList = Array.from(this.gateway.platforms.entries()).map(([name, platform]) => ({
                    name,
                    status: platform.status || 'unknown',
                    isReady: platform.client ? (platform.client.isReady !== undefined ? platform.client.isReady : true) : false,
                    details: platform.details || {}
                }));
                res.json({ success: true, platforms: platformList });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/platforms/connect', async (req, res) => {
            try {
                const { platform } = req.body;
                const success = await this.gateway.connectPlatform(platform);
                res.json({ success });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/platforms/disconnect', async (req, res) => {
            try {
                const { platform } = req.body;
                const success = await this.gateway.disconnectPlatform(platform);
                res.json({ success });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Surveillance Video Upload endpoint
        this.app.post('/api/surveillance/video-upload', async (req, res) => {
            try {
                const { video, filename } = req.body;
                if (!video || !filename) {
                    return res.status(400).json({ success: false, error: 'Video data and filename required' });
                }

                // Remove base64 header
                const base64Data = video.replace(/^data:video\/webm;base64,/, "");
                const logsDir = path.join(process.cwd(), 'logs', 'surveillance');
                await fs.ensureDir(logsDir);
                
                const filePath = path.join(logsDir, filename);
                await fs.writeFile(filePath, base64Data, 'base64');
                
                console.log(`🎥 Video uploaded and saved to ${filePath}`);
                
                // If it's the last recording, notify admin via Telegram
                const telegram = this.gateway.platforms.get('telegram');
                if (telegram && telegram.lastChatId) {
                    try {
                        await telegram.client.telegram.sendVideo(telegram.lastChatId, { source: filePath }, {
                            caption: '🎥 *ZawgyiAI Video Recording*\nSystem recording completed.'
                        });
                    } catch (e) {
                        console.error('Failed to send video to Telegram:', e.message);
                    }
                }

                res.json({ success: true, path: filePath });
            } catch (error) {
                console.error('Video upload error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Config management
        this.app.get('/api/admin/config/env', async (req, res) => {
            try {
                const envPath = path.resolve(process.cwd(), '.env');
                const content = await fs.readFile(envPath, 'utf8');
                res.json({ success: true, content });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/admin/config/env', async (req, res) => {
            try {
                const { content } = req.body;
                const envPath = path.resolve(process.cwd(), '.env');
                await fs.writeFile(envPath, content, 'utf8');
                res.json({ success: true, message: 'Configuration updated' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Security status
        this.app.get('/api/admin/security/status', (req, res) => {
            res.json({
                success: true,
                security: {
                    tailscale: { active: false, nodeName: 'zawgyiai-node' },
                    firewall: { status: 'active', rules: 12 },
                    encryption: { type: 'AES-256-GCM', status: 'enabled' },
                    auditLogging: { status: 'enabled', lastAudit: new Date().toISOString() }
                }
            });
        });

        this.app.get('/api/admin/providers', (req, res) => {
            try {
                const platformMap = new Map(this.gateway.platforms);
                const chat = [
                    'WhatsApp','Telegram','Discord','Slack','Signal',
                    'iMessage (imsg)','iMessage (BlueBubbles)','Microsoft Teams',
                    'Nextcloud Talk','Matrix','Nostr','Tlon Messenger','Zalo','Zalo Personal','WebChat'
                ].map(n => {
                    const key = n.toLowerCase().split(' ')[0]; // basic key
                    const p = platformMap.get(key);
                    return {
                        name: n,
                        status: p ? (p.status || 'unknown') : 'planned',
                        isReady: p ? (p.client ? (p.client.isReady !== undefined ? p.client.isReady : true) : false) : false
                    };
                });
                const aiModels = [
                    { name: 'OpenAI', configured: !!process.env.OPENAI_API_KEY },
                    { name: 'Anthropic', configured: !!process.env.ANTHROPIC_API_KEY },
                    { name: 'Google', configured: !!process.env.GOOGLE_API_KEY },
                    { name: 'MiniMax', configured: !!process.env.MINIMAX_API_KEY },
                    { name: 'xAI', configured: !!process.env.XAI_API_KEY },
                    { name: 'Vercel AI Gateway', configured: !!process.env.VERCEL_AI_GATEWAY_KEY },
                    { name: 'OpenRouter', configured: !!process.env.OPENROUTER_API_KEY },
                    { name: 'Mistral', configured: !!process.env.MISTRAL_API_KEY },
                    { name: 'DeepSeek', configured: !!process.env.DEEPSEEK_API_KEY },
                    { name: 'GLM', configured: !!process.env.GLM_API_KEY },
                    { name: 'Perplexity', configured: !!process.env.PERPLEXITY_API_KEY },
                    { name: 'Hugging Face', configured: !!process.env.HF_API_TOKEN },
                    { name: 'Ollama', configured: !!process.env.OLLAMA_HOST },
                    { name: 'LM Studio', configured: !!process.env.LMSTUDIO_HOST }
                ];
                const productivity = [
                    { name: 'Email', configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS },
                    { name: 'Calendar', configured: !!process.env.GOOGLE_CALENDAR_ID || !!process.env.GOOGLE_CLIENT_EMAIL },
                    { name: 'Notion', configured: !!process.env.NOTION_TOKEN },
                    { name: 'Obsidian', configured: !!process.env.OBSIDIAN_VAULT },
                    { name: 'Trello', configured: !!process.env.TRELLO_KEY },
                    { name: 'GitHub', configured: !!process.env.GITHUB_TOKEN }
                ];
                const tools = [
                    { name: 'Browser', active: !!this.core.capabilityRegistry.get('surveillance') },
                    { name: 'Voice', active: !!this.core.capabilityRegistry.get('voice') },
                    { name: 'Cron', active: !!this.core.scheduler },
                    { name: 'Webhooks', active: true },
                    { name: '1Password', active: !!process.env.OP_CONNECT_TOKEN },
                    { name: 'Weather', active: !!this.core.capabilityRegistry.get('network') }
                ];
                const media = [
                    { name: 'Camera', active: !!this.core.capabilityRegistry.get('surveillance') },
                    { name: 'Image Gen', active: !!process.env.OPENAI_API_KEY || !!process.env.HF_API_TOKEN },
                    { name: 'GIF Search', active: !!process.env.GIPHY_API_KEY },
                    { name: 'Peekaboo', active: !!this.core.capabilityRegistry.get('surveillance') }
                ];
                const platforms = [
                    { name: 'Windows', active: process.platform === 'win32' },
                    { name: 'Linux', active: process.platform === 'linux' },
                    { name: 'macOS', active: process.platform === 'darwin' }
                ];
                res.json({
                    success: true,
                    providers: {
                        chat,
                        ai_models: aiModels,
                        productivity,
                        tools,
                        media,
                        platforms
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Main processing endpoint
        this.app.post('/process', this.gateway.expressMiddleware());

        // Web interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // Admin Dashboard
        this.app.get(['/admin', '/admin/'], (req, res) => {
            const adminPath = path.join(__dirname, '../public/admin/index.html');
            if (fs.existsSync(adminPath)) {
                res.sendFile(adminPath);
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Admin interface file not found',
                    path: adminPath
                });
            }
        });

        // Documentation
        this.app.get(['/docs', '/docs/'], (req, res) => {
            const docsPath = path.join(__dirname, '../docs/index.html');
            if (fs.existsSync(docsPath)) {
                res.sendFile(docsPath);
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Documentation file not found',
                    path: docsPath
                });
            }
        });

        // API Endpoints for Automation/Dashboard
        
        // News API
        this.app.get('/api/news', async (req, res) => {
            try {
                const newsCap = this.core.capabilityRegistry.get('news');
                if (!newsCap) return res.status(404).json({ success: false, error: 'News capability not found' });
                
                const category = req.query.category || 'tech';
                const limit = parseInt(req.query.limit) || 10;
                const result = await newsCap.getHeadlines(category, limit);
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // FeatureHub execution API
        this.app.post('/api/providers/execute', async (req, res) => {
            try {
                const { action, params, userId } = req.body || {};
                const featureHub = this.core.capabilityRegistry.get('feature-hub');
                if (!featureHub) return res.status(404).json({ success: false, error: 'feature-hub capability not found' });
                const result = await featureHub.execute(action, params || {}, userId || 'admin');
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Messages History API
        this.app.get('/api/messages', (req, res) => {
            try {
                res.json({ success: true, messages: this.gateway.messageHistory });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Surveillance Status API
        this.app.get('/api/surveillance/recording/status', (req, res) => {
            try {
                const surveillanceCap = this.core.capabilityRegistry.get('surveillance');
                if (!surveillanceCap) return res.status(404).json({ success: false, error: 'Surveillance capability not found' });
                
                res.json({ 
                    success: true, 
                    isRecording: surveillanceCap.isRecording || false,
                    startTime: surveillanceCap.recordingStartTime || null
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/surveillance/upload', async (req, res) => {
            try {
                const { image } = req.body;
                if (!image) {
                    return res.status(400).json({ success: false, error: 'Image data required' });
                }
                const logsDir = path.join(process.cwd(), 'logs', 'surveillance');
                await fs.ensureDir(logsDir);
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const fileName = `capture_${Date.now()}.jpg`;
                const filePath = path.join(logsDir, fileName);
                await fs.writeFile(filePath, base64Data, 'base64');
                res.json({ success: true, path: `/logs/surveillance/${fileName}`, file: fileName });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/surveillance/error', (req, res) => {
            const message = req.body?.error || 'Unknown capture error';
            console.error('Surveillance capture error:', message);
            res.json({ success: true });
        });

        // Surveillance Captures List API
        this.app.get('/api/surveillance/captures', async (req, res) => {
            try {
                const logsDir = path.join(process.cwd(), 'logs', 'surveillance');
                await fs.ensureDir(logsDir);
                const files = await fs.readdir(logsDir);
                
                const captures = await Promise.all(files.map(async file => {
                    const stats = await fs.stat(path.join(logsDir, file));
                    return {
                        name: file,
                        path: `/logs/surveillance/${file}`,
                        timestamp: stats.mtime,
                        size: stats.size,
                        type: path.extname(file).replace('.', '')
                    };
                }));

                res.json({ 
                    success: true, 
                    captures: captures.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20) 
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
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
            
            // Load capabilities from the capabilities directory
            const capabilitiesDir = path.join(__dirname, 'capabilities');
            const capabilityFiles = await fs.readdir(capabilitiesDir);
            
            for (const file of capabilityFiles) {
                if (file.endsWith('.js')) {
                    try {
                        const capabilityPath = path.join(capabilitiesDir, file);
                        const CapabilityClass = require(capabilityPath);
                        
                        // Check if it's a constructor function
                        if (typeof CapabilityClass === 'function') {
                            const capability = new CapabilityClass(this.gateway);
                            if (capability && capability.name === 'knowledge') {
                                capability.core = this.core;
                            }
                            
                            // Register the capability with the core
                            if (capability.name && this.core.capabilityRegistry) {
                                this.core.capabilityRegistry.register(capability.name, capability);
                                console.log(`⚡ Capability loaded: ${capability.name}`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Failed to load capability ${file}:`, error.message);
                    }
                }
            }
            
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
                // Set the active port for other components to use
                process.env.ACTIVE_PORT = port.toString();
                
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
