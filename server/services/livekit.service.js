// ─── ProjectHive — LiveKit Service ───────────────────────────────────────────
import { AccessToken } from 'livekit-server-sdk';

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
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

  if (!identity || !roomName) {
    throw new Error('identity and roomName are required to create LiveKit token');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(identity),
    name: name || 'User',
    ttl: ttl,
    metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
    canPublishData: true,
  });

  return await at.toJwt();
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
