# PROJECTHIVE: FRONTEND-BACKEND INTEGRATION CONTRACT

- **Base URL:** Derived from `NEXT_PUBLIC_API_URL` with fallback to `https://projecthive-backend.onrender.com/api`.
- **Authorization:** Standardized `Authorization: Bearer <accessToken>` header on all protected requests.
- **Mutex Token Refresh:** Mutex-locked token rotation via `POST /api/auth/refresh`.
