# ProjectHive — Device & Location Intelligence Forensic Audit

**Document Version:** 1.0.0  
**Target Environment:** ProjectHive Production Stack  
**Scope:** Client-side Hardware Probe, Device Registry, Session Revocation, Browser Geolocation, Reverse Geocoding, Location Privacy  
**Status:** Complete Forensic Audit  

---

## 1. Executive Summary

This audit evaluates ProjectHive's technical capabilities and legal boundaries regarding device identification and geographical location tracking. The objective is to provide actionable device security and location-aware campus collaboration while strictly adhering to web standards, user privacy, and browser sandbox limitations.

---

## 2. Device Intelligence: Technical Capabilities & Hard Limits

### 2.1. Strictly Accessible Browser Telemetry
In a web browser environment, the following metadata can be lawfully and accurately obtained via standard browser APIs:
- **User-Agent & Client Hints (`navigator.userAgentData`):** Operating system name, OS major version, browser brand (Chrome, Firefox, Safari, Edge), browser version, mobile vs desktop platform.
- **Hardware Concurrency (`navigator.hardwareConcurrency`):** Logical CPU core count (e.g. 8 cores, 16 cores).
- **Device Memory (`navigator.deviceMemory`):** Approximate RAM in GiB (capped at 8 GiB by Chrome to prevent fingerprinting).
- **Display Properties (`window.screen`):** Screen resolution (`width x height`), pixel ratio (`window.devicePixelRatio`), color depth.
- **Unmasked WebGL Hardware Info (`WEBGL_debug_renderer_info`):** GPU vendor and renderer string (e.g. `ANGLE (NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0)`).
- **Network / Transport:** Public IP address (obtained on backend from HTTP request headers `cf-connecting-ip`, `x-forwarded-for`), approximate country/region via GeoIP lookup.

### 2.2. Technically Inaccessible Identifiers (Strict Anti-Fraud Principle)
The following identifiers **CANNOT** be retrieved by any web application without native operating-system agent software:
- **IMEI / IMSI / SIM card numbers** (Strictly blocked by mobile OS sandboxes).
- **Hardware MAC Address** (Never exposed to JavaScript in any modern browser).
- **Motherboard / BIOS / CPU Serial Numbers** (Not exposed to standard web runtime).
- **Private OS User IDs / Windows SID / Apple UDID** (Inaccessible).

> [!IMPORTANT]
> ProjectHive will never fake or simulate hardware serial numbers or MAC addresses. All device records represent genuine, verified web platform telemetry.

### 2.3. Forensic Assessment of Existing Device Implementation
- **Client Probe (`frontend/src/lib/deviceTelemetry.ts`):** Well-structured WebGL and User-Agent parser. Successfully identifies GPU renderer, OS, and screen resolution.
- **Backend Auth Handler (`server/controllers/auth.controller.js`):** Receives `deviceMeta` during `/login`, but only overwrites a single row on the `users` table (`last_login_device_model`, `last_login_os`, `last_login_browser`, `last_login_at`).
- **Critical Gap:** No multi-device session history. If a student logs in on a library PC, and later on their phone, the library PC session is erased from the profile view, preventing the student from revoking the older session.

---

## 3. Location Intelligence: Architecture & Privacy Boundaries

### 3.1. Browser Geolocation API Standards
The native W3C Geolocation API (`navigator.geolocation.getCurrentPosition`) requires:
1. **Secure Origin (HTTPS):** Geolocation is completely blocked on insecure HTTP in modern browsers (except localhost).
2. **Explicit User Gesture & Consent Prompt:** Cannot be invoked automatically on page load without triggering browser permission warnings.
3. **Pre-Permission UI Requirement:** A high-craft user experience requires presenting an explanatory modal *before* invoking the native browser prompt:
   - *"ProjectHive uses your location to discover student collaborators at your university and filter nearby hackathon teams. Your exact coordinates are never shared publicly."*
4. **Graceful Degradation:** When permission is denied or unavailable, the application must immediately fall back to manual campus/university and city selection.

### 3.2. Forensic Assessment of Existing Location Implementation
- **Current State:**
  - `users.university`: Stored as a plain string (e.g. `"Stanford University"`, `"Dhaka University"`).
  - `users.last_login_country` & `city`: Extracted from IP address headers via `getClientGeo()` in `auth.controller.js`.
- **Identified Gaps:**
  - No interactive map component for visual campus discovery.
  - No explicit privacy granularity (`private` vs `campus` vs `city`).
  - No location-aware query filters on `/api/teams` or `/api/projects`.
  - Admins do not have an aggregate campus distribution visualization.

---

## 4. Implementation Specifications

### 4.1. Device & Session Intelligence Table (`user_sessions`)
```sql
CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "session_token_hash" TEXT NOT NULL,
  "device_category" VARCHAR(50) NOT NULL DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
  "device_model" TEXT,
  "os_name" VARCHAR(100),
  "os_version" VARCHAR(100),
  "browser_name" VARCHAR(100),
  "browser_version" VARCHAR(100),
  "ip_address" TEXT,
  "country" VARCHAR(100),
  "city" VARCHAR(100),
  "is_current" BOOLEAN NOT NULL DEFAULT FALSE,
  "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "revoked_at" TIMESTAMPTZ
);
```

### 4.2. Location Intelligence Preferences (`user_settings`)
Extend user preferences to include:
- `location_privacy`: `'private' | 'campus' | 'city'` (Default: `'campus'`)
- `latitude`: `FLOAT8` (Consented coordinates)
- `longitude`: `FLOAT8`
- `campus_name`: `VARCHAR(255)`
- `campus_city`: `VARCHAR(100)`

