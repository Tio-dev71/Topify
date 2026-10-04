const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { anonymizeProxy, closeAnonymizedProxy } = require('proxy-chain');

const activeBrowsers = new Map();

// Generate a fake fingerprint
function generateFingerprint() {
  return {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  };
}

// Parse proxy string - supports multiple formats:
// 1. http://host:port
// 2. http://user:pass@host:port
// 3. host:port
// 4. host:port:user:pass
function parseProxy(proxyStr) {
  if (!proxyStr) return null;
  
  try {
    // Format: protocol://... (URL format)
    if (proxyStr.includes('://')) {
      const url = new URL(proxyStr);
      const result = {
        server: `${url.protocol}//${url.hostname}:${url.port || 80}`
      };
      if (url.username && url.password) {
        result.username = decodeURIComponent(url.username);
        result.password = decodeURIComponent(url.password);
      }
      return result;
    }
    // Format: user:pass@host:port
    if (proxyStr.includes('@') && !proxyStr.includes('://')) {
      const [credentials, hostPort] = proxyStr.split('@');
      const [username, password] = credentials.split(':');
      const [host, port] = (hostPort || '').split(':');
      if (host && port) {
        return {
          server: `http://${host}:${port}`,
          username,
          password
        };
      }
    }
    
    // Format: host:port or host:port:user:pass
    const parts = proxyStr.trim().split(':');
    if (parts.length === 2) {
      return { server: `http://${parts[0]}:${parts[1]}` };
    } else if (parts.length === 4) {
      return {
        server: `http://${parts[0]}:${parts[1]}`,
        username: parts[2],
        password: parts[3]
      };
    }
  } catch (e) {
    console.error('[parseProxy] Failed to parse:', proxyStr, e);
  }
  
  return null;
}

async function generateTOTP(secret) {
  try {
    const cleanSecret = (secret || '')
      .toUpperCase()
      .replace(/[^A-Z2-7]/g, (char) => {
        if (char === '0') return 'O';
        if (char === '1') return 'I';
        if (char === '8') return 'B';
        if (char === '9') return 'Q';
        return '';
      });

    // Try using otpauth if available
    const { TOTP, Secret } = require('otpauth');
    const totp = new TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(cleanSecret)
    });
    return totp.generate();
  } catch (e) {
    // Fallback: try totp-generator
    try {
      const cleanSecret = (secret || '')
        .toUpperCase()
        .replace(/[^A-Z2-7]/g, (char) => {
          if (char === '0') return 'O';
          if (char === '1') return 'I';
          if (char === '8') return 'B';
          if (char === '9') return 'Q';
          return '';
        });
      const { TOTP: TotpGen } = require('totp-generator');
      const { otp } = await TotpGen.generate(cleanSecret);
      return otp;
    } catch (e2) {
      console.error('[TOTP] Both otpauth and totp-generator failed:', e.message, e2.message);
      throw new Error('Không thể tạo mã 2FA. Kiểm tra lại secret key.');
    }
  }
}

