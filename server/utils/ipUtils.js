// ─── ProjectHive IP Telemetry & Reverse Proxy Utilities ────────────────────────

/**
 * Strips IPv4-mapped IPv6 prefixes and ports if present.
 * e.g., '::ffff:127.0.0.1' -> '127.0.0.1', '192.168.1.1:5432' -> '192.168.1.1'
 */
function normalizeIp(rawIp) {
  if (!rawIp || typeof rawIp !== 'string') return '';
  let ip = rawIp.trim();

  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace(/^::ffff:/, '');
  }

  // If format is IPv4 with port (e.g., 1.2.3.4:5678)
  if (/^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  return ip;
}

/**
 * Determines whether a given IP address belongs to a private, loopback, or internal subnet.
 * Checks RFC 1918, RFC 6598 (CGNAT), RFC 3927 (link-local), and IPv6 loopback / ULA.
 *
 * @param {string} rawIp
 * @returns {boolean}
 */
export function isPrivateIp(rawIp) {
  const ip = normalizeIp(rawIp);
  if (!ip) return false;

  // Loopback
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  // IPv4 checks
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);

    // 10.0.0.0/8
    if (octet1 === 10) return true;

    // 172.16.0.0/12 (172.16.x.x to 172.31.x.x)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;

    // 192.168.0.0/16
    if (octet1 === 192 && octet2 === 168) return true;

    // 100.64.0.0/10 (CGNAT: 100.64.0.0 - 100.127.255.255)
    if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) return true;

    // 169.254.0.0/16 (Link-local)
    if (octet1 === 169 && octet2 === 254) return true;

    // 127.0.0.0/8 (All loopback)
    if (octet1 === 127) return true;

    // 0.0.0.0/8
    if (octet1 === 0) return true;

    return false;
  }

  // IPv6 checks
  const lower = ip.toLowerCase();
  // Unique local addresses (fc00::/7 -> fc.. or fd..)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // Link-local unicast (fe80::/10)
  if (lower.startsWith('fe80') || lower.startsWith('fe90') || lower.startsWith('fea0') || lower.startsWith('feb0')) return true;

  return false;
}

/**
 * Extracts the real client workstation IP address across Cloudflare edge,
 * reverse proxies (AWS/Nginx/Render), and local development.
 *
 * Header resolution order:
 * 1. cf-connecting-ip (Cloudflare)
 * 2. x-real-ip (Nginx / Ingress)
 * 3. x-forwarded-for (Leftmost non-private IP, fallback to leftmost IP)
 * 4. req.socket?.remoteAddress or req.ip
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export function getRealClientIp(req) {
  if (!req) return '127.0.0.1';

  // 1. Cloudflare edge header
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    const cleaned = normalizeIp(cfIp);
    if (cleaned) return cleaned;
  }

  // 2. Standard Nginx / reverse proxy real IP
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    const cleaned = normalizeIp(realIp);
    if (cleaned) return cleaned;
  }

  // 3. X-Forwarded-For header list
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    const ips = xForwardedFor
      .split(',')
      .map((item) => normalizeIp(item))
      .filter(Boolean);

    // Look for the leftmost non-private IP first
    const publicIp = ips.find((ip) => !isPrivateIp(ip));
    if (publicIp) return publicIp;

    // Fallback to leftmost IP if all are private (e.g. corporate LAN or dev)
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // 4. Fallback to socket or req.ip
  const directIp = req.socket?.remoteAddress || req.ip;
  if (directIp) {
    const cleaned = normalizeIp(directIp);
    if (cleaned) return cleaned;
  }

  return '127.0.0.1';
}
