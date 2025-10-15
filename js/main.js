// ========================================
// MAIN.JS - Fitness Challenge & Workout Social Network
// ========================================

// Import necessary modules
import { loadHeaderFooter } from './modules/utils.js';
import { setupNavigation } from './modules/router.js';
import { loadFeaturedChallenges } from './modules/challenge.js';

// ========================================
// Configuration & Constants
// ========================================

const MOTIVATIONAL_MESSAGES = [
    {
        title: "Transform Your Fitness Journey",
        subtitle: "Join thousands of athletes taking on challenges, sharing workouts, and pushing their limits together."
    },
    {
        title: "Your Body Can Stand Almost Anything",
        subtitle: "It's your mind you have to convince. Start your transformation today with our supportive community."
    },
    {
        title: "The Only Bad Workout Is the One That Didn't Happen",
        subtitle: "Take on daily challenges, track your progress, and celebrate every milestone with fellow athletes."
    },
    {
        title: "Success Is What Comes After You Stop Making Excuses",
        subtitle: "Join our community of determined individuals who are crushing their fitness goals every single day."
    },
    {
        title: "Push Yourself Because No One Else Is Going to Do It",
        subtitle: "Connect with like-minded athletes, share your journey, and achieve greatness together."
    },
    {
        title: "Great Things Never Come From Comfort Zones",
        subtitle: "Step out, challenge yourself, and discover what you're truly capable of achieving."
    },
    {
        title: "Dream It. Believe It. Build It",
        subtitle: "Set your goals, stay committed, and watch as you transform into the best version of yourself."
    }
];

// ========================================
// Hero Section - Motivational Messages
// ========================================

/**
 * Display a random motivational message in the hero section
 * This function selects a random message from the MOTIVATIONAL_MESSAGES array
 * and updates the hero title and subtitle accordingly
 */
function displayMotivationalMessage() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    // Check if hero elements exist on the page
    if (!heroTitle || !heroSubtitle) {
        return; // Exit if we're not on the home page
    }
    
    // Get a random message from the array
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    const message = MOTIVATIONAL_MESSAGES[randomIndex];
    
    // Add fade-out animation
    heroTitle.style.opacity = '0';
    heroSubtitle.style.opacity = '0';
    
    // Wait for fade-out, then change content and fade-in
    setTimeout(() => {
        heroTitle.textContent = message.title;
        heroSubtitle.textContent = message.subtitle;
        
        heroTitle.style.opacity = '1';
        heroSubtitle.style.opacity = '1';
    }, 300);
}

/**
 * Rotate motivational messages every 8 seconds
 * This creates a dynamic hero section that keeps users engaged
 */
function startMessageRotation() {
    const heroTitle = document.querySelector('.hero-title');
    
    // Only start rotation if hero section exists (home page)
    if (heroTitle) {
        // Add transition styles for smooth animations
        heroTitle.style.transition = 'opacity 0.3s ease';
        document.querySelector('.hero-subtitle').style.transition = 'opacity 0.3s ease';
        
        // Change message every 8 seconds
        setInterval(displayMotivationalMessage, 8000);
    }
}

// ========================================
// Mobile Menu Toggle
// ========================================

