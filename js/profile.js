/* Profile page JS moved from inline <script> in profile/index.html
   Responsibilities:
   - Manage API config (base + token) saved in localStorage
   - Fetch profile, stats, activities from user's API (or Strava-like endpoints)
   - Render stats and activities into the page
   - Expose a fetchAll() to refresh content
*/

function $(sel) { return document.querySelector(sel); }

const usernameInput = $('#username');
const loadUserBtn = $('#loadUserBtn');
const avatarEl = $('#avatar');
const nameEl = $('#name');
const subtitleEl = $('#subtitle');
const statusEl = $('#status');
const statsGrid = $('#statsGrid');
const activitiesSection = $('#activitiesList');
const activitiesContainer = $('#activitiesContainer');
const totalDistanceEl = $('#totalDistance');
const totalTimeEl = $('#totalTime');
const activitiesCountEl = $('#activitiesCount');
const refreshBtn = $('#refreshBtn');

// Optional API base for advanced usage (not required). If set in localStorage as 'dataApiBase', the script
// will try to query `${dataApiBase}/users/{username}/stats` and `/activities`.
function getOptionalApiBase() {
    return (localStorage.getItem('dataApiBase') || '').trim();
}

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = type === 'error' ? 'error' : (type === 'loading' ? 'loading' : '');
}

function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h ? h + 'h' : '', m ? m + 'm' : '', s ? s + 's' : ''].filter(Boolean).join(' ');
}

function formatDistance(meters) {
    if (!meters && meters !== 0) return '—';
    const km = meters / 1000;
    return km >= 1 ? km.toFixed(2) + ' km' : (meters.toFixed(0) + ' m');
}

async function optionalApiFetch(path, options = {}) {
    const base = getOptionalApiBase();
    if (!base) throw new Error('No optional API base configured');
    const url = new URL(path, base).toString();
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('API fetch failed: ' + res.status);
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}

async function fetchProfileFromGithub(username) {
    // Use GitHub as a convenient public source for name/avatar if available
    try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('GitHub lookup failed');
        const user = await res.json();
        return {
            name: user.name || user.login,
            bio: user.bio || user.location || '',
            avatarUrl: user.avatar_url,
            initials: (user.name || user.login || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
        };
    } catch (e) {
        return null;
    }
}

function renderActivities(list) {
    activitiesContainer.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
        activitiesSection.style.display = 'none';
        return;
    }
    activitiesSection.style.display = '';
    list.forEach(act => {
        const el = document.createElement('div');
        el.className = 'activity';
        el.innerHTML = `
            <img src="${act.map_thumbnail || ''}" alt="thumb">
            <div class="info">
                <div style="font-weight:700">${act.name || act.title || 'Activity'}</div>
                <div class="muted">${new Date(act.start_date || act.date || Date.now()).toLocaleString()}</div>
                <div style="margin-top:6px">${formatDistance(act.distance_m || act.distance || 0)} • ${formatDuration(act.moving_time_s || act.moving_time || 0)}</div>
            </div>
        `;
        activitiesContainer.appendChild(el);
    });
}

async function fetchStatsAndActivities() {
    try {
        setStatus('Loading stats...', 'loading');
        // Try aggregated stats endpoint first
        const stats = await apiFetch('/stats');
        totalDistanceEl.textContent = formatDistance(stats.total_distance_m || stats.total_distance || 0);
        totalTimeEl.textContent = formatDuration(stats.total_time_s || stats.total_time || 0);
        activitiesCountEl.textContent = (stats.activities_count || stats.activities || (stats.recent && stats.recent.length) || 0);
        renderActivities(stats.recent || []);
        statsGrid.style.display = '';
        setStatus('Stats loaded', '');
    } catch (err) {
        // Fallback: fetch activities and compute totals
        try {
            setStatus('Fetching activities...', 'loading');
            const activities = await apiFetch('/activities?limit=20');
            const list = Array.isArray(activities) ? activities : (activities.data || []);
            let totalDistance = 0, totalTime = 0;
            list.forEach(a => {
                totalDistance += (a.distance_m || a.distance || 0);
                totalTime += (a.moving_time_s || a.moving_time || 0);
            });
            totalDistanceEl.textContent = formatDistance(totalDistance);
            totalTimeEl.textContent = formatDuration(totalTime);
            activitiesCountEl.textContent = list.length;
            renderActivities(list);
            statsGrid.style.display = '';
            setStatus('Activities loaded', '');
        } catch (e) {
            setStatus('Failed to load data: ' + (e.message || e), 'error');
            statsGrid.style.display = 'none';
            activitiesSection.style.display = 'none';
            throw e;
        }
    }
}

