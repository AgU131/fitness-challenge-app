// ========================================
// AUTH.JS - Authentication Module
// Handles user login, registration, and session management
// ========================================

// ========================================
// Constants & Configuration
// ========================================

const AUTH_CONFIG = {
    MIN_PASSWORD_LENGTH: 8,
    SESSION_KEY: 'fitchallenge_user',
    USERS_KEY: 'fitchallenge_users',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    REDIRECT_DELAY: 1500 // Delay before redirect after successful login/signup
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength regex (at least one uppercase, one lowercase, one number)
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// ========================================
// Utility Functions
// ========================================

/**
 * Initialize default users in localStorage (for development/testing)
 * This creates demo accounts that users can test with
 */
function initializeDefaultUsers() {
    const users = getUsers();
    
    // If no users exist, create demo accounts
    if (users.length === 0) {
        const defaultUsers = [
            {
                id: '1',
                name: 'Demo User',
                email: 'demo@fitchallenge.com',
                password: 'Demo1234', // In production, this would be hashed
                createdAt: new Date().toISOString(),
                profileImage: null
            },
            {
                id: '2',
                name: 'John Athlete',
                email: 'john@example.com',
                password: 'Athlete123',
                createdAt: new Date().toISOString(),
                profileImage: null
            }
        ];
        
        localStorage.setItem(AUTH_CONFIG.USERS_KEY, JSON.stringify(defaultUsers));
        console.log('✅ Demo users initialized:', defaultUsers.map(u => u.email));
    }
}

/**
 * Get all registered users from localStorage
 * @returns {Array} Array of user objects
 */
function getUsers() {
    try {
        const usersJson = localStorage.getItem(AUTH_CONFIG.USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
        console.error('Error reading users from localStorage:', error);
        return [];
    }
}

/**
 * Save users array to localStorage
 * @param {Array} users - Array of user objects
 */
function saveUsers(users) {
    try {
        localStorage.setItem(AUTH_CONFIG.USERS_KEY, JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users to localStorage:', error);
    }
}

/**
 * Generate unique user ID
 * @returns {string} Unique ID
 */
function generateUserId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result { isValid, error }
 */
export function validateEmail(email) {
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }
    
    if (!EMAIL_REGEX.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true, error: null };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {boolean} checkStrength - Whether to check for strong password
 * @returns {Object} Validation result { isValid, error }
 */
export function validatePassword(password, checkStrength = false) {
    if (!password || password.trim() === '') {
        return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
        return { 
            isValid: false, 
            error: `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters` 
        };
    }
    
    if (checkStrength && !STRONG_PASSWORD_REGEX.test(password)) {
        return { 
            isValid: false, 
            error: 'Password must contain uppercase, lowercase, and number' 
        };
    }
    
    return { isValid: true, error: null };
}

/**
 * Validate name format
 * @param {string} name - Name to validate
 * @returns {Object} Validation result { isValid, error }
 */
export function validateName(name) {
    if (!name || name.trim() === '') {
        return { isValid: false, error: 'Name is required' };
    }
    
    if (name.trim().length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    
    return { isValid: true, error: null };
}

// ========================================
// Session Management
// ========================================

/**
 * Get current logged-in user from sessionStorage
 * @returns {Object|null} User object or null if not logged in
 */
export function getCurrentUser() {
    try {
        const userJson = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!userJson) return null;
        
        const userData = JSON.parse(userJson);
        
        // Check if session has expired
        const now = new Date().getTime();
        if (userData.expiresAt && now > userData.expiresAt) {
            logoutUser();
            return null;
        }
        
        return userData.user;
    } catch (error) {
        console.error('Error reading session:', error);
        return null;
    }
}

/**
 * Check if user is currently logged in
 * @returns {boolean} True if logged in
 */
export function isLoggedIn() {
    return getCurrentUser() !== null;
}

/**
 * Save user session to sessionStorage
 * @param {Object} user - User object to save
 */
function saveSession(user) {
    try {
        const sessionData = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt
            },
            loginTime: new Date().toISOString(),
            expiresAt: new Date().getTime() + AUTH_CONFIG.SESSION_TIMEOUT
        };
        
        sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// ========================================
// Authentication Functions
// ========================================

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Result { success, message, user }
 * 
 * @example
 * const result = await loginUser('demo@fitchallenge.com', 'Demo1234');
 * if (result.success) {
 *   console.log('Welcome,', result.user.name);
 * } else {
 *   console.error(result.message);
 * }
 */
export async function loginUser(email, password) {
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Validate inputs
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return { success: false, message: emailValidation.error };
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return { success: false, message: passwordValidation.error };
        }
        
        // Find user in localStorage
        const users = getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );
        
        if (!user) {
            return { 
                success: false, 
                message: 'Invalid email or password. Please try again.' 
            };
        }
        
        // Save session
        saveSession(user);
        
        console.log('✅ Login successful:', user.email);
        
        return { 
            success: true, 
            message: 'Login successful!', 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            }
        };
        
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: 'An error occurred during login. Please try again.' 
        };
    }
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.confirmPassword - Password confirmation
 * @returns {Promise<Object>} Result { success, message, user }
 * 
 * @example
 * const result = await registerUser({
 *   name: 'Jane Doe',
 *   email: 'jane@example.com',
 *   password: 'Secure123',
 *   confirmPassword: 'Secure123'
 * });
 */
