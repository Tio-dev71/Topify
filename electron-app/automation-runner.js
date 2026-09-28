const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const {
  activeBrowsers,
  parseProxy,
  generateFingerprint,
  generateTOTP,
  parseCookies,
  cleanStaleLockFiles,
  dismissFacebookPopups,
  checkFacebookLoggedIn,
  syncCookiesToApi
} = require('./playwright-runner');

const stopFlags = new Set(); // Keep track of stopped tasks

async function stopTask(taskId) {
  stopFlags.add(taskId);
}

async function safeWait(page, ms) {
  await page.waitForTimeout(ms);
}

async function logHistory(profileId, actionType, link, message) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    await fetch(`${apiUrl}/automation-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, actionType, link, message })
    });
  } catch(e) {}
}

const {
  taskFbFarmReels,
  taskFbAutoInteract,
  taskFbAddFriendsGroup,
  taskFbInviteToGroup,
  taskFbBuffPost
} = require('./automation-actions');

/**
 * Đảm bảo tài khoản đã đăng nhập 100% tự động
 * 1. Tự động nạp Cookie đã lưu vào browser context
 * 2. Nếu Cookie chưa có hoặc hết hạn -> Tự động chạy kịch bản Auto-login (UID, Password, 2FA TOTP)
 */
async function ensureFacebookAuthenticated(browser, page, accountData, profileId) {
  console.log(`[Automation] Kiểm tra phiên đăng nhập Facebook cho profile ${profileId}...`);

  // Bước 1: Nạp Cookie đã lưu nếu có
  if (accountData?.cookie) {
    const cookiesToInject = parseCookies(accountData.cookie, '.facebook.com');
    if (cookiesToInject.length > 0) {
      console.log(`[Automation] Tự động nạp ${cookiesToInject.length} cookie cho profile ${profileId}...`);
      try {
        await browser.addCookies(cookiesToInject);
      } catch (err) {
        console.warn(`[Automation] Lỗi khi nạp cookie cho ${profileId}:`, err.message);
      }
    }
  }

  // Bước 2: Tải trang Facebook
  if (page.url() === 'about:blank' || !page.url().includes('facebook.com')) {
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
  } else {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 35000 });
  }
  await safeWait(page, 2000);
  await dismissFacebookPopups(page);

  // Bước 3: Kiểm tra đã đăng nhập chưa
  let isAuthed = await checkFacebookLoggedIn(browser, page);
  if (isAuthed) {
    console.log(`[Automation] Profile ${profileId} đã đăng nhập thành công (Session/Cookie hợp lệ).`);
    await syncCookiesToApi(browser, accountData?.id);
    return true;
  }

  // Bước 4: Nếu chưa đăng nhập, chạy kịch bản Auto-login bằng UID + Password + 2FA
  const uid = accountData?.uid;
  const password = accountData?.password;

  if (!uid || !password) {
    throw new Error(`Profile ${profileId} chưa đăng nhập và không có thông tin UID/Mật khẩu để tự động đăng nhập.`);
  }

  console.log(`[Automation] Profile ${profileId} chưa có phiên đăng nhập hợp lệ. Bắt đầu Auto-login với UID: ${uid}...`);

  // Xử lý form đăng nhập hoặc CAA Remembered Profile
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
      console.log(`[Automation] Nhấp "Dùng trang cá nhân khác" cho profile ${profileId}...`);
      await otherProfileBtn.click();
      await page.waitForSelector('input[name="email"], #email, input[name="pass"]', { timeout: 7000 }).catch(() => {});
      hasEmail = await emailInput.isVisible({ timeout: 2500 }).catch(() => false);
    }
  }

  if (hasEmail) {
    console.log(`[Automation] Điền tài khoản và mật khẩu cho UID ${uid}...`);
    await emailInput.fill(uid);
    await safeWait(page, 300);
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
      console.log(`[Automation] Nhấp "Tiếp tục" cho tài khoản đã lưu ${profileId}...`);
      await continueBtn.click();
      await page.waitForSelector('input[name="pass"], #pass', { timeout: 7000 }).catch(() => {});
      const passInput = page.locator('input[name="pass"], #pass').first();
      await passInput.fill(password);
    } else {
      await page.goto('https://www.facebook.com/login/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await safeWait(page, 2000);
      emailInput = page.locator('input[name="email"], #email').first();
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(uid);
        await safeWait(page, 300);
        const passInput = page.locator('input[name="pass"], #pass').first();
        await passInput.fill(password);
      } else {
        throw new Error(`Không tìm thấy form đăng nhập Facebook cho profile ${profileId}`);
      }
    }
  }

  await safeWait(page, 500);

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

  await safeWait(page, 4000);

  // Kiểm tra lỗi đăng nhập
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
    throw new Error(`Sai tài khoản hoặc mật khẩu cho UID ${uid}`);
  }

  // Xử lý 2FA nếu có yêu cầu
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
    if (!accountData.twoFactorCode) {
      throw new Error(`Tài khoản ${uid} yêu cầu mã 2FA nhưng chưa cấu hình 2FA Secret Key.`);
    }

    console.log(`[Automation] Đang sinh mã 2FA TOTP cho UID ${uid}...`);
    const token = await generateTOTP(accountData.twoFactorCode);
    console.log(`[Automation] Mã 2FA sinh thành công: ${token}, đang nhập vào form xác thực...`);

    const codeInput = page.locator(
      'input[type="text"]:visible, ' +
      'input[inputmode="numeric"]:visible, ' +
      'input[autocomplete="one-time-code"]:visible, ' +
      '#approvals_code:visible, ' +
      'input[name="approvals_code"]:visible'
    ).first();

    if (await codeInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await codeInput.fill(token);
      await safeWait(page, 500);

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

      await safeWait(page, 6000);
    }
  }

  // Xử lý nút "Lưu trình duyệt" (Save Browser) và Checkpoint dismiss
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
      await safeWait(page, 3000);
    }
  } catch (e) {}

  await dismissFacebookPopups(page);
  await safeWait(page, 2000);

  // Xác nhận lại lần cuối
  const finalCheck = await checkFacebookLoggedIn(browser, page);
  if (!finalCheck) {
    if (page.url().includes('checkpoint') && !page.url().includes('checkpoint/601051028565049')) {
      throw new Error(`Tài khoản ${uid} bị Checkpoint bởi Facebook.`);
    }
  }

  console.log(`[Automation] Auto-login thành công cho ${profileId}! Đồng bộ cookie phiên mới...`);
  await syncCookiesToApi(browser, accountData?.id);
  return true;
}

async function runAutomationStub(profileId, actionType, config, accountData) {
  let browser = activeBrowsers.get(profileId);
  let isNewBrowser = false;

  try {
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
        console.log('[Automation] Không tìm thấy Chrome, sử dụng Chromium mặc định...');
        const fallbackOpts = { ...opts };
        delete fallbackOpts.channel;
        return await chromium.launchPersistentContext(userDataDir, fallbackOpts);
      }
    };

    if (!browser) {
      cleanStaleLockFiles(userDataDir);

      let currentProxyToUse = accountData?.proxy || null;
      let launchOpts = buildLaunchOptions(currentProxyToUse);

      try {
        browser = await launchBrowserInstance(launchOpts);
      } catch (launchErr) {
        if (currentProxyToUse) {
          console.warn('[Automation] Khởi động với proxy lỗi, tự động chuyển sang kết nối trực tiếp:', launchErr.message);
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

      browser.on('close', () => {
        activeBrowsers.delete(profileId);
      });
      activeBrowsers.set(profileId, browser);
      isNewBrowser = true;
    }

    console.log(`[Automation] Starting task ${actionType} for profile ${profileId}`);
    
    let pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());
    await page.bringToFront();
    
    // TỰ ĐỘNG ĐĂNG NHẬP / NẠP COOKIE TRƯỚC KHI THỰC HIỆN TÁC VỤ (có dự phòng proxy lỗi)
    try {
      await ensureFacebookAuthenticated(browser, page, accountData, profileId);
    } catch (authErr) {
      const msg = (authErr.message || '').toLowerCase();
      const isProxyFailure = msg.includes('err_tunnel_connection_failed') ||
                             msg.includes('err_proxy_connection_failed') ||
                             msg.includes('err_connection_refused') ||
                             msg.includes('err_timed_out') ||
                             msg.includes('timeout');

      if (browser.proxyConfigStr && isProxyFailure) {
        console.warn(`[Automation] Proxy gặp sự cố khi xác thực, chuyển sang kết nối trực tiếp...`);
        await browser.close().catch(() => {});
        activeBrowsers.delete(profileId);
        cleanStaleLockFiles(userDataDir);

        const directOpts = buildLaunchOptions(null);
        browser = await launchBrowserInstance(directOpts);
        browser.proxyConfigStr = '';
        activeBrowsers.set(profileId, browser);

        pages = browser.pages();
        page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());
        await page.bringToFront();

        await ensureFacebookAuthenticated(browser, page, accountData, profileId);
      } else {
        throw authErr;
      }
    }

    // Đóng các tab rác (about:blank, chrome://...) chỉ giữ lại tab Facebook chính
    for (const p of browser.pages()) {
      if (p !== page && !p.isClosed()) {
        const url = p.url();
        if (url === 'about:blank' || url.startsWith('chrome://') || !url.includes('facebook.com')) {
          await p.close().catch(() => {});
        }
      }
    }
    await page.bringToFront();

    switch (actionType) {
      case 'fb_farm_reels':
        await taskFbFarmReels(page, config, profileId);
        break;
      case 'fb_buff_post':
        await taskFbBuffPost(page, config, profileId);
        break;
      case 'fb_auto_interact':
        await taskFbAutoInteract(page, config, profileId);
        break;
      case 'fb_add_friends_group':
        await taskFbAddFriendsGroup(page, config, profileId);
        break;
      case 'fb_invite_to_group':
        await taskFbInviteToGroup(page, config, profileId);
        break;
      default:
        console.warn(`[Automation] Unknown task type: ${actionType}`);
        await page.waitForTimeout(2000);
    }
    
    console.log(`[Automation] Finished action for ${profileId}`);
    return { success: true, profileId, message: 'Hoạt động thành công' };
  } catch (error) {
    console.error(`[Automation] Error for profile ${profileId}:`, error);
    await logHistory(profileId, actionType, '', `Lỗi: ${error.message}`);
    return { success: false, profileId, error: error.message };
  } finally {
    console.log(`[Automation] Xong task cho ${profileId}, tiến hành đóng trình duyệt...`);
    if (browser) {
      try {
        if (typeof page !== 'undefined' && page) {
          await page.close().catch(() => {});
        }
        await Promise.race([
          browser.close(),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        activeBrowsers.delete(profileId);
      } catch (e) {
        console.error(`[Automation] Lỗi khi đóng trình duyệt ${profileId}:`, e);
      }
    }
  }
}

async function startAutomationTask(taskData) {
  const { taskId, actionType, profileIds, accounts, config } = taskData;
  console.log(`[Automation] Starting Task ${taskId} with ${profileIds.length} profiles`);
  
  stopFlags.delete(taskId);
  
  const results = [];
  const concurrency = 3; // Giới hạn số trình duyệt mở cùng lúc để tránh treo máy
  
  const accountMap = new Map();
  if (Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (acc.profileId) accountMap.set(acc.profileId, acc);
      if (acc.id) accountMap.set(acc.id, acc);
      if (acc.uid) accountMap.set(acc.uid, acc);
    }
  }

  let apiAccountsLoaded = false;
  const getAccount = async (pId) => {
    if (accountMap.has(pId)) return accountMap.get(pId);
    if (!apiAccountsLoaded) {
      apiAccountsLoaded = true;
      try {
        const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${apiUrl}/facebook-accounts`);
        if (res.ok) {
          const apiAccounts = await res.json();
          if (Array.isArray(apiAccounts)) {
            for (const a of apiAccounts) {
              if (a.profileId) accountMap.set(a.profileId, a);
              if (a.id) accountMap.set(a.id, a);
              if (a.uid) accountMap.set(a.uid, a);
            }
          }
        }
      } catch (err) {
        console.warn('[Automation] Error fetching accounts from API:', err.message);
      }
    }
    return accountMap.get(pId) || null;
  };

  for (let i = 0; i < profileIds.length; i += concurrency) {
    if (stopFlags.has(taskId)) {
      console.log(`[Automation] Task ${taskId} was stopped.`);
      break;
    }
    
    const chunk = profileIds.slice(i, i + concurrency);
    console.log(`[Automation] Running batch ${Math.floor(i / concurrency) + 1} (${chunk.length} profiles)`);
    
    const promises = chunk.map(async (profileId) => {
      if (stopFlags.has(taskId)) {
        return { success: false, profileId, error: 'Task stopped by user' };
      }
      const accData = await getAccount(profileId);
      const profileConfig = { ...config, checkStop: () => stopFlags.has(taskId) };
      return await runAutomationStub(profileId, actionType, profileConfig, accData);
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
    
    // Đợi một chút giữa các batch để giảm tải CPU
    if (i + concurrency < profileIds.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  stopFlags.delete(taskId);
  return { success: true, results };
}

module.exports = { startAutomationTask, stopTask };
