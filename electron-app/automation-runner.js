const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const {
  activeBrowsers,
  parseProxy,
  prepareProxyForBrowser,
  isNetworkOrProxyFailure,
  generateFingerprint,
  generateTOTP,
  parseCookies,
  cleanStaleLockFiles,
  dismissFacebookPopups,
  checkFacebookLoggedIn,
  syncCookiesToApi
} = require('./playwright-runner');


const stopFlags = new Set(); // Keep track of stopped tasks
const runningTasks = new Set(); // Keep track of actively executing task IDs
const taskProfileMap = new Map(); // Map taskId -> Set of profileIds

function getRunningTasks() {
  return Array.from(runningTasks);
}

async function stopTask(taskId, extraProfileIds = []) {
  if (taskId) {
    stopFlags.add(taskId);
    runningTasks.delete(taskId);
  }

  const pIds = new Set([
    ...((taskId && taskProfileMap.get(taskId)) || []),
    ...(Array.isArray(extraProfileIds) ? extraProfileIds : [])
  ]);

  for (const pId of pIds) {
    const b = activeBrowsers.get(pId);
    if (b) {
      console.log(`[Automation] Dừng và đóng browser cho profile ${pId}`);
      try {
        await b.close().catch(() => {});
      } catch (e) {}
      activeBrowsers.delete(pId);
    }
  }

  if (taskId) {
    taskProfileMap.delete(taskId);
  }
}

