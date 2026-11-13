# ProjectHive — Security & Vulnerability Assessment (Phase 10)

**Document Version:** 1.0.0  
**Phase:** Security Hardening & Zero-Trust Audit  
**Execution Lead:** AGENT 11 (Security Specialist)  
**Methodology:** OWASP Top 10 + Zero-Trust Architecture Review  

---

## 1. Authentication & Token Security
- **Bcrypt Password Hashing:** 12 rounds of salted bcrypt hashing. Plaintext passwords never touch database logs.
- **Dual-Token Architecture:** Short-lived JWT access tokens (15-60m) paired with refresh tokens.
- **Session Token Hashing:** In `user_sessions`, tokens are stored as cryptographic SHA-256 hashes (`session_token_hash`). If the database is compromised, raw session tokens cannot be replayed.
- **Remote Revocation Engine:** Checking `revoked_at` in `user_sessions` allows instantaneous global termination of compromised client devices.

---

## 2. Authorization & Data Isolation (Row Level Security)
- **100% RLS Coverage:** All 35 PostgreSQL tables enforce Row Level Security.
- **Squad Isolation:** Non-members cannot select or insert into private squad messages, tasks, or documents.
- **Anti-Privilege Escalation Triggers:** Database triggers block any non-admin user from updating their own `role` column to `'admin'`. Any unauthorized attempt raises a SQL exception and writes to `admin_audit_logs`.

---

## 3. Network & Gateway Security
- **Sliding-Window Rate Limiting:** Powered by `express-rate-limit`, throttling abusive IPs and mitigating brute-force attacks on `/api/auth/login` and `/api/auth/register`.
- **Bot Defense:** Cloudflare Turnstile bot verification challenges integrated on registration and admin authentication.
- **Circuit Breakers:** External API integrations (Groq, Gemini, Brevo, LiveKit) wrapped in circuit breakers with automatic 5-failure trip thresholds, preventing thread starvation.
- **CORS & Headers:** Strict origin headers restricting API access to verified frontend domains (`projecthive-bd.vercel.app`).
