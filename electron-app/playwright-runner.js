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

function parseCookies(cookieInput, defaultDomain = '.facebook.com') {
  if (!cookieInput) return [];
  const cookies = [];

  // Try parsing as JSON first
  if (typeof cookieInput === 'string' && (cookieInput.trim().startsWith('[') || cookieInput.trim().startsWith('{'))) {
    try {
      const parsed = JSON.parse(cookieInput);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        const name = item.name || item.key;
        const value = item.value;
        if (name && value !== undefined) {
          cookies.push({
            name: String(name).trim(),
            value: String(value).trim(),
            domain: item.domain || defaultDomain,
            path: item.path || '/',
            httpOnly: !!item.httpOnly,
            secure: item.secure !== undefined ? !!item.secure : true,
            sameSite: item.sameSite || 'Lax'
          });
        }
      }
      if (cookies.length > 0) return cookies;
    } catch (e) {}
  }

  // Format: key=value; key2=value2;
  if (typeof cookieInput === 'string') {
    const pairs = cookieInput.split(';');
    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const name = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (name) {
          cookies.push({
            name,
            value,
            domain: defaultDomain,
            path: '/',
            secure: true,
            sameSite: 'Lax'
          });
        }
      }
    }
  }

  return cookies;
}

function cleanStaleLockFiles(userDataDir) {
  if (!fs.existsSync(userDataDir)) return;
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  const lockPath = path.join(userDataDir, 'SingletonLock');
  
  let targetPid = null;
  try {
    const link = fs.readlinkSync(lockPath);
    const match = link.match(/-?(\d+)$/);
    if (match) targetPid = parseInt(match[1], 10);
  } catch (e) {}

  if (targetPid) {
    try {
      process.kill(targetPid, 0); // Check if alive
      console.log(`[LockCleaner] Dọn dẹp tiến trình Chrome cũ (PID: ${targetPid}) cho ${userDataDir}...`);
      process.kill(targetPid, 'SIGKILL');
    } catch (e) {}
  }

  for (const file of lockFiles) {
    const p = path.join(userDataDir, file);
    try {
      fs.unlinkSync(p);
    } catch (e) {}
  }
}

async function dismissFacebookPopups(page) {
  try {
    const dismissSelectors = [
      'div[role="button"]:has-text("Dismiss")',
      'div[role="button"]:has-text("Bỏ qua")',
      'button:has-text("Dismiss")',
      'button:has-text("Bỏ qua")',
      'div[aria-label="Lúc khác"]',
      'div[aria-label="Not Now"]',
      'div[aria-label="Đóng"]',
      'div[aria-label="Close"]',
      'div[role="button"]:has-text("Lúc khác")',
      'div[role="button"]:has-text("Not now")'
    ];
    for (const sel of dismissSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        await el.click({ force: true });
        await page.waitForTimeout(1000);
      }
    }
  } catch (e) {}
}

async function checkFacebookLoggedIn(browser, page) {
  try {
    const cookies = await browser.cookies('https://www.facebook.com');
    const hasCUser = cookies.some(c => c.name === 'c_user' && c.value && String(c.value).trim() !== '');

    const isDomLoggedIn = await page.evaluate(() => {
      const nav = document.querySelector('div[role="navigation"]') ||
                  document.querySelector('div[role="banner"]') ||
                  document.querySelector('form[action*="/search/"]') ||
                  document.querySelector('div[aria-label="Account"]') ||
                  document.querySelector('div[aria-label="Tài khoản"]') ||
                  document.querySelector('svg[aria-label="Your profile"]') ||
                  document.querySelector('[aria-label="Facebook"][role="link"]');
      const hasLoginForm = document.querySelector('input[name="email"]') ||
                          document.querySelector('#email') ||
                          document.querySelector('button[name="login"]');
      return !!nav && !hasLoginForm;
    }).catch(() => false);

    const isLoginOrCheckpoint = page.url().includes('/login') || page.url().includes('/checkpoint');
    return (hasCUser || isDomLoggedIn) && !isLoginOrCheckpoint;
  } catch (e) {
    return false;
  }
}

async function syncCookiesToApi(browser, accountId) {
  if (!accountId) return;
  try {
    const cookies = await browser.cookies('https://www.facebook.com');
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    if (cookieStr) {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
      await fetch(`${apiUrl}/facebook-accounts/login`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: accountId,
          status: 'LIVE',
          cookie: cookieStr
        })
      }).catch(() => {});
    }
  } catch (e) {}
}

async function cleanupExtraTabs(browser, mainPage) {
  try {
    if (!browser) return;
    const allPages = browser.pages();
    for (const p of allPages) {
      if (p !== mainPage && !p.isClosed()) {
        const url = p.url();
        if (url === 'about:blank' || url === '' || url.startsWith('chrome://') || !url.includes('facebook.com')) {
          await p.close().catch(() => {});
        }
      }
    }
    if (mainPage && !mainPage.isClosed()) {
      await mainPage.bringToFront().catch(() => {});
    }
  } catch (e) {}
}

