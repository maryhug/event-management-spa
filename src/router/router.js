// Router for SPA navigation
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    // Register a new route
    register(path, callback) {
        this.routes[path] = callback;
    }

    // Navigate to a specific route
    navigate(path) {
        // Check if user is authenticated
        const session = JSON.parse(localStorage.getItem('session'));

        // Protected routes
        const protectedRoutes = ['/dashboard', '/events', '/admin'];
        const authRoutes = ['/login', '/register'];

        if (protectedRoutes.includes(path) && !session) {
            this.navigate('/login');
            return;
        }

        // Redirect authenticated users away from auth pages
        if (authRoutes.includes(path) && session) {
            this.navigate('/dashboard');
            return;
        }

        // Admin-only routes
        if (path === '/admin' && session?.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            this.navigate('/dashboard');
            return;
        }

        this.currentRoute = path;
        window.history.pushState({}, '', path);

        const route = this.routes[path];
        if (route) {
            route();
        } else {
            this.navigate('/login');
        }
    }

    // Initialize router
    init() {
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });
    }
}

export default new Router();
