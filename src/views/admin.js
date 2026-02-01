import eventService from '../services/eventService.js';
import sessionManager from '../state/sessionManager.js';
import router from '../router/router.js';
import { formatDate, formatDateForInput, showNotification } from '../utils/helpers.js';
import { validateRequired, validateEventDate, validateCapacity } from '../utils/validators.js';

export async function renderAdmin() {
    const app = document.getElementById('app');
    const session = sessionManager.getSession();

    app.innerHTML = `
        <div class="dashboard-layout">
            <!-- Navbar -->
            <nav class="navbar navbar-admin">
                <div class="navbar-brand">
                    <span class="logo-icon">📅</span>
                    <span class="brand-name">EventApp Admin</span>
                </div>
                
                <div class="navbar-menu">
                    <a href="#" class="nav-link" data-route="/events">Events</a>
                    <a href="#" class="nav-link" data-route="/my-events">My Events</a>
                    <a href="#" class="nav-link active" data-route="/admin">Admin</a>
                </div>
                
                <div class="navbar-user">
                    <div class="user-info">
                        <span class="user-name">${session.fullName}</span>
                        <span class="user-role">Admin</span>
                    </div>
                    <button id="logoutBtn" class="btn btn-outline-sm">Log Out</button>
                </div>
            </nav>
            
            <!-- Main Content -->
            <main class="main-content">
                <!-- Stats Dashboard -->
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <p class="stat-label">Total Events</p>
                            <h2 class="stat-value" id="totalEvents">-</h2>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <p class="stat-label">Active Events</p>
                            <h2 class="stat-value" id="activeEvents">-</h2>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <p class="stat-label">Total Attendees</p>
                            <h2 class="stat-value" id="totalAttendees">-</h2>
                        </div>
                    </div>
                </div>
                
                <!-- Events Management -->
                <div class="admin-section">
                    <div class="section-header">
                        <h2 class="section-title">Event Management</h2>
                        <button class="btn btn-success" id="createEventBtn">
                            ➕ Create Event
                        </button>
                    </div>
                    
                    <div class="admin-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="active">Active</button>
                        <button class="filter-btn" data-filter="full">Full</button>
                    </div>
                    
                    <div id="eventsTable" class="events-table-container">
                        <div class="loading">Loading events...</div>
                    </div>
                </div>
            </main>
        </div>
        
        <!-- Create/Edit Event Modal -->
        <div id="eventModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Create Event</h3>
                    <button class="modal-close" id="closeModal">&times;</button>
                </div>
                
                <form id="eventForm" class="modal-body">
                    <input type="hidden" id="eventId" name="eventId">
                    
                    <div class="form-group">
                        <label for="eventName">Event Name *</label>
                        <input type="text" id="eventName" name="name" required>
                        <span class="error-message" id="nameError"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="eventDescription">Description *</label>
                        <textarea id="eventDescription" name="description" rows="3" required></textarea>
                        <span class="error-message" id="descError"></span>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventDate">Date *</label>
                            <input type="date" id="eventDate" name="date" required>
                            <span class="error-message" id="dateError"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="eventCategory">Category *</label>
                            <select id="eventCategory" name="category" required>
                                <option value="technology">Technology</option>
                                <option value="workshop">Workshop</option>
                                <option value="conference">Conference</option>
                                <option value="networking">Networking</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="eventLocation">Location *</label>
                        <input type="text" id="eventLocation" name="location" required>
                        <span class="error-message" id="locationError"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="eventCapacity">Max Capacity *</label>
                        <input type="number" id="eventCapacity" name="maxCapacity" min="1" required>
                        <span class="error-message" id="capacityError"></span>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="saveBtn">Save Event</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadAdminData();
    setupAdminListeners();
}

async function loadAdminData() {
    try {
        const result = await eventService.getAllEvents();

        if (!result.success) {
            showNotification('Failed to load events', 'error');
            return;
        }

        const events = result.data;

        // Update stats
        const totalEvents = events.length;
        const activeEvents = events.filter(e => e.status === 'active').length;
        const totalAttendees = events.reduce((sum, e) => sum + e.currentAttendees, 0);

        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('activeEvents').textContent = activeEvents;
        document.getElementById('totalAttendees').textContent = totalAttendees;

        // Load events table
        loadEventsTable(events);

    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('An error occurred', 'error');
    }
}

function loadEventsTable(events, filter = 'all') {
    const container = document.getElementById('eventsTable');

    let filteredEvents = events;

    if (filter === 'active') {
        filteredEvents = events.filter(e => e.status === 'active');
    } else if (filter === 'full') {
        filteredEvents = events.filter(e => e.currentAttendees >= e.maxCapacity);
    }

    if (filteredEvents.length === 0) {
        container.innerHTML = '<div class="empty-state">No events found</div>';
        return;
    }

    container.innerHTML = `
        <table class="events-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Capacity</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredEvents.map(event => createEventRow(event)).join('')}
            </tbody>
        </table>
    `;

    // Add action listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

function createEventRow(event) {
    const isFull = event.currentAttendees >= event.maxCapacity;
    const statusBadge = isFull ?
        '<span class="badge badge-danger">Full</span>' :
        '<span class="badge badge-success">Active</span>';

    return `
        <tr>
            <td>#${event.id}</td>
            <td>${event.name}</td>
            <td>${formatDate(event.date)}</td>
            <td><span class="category-badge">${event.category}</span></td>
            <td>${statusBadge}</td>
            <td>${event.currentAttendees}/${event.maxCapacity}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary btn-edit" data-event='${JSON.stringify(event)}'>
                    Edit
                </button>
                <button class="btn btn-sm btn-danger btn-delete" data-event-id="${event.id}">
                    Delete
                </button>
            </td>
        </tr>
    `;
}

function setupAdminListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionManager.destroySession();
        showNotification('Logged out successfully', 'info');
        router.navigate('/login');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate(e.target.dataset.route);
        });
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.dataset.filter;
            const result = await eventService.getAllEvents();
            if (result.success) {
                loadEventsTable(result.data, filter);
            }
        });
    });

    // Create event button
    document.getElementById('createEventBtn').addEventListener('click', openCreateModal);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('eventForm').addEventListener('submit', handleSaveEvent);

    // Click outside modal to close
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') {
            closeModal();
        }
    });
}

function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').min = today;

    document.getElementById('eventModal').classList.add('show');
}

function handleEdit(e) {
    const event = JSON.parse(e.target.dataset.event);

    document.getElementById('modalTitle').textContent = 'Edit Event';
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventName').value = event.name;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventDate').value = formatDateForInput(event.date);
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventCapacity').value = event.maxCapacity;

    document.getElementById('eventModal').classList.add('show');
}

async function handleDelete(e) {
    const eventId = parseInt(e.target.dataset.eventId);

    const confirmed = confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmed) return;

    try {
        const result = await eventService.deleteEvent(eventId);

        if (result.success) {
            showNotification(result.message, 'success');
            await loadAdminData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('An error occurred', 'error');
    }
}

async function handleSaveEvent(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventId = formData.get('eventId');

    const eventData = {
        name: formData.get('name'),
        description: formData.get('description'),
        date: formData.get('date'),
        category: formData.get('category'),
        location: formData.get('location'),
        maxCapacity: parseInt(formData.get('maxCapacity'))
    };

    // Validate
    if (!validateRequired(eventData.name)) {
        showNotification('Event name is required', 'error');
        return;
    }

    if (!validateEventDate(eventData.date)) {
        showNotification('Event date must be in the future', 'error');
        return;
    }

    if (!validateCapacity(eventData.maxCapacity)) {
        showNotification('Invalid capacity', 'error');
        return;
    }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        let result;

        if (eventId) {
            // Get existing event to preserve currentAttendees
            const existingEvent = await eventService.getEventById(parseInt(eventId));
            eventData.currentAttendees = existingEvent.data.currentAttendees;
            eventData.status = existingEvent.data.status;
            eventData.createdBy = existingEvent.data.createdBy;

            result = await eventService.updateEvent(parseInt(eventId), eventData);
        } else {
            result = await eventService.createEvent(eventData);
        }

        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            await loadAdminData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('An error occurred', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Event';
    }
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('show');
    document.getElementById('eventForm').reset();
}
