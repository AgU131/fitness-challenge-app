// ========================================
// CHALLENGES-FILTER.JS - Challenge Filtering System
// Handles filtering, sorting, and display of challenges
// ========================================

import {
    getChallenges,
    getChallengesByCategory,
    getChallengesByDifficulty,
    renderChallengeCard,
    hasJoinedChallenge,
    joinChallenge
} from './challenges.js';
import { isLoggedIn } from './auth.js';

// ========================================
// State Management
// ========================================

let currentFilters = {
    category: 'all',
    difficulty: 'all',
    duration: 'all',
    sort: 'popular'
};

// ========================================
// Filter Functions
// ========================================

/**
 * Apply all current filters to challenges
 * @returns {Array} Filtered challenges
 */
function applyFilters() {
    let challenges = getChallenges();

    // Filter by category
    if (currentFilters.category !== 'all') {
        challenges = challenges.filter(c => c.category === currentFilters.category);
    }

    // Filter by difficulty
    if (currentFilters.difficulty !== 'all') {
        challenges = challenges.filter(c => c.difficulty === currentFilters.difficulty);
    }

    // Filter by duration (treat selected value as minimum duration)
    if (currentFilters.duration !== 'all') {
        const duration = parseInt(currentFilters.duration);
        if (!isNaN(duration)) {
            challenges = challenges.filter(c => parseInt(c.duration) >= duration);
        }
    }

    // Sort challenges
    challenges = sortChallenges(challenges, currentFilters.sort);

    return challenges;
}

/**
 * Sort challenges based on criteria
 * @param {Array} challenges - Challenges to sort
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted challenges
 */
function sortChallenges(challenges, sortBy) {
    switch (sortBy) {
        case 'popular':
            return challenges.sort((a, b) => b.participants - a.participants);

        case 'newest':
            return challenges.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

        case 'participants':
            return challenges.sort((a, b) => b.participants - a.participants);

        case 'difficulty':
            const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
            return challenges.sort((a, b) =>
                difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
            );

        default:
            return challenges;
    }
}

// ========================================
// Display Functions
// ========================================

/**
 * Render challenges to the grid
 * @param {Array} challenges - Challenges to render
 */
function renderChallenges(challenges) {
    const grid = document.getElementById('challenges-grid');
    const emptyState = document.getElementById('empty-state');
    const challengeCount = document.getElementById('challenge-count');

    if (!grid) return;

    // Update count
    if (challengeCount) {
        challengeCount.textContent = `${challenges.length} challenge${challenges.length !== 1 ? 's' : ''} found`;
    }

    // Show empty state if no challenges
    if (challenges.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    // Hide empty state and show grid
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Render challenge cards
    grid.innerHTML = challenges.map(challenge =>
        renderChallengeCard(challenge, true)
    ).join('');

    // Attach event listeners
    attachEventListeners();
}

/**
 * Attach event listeners to challenge cards
 */
function attachEventListeners() {
    const joinButtons = document.querySelectorAll('.join-challenge-btn');

    joinButtons.forEach(button => {
        button.addEventListener('click', handleJoinChallenge);
    });
}

/**
 * Handle join challenge button click
 * @param {Event} event - Click event
 */
async function handleJoinChallenge(event) {
    const button = event.target;
    const challengeId = button.dataset.challengeId;

    // Check if already joined - redirect to progress
    if (hasJoinedChallenge(challengeId)) {
        window.location.href = '../profile/index.html?tab=challenges';
        return;
    }

    // Check if user is logged in
    if (!isLoggedIn()) {
        const shouldRedirect = confirm('You must be logged in to join challenges. Go to login page?');
        if (shouldRedirect) {
            window.location.href = '../login/index.html';
        }
        return;
    }

    // Disable button
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining...';

    try {
        const result = await joinChallenge(challengeId);

        if (result.success) {
            button.textContent = '✓ Joined!';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');

            // Show success message
            showNotification('Success', result.message, 'success');

            // Update button after delay
            setTimeout(() => {
                button.textContent = 'View Progress';
            }, 2000);
        } else {
            button.disabled = false;
            button.textContent = originalText;
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        button.disabled = false;
        button.textContent = originalText;
        showNotification('Error', 'An unexpected error occurred', 'error');
    }
}

/**
 * Show notification message
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// ========================================
// Filter Event Handlers
// ========================================

/**
 * Initialize filter event listeners
 */
function initializeFilters() {
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            updateDisplay();
        });
    }

    // Difficulty filter
    const difficultyFilter = document.getElementById('difficulty-filter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', (e) => {
            currentFilters.difficulty = e.target.value;
            updateDisplay();
        });
    }

    // Duration filter
    const durationFilter = document.getElementById('duration-filter');
    if (durationFilter) {
        durationFilter.addEventListener('change', (e) => {
            currentFilters.duration = e.target.value;
            updateDisplay();
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            updateDisplay();
        });
    }

    // Reset filters button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    // Mobile filter toggle
    const filterToggle = document.querySelector('.filter-toggle');
    const filtersContainer = document.querySelector('.filters-container');

    if (filterToggle && filtersContainer) {
        filterToggle.addEventListener('click', () => {
            filtersContainer.classList.toggle('active');
        });
    }
}

