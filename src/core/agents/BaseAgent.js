const EventEmitter = require('events');

class BaseAgent extends EventEmitter {
    constructor(id, type, config = {}) {
        super();
        this.id = id;
        this.type = type;
        this.config = config;
        this.status = 'idle';
        this.skills = [];
        this.memory = new Map();
        this.metrics = {
            tasksCompleted: 0,
            successRate: 0,
            averageDuration: 0,
            totalDuration: 0
        };
        this.createdAt = new Date();
        this.lastActivity = new Date();
    }

    async execute(task) {
        const startTime = Date.now();
        this.status = 'executing';
        this.lastActivity = new Date();
        
        this.emit('task:started', { agent: this, task });
        
        try {
            const result = await this.performTask(task);
            const duration = Date.now() - startTime;
            this.updateMetrics(true, duration);
            
            this.status = 'idle';
            this.emit('task:completed', { agent: this, task, result, duration });
            
            return {
                success: true,
                result: result,
                duration: duration,
                agent: this.id
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateMetrics(false, duration);
            
            this.status = 'error';
            this.emit('task:failed', { agent: this, task, error, duration });
            
            return {
                success: false,
                error: error.message,
                duration: duration,
                agent: this.id
            };
        }
    }

    async performTask(task) {
        // This should be implemented by subclasses
        throw new Error('performTask must be implemented by subclass');
    }

    async learn(skill) {
        this.skills.push(skill);
        await this.updateMemory('skill_' + skill.id, skill);
        this.emit('skill:learned', { agent: this, skill });
    }

    async collaborate(agents, task) {
        const collaboration = {
            id: `collab_${Date.now()}`,
            agents: [this.id, ...agents.map(a => a.id)],
            task: task,
            status: 'initializing'
        };

        this.emit('collaboration:started', { agent: this, collaboration });

        try {
            // Implement collaboration logic
            const results = await this.performCollaboration(agents, task);
            collaboration.status = 'completed';
            collaboration.results = results;
            
            this.emit('collaboration:completed', { agent: this, collaboration, results });
            return results;
        } catch (error) {
            collaboration.status = 'failed';
            collaboration.error = error.message;
            
            this.emit('collaboration:failed', { agent: this, collaboration, error });
            throw error;
        }
    }

    async performCollaboration(agents, task) {
        // Default collaboration implementation
        const results = [];
        
        // Execute task on this agent
        const myResult = await this.execute(task);
        results.push(myResult);
        
        // Execute task on other agents
        for (const agent of agents) {
            const result = await agent.execute(task);
            results.push(result);
        }
        
        return results;
    }

    updateMetrics(success, duration) {
        this.metrics.tasksCompleted++;
        this.metrics.totalDuration += duration;
        this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.tasksCompleted;
        
        if (success) {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.tasksCompleted - 1) + 1) / this.metrics.tasksCompleted;
        } else {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.tasksCompleted - 1)) / this.metrics.tasksCompleted;
        }
    }

    updateMemory(key, value) {
        this.memory.set(key, {
            value: value,
            timestamp: new Date().toISOString(),
            accessCount: 0
        });
        this.emit('memory:updated', { agent: this, key, value });
    }

    getMemory(key) {
        const item = this.memory.get(key);
        if (item) {
            item.accessCount++;
            return item.value;
        }
        return null;
    }

    getAllMemory() {
        return Array.from(this.memory.entries()).map(([key, item]) => ({
            key,
            ...item
        }));
    }

    clearMemory() {
        this.memory.clear();
        this.emit('memory:cleared', { agent: this });
    }

    getStatus() {
        return {
            id: this.id,
            type: this.type,
            status: this.status,
            skills: this.skills.length,
            memorySize: this.memory.size,
            metrics: this.metrics,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }

    async shutdown() {
        this.status = 'shutting_down';
        this.emit('agent:shutdown', { agent: this });
        
        // Cleanup resources
        this.removeAllListeners();
        this.memory.clear();
        this.skills = [];
        
        this.status = 'shutdown';
    }
}

module.exports = BaseAgent;
