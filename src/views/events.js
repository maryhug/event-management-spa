import eventService from '../services/eventService.js';
import sessionManager from '../state/sessionManager.js';
import router from '../router/router.js';
import { formatDate, capacityPercentage, showNotification, daysUntilEvent } from '../utils/helpers.js';

export async function renderEvents() {
    const app = document.getElementById('app');
    const session = sessionManager.getSession();

    app.innerHTML = `
        <div class="dashboard-layout">
            <!-- Navbar -->
            <nav class="navbar">
                <div class="navbar-brand">
                    <span class="logo-icon">📅</span>
                    <span class="brand-name">EventApp</span>
                </div>
                
                <div class="navbar-menu">
                    <a href="#" class="nav-link active" data-route="/events">Events</a>
                    <a href="#" class="nav-link" data-route="/my-events">My Events</a>
                    ${session.role === 'admin' ? '<a href="#" class="nav-link" data-route="/admin">Admin</a>' : ''}
                </div>
                
                <div class="navbar-user">
                    <div class="user-info">
                        <span class="user-name">${session.fullName}</span>
                        <span class="user-role">${session.role}</span>
                    </div>
                    <button id="logoutBtn" class="btn btn-outline-sm">Log Out</button>
                </div>
            </nav>
            
            <!-- Main Content -->
            <main class="main-content">
                <div class="content-header">
                    <div>
                        <h1 class="page-title">Discover Events</h1>
                        <p class="page-subtitle">Browse and register for upcoming events</p>
                    </div>
                    
                    <div class="header-actions">
                        <div class="search-box">
                            <span class="search-icon">🔍</span>
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="Search events..."
                            >
                        </div>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filters">
                    <button class="filter-btn active" data-category="all">All</button>
                    <button class="filter-btn" data-category="technology">Technology</button>
                    <button class="filter-btn" data-category="workshop">Workshop</button>
                    <button class="filter-btn" data-category="conference">Conference</button>
                    <button class="filter-btn" data-category="networking">Networking</button>
                </div>
                
                <!-- Events Grid -->
                <div id="eventsGrid" class="events-grid">
                    <div class="loading">Loading events...</div>
                </div>
            </main>
        </div>
    `;

    // Load events
    await loadEvents();

    // Event listeners
    setupEventListeners();
}

async function loadEvents(category = 'all', searchTerm = '') {
    const grid = document.getElementById('eventsGrid');

    try {
        const result = await eventService.getAllEvents();

        if (!result.success) {
            grid.innerHTML = '<div class="error-message">Failed to load events</div>';
            return;
        }

        let events = result.data;

        // Filter by category
        if (category !== 'all') {
            events = events.filter(e => e.category === category);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            events = events.filter(e =>
                e.name.toLowerCase().includes(term) ||
                e.description.toLowerCase().includes(term) ||
                e.location.toLowerCase().includes(term)
            );
        }

        // Filter only active events
        events = events.filter(e => e.status === 'active');

        if (events.length === 0) {
            grid.innerHTML = '<div class="empty-state">No events found</div>';
            return;
        }

        grid.innerHTML = events.map(event => createEventCard(event)).join('');

        // Add register button listeners
        document.querySelectorAll('.btn-register').forEach(btn => {
            btn.addEventListener('click', handleRegister);
        });

    } catch (error) {
        console.error('Error loading events:', error);
        grid.innerHTML = '<div class="error-message">An error occurred</div>';
    }
}

function createEventCard(event) {
    const capacity = capacityPercentage(event.currentAttendees, event.maxCapacity);
    const isFull = event.currentAttendees >= event.maxCapacity;
    const daysUntil = daysUntilEvent(event.date);

    let statusBadge = '';
    if (isFull) {
        statusBadge = '<span class="badge badge-danger">Full</span>';
    } else if (capacity >= 80) {
        statusBadge = '<span class="badge badge-warning">Almost Full</span>';
    } else if (daysUntil <= 7) {
        statusBadge = '<span class="badge badge-info">Coming Soon</span>';
    }

    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-card-header">
                <div class="event-category">${event.category}</div>
                ${statusBadge}
            </div>
            
            <div class="event-card-body">
                <h3 class="event-title">${event.name}</h3>
                <p class="event-description">${event.description}</p>
                
                <div class="event-details">
                    <div class="event-detail">
                        <span class="detail-icon">📅</span>
                        <span class="detail-text">${formatDate(event.date)}</span>
                    </div>
                    
                    <div class="event-detail">
                        <span class="detail-icon">📍</span>
                        <span class="detail-text">${event.location}</span>
                    </div>
                    
                    <div class="event-detail">
                        <span class="detail-icon">👥</span>
                        <span class="detail-text">${event.currentAttendees}/${event.maxCapacity} attendees</span>
                    </div>
                </div>
                
                <div class="capacity-bar">
                    <div class="capacity-fill" style="width: ${capacity}%"></div>
                </div>
                <p class="capacity-text">${capacity}% capacity</p>
            </div>
            
            <div class="event-card-footer">
                <button 
                    class="btn btn-primary btn-register" 
                    data-event-id="${event.id}"
                    ${isFull ? 'disabled' : ''}
                >
                    ${isFull ? 'Event Full' : 'Register Now'}
                </button>
            </div>
        </div>
    `;
}

async function handleRegister(e) {
    const eventId = parseInt(e.target.dataset.eventId);
    const btn = e.target;

    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
        const result = await eventService.registerToEvent(eventId);

        if (result.success) {
            showNotification(result.message, 'success');
            await loadEvents();
        } else {
            showNotification(result.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Register Now';
        }
    } catch (error) {
        showNotification('An error occurred', 'error');
        btn.disabled = false;
        btn.textContent = 'Register Now';
    }
}

function setupEventListeners() {
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
            const route = e.target.dataset.route;
            router.navigate(route);
        });
    });

    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const category = e.target.dataset.category;
            const searchTerm = document.getElementById('searchInput').value;
            loadEvents(category, searchTerm);
        });
    });

    // Search
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
            loadEvents(activeCategory, e.target.value);
        }, 300);
    });
}