/**
 * Reset all filters to default
 */
function resetFilters() {
    currentFilters = {
        category: 'all',
        difficulty: 'all',
        duration: 'all',
        sort: 'popular'
    };

    // Reset select elements
    document.getElementById('category-filter').value = 'all';
    document.getElementById('difficulty-filter').value = 'all';
    document.getElementById('duration-filter').value = 'all';
    document.getElementById('sort-filter').value = 'popular';

    updateDisplay();
}

/**
 * Update challenge display with current filters
 */
function updateDisplay() {
    const filteredChallenges = applyFilters();
    renderChallenges(filteredChallenges);
}

// ========================================
// Search Functionality
// ========================================

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('challenge-search');

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();

                if (query === '') {
                    updateDisplay();
                    return;
                }

                const challenges = applyFilters();
                const searchResults = challenges.filter(c =>
                    c.title.toLowerCase().includes(query) ||
                    c.description.toLowerCase().includes(query) ||
                    c.category.toLowerCase().includes(query)
                );

                renderChallenges(searchResults);
            }, 300);
        });
    }
}

// ========================================
// URL Parameter Handling
// ========================================

/**
 * Load filters from URL parameters
 */
function loadFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    const category = urlParams.get('category');
    if (category) {
        currentFilters.category = category;
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) categoryFilter.value = category;
    }

    const difficulty = urlParams.get('difficulty');
    if (difficulty) {
        currentFilters.difficulty = difficulty;
        const difficultyFilter = document.getElementById('difficulty-filter');
        if (difficultyFilter) difficultyFilter.value = difficulty;
    }
}

/**
 * Update URL with current filters
 */
function updateURL() {
    const params = new URLSearchParams();

    if (currentFilters.category !== 'all') {
        params.set('category', currentFilters.category);
    }

    if (currentFilters.difficulty !== 'all') {
        params.set('difficulty', currentFilters.difficulty);
    }

    if (currentFilters.duration !== 'all') {
        params.set('duration', currentFilters.duration);
    }

    if (currentFilters.sort !== 'popular') {
        params.set('sort', currentFilters.sort);
    }

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the challenges page
 */
function initializeChallengesPage() {
    // Load filters from URL
    loadFiltersFromURL();

    // Initialize filters
    initializeFilters();

    // Initialize search
    initializeSearch();

    // Initial display
    updateDisplay();

    console.log('✅ Challenges page initialized');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChallengesPage);
} else {
    initializeChallengesPage();
}

// Export functions
export {
    applyFilters,
    sortChallenges,
    renderChallenges,
    resetFilters,
    showNotification
};