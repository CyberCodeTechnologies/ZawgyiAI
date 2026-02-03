const EventEmitter = require('events');
const { WorkflowContext } = require('../../core/automation/AutomationEngine');

class Workflow extends EventEmitter {
    constructor(id, name, description, config = {}) {
        super();
        this.id = id;
        this.name = name;
        this.description = description;
        this.config = config;
        this.steps = [];
        this.dependencies = [];
        this.conditions = [];
        this.triggers = [];
        this.status = 'idle';
        this.lastExecution = null;
        this.executionHistory = [];
        this.schedule = null;
        this.timeout = config.timeout || 300000; // 5 minutes default
        this.retryCount = config.retry || 3;
        this.maxRetries = config.maxRetries || 3;
    }

    addStep(step) {
        this.steps.push(step);
        step.workflow = this;
        return this;
    }

    addDependency(dependency) {
        this.dependencies.push(dependency);
        return this;
    }

    addCondition(condition) {
        this.conditions.push(condition);
        return this;
    }

    addTrigger(trigger) {
        this.triggers.push(trigger);
        trigger.workflow = this;
        return this;
    }

    async execute(params = {}) {
        const context = new WorkflowContext(params);
        const startTime = Date.now();
        
        this.status = 'running';
        this.emit('started', { workflow: this, context });
        
        try {
            // Validate conditions
            await this.validateConditions(context);
            
            // Execute steps
            const results = [];
            for (let i = 0; i < this.steps.length; i++) {
                const step = this.steps[i];
                const stepResult = await this.executeStep(step, context, i);
                results.push(stepResult);
                
                // Emit step completion
                this.emit('step:completed', { workflow: this, step, result: stepResult, stepNumber: i });
            }
            
            context.finalize();
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: context.duration,
                status: context.status,
                results: results,
                context: context
            };
            
            this.executionHistory.push(this.lastExecution);
            
            // Keep only last 10 executions
            if (this.executionHistory.length > 10) {
                this.executionHistory = this.executionHistory.slice(-10);
            }
            
            this.status = context.status;
            
            if (context.status === 'completed') {
                this.emit('completed', { workflow: this, context, results });
                return {
                    success: true,
                    results: results,
                    duration: context.duration,
                    context: context
                };
            } else {
                this.emit('failed', { workflow: this, context, errors: context.errors });
                return {
                    success: false,
                    errors: context.errors,
                    warnings: context.warnings,
                    duration: context.duration,
                    context: context
                };
            }
        } catch (error) {
            context.addError(error);
            context.finalize();
            
            this.lastExecution = {
                timestamp: new Date().toISOString(),
                duration: context.duration,
                status: 'failed',
                error: error.message,
                context: context
            };
            
            this.executionHistory.push(this.lastExecution);
            this.status = 'failed';
            
            this.emit('failed', { workflow: this, context, error });
            
            return {
                success: false,
                error: error.message,
                duration: context.duration,
                context: context
            };
        }
    }

    async executeStep(step, context, stepNumber) {
        const stepStartTime = Date.now();
        
        try {
            // Check step dependencies
            await this.checkStepDependencies(step, context);
            
            // Execute step with timeout
            const result = await this.executeWithTimeout(step, context);
            
            const stepDuration = Date.now() - stepStartTime;
            
            return {
                stepNumber: stepNumber,
                stepName: step.name,
                success: true,
                result: result,
                duration: stepDuration
            };
        } catch (error) {
            const stepDuration = Date.now() - stepStartTime;
            
            // Retry logic
            if (step.retryCount > 0) {
                step.retryCount--;
                context.addWarning(`Retrying step ${step.name} (${step.retryCount} retries left)`);
                return await this.executeStep(step, context, stepNumber);
            }
            
            return {
                stepNumber: stepNumber,
                stepName: step.name,
                success: false,
                error: error.message,
                duration: stepDuration
            };
        }
    }

    async executeWithTimeout(step, context) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Step ${step.name} timed out after ${this.timeout}ms`));
            }, this.timeout);

            try {
                const result = await step.execute(context);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    async checkStepDependencies(step, context) {
        for (const dependency of step.dependencies) {
            const dependencyMet = await dependency.check(context);
            if (!dependencyMet) {
                throw new Error(`Step dependency not met: ${dependency.name}`);
            }
        }
    }

    async validateConditions(context) {
        for (const condition of this.conditions) {
            const isValid = await condition.validate(context);
            if (!isValid) {
                throw new Error(`Condition failed: ${condition.name}`);
            }
        }
    }

    validate(context) {
        // Basic validation
        if (!this.steps || this.steps.length === 0) {
            return false;
        }
        
        // Check if all steps are valid
        for (const step of this.steps) {
            if (!step.validate) {
                return false;
            }
        }
        
        return true;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            steps: this.steps.length,
            dependencies: this.dependencies.length,
            conditions: this.conditions.length,
            triggers: this.triggers.length,
            lastExecution: this.lastExecution,
            executionCount: this.executionHistory.length,
            schedule: this.schedule
        };
    }

    getExecutionHistory(limit = 10) {
        return this.executionHistory.slice(-limit);
    }

    reset() {
        this.status = 'idle';
        this.lastExecution = null;
        this.steps.forEach(step => {
            step.retryCount = this.retryCount;
        });
    }

    clone() {
        const cloned = new Workflow(this.id, this.name, this.description, this.config);
        cloned.steps = [...this.steps];
        cloned.dependencies = [...this.dependencies];
        cloned.conditions = [...this.conditions];
        cloned.triggers = [...this.triggers];
        return cloned;
    }
}

module.exports = Workflow;
