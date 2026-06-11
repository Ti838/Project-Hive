/**
 * Socket.IO Client — Real-time communication singleton
 * Requires socket.io client CDN to be loaded before this script.
 */

const SocketClient = (() => {
    let socket = null;
    const subscribers = {};
    let _typingTimeout = null;

    /**
     * Get the Socket.IO server URL
     */
    const getSocketUrl = () => {
        // If frontend is served from the same origin as the backend
        if (window.location.port === '5000') {
            return window.location.origin;
        }
        // Otherwise default to port 5000
        return `http://${window.location.hostname}:5000`;
    };

    /**
     * Initialize Socket.IO connection
     */
    const connect = (token) => {
        if (socket && socket.connected) {
            console.log('[v0] Socket already connected');
            return socket;
        }

        // Ensure Socket.IO client lib is loaded
        if (typeof io === 'undefined') {
            console.error('[v0] Socket.IO client library not loaded. Add the CDN script tag.');
            return null;
        }

        const url = getSocketUrl();
        console.log('[v0] Connecting to Socket.IO at:', url);

        socket = io(url, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            transports: ['websocket', 'polling'],
        });

        // ---- Core lifecycle events ----

        socket.on('connect', () => {
            console.log('[v0] ✅ Socket connected | ID:', socket.id);
            _emit('connected', { socketId: socket.id });
        });

        socket.on('disconnect', (reason) => {
            console.log('[v0] ⚡ Socket disconnected | Reason:', reason);
            _emit('disconnected', { reason });
        });

        socket.on('connect_error', (error) => {
            console.error('[v0] ❌ Socket connection error:', error.message);
            _emit('error', { message: error.message });
        });

        socket.on('reconnect', (attempt) => {
            console.log('[v0] 🔄 Socket reconnected after', attempt, 'attempts');
            _emit('reconnected', { attempt });
        });

        // ---- Application events ----

        socket.on('message:received', (data) => {
            console.log('[v0] 📩 Message received:', data);
            _emit('messageReceived', data);
        });

        socket.on('user:typing', (data) => _emit('userTyping', data));
        socket.on('user:stop-typing', (data) => _emit('userStopTyping', data));
        socket.on('user:online', (data) => _emit('userOnline', data));
        socket.on('user:offline', (data) => _emit('userOffline', data));
        socket.on('notification:new', (data) => _emit('notification', data));
        socket.on('room:joined', (data) => {
            console.log('[v0] Joined room:', data.roomId);
            _emit('roomJoined', data);
        });

        socket.on('error', (data) => {
            console.error('[v0] Server error:', data);
            _emit('serverError', data);
        });

        return socket;
    };

    /**
     * Disconnect socket
     */
    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    };

    /**
     * Internal: emit event to local subscribers
     */
    const _emit = (eventName, data) => {
        if (subscribers[eventName]) {
            subscribers[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[v0] Subscriber error for "${eventName}":`, err);
                }
            });
        }
    };

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     */
    const on = (eventName, callback) => {
        if (!subscribers[eventName]) {
            subscribers[eventName] = [];
        }
        subscribers[eventName].push(callback);

        return () => {
            subscribers[eventName] = subscribers[eventName].filter(cb => cb !== callback);
        };
    };

    /**
     * Send an event to the server
     */
    const send = (eventName, data) => {
        if (socket && socket.connected) {
            socket.emit(eventName, data);
            return true;
        }
        console.warn('[v0] Socket not connected, cannot send:', eventName);
        return false;
    };

    /**
     * Join a chat room (team)
     */
    const joinRoom = (roomId) => {
        return send('join:room', { roomId });
    };

    /**
     * Leave current chat room
     */
    const leaveRoom = () => {
        return send('leave:room', {});
    };

    /**
     * Send a chat message to a room
     */
    const sendMessage = (roomId, content) => {
        return send('message:send', { roomId, content });
    };

    /**
     * Start typing indicator (auto-stops after 2 seconds)
     */
    const startTyping = (roomId) => {
        send('typing:start', { roomId });

        // Auto-stop after 2s of no keystrokes
        clearTimeout(_typingTimeout);
        _typingTimeout = setTimeout(() => {
            stopTyping(roomId);
        }, 2000);
    };

    /**
     * Stop typing indicator
     */
    const stopTyping = (roomId) => {
        clearTimeout(_typingTimeout);
        send('typing:stop', { roomId });
    };

    /**
     * Check if currently connected
     */
    const isConnected = () => {
        return !!(socket && socket.connected);
    };

    /**
     * Get raw socket instance (for advanced usage)
     */
    const getSocket = () => socket;

    return {
        connect,
        disconnect,
        on,
        send,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        isConnected,
        getSocket,
    };
})();
