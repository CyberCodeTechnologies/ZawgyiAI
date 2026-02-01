/**
 * Zawgyi AI Capability Framework
 * Modular capability system for Zawgyi AI
 */

class ZawgyiCapability {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.actions = new Map();
        this.dependencies = [];
        this.config = {};
    }

    // Register an action for this capability
    addAction(name, handler, config = {}) {
        this.actions.set(name, {
            handler,
            config,
            description: config.description || `Execute ${name} action`
        });
        return this;
    }

    // Execute an action
    async execute(action, params, userId) {
        const actionHandler = this.actions.get(action);
        
        if (!actionHandler) {
            throw new Error(`Action '${action}' not found in capability '${this.name}'`);
        }

        try {
            console.log(`⚡ Executing ${this.name}.${action} for user ${userId}`);
            
            // Pre-execution hook
            await this.beforeExecute?.(action, params, userId);
            
            // Execute the action
            const result = await actionHandler.handler(params, userId);
            
            // Post-execution hook
            await this.afterExecute?.(action, params, userId, result);
            
            return {
                success: true,
                capability: this.name,
                action,
                result,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error in ${this.name}.${action}:`, error);
            return {
                success: false,
                capability: this.name,
                action,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // List all actions
    listActions() {
        return Array.from(this.actions.keys());
    }

    // Get action info
    getActionInfo(action) {
        const actionHandler = this.actions.get(action);
        return actionHandler ? {
            name: action,
            description: actionHandler.description,
            config: actionHandler.config
        } : null;
    }

    // Set configuration
    setConfig(config) {
        this.config = { ...this.config, ...config };
        return this;
    }

    // Add dependency
    addDependency(dependency) {
        this.dependencies.push(dependency);
        return this;
    }

    // Lifecycle hooks (can be overridden)
    async beforeExecute(action, params, userId) {
        // Override in subclasses
    }

    async afterExecute(action, params, userId, result) {
        // Override in subclasses
    }

    async initialize() {
        // Override in subclasses
    }

    async cleanup() {
        // Override in subclasses
    }
}

// Factory function for creating capabilities
function createCapability(name, description) {
    return new ZawgyiCapability(name, description);
}

module.exports = {
    ZawgyiCapability,
    createCapability
};
