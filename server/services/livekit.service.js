// ─── ProjectHive — LiveKit Service ───────────────────────────────────────────
// Refactored for Phase 1 Confidential Computing: delegates token minting
// to the KeySigner abstraction layer so LIVEKIT_API_SECRET is isolated from controllers.

import { keySigner } from './crypto/keySigner.service.js';

/**
 * Get current configured LiveKit server URL (e.g. ws://localhost:7880 or wss://livekit.domain.com)
 */
export function getLiveKitServerUrl() {
  return (
    process.env.LIVEKIT_URL ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    process.env.LIVEKIT_WS_URL ||
    'ws://127.0.0.1:7880'
  );
}

/**
 * Generate a cryptographically signed short-lived LiveKit Access Token
 * Delegated to KeySigner cryptographic provider
 */
export async function createLiveKitToken({
  identity,
  name,
  roomName,
  metadata = {},
  canPublish = true,
  canSubscribe = true,
  ttl = '2h',
}) {
  return await keySigner.signLiveKitGrant({
    identity,
    name,
    roomName,
    metadata,
    canPublish,
    canSubscribe,
    ttl,
  });
}

/**
 * Generate deterministic and safe room name
 */
export function formatRoomName(scope, id, subId) {
  const sanitize = (str) => String(str || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (scope === 'direct') {
    const sorted = [sanitize(id), sanitize(subId)].sort().join('_dm_');
    return `ph-dm-${sorted}`;
  }
  if (scope === 'team') {
    return `ph-team-${sanitize(id)}`;
  }
  if (scope === 'project') {
    return `ph-proj-${sanitize(id)}`;
  }
  return `ph-room-${sanitize(id)}`;
}
