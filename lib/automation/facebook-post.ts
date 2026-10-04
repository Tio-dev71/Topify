import { chromium, Page } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { prisma } from '@/lib/db';
import { browserManager } from '@/lib/automation/browserManager';

const randomDelay = (minMs: number, maxMs: number) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, delay));
};

async function clickFirstVisible(locator: any, timeout = 15000) {
  const count = await locator.count().catch(() => 0);
  for (let i = 0; i < count; i++) {
    const item = locator.nth(i);
    if (await item.isVisible().catch(() => false)) {
      await item.click({ timeout, force: true });
      return true;
    }
  }
  return false;
}

async function openCreatePostDialog(page: Page) {
  console.log('[AutoPost] Tìm nút tạo bài viết...');

  const selectors = [
    '[role="button"]:has-text("Bạn viết gì đi")',
    '[role="button"]:has-text("Viết gì đó")',
    '[role="button"]:has-text("Tạo bài viết")',
    '[role="button"]:has-text("Write something")',
    '[role="button"]:has-text("Create a post")',
    '[role="button"]:has-text("Create a public post")',
    '[aria-label="Tạo bài viết"]',
    '[aria-label="Create a post"]',
  ];

  for (const selector of selectors) {
    const clicked = await clickFirstVisible(page.locator(selector), 8000).catch(() => false);
    if (clicked) {
      await page.waitForSelector('[role="dialog"]', { timeout: 15000 }).catch(() => {});
      await randomDelay(1000, 1800);
      return;
    }
  }

  throw new Error('Không tìm thấy nút tạo bài viết');
}

async function hasComposerText(page: Page, expected: string, timeout = 2500) {
  if (!expected || !expected.trim()) return true;
  return await page.waitForFunction((value) => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    const dialog = dialogs[dialogs.length - 1];
    if (!dialog) return false;

    const editableText = Array.from(dialog.querySelectorAll('[contenteditable="true"], [role="textbox"]'))
      .map((el) => el.textContent || '')
      .join('\n');

    return editableText.includes(value.trim());
  }, expected, { timeout }).then(() => true).catch(() => false);
}

async function fillFacebookComposer(page: Page, text: string) {
  console.log('[AutoPost] Đang nhập nội dung...');

  const dialog = page.locator('[role="dialog"]').last();
  const textboxCandidates = [
    '[role="textbox"][contenteditable="true"][aria-label*="Bạn viết gì đi"]',
    '[role="textbox"][contenteditable="true"][aria-label*="Write something"]',
    '[role="textbox"][contenteditable="true"][aria-label*="Viết gì đó"]',
    '[contenteditable="true"][data-lexical-editor="true"]',
    '[role="textbox"][contenteditable="true"]',
  ];

  let textbox = null;
  for (const selector of textboxCandidates) {
    const candidate = dialog.locator(selector).first();
    if (await candidate.isVisible().catch(() => false)) {
      textbox = candidate;
      break;
    }
  }

  if (!textbox) {
    throw new Error('Không tìm thấy ô nhập nội dung bài viết trong popup');
  }

  await textbox.waitFor({ state: 'visible', timeout: 15000 });
  await textbox.scrollIntoViewIfNeeded().catch(() => {});

  try {
    await textbox.click({ timeout: 7000, force: true });
    await randomDelay(200, 500);
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A').catch(() => {});
    await page.keyboard.press('Backspace').catch(() => {});
    await randomDelay(120, 280);
    await page.keyboard.type(text, { delay: 20 });
    return;
  } catch (_) {
    // Continue to DOM fallback.
  }

  const handle = await textbox.elementHandle();
  if (!handle) throw new Error('Không lấy được ô nhập nội dung');

  await page.evaluate(({ el, value }) => {
    el.focus();
    el.textContent = '';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    el.textContent = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { el: handle as any, value: text });

  await randomDelay(500, 900);
}

async function hasComposerAttachmentPreview(page: Page, timeout = 3000) {
  return await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return false;
    const localMedia = dialog.querySelectorAll('img[src^="blob:"], img[src^="data:"], video[src^="blob:"], video[src^="data:"], [style*="blob:"], [style*="data:"]');
    const progress = dialog.querySelectorAll('[role="progressbar"], [aria-valuenow]');
    return localMedia.length > 0 || progress.length > 0;
  }, { timeout }).then(() => true).catch(() => false);
}