async function runPlaywrightLogin(accountData) {
  const { id, uid, password, twoFactorCode, cookie, profileId, proxy } = accountData;
  let browser = activeBrowsers.get(profileId);

  try {
    if (browser && browser.proxyConfigStr !== (proxy || '')) {
      console.log('[Playwright] Cấu hình proxy thay đổi, khởi động lại trình duyệt...');
      await browser.close().catch(() => {});
      activeBrowsers.delete(profileId);
      browser = null;
    }

    const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', profileId);

    const buildLaunchOptions = (proxyString) => {
      const fp = generateFingerprint();
      const options = {
        headless: false,
        args: [
          '--disable-notifications',
          '--disable-save-password-bubble',
          '--disable-features=PasswordManager,CredentialManagementAPI',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--no-sandbox',
          '--test-type',
          '--no-default-browser-check',
          '--no-first-run'
        ],
        viewport: null,
        userAgent: fp.userAgent,
        locale: fp.locale,
        timezoneId: fp.timezoneId
      };

      if (proxyString) {
        const proxyConfig = parseProxy(proxyString);
        if (proxyConfig) {
          options.proxy = { server: proxyConfig.server };
          if (proxyConfig.username && proxyConfig.password) {
            options.proxy.username = proxyConfig.username;
            options.proxy.password = proxyConfig.password;
          }
        }
      }

      return options;
    };

    const launchBrowserInstance = async (opts) => {
      try {
        return await chromium.launchPersistentContext(userDataDir, { ...opts, channel: 'chrome' });
      } catch (err) {
        console.log('[Playwright] Không tìm thấy Chrome, sử dụng Chromium mặc định...');
        const fallbackOpts = { ...opts };
        delete fallbackOpts.channel;
        return await chromium.launchPersistentContext(userDataDir, fallbackOpts);
      }
    };

    if (!browser) {
      cleanStaleLockFiles(userDataDir);

      let currentProxyToUse = proxy || null;
      let launchOpts = buildLaunchOptions(currentProxyToUse);

      try {
        browser = await launchBrowserInstance(launchOpts);
      } catch (launchErr) {
        if (currentProxyToUse) {
          console.warn('[Playwright] Khởi động với proxy lỗi, tự động chuyển sang kết nối trực tiếp:', launchErr.message);
          cleanStaleLockFiles(userDataDir);
          currentProxyToUse = null;
          launchOpts = buildLaunchOptions(null);
          browser = await launchBrowserInstance(launchOpts);
        } else {
          throw launchErr;
        }
      }

      browser.proxyConfigStr = currentProxyToUse || '';

      await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      browser.on('page', async (newPage) => {
        try {
          await newPage.waitForLoadState('domcontentloaded').catch(() => {});
          if (newPage.url() === 'about:blank' && browser.pages().length > 1) {
            await newPage.close().catch(() => {});
          }
        } catch (e) {}
      });

      browser.on('close', () => {
        activeBrowsers.delete(profileId);
      });
      activeBrowsers.set(profileId, browser);
    }

    // Login Flow
    let pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());

    await cleanupExtraTabs(browser, page);
    await page.bringToFront();

    // Nạp Cookie nếu có
    if (cookie) {
      const parsedCookies = parseCookies(cookie, '.facebook.com');
      if (parsedCookies.length > 0) {
        console.log(`[Playwright] Nạp ${parsedCookies.length} cookie cho UID ${uid}...`);
        await browser.addCookies(parsedCookies).catch(e => console.warn('[Playwright] addCookies error:', e.message));
      }
    }

    // Điều hướng vào Facebook với cơ chế dự phòng khi proxy hỏng
    try {
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await cleanupExtraTabs(browser, page);
    } catch (navErr) {
      const msg = (navErr.message || '').toLowerCase();
      const isProxyFailure = msg.includes('err_tunnel_connection_failed') ||
                             msg.includes('err_proxy_connection_failed') ||
                             msg.includes('err_connection_refused') ||
                             msg.includes('err_timed_out') ||
                             msg.includes('timeout');

      if (browser.proxyConfigStr && isProxyFailure) {
        console.warn(`[Playwright] Proxy ${browser.proxyConfigStr} gặp sự cố (${navErr.message}). Tự động đổi sang kết nối mạng trực tiếp...`);
        await browser.close().catch(() => {});
        activeBrowsers.delete(profileId);
        cleanStaleLockFiles(userDataDir);

        const directOpts = buildLaunchOptions(null);
        browser = await launchBrowserInstance(directOpts);
        browser.proxyConfigStr = '';
        activeBrowsers.set(profileId, browser);

        pages = browser.pages();
        page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());
        await cleanupExtraTabs(browser, page);
        await page.bringToFront();

        if (cookie) {
          const parsedCookies = parseCookies(cookie, '.facebook.com');
          if (parsedCookies.length > 0) await browser.addCookies(parsedCookies).catch(() => {});
        }

        await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
        await cleanupExtraTabs(browser, page);
      } else {
        throw navErr;
      }
    }

    await page.waitForTimeout(2000);
    await cleanupExtraTabs(browser, page);
    await dismissFacebookPopups(page);

    // Kiểm tra xem đã đăng nhập chưa
    if (await checkFacebookLoggedIn(browser, page)) {
      console.log(`[Playwright] Tài khoản ${uid} đã đăng nhập sẵn thành công.`);
      let cookieStr = '';
      try {
        const cookies = await browser.cookies('https://www.facebook.com');
        cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      } catch (e) {}
      await syncCookiesToApi(browser, id);
      return { success: true, message: 'Already logged in', cookie: cookieStr };
    }

    // Xử lý màn hình đăng nhập hoặc màn hình CAA "Lưu tài khoản" (Saved Profile)
    let emailInput = page.locator('input[name="email"], #email').first();
    let hasEmail = await emailInput.isVisible({ timeout: 2500 }).catch(() => false);

    if (!hasEmail) {
      const otherProfileBtn = page.locator(
        'div[role="button"]:has-text("Use another profile"), ' +
        'div[role="button"]:has-text("Dùng trang cá nhân khác"), ' +
        'div[role="button"]:has-text("Đăng nhập bằng tài khoản khác"), ' +
        'div[aria-label*="another profile"], ' +
        'div[aria-label*="trang cá nhân khác"]'
      ).first();

      if (await otherProfileBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
        console.log('[Playwright] Nhấp "Dùng trang cá nhân khác"...');
        await otherProfileBtn.click();
        await page.waitForSelector('input[name="email"], #email, input[name="pass"]', { timeout: 7000 }).catch(() => {});
        hasEmail = await emailInput.isVisible({ timeout: 2500 }).catch(() => false);
      }
    }

    if (hasEmail) {
      console.log(`[Playwright] Điền tài khoản và mật khẩu cho UID ${uid}...`);
      await emailInput.fill(uid);
      await page.waitForTimeout(300);
      const passInput = page.locator('input[name="pass"], #pass').first();
      await passInput.fill(password);
    } else {
      const continueBtn = page.locator(
        'div[role="button"]:has-text("Continue"), ' +
        'div[role="button"]:has-text("Tiếp tục"), ' +
        'div[aria-label*="Continue"], ' +
        'div[aria-label*="Tiếp tục"]'
      ).first();

      if (await continueBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
        console.log('[Playwright] Nhấp "Tiếp tục" cho tài khoản đã lưu...');
        await continueBtn.click();
        await page.waitForSelector('input[name="pass"], #pass', { timeout: 7000 }).catch(() => {});
        const passInput = page.locator('input[name="pass"], #pass').first();
        await passInput.fill(password);
      } else {
        // Fallback: chuyển đến trang login trực tiếp
        console.log('[Playwright] Chuyển đến facebook.com/login/...');
        await page.goto('https://www.facebook.com/login/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        emailInput = page.locator('input[name="email"], #email').first();
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await emailInput.fill(uid);
          await page.waitForTimeout(300);
          const passInput = page.locator('input[name="pass"], #pass').first();
          await passInput.fill(password);
        }
      }
    }

    await page.waitForTimeout(500);

    // Bấm nút đăng nhập
    const submitBtn = page.locator(
      'button[name="login"], ' +
      'button[type="submit"], ' +
      'button[data-loginbutton="true"], ' +
      '[data-testid="royal_login_button"], ' +
      '#loginbutton, ' +
      'button:has-text("Đăng nhập"), ' +
      'button:has-text("Log in"), ' +
      'button:has-text("Log In")'
    ).first();

    if (await submitBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await submitBtn.click({ force: true });
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(5000);

    // Kiểm tra sai mật khẩu
    const loginError = await page.evaluate(() => {
      const text = (document.body ? document.body.innerText : '').toLowerCase();
      return text.includes('không kết nối với tài khoản nào') || 
             text.includes('không chính xác') ||
             text.includes('the password that you') ||
             text.includes('find your account') ||
             text.includes('sai mật khẩu') ||
             text.includes('mật khẩu không đúng');
    });

    if (loginError) {
      throw new Error('Sai tài khoản hoặc mật khẩu');
    }

    // Xử lý 2FA (cả dạng modern /two_step_verification lẫn legacy checkpoint)
    const pageText = await page.evaluate(() => document.body ? document.body.innerText : '');
    const isTwoFactor = page.url().includes('two_step_verification') ||
                        page.url().includes('two_factor') ||
                        page.url().includes('checkpoint') ||
                        pageText.includes('two-factor') ||
                        pageText.includes('6-digit code') ||
                        pageText.includes('authentication app') ||
                        pageText.includes('Xác thực hai yếu tố') ||
                        pageText.includes('Xác thực 2 yếu tố') ||
                        pageText.includes('Nhập mã');

    if (isTwoFactor) {
      if (!twoFactorCode) {
        throw new Error('Tài khoản yêu cầu mã 2FA nhưng không có Secret Key');
      }

      console.log(`[Playwright] Tạo mã 2FA TOTP cho UID ${uid}...`);
      const token = await generateTOTP(twoFactorCode);
      console.log(`[Playwright] Mã 2FA TOTP đã tạo: ${token}`);

      const codeInput = page.locator(
        'input[type="text"]:visible, ' +
        'input[inputmode="numeric"]:visible, ' +
        'input[autocomplete="one-time-code"]:visible, ' +
        '#approvals_code:visible, ' +
        'input[name="approvals_code"]:visible'
      ).first();

      if (await codeInput.isVisible({ timeout: 8000 }).catch(() => false)) {
        await codeInput.fill(token);
        await page.waitForTimeout(500);

        const continue2FA = page.locator(
          'div[role="button"]:has-text("Continue"):visible, ' +
          'div[role="button"]:has-text("Tiếp tục"):visible, ' +
          'button:has-text("Continue"):visible, ' +
          'button:has-text("Tiếp tục"):visible, ' +
          '#checkpointSubmitButton:visible'
        ).first();

        if (await continue2FA.isVisible({ timeout: 2000 }).catch(() => false)) {
          await continue2FA.click({ force: true });
        } else {
          await codeInput.press('Enter');
        }

        await page.waitForTimeout(7000);
      }
    }

    // Xử lý màn hình "Lưu trình duyệt" (Save Browser) hoặc thông báo tạm
    await dismissFacebookPopups(page);
    try {
      const trustBtn = page.locator(
        'div[role="button"]:has-text("Continue"):visible, ' +
        'div[role="button"]:has-text("Tiếp tục"):visible, ' +
        'button:has-text("Save Browser"):visible, ' +
        'button:has-text("Lưu trình duyệt"):visible, ' +
        'button[value="OK"]:visible, ' +
        '#checkpointSubmitButton:visible'
      ).first();
      if (await trustBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trustBtn.click({ force: true });
        await page.waitForTimeout(3000);
      }
    } catch (e) {}

    await dismissFacebookPopups(page);

    // Đồng bộ lại cookie vào DB
    let cookieStr = '';
    try {
      const cookies = await browser.cookies('https://www.facebook.com');
      cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    } catch (e) {}

    await syncCookiesToApi(browser, id);

    return { success: true, message: 'Login completed', cookie: cookieStr };

  } catch (error) {
    console.error('[Playwright Runner Error]', error);
    throw error;
  }
}