function makeDemoData(username) {
    // deterministic-ish demo data based on username
    const seed = username ? username.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) : Date.now();
    const rand = (n) => Math.abs((seed * 9301 + 49297) % 233280) % n;
    const count = 5 + (seed % 10);
    const activities = Array.from({ length: count }).map((_, i) => ({
        id: i + 1,
        name: `Run ${i + 1}`,
        start_date: new Date(Date.now() - (i * 24 * 3600 * 1000)).toISOString(),
        distance_m: (3000 + (i * 500) + rand(2000)),
        moving_time_s: 900 + i * 60 + rand(600),
        map_thumbnail: ''
    }));
    const totalDistance = activities.reduce((s, a) => s + (a.distance_m || 0), 0);
    const totalTime = activities.reduce((s, a) => s + (a.moving_time_s || 0), 0);
    return {
        profile: {
            name: username || 'Demo User',
            bio: 'Demo profile',
            initials: (username || 'DU').slice(0, 2).toUpperCase(),
            avatarUrl: ''
        },
        stats: {
            total_distance_m: totalDistance,
            total_time_s: totalTime,
            activities_count: activities.length,
            recent: activities
        }
    };
}

async function tryLoadForUsername(username) {
    if (!username) {
        setStatus('Please enter a username', 'error');
        return;
    }

    setStatus('Loading profile for ' + username + '...', 'loading');

    // 1) Try GitHub for avatar/name (public)
    const gh = await fetchProfileFromGithub(username);

    // 2) Try optional configured API base (/users/{username}/stats and /activities)
    const base = getOptionalApiBase();
    let stats = null;
    let activities = null;
    if (base) {
        try {
            stats = await optionalApiFetch(`/users/${encodeURIComponent(username)}/stats`);
            activities = await optionalApiFetch(`/users/${encodeURIComponent(username)}/activities?limit=20`);
        } catch (e) {
            // ignore, will fallback to demo
            stats = null; activities = null;
        }
    }

    // 3) If we have stats, render; otherwise use demo
    if (!stats) {
        const demo = makeDemoData(username);
        // profile
        nameEl.textContent = demo.profile.name;
        subtitleEl.textContent = demo.profile.bio || '';
        avatarEl.textContent = demo.profile.initials;
        // stats
        totalDistanceEl.textContent = formatDistance(demo.stats.total_distance_m);
        totalTimeEl.textContent = formatDuration(demo.stats.total_time_s);
        activitiesCountEl.textContent = demo.stats.activities_count;
        renderActivities(demo.stats.recent);
        statsGrid.style.display = '';
        setStatus('Showing demo data for ' + username);
        return;
    }

    // Render real stats
    try {
        nameEl.textContent = (gh && gh.name) ? gh.name : (stats.displayName || username);
        subtitleEl.textContent = (gh && gh.bio) ? gh.bio : (stats.location || 'Connected');
        avatarEl.textContent = (gh && gh.initials) ? gh.initials : (nameEl.textContent.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase());

        totalDistanceEl.textContent = formatDistance(stats.total_distance_m || stats.total_distance || 0);
        totalTimeEl.textContent = formatDuration(stats.total_time_s || stats.total_time || 0);
        const recent = Array.isArray(activities) ? activities : (activities.data || activities.recent || []);
        activitiesCountEl.textContent = stats.activities_count || recent.length || 0;
        renderActivities(recent || []);
        statsGrid.style.display = '';
        setStatus('Loaded data for ' + username);
    } catch (e) {
        setStatus('Error rendering data: ' + (e.message || e), 'error');
    }
}

// Hook up UI
loadUserBtn && loadUserBtn.addEventListener('click', () => tryLoadForUsername((usernameInput && usernameInput.value || '').trim()));
refreshBtn && refreshBtn.addEventListener('click', () => tryLoadForUsername((usernameInput && usernameInput.value || '').trim()));

// Auto-run if username saved
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const saved = localStorage.getItem('profileUsername') || '';
        if (saved && usernameInput) { usernameInput.value = saved; tryLoadForUsername(saved).catch(() => { }); }
    });
} else {
    const saved = localStorage.getItem('profileUsername') || '';
    if (saved && usernameInput) { usernameInput.value = saved; tryLoadForUsername(saved).catch(() => { }); }
}

// Save username on change
if (usernameInput) usernameInput.addEventListener('change', (e) => localStorage.setItem('profileUsername', e.target.value.trim()));

export { tryLoadForUsername as fetchAll };