async function uploadMediaToComposer(page: Page, mediaPath: string) {
  if (!fs.existsSync(mediaPath)) {
    throw new Error(`Không có file ảnh/video hợp lệ để upload: ${mediaPath}`);
  }

  console.log(`[AutoPost] Đang upload media...`);

  const attachButtons = [
    '[role="dialog"] [aria-label="Ảnh/video"]',
    '[role="dialog"] [aria-label="Photo/video"]',
    '[role="dialog"] [aria-label="Photo/Video"]',
    '[role="dialog"] [role="button"]:has-text("Ảnh/video")',
    '[role="dialog"] [role="button"]:has-text("Photo/video")',
    '[role="dialog"] [role="button"]:has-text("Photo/Video")',
  ];

  let uploaded = false;
  let lastError = null;

  const tryUploadFromOpenPanel = async (sourceLabel: string) => {
    await randomDelay(800, 1400);

    const dialog = page.locator('[role="dialog"]').last();
    const dropzone = dialog
      .locator('text=/Kéo thả|click để upload|Drag.*drop|Add photos|Upload|Thêm ảnh|Add Photos/i')
      .first();

    if (!(await dropzone.isVisible().catch(() => false))) {
      lastError = new Error(`Không thấy vùng upload ảnh trong popup bài viết sau khi bấm ${sourceLabel}`);
      return false;
    }

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await dropzone.click({ timeout: 5000, force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([mediaPath]);
    uploaded = true;
    console.log(`[AutoPost] Đã chọn ảnh/video qua vùng upload của bài viết (${sourceLabel})`);
    return true;
  };

  for (const selector of attachButtons) {
    const button = page.locator(selector).first();
    if (!(await button.isVisible().catch(() => false))) continue;

    try {
      await button.click({ timeout: 5000, force: true });
      if (await tryUploadFromOpenPanel(selector)) break;
    } catch (err: any) {
      lastError = err;
      console.log(`[AutoPost] Không upload được qua nút ${selector}, thử cách khác...`);
    }
  }

  if (!uploaded) {
    try {
      const clicked = await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
        const dialog = dialogs[dialogs.length - 1];
        if (!dialog) return false;

        const elements = Array.from(dialog.querySelectorAll('div, span'));
        const addRowLabel = elements.find((el) => /Thêm vào bài viết của bạn|Add to your post/i.test(el.textContent || ''));
        if (!addRowLabel) return false;

        const labelRect = addRowLabel.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        const clickable = Array.from(dialog.querySelectorAll('[role="button"], div[tabindex="0"], span[tabindex="0"]'))
          .map((el) => ({ el, rect: el.getBoundingClientRect(), text: el.textContent || '', aria: el.getAttribute('aria-label') || '' }))
          .filter(({ rect, text, aria }) => {
            const sameRow = Math.abs((rect.top + rect.bottom) / 2 - (labelRect.top + labelRect.bottom) / 2) < 45;
            const rightOfLabel = rect.left > labelRect.left + 180;
            const insideDialog = rect.left >= dialogRect.left && rect.right <= dialogRect.right && rect.top >= dialogRect.top && rect.bottom <= dialogRect.bottom;
            const notPost = !/Đăng|Post/i.test(text + aria);
            return sameRow && rightOfLabel && insideDialog && notPost && rect.width >= 20 && rect.height >= 20;
          })
          .sort((a, b) => a.rect.left - b.rect.left);

        if (clickable.length === 0) return false;
        (clickable[0].el as HTMLElement).click();
        return true;
      });

      if (clicked) {
        console.log('[AutoPost] Đã bấm icon Ảnh/Video bằng vị trí trong hàng Thêm vào bài viết');
        await tryUploadFromOpenPanel('icon xanh theo vị trí');
      } else {
        lastError = new Error('Không tìm thấy icon Ảnh/Video trong hàng Thêm vào bài viết');
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!uploaded) {
    try {
      const dialog = page.locator('[role="dialog"]').last();
      const dialogFileInputs = dialog.locator('input[type="file"]');
      const inputCount = await dialogFileInputs.count().catch(() => 0);

      for (let i = 0; i < inputCount; i++) {
        const input = dialogFileInputs.nth(i);
        const accept = (await input.getAttribute('accept').catch(() => '')) || '';
        const looksLikeMediaInput = !accept || /image|video|media|\*/i.test(accept);
        if (!looksLikeMediaInput) continue;

        try {
          await input.setInputFiles([mediaPath]);
          uploaded = true;
          console.log('[AutoPost] Đã chọn ảnh/video qua input file nằm trong popup bài viết');
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!uploaded && inputCount === 0) {
        lastError = new Error('Popup bài viết không có input file nội bộ để fallback');
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!uploaded) {
    throw new Error(`Không mở được bộ chọn ảnh của bài viết. Lỗi gốc: ${lastError?.message || 'không bắt được file chooser'}`);
  }

  const hasPreview = await hasComposerAttachmentPreview(page, 25000);
  if (!hasPreview) {
    throw new Error('Đã chọn file nhưng Facebook chưa hiển thị preview ảnh/video. Dừng đăng để tránh đăng sai nội dung.');
  }

  await randomDelay(4000, 7000);
}

async function clickPostButton(page: Page) {
  console.log('[AutoPost] Đang bấm Đăng...');
  const postButton = page
    .locator('[role="dialog"] [aria-label="Đăng"], [role="dialog"] [aria-label="Post"], [role="dialog"] button:has-text("Đăng"), [role="dialog"] button:has-text("Post"), [role="dialog"] [role="button"]:has-text("Đăng"), [role="dialog"] [role="button"]:has-text("Post")')
    .last();

  await postButton.waitFor({ state: 'visible', timeout: 15000 });
  await randomDelay(600, 1200);
  await postButton.click({ timeout: 10000, force: true });
}

export async function postToFacebookGroup(groupUrl: string, caption: string, videoPath: string, profileId: string = 'chrome-profile') {
  const userDataDir = path.join(os.homedir(), '.autopost', 'profiles', profileId);

  // Fetch account to get proxy
  const account = await prisma.facebookAccount.findFirst({ where: { profileId } });
  const proxyStr = account?.proxy;

  console.log(`[AutoPost] Starting Facebook automation...`);
  console.log(`[AutoPost] Launching Chromium with profile: ${userDataDir}`);
  
  const browser = await browserManager.launchBrowser(profileId, proxyStr);
  const page = await browser.newPage();

  try {
    console.log(`[AutoPost] Navigating to ${groupUrl}`);
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const cookies = await browser.cookies();
    const hasCUser = cookies.some(c => c.name === 'c_user');
    
    if (!hasCUser) {
      console.log(`[AutoPost] Not logged in to Facebook. Please log in manually.`);
      let isLoggedIn = false;
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(5000);
        const currentCookies = await browser.cookies();
        if (currentCookies.some(c => c.name === 'c_user')) {
          isLoggedIn = true;
          break;
        }
      }

      if (!isLoggedIn) {
        throw new Error('Timeout: User did not log in to Facebook within 5 minutes.');
      }
      console.log(`[AutoPost] Login detected. Proceeding...`);
      await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });
    }

    await openCreatePostDialog(page);

    let contentInserted = false;
    try {
      await fillFacebookComposer(page, caption);
      await randomDelay(1000, 2000);
      contentInserted = await hasComposerText(page, caption);
    } catch (err: any) {
      console.log(`[AutoPost] Không nhập được nội dung bằng selector (${err.message})`);
    }

    if (videoPath) {
      await uploadMediaToComposer(page, videoPath);
    }

    await clickPostButton(page);
    
    console.log(`[AutoPost] Waiting for post to finish...`);
    await page.waitForTimeout(10000);
    
    // Log to DB
    try {
      const { prisma } = require('@/lib/db');
      await prisma.automationLog.create({
        data: {
          profileId,
          actionType: 'POST_GROUP',
          link: groupUrl,
          message: caption
        }
      });
    } catch (e) {
      console.error('[DB] Failed to log post:', e);
    }

    console.log(`[AutoPost] Successfully posted!`);

  } catch (error) {
    console.error(`[AutoPost] Error during automation:`, error);
    throw error;
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}
