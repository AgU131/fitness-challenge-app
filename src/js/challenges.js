// ========================================
// CHALLENGE.JS - Challenge Management Module
// Handles challenge listing, joining, and progress tracking
// ========================================

import { getCurrentUser, isLoggedIn } from './auth.js';
import { getStravaActivities, getFitbitDailyActivity } from './apiHandler.js';

// ========================================
// Constants & Configuration
// ========================================

const CHALLENGE_CONFIG = {
    STORAGE_KEY: 'fitchallenge_challenges',
    USER_CHALLENGES_KEY: 'fitchallenge_user_challenges',
    CHALLENGE_PROGRESS_KEY: 'fitchallenge_progress',
    MAX_ACTIVE_CHALLENGES: 5
};

// Challenge categories
const CHALLENGE_CATEGORIES = {
    RUNNING: 'running',
    YOGA: 'yoga',
    STRENGTH: 'strength',
    HIIT: 'hiit',
    CYCLING: 'cycling',
    SWIMMING: 'swimming'
};

// Challenge difficulty levels
const DIFFICULTY_LEVELS = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
};

// ========================================
// Sample Challenge Data
// ========================================

/**
 * Initialize default challenges in localStorage
 */
function initializeDefaultChallenges() {
    const challenges = getChallenges();
    
    if (challenges.length === 0) {
        const defaultChallenges = [
            {
                id: '1',
                title: '30-Day Running Challenge',
                category: CHALLENGE_CATEGORIES.RUNNING,
                difficulty: DIFFICULTY_LEVELS.BEGINNER,
                duration: 30,
                description: 'Build your running endurance from scratch. Start with 10 minutes and work your way up to 30-minute continuous runs.',
                imageUrl: '../src/images/placeholder-workout.jpg',
                participants: 2453,
                goals: {
                    totalDistance: 50, // km
                    totalWorkouts: 20,
                    avgPace: 6.5 // min/km
                },
                rewards: {
                    points: 500,
                    badge: '30-Day Runner',
                    achievements: ['First Mile', 'Marathon Ready', 'Consistent Runner']
                },
                createdAt: '2024-01-01T00:00:00Z',
                featured: true
            },
            {
                id: '2',
                title: 'Yoga Flow 14-Day',
                category: CHALLENGE_CATEGORIES.YOGA,
                difficulty: DIFFICULTY_LEVELS.BEGINNER,
                duration: 14,
                description: 'Improve flexibility and mindfulness with daily yoga sessions. Perfect for beginners looking to establish a consistent practice.',
                imageUrl: '../src/images/placeholder-workout.jpg',
                participants: 1892,
                goals: {
                    totalSessions: 14,
                    totalMinutes: 280
                },
                rewards: {
                    points: 300,
                    badge: 'Zen Master',
                    achievements: ['First Flow', 'Flexible Warrior']
                },
                createdAt: '2024-01-05T00:00:00Z',
                featured: true
            },
            {
                id: '3',
                title: 'Strength Builder 60-Day',
                category: CHALLENGE_CATEGORIES.STRENGTH,
                difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
                duration: 60,
                description: 'Build lean muscle and increase your overall strength with progressive resistance training. Includes nutrition guidance.',
                imageUrl: '../src/images/placeholder-workout.jpg',
                participants: 3721,
                goals: {
                    totalWorkouts: 40,
                    totalSets: 480,
                    weightLifted: 50000 // kg
                },
                rewards: {
                    points: 1000,
                    badge: 'Iron Warrior',
                    achievements: ['Strength Foundation', 'Progressive Overload', 'Muscle Builder']
                },
                createdAt: '2024-01-10T00:00:00Z',
                featured: true
            },
            {
                id: '4',
                title: 'HIIT Burn 30-Day',
                category: CHALLENGE_CATEGORIES.HIIT,
                difficulty: DIFFICULTY_LEVELS.ADVANCED,
                duration: 30,
                description: 'High-intensity interval training to maximize calorie burn and improve cardiovascular fitness. Not for the faint of heart!',
                imageUrl: '../src/images/placeholder-workout.jpg',
                participants: 1234,
                goals: {
                    totalWorkouts: 20,
                    caloriesBurned: 10000,
                    totalMinutes: 400
                },
                rewards: {
                    points: 800,
                    badge: 'HIIT Champion',
                    achievements: ['Intensity Master', 'Cardio King']
                },
                createdAt: '2024-01-15T00:00:00Z',
                featured: false
            },
            {
                id: '5',
                title: 'Cycling Endurance 30-Day',
                category: CHALLENGE_CATEGORIES.CYCLING,
                difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
                duration: 30,
                description: 'Build your cycling stamina with progressive distance goals. Suitable for outdoor or indoor cycling enthusiasts.',
                imageUrl: '../src/images/placeholder-workout.jpg',
                participants: 987,
                goals: {
                    totalDistance: 300, // km
                    totalRides: 15,
                    elevationGain: 2000 // meters
                },
                rewards: {
                    points: 600,
                    badge: 'Cycling Pro',
                    achievements: ['Century Rider', 'Hill Climber']
                },
                createdAt: '2024-01-20T00:00:00Z',
                featured: false
            }
        ];
        
        localStorage.setItem(CHALLENGE_CONFIG.STORAGE_KEY, JSON.stringify(defaultChallenges));
        console.log('✅ Default challenges initialized');
    }
}

