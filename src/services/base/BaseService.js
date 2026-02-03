const EventEmitter = require('events');

class BaseService extends EventEmitter {
    constructor(name, config = {}) {
        super();
        this.name = name;
        this.config = config;
        this.status = 'stopped';
        this.metrics = {
            executions: 0,
            successRate: 0,
            averageDuration: 0,
            totalDuration: 0,
            errors: []
        };
        this.createdAt = new Date();
        this.lastActivity = new Date();
    }

    async initialize() {
        this.status = 'starting';
        this.emit('service:starting', { service: this });
        
        try {
            await this.performInitialization();
            this.status = 'running';
            this.emit('service:started', { service: this });
        } catch (error) {
            this.status = 'error';
            this.emit('service:error', { service: this, error });
            throw error;
        }
    }

    async performInitialization() {
        // This should be implemented by subclasses
        // Default implementation does nothing
    }

    async execute(params) {
        if (this.status !== 'running') {
            await this.initialize();
        }

        const startTime = Date.now();
        this.lastActivity = new Date();
        
        try {
            this.emit('service:execution:started', { service: this, params });
            
            const result = await this.performOperation(params);
            const duration = Date.now() - startTime;
            
            this.updateMetrics(true, duration);
            this.emit('service:execution:completed', { service: this, params, result, duration });
            
            return {
                success: true,
                result: result,
                duration: duration,
                service: this.name
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.updateMetrics(false, duration);
            this.metrics.errors.push({
                message: error.message,
                timestamp: new Date().toISOString(),
                stack: error.stack
            });
            
            this.emit('service:execution:failed', { service: this, params, error, duration });
            
            return {
                success: false,
                error: error.message,
                duration: duration,
                service: this.name
            };
        }
    }

    async performOperation(params) {
        // This should be implemented by subclasses
        throw new Error('performOperation must be implemented by subclass');
    }

    async shutdown() {
        this.status = 'stopping';
        this.emit('service:stopping', { service: this });
        
        try {
            await this.performShutdown();
            this.status = 'stopped';
            this.emit('service:stopped', { service: this });
        } catch (error) {
            this.status = 'error';
            this.emit('service:error', { service: this, error });
            throw error;
        }
    }

    async performShutdown() {
        // This should be implemented by subclasses
        // Default implementation does nothing
    }

    updateMetrics(success, duration) {
        this.metrics.executions++;
        this.metrics.totalDuration += duration;
        this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.executions;
        
        if (success) {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.executions - 1) + 1) / this.metrics.executions;
        } else {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.executions - 1)) / this.metrics.executions;
        }
        
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            status: this.status,
            lastActivity: this.lastActivity,
            uptime: Date.now() - this.createdAt.getTime()
        };
    }

    getStatus() {
        return {
            name: this.name,
            status: this.status,
            config: this.config,
            metrics: this.getMetrics(),
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.emit('service:config:updated', { service: this, config: this.config });
    }

    isRunning() {
        return this.status === 'running';
    }

    isStopped() {
        return this.status === 'stopped';
    }

    hasError() {
        return this.status === 'error';
    }

    clearErrors() {
        this.metrics.errors = [];
        this.emit('service:errors:cleared', { service: this });
    }

    getRecentErrors(limit = 10) {
        return this.metrics.errors.slice(-limit);
    }

    resetMetrics() {
        this.metrics = {
            executions: 0,
            successRate: 0,
            averageDuration: 0,
            totalDuration: 0,
            errors: []
        };
        this.emit('service:metrics:reset', { service: this });
    }
}

module.exports = BaseService;
