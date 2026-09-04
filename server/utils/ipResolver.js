// ── Multi-Hop Client IP & Geo Resolver ───────────────────────────────────────

export function getClientIp(req) {
  const headers = [
    req.headers['cf-connecting-ip'],
    req.headers['x-real-ip'],
    req.headers['x-client-ip'],
    req.headers['x-forwarded-for']?.split(',')[0].trim(),
    req.socket?.remoteAddress,
    req.ip,
  ];
  let ip = headers.find((h) => Boolean(h)) || '127.0.0.1';
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

export function getClientGeo(req) {
  const country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || null;
  const city = req.headers['x-vercel-ip-city'] || null;
  return { country, city };
}