// ========================================
// Challenge CRUD Operations
// ========================================

/**
 * Get all available challenges
 * @returns {Array} Array of challenge objects
 */
export function getChallenges() {
    try {
        const challengesJson = localStorage.getItem(CHALLENGE_CONFIG.STORAGE_KEY);
        return challengesJson ? JSON.parse(challengesJson) : [];
    } catch (error) {
        console.error('Error reading challenges:', error);
        return [];
    }
}

/**
 * Get challenge by ID
 * @param {string} challengeId - Challenge ID
 * @returns {Object|null} Challenge object or null
 */
export function getChallengeById(challengeId) {
    const challenges = getChallenges();
    return challenges.find(c => c.id === challengeId) || null;
}

/**
 * Get challenges by category
 * @param {string} category - Challenge category
 * @returns {Array} Filtered challenges
 */
export function getChallengesByCategory(category) {
    const challenges = getChallenges();
    if (category === 'all') return challenges;
    return challenges.filter(c => c.category === category);
}

/**
 * Get challenges by difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Filtered challenges
 */
export function getChallengesByDifficulty(difficulty) {
    const challenges = getChallenges();
    if (difficulty === 'all') return challenges;
    return challenges.filter(c => c.difficulty === difficulty);
}

/**
 * Get featured challenges
 * @param {number} limit - Number of challenges to return
 * @returns {Array} Featured challenges
 */
export function getFeaturedChallenges(limit = 3) {
    const challenges = getChallenges();
    return challenges
        .filter(c => c.featured)
        .sort((a, b) => b.participants - a.participants)
        .slice(0, limit);
}

// ========================================
// User Challenge Management
// ========================================

/**
 * Get user's active challenges
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Array} Array of user challenge objects
 */
export function getUserChallenges(userId = null) {
    try {
        const user = userId || getCurrentUser()?.id;
        if (!user) return [];
        
        const userChallengesJson = localStorage.getItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY);
        const allUserChallenges = userChallengesJson ? JSON.parse(userChallengesJson) : {};
        
        return allUserChallenges[user] || [];
    } catch (error) {
        console.error('Error reading user challenges:', error);
        return [];
    }
}

/**
 * Check if user has joined a specific challenge
 * @param {string} challengeId - Challenge ID
 * @param {string} userId - User ID (optional)
 * @returns {boolean} True if user has joined
 */
export function hasJoinedChallenge(challengeId, userId = null) {
    const userChallenges = getUserChallenges(userId);
    return userChallenges.some(uc => uc.challengeId === challengeId);
}

/**
 * Join a challenge
 * @param {string} challengeId - Challenge ID to join
 * @returns {Object} Result { success, message, userChallenge }
 * 
 * @example
 * const result = await joinChallenge('1');
 * if (result.success) {
 *   console.log('Joined challenge!', result.userChallenge);
 * }
 */
