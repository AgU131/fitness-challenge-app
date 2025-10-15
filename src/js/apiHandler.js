// ========================================
// API HANDLER MODULE
// Manages all external API integrations for the Fitness Challenge App
// ========================================

// ========================================
// API Configuration & Constants
// ========================================

const API_CONFIG = {
    strava: {
        baseUrl: 'https://www.strava.com/api/v3',
        authUrl: 'https://www.strava.com/oauth/authorize',
        tokenUrl: 'https://www.strava.com/oauth/token',
        clientId: '', // TODO: Add your Strava Client ID
        clientSecret: '', // TODO: Add your Strava Client Secret
        redirectUri: window.location.origin + '/auth/callback'
    },
    nutritionix: {
        baseUrl: 'https://trackapi.nutritionix.com/v2',
        appId: '', // TODO: Add your Nutritionix App ID
        appKey: '' // TODO: Add your Nutritionix API Key
    },
    fitbit: {
        baseUrl: 'https://api.fitbit.com/1',
        authUrl: 'https://www.fitbit.com/oauth2/authorize',
        tokenUrl: 'https://api.fitbit.com/oauth2/token',
        clientId: '', // TODO: Add your Fitbit Client ID
        clientSecret: '', // TODO: Add your Fitbit Client Secret
        redirectUri: window.location.origin + '/auth/fitbit-callback'
    },
    youtube: {
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        apiKey: '' // TODO: Add your YouTube Data API Key
    }
};

// ========================================
// Utility Functions
// ========================================

/**
 * Generic fetch wrapper with error handling
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Parsed JSON response
 * @throws {Error} - If the request fails
 */
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `API Error: ${response.status} ${response.statusText}`
            );
        }

        // Parse and return JSON data
        const data = await response.json();
        return data;

    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
}

/**
 * Get access token from localStorage
 * @param {string} service - Service name (strava, fitbit, etc.)
 * @returns {string|null} - Access token or null
 */
function getAccessToken(service) {
    return localStorage.getItem(`${service}_access_token`);
}

/**
 * Save access token to localStorage
 * @param {string} service - Service name
 * @param {string} token - Access token
 */
function saveAccessToken(service, token) {
    localStorage.setItem(`${service}_access_token`, token);
}

/**
 * Build query string from object
 * @param {Object} params - Query parameters
 * @returns {string} - Query string
 */
