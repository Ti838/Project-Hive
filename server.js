/**
 * ─── Root Server Entrypoint for Cloud Platforms (Render, Railway, Fly.io) ────
 * Allows the ProjectHive backend to boot smoothly whether the hosting provider's
 * Root Directory is set to "/" (repository root) or "/server".
 */

import './server/server.js';

