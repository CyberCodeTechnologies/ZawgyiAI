const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');

class CalendarSkill {
    constructor() {
        this.description = 'Manage calendar events - create, read, update, and delete';
        this.actions = ['create', 'read', 'update', 'delete', 'list'];
        this.parameters = {
            create: ['title', 'start', 'end', 'description', 'attendees'],
            read: ['event_id'],
            update: ['event_id', 'title', 'start', 'end', 'description'],
            delete: ['event_id'],
            list: ['start_date', 'end_date', 'limit']
        };
        
        this.calendar = null;
        this.auth = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            const credentials = {
                client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
                client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
            };

            if (credentials.client_id && credentials.client_secret) {
                this.auth = new google.auth.OAuth2(
                    credentials.client_id,
                    credentials.client_secret,
                    credentials.redirect_uri
                );

                this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            }
        } catch (error) {
            console.error('Calendar auth initialization error:', error);
        }
    }

    async execute(action, parameters, userId) {
        switch (action) {
            case 'create':
                return await this.createEvent(parameters, userId);
            case 'read':
                return await this.readEvent(parameters, userId);
            case 'update':
                return await this.updateEvent(parameters, userId);
            case 'delete':
                return await this.deleteEvent(parameters, userId);
            case 'list':
                return await this.listEvents(parameters, userId);
            default:
                return { success: false, error: `Unknown action: ${action}` };
        }
    }

    async createEvent(params, userId) {
        if (!this.calendar) {
            return { success: false, error: 'Google Calendar not configured. Check .env file.' };
        }
        const { title, start, end, description, attendees } = params;
        
        if (!title || !start) {
            return { success: false, error: 'Missing required fields: title, start' };
        }

        try {
            const event = {
                summary: title,
                description: description || '',
                start: {
                    dateTime: start,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: end || this.calculateEndTime(start),
                    timeZone: 'UTC'
                },
                attendees: attendees ? attendees.map(email => ({ email })) : []
            };

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            return {
                success: true,
                message: `Event "${title}" created successfully`,
                eventId: response.data.id,
                event: response.data
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async readEvent(params, userId) {
        if (!this.calendar) {
            return { success: false, error: 'Google Calendar not configured. Check .env file.' };
        }
        const { event_id } = params;
        
        if (!event_id) {
            return { success: false, error: 'Missing required field: event_id' };
        }

        try {
            const response = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: event_id
            });

            return {
                success: true,
                message: `Event found: ${response.data.summary}`,
                event: response.data
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateEvent(params, userId) {
        if (!this.calendar) {
            return { success: false, error: 'Google Calendar not configured. Check .env file.' };
        }
        const { event_id, title, start, end, description } = params;
        
        if (!event_id) {
            return { success: false, error: 'Missing required field: event_id' };
        }

        try {
            const updates = {};
            if (title) updates.summary = title;
            if (start) updates.start = { dateTime: start, timeZone: 'UTC' };
            if (end) updates.end = { dateTime: end, timeZone: 'UTC' };
            if (description) updates.description = description;

            const response = await this.calendar.events.patch({
                calendarId: 'primary',
                eventId: event_id,
                resource: updates
            });

            return {
                success: true,
                message: `Event ${event_id} updated successfully`,
                eventId: event_id,
                event: response.data
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteEvent(params, userId) {
        if (!this.calendar) {
            return { success: false, error: 'Google Calendar not configured. Check .env file.' };
        }
        const { event_id } = params;
        
        if (!event_id) {
            return { success: false, error: 'Missing required field: event_id' };
        }

        try {
            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: event_id
            });

            return {
                success: true,
                message: `Event ${event_id} deleted successfully`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async listEvents(params, userId) {
        if (!this.calendar) {
            return { success: false, error: 'Google Calendar not configured. Check .env file.' };
        }
        const { start_date, end_date, limit = 10 } = params;
        
        try {
            const now = new Date();
            const timeMin = start_date || now.toISOString();
            const timeMax = end_date || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin,
                timeMax: timeMax,
                maxResults: limit,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return {
                success: true,
                message: `Found ${response.data.items.length} events`,
                events: response.data.items
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    calculateEndTime(startTime) {
        const start = new Date(startTime);
        return new Date(start.getTime() + 3600000).toISOString(); // Add 1 hour
    }

    // Helper method to format events for display
    formatEvent(event) {
        return `📅 ${event.summary}\n🕐 ${new Date(event.start.dateTime).toLocaleString()}\n📍 ${event.description || 'No description'}`;
    }
}

module.exports = CalendarSkill;
