export interface ExactDeviceMeta {
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
}

export async function getExactDeviceDetails(): Promise<ExactDeviceMeta> {
  if (typeof window === 'undefined') {
    return {
      deviceModel: 'Server Environment',
      os: 'Unknown',
      browser: 'Unknown',
      screenResolution: 'N/A',
    };
  }

  const ua = navigator.userAgent;
  let model = '';
  let os = '';
  let browser = 'Browser';

  // A. Chromium High-Entropy Client Hints (Exact Android models & Windows)
  if ('userAgentData' in navigator && (navigator as any).userAgentData?.getHighEntropyValues) {
    try {
      const hints = await (navigator as any).userAgentData.getHighEntropyValues([
        'model', 'platform', 'platformVersion'
      ]);
      if (hints.model) model = hints.model; // e.g. "SM-S918B", "2201117TY"
      if (hints.platform) {
        const major = hints.platformVersion ? parseInt(hints.platformVersion.split('.')[0], 10) : 0;
        os = hints.platform === 'Windows' ? (major >= 13 ? 'Windows 11' : 'Windows 10') : `${hints.platform} ${hints.platformVersion || ''}`.trim();
      }
    } catch {}
  }

  // B. Apple iOS Screen Matrix Heuristics (Resolves exact iPhone generations)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    os = 'iOS';
    const w = window.screen.width;
    const h = window.screen.height;
    const r = window.devicePixelRatio;
    if (w === 430 && h === 932 && r === 3) model = 'iPhone 15 Pro Max / 16 Plus';
    else if (w === 393 && h === 852 && r === 3) model = 'iPhone 15 Pro / 15 / 16';
    else if (w === 430 && h === 932) model = 'iPhone 14 Pro Max';
    else if (w === 393 && h === 852) model = 'iPhone 14 Pro';
    else if (w === 428 && h === 926 && r === 3) model = 'iPhone 13 Pro Max / 14 Plus';
    else if (w === 390 && h === 844 && r === 3) model = 'iPhone 13 / 13 Pro / 14';
    else if (w === 375 && h === 812 && r === 3) model = 'iPhone 12 mini / 13 mini / X';
    else if (w === 414 && h === 896 && r === 2) model = 'iPhone 11 / XR';
    else if (w === 414 && h === 896 && r === 3) model = 'iPhone 11 Pro Max / XS Max';
    else model = 'Apple iPhone';
  }

  // C. Android Fallback from User-Agent Build tags
  if (!model && /Android/i.test(ua)) {
    const match = ua.match(/Android[^;]+;(?:\s*[^;]+;)?\s*([^;)]+)\s*Build/i);
    if (match && match[1]) model = match[1].trim();
  }

  // D. Desktop Fallbacks
  if (!model) {
    if (/Macintosh|Mac OS X/i.test(ua)) model = 'Apple Mac / MacBook';
    else if (/Windows/i.test(ua)) model = 'Windows PC';
    else if (/Linux/i.test(ua)) model = 'Linux Workstation';
    else model = 'Unknown Device';
  }

  // E. Browser Family & OS Fallback
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  if (!os) {
    if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else os = 'Unknown OS';
  }

  return {
    deviceModel: model,
    os,
    browser,
    screenResolution: `${window.screen.width}x${window.screen.height} @ ${window.devicePixelRatio}x`
  };
}
