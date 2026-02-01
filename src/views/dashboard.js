import sessionManager from '../state/sessionManager.js';
import eventService from '../services/eventService.js';
import { createNavbar, attachNavbarListeners } from '../components/navbar.js';
import { formatDate, showNotification } from '../utils/helpers.js';

export async function renderDashboard() {
    const app = document.getElementById('app');
    const session = sessionManager.getSession();

    app.innerHTML = `
        ${createNavbar('/dashboard')}
        
        <div class="dashboard-container">
            <div class="dashboard-welcome">
                <h1 class="welcome-title">Welcome back, ${session.fullName}! 👋</h1>
                <p class="welcome-subtitle">Here's what's happening with your events</p>
            </div>
            
            <div class="dashboard-stats" id="dashboardStats">
                <div class="loading">Loading statistics...</div>
            </div>
            
            <div class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">Your Upcoming Events</h2>
                    <a href="#" class="btn btn-link" data-route="/my-events">View All</a>
                </div>
                
                <div id="upcomingEvents" class="upcoming-events">
                    <div class="loading">Loading events...</div>
                </div>
            </div>
            
            <div class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">Quick Actions</h2>
                </div>
                
                <div class="quick-actions">
                    <a href="#" class="action-card" data-route="/events">
                        <div class="action-icon">🔍</div>
                        <h3>Browse Events</h3>
                        <p>Discover new events to attend</p>
                    </a>
                    
                    <a href="#" class="action-card" data-route="/my-events">
                        <div class="action-icon">📋</div>
                        <h3>My Registrations</h3>
                        <p>View your registered events</p>
                    </a>
                    
                    ${session.role === 'admin' ? `
                        <a href="#" class="action-card" data-route="/admin">
                            <div class="action-icon">⚙️</div>
                            <h3>Admin Panel</h3>
                            <p>Manage events and users</p>
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    attachNavbarListeners();
    await loadDashboardData();
    setupDashboardListeners();
}

async function loadDashboardData() {
    try {
        // Load user's events
        const myEventsResult = await eventService.getUserEvents();
        const allEventsResult = await eventService.getAllEvents();

        if (myEventsResult.success && allEventsResult.success) {
            const myEvents = myEventsResult.data;
            const allEvents = allEventsResult.data;

            // Update stats
            updateStats(myEvents, allEvents);

            // Show upcoming events
            displayUpcomingEvents(myEvents);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateStats(myEvents, allEvents) {
    const statsContainer = document.getElementById('dashboardStats');

    const totalRegistered = myEvents.length;
    const totalAvailable = allEvents.filter(e => e.status === 'active').length;
    const upcomingEvents = myEvents.filter(e => new Date(e.date) > new Date()).length;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <h3 class="stat-value">${totalRegistered}</h3>
                <p class="stat-label">Events Registered</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
                <h3 class="stat-value">${upcomingEvents}</h3>
                <p class="stat-label">Upcoming Events</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <h3 class="stat-value">${totalAvailable}</h3>
                <p class="stat-label">Available Events</p>
            </div>
        </div>
    `;
}

function displayUpcomingEvents(events) {
    const container = document.getElementById('upcomingEvents');

    // Filter upcoming events
    const upcoming = events
        .filter(e => new Date(e.date) > new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You don't have any upcoming events</p>
                <a href="#" class="btn btn-primary" data-route="/events">Browse Events</a>
            </div>
        `;
        return;
    }

    container.innerHTML = upcoming.map(event => `
        <div class="upcoming-event-card">
            <div class="event-date-badge">
                <span class="date-day">${new Date(event.date).getDate()}</span>
                <span class="date-month">${new Date(event.date).toLocaleString('en', { month: 'short' })}</span>
            </div>
            
            <div class="event-info">
                <h4 class="event-name">${event.name}</h4>
                <p class="event-location">📍 ${event.location}</p>
            </div>
            
            <div class="event-action">
                <span class="badge badge-success">Registered</span>
            </div>
        </div>
    `).join('');
}

function setupDashboardListeners() {
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.target.closest('[data-route]').dataset.route;
            router.navigate(route);
        });
    });
}
