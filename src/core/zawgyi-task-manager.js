/**
 * Zawgyi Task Manager & Workflow Engine
 * Manages autonomous tasks, scheduled jobs, and complex multi-step workflows.
 */
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ZawgyiTaskManager {
    constructor(core) {
        this.core = core;
        this.tasks = new Map();
        this.workflows = new Map();
        this.history = [];
        this.tasksDir = path.join(process.cwd(), 'data', 'tasks');
        
        this.initialize();
    }

    async initialize() {
        await fs.ensureDir(this.tasksDir);
        console.log('📝 Zawgyi Task Manager Initialized');
    }

    /**
     * Create and start a new autonomous task
     */
    async createTask(name, description, steps = [], metadata = {}) {
        const taskId = uuidv4();
        const task = {
            id: taskId,
            name,
            description,
            status: 'pending',
            progress: 0,
            currentStep: 0,
            steps: steps,
            results: [],
            metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.set(taskId, task);
        this.core.events.emit('log', { 
            type: 'log', 
            message: `🆕 Task Created: ${name} (${taskId.substring(0,8)})` 
        });

        // Automatically start the task if it has steps
        if (steps.length > 0) {
            this.executeTask(taskId);
        }

        return task;
    }

    /**
     * Execute a task step-by-step
     */
    async executeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status === 'running') return;

        task.status = 'running';
        task.updatedAt = new Date().toISOString();
        this.core.events.emit('task_update', task);

        try {
            for (let i = task.currentStep; i < task.steps.length; i++) {
                const step = task.steps[i];
                task.currentStep = i;
                task.progress = Math.round((i / task.steps.length) * 100);
                
                this.core.events.emit('log', { 
                    type: 'log', 
                    message: `⚡ Task [${task.name}]: Executing step ${i+1}/${task.steps.length}: ${step.action}` 
                });
                this.core.events.emit('task_update', task);

                // Execute the actual capability action
                try {
                    const result = await this.core.capabilityRegistry.execute(
                        step.capability, 
                        step.action, 
                        step.params || {}, 
                        'system'
                    );
                    task.results.push({ step: i, success: true, result });
                } catch (err) {
                    task.results.push({ step: i, success: false, error: err.message });
                    if (step.critical) throw err;
                }

                // Small delay between steps for realism
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            task.status = 'completed';
            task.progress = 100;
            this.core.events.emit('log', { 
                type: 'success', 
                message: `✅ Task Completed: ${task.name}` 
            });
        } catch (error) {
            task.status = 'failed';
            this.core.events.emit('log', { 
                type: 'error', 
                message: `❌ Task Failed: ${task.name} - ${error.message}` 
            });
        }

        task.updatedAt = new Date().toISOString();
        this.core.events.emit('task_update', task);
        this.saveTask(task);
    }

    async saveTask(task) {
        const filePath = path.join(this.tasksDir, `${task.id}.json`);
        await fs.writeJson(filePath, task, { spaces: 2 });
    }

    getTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    getTask(taskId) {
        return this.tasks.get(taskId);
    }
}

module.exports = ZawgyiTaskManager;
