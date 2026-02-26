/**
 * Zawgyi Universal Persona Manager
 * Manages specialized roles and multidisciplinary mastery for ZawgyiAI.
 * Supports roles like Programmer, Designer, Artist, Golfer, Singer, etc.
 */

class ZawgyiPersonaManager {
    constructor(core) {
        this.core = core;
        this.personas = new Map();
        this.activePersonas = new Map(); // userId -> personaId
        
        this.initializePersonas();
    }

    initializePersonas() {
        const personas = [
            {
                id: 'programmer',
                name: 'Lead Architect',
                description: 'Expert in system design, coding, and technical problem-solving.',
                traits: ['logical', 'precise', 'efficient'],
                expertise: ['Node.js', 'React', 'Python', 'Cloud Systems']
            },
            {
                id: 'designer',
                name: 'Creative Director',
                description: 'Visionary in UI/UX, branding, and visual communication.',
                traits: ['aesthetic', 'user-centric', 'innovative'],
                expertise: ['Typography', 'Color Theory', 'Interaction Design']
            },
            {
                id: 'golfer',
                name: 'Pro Golfer',
                description: 'Expert in swing mechanics, course strategy, and mental game.',
                traits: ['focused', 'disciplined', 'strategic'],
                expertise: ['Swing Analysis', 'Course Management', 'PGA Standards']
            },
            {
                id: 'artist',
                name: 'Master Painter',
                description: 'Specialist in classical and digital art techniques.',
                traits: ['expressive', 'detailed', 'visionary'],
                expertise: ['Oil Painting', 'Digital Art', 'Art History']
            },
            {
                id: 'singer',
                name: 'Vocal Virtuoso',
                description: 'Master of vocal performance, theory, and stage presence.',
                traits: ['melodic', 'passionate', 'rhythmic'],
                expertise: ['Vocal Range', 'Music Theory', 'Performance']
            }
        ];

        personas.forEach(p => this.personas.set(p.id, p));
        console.log('🎭 Zawgyi Persona Manager Online - All Roles Initialized');
    }

    getPersona(id) {
        return this.personas.get(id);
    }

    listPersonas() {
        return Array.from(this.personas.values());
    }

    setPersonaForUser(userId, personaId) {
        if (this.personas.has(personaId)) {
            this.activePersonas.set(userId, personaId);
            this.core.events.emit('log', { 
                type: 'success', 
                message: `🎭 Role Shift: User ${userId} linked to ${this.personas.get(personaId).name}` 
            });
            return true;
        }
        return false;
    }

    getPersonaForUser(userId) {
        const personaId = this.activePersonas.get(userId) || 'programmer'; // Default
        return this.personas.get(personaId);
    }
}

module.exports = ZawgyiPersonaManager;
