// Session management with LocalStorage
class SessionManager {
    constructor() {
        this.storageKey = 'session';
    }

    // Create new session
    createSession(user) {
        const sessionData = {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString()
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }

    // Get current session
    getSession() {
        try {
            const session = localStorage.getItem(this.storageKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error retrieving session:', error);
            return null;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.getSession() !== null;
    }

    // Check if user is admin
    isAdmin() {
        const session = this.getSession();
        return session?.role === 'admin';
    }

    // Destroy session (logout)
    destroySession() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error destroying session:', error);
            return false;
        }
    }
}

export default new SessionManager();