/**
 * Initialize mobile menu functionality
 * Handles opening/closing the mobile navigation menu
 */
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!menuToggle || !mainNav) return;
    
    menuToggle.addEventListener('click', () => {
        // Toggle 'active' class on navigation
        mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav') && !e.target.closest('.mobile-menu-toggle')) {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
    
    // Close menu when clicking on a nav link
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

// ========================================
// Smooth Scrolling
// ========================================

/**
 * Add smooth scrolling behavior to all internal links
 * Enhances user experience with animated scrolling
 */
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Don't prevent default for standalone hash links
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// Scroll Effects
// ========================================

/**
 * Add scroll-based effects like header shadow on scroll
 * Provides visual feedback as users navigate the page
 */
function initializeScrollEffects() {
    const header = document.querySelector('.site-header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove shadow based on scroll position
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Optional: Hide header on scroll down, show on scroll up
        // Uncomment the following code if you want this behavior:
       
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
      
        
        lastScroll = currentScroll;
    });
}

// ========================================
// Active Navigation State
// ========================================

/**
 * Highlight the current page in the navigation menu
 * Helps users understand their current location in the site
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        // Remove active class from all links
        link.classList.remove('active');
        
        // Get the link's href and compare with current path
        const linkPath = new URL(link.href).pathname;
        
        // Add active class to matching link
        if (currentPath === linkPath || 
            (currentPath.includes(linkPath) && linkPath !== '/')) {
            link.classList.add('active');
        }
    });
}

// ========================================
// Featured Challenges Display
// ========================================

/**
 * Load and display featured challenges on the home page
 * Dynamically populates the challenges grid with data
 */
async function initializeFeaturedChallenges() {
    const challengesContainer = document.getElementById('featured-challenges');
    
    if (!challengesContainer) return; // Not on home page
    
    try {
        // Show loading state
        challengesContainer.innerHTML = '<div class="loading-message">Loading challenges...</div>';
        
        // Load challenges from the module
        await loadFeaturedChallenges(challengesContainer);
        
    } catch (error) {
        console.error('Error loading featured challenges:', error);
        challengesContainer.innerHTML = `
            <div class="error-message">
                <p>Unable to load challenges at this time. Please try again later.</p>
            </div>
        `;
    }
}

// ========================================
// Loading Animation
// ========================================

/**
 * Show page loading state and hide when content is ready
 * Provides better user experience during page transitions
 */
function initializePageLoader() {
    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    });
}

// ========================================
// Form Validation Helpers
// ========================================

/**
 * Add real-time validation to forms if they exist on the page
 * Enhances user experience with immediate feedback
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Add validation on submit
        form.addEventListener('submit', (e) => {
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
        });
    });
}

// ========================================
// Intersection Observer for Animations
// ========================================

/**
 * Animate elements as they come into view
 * Creates engaging scroll-based animations
 */
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.category-card, .challenge-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ========================================
// Analytics Tracking (Placeholder)
// ========================================

/**
 * Track user interactions for analytics
 * This is a placeholder for future analytics integration
 */
function initializeAnalytics() {
    // Track button clicks
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent.trim();
            console.log('Button clicked:', buttonText);
            
            // TODO: Send to analytics service
            // analytics.track('button_click', { text: buttonText });
        });
    });
    
    // Track navigation
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            const linkText = e.target.textContent.trim();
            console.log('Navigation clicked:', linkText);
            
            // TODO: Send to analytics service
            // analytics.track('navigation_click', { page: linkText });
        });
    });
}

// ========================================
// Error Handling
// ========================================

/**
 * Global error handler for better debugging and user experience
 */
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
    
    // TODO: Send errors to logging service
    // logger.error(e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    // TODO: Send to logging service
    // logger.error(e.reason);
});

// ========================================
// Main Initialization
// ========================================

/**
 * Initialize all application features
 * This is the main entry point that runs when the DOM is ready
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing Fitness Challenge App...');
        
        // Load common components (header & footer)
        await loadHeaderFooter();
        console.log('✅ Header and Footer loaded');
        
        // Initialize navigation and routing
        setupNavigation();
        setActiveNavLink();
        console.log('✅ Navigation initialized');
        
        // Initialize mobile menu
        initializeMobileMenu();
        console.log('✅ Mobile menu initialized');
        
        // Initialize scroll effects
        initializeSmoothScroll();
        initializeScrollEffects();
        console.log('✅ Scroll effects initialized');
        
        // Initialize motivational message rotation (home page only)
        displayMotivationalMessage();
        startMessageRotation();
        console.log('✅ Motivational messages initialized');
        
        // Load featured challenges (home page only)
        await initializeFeaturedChallenges();
        console.log('✅ Featured challenges loaded');
        
        // Initialize animations
        initializeScrollAnimations();
        console.log('✅ Scroll animations initialized');
        
        // Initialize form validation
        initializeFormValidation();
        console.log('✅ Form validation initialized');
        
        // Initialize analytics tracking
        initializeAnalytics();
        console.log('✅ Analytics initialized');
        
        // Initialize page loader
        initializePageLoader();
        
        console.log('✨ App initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'global-error';
        errorMessage.innerHTML = `
            <p>⚠️ We're experiencing technical difficulties. Please refresh the page.</p>
        `;
        document.body.prepend(errorMessage);
    }
}

// ========================================
// App Entry Point
// ========================================

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Export functions for use in other modules if needed
export {
    displayMotivationalMessage,
    initializeMobileMenu,
    setActiveNavLink,
    initializeFeaturedChallenges
};