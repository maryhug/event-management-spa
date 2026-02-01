import sessionManager from '../state/sessionManager.js';
import router from '../router/router.js';
import { showNotification } from '../utils/helpers.js';

export function createNavbar(activeRoute = '/events') {
    const session = sessionManager.getSession();

    if (!session) return '';

    return `
        <nav class="navbar">
            <div class="navbar-brand">
                <span class="logo-icon">📅</span>
                <span class="brand-name">EventApp</span>
            </div>
            
            <div class="navbar-menu">
                <a href="#" class="nav-link ${activeRoute === '/events' ? 'active' : ''}" data-route="/events">
                    Browse Events
                </a>
                <a href="#" class="nav-link ${activeRoute === '/my-events' ? 'active' : ''}" data-route="/my-events">
                    My Events
                </a>
                ${session.role === 'admin' ? `
                    <a href="#" class="nav-link ${activeRoute === '/admin' ? 'active' : ''}" data-route="/admin">
                        Admin Dashboard
                    </a>
                ` : ''}
            </div>
            
            <div class="navbar-user">
                <div class="user-avatar">
                    ${session.fullName.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <span class="user-name">${session.fullName}</span>
                    <span class="user-role">${session.role}</span>
                </div>
                <button id="logoutBtn" class="btn btn-outline-sm">
                    <span class="logout-icon">🚪</span>
                    Logout
                </button>
            </div>
        </nav>
    `;
}

export function attachNavbarListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.target.dataset.route;
            router.navigate(route);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmed = confirm('Are you sure you want to logout?');
            if (confirmed) {
                sessionManager.destroySession();
                showNotification('Logged out successfully', 'success');
                router.navigate('/login');
            }
        });
    }
}