export async function joinChallenge(challengeId) {
    try {
        // Check if user is logged in
        if (!isLoggedIn()) {
            return {
                success: false,
                message: 'You must be logged in to join challenges'
            };
        }
        
        const user = getCurrentUser();
        const challenge = getChallengeById(challengeId);
        
        if (!challenge) {
            return {
                success: false,
                message: 'Challenge not found'
            };
        }
        
        // Check if already joined
        if (hasJoinedChallenge(challengeId)) {
            return {
                success: false,
                message: 'You have already joined this challenge'
            };
        }
        
        // Check max active challenges
        const userChallenges = getUserChallenges();
        const activeChallenges = userChallenges.filter(uc => uc.status === 'active');
        
        if (activeChallenges.length >= CHALLENGE_CONFIG.MAX_ACTIVE_CHALLENGES) {
            return {
                success: false,
                message: `You can only have ${CHALLENGE_CONFIG.MAX_ACTIVE_CHALLENGES} active challenges at a time`
            };
        }
        
        // Create user challenge entry
        const userChallenge = {
            id: `${user.id}_${challengeId}_${Date.now()}`,
            userId: user.id,
            challengeId: challengeId,
            startDate: new Date().toISOString(),
            endDate: calculateEndDate(challenge.duration),
            status: 'active', // active, completed, abandoned
            progress: {
                currentDay: 1,
                totalDays: challenge.duration,
                completedWorkouts: 0,
                totalWorkouts: challenge.goals.totalWorkouts || challenge.duration,
                ...initializeChallengeProgress(challenge)
            },
            joinedAt: new Date().toISOString()
        };
        
        // Save user challenge
        const userChallengesJson = localStorage.getItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY);
        const allUserChallenges = userChallengesJson ? JSON.parse(userChallengesJson) : {};
        
        if (!allUserChallenges[user.id]) {
            allUserChallenges[user.id] = [];
        }
        
        allUserChallenges[user.id].push(userChallenge);
        localStorage.setItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY, JSON.stringify(allUserChallenges));
        
        // Update challenge participants count
        updateChallengeParticipants(challengeId, 1);
        
        console.log('✅ Joined challenge:', challenge.title);
        
        return {
            success: true,
            message: `Successfully joined ${challenge.title}!`,
            userChallenge: userChallenge
        };
        
    } catch (error) {
        console.error('Error joining challenge:', error);
        return {
            success: false,
            message: 'An error occurred while joining the challenge'
        };
    }
}

/**
 * Leave/abandon a challenge
 * @param {string} challengeId - Challenge ID to leave
 * @returns {Object} Result { success, message }
 */
export function leaveChallenge(challengeId) {
    try {
        if (!isLoggedIn()) {
            return { success: false, message: 'You must be logged in' };
        }
        
        const user = getCurrentUser();
        const userChallengesJson = localStorage.getItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY);
        const allUserChallenges = userChallengesJson ? JSON.parse(userChallengesJson) : {};
        
        if (!allUserChallenges[user.id]) {
            return { success: false, message: 'Challenge not found' };
        }
        
        // Find and update challenge status
        const userChallenges = allUserChallenges[user.id];
        const challengeIndex = userChallenges.findIndex(uc => uc.challengeId === challengeId);
        
        if (challengeIndex === -1) {
            return { success: false, message: 'You have not joined this challenge' };
        }
        
        userChallenges[challengeIndex].status = 'abandoned';
        userChallenges[challengeIndex].endDate = new Date().toISOString();
        
        localStorage.setItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY, JSON.stringify(allUserChallenges));
        
        // Update challenge participants count
        updateChallengeParticipants(challengeId, -1);
        
        return { success: true, message: 'Challenge abandoned' };
        
    } catch (error) {
        console.error('Error leaving challenge:', error);
        return { success: false, message: 'An error occurred' };
    }
}

// ========================================
// Progress Tracking
// ========================================

/**
 * Initialize challenge progress based on challenge goals
 * @param {Object} challenge - Challenge object
 * @returns {Object} Initial progress object
 */
