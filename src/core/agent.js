// const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

class Agent {
    constructor(memory, skillManager) {
        this.memory = memory;
        this.skillManager = skillManager;
        // this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
        //     apiKey: process.env.OPENAI_API_KEY
        // }) : null;
    }

    async processMessage(userId, message, platform) {
        try {
            // Get user context from memory
            const userContext = await this.memory.getUserContext(userId);
            
            // Parse intent and extract entities
            const intent = await this.parseIntent(message, userContext);
            
            // Execute appropriate skill
            const response = await this.executeSkill(intent, userId, platform);
            
            // Update memory
            await this.memory.updateUserContext(userId, {
                lastMessage: message,
                lastResponse: response,
                timestamp: new Date().toISOString()
            });

            return response;
        } catch (error) {
            console.error('Agent processing error:', error);
            return 'Sorry, I encountered an error while processing your request.';
        }
    }

    async parseIntent(message, context) {
        // Fallback to basic pattern matching
        return this.fallbackIntentParsing(message);
    }

    fallbackIntentParsing(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('email') || lowerMessage.includes('mail')) {
            return {
                skill: 'email',
                action: 'read',
                parameters: {},
                missing_info: []
            };
        }
        
        if (lowerMessage.includes('calendar') || lowerMessage.includes('meeting') || lowerMessage.includes('event')) {
            return {
                skill: 'calendar',
                action: 'read',
                parameters: {},
                missing_info: []
            };
        }
        
        if (lowerMessage.includes('flight') || lowerMessage.includes('check in')) {
            return {
                skill: 'flight',
                action: 'status',
                parameters: {},
                missing_info: []
            };
        }
        
        if (lowerMessage.includes('inbox') || lowerMessage.includes('organize')) {
            return {
                skill: 'inbox',
                action: 'read',
                parameters: {},
                missing_info: []
            };
        }

        if (lowerMessage.includes('news') || lowerMessage.includes('headline') || lowerMessage.includes('tech')) {
            let action = 'get_news';
            if (lowerMessage.includes('tech')) action = 'get_tech_news';
            if (lowerMessage.includes('summary') || lowerMessage.includes('briefing')) action = 'get_daily_summary';
            
            return {
                skill: 'news',
                action: action,
                parameters: {},
                missing_info: []
            };
        }

        if (lowerMessage.includes('internet') || lowerMessage.includes('connection') || lowerMessage.includes('system') || lowerMessage.includes('speed')) {
            return {
                skill: 'network',
                action: 'check_connection',
                parameters: {},
                missing_info: []
            };
        }

        if (lowerMessage.includes('create universe') || lowerMessage.includes('add entity') || lowerMessage.includes('simulate') || lowerMessage.includes('calculate')) {
            let action = 'calculate';
            if (lowerMessage.includes('create universe')) action = 'create_universe';
            if (lowerMessage.includes('add entity') || lowerMessage.includes('create entity')) action = 'create_entity';
            if (lowerMessage.includes('simulate')) action = 'simulate';
            
            // Extract calculation expression if present
            let expression = message.replace(/calculate|solve/i, '').trim();

            return {
                skill: 'universe',
                action: action,
                parameters: { expression: expression, name: 'New Universe' }, // Simplistic param extraction
                missing_info: []
            };
        }
        
        // Default fallback to knowledge skill for general chat
        return {
            skill: 'knowledge',
            action: 'chat',
            parameters: { query: message },
            missing_info: []
        };
    }

    async executeSkill(intent, userId, platform) {
        const skill = this.skillManager.get(intent.skill);
        
        if (!skill) {
            return `I don't know how to ${intent.action} with ${intent.skill}. Available skills: ${this.skillManager.list().join(', ')}`;
        }

        if (intent.missing_info && intent.missing_info.length > 0) {
            return `I need some more information: ${intent.missing_info.join(', ')}`;
        }

        try {
            const result = await skill.execute(intent.action, intent.parameters, userId);
            return this.formatResponse(result, intent.skill);
        } catch (error) {
            console.error(`Skill execution error (${intent.skill}):`, error);
            return `Sorry, I couldn't ${intent.action} your ${intent.skill}. Error: ${error.message}`;
        }
    }

    formatResponse(result, skill) {
        if (typeof result === 'string') {
            return result;
        }
        
        if (result.success) {
            return `✅ ${result.message}`;
        } else {
            return `❌ ${result.error || 'Something went wrong'}`;
        }
    }
}

module.exports = Agent;
