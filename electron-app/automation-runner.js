const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { activeBrowsers, parseProxy, generateFingerprint } = require('./playwright-runner');

const stopFlags = new Set(); // Keep track of stopped tasks

async function stopTask(taskId) {
  stopFlags.add(taskId);
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

async function runAutomationStub(profileId, actionType, config) {
  let browser = activeBrowsers.get(profileId);
  let isNewBrowser = false;

  try {
    if (!browser) {
      const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', profileId);
      const lockFile = path.join(userDataDir, 'SingletonLock');
      
      if (fs.existsSync(lockFile)) {
         console.warn(`[Automation] Profile ${profileId} is locked but not in activeBrowsers. This might cause EPERM.`);
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
        viewport: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
      };

      try {
        options.channel = 'chrome'; // Thử dùng Google Chrome trước
        browser = await chromium.launchPersistentContext(userDataDir, options);
      } catch (e) {
        console.log('[Automation] Chrome không khả dụng, thử dùng Edge...');
        options.channel = 'msedge'; // Fallback sang Microsoft Edge
        browser = await chromium.launchPersistentContext(userDataDir, options);
      }
      
      
      await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      browser.on('close', () => activeBrowsers.delete(profileId));
      activeBrowsers.set(profileId, browser);
      isNewBrowser = true;
    }

    console.log(`[Automation] Starting task ${actionType} for profile ${profileId}`);
    
    const pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com'));
    
    if (!page) {
      page = pages.length > 0 ? pages[0] : await browser.newPage();
    }
    await page.bringToFront();
    
    if (page.url() === 'about:blank' || !page.url().includes('facebook.com')) {
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    }
    
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
  const { taskId, actionType, profileIds, config } = taskData;
  console.log(`[Automation] Starting Task ${taskId} with ${profileIds.length} profiles`);
  
  stopFlags.delete(taskId);
  
  const results = [];
  const concurrency = 3; // Giới hạn số trình duyệt mở cùng lúc để tránh treo máy
  
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
      const profileConfig = { ...config, checkStop: () => stopFlags.has(taskId) };
      return await runAutomationStub(profileId, actionType, profileConfig);
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