function buildQueryString(params) {
    return Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

// ========================================
// STRAVA API INTEGRATION
// ========================================

/**
 * Get Strava OAuth authorization URL
 * @param {string} scope - Permission scope (default: 'activity:read_all')
 * @returns {string} - Authorization URL
 * 
 * @example
 * const authUrl = getStravaAuthUrl('activity:read_all,profile:read_all');
 * window.location.href = authUrl; // Redirect user to Strava login
 */
export function getStravaAuthUrl(scope = 'activity:read_all') {
    const params = {
        client_id: API_CONFIG.strava.clientId,
        redirect_uri: API_CONFIG.strava.redirectUri,
        response_type: 'code',
        scope: scope,
        approval_prompt: 'auto'
    };
    return `${API_CONFIG.strava.authUrl}?${buildQueryString(params)}`;
}

/**
 * Exchange Strava authorization code for access token
 * @param {string} code - Authorization code from callback
 * @returns {Promise<Object>} - Token data
 * 
 * @example
 * const tokenData = await exchangeStravaCode('authorization_code_here');
 * console.log(tokenData.access_token);
 */
export async function exchangeStravaCode(code) {
    const url = API_CONFIG.strava.tokenUrl;
    const body = {
        client_id: API_CONFIG.strava.clientId,
        client_secret: API_CONFIG.strava.clientSecret,
        code: code,
        grant_type: 'authorization_code'
    };

    const data = await fetchWithErrorHandling(url, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    saveAccessToken('strava', data.access_token);
    return data;
}

/**
 * Get athlete's activities from Strava
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.per_page - Activities per page (default: 30, max: 200)
 * @param {number} options.after - Unix timestamp to filter activities after
 * @param {number} options.before - Unix timestamp to filter activities before
 * @returns {Promise<Array>} - Array of activity objects
 * 
 * @example
 * const activities = await getStravaActivities({ per_page: 10 });
 * activities.forEach(activity => {
 *   console.log(`${activity.name}: ${activity.distance}m, ${activity.calories} cal`);
 * });
 */
export async function getStravaActivities(options = {}) {
    const token = getAccessToken('strava');
    if (!token) {
        throw new Error('Strava access token not found. Please authenticate first.');
    }

    const params = {
        page: options.page || 1,
        per_page: options.per_page || 30,
        after: options.after,
        before: options.before
    };

    const url = `${API_CONFIG.strava.baseUrl}/athlete/activities?${buildQueryString(params)}`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

/**
 * Get detailed activity data from Strava
 * @param {number} activityId - Activity ID
 * @returns {Promise<Object>} - Activity details including heart rate zones, calories, etc.
 * 
 * @example
 * const activity = await getStravaActivity(1234567890);
 * console.log({
 *   distance: activity.distance,
 *   calories: activity.calories,
 *   avgHeartRate: activity.average_heartrate,
 *   maxHeartRate: activity.max_heartrate
 * });
 */
export async function getStravaActivity(activityId) {
    const token = getAccessToken('strava');
    if (!token) {
        throw new Error('Strava access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.strava.baseUrl}/activities/${activityId}`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

/**
 * Get athlete profile from Strava
 * @returns {Promise<Object>} - Athlete profile data
 * 
 * @example
 * const athlete = await getStravaAthlete();
 * console.log(`${athlete.firstname} ${athlete.lastname}`);
 */
export async function getStravaAthlete() {
    const token = getAccessToken('strava');
    if (!token) {
        throw new Error('Strava access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.strava.baseUrl}/athlete`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

// ========================================
// NUTRITIONIX API INTEGRATION
// ========================================

/**
 * Search for food items in Nutritionix database
 * @param {string} query - Search query (food name)
 * @returns {Promise<Array>} - Array of food items with nutritional data
 * 
 * @example
 * const foods = await searchNutritionixFood('chicken breast');
 * foods.forEach(food => {
 *   console.log(`${food.food_name}: ${food.nf_calories} cal, ${food.nf_protein}g protein`);
 * });
 */
export async function searchNutritionixFood(query) {
    if (!API_CONFIG.nutritionix.appId || !API_CONFIG.nutritionix.appKey) {
        throw new Error('Nutritionix API credentials not configured');
    }

    const url = `${API_CONFIG.nutritionix.baseUrl}/search/instant?query=${encodeURIComponent(query)}`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'x-app-id': API_CONFIG.nutritionix.appId,
            'x-app-key': API_CONFIG.nutritionix.appKey
        }
    });
}

/**
 * Get detailed nutritional information for a specific food
 * @param {string} foodName - Food name or natural language query
 * @returns {Promise<Object>} - Detailed nutrition data
 * 
 * @example
 * const nutrition = await getNutritionixFoodDetails('1 cup of rice');
 * console.log({
 *   calories: nutrition.foods[0].nf_calories,
 *   protein: nutrition.foods[0].nf_protein,
 *   carbs: nutrition.foods[0].nf_total_carbohydrate,
 *   fat: nutrition.foods[0].nf_total_fat,
 *   servingSize: nutrition.foods[0].serving_qty + ' ' + nutrition.foods[0].serving_unit
 * });
 */
export async function getNutritionixFoodDetails(foodName) {
    if (!API_CONFIG.nutritionix.appId || !API_CONFIG.nutritionix.appKey) {
        throw new Error('Nutritionix API credentials not configured');
    }

    const url = `${API_CONFIG.nutritionix.baseUrl}/natural/nutrients`;
    
    return await fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
            'x-app-id': API_CONFIG.nutritionix.appId,
            'x-app-key': API_CONFIG.nutritionix.appKey
        },
        body: JSON.stringify({ query: foodName })
    });
}

/**
 * Get nutritional data for exercise/activity
 * @param {string} exercise - Exercise description (e.g., "running for 30 minutes")
 * @returns {Promise<Object>} - Exercise calories and duration
 * 
 * @example
 * const exercise = await getNutritionixExercise('running for 30 minutes');
 * console.log(`Burned ${exercise.exercises[0].nf_calories} calories`);
 */
export async function getNutritionixExercise(exercise) {
    if (!API_CONFIG.nutritionix.appId || !API_CONFIG.nutritionix.appKey) {
        throw new Error('Nutritionix API credentials not configured');
    }

    const url = `${API_CONFIG.nutritionix.baseUrl}/natural/exercise`;
    
    return await fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
            'x-app-id': API_CONFIG.nutritionix.appId,
            'x-app-key': API_CONFIG.nutritionix.appKey
        },
        body: JSON.stringify({ query: exercise })
    });
}

// ========================================
// FITBIT API INTEGRATION
// ========================================

/**
 * Get Fitbit OAuth authorization URL
 * @param {string} scope - Permission scope
 * @returns {string} - Authorization URL
 * 
 * @example
 * const authUrl = getFitbitAuthUrl('activity heartrate sleep');
 * window.location.href = authUrl;
 */
export function getFitbitAuthUrl(scope = 'activity heartrate sleep') {
    const params = {
        client_id: API_CONFIG.fitbit.clientId,
        redirect_uri: API_CONFIG.fitbit.redirectUri,
        response_type: 'code',
        scope: scope
    };
    return `${API_CONFIG.fitbit.authUrl}?${buildQueryString(params)}`;
}

