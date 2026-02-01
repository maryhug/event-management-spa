import authService from '../services/authService.js';
import router from '../router/router.js';
import { showNotification } from '../utils/helpers.js';
import { validateEmail, validatePassword, validateName } from '../utils/validators.js';

export function renderRegister() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <div class="logo-icon">📅</div>
                </div>
                
                <h1 class="auth-title">Create Account</h1>
                <p class="auth-subtitle">Join our event platform</p>
                
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="fullName">Full Name</label>
                        <div class="input-wrapper">
                            <span class="input-icon">👤</span>
                            <input 
                                type="text" 
                                id="fullName" 
                                name="fullName"
                                placeholder="Enter your full name"
                                required
                            >
                        </div>
                        <span class="error-message" id="nameError"></span>
                    </div>
                    
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
                        <span class="error-message" id="emailError"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                placeholder="Min. 6 characters"
                                required
                            >
                        </div>
                        <span class="error-message" id="passwordError"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="role">Select Role</label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔑</span>
                            <select id="role" name="role" required>
                                <option value="guest">Guest</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        Create Account
                    </button>
                </form>
                
                <p class="auth-footer">
                    Already have an account? 
                    <a href="#" id="loginLink" class="auth-link">Sign in</a>
                </p>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginLink').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/login');
    });

    // Real-time validation
    document.getElementById('fullName').addEventListener('blur', validateNameField);
    document.getElementById('email').addEventListener('blur', validateEmailField);
    document.getElementById('password').addEventListener('blur', validatePasswordField);
}

function validateNameField(e) {
    const value = e.target.value;
    const errorEl = document.getElementById('nameError');

    if (!validateName(value)) {
        errorEl.textContent = 'Name must be at least 2 characters';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateEmailField(e) {
    const value = e.target.value;
    const errorEl = document.getElementById('emailError');

    if (!validateEmail(value)) {
        errorEl.textContent = 'Please enter a valid email address';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validatePasswordField(e) {
    const value = e.target.value;
    const errorEl = document.getElementById('passwordError');

    if (!validatePassword(value)) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    // Validate all fields
    const nameValid = validateName(userData.fullName);
    const emailValid = validateEmail(userData.email);
    const passwordValid = validatePassword(userData.password);

    if (!nameValid || !emailValid || !passwordValid) {
        showNotification('Please fix the errors in the form', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
        const result = await authService.register(userData);

        if (result.success) {
            showNotification('Account created successfully! Please login.', 'success');

            setTimeout(() => {
                router.navigate('/login');
            }, 1500);
        } else {
            showNotification(result.message || 'Registration failed', 'error');
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}
