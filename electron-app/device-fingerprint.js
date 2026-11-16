/**
 * Anti-Detect Device Fingerprint Generator & Injector for Topify
 * Generates and deterministically persists realistic, cohesive device profiles
 * (CPU cores, RAM, GPU vendor/renderer, OS, Screen resolution, Client Hints)
 * for each Facebook account/profile to prevent checkpoints and session invalidation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Realistic Hardware & OS Profiles
const DEVICE_PRESETS = [
  {
    id: 'win11_rtx3060',
    name: 'Windows 11 | Core i7 | RTX 3060 | 16GB RAM',
    os: 'Windows 11',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 12,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'win11_rtx4070',
    name: 'Windows 11 | Core i9 | RTX 4070 | 32GB RAM',
    os: 'Windows 11',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 16,
    deviceMemory: 32,
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'win11_iris_xe',
    name: 'Windows 11 Laptop | Core i5 | Intel Iris Xe | 16GB RAM',
    os: 'Windows 11',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 8,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1032,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1.25,
    }
  },
  {
    id: 'win10_rx6700xt',
    name: 'Windows 10 | Ryzen 7 | Radeon RX 6700 XT | 16GB RAM',
    os: 'Windows 10',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 8,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'win10_gtx1660',
    name: 'Windows 10 | Core i7 | GTX 1660 SUPER | 16GB RAM',
    os: 'Windows 10',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 8,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'macos_m2_pro',
    name: 'macOS Sonoma | Apple M2 Pro | 16GB RAM',
    os: 'macOS Sonoma',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'macOS',
      platformVersion: '14.5.0',
      architecture: 'arm',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 10,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)',
    },
    screen: {
      width: 1512,
      height: 982,
      availWidth: 1512,
      availHeight: 957,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2,
    }
  },
  {
    id: 'macos_m1_air',
    name: 'macOS Sonoma | Apple M1 | 8GB RAM',
    os: 'macOS Sonoma',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'macOS',
      platformVersion: '14.4.1',
      architecture: 'arm',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 8,
    deviceMemory: 8,
    webgl: {
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)',
    },
    screen: {
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 875,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2,
    }
  },
  {
    id: 'macos_intel_pro',
    name: 'macOS Ventura | Core i9 | Radeon Pro 5500M | 32GB RAM',
    os: 'macOS Ventura',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'macOS',
      platformVersion: '13.6.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 8,
    deviceMemory: 32,
    webgl: {
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon Pro 5500M Metal Renderer, Unspecified Version)',
    },
    screen: {
      width: 1792,
      height: 1120,
      availWidth: 1792,
      availHeight: 1095,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2,
    }
  },
  {
    id: 'win11_uhd770',
    name: 'Windows 11 | Core i5-13400 | Intel UHD 770 | 16GB RAM',
    os: 'Windows 11',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 10,
    deviceMemory: 16,
    webgl: {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'win10_uhd630',
    name: 'Windows 10 | Core i5-10400 | Intel UHD 630 | 8GB RAM',
    os: 'Windows 10',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 6,
    deviceMemory: 8,
    webgl: {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  },
  {
    id: 'macos_m3_max',
    name: 'macOS Sonoma | Apple M3 Max | 36GB RAM',
    os: 'macOS Sonoma',
    platform: 'MacIntel',
    oscpu: 'Intel Mac OS X 10_15_7',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'macOS',
      platformVersion: '14.6.1',
      architecture: 'arm',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 14,
    deviceMemory: 32,
    webgl: {
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Max, Unspecified Version)',
    },
    screen: {
      width: 1728,
      height: 1117,
      availWidth: 1728,
      availHeight: 1092,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 2,
    }
  },
  {
    id: 'win11_rtx4080',
    name: 'Windows 11 | Ryzen 9 | RTX 4080 | 32GB RAM',
    os: 'Windows 11',
    platform: 'Win32',
    oscpu: 'Windows NT 10.0; Win64; x64',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    clientHints: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      bitness: '64',
      model: '',
    },
    hardwareConcurrency: 16,
    deviceMemory: 32,
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    },
    screen: {
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1,
    }
  }
];

/**
 * Deterministically hash a string into a positive integer
 */