/**
 * Exchange Fitbit authorization code for access token
 * @param {string} code - Authorization code from callback
 * @returns {Promise<Object>} - Token data
 * 
 * @example
 * const tokenData = await exchangeFitbitCode('authorization_code_here');
 * console.log(tokenData.access_token);
 */
export async function exchangeFitbitCode(code) {
    const credentials = btoa(`${API_CONFIG.fitbit.clientId}:${API_CONFIG.fitbit.clientSecret}`);
    
    const url = API_CONFIG.fitbit.tokenUrl;
    const body = new URLSearchParams({
        client_id: API_CONFIG.fitbit.clientId,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: API_CONFIG.fitbit.redirectUri
    });

    const data = await fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    saveAccessToken('fitbit', data.access_token);
    return data;
}

/**
 * Get daily activity summary from Fitbit
 * @param {string} date - Date in format YYYY-MM-DD (default: today)
 * @returns {Promise<Object>} - Activity summary with steps, calories, distance
 * 
 * @example
 * const activity = await getFitbitDailyActivity('2024-01-15');
 * console.log({
 *   steps: activity.summary.steps,
 *   calories: activity.summary.caloriesOut,
 *   distance: activity.summary.distances[0].distance
 * });
 */
export async function getFitbitDailyActivity(date = 'today') {
    const token = getAccessToken('fitbit');
    if (!token) {
        throw new Error('Fitbit access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.fitbit.baseUrl}/user/-/activities/date/${date}.json`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

/**
 * Get sleep data from Fitbit
 * @param {string} date - Date in format YYYY-MM-DD (default: today)
 * @returns {Promise<Object>} - Sleep data including stages and duration
 * 
 * @example
 * const sleep = await getFitbitSleepData('2024-01-15');
 * const mainSleep = sleep.sleep[0];
 * console.log({
 *   duration: mainSleep.duration / 60000, // Convert to minutes
 *   efficiency: mainSleep.efficiency,
 *   deep: mainSleep.levels.summary.deep.minutes,
 *   light: mainSleep.levels.summary.light.minutes,
 *   rem: mainSleep.levels.summary.rem.minutes
 * });
 */
export async function getFitbitSleepData(date = 'today') {
    const token = getAccessToken('fitbit');
    if (!token) {
        throw new Error('Fitbit access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.fitbit.baseUrl}/user/-/sleep/date/${date}.json`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

/**
 * Get heart rate data from Fitbit
 * @param {string} date - Date in format YYYY-MM-DD (default: today)
 * @returns {Promise<Object>} - Heart rate zones and data
 * 
 * @example
 * const heartRate = await getFitbitHeartRate('2024-01-15');
 * console.log({
 *   restingHeartRate: heartRate['activities-heart'][0].value.restingHeartRate,
 *   zones: heartRate['activities-heart'][0].value.heartRateZones
 * });
 */
export async function getFitbitHeartRate(date = 'today') {
    const token = getAccessToken('fitbit');
    if (!token) {
        throw new Error('Fitbit access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.fitbit.baseUrl}/user/-/activities/heart/date/${date}/1d.json`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

/**
 * Get weekly step statistics from Fitbit
 * @param {string} endDate - End date in format YYYY-MM-DD (default: today)
 * @returns {Promise<Object>} - Weekly step data
 * 
 * @example
 * const weeklySteps = await getFitbitWeeklySteps();
 * weeklySteps['activities-steps'].forEach(day => {
 *   console.log(`${day.dateTime}: ${day.value} steps`);
 * });
 */
export async function getFitbitWeeklySteps(endDate = 'today') {
    const token = getAccessToken('fitbit');
    if (!token) {
        throw new Error('Fitbit access token not found. Please authenticate first.');
    }

    const url = `${API_CONFIG.fitbit.baseUrl}/user/-/activities/steps/date/${endDate}/7d.json`;
    
    return await fetchWithErrorHandling(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

// ========================================
// YOUTUBE DATA API INTEGRATION
// ========================================

/**
 * Search for workout videos on YouTube
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {number} options.maxResults - Max results (default: 10, max: 50)
 * @param {string} options.order - Sort order (relevance, date, rating, viewCount)
 * @returns {Promise<Object>} - Search results with video data
 * 
 * @example
 * const videos = await searchYouTubeVideos({
 *   query: 'HIIT workout',
 *   maxResults: 5,
 *   order: 'relevance'
 * });
 * videos.items.forEach(video => {
 *   console.log({
 *     title: video.snippet.title,
 *     description: video.snippet.description,
 *     thumbnail: video.snippet.thumbnails.medium.url,
 *     videoId: video.id.videoId,
 *     channelName: video.snippet.channelTitle
 *   });
 * });
 */
export async function searchYouTubeVideos(options = {}) {
    if (!API_CONFIG.youtube.apiKey) {
        throw new Error('YouTube API key not configured');
    }

    const params = {
        part: 'snippet',
        q: options.query,
        maxResults: options.maxResults || 10,
        order: options.order || 'relevance',
        type: 'video',
        videoDuration: options.videoDuration || 'any', // any, short, medium, long
        key: API_CONFIG.youtube.apiKey
    };

    const url = `${API_CONFIG.youtube.baseUrl}/search?${buildQueryString(params)}`;
    
    return await fetchWithErrorHandling(url);
}

/**
 * Get detailed video information from YouTube
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - Detailed video information
 * 
 * @example
 * const videoDetails = await getYouTubeVideoDetails('dQw4w9WgXcQ');
 * console.log({
 *   title: videoDetails.items[0].snippet.title,
 *   duration: videoDetails.items[0].contentDetails.duration,
 *   views: videoDetails.items[0].statistics.viewCount,
 *   likes: videoDetails.items[0].statistics.likeCount
 * });
 */
export async function getYouTubeVideoDetails(videoId) {
    if (!API_CONFIG.youtube.apiKey) {
        throw new Error('YouTube API key not configured');
    }

    const params = {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: API_CONFIG.youtube.apiKey
    };

    const url = `${API_CONFIG.youtube.baseUrl}/videos?${buildQueryString(params)}`;
    
    return await fetchWithErrorHandling(url);
}

/**
 * Get workout video recommendations based on category
 * @param {string} category - Workout category (yoga, HIIT, strength, cardio, etc.)
 * @param {number} maxResults - Number of results (default: 12)
 * @returns {Promise<Object>} - Recommended videos
 * 
 * @example
 * const yogaVideos = await getWorkoutVideoRecommendations('yoga', 8);
 * yogaVideos.items.forEach(video => {
 *   const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
 *   console.log(`${video.snippet.title}: ${videoUrl}`);
 * });
 */
export async function getWorkoutVideoRecommendations(category, maxResults = 12) {
    const workoutQueries = {
        yoga: 'yoga workout for beginners',
        hiit: 'HIIT workout full body',
        strength: 'strength training workout',
        cardio: 'cardio workout at home',
        pilates: 'pilates full body workout',
        stretching: 'full body stretching routine',
        abs: 'abs workout 10 minutes',
        legs: 'leg workout at home'
    };

    const query = workoutQueries[category.toLowerCase()] || `${category} workout`;

    return await searchYouTubeVideos({
        query: query,
        maxResults: maxResults,
        order: 'relevance',
        videoDuration: 'medium' // 4-20 minutes
    });
}

// ========================================
// Export API Configuration for Testing
// ========================================

/**
 * Check if all API credentials are configured
 * @returns {Object} - Status of each API configuration
 * 
 * @example
 * const status = checkAPIConfiguration();
 * console.log('Strava configured:', status.strava);
 * console.log('Nutritionix configured:', status.nutritionix);
 */
export function checkAPIConfiguration() {
    return {
        strava: !!(API_CONFIG.strava.clientId && API_CONFIG.strava.clientSecret),
        nutritionix: !!(API_CONFIG.nutritionix.appId && API_CONFIG.nutritionix.appKey),
        fitbit: !!(API_CONFIG.fitbit.clientId && API_CONFIG.fitbit.clientSecret),
        youtube: !!API_CONFIG.youtube.apiKey
    };
}

// ========================================
// Export Configuration Setter (for setup)
// ========================================

/**
 * Set API credentials (call this during app initialization)
 * @param {Object} config - API configuration object
 * 
 * @example
 * setAPICredentials({
 *   strava: { clientId: 'xxx', clientSecret: 'yyy' },
 *   nutritionix: { appId: 'xxx', appKey: 'yyy' },
 *   fitbit: { clientId: 'xxx', clientSecret: 'yyy' },
 *   youtube: { apiKey: 'xxx' }
 * });
 */
export function setAPICredentials(config) {
    if (config.strava) {
        API_CONFIG.strava.clientId = config.strava.clientId;
        API_CONFIG.strava.clientSecret = config.strava.clientSecret;
    }
    if (config.nutritionix) {
        API_CONFIG.nutritionix.appId = config.nutritionix.appId;
        API_CONFIG.nutritionix.appKey = config.nutritionix.appKey;
    }
    if (config.fitbit) {
        API_CONFIG.fitbit.clientId = config.fitbit.clientId;
        API_CONFIG.fitbit.clientSecret = config.fitbit.clientSecret;
    }
    if (config.youtube) {
        API_CONFIG.youtube.apiKey = config.youtube.apiKey;
    }
}