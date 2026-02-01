import authService from '../services/authService.js';
import router from '../router/router.js';
import { showNotification } from '../utils/helpers.js';

export function renderLogin() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <div class="logo-icon">📅</div>
                </div>
                
                <h1 class="auth-title">Event Management</h1>
                <p class="auth-subtitle">Login to your account</p>
                
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <span class="input-icon">📧</span>
                            <input 
                                type="email" 
                                id="email" 
                                name="email"
                                placeholder="name@example.com"
                                required
                            >
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                placeholder="Enter your password"
                                required
                            >
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        Sign In
                    </button>
                </form>
                
                <p class="auth-footer">
                    Don't have an account? 
                    <a href="#" id="signupLink" class="auth-link">Sign up</a>
                </p>
                
                <p class="auth-credits">Roadmap Academic Simulator v1.0<br>Performance monitoring active</p>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupLink').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/register');
    });
}

async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
        const result = await authService.login(email, password);

        if (result.success) {
            showNotification('Login successful! Welcome back.', 'success');

            setTimeout(() => {
                if (result.user.role === 'admin') {
                    router.navigate('/admin');
                } else {
                    router.navigate('/events');
                }
            }, 500);
        } else {
            showNotification(result.message || 'Login failed', 'error');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}