function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get or create a persistent device profile for an account/safeProfileId.
 * If fingerprint.json already exists in the profile folder, it is loaded.
 * Otherwise, a cohesive preset is chosen deterministically and saved.
 */
function getOrCreateDeviceProfile(safeProfileId, profileDir) {
  const targetDir = profileDir || path.join(os.homedir(), '.autopost', 'profiles', safeProfileId);
  const fpFile = path.join(targetDir, 'device_fingerprint.json');

  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) { }
  }

  // 1. Try reading existing saved fingerprint
  if (fs.existsSync(fpFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(fpFile, 'utf8'));
      if (data && data.userAgent && data.hardwareConcurrency && data.webgl) {
        return data;
      }
    } catch (e) {
      console.warn(`[Fingerprint] Lỗi đọc ${fpFile}, tạo mới cấu hình...`, e.message);
    }
  }

  // 2. Select preset deterministically by safeProfileId hash
  const hash = hashString(safeProfileId);
  const presetIndex = hash % DEVICE_PRESETS.length;
  const chosenPreset = { ...DEVICE_PRESETS[presetIndex] };

  // Add consistent locale and timezone
  chosenPreset.locale = 'vi-VN';
  chosenPreset.timezoneId = 'Asia/Ho_Chi_Minh';
  chosenPreset.languages = ['vi-VN', 'vi', 'en-US', 'en'];
  chosenPreset.createdTime = new Date().toISOString();
  chosenPreset.profileId = safeProfileId;

  // 3. Persist to disk
  try {
    fs.writeFileSync(fpFile, JSON.stringify(chosenPreset, null, 2), 'utf8');
    console.log(`[Fingerprint] Đã khởi tạo & lưu cấu hình thiết bị cho profile [${safeProfileId}]: ${chosenPreset.name}`);
  } catch (e) {
    console.error(`[Fingerprint] Không thể lưu file cấu hình ${fpFile}:`, e.message);
  }

  return chosenPreset;
}

/**
 * Inject anti-detect spoofing script into Playwright browser context.
 * Injects: CPU cores, RAM, GPU Vendor/Renderer (WebGL), Platform,
 * User-Agent Data (Client Hints), Screen resolution, and removes webdriver.
 */
