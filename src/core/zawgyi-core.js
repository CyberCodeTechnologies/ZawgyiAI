/**
 * Zawgyi AI Core Framework
 * The central intelligence system for Zawgyi AI
 */

class ZawgyiCore {
    constructor() {
        this.name = "Zawgyi AI";
        this.version = "1.1.1";
        this.capabilities = new Map();
        this.context = new Map();
        this.plugins = new Map();
        this.modules = new Map();
        this.services = new Map();

        this.initializeCore();
    }

    initializeCore() {
        console.log(`🤖 ${this.name} v${this.version} - Core Framework Initializing`);

        // Initialize core systems
        this.setupEventSystem();
        this.setupPluginSystem();
        this.setupContextManager();
        this.setupCapabilityRegistry();
        this.setupTaskManager();
        this.setupKnowledgeBase();
        this.setupPersonaManager();
        this.setupAutonomousSystems();

        console.log(`✅ ${this.name} Core Framework Ready`);
    }

    setupPersonaManager() {
        const ZawgyiPersonaManager = require('./zawgyi-persona-manager');
        this.personaManager = new ZawgyiPersonaManager(this);
    }

    setupKnowledgeBase() {
        const ZawgyiKnowledgeBase = require('./zawgyi-knowledge-base');
        this.knowledgeBase = new ZawgyiKnowledgeBase(this);
    }

    setupAutonomousSystems() {
        const ZawgyiScheduler = require('./zawgyi-scheduler');
        this.scheduler = new ZawgyiScheduler(this);
    }

    setupTaskManager() {
        const ZawgyiTaskManager = require('./zawgyi-task-manager');
        this.taskManager = new ZawgyiTaskManager(this);
    }

    setupEventSystem() {
        this.events = {
            listeners: new Map(),
            emit: (event, data) => {
                const listeners = this.events.listeners.get(event) || [];
                listeners.forEach(listener => listener(data));
            },
            on: (event, callback) => {
                if (!this.events.listeners.has(event)) {
                    this.events.listeners.set(event, []);
                }
                this.events.listeners.get(event).push(callback);
            }
        };
    }

    setupPluginSystem() {
        this.pluginManager = {
            plugins: new Map(),
            register: (name, plugin) => {
                if (plugin.initialize) {
                    plugin.initialize(this);
                }
                this.pluginManager.plugins.set(name, plugin);
                console.log(`🔌 Plugin registered: ${name}`);
            },
            get: (name) => this.pluginManager.plugins.get(name),
            execute: async (pluginName, method, ...args) => {
                const plugin = this.pluginManager.get(pluginName);
                if (plugin && plugin[method]) {
                    return await plugin[method](...args);
                }
                throw new Error(`Plugin ${pluginName} or method ${method} not found`);
            }
        };
    }

    setupContextManager() {
        this.contextManager = {
            context: new Map(),
            set: (userId, key, value) => {
                if (!this.contextManager.context.has(userId)) {
                    this.contextManager.context.set(userId, new Map());
                }
                this.contextManager.context.get(userId).set(key, value);
            },
            get: (userId, key, defaultValue = null) => {
                const userContext = this.contextManager.context.get(userId);
                return userContext ? userContext.get(key) || defaultValue : defaultValue;
            },
            getAll: (userId) => {
                return Object.fromEntries(this.contextManager.context.get(userId) || new Map());
            },
            clear: (userId) => {
                this.contextManager.context.delete(userId);
            }
        };
    }

    setupCapabilityRegistry() {
        this.capabilityRegistry = {
            capabilities: new Map(),
            register: (name, capability) => {
                this.capabilityRegistry.capabilities.set(name, capability);
                console.log(`⚡ Capability registered: ${name}`);
            },
            get: (name) => this.capabilityRegistry.capabilities.get(name),
            list: () => Array.from(this.capabilityRegistry.capabilities.keys()),
            execute: async (capabilityName, action, params, userId) => {
                const capability = this.capabilityRegistry.get(capabilityName);
                if (capability && capability.execute) {
                    return await capability.execute(action, params, userId);
                }
                throw new Error(`Capability ${capabilityName} not found`);
            }
        };
    }

