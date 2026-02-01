class SkillManager {
    constructor() {
        this.skills = new Map();
    }

    register(name, skill) {
        if (!skill || typeof skill.execute !== 'function') {
            throw new Error(`Skill ${name} must have an execute method`);
        }
        
        this.skills.set(name, skill);
        console.log(`🔧 Registered skill: ${name}`);
    }

    get(name) {
        return this.skills.get(name);
    }

    list() {
        return Array.from(this.skills.keys());
    }

    has(name) {
        return this.skills.has(name);
    }

    unregister(name) {
        const removed = this.skills.delete(name);
        if (removed) {
            console.log(`🗑️  Unregistered skill: ${name}`);
        }
        return removed;
    }

    async executeSkill(skillName, action, parameters, userId) {
        const skill = this.get(skillName);
        if (!skill) {
            throw new Error(`Skill ${skillName} not found`);
        }

        if (typeof skill[action] !== 'function') {
            throw new Error(`Action ${action} not found in skill ${skillName}`);
        }

        return await skill[action](parameters, userId);
    }

    getSkillInfo(name) {
        const skill = this.get(name);
        if (!skill) {
            return null;
        }

        return {
            name,
            description: skill.description || 'No description available',
            actions: skill.actions || [],
            parameters: skill.parameters || {}
        };
    }

    getAllSkillsInfo() {
        return this.list().map(name => this.getSkillInfo(name));
    }
}

module.exports = SkillManager;