const latestScreenshots = new Map();

// Bắt đầu vòng lặp chụp màn hình cho Live Dashboard (mỗi 2.5 giây)
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  try {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  } catch (e) {}
}

setInterval(async () => {
  // Clean up stale screenshots if browser is closed
  for (const profileId of latestScreenshots.keys()) {
    if (!activeBrowsers.has(profileId)) {
      latestScreenshots.delete(profileId);
      try {
        const p = path.join(screenshotsDir, `${profileId}.jpg`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) {}
    }
  }

  for (const [profileId, browser] of activeBrowsers.entries()) {
    try {
      if (!browser) continue;
      const pages = await browser.pages();
      // Ưu tiên tab Facebook, hoặc tab đang active
      let page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed());
      if (!page) {
        page = pages.find(p => !p.isClosed());
      }
      
      if (page && !page.isClosed()) {
        const title = await page.title().catch(() => 'Facebook');
        const url = page.url();
        const buffer = await page.screenshot({ type: 'jpeg', quality: 50, timeout: 4000 }).catch(() => null);

        if (buffer) {
          const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
          latestScreenshots.set(profileId, {
            screenshot: base64,
            url,
            title,
            timestamp: Date.now()
          });

          try {
            const screenshotPath = path.join(screenshotsDir, `${profileId}.jpg`);
            fs.writeFileSync(screenshotPath, buffer);
          } catch (e) {}
        }
      }
    } catch (e) {
      // Bỏ qua lỗi chụp màn hình để không làm gián đoạn tiến trình
    }
  }
}, 2500);

module.exports = {
  runPlaywrightLogin,
  activeBrowsers,
  parseProxy,
  generateFingerprint,
  latestScreenshots,
  generateTOTP,
  parseCookies,
  cleanStaleLockFiles,
  dismissFacebookPopups,
  checkFacebookLoggedIn,
  syncCookiesToApi
};
