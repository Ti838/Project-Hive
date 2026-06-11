/**
 * Store Module - Simple reactive state management using Observable pattern
 */

const Store = (() => {
    const subscribers = {};
    const state = {};

    /**
     * Create a reactive store for a specific domain
     */
    const createStore = (initialState = {}) => {
        let storeState = { ...initialState };
        let storeSubscribers = {};

        const subscribe = (key, callback) => {
            if (!storeSubscribers[key]) {
                storeSubscribers[key] = [];
            }
            storeSubscribers[key].push(callback);

            // Return unsubscribe function
            return () => {
                storeSubscribers[key] = storeSubscribers[key].filter(cb => cb !== callback);
            };
        };

        const notifySubscribers = (key) => {
            if (storeSubscribers[key]) {
                storeSubscribers[key].forEach(callback => {
                    callback(storeState[key]);
                });
            }
        };

        const setState = (key, value) => {
            storeState[key] = value;
            notifySubscribers(key);
        };

        const getState = (key) => {
            return storeState[key];
        };

        const getFullState = () => {
            return { ...storeState };
        };

        return {
            subscribe,
            setState,
            getState,
            getFullState,
        };
    };

    // Global stores
    const userStore = createStore({
        current: null,
        isLoading: false,
        error: null,
    });

    const teamsStore = createStore({
        list: [],
        current: null,
        isLoading: false,
        error: null,
    });

    const messagesStore = createStore({
        byTeam: {}, // { teamId: [messages] }
        current: [],
        isLoading: false,
        error: null,
    });

    const notificationsStore = createStore({
        list: [],
        unreadCount: 0,
        isLoading: false,
    });

    return {
        createStore,
        user: userStore,
        teams: teamsStore,
        messages: messagesStore,
        notifications: notificationsStore,
    };
})();
