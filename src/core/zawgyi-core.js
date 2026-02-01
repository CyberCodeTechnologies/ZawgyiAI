/**
 * Zawgyi AI Core Framework
 * The central intelligence system for Zawgyi AI
 */

class ZawgyiCore {
    constructor() {
        this.name = "Zawgyi AI";
        this.version = "1.0.0";
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
        
        console.log(`✅ ${this.name} Core Framework Ready`);
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
        
        // Simple intent parsing (can be enhanced with NLP)
        const lowerInput = input.toLowerCase();
        
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