function initializeChallengeProgress(challenge) {
    const progress = {};
    
    if (challenge.goals.totalDistance) {
        progress.currentDistance = 0;
        progress.totalDistance = challenge.goals.totalDistance;
    }
    
    if (challenge.goals.caloriesBurned) {
        progress.currentCalories = 0;
        progress.totalCalories = challenge.goals.caloriesBurned;
    }
    
    if (challenge.goals.totalMinutes) {
        progress.currentMinutes = 0;
        progress.totalMinutes = challenge.goals.totalMinutes;
    }
    
    if (challenge.goals.totalSessions) {
        progress.currentSessions = 0;
        progress.totalSessions = challenge.goals.totalSessions;
    }
    
    return progress;
}

/**
 * Update challenge progress
 * @param {string} challengeId - Challenge ID
 * @param {Object} progressData - Progress data to update
 * @returns {Object} Result { success, message, progress }
 * 
 * @example
 * updateChallengeProgress('1', {
 *   distance: 5.5,
 *   calories: 450,
 *   minutes: 30,
 *   workoutCompleted: true
 * });
 */
export function updateChallengeProgress(challengeId, progressData) {
    try {
        if (!isLoggedIn()) {
            return { success: false, message: 'You must be logged in' };
        }
        
        const user = getCurrentUser();
        const userChallengesJson = localStorage.getItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY);
        const allUserChallenges = userChallengesJson ? JSON.parse(userChallengesJson) : {};
        
        if (!allUserChallenges[user.id]) {
            return { success: false, message: 'Challenge not found' };
        }
        
        const userChallenges = allUserChallenges[user.id];
        const challengeIndex = userChallenges.findIndex(uc => uc.challengeId === challengeId);
        
        if (challengeIndex === -1) {
            return { success: false, message: 'You have not joined this challenge' };
        }
        
        const userChallenge = userChallenges[challengeIndex];
        
        // Update progress
        if (progressData.distance) {
            userChallenge.progress.currentDistance = 
                (userChallenge.progress.currentDistance || 0) + progressData.distance;
        }
        
        if (progressData.calories) {
            userChallenge.progress.currentCalories = 
                (userChallenge.progress.currentCalories || 0) + progressData.calories;
        }
        
        if (progressData.minutes) {
            userChallenge.progress.currentMinutes = 
                (userChallenge.progress.currentMinutes || 0) + progressData.minutes;
        }
        
        if (progressData.workoutCompleted) {
            userChallenge.progress.completedWorkouts++;
            userChallenge.progress.currentDay = 
                Math.min(userChallenge.progress.currentDay + 1, userChallenge.progress.totalDays);
        }
        
        // Check if challenge is completed
        const completionPercentage = calculateChallengeProgress(userChallenge);
        if (completionPercentage >= 100) {
            userChallenge.status = 'completed';
            userChallenge.completedAt = new Date().toISOString();
        }
        
        // Save updated data
        localStorage.setItem(CHALLENGE_CONFIG.USER_CHALLENGES_KEY, JSON.stringify(allUserChallenges));
        
        return {
            success: true,
            message: 'Progress updated',
            progress: userChallenge.progress,
            completionPercentage: completionPercentage
        };
        
    } catch (error) {
        console.error('Error updating progress:', error);
        return { success: false, message: 'An error occurred' };
    }
}

/**
 * Calculate challenge completion percentage
 * @param {Object} userChallenge - User challenge object
 * @returns {number} Completion percentage (0-100)
 * 
 * @example
 * const percentage = calculateChallengeProgress(userChallenge);
 * console.log(`${percentage}% complete`);
 */
export function calculateChallengeProgress(userChallenge) {
    const progress = userChallenge.progress;
    let totalPercentage = 0;
    let criteriaCount = 0;
    
    // Calculate percentage for each goal
    if (progress.totalWorkouts) {
        totalPercentage += (progress.completedWorkouts / progress.totalWorkouts) * 100;
        criteriaCount++;
    }
    
    if (progress.totalDistance) {
        totalPercentage += (progress.currentDistance / progress.totalDistance) * 100;
        criteriaCount++;
    }
    
    if (progress.totalCalories) {
        totalPercentage += (progress.currentCalories / progress.totalCalories) * 100;
        criteriaCount++;
    }
    
    if (progress.totalMinutes) {
        totalPercentage += (progress.currentMinutes / progress.totalMinutes) * 100;
        criteriaCount++;
    }
    
    if (progress.totalSessions) {
        totalPercentage += (progress.currentSessions / progress.totalSessions) * 100;
        criteriaCount++;
    }
    
    // Return average percentage
    return criteriaCount > 0 ? Math.min(Math.round(totalPercentage / criteriaCount), 100) : 0;
}

