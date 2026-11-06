# PROJECTHIVE: HELPLINE MESSAGING & REALTIME AUDIT

- **Dual Mode Support:** Operates seamlessly asynchronously (persisting messages immediately to PostgreSQL) and in real time (via Socket.IO `support:ticket:id`).
- **Offline Persistence:** If either party is disconnected, messages are stored in database state and rendered upon reconnection.
