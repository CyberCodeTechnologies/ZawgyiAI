class Task {
    constructor(id, name, description, config = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.config = config;
        this.timeout = config.timeout || 30000;
        this.retryCount = config.retry || 3;
        this.maxRetries = config.maxRetries || 3;
        this.dependencies = [];
        this.conditions = [];
        this.status = 'idle';
        this.createdAt = new Date();
        this.lastExecution = null;
        this.executionHistory = [];
    }

    addDependency(dependency) {
        this.dependencies.push(dependency);
        return this;
    }

    addCondition(condition) {
        this.conditions.push(condition);
        return this;
    }

    async execute(context) {
        const startTime = Date.now();
        this.status = 'executing';
        
        try {
            // Validate conditions
            await this.validateConditions(context);
            
            // Check dependencies
            await this.checkDependencies(context);
            
            // Execute task logic
            const result = await this.performExecution(context);
            
            const duration = Date.now() - startTime;
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: duration,
                status: 'completed',
                result: result
            };
            
            this.executionHistory.push(this.lastExecution);
            this.status = 'completed';
            
            return {
                success: true,
                result: result,
                duration: duration,
                taskId: this.id
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: duration,
                status: 'failed',
                error: error.message
            };
            
            this.executionHistory.push(this.lastExecution);
            this.status = 'failed';
            
            return {
                success: false,
                error: error.message,
                duration: duration,
                taskId: this.id
            };
        }
    }

    async performExecution(context) {
        // This should be implemented by subclasses
        throw new Error('performExecution must be implemented by subclass');
    }

    async validateConditions(context) {
        for (const condition of this.conditions) {
            const isValid = await condition.validate(context);
            if (!isValid) {
                throw new Error(`Task condition failed: ${condition.name}`);
            }
        }
    }

    async checkDependencies(context) {
        for (const dependency of this.dependencies) {
            const dependencyMet = await dependency.check(context);
            if (!dependencyMet) {
                throw new Error(`Task dependency not met: ${dependency.name}`);
            }
        }
    }

    validate() {
        // Basic validation
        if (!this.id || !this.name) {
            return false;
        }
        
        return true;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            timeout: this.timeout,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            dependencies: this.dependencies.length,
            conditions: this.conditions.length,
            lastExecution: this.lastExecution,
            executionCount: this.executionHistory.length,
            createdAt: this.createdAt
        };
    }

    getExecutionHistory(limit = 10) {
        return this.executionHistory.slice(-limit);
    }

    reset() {
        this.status = 'idle';
        this.lastExecution = null;
        this.retryCount = this.config.retry || 3;
    }

    clone() {
        const cloned = new Task(this.id, this.name, this.description, this.config);
        cloned.dependencies = [...this.dependencies];
        cloned.conditions = [...this.conditions];
        return cloned;
    }
}

module.exports = Task;