/**
 * Sync challenge progress with external APIs (Strava, Fitbit)
 * @param {string} challengeId - Challenge ID
 * @returns {Promise<Object>} Result { success, message, syncedData }
 */
export async function syncChallengeProgress(challengeId) {
    try {
        const challenge = getChallengeById(challengeId);
        if (!challenge) {
            return { success: false, message: 'Challenge not found' };
        }
        
        let syncedData = {};
        
        // Sync with Strava for running/cycling challenges
        if (challenge.category === CHALLENGE_CATEGORIES.RUNNING || 
            challenge.category === CHALLENGE_CATEGORIES.CYCLING) {
            try {
                const activities = await getStravaActivities({ per_page: 10 });
                
                // Calculate totals from recent activities
                const totalDistance = activities.reduce((sum, act) => sum + (act.distance / 1000), 0);
                const totalCalories = activities.reduce((sum, act) => sum + (act.calories || 0), 0);
                
                syncedData.strava = {
                    distance: totalDistance,
                    calories: totalCalories,
                    activities: activities.length
                };
            } catch (error) {
                console.log('Strava sync skipped:', error.message);
            }
        }
        
        // Sync with Fitbit for general fitness data
        try {
            const fitbitData = await getFitbitDailyActivity();
            
            syncedData.fitbit = {
                steps: fitbitData.summary?.steps || 0,
                calories: fitbitData.summary?.caloriesOut || 0,
                distance: fitbitData.summary?.distances?.[0]?.distance || 0
            };
        } catch (error) {
            console.log('Fitbit sync skipped:', error.message);
        }
        
        // Update challenge progress with synced data
        if (Object.keys(syncedData).length > 0) {
            const progressUpdate = {
                distance: syncedData.strava?.distance || syncedData.fitbit?.distance || 0,
                calories: syncedData.strava?.calories || syncedData.fitbit?.calories || 0
            };
            
            updateChallengeProgress(challengeId, progressUpdate);
            
            return {
                success: true,
                message: 'Progress synced successfully',
                syncedData: syncedData
            };
        }
        
        return {
            success: false,
            message: 'No data available to sync. Please connect your fitness apps.'
        };
        
    } catch (error) {
        console.error('Error syncing progress:', error);
        return {
            success: false,
            message: 'An error occurred while syncing'
        };
    }
}

// ========================================
// UI Helper Functions
// ========================================

/**
 * Generate progress bar HTML
 * @param {number} percentage - Completion percentage (0-100)
 * @param {string} label - Label text (optional)
 * @returns {string} HTML string for progress bar
 * 
 * @example
 * const html = generateProgressBar(65, 'Challenge Progress');
 * container.innerHTML = html;
 */
