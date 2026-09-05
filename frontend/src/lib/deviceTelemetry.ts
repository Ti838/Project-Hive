// ─── ProjectHive Hardware & Low-Level Device Telemetry Engine ─────────────

export interface DeviceTelemetry {
  deviceModel: string;
  osName: string;
  osVersion: string;
  cpuArch: string;
  gpuRenderer: string;
  gpuVendor: string;
  screenResolution: string;
  pixelRatio: number;
}

const DEFAULT_TELEMETRY: DeviceTelemetry = {
  deviceModel: 'Workstation Terminal',
  osName: 'Unknown OS',
  osVersion: '',
  cpuArch: 'x86_64',
  gpuRenderer: 'Standard Display Controller',
  gpuVendor: 'Generic Vendor',
  screenResolution: '1920x1080',
  pixelRatio: 1,
};

let cachedTelemetry: DeviceTelemetry | null = null;
let telemetryPromise: Promise<DeviceTelemetry> | null = null;

/**
 * Extracts unmasked WebGL GPU hardware information via debug extension.
 */
function getWebGLGpuInfo(): { gpuRenderer: string; gpuVendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      return {
        gpuRenderer: 'Software Rasterizer / Generic',
        gpuVendor: 'Generic',
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      return {
        gpuRenderer: unmaskedRenderer ? String(unmaskedRenderer).trim() : 'WebGL GPU Accelerator',
        gpuVendor: unmaskedVendor ? String(unmaskedVendor).trim() : 'Hardware Vendor',
      };
    }

    const standardRenderer = gl.getParameter(gl.RENDERER);
    const standardVendor = gl.getParameter(gl.VENDOR);

    return {
      gpuRenderer: standardRenderer ? String(standardRenderer).trim() : 'WebGL GPU',
      gpuVendor: standardVendor ? String(standardVendor).trim() : 'Vendor',
    };
  } catch (err) {
    return {
      gpuRenderer: 'Hardware Acceleration Disabled',
      gpuVendor: 'Generic',
    };
  }
}

/**
 * Fallback user-agent parser for platforms without NavigatorUAData.
 */
function parseUserAgentFallback(ua: string): { osName: string; osVersion: string; cpuArch: string; deviceModel: string } {
  let osName = 'Desktop Workstation';
  let osVersion = '';
  let cpuArch = 'x86_64';
  let deviceModel = 'Personal Computer';

  // OS Detection
  if (/Windows NT 10.0/i.test(ua)) {
    osName = 'Windows';
    osVersion = '10 / 11';
    deviceModel = 'Windows PC';
  } else if (/Windows NT 6.3/i.test(ua)) {
    osName = 'Windows';
    osVersion = '8.1';
    deviceModel = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    osName = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
    deviceModel = 'Apple Macintosh Workstation';
  } else if (/Linux/i.test(ua)) {
    osName = 'Linux';
    deviceModel = 'Linux Workstation';
  } else if (/Android/i.test(ua)) {
    osName = 'Android';
    const modelMatch = ua.match(/;\s*([^;]+?)\s*Build\//);
    if (modelMatch && modelMatch[1]) deviceModel = modelMatch[1].trim();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    osName = 'iOS';
    deviceModel = /iPad/i.test(ua) ? 'Apple iPad' : 'Apple iPhone';
  }

  // CPU Arch Detection
  if (/arm64|aarch64/i.test(ua)) {
    cpuArch = 'arm64';
  } else if (/x86_64|Win64|x64|WOW64|amd64/i.test(ua)) {
    cpuArch = 'x86_64';
  } else if (/i686|i386|x86/i.test(ua)) {
    cpuArch = 'x86_32';
  } else if (osName === 'macOS' && (navigator.maxTouchPoints > 0 || (window.screen.width >= 1024 && /Macintosh/.test(ua)))) {
    // Modern Macs predominantly Apple Silicon
    cpuArch = 'arm64 (Apple Silicon)';
  }

  return { osName, osVersion, cpuArch, deviceModel };
}

/**
 * Probes browser APIs, High-Entropy Client Hints, and WebGL contexts
 * to extract exact hardware telemetry, unmasked GPU chipsets, and workstation specs.
 */
export async function getExactDeviceTelemetry(): Promise<DeviceTelemetry> {
  if (typeof window === 'undefined') {
    return DEFAULT_TELEMETRY;
  }

  if (cachedTelemetry) {
    return cachedTelemetry;
  }

  if (telemetryPromise) {
    return telemetryPromise;
  }

  telemetryPromise = (async () => {
    try {
      const ua = navigator.userAgent || '';
      const fallback = parseUserAgentFallback(ua);
      const gpu = getWebGLGpuInfo();

      let deviceModel = fallback.deviceModel;
      let osName = fallback.osName;
      let osVersion = fallback.osVersion;
      let cpuArch = fallback.cpuArch;

      // 1. High-Entropy Client Hints (Chromium 90+, Edge, Chrome)
      const navAny = navigator as any;
      if (navAny.userAgentData && typeof navAny.userAgentData.getHighEntropyValues === 'function') {
        try {
          const hints = await navAny.userAgentData.getHighEntropyValues([
            'model',
            'platform',
            'platformVersion',
            'architecture',
            'bitness',
          ]);

          if (hints.model && hints.model.trim()) {
            deviceModel = hints.model.trim();
          }
          if (hints.platform) {
            osName = hints.platform;
          }
          if (hints.platformVersion) {
            osVersion = hints.platformVersion;
          }
          if (hints.architecture) {
            cpuArch = `${hints.architecture}${hints.bitness ? ` (${hints.bitness}-bit)` : ''}`;
          }
        } catch (hintErr) {
          console.warn('[Telemetry] High-Entropy hints rejected or throttled:', hintErr);
        }
      }

      // If device model is still blank or default, refine it with screen & GPU hints
      if (!deviceModel || deviceModel === 'Personal Computer' || deviceModel === 'Workstation Terminal') {
        if (osName === 'Windows') {
          deviceModel = 'Windows Desktop / Workstation';
        } else if (osName === 'macOS') {
          deviceModel = gpu.gpuRenderer.includes('Apple')
            ? `Mac (${gpu.gpuRenderer})`
            : 'Apple Macintosh Workstation';
        } else if (osName === 'Linux') {
          deviceModel = 'Linux Workstation';
        }
      }

      const screenResolution = `${window.screen?.width || 1920}x${window.screen?.height || 1080}`;
      const pixelRatio = window.devicePixelRatio || 1;

      const result: DeviceTelemetry = {
        deviceModel,
        osName,
        osVersion,
        cpuArch,
        gpuRenderer: gpu.gpuRenderer,
        gpuVendor: gpu.gpuVendor,
        screenResolution,
        pixelRatio,
      };

      cachedTelemetry = result;
      return result;
    } catch (err) {
      console.warn('[Telemetry] Device extraction error:', err);
      return DEFAULT_TELEMETRY;
    }
  })();

  return telemetryPromise;
}

/**
 * Synchronous accessor for currently cached telemetry (or sensible defaults).
 */
export function getCachedDeviceTelemetry(): DeviceTelemetry {
  return cachedTelemetry || DEFAULT_TELEMETRY;
}
