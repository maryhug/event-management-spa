import api from './api.js';
import sessionManager from '../state/sessionManager.js';

class EventService {
    // Get all events
    async getAllEvents() {
        try {
            const events = await api.get('/events');
            return {
                success: true,
                data: events
            };
        } catch (error) {
            console.error('Error fetching events:', error);
            return {
                success: false,
                message: 'Failed to load events'
            };
        }
    }

    // Get event by ID
    async getEventById(id) {
        try {
            const event = await api.get(`/events/${id}`);
            return {
                success: true,
                data: event
            };
        } catch (error) {
            console.error('Error fetching event:', error);
            return {
                success: false,
                message: 'Event not found'
            };
        }
    }

    // Create new event (admin only)
    async createEvent(eventData) {
        try {
            const session = sessionManager.getSession();

            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            // Validate required fields
            if (!eventData.name || eventData.name.trim() === '') {
                throw new Error('Event name is required');
            }

            if (!eventData.date) {
                throw new Error('Event date is required');
            }

            if (!eventData.maxCapacity || eventData.maxCapacity <= 0) {
                throw new Error('Max capacity must be greater than 0');
            }

            const newEvent = {
                ...eventData,
                currentAttendees: 0,
                status: 'active',
                createdBy: session.userId,
                createdAt: new Date().toISOString()
            };

            const createdEvent = await api.post('/events', newEvent);

            return {
                success: true,
                data: createdEvent,
                message: 'Event created successfully'
            };

        } catch (error) {
            console.error('Error creating event:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update event (admin only)
    async updateEvent(id, eventData) {
        try {
            const session = sessionManager.getSession();

            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            // Validate capacity (current attendees cannot exceed new max capacity)
            if (eventData.maxCapacity && eventData.currentAttendees > eventData.maxCapacity) {
                throw new Error('Cannot set max capacity below current attendees');
            }

            const updatedEvent = {
                ...eventData,
                updatedAt: new Date().toISOString()
            };

            const result = await api.put(`/events/${id}`, updatedEvent);

            return {
                success: true,
                data: result,
                message: 'Event updated successfully'
            };

        } catch (error) {
            console.error('Error updating event:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Delete event (admin only)
    async deleteEvent(id) {
        try {
            const session = sessionManager.getSession();

            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }

            await api.delete(`/events/${id}`);

            return {
                success: true,
                message: 'Event deleted successfully'
            };

        } catch (error) {
            console.error('Error deleting event:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Register user to event
    async registerToEvent(eventId) {
        try {
            const session = sessionManager.getSession();

            if (!session) {
                throw new Error('You must be logged in to register');
            }

            // Get event details
            const eventResult = await this.getEventById(eventId);

            if (!eventResult.success) {
                throw new Error('Event not found');
            }

            const event = eventResult.data;

            // Check capacity
            if (event.currentAttendees >= event.maxCapacity) {
                throw new Error('Event is at full capacity');
            }

            // Check if already registered
            const registrations = await api.get('/registrations');
            const alreadyRegistered = registrations.some(
                r => r.eventId === eventId && r.userId === session.userId
            );

            if (alreadyRegistered) {
                throw new Error('You are already registered for this event');
            }

            // Create registration
            const registration = {
                eventId: eventId,
                userId: session.userId,
                registeredAt: new Date().toISOString()
            };

            await api.post('/registrations', registration);

            // Update attendee count
            await this.updateEvent(eventId, {
                ...event,
                currentAttendees: event.currentAttendees + 1
            });

            return {
                success: true,
                message: 'Successfully registered to event'
            };

        } catch (error) {
            console.error('Error registering to event:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Unregister from event
    async unregisterFromEvent(eventId) {
        try {
            const session = sessionManager.getSession();

            if (!session) {
                throw new Error('You must be logged in');
            }

            // Find registration
            const registrations = await api.get('/registrations');
            const registration = registrations.find(
                r => r.eventId === eventId && r.userId === session.userId
            );

            if (!registration) {
                throw new Error('You are not registered for this event');
            }

            // Delete registration
            await api.delete(`/registrations/${registration.id}`);

            // Update attendee count
            const eventResult = await this.getEventById(eventId);
            const event = eventResult.data;

            await this.updateEvent(eventId, {
                ...event,
                currentAttendees: Math.max(0, event.currentAttendees - 1)
            });

            return {
                success: true,
                message: 'Successfully unregistered from event'
            };

        } catch (error) {
            console.error('Error unregistering from event:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get user's registered events
    async getUserEvents() {
        try {
            const session = sessionManager.getSession();

            if (!session) {
                throw new Error('You must be logged in');
            }

            const registrations = await api.get('/registrations');
            const userRegistrations = registrations.filter(r => r.userId === session.userId);

            const events = await Promise.all(
                userRegistrations.map(async (reg) => {
                    const result = await this.getEventById(reg.eventId);
                    return result.data;
                })
            );

            return {
                success: true,
                data: events
            };

        } catch (error) {
            console.error('Error fetching user events:', error);
            return {
                success: false,
                message: 'Failed to load your events'
            };
        }
    }
}

export default new EventService();
