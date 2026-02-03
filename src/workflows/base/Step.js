class Step {
    constructor(name, action, config = {}) {
        this.name = name;
        this.action = action;
        this.config = config;
        this.timeout = config.timeout || 30000;
        this.retryCount = config.retry || 3;
        this.maxRetries = config.maxRetries || 3;
        this.dependencies = [];
        this.conditions = [];
        this.workflow = null;
        this.stepNumber = -1;
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
        
        try {
            // Validate conditions
            await this.validateConditions(context);
            
            // Execute action
            const result = await this.action.execute(context);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                result: result,
                duration: duration,
                stepName: this.name
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            return {
                success: false,
                error: error.message,
                duration: duration,
                stepName: this.name
            };
        }
    }

    async validateConditions(context) {
        for (const condition of this.conditions) {
            const isValid = await condition.validate(context);
            if (!isValid) {
                throw new Error(`Step condition failed: ${condition.name}`);
            }
        }
    }

    validate() {
        // Basic validation
        if (!this.name || !this.action) {
            return false;
        }
        
        if (typeof this.action.execute !== 'function') {
            return false;
        }
        
        return true;
    }

    getStatus() {
        return {
            name: this.name,
            stepNumber: this.stepNumber,
            timeout: this.timeout,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            dependencies: this.dependencies.length,
            conditions: this.conditions.length,
            hasAction: !!this.action
        };
    }

    clone() {
        const cloned = new Step(this.name, this.action, this.config);
        cloned.dependencies = [...this.dependencies];
        cloned.conditions = [...this.conditions];
        return cloned;
    }
}

module.exports = Step;
