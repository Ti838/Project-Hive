// ProjectHive API Module
const API = (() => {
    // In production (Vercel), point to the Render backend
    // In development (localhost), use relative path
    const RENDER_URL = 'https://projecthive-backend.onrender.com';
    const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : `${RENDER_URL}/api`;

    let access = localStorage.getItem('access_token');
    let refresh = localStorage.getItem('refresh_token');
    let userData = null;

    try {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            userData = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error('[v0] Error parsing stored user data:', e);
    }

    // Token management helper functions
    const getTokens = () => ({ access, refresh });
    const setTokens = (newAccess, newRefresh) => {
        access = newAccess;
        refresh = newRefresh;
        localStorage.setItem('access_token', newAccess);
        localStorage.setItem('refresh_token', newRefresh);
    };
    const clearTokens = () => {
        access = null;
        refresh = null;
        userData = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    };

    const setUserData = (data) => {
        userData = data;
        localStorage.setItem('user_data', JSON.stringify(data));
    };

    const getUserData = () => userData;

    // Refresh access token using refresh token
    const refreshAccessToken = async () => {
        if (!refresh) throw new Error('No refresh token available');

        try {
            const response = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: refresh }),
            });

            if (!response.ok) {
                clearTokens();
                throw new Error('Refresh token invalid or expired');
            }

            const data = await response.json();
            setTokens(data.accessToken, data.refreshToken || refresh);
            return data.accessToken;
        } catch (error) {
            clearTokens();
            throw error;
        }
    };

    // Global fetch wrapper with interceptor for token refresh
    const request = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (access) {
            headers['Authorization'] = `Bearer ${access}`;
        }

        let response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // If 401, try to refresh token
        if (response.status === 401 && access) {
            try {
                access = await refreshAccessToken();
                headers['Authorization'] = `Bearer ${access}`;
                response = await fetch(`${BASE_URL}${endpoint}`, {
                    ...options,
                    headers,
                });
            } catch (error) {
                return { error: 'Authentication failed', status: 401 };
            }
        }

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return { status: response.status, ok: response.ok };
        }

        const data = await response.json();
        return {
            ...data,
            status: response.status,
            ok: response.ok,
        };
    };

    return {
        getTokens,
        setTokens,
        clearTokens,
        setUserData,
        getUserData,
        refreshAccessToken,
        request,

        // Auth endpoints
        auth: {
            register: (userData) => 
                request('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(userData),
                }),
            login: (email, password) =>
                request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                }),
            logout: () => {
                clearTokens();
                window.location.href = '/login';
            },
        },

        // User endpoints
        users: {
            getProfile: (userId) =>
                request(`/users/${userId}`),
            updateProfile: (data) =>
                request('/users/me', {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }),
            getCurrentUser: async () => {
                // DEV MODE: if mock dev token, return mock user directly
                const token = localStorage.getItem('access_token');
                if (token && token.endsWith('.dev')) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        return { ...payload, ok: true, _devMode: true };
                    } catch(e) {}
                }
                return request('/users/me');
            },
            searchUsers: (query) =>
                request(`/users/search?q=${encodeURIComponent(query)}`),
        },

        // Team endpoints
        teams: {
            createTeam: (data) =>
                request('/teams', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }),
            getTeam: (teamId) =>
                request(`/teams/${teamId}`),
            updateTeam: (teamId, data) =>
                request(`/teams/${teamId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }),
            listTeams: (filters = {}) => {
                const params = new URLSearchParams(filters);
                return request(`/teams?${params.toString()}`);
            },
            getMyTeams: () =>
                request('/teams/my-teams'),
            joinTeam: (teamId) =>
                request(`/teams/${teamId}/join`, { method: 'POST' }),
            leaveTeam: (teamId) =>
                request(`/teams/${teamId}/leave`, { method: 'POST' }),
            respondToJoinRequest: (teamId, userId, action) =>
                request(`/teams/${teamId}/requests/${userId}/${action}`, { method: 'POST' }),
        },

        // AI endpoints
        ai: {
            generateProjectIdeas: (domain, skills, teamSize, timelineWeeks, constraints) =>
                request('/ai/generate-ideas', {
                    method: 'POST',
                    body: JSON.stringify({
                        domain,
                        skills,
                        teamSize,
                        timelineWeeks,
                        constraints,
                    }),
                }),
        },

        // Messages endpoints
        messages: {
            getTeamMessages: (teamId, limit = 50, skip = 0) =>
                request(`/messages/teams/${teamId}?limit=${limit}&skip=${skip}`),
            sendMessage: (roomId, content) =>
                request('/messages', {
                    method: 'POST',
                    body: JSON.stringify({ roomId, content }),
                }),
        },

        // Projects endpoints
        projects: {
            createProject: (data) =>
                request('/projects', {
                    method: 'POST',
                    body: JSON.stringify(data),
                }),
            getProject: (projectId) =>
                request(`/projects/${projectId}`),
            listProjects: (filters = {}) => {
                const params = new URLSearchParams(filters);
                return request(`/projects?${params.toString()}`);
            },
            updateProject: (projectId, data) =>
                request(`/projects/${projectId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                }),
        },
    };
})();
