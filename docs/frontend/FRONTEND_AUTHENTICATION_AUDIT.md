# PROJECTHIVE: FRONTEND AUTHENTICATION AUDIT

- **Token Storage:** Access and refresh tokens stored in `localStorage` with automatic mutex-locked refresh.
- **Protected Routes:** Next.js middleware and client auth state automatically redirect unauthenticated visits to `/login`.
- **Admin Clearance:** Admin pages verify both cryptographic JWT and live database role (`role === 'admin'`).
