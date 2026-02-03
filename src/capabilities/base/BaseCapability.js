const { ZawgyiCapability } = require('../../core/zawgyi-capability');
const { Workflow } = require('../../workflows/base/Workflow');
const path = require('path');
const fs = require('fs-extra');

class BaseCapability extends ZawgyiCapability {
    constructor(name, description, gateway = null) {
        super(name, description);
        this.gateway = gateway;
        this.workflows = new Map();
        this.actions = new Map();
        this.config = this.loadConfig();
        this.automationEngine = null;
        this.status = 'initialized';
        this.metrics = {
            actionsExecuted: 0,
            workflowsExecuted: 0,
            successRate: 0,
            averageDuration: 0
        };
        
        this.setupWorkflows();
        this.setupActions();
    }

    loadConfig() {
        // Load capability-specific configuration
        const configPath = path.join(__dirname, '../../config/capabilities', `${this.name.toLowerCase()}.config.js`);
        if (fs.existsSync(configPath)) {
            try {
                return require(configPath);
            } catch (error) {
                console.warn(`Failed to load config for ${this.name}:`, error.message);
            }
        }
        return {};
    }

    setupWorkflows() {
        // Register workflows from configuration
        const workflows = this.config.workflows || [];
        workflows.forEach(workflowConfig => {
            const workflow = this.createWorkflow(workflowConfig);
            this.workflows.set(workflow.id, workflow);
        });
    }

    setupActions() {
        // Register actions from configuration
        const actions = this.config.actions || [];
        actions.forEach(actionConfig => {
            const action = this.createAction(actionConfig);
            this.actions.set(action.name, action);
        });
    }

    createWorkflow(workflowConfig) {
        const workflow = new Workflow(
            workflowConfig.id,
            workflowConfig.name,
            workflowConfig.description,
            workflowConfig.config || {}
        );
        
        // Add steps from configuration
        if (workflowConfig.steps) {
            workflowConfig.steps.forEach(stepConfig => {
                const step = this.createStep(stepConfig);
                workflow.addStep(step);
            });
        }
        
        // Add conditions from configuration
        if (workflowConfig.conditions) {
            workflowConfig.conditions.forEach(conditionConfig => {
                const condition = this.createCondition(conditionConfig);
                workflow.addCondition(condition);
            });
        }
        
        // Add triggers from configuration
        if (workflowConfig.triggers) {
            workflowConfig.triggers.forEach(triggerConfig => {
                const trigger = this.createTrigger(triggerConfig);
                workflow.addTrigger(trigger);
            });
        }
        
        return workflow;
    }

    createStep(stepConfig) {
        const { Step } = require('../../workflows/base');
        const action = this.actions.get(stepConfig.action);
        
        if (!action) {
            throw new Error(`Action '${stepConfig.action}' not found for step '${stepConfig.name}'`);
        }
        
        const step = new Step(stepConfig.name, action, stepConfig.config || {});
        
        // Add dependencies
        if (stepConfig.dependencies) {
            stepConfig.dependencies.forEach(depConfig => {
                const dependency = this.createDependency(depConfig);
                step.addDependency(dependency);
            });
        }
        
        // Add conditions
        if (stepConfig.conditions) {
            stepConfig.conditions.forEach(condConfig => {
                const condition = this.createCondition(condConfig);
                step.addCondition(condition);
            });
        }
        
        return step;
    }

    createAction(actionConfig) {
        // This should be implemented by subclasses
        throw new Error('createAction must be implemented by subclass');
    }

    createCondition(conditionConfig) {
        const { Condition } = require('../../workflows/base');
        return new Condition(conditionConfig.name, conditionConfig.check, conditionConfig.config || {});
    }

    createTrigger(triggerConfig) {
        const { Trigger } = require('../../workflows/base');
        return new Trigger(triggerConfig.type, triggerConfig.config || {});
    }

    createDependency(dependencyConfig) {
        const { Dependency } = require('../../workflows/base');
        return new Dependency(dependencyConfig.name, dependencyConfig.check, dependencyConfig.config || {});
    }

    addWorkflow(workflowId, workflow) {
        this.workflows.set(workflowId, workflow);
        
        if (this.automationEngine) {
            this.automationEngine.registerWorkflow(workflow);
        }
        
        return this;
    }

    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }

    getAllWorkflows() {
        return Array.from(this.workflows.values());
    }

    async executeWorkflow(workflowId, params = {}) {
        if (!this.automationEngine) {
            throw new Error('Automation engine not available');
        }
        
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }
        
        try {
            const result = await this.automationEngine.executeWorkflow(workflowId, params);
            this.updateMetrics(true, result.duration);
            return result;
        } catch (error) {
            this.updateMetrics(false, 0);
            throw error;
        }
    }

    setAutomationEngine(automationEngine) {
        this.automationEngine = automationEngine;
        
        // Register all workflows with the automation engine
        this.workflows.forEach(workflow => {
            automationEngine.registerWorkflow(workflow);
        });
    }

    addAction(actionName, action) {
        this.actions.set(actionName, action);
        return this;
    }

    getAction(actionName) {
        return this.actions.get(actionName);
    }

    getAllActions() {
        return Array.from(this.actions.values());
    }

    async executeAction(actionName, params, userId) {
        const action = this.getAction(actionName);
        if (!action) {
            throw new Error(`Action '${actionName}' not found`);
        }
        
        const startTime = Date.now();
        
        try {
            const context = {
                gateway: this.gateway,
                capability: this,
                userId: userId,
                config: this.config,
                params: params
            };
            
            const result = await action.execute(params, context);
            const duration = Date.now() - startTime;
            
            this.updateMetrics(true, duration);
            return result;
        } catch (error) {
            this.updateMetrics(false, Date.now() - startTime);
            throw error;
        }
    }

    updateMetrics(success, duration) {
        this.metrics.actionsExecuted++;
        
        if (success) {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.actionsExecuted - 1) + 1) / this.metrics.actionsExecuted;
        } else {
            this.metrics.successRate = 
                (this.metrics.successRate * (this.metrics.actionsExecuted - 1)) / this.metrics.actionsExecuted;
        }
        
        this.metrics.averageDuration = 
            (this.metrics.averageDuration * (this.metrics.actionsExecuted - 1) + duration) / this.metrics.actionsExecuted;
    }

    getMetrics() {
        return {
            ...this.metrics,
            workflowsCount: this.workflows.size,
            actionsCount: this.actions.size,
            status: this.status
        };
    }

    getStatus() {
        return {
            name: this.name,
            description: this.description,
            status: this.status,
            workflows: this.workflows.size,
            actions: this.actions.size,
            metrics: this.metrics,
            config: this.config
        };
    }

    async initialize() {
        this.status = 'initializing';
        
        // Initialize workflows
        for (const workflow of this.workflows.values()) {
            if (typeof workflow.initialize === 'function') {
                await workflow.initialize();
            }
        }
        
        // Initialize actions
        for (const action of this.actions.values()) {
            if (typeof action.initialize === 'function') {
                await action.initialize();
            }
        }
        
        this.status = 'ready';
    }

    async shutdown() {
        this.status = 'shutting_down';
        
        // Shutdown workflows
        for (const workflow of this.workflows.values()) {
            if (typeof workflow.shutdown === 'function') {
                await workflow.shutdown();
            }
        }
        
        // Shutdown actions
        for (const action of this.actions.values()) {
            if (typeof action.shutdown === 'function') {
                await action.shutdown();
            }
        }
        
        this.status = 'shutdown';
    }
}

module.exports = BaseCapability;
