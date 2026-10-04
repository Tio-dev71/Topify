import { BrowserContext, chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { getOrGenerateFingerprint, parseProxy } from './fingerprint';
import { anonymizeProxy, closeAnonymizedProxy } from 'proxy-chain';

declare global {
  var activeBrowsers: Map<string, BrowserContext>;
  var stopFlags: Map<string, boolean>;
}

if (!global.activeBrowsers) {
  global.activeBrowsers = new Map<string, BrowserContext>();
}
if (!global.stopFlags) {
  global.stopFlags = new Map<string, boolean>();
}

export const browserManager = {
  getBrowser: (profileId: string) => {
    return global.activeBrowsers.get(profileId);
  },
  setBrowser: (profileId: string, browser: BrowserContext) => {
    global.activeBrowsers.set(profileId, browser);
    
    // Auto-remove when disconnected
    browser.on('close', () => {
      global.activeBrowsers.delete(profileId);
      const anonymizedProxy = (browser as any)._anonymizedProxyUrl;
      if (anonymizedProxy) {
        closeAnonymizedProxy(anonymizedProxy, true).catch(console.error);
      }
    });
  },
  removeBrowser: (profileId: string) => {
    global.activeBrowsers.delete(profileId);
  },
  stopTask: (profileId: string) => {
    global.stopFlags.set(profileId, true);
  },
  clearStopFlag: (profileId: string) => {
    global.stopFlags.delete(profileId);
  },
  isStopped: (profileId: string) => {
    return global.stopFlags.get(profileId) === true;
  },
  
  /**
   * Centralized method to launch a browser with Proxy and Fingerprint
   */
  launchBrowser: async (profileId: string, proxyStr?: string | null) => {
    let browser = global.activeBrowsers.get(profileId);
    if (browser) {
      console.log(`[BrowserManager] Browser already running for ${profileId}. Reusing it.`);
      return browser;
    }

    const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', profileId);
    
    // Clean stale lock files if any
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    const lockPath = path.join(userDataDir, 'SingletonLock');
    if (fs.existsSync(lockPath)) {
      let targetPid: number | null = null;
      try {
        const link = fs.readlinkSync(lockPath);
        const match = link.match(/-?(\d+)$/);
        if (match) targetPid = parseInt(match[1], 10);
      } catch (e) {}

      if (targetPid && targetPid !== process.pid) {
        try {
          process.kill(targetPid, 0); // Check if alive
          console.log(`[BrowserManager] Dọn dẹp tiến trình Chrome cũ (PID: ${targetPid}) cho ${profileId}...`);
          process.kill(targetPid, 'SIGKILL');
        } catch (e) {}
      }

      for (const file of lockFiles) {
        const p = path.join(userDataDir, file);
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (e) {}
      }
    }

    const options: any = {
      headless: true,
      args: [
        '--disable-notifications',
        '--disable-save-password-bubble',
        '--disable-features=PasswordManager,CredentialManagementAPI',
        '--start-maximized'
      ],
      viewport: null, // Let Playwright use the window size
    };

    // Apply Proxy
    let anonymizedProxyUrl: string | undefined;
    if (proxyStr) {
      const proxyConfig = parseProxy(proxyStr);
      if (proxyConfig) {
        console.log(`[BrowserManager] Applying proxy for ${profileId}: ${proxyConfig.server}`);
        if (proxyConfig.username && proxyConfig.password) {
          const proxyUrl = `http://${encodeURIComponent(proxyConfig.username)}:${encodeURIComponent(proxyConfig.password)}@${proxyConfig.server.replace('http://', '').replace('https://', '')}`;
          anonymizedProxyUrl = await anonymizeProxy(proxyUrl);
          console.log(`[BrowserManager] Anonymized proxy: ${anonymizedProxyUrl}`);
          options.proxy = { server: anonymizedProxyUrl };
        } else {
          options.proxy = { server: proxyConfig.server };
        }
      }
    }

    // Apply Random Fingerprint
    const fingerprint = getOrGenerateFingerprint(profileId);
    options.userAgent = fingerprint.userAgent;
    options.locale = fingerprint.locale;
    options.timezoneId = fingerprint.timezoneId;
    
    console.log(`[BrowserManager] Launching ${profileId} with UA: ${fingerprint.userAgent.substring(0, 30)}...`);

    browser = await chromium.launchPersistentContext(userDataDir, options);
    
    if (anonymizedProxyUrl) {
      (browser as any)._anonymizedProxyUrl = anonymizedProxyUrl;
    }

    // Inject hardware fingerprint
    await browser.addInitScript(fingerprint.initScript);

    // Auto manage state
    browser.on('close', () => {
      global.activeBrowsers.delete(profileId);
      if (anonymizedProxyUrl) {
        closeAnonymizedProxy(anonymizedProxyUrl, true).catch(console.error);
      }
    });
    global.activeBrowsers.set(profileId, browser);

    return browser;
  }
};