async function injectDeviceFingerprint(browserContext, deviceProfile) {
  if (!browserContext || !deviceProfile) return;

  await browserContext.addInitScript((profile) => {
    try {
      // 1. Remove automation / webdriver signals
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });

      // 2. Hardware Concurrency (CPU Cores)
      if (profile.hardwareConcurrency) {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => profile.hardwareConcurrency,
          configurable: true,
          enumerable: true
        });
      }

      // 3. Device Memory (RAM in GB)
      if (profile.deviceMemory) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => profile.deviceMemory,
          configurable: true,
          enumerable: true
        });
      }

      // 4. Platform & OS CPU
      if (profile.platform) {
        Object.defineProperty(navigator, 'platform', {
          get: () => profile.platform,
          configurable: true,
          enumerable: true
        });
      }
      if (profile.oscpu) {
        Object.defineProperty(navigator, 'oscpu', {
          get: () => profile.oscpu,
          configurable: true,
          enumerable: true
        });
      }

      // 5. Languages
      if (profile.languages && Array.isArray(profile.languages)) {
        Object.defineProperty(navigator, 'languages', {
          get: () => profile.languages,
          configurable: true,
          enumerable: true
        });
      }

      // 6. User-Agent Data & Client Hints
      if (profile.clientHints && navigator.userAgentData) {
        const brands = [
          { brand: 'Chromium', version: '130' },
          { brand: 'Google Chrome', version: '130' },
          { brand: 'Not?A_Brand', version: '99' }
        ];

        const originalUAD = navigator.userAgentData;
        const fakeUAD = {
          brands: brands,
          mobile: false,
          platform: profile.clientHints.platform || 'Windows',
          getHighEntropyValues: async (hints) => {
            const result = {
              brands: brands,
              mobile: false,
              platform: profile.clientHints.platform || 'Windows',
            };
            if (hints.includes('platformVersion')) result.platformVersion = profile.clientHints.platformVersion || '15.0.0';
            if (hints.includes('architecture')) result.architecture = profile.clientHints.architecture || 'x86';
            if (hints.includes('bitness')) result.bitness = profile.clientHints.bitness || '64';
            if (hints.includes('model')) result.model = profile.clientHints.model || '';
            if (hints.includes('fullVersionList')) {
              result.fullVersionList = [
                { brand: 'Chromium', version: '130.0.6723.70' },
                { brand: 'Google Chrome', version: '130.0.6723.70' },
                { brand: 'Not?A_Brand', version: '99.0.0.0' }
              ];
            }
            return result;
          },
          toJSON: () => ({
            brands: brands,
            mobile: false,
            platform: profile.clientHints.platform || 'Windows',
          })
        };

        try {
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => fakeUAD,
            configurable: true,
            enumerable: true
          });
        } catch (e) { }
      }

      // 7. WebGL Vendor & Renderer Spoofing (GPU)
      if (profile.webgl) {
        const overrideWebGL = (contextProto) => {
          if (!contextProto || !contextProto.getParameter) return;
          const origGetParameter = contextProto.getParameter;

          contextProto.getParameter = function (param) {
            // UNMASKED_VENDOR_WEBGL (0x9245) or VENDOR (0x1F00)
            if (param === 0x9245 || param === 0x1F00) {
              return profile.webgl.vendor;
            }
            // UNMASKED_RENDERER_WEBGL (0x9246) or RENDERER (0x1F01)
            if (param === 0x9246 || param === 0x1F01) {
              return profile.webgl.renderer;
            }
            return origGetParameter.apply(this, arguments);
          };
        };

        if (typeof WebGLRenderingContext !== 'undefined') {
          overrideWebGL(WebGLRenderingContext.prototype);
        }
        if (typeof WebGL2RenderingContext !== 'undefined') {
          overrideWebGL(WebGL2RenderingContext.prototype);
        }
      }

      // 8. Screen Dimensions & Pixel Ratio
      if (profile.screen) {
        const s = profile.screen;
        if (s.width) Object.defineProperty(window.screen, 'width', { get: () => s.width, configurable: true });
        if (s.height) Object.defineProperty(window.screen, 'height', { get: () => s.height, configurable: true });
        if (s.availWidth) Object.defineProperty(window.screen, 'availWidth', { get: () => s.availWidth, configurable: true });
        if (s.availHeight) Object.defineProperty(window.screen, 'availHeight', { get: () => s.availHeight, configurable: true });
        if (s.colorDepth) Object.defineProperty(window.screen, 'colorDepth', { get: () => s.colorDepth, configurable: true });
        if (s.pixelDepth) Object.defineProperty(window.screen, 'pixelDepth', { get: () => s.pixelDepth, configurable: true });
        if (s.devicePixelRatio) Object.defineProperty(window, 'devicePixelRatio', { get: () => s.devicePixelRatio, configurable: true });
      }

      // 9. Standard Chrome Object
      if (!window.chrome) {
        window.chrome = {};
      }
      if (!window.chrome.runtime) {
        window.chrome.runtime = {
          PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
          PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformNaclArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
          connect: () => { },
          sendMessage: () => { }
        };
      }
      if (!window.chrome.app) {
        window.chrome.app = {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        };
      }

      // 10. Subtle AudioContext noise for unique audio fingerprint
      if (typeof AudioBuffer !== 'undefined' && AudioBuffer.prototype.getChannelData) {
        const origGetChannelData = AudioBuffer.prototype.getChannelData;
        AudioBuffer.prototype.getChannelData = function () {
          const results = origGetChannelData.apply(this, arguments);
          // Very slight deterministic micro-variation
          const seed = (profile.hardwareConcurrency || 8) * 0.0000001;
          for (let i = 0; i < Math.min(results.length, 10); i++) {
            results[i] = results[i] + seed;
          }
          return results;
        };
      }

    } catch (injectError) {
      console.error('[DeviceFingerprint] Injection error:', injectError);
    }
  }, deviceProfile);
}

module.exports = {
  DEVICE_PRESETS,
  getOrCreateDeviceProfile,
  injectDeviceFingerprint
};