async function safeWait(page, ms) {
  try {
    if (page && !page.isClosed()) {
      await page.waitForTimeout(ms);
    } else {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  } catch (e) {
    // Page/context closed mid-wait — fall back to simple setTimeout
    if (e.message && (e.message.includes('closed') || e.message.includes('destroyed'))) {
      await new Promise(resolve => setTimeout(resolve, ms));
    } else {
      throw e;
    }
  }
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

  // Bước 2: Tải trang Facebook với cơ chế tự động thử lại khi mạng chập chờn
  const loadFacebook = async () => {
    if (page.url() === 'about:blank' || !page.url().includes('facebook.com')) {
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    } else {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 35000 });
    }
  };

  try {
    await loadFacebook();
  } catch (loadErr) {
    if (isNetworkOrProxyFailure(loadErr)) {
      console.warn(`[Automation] Lỗi tải trang Facebook lần 1 (${loadErr.message}), thử lại sau 2 giây...`);
      await safeWait(page, 2000);
      await loadFacebook();
    } else {
      throw loadErr;
    }
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
    // Only check for login errors if we are still on the login page or a login failure page
    const url = window.location.href;
    if (!url.includes('login') && !url.includes('recover')) return false;

    // Check specific error containers on the login page
    const errorContainers = document.querySelectorAll('#error_box, ._9ay7, ._4rbf, [role="alert"]');
    for (const el of errorContainers) {
      const text = el.innerText.toLowerCase();
      if (text.includes('không kết nối với tài khoản nào') || 
          text.includes('không chính xác') ||
          text.includes('the password that you') ||
          text.includes('find your account') ||
          text.includes('sai mật khẩu') ||
          text.includes('mật khẩu không đúng')) {
        return true;
      }
    }
    return false;
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
  const safeProfileId = accountData?.profileId || profileId || (accountData?.uid ? `profile_${accountData.uid}` : `profile_${accountData?.id || Date.now()}`);
  let browser = activeBrowsers.get(safeProfileId);
  let isNewBrowser = false;

  try {
    const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', safeProfileId);

    let currentProxyCleanup = null;

    const buildLaunchOptions = async (proxyString) => {
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
        const { proxyOptions, cleanup } = await prepareProxyForBrowser(proxyString);
        if (proxyOptions) {
          options.proxy = proxyOptions;
          currentProxyCleanup = cleanup;
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
      let launchOpts = await buildLaunchOptions(currentProxyToUse);

      try {
        browser = await launchBrowserInstance(launchOpts);
        browser._proxyCleanup = currentProxyCleanup;
      } catch (launchErr) {
        if (currentProxyCleanup) {
          await currentProxyCleanup().catch(() => {});
          currentProxyCleanup = null;
        }
        if (currentProxyToUse) {
          console.warn('[Automation] Khởi động với proxy lỗi, tự động chuyển sang kết nối trực tiếp:', launchErr.message);
          cleanStaleLockFiles(userDataDir);
          currentProxyToUse = null;
          launchOpts = await buildLaunchOptions(null);
          browser = await launchBrowserInstance(launchOpts);
        } else {
          throw launchErr;
        }
      }

      browser.proxyConfigStr = currentProxyToUse || '';

      await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      browser.on('close', async () => {
        if (browser._proxyCleanup) {
          await browser._proxyCleanup().catch(() => {});
        }
        activeBrowsers.delete(safeProfileId);
      });
      activeBrowsers.set(safeProfileId, browser);
      isNewBrowser = true;
    }

    console.log(`[Automation] Starting task ${actionType} for profile ${safeProfileId}`);
    
    let pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());
    await page.bringToFront();
    
    // TỰ ĐỘNG ĐĂNG NHẬP / NẠP COOKIE TRƯỚC KHI THỰC HIỆN TÁC VỤ (có dự phòng proxy lỗi)
    try {
      await ensureFacebookAuthenticated(browser, page, accountData, safeProfileId);
    } catch (authErr) {
      const isProxyFailure = isNetworkOrProxyFailure(authErr);

      if (browser.proxyConfigStr && isProxyFailure) {
        console.warn(`[Automation] Proxy gặp sự cố khi xác thực (${authErr.message}), chuyển sang kết nối trực tiếp...`);
        if (browser._proxyCleanup) {
          await browser._proxyCleanup().catch(() => {});
        }
        await browser.close().catch(() => {});
        activeBrowsers.delete(safeProfileId);
        cleanStaleLockFiles(userDataDir);

        const directOpts = await buildLaunchOptions(null);
        browser = await launchBrowserInstance(directOpts);
        browser.proxyConfigStr = '';
        activeBrowsers.set(safeProfileId, browser);

        pages = browser.pages();
        page = pages.find(p => p.url().includes('facebook.com') && !p.isClosed()) || (pages.length > 0 ? pages[0] : await browser.newPage());
        await page.bringToFront();

        await ensureFacebookAuthenticated(browser, page, accountData, safeProfileId);
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
        await taskFbFarmReels(page, config, safeProfileId);
        break;
      case 'fb_buff_post':
        await taskFbBuffPost(page, config, safeProfileId);
        break;
      case 'fb_auto_interact':
        await taskFbAutoInteract(page, config, safeProfileId);
        break;
      case 'fb_add_friends_group':
        await taskFbAddFriendsGroup(page, config, safeProfileId);
        break;
      case 'fb_invite_to_group':
        await taskFbInviteToGroup(page, config, safeProfileId);
        break;
      default:
        console.warn(`[Automation] Unknown task type: ${actionType}`);
        await safeWait(page, 2000);
    }
    
    console.log(`[Automation] Finished action for ${safeProfileId}`);
    return { success: true, profileId: safeProfileId, message: 'Hoạt động thành công' };
  } catch (error) {
    console.error(`[Automation] Error for profile ${safeProfileId}:`, error);
    await logHistory(safeProfileId, actionType, '', `Lỗi: ${error.message}`);
    return { success: false, profileId: safeProfileId, error: error.message };
  } finally {
    console.log(`[Automation] Xong task cho ${safeProfileId}, tiến hành đóng trình duyệt...`);
    if (browser) {
      try {
        // Close extra pages first (not the main page, which may already be gone)
        try {
          const allPages = browser.pages ? browser.pages() : [];
          for (const p of allPages) {
            if (!p.isClosed()) {
              await p.close().catch(() => {});
            }
          }
        } catch (pageCloseErr) {
          // Browser may already be closed, ignore
        }
        await Promise.race([
          browser.close().catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
      } catch (e) {
        console.error(`[Automation] Lỗi khi đóng trình duyệt ${safeProfileId}:`, e);
      } finally {
        activeBrowsers.delete(safeProfileId);
      }
    }
  }
}

async function startAutomationTask(taskData) {
  const { taskId, actionType, profileIds, accounts, config } = taskData;
  console.log(`[Automation] Starting Task ${taskId} with ${profileIds ? profileIds.length : 0} profiles`);
  
  if (!profileIds || profileIds.length === 0) {
    return { success: false, error: 'Chưa có tài khoản Facebook nào được chọn cho tác vụ này.' };
  }

  stopFlags.delete(taskId);
  runningTasks.add(taskId);
  taskProfileMap.set(taskId, new Set(profileIds));

  try {
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

    return { success: true, results };
  } finally {
    runningTasks.delete(taskId);
    taskProfileMap.delete(taskId);
    stopFlags.delete(taskId);
  }
}

module.exports = { startAutomationTask, stopTask, getRunningTasks };
