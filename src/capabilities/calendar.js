const { ZawgyiCapability } = require('../core/zawgyi-capability');

class CalendarCapability extends ZawgyiCapability {
    constructor() {
        super('calendar', 'Smart calendar management and scheduling');
        
        this.events = new Map();
        this.setupActions();
    }

    setupActions() {
        this.addAction('create', this.createEvent.bind(this), {
            description: 'Create a calendar event',
            parameters: ['title', 'start', 'end', 'description', 'attendees']
        });

        this.addAction('read', this.readEvents.bind(this), {
            description: 'Read calendar events',
            parameters: ['start_date', 'end_date', 'limit']
        });

        this.addAction('update', this.updateEvent.bind(this), {
            description: 'Update an existing event',
            parameters: ['event_id', 'title', 'start', 'end', 'description']
        });

        this.addAction('delete', this.deleteEvent.bind(this), {
            description: 'Delete a calendar event',
            parameters: ['event_id']
        });
    }

    async createEvent(params, userId) {
        const { title, start, end, description, attendees } = params;
        
        if (!title || !start) {
            throw new Error('Missing required fields: title, start');
        }

        const eventId = `event_${Date.now()}`;
        const event = {
            id: eventId,
            title,
            start: start || this.getDefaultStartTime(),
            end: end || this.getDefaultEndTime(start),
            description: description || '',
            attendees: attendees || [],
            created_by: userId,
            created_at: new Date().toISOString()
        };

        this.events.set(eventId, event);

        return {
            message: `Event "${title}" created successfully`,
            event,
            timestamp: new Date().toISOString()
        };
    }

    async readEvents(params, userId) {
        const { start_date, end_date, limit = 10 } = params;
        
        const now = new Date();
        const startDate = start_date ? new Date(start_date) : now;
        const endDate = end_date ? new Date(end_date) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const events = Array.from(this.events.values())
            .filter(event => {
                const eventDate = new Date(event.start);
                return eventDate >= startDate && eventDate <= endDate;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, limit);

        return {
            message: `Found ${events.length} events`,
            events,
            date_range: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            timestamp: new Date().toISOString()
        };
    }

    async updateEvent(params, userId) {
        const { event_id, title, start, end, description } = params;
        
        if (!event_id) {
            throw new Error('Missing required field: event_id');
        }

        const event = this.events.get(event_id);
        if (!event) {
            throw new Error(`Event ${event_id} not found`);
        }

        // Update event properties
        if (title) event.title = title;
        if (start) event.start = start;
        if (end) event.end = end;
        if (description !== undefined) event.description = description;
        
        event.updated_at = new Date().toISOString();
        event.updated_by = userId;

        this.events.set(event_id, event);

        return {
            message: `Event ${event_id} updated successfully`,
            event,
            timestamp: new Date().toISOString()
        };
    }

    async deleteEvent(params, userId) {
        const { event_id } = params;
        
        if (!event_id) {
            throw new Error('Missing required field: event_id');
        }

        const event = this.events.get(event_id);
        if (!event) {
            throw new Error(`Event ${event_id} not found`);
        }

        this.events.delete(event_id);

        return {
            message: `Event "${event.title}" deleted successfully`,
            deleted_event: event,
            timestamp: new Date().toISOString()
        };
    }

    getDefaultStartTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString();
    }

    getDefaultEndTime(startTime) {
        const start = new Date(startTime);
        start.setHours(start.getHours() + 1);
        return start.toISOString();
    }

    // Helper method to format events for display
    formatEvent(event) {
        return `📅 ${event.title}\n🕐 ${new Date(event.start).toLocaleString()}\n📍 ${event.description || 'No description'}`;
    }
}

module.exports = CalendarCapability;
