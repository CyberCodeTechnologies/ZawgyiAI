const EventEmitter = require('events');
const BaseAgent = require('./BaseAgent');

class AgentManager extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.agentTypes = new Map();
        this.pools = new Map();
        this.metrics = {
            totalAgents: 0,
            activeAgents: 0,
            totalTasks: 0,
            successRate: 0
        };
        this.agentCounter = 0;
    }

    registerAgentType(type, agentClass) {
        this.agentTypes.set(type, agentClass);
        this.emit('type:registered', { type, agentClass });
    }

    createAgent(type, config = {}) {
        const AgentClass = this.agentTypes.get(type);
        if (!AgentClass) {
            throw new Error(`Agent type '${type}' not registered`);
        }

        const agentId = config.id || `agent_${++this.agentCounter}`;
        const agent = new AgentClass(agentId, type, config);
        
        // Set up event listeners
        agent.on('task:started', (data) => this.emit('agent:task:started', data));
        agent.on('task:completed', (data) => this.emit('agent:task:completed', data));
        agent.on('task:failed', (data) => this.emit('agent:task:failed', data));
        agent.on('skill:learned', (data) => this.emit('agent:skill:learned', data));
        agent.on('collaboration:started', (data) => this.emit('agent:collaboration:started', data));
        agent.on('collaboration:completed', (data) => this.emit('agent:collaboration:completed', data));
        agent.on('collaboration:failed', (data) => this.emit('agent:collaboration:failed', data));

        this.agents.set(agentId, agent);
        this.updateMetrics();
        
        this.emit('agent:created', { agent });
        return agent;
    }

    getAgent(id) {
        return this.agents.get(id);
    }

    getAgentsByType(type) {
        return Array.from(this.agents.values()).filter(agent => agent.type === type);
    }

    getActiveAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'executing');
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    async executeTask(agentId, task) {
        const agent = this.getAgent(agentId);
        if (!agent) {
            throw new Error(`Agent '${agentId}' not found`);
        }

        try {
            const result = await agent.execute(task);
            this.updateMetrics();
            return result;
        } catch (error) {
            this.updateMetrics();
            throw error;
        }
    }

    async executeTaskOnType(type, task) {
        const agents = this.getAgentsByType(type);
        if (agents.length === 0) {
            throw new Error(`No agents of type '${type}' found`);
        }

        // Use the first available agent
        const agent = agents.find(a => a.status === 'idle') || agents[0];
        return await this.executeTask(agent.id, task);
    }

    async executeTaskOnAll(type, task) {
        const agents = this.getAgentsByType(type);
        if (agents.length === 0) {
            throw new Error(`No agents of type '${type}' found`);
        }

        const promises = agents.map(agent => this.executeTask(agent.id, task));
        return await Promise.all(promises);
    }

    async collaborate(agentIds, task) {
        const agents = agentIds.map(id => this.getAgent(id)).filter(Boolean);
        if (agents.length === 0) {
            throw new Error('No valid agents found for collaboration');
        }

        const leadAgent = agents[0];
        const otherAgents = agents.slice(1);
        
        return await leadAgent.collaborate(otherAgents, task);
    }

    async collaborateByType(type, task) {
        const agents = this.getAgentsByType(type);
        if (agents.length < 2) {
            throw new Error(`Need at least 2 agents of type '${type}' for collaboration`);
        }

        return await this.collaborate(agents.map(a => a.id), task);
    }

    destroyAgent(id) {
        const agent = this.getAgent(id);
        if (!agent) {
            return false;
        }

        agent.shutdown();
        this.agents.delete(id);
        this.updateMetrics();
        
        this.emit('agent:destroyed', { agent });
        return true;
    }

    destroyAllAgents() {
        const agentIds = Array.from(this.agents.keys());
        agentIds.forEach(id => this.destroyAgent(id));
    }

    createPool(type, size = 5, config = {}) {
        const pool = [];
        
        for (let i = 0; i < size; i++) {
            const agentConfig = { ...config, id: `${type}_pool_${i}` };
            const agent = this.createAgent(type, agentConfig);
            pool.push(agent);
        }

        this.pools.set(type, {
            agents: pool,
            size: size,
            currentIndex: 0
        });

        this.emit('pool:created', { type, size, pool });
        return pool;
    }

    getAgentFromPool(type) {
        const pool = this.pools.get(type);
        if (!pool) {
            throw new Error(`No pool found for type '${type}'`);
        }

        // Round-robin selection
        const agent = pool.agents[pool.currentIndex];
        pool.currentIndex = (pool.currentIndex + 1) % pool.size;
        
        return agent;
    }

    async executeTaskFromPool(type, task) {
        const agent = this.getAgentFromPool(type);
        return await this.executeTask(agent.id, task);
    }

    updateMetrics() {
        this.metrics.totalAgents = this.agents.size;
        this.metrics.activeAgents = this.getActiveAgents().length;
        
        // Calculate overall success rate
        const allAgents = this.getAllAgents();
        if (allAgents.length > 0) {
            const totalSuccessRate = allAgents.reduce((sum, agent) => sum + agent.metrics.successRate, 0);
            this.metrics.successRate = totalSuccessRate / allAgents.length;
        }
    }

    getMetrics() {
        this.updateMetrics();
        return {
            ...this.metrics,
            agentTypes: Array.from(this.agentTypes.keys()),
            pools: Array.from(this.pools.entries()).map(([type, pool]) => ({
                type,
                size: pool.size,
                agents: pool.agents.length
            }))
        };
    }

    getAgentStatus(id) {
        const agent = this.getAgent(id);
        if (!agent) {
            return null;
        }
        return agent.getStatus();
    }

    getAllAgentStatuses() {
        return Array.from(this.agents.values()).map(agent => agent.getStatus());
    }

    async shutdown() {
        this.emit('manager:shutdown', { agentCount: this.agents.size });
        
        // Shutdown all agents
        const shutdownPromises = Array.from(this.agents.values()).map(agent => agent.shutdown());
        await Promise.all(shutdownPromises);
        
        // Clear all collections
        this.agents.clear();
        this.agentTypes.clear();
        this.pools.clear();
        
        this.removeAllListeners();
        this.emit('manager:shutdown:complete');
    }
}

module.exports = AgentManager;
