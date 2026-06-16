/**
 * Auth Module - Handles authentication state and utilities
 */

const Auth = (() => {
    /**
     * Check if user is authenticated (has valid, non-expired token)
     */
    const isAuthenticated = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return false;
        // Validate token can be parsed and is not expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                // Token expired — clear it
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                return false;
            }
        } catch (e) {
            // Malformed token
            localStorage.removeItem('access_token');
            return false;
        }
        return true;
    };

    /**
     * Get current user from JWT without calling backend
     */
    const getCurrentUser = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('[v0] Failed to parse JWT:', error);
            return null;
        }
    };

    /**
     * Login user and save tokens
     */
    const login = async (email, password) => {
        try {
            const response = await API.auth.login(email, password);
            if (response.ok && response.accessToken) {
                API.setTokens(response.accessToken, response.refreshToken);
                return { success: true, user: response.user };
            } else {
                return { success: false, error: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('[v0] Login error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    /**
     * Register new user
     */
    const register = async (userData) => {
        try {
            const response = await API.auth.register(userData);
            if (response.ok && response.accessToken) {
                API.setTokens(response.accessToken, response.refreshToken);
                return { success: true, user: response.user };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('[v0] Register error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    /**
     * Logout user
     */
    const logout = () => {
        API.clearTokens();
        window.location.href = '/login';
    };

    /**
     * Validate JWT token expiration
     */
    const isTokenExpired = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            return Date.now() >= expirationTime;
        } catch (error) {
            console.error('[v0] Token expiration check failed:', error);
            return true;
        }
    };

    /**
     * Get base path relative to current page
     */
    const getBase = () => {
        const d = (window.location.pathname.match(/\//g)||[]).length - 1;
        if (d <= 1) return './';
        if (d === 2) return '../';
        return '../../';
    };

    /**
     * Ensure user is authenticated, redirect if not
     */
    const requireAuth = () => {
        if (!isAuthenticated()) {
            window.location.href = '/login';
        }
    };

    return {
        isAuthenticated,
        getCurrentUser,
        login,
        register,
        logout,
        isTokenExpired,
        requireAuth,
    };
})();