    // Main processing method
    async process(input, userId, platform = 'web') {
        try {
            console.log(`🧠 Processing: "${input}" from ${userId} on ${platform}`);

            // Special Handle for Telegram Voice Messages
            if (input.startsWith('[TELEGRAM_VOICE_MESSAGE]')) {
                const voiceUrl = input.replace('[TELEGRAM_VOICE_MESSAGE] ', '');
                return {
                    success: true,
                    message: `🎙️ *Neural Link: Voice Synchronized*\n\nI have received your audio recording. I'm currently analyzing the signal for processing.\n\n[Download Original Link](${voiceUrl})`,
                    type: 'voice_ack'
                };
            }

            // Store input in context
            this.contextManager.set(userId, 'lastInput', input);
            this.contextManager.set(userId, 'lastPlatform', platform);
            this.contextManager.set(userId, 'lastInteraction', new Date().toISOString());

            // Parse intent
            const intent = await this.parseIntent(input, userId);

            // Execute capability
            const result = await this.capabilityRegistry.execute(intent.capability, intent.action, intent.params, userId);

            // Store result in context
            this.contextManager.set(userId, 'lastResult', result);

            // Emit event
            this.events.emit('processed', { userId, input, result, platform });

            return result;
        } catch (error) {
            console.error(`❌ Processing error:`, error);
            return {
                success: false,
                error: error.message,
                fallback: "I'm sorry, I encountered an error processing your request."
            };
        }
    }