async function runPlaywrightLogin(accountData) {
  const { id, uid, password, twoFactorCode, profileId, proxy } = accountData;
  let browser = activeBrowsers.get(profileId);

  try {
    if (browser && browser.proxyConfigStr !== (proxy || '')) {
      console.log('[Playwright] Proxy configuration changed, restarting browser...');
      await browser.close().catch(() => {});
      activeBrowsers.delete(profileId);
      browser = null;
    }

    if (!browser) {
      const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', profileId);
      const lockFile = path.join(userDataDir, 'SingletonLock');
      
      if (fs.existsSync(lockFile)) {
        throw new Error('Trình duyệt của tài khoản này đang được mở. Hãy tắt nó trước!');
      }

      const options = {
        headless: false,
        args: [
          '--disable-notifications',
          '--disable-save-password-bubble',
          '--disable-features=PasswordManager,CredentialManagementAPI',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--no-sandbox'
        ],
        viewport: null
      };

      // Parse and set proxy
      let anonymizedProxyUrl;
      if (proxy) {
        const proxyConfig = parseProxy(proxy);
        if (proxyConfig) {
          console.log('[Playwright] Using proxy:', proxyConfig.server);
          if (proxyConfig.username && proxyConfig.password) {
            const proxyUrl = `http://${encodeURIComponent(proxyConfig.username)}:${encodeURIComponent(proxyConfig.password)}@${proxyConfig.server.replace('http://', '').replace('https://', '')}`;
            anonymizedProxyUrl = await anonymizeProxy(proxyUrl);
            console.log('[Playwright] Anonymized proxy:', anonymizedProxyUrl);
            options.proxy = { server: anonymizedProxyUrl };
          } else {
            options.proxy = { server: proxyConfig.server };
          }
        } else {
          console.warn('[Playwright] Failed to parse proxy string:', proxy);
        }
      }

      const fp = generateFingerprint();
      options.userAgent = fp.userAgent;
      options.locale = fp.locale;
      options.timezoneId = fp.timezoneId;

      try {
        options.channel = 'chrome'; // Thử dùng Google Chrome trước
        browser = await chromium.launchPersistentContext(userDataDir, options);
      } catch (e) {
        console.log('[Playwright] Chrome không khả dụng, thử dùng Edge...');
        options.channel = 'msedge'; // Fallback sang Microsoft Edge
        browser = await chromium.launchPersistentContext(userDataDir, options);
      }
      
      browser.proxyConfigStr = proxy || ''; // Save current proxy to detect changes later
      
      await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      browser.on('close', () => {
        activeBrowsers.delete(profileId);
        const anonymizedProxy = browser._anonymizedProxyUrl;
        if (anonymizedProxy) {
          closeAnonymizedProxy(anonymizedProxy, true).catch(console.error);
        }
      });
      activeBrowsers.set(profileId, browser);
    }

    // Login Flow
    let pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com'));
    
    if (!page) page = pages[pages.length - 1];
    
    // Close other tabs
    for (const p of pages) {
      if (p !== page) await p.close().catch(() => {});
    }

    if (!page) {
      page = await browser.newPage();
    }

    await page.bringToFront();
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('div[role="navigation"]') || !!document.querySelector('form[action*="/search/"]');
    });

    if (isLoggedIn) {
      return { success: true, message: 'Already logged in' };
    }

    // Fill credentials
    await page.waitForSelector('input[name="email"], #email', { timeout: 10000 });
    await page.fill('input[name="email"], #email', uid);
    await page.fill('input[name="pass"], #pass', password);
    await page.waitForTimeout(500);

    // Click login button - try multiple selectors
    console.log('[Playwright] Attempting to click login button...');
    const loginSelectors = [
      'button[name="login"]',
      'button[type="submit"]',
      'button[data-loginbutton="true"]',
      '[data-testid="royal_login_button"]',
      'button:has-text("Đăng nhập")',
      'button:has-text("Log in")',
      'button:has-text("Log In")',
    ];

    let clicked = false;
    for (const selector of loginSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('[Playwright] Found login button with selector:', selector);
          await btn.click({ force: true });
          clicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!clicked) {
      // Last resort: press Enter
      console.log('[Playwright] No login button found, pressing Enter...');
      await page.keyboard.press('Enter');
    }

    // Wait for navigation after login
    await page.waitForTimeout(3000);

    // Check for login errors
    const loginError = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('không kết nối với tài khoản nào') || 
             text.includes('không chính xác') ||
             text.includes('the password that you') ||
             text.includes('find your account');
    });

    if (loginError) {
      throw new Error('Sai tài khoản hoặc mật khẩu');
    }

    // Handle 2FA
    const isTwoFactor = await page.evaluate(() => {
      return !!document.querySelector('#approvals_code') || 
             document.body.innerText.includes('Nhập mã') ||
             document.body.innerText.includes('Enter the code') ||
             document.body.innerText.includes('two-factor');
    });

    if (isTwoFactor) {
      if (!twoFactorCode) throw new Error('Yêu cầu mã 2FA nhưng không có Secret Key');

      const token = await generateTOTP(twoFactorCode);
      console.log('[Playwright] Generated 2FA token, entering...');
      
      const codeInput = page.locator('#approvals_code');
      if (await codeInput.count() > 0) {
        await codeInput.fill(token);
        await page.waitForTimeout(500);
        
        const submitBtn = page.locator('#checkpointSubmitButton');
        if (await submitBtn.count() > 0) {
          await submitBtn.click({ force: true });
        }
        await page.waitForTimeout(3000);
      }
    }

    // Handle "Save Browser" prompt
    try {
      const saveBrowserBtn = page.locator('#checkpointSubmitButton, button[value="OK"]');
      if (await saveBrowserBtn.count() > 0) {
        await saveBrowserBtn.first().click({ force: true });
        await page.waitForTimeout(2000);
      }
    } catch (e) {}

    return { success: true, message: 'Login completed' };

  } catch (error) {
    console.error('[Playwright Runner Error]', error);
    throw error;
  }
}

module.exports = { runPlaywrightLogin, activeBrowsers, parseProxy, generateFingerprint };

// Bắt đầu vòng lặp chụp màn hình cho Live Dashboard (mỗi 3 giây)
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

setInterval(async () => {
  for (const [profileId, browser] of activeBrowsers.entries()) {
    try {
      // browser is actually a BrowserContext from launchPersistentContext
      const pages = await browser.pages();
      // Ưu tiên tab Facebook, hoặc tab đang active
      let page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed());
      if (!page) {
        page = pages.find(p => !p.isClosed());
      }
      
      if (page && !page.isClosed()) {
        const screenshotPath = path.join(screenshotsDir, `${profileId}.jpg`);
        await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 40, timeout: 5000 }).catch(e => {
          console.error('[Live Dashboard] Failed to take screenshot for', profileId, e.message);
        });
      }
    } catch (e) {
      // Bỏ qua lỗi chụp màn hình để không làm gián đoạn tiến trình
      console.error('[Live Dashboard] Loop error for', profileId, e.message);
    }
  }
}, 3000);