export async function registerUser(userData) {
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const { name, email, password, confirmPassword } = userData;
        
        // Validate name
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            return { success: false, message: nameValidation.error };
        }
        
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return { success: false, message: emailValidation.error };
        }
        
        // Validate password with strength check
        const passwordValidation = validatePassword(password, true);
        if (!passwordValidation.isValid) {
            return { success: false, message: passwordValidation.error };
        }
        
        // Check password confirmation
        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }
        
        // Check if user already exists
        const users = getUsers();
        const existingUser = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );
        
        if (existingUser) {
            return { 
                success: false, 
                message: 'An account with this email already exists' 
            };
        }
        
        // Create new user
        const newUser = {
            id: generateUserId(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password, // In production, hash this!
            createdAt: new Date().toISOString(),
            profileImage: null
        };
        
        // Save user
        users.push(newUser);
        saveUsers(users);
        
        // Auto-login after registration
        saveSession(newUser);
        
        console.log('✅ Registration successful:', newUser.email);
        
        return { 
            success: true, 
            message: 'Account created successfully!', 
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                profileImage: newUser.profileImage
            }
        };
        
    } catch (error) {
        console.error('Registration error:', error);
        return { 
            success: false, 
            message: 'An error occurred during registration. Please try again.' 
        };
    }
}

/**
 * Logout current user
 * Clears session data from sessionStorage
 * 
 * @example
 * logoutUser();
 * window.location.href = '/';
 */
export function logoutUser() {
    try {
        const user = getCurrentUser();
        sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        
        if (user) {
            console.log('✅ Logout successful:', user.email);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Check if user has required authentication and redirect if not
 * @param {string} redirectUrl - URL to redirect to if not logged in
 */
export function requireAuth(redirectUrl = '../login/index.html') {
    if (!isLoggedIn()) {
        window.location.href = redirectUrl;
    }
}

// ========================================
// UI Helper Functions
// ========================================

/**
 * Show error message in form
 * @param {string} elementId - ID of error message element
 * @param {string} message - Error message to display
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Hide error message in form
 * @param {string} elementId - ID of error message element
 */
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Show alert message
 * @param {string} elementId - ID of alert element
 * @param {string} message - Message to display (optional)
 */
function showAlert(elementId, message = null) {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        if (message) {
            const messageSpan = alertElement.querySelector('span');
            if (messageSpan) messageSpan.textContent = message;
        }
        alertElement.style.display = 'flex';
    }
}

/**
 * Hide alert message
 * @param {string} elementId - ID of alert element
 */
function hideAlert(elementId) {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        alertElement.style.display = 'none';
    }
}

// ========================================
// Form Handlers
// ========================================

/**
 * Handle login form submission
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    // Hide previous alerts
    hideAlert('login-error');
    hideAlert('login-success');
    
    // Get form data
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Disable submit button
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
        // Attempt login
        const result = await loginUser(email, password);
        
        if (result.success) {
            showAlert('login-success');
            
            // Handle "Remember Me"
            if (rememberMe) {
                localStorage.setItem('fitchallenge_remember_email', email);
            }
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '../src/index.html';
            }, AUTH_CONFIG.REDIRECT_DELAY);
        } else {
            showAlert('login-error', result.message);
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    } catch (error) {
        showAlert('login-error', 'An unexpected error occurred');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Handle signup form submission
 */
async function handleSignupSubmit(event) {
    event.preventDefault();
    
    // Hide previous alerts
    hideAlert('signup-error');
    hideAlert('signup-success');
    
    // Get form data
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const acceptTerms = document.getElementById('accept-terms').checked;
    
    // Check terms acceptance
    if (!acceptTerms) {
        showAlert('signup-error', 'You must accept the Terms of Service');
        return;
    }
    
    // Disable submit button
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';
    
    try {
        // Attempt registration
        const result = await registerUser({
            name,
            email,
            password,
            confirmPassword
        });
        
        if (result.success) {
            showAlert('signup-success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '../src/index.html';
            }, AUTH_CONFIG.REDIRECT_DELAY);
        } else {
            showAlert('signup-error', result.message);
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    } catch (error) {
        showAlert('signup-error', 'An unexpected error occurred');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// ========================================
// Tab Switching
// ========================================

/**
 * Handle tab switching between login and signup
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            if (targetTab === 'login') {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            } else {
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    });
}

// ========================================
// Password Toggle
// ========================================

/**
 * Initialize password visibility toggle buttons
 */
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                `;
            } else {
                input.type = 'password';
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
            }
        });
    });
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize authentication system
 */
function initializeAuth() {
    // Initialize demo users
    initializeDefaultUsers();
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize password toggles
    initializePasswordToggles();
    
    // Attach form handlers
    const loginFormElement = document.getElementById('login-form-element');
    const signupFormElement = document.getElementById('signup-form-element');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLoginSubmit);
    }
    
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignupSubmit);
    }
    
    // Pre-fill email if "Remember Me" was checked
    const rememberedEmail = localStorage.getItem('fitchallenge_remember_email');
    if (rememberedEmail) {
        const emailInput = document.getElementById('login-email');
        if (emailInput) {
            emailInput.value = rememberedEmail;
            document.getElementById('remember-me').checked = true;
        }
    }
    
    console.log('✅ Authentication system initialized');
    console.log('📧 Demo accounts available:');
    console.log('   - demo@fitchallenge.com / Demo1234');
    console.log('   - john@example.com / Athlete123');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Export main functions
export {
    loginUser,
    registerUser,
    logoutUser,
    getCurrentUser,
    isLoggedIn,
    requireAuth
};