    async parseIntent(input, userId) {
        const context = this.contextManager.getAll(userId);
        const lowerInput = input.toLowerCase();

        // Multi-language support (Simplified)
        const isBurmese = /[\u1000-\u109F]/.test(input);
        if (isBurmese) {
            // Placeholder for Burmese NLP
            // return { capability: 'knowledge', action: 'translate_and_chat', params: { query: input } };
        }

        // Knowledge & Learning System (Simulated continuous learning)
        if (lowerInput.includes('learn') || lowerInput.includes('remember this')) {
            return { capability: 'knowledge', action: 'learn_fact', params: { fact: input } };
        }

        // Email capabilities
        if (lowerInput.includes('email') || lowerInput.includes('mail')) {
            if (lowerInput.includes('send') || lowerInput.includes('compose')) {
                return { capability: 'email', action: 'send', params: { text: input } };
            } else if (lowerInput.includes('read') || lowerInput.includes('check')) {
                return { capability: 'email', action: 'read', params: {} };
            }
        }

        // Calendar capabilities
        if (lowerInput.includes('calendar') || lowerInput.includes('meeting') || lowerInput.includes('event')) {
            if (lowerInput.includes('create') || lowerInput.includes('schedule')) {
                return { capability: 'calendar', action: 'create', params: { text: input } };
            } else if (lowerInput.includes('read') || lowerInput.includes('show')) {
                return { capability: 'calendar', action: 'read', params: {} };
            }
        }

        // Flight capabilities
        if (lowerInput.includes('flight') || lowerInput.includes('check in')) {
            if (lowerInput.includes('check in')) {
                return { capability: 'flight', action: 'checkin', params: { text: input } };
            } else if (lowerInput.includes('status')) {
                return { capability: 'flight', action: 'status', params: { text: input } };
            }
        }

        // Inbox capabilities
        if (lowerInput.includes('inbox') || lowerInput.includes('organize')) {
            return { capability: 'inbox', action: 'organize', params: {} };
        }

        // Universe capabilities
        if (lowerInput.includes('universe') || lowerInput.includes('simulate') || lowerInput.includes('create universe')) {
            if (lowerInput.includes('create')) {
                return { capability: 'universe', action: 'create', params: { text: input } };
            } else if (lowerInput.includes('simulate')) {
                return { capability: 'universe', action: 'simulate', params: { text: input } };
            } else if (lowerInput.includes('calculate') || lowerInput.includes('physics')) {
                return { capability: 'universe', action: 'calculate', params: { text: input } };
            } else if (lowerInput.includes('quantum')) {
                return { capability: 'universe', action: 'quantum', params: { text: input } };
            } else if (lowerInput.includes('observe') || lowerInput.includes('show')) {
                return { capability: 'universe', action: 'observe', params: { text: input } };
            }
        }

        // Multi-Agent capabilities
        if (lowerInput.includes('agent') || lowerInput.includes('roll call') || lowerInput.includes('collaborate')) {
            if (lowerInput.includes('spawn') || lowerInput.includes('create')) {
                return { capability: 'multi-agent', action: 'spawn_agents', params: { agent_types: ['worker', 'analyzer'], tasks: [{ type: 'general', priority: 'medium' }] } };
            } else if (lowerInput.includes('roll call') || lowerInput.includes('check status')) {
                return { capability: 'multi-agent', action: 'daily_rollcall', params: { agents: [{ id: 'agent_1' }, { id: 'agent_2' }] } };
            } else if (lowerInput.includes('collaborate') || lowerInput.includes('cooperation')) {
                return { capability: 'multi-agent', action: 'collaborate_instances', params: { instances: ['local', 'remote'] } };
            } else if (lowerInput.includes('improve') || lowerInput.includes('learn')) {
                return { capability: 'multi-agent', action: 'self_improve', params: { improvement_areas: ['efficiency'] } };
            }
        }

        // Personal Assistant capabilities
        if (lowerInput.includes('remind') || lowerInput.includes('order') || lowerInput.includes('call') || lowerInput.includes('vault') || lowerInput.includes('location')) {
            if (lowerInput.includes('location')) {
                return { capability: 'personal-assistant', action: 'get_location', params: {} };
            } else if (lowerInput.includes('remind')) {
                return { capability: 'personal-assistant', action: 'send_reminder', params: { content: input, tool: 'notion' } };
            } else if (lowerInput.includes('order') || lowerInput.includes('buy')) {
                return { capability: 'personal-assistant', action: 'place_order', params: { item: input, vendor: 'amazon' } };
            } else if (lowerInput.includes('call')) {
                return { capability: 'personal-assistant', action: 'voice_call', params: { contact: 'Associate', topic: input } };
            } else if (lowerInput.includes('vault') || lowerInput.includes('password')) {
                return { capability: 'personal-assistant', action: 'manage_vault', params: { action: 'list', item: 'all' } };
            }
        }

        // Surveillance & System capabilities
        if (lowerInput.includes('photo') || lowerInput.includes('camera') || lowerInput.includes('screenshot') || lowerInput.includes('screen') || lowerInput.includes('video') || lowerInput.includes('record')) {
            // Check for Start/Stop first (for Video/Camera Recording)
            if ((lowerInput.includes('start') || lowerInput.includes('recording')) && (lowerInput.includes('camera') || lowerInput.includes('video') || lowerInput.includes('record'))) {
                if (lowerInput.includes('stop')) {
                    return { capability: 'surveillance', action: 'stop_video_recording', params: {} };
                }
                return { capability: 'surveillance', action: 'start_video_recording', params: {} };
            } else if (lowerInput.includes('stop') && (lowerInput.includes('camera') || lowerInput.includes('video') || lowerInput.includes('record'))) {
                return { capability: 'surveillance', action: 'stop_video_recording', params: {} };
            }
            
            // Photo/Screenshot
            if (lowerInput.includes('photo') || lowerInput.includes('camera') || lowerInput.includes('take a photo')) {
                return { capability: 'surveillance', action: 'take_photo', params: {} };
            } else if (lowerInput.includes('screenshot') || lowerInput.includes('screen')) {
                return { capability: 'surveillance', action: 'take_screenshot', params: {} };
            } else if (lowerInput.includes('video') || lowerInput.includes('record')) {
                return { capability: 'surveillance', action: 'start_video_recording', params: {} };
            }
        }

        // Default response - Use Knowledge/Chat capability
        return { capability: 'knowledge', action: 'chat', params: { query: input } };
    }

    // Plugin registration helper
    use(plugin) {
        this.pluginManager.register(plugin.name || 'anonymous', plugin);
        return this;
    }

    // Capability registration helper
    addCapability(name, capability) {
        this.capabilityRegistry.register(name, capability);
        return this;
    }

    // Get system status
    getStatus() {
        return {
            name: this.name,
            version: this.version,
            capabilities: this.capabilityRegistry.list(),
            plugins: Array.from(this.pluginManager.plugins.keys()),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}

module.exports = ZawgyiCore;
