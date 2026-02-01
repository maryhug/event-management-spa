import eventService from '../services/eventService.js';
import sessionManager from '../state/sessionManager.js';
import router from '../router/router.js';
import { formatDate, showNotification } from '../utils/helpers.js';

export async function renderMyEvents() {
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
                    <a href="#" class="nav-link" data-route="/events">Events</a>
                    <a href="#" class="nav-link active" data-route="/my-events">My Events</a>
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
                        <h1 class="page-title">My Registered Events</h1>
                        <p class="page-subtitle">Events you're attending</p>
                    </div>
                </div>
                
                <div id="myEventsContainer" class="my-events-container">
                    <div class="loading">Loading your events...</div>
                </div>
            </main>
        </div>
    `;

    await loadMyEvents();
    setupNavigation();
}

async function loadMyEvents() {
    const container = document.getElementById('myEventsContainer');

    try {
        const result = await eventService.getUserEvents();

        if (!result.success) {
            container.innerHTML = '<div class="error-message">Failed to load your events</div>';
            return;
        }

        const events = result.data;

        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>You haven't registered for any events yet</p>
                    <button class="btn btn-primary" id="browseEventsBtn">Browse Events</button>
                </div>
            `;

            document.getElementById('browseEventsBtn').addEventListener('click', () => {
                router.navigate('/events');
            });
            return;
        }

        container.innerHTML = `
            <div class="events-list">
                ${events.map(event => createMyEventCard(event)).join('')}
            </div>
        `;

        // Add unregister listeners
        document.querySelectorAll('.btn-unregister').forEach(btn => {
            btn.addEventListener('click', handleUnregister);
        });

    } catch (error) {
        console.error('Error loading my events:', error);
        container.innerHTML = '<div class="error-message">An error occurred</div>';
    }
}

function createMyEventCard(event) {
    return `
        <div class="my-event-card">
            <div class="my-event-header">
                <h3 class="my-event-title">${event.name}</h3>
                <span class="badge badge-success">Registered</span>
            </div>
            
            <div class="my-event-body">
                <p class="my-event-description">${event.description}</p>
                
                <div class="my-event-info">
                    <div class="info-item">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${formatDate(event.date)}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Location:</span>
                        <span class="info-value">${event.location}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Capacity:</span>
                        <span class="info-value">${event.currentAttendees}/${event.maxCapacity}</span>
                    </div>
                </div>
            </div>
            
            <div class="my-event-footer">
                <button class="btn btn-danger btn-unregister" data-event-id="${event.id}">
                    Cancel Registration
                </button>
            </div>
        </div>
    `;
}

async function handleUnregister(e) {
    const eventId = parseInt(e.target.dataset.eventId);

    const confirmed = confirm('Are you sure you want to cancel your registration?');
    if (!confirmed) return;

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Canceling...';

    try {
        const result = await eventService.unregisterFromEvent(eventId);

        if (result.success) {
            showNotification(result.message, 'success');
            await loadMyEvents();
        } else {
            showNotification(result.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Cancel Registration';
        }
    } catch (error) {
        showNotification('An error occurred', 'error');
        btn.disabled = false;
        btn.textContent = 'Cancel Registration';
    }
}

function setupNavigation() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionManager.destroySession();
        showNotification('Logged out successfully', 'info');
        router.navigate('/login');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate(e.target.dataset.route);
        });
    });
}
