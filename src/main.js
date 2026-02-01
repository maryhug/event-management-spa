import router from './router/router.js';
import { renderLogin } from './auth/login.js';
import { renderRegister } from './auth/register.js';
import { renderEvents } from './views/events.js';
import { renderMyEvents } from './views/myEvents.js';
import { renderAdmin } from './views/admin.js';
import sessionManager from './state/sessionManager.js';

// Register all routes
router.register('/login', renderLogin);
router.register('/register', renderRegister);
router.register('/events', renderEvents);
router.register('/my-events', renderMyEvents);
router.register('/admin', renderAdmin);

// Initialize app
function initApp() {
    const session = sessionManager.getSession();
    const currentPath = window.location.pathname;

    // Redirect logic
    if (!session && currentPath !== '/login' && currentPath !== '/register') {
        router.navigate('/login');
    } else if (session && (currentPath === '/login' || currentPath === '/register' || currentPath === '/')) {
        if (session.role === 'admin') {
            router.navigate('/admin');
        } else {
            router.navigate('/events');
        }
    } else if (currentPath === '/') {
        router.navigate('/login');
    } else {
        router.navigate(currentPath);
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
