const { create, all } = require('mathjs');

class UniverseSkill {
    constructor() {
        this.name = 'universe';
        this.description = 'Manages the digital universe, simulation, and scientific calculations';
        this.math = create(all);
        this.entities = new Map(); // Store simulated entities
        this.universes = new Map(); // Store parallel universes
        
        // Initialize a default universe
        this.createUniverse('Prime');
    }

    async execute(intent, params) {
        console.log(`🌌 UniverseSkill executing intent: ${intent}`);

        switch (intent) {
            case 'create_universe':
                return this.createUniverse(params.name);
            
            case 'create_entity':
                return this.createEntity(params.universe || 'Prime', params.name, params.type, params.properties);
            
            case 'list_entities':
                return this.listEntities(params.universe || 'Prime');

            case 'calculate':
            case 'solve':
                return this.calculate(params.expression);

            case 'simulate':
                return this.simulate(params.universe || 'Prime', params.steps || 1);

            default:
                return { 
                    success: false, 
                    message: `UniverseSkill doesn't handle intent: ${intent}` 
                };
        }
    }

    createUniverse(name) {
        if (!name) name = `Universe_${this.universes.size + 1}`;
        
        if (this.universes.has(name)) {
            return { success: false, message: `Universe '${name}' already exists.` };
        }

        this.universes.set(name, {
            name: name,
            created_at: new Date(),
            physics_constants: {
                gravity: 9.81,
                light_speed: 299792458
            },
            entities: []
        });

        return { 
            success: true, 
            message: `🌌 Digital Universe '${name}' created successfully. Ready for creation.` 
        };
    }

    createEntity(universeName, name, type, properties = {}) {
        const universe = this.universes.get(universeName);
        if (!universe) {
            return { success: false, message: `Universe '${universeName}' not found.` };
        }

        const entity = {
            id: Date.now().toString(36),
            name: name || `Entity_${universe.entities.length + 1}`,
            type: type || 'object',
            properties: properties,
            status: 'active'
        };

        universe.entities.push(entity);
        return {
            success: true,
            message: `✨ Created '${entity.name}' (${entity.type}) in universe '${universeName}'.`,
            data: entity
        };
    }

    listEntities(universeName) {
        const universe = this.universes.get(universeName);
        if (!universe) {
            return { success: false, message: `Universe '${universeName}' not found.` };
        }

        if (universe.entities.length === 0) {
            return { success: true, message: `Universe '${universeName}' is currently empty.` };
        }

        const list = universe.entities.map(e => `- ${e.name} (${e.type})`).join('\n');
        return {
            success: true,
            message: `Entities in '${universeName}':\n${list}`
        };
    }

    calculate(expression) {
        if (!expression) {
            return { success: false, error: 'No mathematical expression provided.' };
        }

        try {
            const result = this.math.evaluate(expression);
            return {
                success: true,
                message: `🧮 Result: ${result}`,
                data: result
            };
        } catch (error) {
            return { success: false, error: `Calculation failed: ${error.message}` };
        }
    }

    simulate(universeName, steps) {
        // Placeholder for simulation logic
        // In a real implementation, this would update entity states based on physics rules
        return {
            success: true,
            message: `🔄 Simulated ${steps} step(s) for universe '${universeName}'. (Simulation logic is currently basic)`
        };
    }
}

module.exports = UniverseSkill;
