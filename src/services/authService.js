import api from './api.js';
import sessionManager from '../state/sessionManager.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

class AuthService {
    // User login
    async login(email, password) {
        try {
            // Validate inputs
            if (!validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            if (!password || password.trim() === '') {
                throw new Error('Password is required');
            }

            // Fetch all users
            const users = await api.get('/users');

            // Find matching user
            const user = users.find(u =>
                u.email === email && u.password === password
            );

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Create session
            const sessionCreated = sessionManager.createSession(user);

            if (!sessionCreated) {
                throw new Error('Failed to create session');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // User registration
    async register(userData) {
        try {
            // Validate inputs
            if (!userData.fullName || userData.fullName.trim() === '') {
                throw new Error('Full name is required');
            }

            if (!validateEmail(userData.email)) {
                throw new Error('Invalid email format');
            }

            if (!validatePassword(userData.password)) {
                throw new Error('Password must be at least 6 characters');
            }

            // Check if email already exists
            const users = await api.get('/users');
            const emailExists = users.some(u => u.email === userData.email);

            if (emailExists) {
                throw new Error('Email already registered');
            }

            // Create new user
            const newUser = {
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'guest'
            };

            const createdUser = await api.post('/users', newUser);

            return {
                success: true,
                user: createdUser
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // User logout
    logout() {
        sessionManager.destroySession();
        return true;
    }

    // Get current user
    getCurrentUser() {
        return sessionManager.getSession();
    }
}

export default new AuthService();