export function generateProgressBar(percentage, label = '') {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    
    return `
        <div class="progress-container">
            ${label ? `<div class="progress-label">${label}</div>` : ''}
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${safePercentage}%">
                    <span class="progress-text">${safePercentage}%</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render challenge card HTML
 * @param {Object} challenge - Challenge object
 * @param {boolean} showJoinButton - Whether to show join button
 * @returns {string} HTML string for challenge card
 */
export function renderChallengeCard(challenge, showJoinButton = true) {
    const hasJoined = hasJoinedChallenge(challenge.id);
    const buttonText = hasJoined ? 'View Progress' : 'Join Challenge';
    const buttonClass = hasJoined ? 'btn-secondary' : 'btn-primary';
    
    return `
        <article class="challenge-card" data-challenge-id="${challenge.id}">
            <div class="challenge-image">
                <img src="${challenge.imageUrl}" alt="${challenge.title}">
                ${challenge.featured ? '<div class="challenge-badge">Popular</div>' : ''}
            </div>
            <div class="challenge-content">
                <div class="challenge-header">
                    <span class="challenge-category">${challenge.category}</span>
                    <span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
                </div>
                <h3 class="challenge-title">${challenge.title}</h3>
                <p class="challenge-description">${challenge.description}</p>
                
                <div class="challenge-stats">
                    <div class="stat-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                        <span>${challenge.duration} Days</span>
                    </div>
                    <div class="stat-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                        <span>${challenge.participants.toLocaleString()} joined</span>
                    </div>
                </div>

                ${showJoinButton ? `
                    <button class="btn ${buttonClass} btn-block join-challenge-btn" 
                            data-challenge-id="${challenge.id}">
                        ${buttonText}
                    </button>
                ` : ''}
            </div>
        </article>
    `;
}

/**
 * Load featured challenges into container
 * @param {HTMLElement} container - Container element
 * @param {number} limit - Number of challenges to load
 */
export async function loadFeaturedChallenges(container, limit = 3) {
    if (!container) return;
    
    try {
        const challenges = getFeaturedChallenges(limit);
        
        if (challenges.length === 0) {
            container.innerHTML = '<p class="no-challenges">No challenges available at the moment.</p>';
            return;
        }
        
        container.innerHTML = challenges.map(challenge => 
            renderChallengeCard(challenge, true)
        ).join('');
        
        // Attach event listeners to join buttons
        const joinButtons = container.querySelectorAll('.join-challenge-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', handleJoinButtonClick);
        });
        
    } catch (error) {
        console.error('Error loading featured challenges:', error);
        container.innerHTML = '<p class="error-message">Error loading challenges</p>';
    }
}

/**
 * Handle join button click
 * @param {Event} event - Click event
 */
async function handleJoinButtonClick(event) {
    const button = event.target;
    const challengeId = button.dataset.challengeId;
    
    // Check if already joined
    if (hasJoinedChallenge(challengeId)) {
        window.location.href = `../profile/index.html?tab=challenges`;
        return;
    }
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        alert('Please login to join challenges');
        window.location.href = '../login/index.html';
        return;
    }
    
    // Disable button during processing
    button.disabled = true;
    button.textContent = 'Joining...';
    
    // Join challenge
    const result = await joinChallenge(challengeId);
    
    if (result.success) {
        button.textContent = 'Joined!';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
        
        // Show success message
        setTimeout(() => {
            button.textContent = 'View Progress';
            alert(result.message);
        }, 1000);
    } else {
        button.disabled = false;
        button.textContent = 'Join Challenge';
        alert(result.message);
    }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate end date based on duration
 * @param {number} durationDays - Duration in days
 * @returns {string} ISO date string
 */
function calculateEndDate(durationDays) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate.toISOString();
}

/**
 * Update challenge participants count
 * @param {string} challengeId - Challenge ID
 * @param {number} increment - Number to add/subtract
 */
function updateChallengeParticipants(challengeId, increment) {
    try {
        const challenges = getChallenges();
        const challengeIndex = challenges.findIndex(c => c.id === challengeId);
        
        if (challengeIndex !== -1) {
            challenges[challengeIndex].participants += increment;
            localStorage.setItem(CHALLENGE_CONFIG.STORAGE_KEY, JSON.stringify(challenges));
        }
    } catch (error) {
        console.error('Error updating participants:', error);
    }
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize challenge system
 */
function initializeChallenges() {
    initializeDefaultChallenges();
    console.log('✅ Challenge system initialized');
}

// Initialize when module loads
initializeChallenges();

// Export main functions
export {
    getChallenges,
    getChallengeById,
    getChallengesByCategory,
    getChallengesByDifficulty,
    getFeaturedChallenges,
    getUserChallenges,
    hasJoinedChallenge,
    joinChallenge,
    leaveChallenge,
    updateChallengeProgress,
    calculateChallengeProgress,
    syncChallengeProgress,
    generateProgressBar,
    renderChallengeCard,
    loadFeaturedChallenges
};