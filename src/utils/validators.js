// Email validation
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// Password validation
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    return password.length >= 6;
}

// Name validation
export function validateName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }

    return name.trim().length >= 2;
}

// Date validation (must be future date)
export function validateEventDate(dateString) {
    if (!dateString) {
        return false;
    }

    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDate >= today;
}

// Capacity validation
export function validateCapacity(capacity) {
    const num = parseInt(capacity);
    return !isNaN(num) && num > 0 && num <= 10000;
}

// Generic required field validation
export function validateRequired(value) {
    if (typeof value === 'string') {
        return value.trim() !== '';
    }
    return value !== null && value !== undefined;
}
