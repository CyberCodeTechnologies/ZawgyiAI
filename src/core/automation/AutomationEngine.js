const EventEmitter = require('events');

class AutomationEngine extends EventEmitter {
    constructor() {
        super();
        this.workflows = new Map();
        this.scheduler = null;
        this.executor = null;
        this.monitoring = null;
        this.metrics = {
            totalWorkflows: 0,
            activeWorkflows: 0,
            totalExecutions: 0,
            successRate: 0,
            averageDuration: 0
        };
        this.isRunning = false;
    }

    setScheduler(scheduler) {
        this.scheduler = scheduler;
        this.scheduler.on('workflow:scheduled', (data) => this.emit('workflow:scheduled', data));
        this.scheduler.on('workflow:executed', (data) => this.emit('workflow:executed', data));
        this.scheduler.on('workflow:failed', (data) => this.emit('workflow:failed', data));
    }

    setExecutor(executor) {
        this.executor = executor;
        this.executor.on('task:started', (data) => this.emit('task:started', data));
        this.executor.on('task:completed', (data) => this.emit('task:completed', data));
        this.executor.on('task:failed', (data) => this.emit('task:failed', data));
    }

    setMonitoring(monitoring) {
        this.monitoring = monitoring;
    }

    registerWorkflow(workflow) {
        if (!workflow.id) {
            throw new Error('Workflow must have an id');
        }

        this.workflows.set(workflow.id, workflow);
        this.metrics.totalWorkflows = this.workflows.size;
        
        // Set up workflow event listeners
        workflow.on('started', (data) => this.emit('workflow:started', data));
        workflow.on('completed', (data) => this.emit('workflow:completed', data));
        workflow.on('failed', (data) => this.emit('workflow:failed', data));
        workflow.on('step:completed', (data) => this.emit('step:completed', data));
        workflow.on('step:failed', (data) => this.emit('step:failed', data));

        // Schedule workflow if scheduler is available
        if (this.scheduler && workflow.schedule) {
            this.scheduler.schedule(workflow);
        }

        this.emit('workflow:registered', { workflow });
        return workflow;
    }

    unregisterWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            return false;
        }

        // Unschedule workflow if scheduler is available
        if (this.scheduler) {
            this.scheduler.unschedule(workflowId);
        }

        this.workflows.delete(workflowId);
        this.metrics.totalWorkflows = this.workflows.size;
        
        this.emit('workflow:unregistered', { workflow });
        return true;
    }

    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }

    getAllWorkflows() {
        return Array.from(this.workflows.values());
    }

    getWorkflowsByType(type) {
        return Array.from(this.workflows.values()).filter(wf => wf.type === type);
    }

    async executeWorkflow(workflowId, params = {}) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        const startTime = Date.now();
        this.metrics.activeWorkflows++;

        try {
            const context = new WorkflowContext(params);
            const result = await workflow.execute(context);
            const duration = Date.now() - startTime;

            this.updateMetrics(true, duration);
            
            if (this.monitoring) {
                this.monitoring.recordExecution(workflowId, result);
            }

            this.emit('workflow:executed', { workflow, result, duration });
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateMetrics(false, duration);

            if (this.monitoring) {
                this.monitoring.recordExecution(workflowId, { error: error.message });
            }

            this.emit('workflow:failed', { workflow, error, duration });
            throw error;
        } finally {
            this.metrics.activeWorkflows--;
        }
    }

    async executeWorkflows(workflowIds, params = {}) {
        const promises = workflowIds.map(id => this.executeWorkflow(id, params));
        return await Promise.all(promises);
    }

    scheduleWorkflow(workflowId, schedule) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        if (!this.scheduler) {
            throw new Error('Scheduler not available');
        }

        workflow.schedule = schedule;
        return this.scheduler.schedule(workflow);
    }

    unscheduleWorkflow(workflowId) {
        if (!this.scheduler) {
            return false;
        }

        const workflow = this.getWorkflow(workflowId);
        if (workflow) {
            workflow.schedule = null;
            return this.scheduler.unschedule(workflowId);
        }

        return false;
    }

    getWorkflowStatus(workflowId) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            return null;
        }

        const status = {
            id: workflow.id,
            name: workflow.name,
            status: workflow.status,
            lastExecution: workflow.lastExecution,
            nextExecution: null,
            schedule: workflow.schedule
        };

        if (this.scheduler) {
            status.nextExecution = this.scheduler.getNextExecution(workflowId);
        }

        return status;
    }

    getAllWorkflowStatuses() {
        return Array.from(this.workflows.values()).map(wf => this.getWorkflowStatus(wf.id));
    }

    updateMetrics(success, duration) {
        this.metrics.totalExecutions++;
        this.metrics.averageDuration = 
            (this.metrics.averageDuration * (this.metrics.totalExecutions - 1) + duration) / this.metrics.totalExecutions;
        
        if (success) {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.totalExecutions - 1) + 1) / this.metrics.totalExecutions;
        } else {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.totalExecutions - 1)) / this.metrics.totalExecutions;
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            isRunning: this.isRunning,
            activeWorkflows: this.metrics.activeWorkflows
        };
    }

    async start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.emit('engine:started');
        
        // Start scheduler if available
        if (this.scheduler) {
            await this.scheduler.start();
        }

        // Start executor if available
        if (this.executor) {
            await this.executor.start();
        }
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.emit('engine:stopping');

        // Stop scheduler if available
        if (this.scheduler) {
            await this.scheduler.stop();
        }

        // Stop executor if available
        if (this.executor) {
            await this.executor.stop();
        }

        this.emit('engine:stopped');
    }

    async shutdown() {
        await this.stop();
        
        // Clear all workflows
        this.workflows.clear();
        this.removeAllListeners();
        
        this.emit('engine:shutdown');
    }
}

class WorkflowContext {
    constructor(params = {}) {
        this.params = params;
        this.data = new Map();
        this.startTime = Date.now();
        this.duration = 0;
        this.status = 'running';
        this.errors = [];
        this.warnings = [];
    }

    set(key, value) {
        this.data.set(key, value);
    }

    get(key) {
        return this.data.get(key);
    }

    has(key) {
        return this.data.has(key);
    }

    delete(key) {
        return this.data.delete(key);
    }

    getAll() {
        return Object.fromEntries(this.data);
    }

    addError(error) {
        this.errors.push({
            message: error.message || error,
            timestamp: new Date().toISOString(),
            stack: error.stack
        });
    }

    addWarning(warning) {
        this.warnings.push({
            message: warning,
            timestamp: new Date().toISOString()
        });
    }

    finalize() {
        this.duration = Date.now() - this.startTime;
        this.status = this.errors.length > 0 ? 'failed' : 'completed';
    }
}

module.exports = { AutomationEngine, WorkflowContext };
