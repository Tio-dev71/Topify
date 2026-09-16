import { chromium, Page, BrowserContext } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { browserManager } from '@/lib/automation/browserManager';
import { prisma } from '@/lib/db';

export interface TaskConfig {
  targetUrl?: string;
  actionCount: number;
  comments?: string[];
  useAiComment?: boolean;
  type: string;
}

export class AutomationEngine {
  static checkStop(profileId: string) {
    if (browserManager.isStopped(profileId)) {
      throw new Error('Task stopped by user');
    }
  }

  static async safeWait(page: Page, ms: number, profileId: string) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      this.checkStop(profileId);
      await page.waitForTimeout(Math.min(500, ms - (Date.now() - start)));
    }
  }


  static async humanScroll(page: Page, profileId: string, scrolls = 3) {
    for (let i = 0; i < scrolls; i++) {
      const distance = 300 + Math.random() * 500;
      const chunks = 15;
      const step = distance / chunks;

      for (let j = 0; j < chunks; j++) {
        await page.mouse.wheel(0, step);
        await this.safeWait(page, 20 + Math.random() * 20, profileId);
      }

      if (Math.random() > 0.8) {
        await page.mouse.wheel(0, -200);
      }

      await this.safeWait(page, 1500 + Math.random() * 2000, profileId);
    }
  }

  static async randomInteract(page: Page, config: TaskConfig, profileId: string, chance = 0.3, interactedPosts: Set<string> = new Set()) {
    const action = Math.random();
    if (action > chance) return;

    const isLike = Math.random() < 0.6;

    if (isLike) {
      console.log('Liking a post/reel');
      await page.evaluate(() => {
        function isVisible(el: Element) {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
        }
        const likes = Array.from(document.querySelectorAll('div[aria-label="Thích"], div[aria-label="Like"], div[aria-label="Bày tỏ cảm xúc"], div[aria-label="Thích bài viết"]')).filter(isVisible) as HTMLElement[];
        if (likes.length > 0) {
          likes[Math.floor(Math.random() * likes.length)].click();
        }
      });
      await this.safeWait(page, 2000, profileId);
    } else if ((config.comments && config.comments.length > 0) || config.useAiComment) {
      console.log('Commenting on a post/reel');
      
      const { clicked, postText } = await page.evaluate(() => {
        function isVisible(el: Element) {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
        }
        
        let allBtns = Array.from(document.querySelectorAll('div[role="button"], a, span'));
        let commentBtn = allBtns.find(el => {
          if (!isVisible(el)) return false;
          let text = (el as HTMLElement).innerText?.toLowerCase() || '';
          let aria = el.getAttribute('aria-label')?.toLowerCase() || '';
          return aria.includes('bình luận') || aria.includes('comment') || aria.includes('viết bình luận') ||
                 text === 'bình luận' || text === 'comment';
        });

        let text = '';
        if (commentBtn) {
          try {
            let container = commentBtn.closest('div[role="article"], div[data-pagelet^="FeedUnit"], div[data-pagelet^="GroupFeed"], div[aria-posinset]');
            if (!container) {
              container = commentBtn;
              for(let i=0; i<8; i++) {
                if(container.parentElement) container = container.parentElement;
              }
            }

            if (container) {
              const messageBlock = container.querySelector('div[data-ad-preview="message"]');
              if (messageBlock) {
                text = (messageBlock as HTMLElement).innerText;
              } else {
                const textEls = Array.from(container.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
                let longestText = '';
                for (const el of textEls) {
                  const txt = (el as HTMLElement).innerText || '';
                  if (txt.length > longestText.length && txt.length > 15 && !['Thích', 'Bình luận', 'Chia sẻ', 'Like', 'Comment', 'Share'].includes(txt)) {
                    longestText = txt;
                  }
                }
                text = longestText;
              }
            }
          } catch(e) {}
          
          if (text && interactedPosts.has(text)) {
             return { clicked: false, postText: '' }; // Already interacted with this post
          }
          if (text) {
             interactedPosts.add(text);
          }
          
          const target = commentBtn.closest('[role="button"]') || commentBtn;
          (target as HTMLElement).click();
          return { clicked: true, postText: text };
        }
        return { clicked: false, postText: '' };
      });

      if (clicked) {
        await this.safeWait(page, 3000, profileId);

        let finalComment = (config.comments && config.comments.length > 0) 
            ? config.comments[Math.floor(Math.random() * config.comments.length)]
            : 'Hay quá ạ!';
            
        try {
          let apiKey = process.env.GEMINI_API_KEY;
          let deepseekKey = process.env.DEEPSEEK_API_KEY;
          let deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
          try {
             const setting = await prisma.systemSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
             if (setting && setting.value) apiKey = setting.value;
             const dsSetting = await prisma.systemSetting.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
             if (dsSetting && dsSetting.value) deepseekKey = dsSetting.value;
          } catch(e) {
             // Ignore db error
          }
          
          console.log(`[AI DEBUG] useAiComment: ${config.useAiComment}, apiKey exists: ${!!apiKey}, postText length: ${postText ? postText.length : 0}`);
          if (config.useAiComment && !apiKey && !deepseekKey) console.log('[AI DEBUG] Missing GEMINI_API_KEY or DEEPSEEK_API_KEY in .env or settings');
          if (config.useAiComment && (!postText || postText.trim().length <= 10)) console.log('[AI DEBUG] postText is too short or empty: ' + postText);

          if (config.useAiComment && (apiKey || deepseekKey) && postText && postText.trim().length > 10) {
            console.log('Generating AI comment for: ' + postText.substring(0, 30).replace(/\n/g, ' ') + '...');
            
            const prompt = `You are a normal Facebook user. Write a short, natural, friendly comment in Vietnamese for this post: "${postText}".
CRITICAL INSTRUCTION: Return ONLY the raw comment text. Do NOT wrap it in quotes. Do NOT add hashtags. Do NOT add conversational text like "Bình luận:". Just the exact text to type.`;
            
            try {
              if (deepseekKey) {
                const dsRes = await fetch(deepseekBaseUrl, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepseekKey}`
                  },
                  body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 60
                  })
                });
                
                if (dsRes.ok) {
                  const data = await dsRes.json();
                  if (data.choices && data.choices[0] && data.choices[0].message) {
                    finalComment = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
                    console.log('DeepSeek AI Comment generated: ' + finalComment);
                  }
                } else {
                  console.log('DeepSeek API error:', await dsRes.text());
                }
              }
              
              if (!finalComment && apiKey) {
                // Fallback to Gemini if DeepSeek fails or not configured
            
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 60 }
              })
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.candidates && data.candidates[0].content.parts[0].text) {
                finalComment = data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
                console.log('AI Comment generated: ' + finalComment);
              }
            } else {
              const errText = await res.text();
              console.log('AI API error. Status: ' + res.status + ' Response: ' + errText);
              // Fetch available models to debug
              try {
                const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const modelsData = await modelsRes.json();
                console.log('[AI DEBUG] Available models for this API Key:', modelsData.models ? modelsData.models.map((m: any) => m.name).join(', ') : modelsData);
              } catch(e) {
                console.log('[AI DEBUG] Failed to fetch models list');
              }
            } // end else
            } // end if (!finalComment && apiKey)
            } catch (err) {
              console.log('AI API Exception:', err);
            }
          }
        } catch (e) {
          console.log('AI Comment failed, using fallback.', e);
        }

        await page.evaluate(() => {
          const box = document.querySelector('form[action*="/comment/"] textarea, form div[contenteditable="true"], div[aria-label="Viết bình luận"], div[aria-label="Write a comment"]') as HTMLElement;
          if (box) box.focus();
        });

        // Use insertText instead of type to prevent Facebook draft.js/lexical bugs
        await page.keyboard.insertText(finalComment);
        await this.safeWait(page, 500, profileId);
        await page.keyboard.press('Enter');

        const postLink = await page.evaluate(() => {
          if (window.location.href.includes('/reel/') || window.location.href.includes('/watch/')) {
            return window.location.href;
          }
          const box = document.activeElement;
          if (box) {
            const article = box.closest('div[role="article"]') || box.closest('div[data-pagelet*="FeedUnit"]');
            if (article) {
              const links = Array.from(article.querySelectorAll('a'));
              const linkEl = links.find(a => a.href.includes('/posts/') || a.href.includes('/videos/') || a.href.includes('/photo') || /\/permalink\//.test(a.href));
              if (linkEl) return linkEl.href;
            }
          }
          return window.location.href; // Fallback
        });

        try {
          await prisma.automationLog.create({
            data: {
              profileId,
              actionType: 'COMMENT',
              link: postLink,
              message: finalComment
            }
          });
        } catch (e) {
          console.error('[AutomationLog] Failed to log comment:', e);
        }

        await this.safeWait(page, 3000, profileId);
        await page.keyboard.press('Escape');
        await this.safeWait(page, 1000, profileId);
      }
    }
  }

  static async taskFbFarmReels(page: Page, config: TaskConfig, profileId: string) {
    const interactedPosts = new Set<string>();
    let reelsUrl = config.targetUrl || 'https://www.facebook.com/reels/';

    if (!config.targetUrl) {
      console.log(`Farming general reels`);
      await page.goto(reelsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.safeWait(page, 5000, profileId);

      await page.evaluate(() => {
        const reel = document.querySelector('a[href*="/reel/"]') as HTMLElement;
        if (reel) reel.click();
      });
      await this.safeWait(page, 5000, profileId);

      for (let i = 0; i < config.actionCount; i++) {
        console.log(`Watching reel ${i + 1}/${config.actionCount}`);
        await this.safeWait(page, 10000 + Math.random() * 15000, profileId);
        await this.randomInteract(page, config, profileId, 0.2, interactedPosts);

        if (Math.random() > 0.8 && i > 0) {
          await page.keyboard.press('ArrowUp');
        } else {
          await page.keyboard.press('ArrowDown');
        }
        await this.safeWait(page, 2000, profileId);
      }
      return;
    }

    if (!reelsUrl.endsWith('/reels/') && !reelsUrl.endsWith('/reels')) {
      reelsUrl = reelsUrl.replace(/\/$/, '') + '/reels/';
    }

    console.log(`Farming fanpage reels at ${reelsUrl}`);

    for (let i = 0; i < config.actionCount; i++) {
      await page.goto(reelsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.safeWait(page, 4000, profileId);

      if (i > 4) {
        await this.humanScroll(page, profileId, Math.floor(i / 4));
      }

      const clicked = await page.evaluate((index) => {
        const reels = Array.from(document.querySelectorAll('a[href*="/reel/"]')) as HTMLElement[];
        if (reels.length > index) {
          reels[index].click();
          return true;
        } else if (reels.length > 0) {
          reels[Math.floor(Math.random() * reels.length)].click();
          return true;
        }
        return false;
      }, i);

      if (clicked) {
        console.log(`Watching fanpage reel ${i + 1}/${config.actionCount}`);
        await this.safeWait(page, 10000 + Math.random() * 15000, profileId);
        await this.randomInteract(page, config, profileId, 0.2, interactedPosts);
      } else {
        console.log(`Could not find reel ${i + 1}`);
        break;
      }
    }
  }

  static async taskFbAutoInteract(page: Page, config: TaskConfig, profileId: string) {
    const interactedPosts = new Set<string>();
    const targetUrl = config.targetUrl || 'https://www.facebook.com/';
    console.log(`Farming feed at ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.safeWait(page, 4000, profileId);

    for (let i = 0; i < config.actionCount; i++) {
      console.log(`Scrolling feed ${i + 1}/${config.actionCount}`);
      await this.humanScroll(page, profileId, 2);
      await this.randomInteract(page, config, profileId, 0.4, interactedPosts);
    }
  }

  static async taskFbAddFriendsGroup(page: Page, config: TaskConfig, profileId: string) {
    let url = config.targetUrl;
    if (!url) {
      throw new Error('Vui lòng nhập Link Group Facebook (hoặc ID Group) vào ô Target URL!');
    }
    
    // If it's just numbers (Group ID), construct the URL
    if (/^\d+$/.test(url.trim())) {
      url = `https://www.facebook.com/groups/${url.trim()}`;
    } else if (!url.includes('facebook.com') && !url.includes('fb.com')) {
      url = `https://www.facebook.com/groups/${url.trim()}`;
    }

    if (!url.includes('/members')) {
      if (url.endsWith('/')) url += 'members';
      else url += '/members';
    }

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.safeWait(page, 4000 + Math.random() * 2000, profileId);

    // Auto join group if not joined
    const joined = await page.evaluate(() => {
      let btns = Array.from(document.querySelectorAll('div[role="button"], span'));
      let joinBtn = btns.find(b => {
        let txt = ((b as HTMLElement).innerText || '').toLowerCase().trim();
        let aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
        return (txt === 'tham gia nhóm' || txt === 'join group' || aria === 'tham gia nhóm' || aria === 'join group');
      });
      if (joinBtn && joinBtn.getBoundingClientRect().width > 0) {
        const target = joinBtn.closest('div[role="button"]') || joinBtn;
        (target as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (joined) {
      console.log('Clicked Join Group, waiting 5 seconds...');
      await this.safeWait(page, 5000, profileId);
    }

    let addedCount = 0;
    let scrollAttempts = 0;

    while (addedCount < config.actionCount && scrollAttempts < 20) {
      const btnSelector = '[aria-label*="Thêm bạn bè"], [aria-label*="Add friend"], [aria-label*="Add Friend"], span';
      const btns = await page.locator(btnSelector).all();

      let clickedInThisPass = false;
      for (const btn of btns) {
        if (addedCount >= config.actionCount) break;

        const isValid = await btn.evaluate(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) return false;
          let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
          let text = ((el as HTMLElement).innerText || '').toLowerCase().trim();
          return aria.includes('thêm bạn bè') || aria.includes('add friend') || text.includes('thêm bạn bè') || text.includes('add friend');
        });

        if (isValid) {
          try {
            await btn.click({ timeout: 2000 });
            addedCount++;
            clickedInThisPass = true;
            console.log(`Sent friend request ${addedCount}/${config.actionCount}`);
            await this.safeWait(page, 3000 + Math.random() * 5000, profileId);
          } catch (e) {
          }
        }
      }

      if (!clickedInThisPass) {
        await this.humanScroll(page, profileId, 2);
        scrollAttempts++;
      } else {
        console.log(`Finished a batch. Resting 5-10s before next batch...`);
        await this.safeWait(page, 5000 + Math.random() * 5000, profileId);
        await this.humanScroll(page, profileId, 2);
      }
    }
  }

  static async taskFbInviteToGroup(page: Page, config: TaskConfig, profileId: string) {
    let url = config.targetUrl;
    if (!url) {
      throw new Error('Vui lòng nhập Link Group Facebook (hoặc ID Group) vào ô Target URL!');
    }
    
    // If it's just numbers (Group ID), construct the URL
    if (/^\d+$/.test(url.trim())) {
      url = `https://www.facebook.com/groups/${url.trim()}`;
    } else if (!url.includes('facebook.com') && !url.includes('fb.com')) {
      url = `https://www.facebook.com/groups/${url.trim()}`;
    }

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.safeWait(page, 4000 + Math.random() * 2000, profileId);

    // Auto join group if not joined
    const joined = await page.evaluate(() => {
      let btns = Array.from(document.querySelectorAll('div[role="button"], span'));
      let joinBtn = btns.find(b => {
        let txt = ((b as HTMLElement).innerText || '').toLowerCase().trim();
        let aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
        return (txt === 'tham gia nhóm' || txt === 'join group' || aria === 'tham gia nhóm' || aria === 'join group');
      });
      if (joinBtn && joinBtn.getBoundingClientRect().width > 0) {
        const target = joinBtn.closest('div[role="button"]') || joinBtn;
        (target as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (joined) {
      console.log('Clicked Join Group, waiting 5 seconds...');
      await this.safeWait(page, 5000, profileId);
    }

    const opened = await page.evaluate(() => {
      const inviteSelectors = [
        'div[aria-label="Mời"]',
        'div[aria-label="Invite"]',
        'div[aria-label*="Mời tham gia"]',
        'div[role="button"]',
        'a',
        'span'
      ];
      let allBtns = Array.from(document.querySelectorAll(inviteSelectors.join(', ')));
      let inviteBtn = allBtns.find(el => {
        let text = ((el as HTMLElement).innerText || '').toLowerCase();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase();
        if ((text.includes('mời') || text.includes('invite') || aria.includes('mời') || aria.includes('invite')) && !text.includes('bạn bè trên facebook')) {
          return el.getBoundingClientRect().width > 0;
        }
        return false;
      });

      if (inviteBtn) {
        const target = inviteBtn.closest('[role="button"]') || inviteBtn;
        (target as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (opened) {
      console.log('Opened Invite dialog');
      await this.safeWait(page, 3000, profileId);

      await page.evaluate(() => {
        let spans = Array.from(document.querySelectorAll('span'));
        let subBtn = spans.find(span => {
          let text = span.innerText?.toLowerCase() || '';
          return text.includes('mời bạn bè trên facebook') || text.includes('invite facebook friends');
        });
        if (subBtn) {
          const target = subBtn.closest('[role="button"]') || subBtn;
          (target as HTMLElement).click();
        }
      });
      await this.safeWait(page, 3000, profileId);

      let invitedCount = 0;
      let scrollAttempts = 0;

      while (invitedCount < config.actionCount && scrollAttempts < 15) {
        const checkboxes = await page.locator('input[type="checkbox"], div[role="checkbox"]').all();
        let clickedInThisPass = false;

        for (const cb of checkboxes) {
          if (invitedCount >= config.actionCount) break;

          const canCheck = await cb.evaluate(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) return false;
            const ariaChecked = el.getAttribute('aria-checked');
            if (ariaChecked === 'true') return false;
            if (el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).checked) return false;
            return true;
          });

          if (canCheck) {
            try {
              await cb.click({ timeout: 2000 });
              invitedCount++;
              clickedInThisPass = true;
              console.log(`Selected friend ${invitedCount}/${config.actionCount}`);
              await this.safeWait(page, 1000 + Math.random() * 1500, profileId);
            } catch (e) { }
          }
        }

        if (!clickedInThisPass) {
          try {
            await page.mouse.wheel(0, 500);
          } catch (e) { }
          await this.safeWait(page, 2000, profileId);
          scrollAttempts++;
        }
      }

      const sent = await page.evaluate(() => {
        let spans = Array.from(document.querySelectorAll('div[role="button"] span'));
        let sendBtn = spans.find(span => {
          let txt = ((span as HTMLElement).innerText || '').toLowerCase().trim();
          return txt.includes('gửi lời mời') || txt.includes('send invites') || txt === 'gửi' || txt === 'send';
        });
        if (sendBtn) {
          const target = sendBtn.closest('[role="button"]') || sendBtn;
          (target as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (sent) {
        console.log(`Sent invites for batch of ${invitedCount}.`);
      } else {
        console.log('Could not find Send button, closing dialog via escape');
        await page.keyboard.press('Escape');
      }
      await this.safeWait(page, 3000, profileId);

    } else {
      console.log('Could not find the Invite button on the group page');
    }
  }

  static async taskFbBuffPost(page: Page, config: TaskConfig, profileId: string) {
    if (!config.targetUrl) throw new Error('Target URL is required for buff post task');
    console.log(`[AutomationEngine] Buffing post: ${config.targetUrl}`);
    await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded' });
    await this.safeWait(page, 3000 + Math.random() * 2000, profileId);

    await this.humanScroll(page, profileId, 1);

    console.log('Liking post...');
    await page.evaluate(() => {
      function isVisible(el: Element) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      const likes = Array.from(document.querySelectorAll('div[aria-label="Thích"], div[aria-label="Like"], div[aria-label="Bày tỏ cảm xúc"], div[aria-label="Thích bài viết"]')).filter(isVisible) as HTMLElement[];
      if (likes.length > 0) {
        likes[0].click();
      }
    });

    await this.safeWait(page, 3000, profileId);

    // Call randomInteract but force comment by setting chance to 1. 
    // Wait, randomInteract handles AI comment internally. Let's just run randomInteract multiple times to guarantee a comment if needed, or we copy the comment part.
    // Instead of copying 100 lines of AI logic, let's just trigger comment block directly.
    // Actually, I can just copy the comment block.
    console.log('Commenting on post...');
    
    // Borrow logic from randomInteract (which I see is lines 70-240)
    // To keep it simple, I'll extract just the clicking and typing part.
    const { clicked, postText } = await page.evaluate(() => {
      function isVisible(el: Element) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      
      let allBtns = Array.from(document.querySelectorAll('div[role="button"], a, span'));
      let commentBtn = allBtns.find(el => {
        if (!isVisible(el)) return false;
        let text = (el as HTMLElement).innerText?.toLowerCase() || '';
        let aria = el.getAttribute('aria-label')?.toLowerCase() || '';
        return aria.includes('bình luận') || aria.includes('comment') || aria.includes('viết bình luận') ||
               text === 'bình luận' || text === 'comment';
      });

      let text = '';
      if (commentBtn) {
        try {
          let container = commentBtn.closest('div[role="article"], div[data-pagelet^="FeedUnit"], div[data-pagelet^="GroupFeed"], div[aria-posinset]');
          if (!container) {
            container = commentBtn;
            for(let i=0; i<8; i++) {
              if(container.parentElement) container = container.parentElement;
            }
          }

          if (container) {
            const messageBlock = container.querySelector('div[data-ad-preview="message"]');
            if (messageBlock) {
              text = (messageBlock as HTMLElement).innerText;
            } else {
              const textEls = Array.from(container.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
              let longestText = '';
              for (const el of textEls) {
                const txt = (el as HTMLElement).innerText || '';
                if (txt.length > longestText.length && txt.length > 15 && !['Thích', 'Bình luận', 'Chia sẻ', 'Like', 'Comment', 'Share'].includes(txt)) {
                  longestText = txt;
                }
              }
              text = longestText;
            }
          }
        } catch(e) {}
        
        const target = commentBtn.closest('[role="button"]') || commentBtn;
        (target as HTMLElement).click();
        return { clicked: true, postText: text };
      }
      return { clicked: false, postText: '' };
    });

    if (clicked) {
      await this.safeWait(page, 3000, profileId);

      let finalComment = (config.comments && config.comments.length > 0) 
          ? config.comments[Math.floor(Math.random() * config.comments.length)]
          : 'Hay quá ạ!';
          
      try {
        let apiKey = process.env.GEMINI_API_KEY;
        let deepseekKey = process.env.DEEPSEEK_API_KEY;
        let deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
        
        try {
           const setting = await prisma.systemSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
           if (setting && setting.value) apiKey = setting.value;
           const dsSetting = await prisma.systemSetting.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
           if (dsSetting && dsSetting.value) deepseekKey = dsSetting.value;
        } catch(e) {}

        if (config.useAiComment && (apiKey || deepseekKey) && postText && postText.trim().length > 10) {
          const prompt = `You are a normal Facebook user. Write a short, natural, friendly comment in Vietnamese for this post: "${postText}".
CRITICAL INSTRUCTION: Return ONLY the raw comment text. Do NOT wrap it in quotes. Do NOT add hashtags. Do NOT add conversational text like "Bình luận:". Just the exact text to type.`;
          
          if (deepseekKey) {
            const dsRes = await fetch(deepseekBaseUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 60
              })
            });
            if (dsRes.ok) {
              const data = await dsRes.json();
              if (data.choices && data.choices[0] && data.choices[0].message) {
                finalComment = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
              }
            }
          }
          
          if (!finalComment && apiKey) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 60 }
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.candidates && data.candidates[0].content.parts[0].text) {
                finalComment = data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
              }
            }
          }
        }
      } catch (e) {
        console.error('AI Comment generation error:', e);
      }

      console.log('Sending comment: ' + finalComment);
      await page.keyboard.insertText(finalComment);
      await this.safeWait(page, 1000, profileId);
      await page.keyboard.press('Enter');
      await this.safeWait(page, 2000, profileId);
    } else {
      console.log('Could not find Comment button for buffing.');
    }
  }

  static async taskFbScrapeFanpage(page: Page, config: TaskConfig, profileId: string) {
    if (!config.targetUrl) throw new Error('Target URL is required for scraping fanpage');
    console.log(`[AutomationEngine] Scraping fanpage: ${config.targetUrl}`);
    await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.safeWait(page, 5000, profileId);

    // Scroll a bit to load posts
    await this.humanScroll(page, profileId, 5);
    await this.safeWait(page, 2000, profileId);

    // Close any login/signup popup if it appears (though usually we are logged in)
    try {
      await page.evaluate(() => {
        const closeBtn = document.querySelector('div[aria-label="Đóng"], div[aria-label="Close"]') as HTMLElement;
        if (closeBtn) closeBtn.click();
      });
    } catch(e) {}

    const posts = await page.evaluate(() => {
      const results: any[] = [];
      // Select posts containers
      const postContainers = Array.from(document.querySelectorAll('div[data-pagelet^="ProfileTimeline"], div[role="article"]'));
      
      for (const container of postContainers) {
        // Skip if not a real post
        if (!container.querySelector('div[data-ad-preview="message"]') && !container.querySelector('div[dir="auto"]')) {
           continue;
        }

        try {
          // Extract content
          const textEls = Array.from(container.querySelectorAll('div[data-ad-preview="message"], div[dir="auto"]'));
          let content = textEls.map(el => (el as HTMLElement).innerText).join('\n').trim();

          // Try to find post link/ID
          const links = Array.from(container.querySelectorAll('a'));
          const postLinkEl = links.find(a => a.href.includes('/posts/') || a.href.includes('/videos/') || a.href.includes('/photos/') || a.href.includes('fbid='));
          const externalId = postLinkEl ? postLinkEl.href : null;

          // Avoid duplicates in the same run
          if (externalId && results.some(r => r.externalId === externalId)) continue;

          // Extract media if any (first image or video)
          const img = container.querySelector('img[referrerpolicy="origin-when-cross-origin"]');
          const mediaUrl = img ? (img as HTMLImageElement).src : null;

          // Extract interaction counts
          // Facebook uses spans with specific structures, or we can look for aria-labels
          let likesCount = 0;
          let commentsCount = 0;
          let sharesCount = 0;

          // Likes (Bày tỏ cảm xúc)
          const likeEl = container.querySelector('span.x1e558r4'); // FB often uses this class for interaction counts, but it changes.
          // A safer way is to find aria-label="Thích" or "Bày tỏ cảm xúc" but the count itself is in a sibling.
          // Just parsing text is more robust: find spans containing numbers followed by "bình luận", "lượt chia sẻ".
          const allTextSpans = Array.from(container.querySelectorAll('span'));
          
          for (const span of allTextSpans) {
             const text = span.innerText || '';
             if (text.includes('bình luận')) {
                 const match = text.match(/([\d,\.]+)/);
                 if (match) commentsCount = parseInt(match[1].replace(/,/g, ''));
             } else if (text.includes('lượt chia sẻ') || text.includes('chia sẻ')) {
                 const match = text.match(/([\d,\.]+)/);
                 if (match) sharesCount = parseInt(match[1].replace(/,/g, ''));
             } else if (/^\d+$/.test(text) || /^[\d,\.]+K$/.test(text)) {
                 // Might be likes
                 const parent = span.parentElement;
                 if (parent && parent.innerHTML.includes('Bày tỏ cảm xúc')) {
                    let numStr = text.replace(/,/g, '');
                    if (numStr.endsWith('K')) likesCount = parseFloat(numStr) * 1000;
                    else likesCount = parseInt(numStr);
                 }
             }
          }

          if (content || externalId) {
            results.push({
               content: content.substring(0, 1000),
               externalId,
               mediaUrl,
               likesCount: isNaN(likesCount) ? 0 : likesCount,
               commentsCount: isNaN(commentsCount) ? 0 : commentsCount,
               sharesCount: isNaN(sharesCount) ? 0 : sharesCount
            });
          }
        } catch (e) {
          // ignore parsing error for single post
        }
      }
      return results;
    });

    console.log(`[AutomationEngine] Scraped ${posts.length} posts from ${config.targetUrl}`);
    
    if (posts.length > 0) {
       // We need to pass the extracted data back out, or just save it directly to DB from here.
       // It's better to save to DB directly since we have prisma access.
       const pageRecord = await prisma.competitorPage.findUnique({ where: { url: config.targetUrl } });
       if (pageRecord) {
           for (const p of posts) {
               if (!p.externalId) continue; // skip if no link
               
               // Upsert post to avoid duplicates
               const existing = await prisma.competitorPost.findFirst({
                   where: { pageId: pageRecord.id, externalId: p.externalId }
               });

               if (existing) {
                   await prisma.competitorPost.update({
                       where: { id: existing.id },
                       data: {
                           likesCount: p.likesCount,
                           commentsCount: p.commentsCount,
                           sharesCount: p.sharesCount,
                           scrapedAt: new Date()
                       }
                   });
               } else {
                   await prisma.competitorPost.create({
                       data: {
                           pageId: pageRecord.id,
                           externalId: p.externalId,
                           content: p.content,
                           mediaUrl: p.mediaUrl,
                           likesCount: p.likesCount,
                           commentsCount: p.commentsCount,
                           sharesCount: p.sharesCount,
                           postedAt: new Date() // Fallback
                       }
                   });
               }
           }
       } else {
           console.log(`[AutomationEngine] CompetitorPage not found for ${config.targetUrl}`);
       }
    }
  }

  static async runTask(profileId: string, config: TaskConfig) {
    browserManager.clearStopFlag(profileId);
    
    // Fetch account to get proxy
    const account = await prisma.facebookAccount.findFirst({ where: { profileId } });
    const proxyStr = account?.proxy;

    console.log(`[AutomationEngine] Launching browser for profile ${profileId}`);

    let browser;
    try {
      browser = await browserManager.launchBrowser(profileId, proxyStr);
    } catch (e: any) {
      console.error(`[AutomationEngine] Failed to launch browser for ${profileId}. Error: ${e.message}`);
      throw new Error(e.message || 'Browser already running');
    }

    // Wait a moment for Chrome to restore previous tabs
    await new Promise(r => setTimeout(r, 2000));
    
    const pages = browser.pages();
    let page = pages.find(p => p.url().includes('facebook.com'));
    
    if (!page) {
      page = pages[pages.length - 1];
    }
    
    // Close ALL other tabs to avoid about:blank or any other clutter
    for (const p of pages) {
      if (p !== page) {
        await p.close().catch(() => { });
      }
    }
    
    if (!page) {
      page = await browser.newPage();
    }

    await page.bringToFront();

    const screenshotPath = path.join(process.cwd(), 'public', 'screenshots', `${profileId}.jpg`);

    const intervalId = setInterval(() => {
      if (!page.isClosed()) {
        page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 40 }).catch(() => { });
      }
    }, 2000);

    try {
      switch (config.type) {
        case 'fb_farm_reels':
          await this.taskFbFarmReels(page, config, profileId);
          break;
        case 'fb_buff_post':
          await this.taskFbBuffPost(page, config, profileId);
          break;
        case 'fb_auto_interact':
          await this.taskFbAutoInteract(page, config, profileId);
          break;
        case 'fb_add_friends_group':
          await this.taskFbAddFriendsGroup(page, config, profileId);
          break;
        case 'fb_invite_to_group':
          await this.taskFbInviteToGroup(page, config, profileId);
          break;
        case 'fb_scrape_fanpage':
          await this.taskFbScrapeFanpage(page, config, profileId);
          break;
        default:
          throw new Error(`Unknown task type: ${config.type}`);
      }
    } catch (error) {
      console.error(`[AutomationEngine] Error running task ${config.type}:`, error);
      throw error;
    } finally {
      // We do NOT close the browser here, nor do we clear the interval!
      // This allows the browser to stay open 24/7 and the Live Dashboard to keep getting screenshots.
      console.log(`[AutomationEngine] Task ${config.type} completed, leaving browser open 24/7.`);

      // But we should clean up if the user manually closes the browser
      browser.on('close', () => {
        clearInterval(intervalId);
        if (fs.existsSync(screenshotPath)) {
          try { fs.unlinkSync(screenshotPath); } catch (e) { }
        }
      });
    }
  }
}
