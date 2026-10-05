const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // load .env from root


async function safePageEvaluate(page, fn, ...args) {
  let retries = 3;
  while (retries > 0) {
    try {
      return await page.evaluate(fn, ...args);
    } catch (e) {
      if (e.message && e.message.includes('Execution context was destroyed')) {
        retries--;
        if (retries === 0) throw e;
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw e;
      }
    }
  }
}

async function safePageEvaluateHandle(page, fn, ...args) {
  let retries = 3;
  while (retries > 0) {
    try {
      return await page.evaluateHandle(fn, ...args);
    } catch (e) {
      if (e.message && e.message.includes('Execution context was destroyed')) {
        retries--;
        if (retries === 0) throw e;
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw e;
      }
    }
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

async function humanType(page, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * 40) + 20 });
    if (Math.random() > 0.9) await safeWait(page, Math.floor(Math.random() * 150) + 50);
  }
}

function isSinglePostUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('/posts/') ||
         lower.includes('/permalink.php') ||
         lower.includes('/videos/') ||
         lower.includes('/watch') ||
         lower.includes('/reel/') ||
         lower.includes('/share/p/') ||
         lower.includes('/share/r/') ||
         lower.includes('/share/v/') ||
         lower.includes('fb.watch') ||
         lower.includes('fbid=') ||
         lower.includes('/photo') ||
         lower.includes('/story.php');
}

// AI Comment Generator
async function generateAIComment(postContent, aiSettings = {}) {
  const modelType = aiSettings.AI_MODEL || 'gemini-1.5-flash';
  const prompt = `Bạn là một người dùng Facebook bình thường, thân thiện và lịch sự.
Hãy viết 1 câu bình luận NGẮN GỌN (dưới 15 chữ), tự nhiên, khen ngợi hoặc đồng tình với nội dung bài viết sau đây.
Không dùng hashtag, không dùng biểu tượng cảm xúc quá nhiều, không viết hoa toàn bộ.
Tuyệt đối chỉ trả về nội dung bình luận, không giải thích.

Nội dung bài viết: "${postContent}"`;

  try {
    if (modelType.startsWith('gemini')) {
      const geminiKey = aiSettings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error('Thiếu GEMINI_API_KEY');
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelType}:generateContent?key=${geminiKey}`, {
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
          return data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
        }
      } else {
        const err = await res.text();
        console.log(`[AI Comment Error] gemini: HTTP ${res.status} - ${err}`);
      }
    } else if (modelType.startsWith('deepseek')) {
      const deepseekKey = aiSettings.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
      if (!deepseekKey) throw new Error('Thiếu DEEPSEEK_API_KEY');

      const res = await fetch('https://api.deepseek.com/chat/completions', {
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
      if (res.ok) {
        const data = await res.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      }
    } else if (modelType.startsWith('gpt')) {
      const openaiKey = aiSettings.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!openaiKey) throw new Error('Thiếu OPENAI_API_KEY');

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: modelType,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 60
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (error) {
    console.log(`[AI Comment Error] ${modelType}:`, error.message);
  }
  return null;
}

async function logHistory(profileId, actionType, link, message) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    await fetch(`${apiUrl}/automation-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, actionType, link, message })
    });
  } catch(e) {
    console.log('Failed to save log to DB', e.message);
  }
}

async function humanScroll(page, config, scrolls = 3) {
  for (let i = 0; i < scrolls; i++) {
    if (config?.checkStop && config.checkStop()) throw new Error('Task stopped by user');
    const distance = 300 + Math.random() * 500;
    const chunks = 15;
    const step = distance / chunks;

    for (let j = 0; j < chunks; j++) {
      await page.mouse.wheel(0, step);
      await safeWait(page, 20 + Math.random() * 20);
    }

    if (Math.random() > 0.8) {
      await page.mouse.wheel(0, -200);
    }

    await safeWait(page, 1500 + Math.random() * 2000);
  }
}

async function randomInteract(page, config, profileId, chance = 0.3) {
  if (config?.checkStop && config.checkStop()) throw new Error('Task stopped by user');
  const action = Math.random();
  if (action > chance) return;

  const isLike = Math.random() < 0.6;

  if (isLike) {
    console.log('Liking a post/reel');
    const likeHandle = await safePageEvaluateHandle(page, () => {
      function isRendered(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.pointerEvents === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }
      const allBtns = Array.from(document.querySelectorAll('[role="button"]'));
      const validLikes = allBtns.filter(el => {
        if (!isRendered(el)) return false;
        const rect = el.getBoundingClientRect();
        if (rect.height < 25 || rect.width < 25) return false; // Lọc các nút Thích nhỏ trong comment
        if (el.closest('[data-topify-liked="true"]')) return false;
        
        // Lọc menu header/sidebar
        if (el.closest('[role="banner"], [role="navigation"], [role="complementary"]')) return false;
        
        // Lọc phần bình luận
        if (el.closest('div[aria-label*="Bình luận của"], div[aria-label*="Comment by"]')) return false;
        
        const aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
        const text = (el.innerText || '').toLowerCase().trim();
        if (aria === 'thích' || aria === 'like' || aria === 'bày tỏ cảm xúc' || aria === 'thích bài viết' || aria === 'react') return true;
        if ((text === 'thích' || text === 'like') && el.children.length < 5) return true;
        return false;
      });
      if (validLikes.length > 0) {
        // Lấy nút gần màn hình hiển thị nhất hoặc nút đầu tiên
        const target = validLikes.find(el => {
            const rect = el.getBoundingClientRect();
            return rect.top > 0 && rect.top < window.innerHeight;
        }) || validLikes[0];
        
        const container = target.closest('div[role="article"], div[data-pagelet^="FeedUnit"]') || target;
        if (container) container.setAttribute('data-topify-liked', 'true');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return target;
      }
      return null;
    });

    const likeEl = likeHandle.asElement();
    if (likeEl) {
      try {
        await likeEl.hover();
        await safeWait(page, 100 + Math.random() * 200);
        await likeEl.click();
      } catch (e) {}
    }
    await likeHandle.dispose();
    await safeWait(page, 2000);
  } else if ((config.comments && config.comments.length > 0) || config.useAiComment) {
    console.log('Commenting on a post/reel');
    
    const commentResult = await safePageEvaluateHandle(page, () => {
      if (!window._topifyCommented) window._topifyCommented = new Set();
      function isRendered(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.pointerEvents === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }
      
      let allBtns = Array.from(document.querySelectorAll('[role="button"]'));
      let validComments = allBtns.filter(el => {
        if (!isRendered(el)) return false;
        const rect = el.getBoundingClientRect();
        if (rect.height < 25 || rect.width < 25) return false;
        
        if (el.closest('[data-topify-commented="true"]')) return false;
        if (el.closest('[role="banner"], [role="navigation"], [role="complementary"]')) return false;
        if (el.closest('div[aria-label*="Bình luận của"], div[aria-label*="Comment by"]')) return false;
        
        let text = (el.innerText || '').toLowerCase().trim();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
        
        if (aria === 'bình luận' || aria === 'comment' || aria === 'viết bình luận' || aria === 'leave a comment') return true;
        if ((text === 'bình luận' || text === 'comment') && el.children.length < 5) return true;
        
        return false;
      });
      
      let commentBtn = validComments.find(el => {
          const rect = el.getBoundingClientRect();
          return rect.top > 0 && rect.top < window.innerHeight;
      }) || validComments[0] || null;

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
            container.setAttribute('data-topify-commented', 'true');
            const messageBlock = container.querySelector('div[data-ad-preview="message"]');
            if (messageBlock) {
              text = messageBlock.innerText;
            } else {
              const textEls = Array.from(container.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
              let longestText = '';
              for (const el of textEls) {
                const txt = el.innerText || '';
                if (txt.length > longestText.length && txt.length > 15 && !['Thích', 'Bình luận', 'Chia sẻ', 'Like', 'Comment', 'Share'].includes(txt)) {
                  longestText = txt;
                }
              }
              text = longestText;
            }
          }
        } catch(e) {}
        
        if (text && window._topifyCommented.has(text)) return { element: null, postText: '' };
        if (text) window._topifyCommented.add(text);

        const target = commentBtn.closest('[role="button"]') || commentBtn;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { element: target, postText: text };
      }
      return { element: null, postText: '' };
    });

    const commentData = await commentResult.jsonValue();
    const commentElHandle = await commentResult.evaluateHandle(r => r.element);
    const commentEl = commentElHandle.asElement();
    
    let clicked = false;
    let postText = commentData?.postText || '';

    if (commentEl) {
      try {
        await commentEl.hover();
        await safeWait(page, 100 + Math.random() * 200);
        await commentEl.click();
        clicked = true;
      } catch (e) {}
    }
    
    await commentElHandle.dispose();
    await commentResult.dispose();

    if (clicked) {
      await safeWait(page, 3000);

      let finalComment = (config.comments && config.comments.length > 0) 
          ? config.comments[Math.floor(Math.random() * config.comments.length)]
          : 'Hay quá ạ!';
          
      try {
        if (config.useAiComment && postText && postText.trim().length > 10) {
          console.log('Generating AI comment for: ' + postText.substring(0, 30).replace(/\n/g, ' ') + '...');
          const aiText = await generateAIComment(postText, config.aiSettings || {});
          if (aiText) finalComment = aiText;
        }
      } catch (e) {
        console.log('AI Comment failed, using fallback.', e);
      }

      await safePageEvaluate(page, () => {
        const box = document.querySelector('form[action*="/comment/"] textarea, form div[contenteditable="true"], div[aria-label="Viết bình luận"], div[aria-label="Write a comment"]');
        if (box) box.focus();
      });

      await humanType(page, finalComment);
      await safeWait(page, 500);
      await page.keyboard.press('Enter');

      const postLink = await safePageEvaluate(page, () => {
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
        return window.location.href;
      });

      console.log('Logged comment to DB:', postLink, finalComment);
      await logHistory(profileId, 'COMMENT', postLink, finalComment);

      await safeWait(page, 3000);
      await page.keyboard.press('Escape');
      await safeWait(page, 1000);
    }
  }
}

async function taskFbFarmReels(page, config, profileId) {
  let reelsUrl = config.targetUrl || 'https://www.facebook.com/reels/';

  if (!config.targetUrl) {
    console.log(`Farming general reels`);
    await page.goto(reelsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await safeWait(page, 5000);

    const reelHandle = await safePageEvaluateHandle(page, () => {
      return document.querySelector('a[href*="/reel/"]');
    });
    const reelEl = reelHandle.asElement();
    if (reelEl) {
      try {
        await reelEl.hover();
        await safeWait(page, 100);
        await reelEl.click();
      } catch (e) {}
    }
    await reelHandle.dispose();
    await safeWait(page, 5000);

    for (let i = 0; i < config.actionCount; i++) {
      if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
      console.log(`Watching reel ${i + 1}/${config.actionCount}`);
      await safeWait(page, 10000 + Math.random() * 15000);
      await randomInteract(page, config, profileId, 0.2);

      if (Math.random() > 0.8 && i > 0) {
        await page.keyboard.press('ArrowUp');
      } else {
        await page.keyboard.press('ArrowDown');
      }
      await safeWait(page, 2000);
    }
    return;
  }

  if (!reelsUrl.endsWith('/reels/') && !reelsUrl.endsWith('/reels')) {
    reelsUrl = reelsUrl.replace(/\/$/, '') + '/reels/';
  }

  console.log(`Farming fanpage reels at ${reelsUrl}`);

  for (let i = 0; i < config.actionCount; i++) {
    if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
    await page.goto(reelsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await safeWait(page, 4000);

    if (i > 4) {
      await humanScroll(page, config, Math.floor(i / 4));
    }

    const reelHandle = await safePageEvaluateHandle(page, (index) => {
      const reels = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      if (reels.length > index) {
        return reels[index];
      } else if (reels.length > 0) {
        return reels[Math.floor(Math.random() * reels.length)];
      }
      return null;
    }, i);

    const reelEl = reelHandle.asElement();
    let clicked = false;
    if (reelEl) {
      try {
        await reelEl.hover();
        await safeWait(page, 100);
        await reelEl.click();
        clicked = true;
      } catch (e) {}
    }
    await reelHandle.dispose();

    if (clicked) {
      console.log(`Watching fanpage reel ${i + 1}/${config.actionCount}`);
      await safeWait(page, 10000 + Math.random() * 15000);
      await randomInteract(page, config, profileId, 0.2);
    } else {
      console.log(`Could not find reel ${i + 1}`);
      break;
    }
  }
}

async function taskFbAutoInteract(page, config, profileId) {
  const targetUrl = config.targetUrl ? config.targetUrl.trim() : '';

  // Nếu người dùng paste link bài đăng cụ thể, chạy tương tác trực tiếp vào bài viết đó
  if (targetUrl && isSinglePostUrl(targetUrl)) {
    console.log(`[AutoInteract] Phát hiện link bài đăng cụ thể: ${targetUrl}. Chuyển sang thực hiện tương tác trực tiếp bài viết...`);
    
    // 1. Thích bài viết
    try {
      await taskFbBuffPost(page, {
        ...config,
        targetUrl,
        buffActionType: 'LIKE'
      }, profileId);
    } catch (likeErr) {
      console.warn(`[AutoInteract] Lỗi khi like bài viết:`, likeErr.message);
    }

    // 2. Bình luận bài viết nếu có cấu hình nội dung bình luận hoặc AI comment
    if ((config.comments && config.comments.length > 0) || config.useAiComment) {
      await safeWait(page, 3000);
      try {
        await taskFbBuffPost(page, {
          ...config,
          targetUrl,
          buffActionType: 'COMMENT'
        }, profileId);
      } catch (cmtErr) {
        console.warn(`[AutoInteract] Lỗi khi bình luận bài viết:`, cmtErr.message);
      }
    }
    return;
  }

  // Nếu không phải single post, lướt feed tương tác tự nhiên
  const feedUrl = targetUrl || 'https://www.facebook.com/';
  console.log(`Farming feed at ${feedUrl}`);
  await page.goto(feedUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await safeWait(page, 4000);

  await safePageEvaluate(page, () => { window._topifyCommented = new Set(); });

  const totalActions = config.actionCount || 5;
  for (let i = 0; i < totalActions; i++) {
    if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
    console.log(`Scrolling feed ${i + 1}/${totalActions}`);
    await humanScroll(page, config, 2);
    await randomInteract(page, config, profileId, 0.7);
  }
}

async function taskFbAddFriendsGroup(page, config, profileId) {
  let url = config.targetUrl;
  if (!url) throw new Error('Vui lòng nhập Link Group Facebook!');
  
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
  await safeWait(page, 4000 + Math.random() * 2000);

  const joinHandle = await safePageEvaluateHandle(page, () => {
    let btns = Array.from(document.querySelectorAll('div[role="button"], span'));
    let joinBtn = btns.find(b => {
      let t = (b.innerText || '').toLowerCase().trim();
      return t === 'tham gia nhóm' || t === 'tham gia' || t === 'join group' || t === 'join';
    });
    if (joinBtn) {
      return joinBtn.closest('[role="button"]') || joinBtn;
    }
    return null;
  });
  
  const joinEl = joinHandle.asElement();
  let joined = false;
  if (joinEl) {
    try {
      await joinEl.hover();
      await safeWait(page, 100);
      await joinEl.click();
      joined = true;
    } catch(e) {}
  }
  await joinHandle.dispose();
  if (joined) {
    console.log('Clicked Join Group, waiting...');
    await safeWait(page, 5000);
  }

  let addedCount = 0;
  let scrollAttempts = 0;

  while (addedCount < config.actionCount && scrollAttempts < 20) {
    if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
    const btnSelector = '[aria-label*="Thêm bạn bè"], [aria-label*="Add friend"], [aria-label*="Add Friend"], span';
    const btns = await page.locator(btnSelector).all();

    let clickedInThisPass = false;
    for (const btn of btns) {
      if (addedCount >= config.actionCount) break;

      let isValid = false;
      try {
        isValid = await btn.evaluate(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return false;
          let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
          let text = (el.innerText || '').toLowerCase().trim();
          return aria.includes('thêm bạn bè') || aria.includes('add friend') || text.includes('thêm bạn bè') || text.includes('add friend');
        });
      } catch (e) {
        if (e.message && e.message.includes('Execution context was destroyed')) isValid = false;
        else throw e;
      }

      if (isValid) {
        try {
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await btn.click({ timeout: 2000 });
          addedCount++;
          clickedInThisPass = true;
          console.log(`Sent friend request ${addedCount}/${config.actionCount}`);
          await safeWait(page, 3000 + Math.random() * 5000);
        } catch (e) {}
      }
    }

    if (!clickedInThisPass) {
      await humanScroll(page, config, 2);
      scrollAttempts++;
    } else {
      await safeWait(page, 5000 + Math.random() * 5000);
      await humanScroll(page, config, 2);
    }
  }
}

async function taskFbInviteToGroup(page, config, profileId) {
  let url = config.targetUrl;
  if (!url) throw new Error('Vui lòng nhập Link Group Facebook!');
  
  if (/^\d+$/.test(url.trim())) url = `https://www.facebook.com/groups/${url.trim()}`;
  else if (!url.includes('facebook.com') && !url.includes('fb.com')) url = `https://www.facebook.com/groups/${url.trim()}`;

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await safeWait(page, 4000 + Math.random() * 2000);

  const joinHandle = await safePageEvaluateHandle(page, () => {
    let btns = Array.from(document.querySelectorAll('div[role="button"], span'));
    let joinBtn = btns.find(b => {
      let t = (b.innerText || '').toLowerCase().trim();
      return t === 'tham gia nhóm' || t === 'tham gia' || t === 'join group' || t === 'join';
    });
    if (joinBtn) {
      return joinBtn.closest('[role="button"]') || joinBtn;
    }
    return null;
  });

  const joinEl = joinHandle.asElement();
  let joined = false;
  if (joinEl) {
    try {
      await joinEl.hover();
      await safeWait(page, 100);
      await joinEl.click();
      joined = true;
    } catch(e) {}
  }
  await joinHandle.dispose();
  if (joined) {
    console.log('Clicked Join Group, waiting...');
    await safeWait(page, 5000);
  }

  const inviteHandle = await safePageEvaluateHandle(page, () => {
    const inviteSelectors = ['div[aria-label="Mời"]', 'div[aria-label="Invite"]', 'div[aria-label*="Mời tham gia"]', 'div[role="button"]', 'a', 'span'];
    let allBtns = Array.from(document.querySelectorAll(inviteSelectors.join(', ')));
    let inviteBtn = allBtns.find(el => {
      let text = (el.innerText || '').toLowerCase();
      let aria = (el.getAttribute('aria-label') || '').toLowerCase();
      if ((text.includes('mời') || text.includes('invite') || aria.includes('mời') || aria.includes('invite')) && !text.includes('bạn bè trên facebook')) {
        return el.getBoundingClientRect().width > 0;
      }
      return false;
    });

    if (inviteBtn) {
      return inviteBtn.closest('[role="button"]') || inviteBtn;
    }
    return null;
  });

  const inviteEl = inviteHandle.asElement();
  let opened = false;
  if (inviteEl) {
    try {
      await inviteEl.hover();
      await safeWait(page, 100);
      await inviteEl.click();
      opened = true;
    } catch(e) {}
  }
  await inviteHandle.dispose();

  if (opened) {
    console.log('Opened Invite dialog');
    await safeWait(page, 3000);

    const subBtnHandle = await safePageEvaluateHandle(page, () => {
      let spans = Array.from(document.querySelectorAll('span'));
      let subBtn = spans.find(span => {
        let text = span.innerText?.toLowerCase() || '';
        return text.includes('mời bạn bè trên facebook') || text.includes('invite facebook friends');
      });
      if (subBtn) {
        return subBtn.closest('[role="button"]') || subBtn;
      }
      return null;
    });
    const subEl = subBtnHandle.asElement();
    if (subEl) {
      try {
        await subEl.hover();
        await safeWait(page, 100);
        await subEl.click();
      } catch(e) {}
    }
    await subBtnHandle.dispose();
    await safeWait(page, 3000);

    let invitedCount = 0;
    let scrollAttempts = 0;

    while (invitedCount < config.actionCount && scrollAttempts < 15) {
      if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
      const checkboxes = await page.locator('input[type="checkbox"], div[role="checkbox"]').all();
      let clickedInThisPass = false;

      for (const cb of checkboxes) {
        if (invitedCount >= config.actionCount) break;

        let canCheck = false;
        try {
          canCheck = await cb.evaluate(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return false;
            const ariaChecked = el.getAttribute('aria-checked');
            if (ariaChecked === 'true') return false;
            if (el.tagName.toLowerCase() === 'input' && el.checked) return false;
            return true;
          });
        } catch (e) {
          if (e.message && e.message.includes('Execution context was destroyed')) canCheck = false;
          else throw e;
        }

        if (canCheck) {
          try {
            await cb.scrollIntoViewIfNeeded().catch(() => {});
            await cb.click({ timeout: 2000 });
            invitedCount++;
            clickedInThisPass = true;
            console.log(`Selected friend ${invitedCount}/${config.actionCount}`);
            await safeWait(page, 1000 + Math.random() * 1500);
          } catch (e) { }
        }
      }

      if (!clickedInThisPass) {
        try { await page.mouse.wheel(0, 500); } catch (e) { }
        await safeWait(page, 2000);
        scrollAttempts++;
      }
    }

    const sendBtnHandle = await safePageEvaluateHandle(page, () => {
      let spans = Array.from(document.querySelectorAll('div[role="button"] span'));
      let sendBtn = spans.find(span => {
        let txt = (span.innerText || '').toLowerCase().trim();
        return txt.includes('gửi lời mời') || txt.includes('send invites') || txt === 'gửi' || txt === 'send';
      });
      if (sendBtn) {
        return sendBtn.closest('[role="button"]') || sendBtn;
      }
      return null;
    });

    const sendEl = sendBtnHandle.asElement();
    let sent = false;
    if (sendEl) {
      try {
        await sendEl.hover();
        await safeWait(page, 100);
        await sendEl.click();
        sent = true;
      } catch(e) {}
    }
    await sendBtnHandle.dispose();

    if (sent) console.log('[InviteGroup] Đã bấm gửi lời mời');
    await safeWait(page, 2000);
  }
}

function ensurePageAlive(page) {
  if (!page || page.isClosed()) {
    throw new Error('Page đã bị đóng trước khi hoàn thành tác vụ');
  }
}

async function taskFbBuffPost(page, config, profileId) {
  if (!config.targetUrl) throw new Error('Target URL is required for buff post task');
  if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
  ensurePageAlive(page);
  console.log(`[BuffPost] Điều hướng đến: ${config.targetUrl}`);
  
  // Điều hướng có retry an toàn
  const navTarget = async () => {
    await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  };
  try {
    await navTarget();
  } catch (navErr) {
    console.warn(`[BuffPost] Lỗi điều hướng lần 1 (${navErr.message}), thử lại sau 2 giây...`);
    await safeWait(page, 2000);
    await navTarget();
  }
  await safeWait(page, 3000 + Math.random() * 2000);

  // Pause videos to prevent auto-scrolling to next Reel
  await safePageEvaluate(page, () => {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      try { v.pause(); } catch(e) {}
    });
  });

  // Đóng các popup che khuất màn hình
  await safePageEvaluate(page, () => {
    try {
      const closeSelectors = [
        'div[aria-label="Lúc khác"]', 'div[aria-label="Not Now"]',
        'div[aria-label="Đóng vòng kết nối"]', 'div[aria-label="Bỏ qua"]', 'div[aria-label="Dismiss"]'
      ];
      const closeBtns = Array.from(document.querySelectorAll(closeSelectors.join(', ')));
      for (const btn of closeBtns) {
        if (btn.getBoundingClientRect().width > 0) {
          btn.click();
        }
      }
      
      const spans = Array.from(document.querySelectorAll('span'));
      for (const span of spans) {
        const text = (span.innerText || '').trim();
        if (text === 'Lúc khác' || text === 'Not Now' || text === 'Bỏ qua') {
          if (span.getBoundingClientRect().width > 0) span.click();
        }
      }
    } catch(e) {}
  });
  await safeWait(page, 2000);

  console.log('[BuffPost] Tìm bài viết chính và cuộn trang...');
  // Cuộn bằng chuột thật (wheel) để hoạt động cả khi bài viết mở trong popup/modal
  const wheelScroll = async (deltaY) => {
    try {
      const vp = await safePageEvaluate(page, () => ({ w: window.innerWidth, h: window.innerHeight }));
      await page.mouse.move(vp.w / 2, vp.h / 2);
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, deltaY / 4);
        await new Promise(r => setTimeout(r, 250));
      }
    } catch (e) {}
  };
  await wheelScroll(600);
  await safeWait(page, 1500);
  await wheelScroll(-200);
  await safeWait(page, 1000);

  // Xác định các hành động cần thực hiện
  // Mặc định (task 'Auto Comment & Like' không truyền buffActionType) => luôn Like + Comment
  const shouldComment = config.buffActionType === 'COMMENT' || 
                        config.buffActionType === 'BOTH' || 
                        config.buffActionType === 'ALL' ||
                        (!config.buffActionType);
  const shouldLike = config.buffActionType === 'LIKE' || config.buffActionType === 'BOTH' || config.buffActionType === 'ALL' || (!config.buffActionType);
  const shouldShare = config.buffActionType === 'SHARE' || config.buffActionType === 'ALL';

  let successCount = 0;

  // ===================== 1. XỬ LÝ THÍCH BÀI VIẾT (LIKE) =====================
  if (shouldLike) {
    ensurePageAlive(page);
    console.log('[Buff LIKE] Đang thực hiện Thích bài viết...');
    
    let likeResult = { success: false, reason: 'NOT_FOUND' };
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        await wheelScroll(500);
        await safeWait(page, 800);
      }
      likeResult = await safePageEvaluate(page, async () => {
        // Quét tất cả dialog trước, sau đó main, cuối cùng body
        const roots = [...document.querySelectorAll('div[role="dialog"]'), document.querySelector('[role="main"]'), document.body].filter(Boolean);
        const btnSet = new Set();
        for (const r of roots) r.querySelectorAll('[role="button"]').forEach(b => btnSet.add(b));
        const btns = Array.from(btnSet);
        
        const likeBtn = btns.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
          const text = (b.innerText || '').toLowerCase().trim();
          
          if (aria === 'thích' || aria === 'like' || aria === 'bày tỏ cảm xúc' || aria === 'react' ||
              aria === 'gỡ bày tỏ cảm xúc' || aria === 'remove reaction' || aria === 'bỏ thích' || aria === 'unlike' || aria.includes('thích') || aria.includes('bày tỏ')) {
            if (aria.includes('bình luận') || aria.includes('chia sẻ') || aria.includes('nhắn tin')) return false;
            return b.getBoundingClientRect().height > 0 && !b.closest('form');
          }
          if ((text === 'thích' || text === 'like') && b.children.length < 5) {
            return b.getBoundingClientRect().height > 0 && !b.closest('form');
          }
          return false;
        });

        if (!likeBtn) return { success: false, reason: 'NOT_FOUND' };
        
        const aria = (likeBtn.getAttribute('aria-label') || '').toLowerCase().trim();
        const text = (likeBtn.innerText || '').toLowerCase().trim();
        if (aria.includes('gỡ') || aria.includes('bỏ') || aria.includes('remove') || aria.includes('unlike') ||
            likeBtn.getAttribute('aria-pressed') === 'true' || 
            (likeBtn.style && likeBtn.style.color && likeBtn.style.color.includes('rgb(8, 102, 255)'))) {
          return { success: true, reason: 'ALREADY_LIKED' };
        }

        likeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Đợi scroll
        await new Promise(r => setTimeout(r, 500));
        likeBtn.click();
        return { success: true, reason: 'CLICKED' };
      });
      if (likeResult.success) break;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (likeResult.success) {
      if (likeResult.reason === 'ALREADY_LIKED') {
        console.log('[Buff LIKE] Bài viết đã được thích từ trước.');
        await logHistory(profileId, 'LIKE', config.targetUrl, 'Bài viết đã được thích từ trước');
        successCount++;
      } else {
        await safeWait(page, 2000);
        console.log('[Buff LIKE] Đã gửi tương tác thích bài viết.');
        await logHistory(profileId, 'LIKE', config.targetUrl, 'Đã thích bài viết thành công');
        successCount++;
      }
    } else {
      console.warn('[Buff LIKE] Không tìm thấy nút Thích.');
      throw new Error('Lỗi: Không tìm thấy nút Thích trên trang bài viết.');
    }
  }

  // ===================== 2. XỬ LÝ BÌNH LUẬN BÀI VIẾT (COMMENT) =====================
  if (shouldComment) {
    ensurePageAlive(page);
    console.log('[Buff COMMENT] Bắt đầu bình luận bài viết...');

    // Lấy nội dung bài viết để AI comment nếu cần
    let postText = '';
    if (config.useAiComment) {
      try {
        postText = await safePageEvaluate(page, () => {
          const msg = document.querySelector('div[data-ad-preview="message"], div[data-ad-comet-preview="message"]');
          if (msg) return msg.innerText;
          const main = document.querySelector('[role="main"]');
          return main ? main.innerText.substring(0, 500) : '';
        });
      } catch (e) {}
    }

    let finalComment = (config.comments && config.comments.length > 0)
      ? config.comments[Math.floor(Math.random() * config.comments.length)]
      : 'Bài viết rất hay và ý nghĩa ạ!';

    if (config.useAiComment && postText && postText.trim().length > 10) {
      try {
        console.log('[Buff COMMENT] Đang sinh bình luận AI...');
        const aiText = await generateAIComment(postText, config.aiSettings || {});
        if (aiText) finalComment = aiText;
      } catch (aiErr) {
        console.warn('[Buff COMMENT] Sinh AI comment thất bại, dùng fallback:', aiErr.message);
      }
    }

    // Nhấp vào nút "Bình luận" để tự động focus vào textbox
    console.log('[Buff COMMENT] Đang tìm nút mở bình luận...');
    let clickedComment = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      clickedComment = await safePageEvaluate(page, async () => {
        const roots = [...document.querySelectorAll('div[role="dialog"]'), document.querySelector('[role="main"]'), document.body].filter(Boolean);
        const btnSet = new Set();
        for (const r of roots) r.querySelectorAll('[role="button"]').forEach(b => btnSet.add(b));
        const btns = Array.from(btnSet);
        const commentBtn = btns.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
          const text = (b.innerText || '').toLowerCase().trim();
          if ((aria.includes('bình luận') || aria.includes('comment')) && !aria.includes('thích') && !aria.includes('chia sẻ') && b.getBoundingClientRect().height > 0 && !b.closest('form')) return true;
          if ((text === 'bình luận' || text === 'comment') && b.getBoundingClientRect().height > 0 && b.children.length < 5 && !b.closest('form')) return true;
          return false;
        });

        if (commentBtn) {
          commentBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(r => setTimeout(r, 500));
          commentBtn.click();
          return true;
        }
        return false;
      });
      if (clickedComment) break;
      // Dùng hàm delay do truyền vào không được, xài Promise
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!clickedComment) {
      console.warn('[Buff COMMENT] Không tìm thấy nút Bình luận. Sẽ thử tìm ô textbox trực tiếp.');
    }
    
    await safeWait(page, 1500);

    // Tìm ô nhập bình luận và đánh dấu để click bằng chuột thật (Lexical editor của FB cần sự kiện thật)
    let textBoxFocused = false;
    for (let attempt = 0; attempt < 3 && !textBoxFocused; attempt++) {
      const found = await safePageEvaluate(page, async () => {
        document.querySelectorAll('[data-topify-cbox]').forEach(el => el.removeAttribute('data-topify-cbox'));
        const roots = [...document.querySelectorAll('div[role="dialog"]'), document.querySelector('[role="main"]'), document.body].filter(Boolean);
        const boxSet = new Set();
        for (const r of roots) r.querySelectorAll('[contenteditable="true"]').forEach(b => boxSet.add(b));
        const boxes = Array.from(boxSet).filter(b => {
          const rect = b.getBoundingClientRect();
          const label = (b.getAttribute('aria-label') || b.getAttribute('aria-placeholder') || '').toLowerCase();
          return rect.height > 0 && rect.width > 0 && !label.includes('tìm kiếm') && !label.includes('search');
        });
        const isCommentBox = (b) => {
          const label = (b.getAttribute('aria-label') || b.getAttribute('aria-placeholder') || b.innerText || '').toLowerCase();
          return label.includes('bình luận') || label.includes('comment') || label.includes('trả lời') || label.includes('reply');
        };
        const box = boxes.find(isCommentBox) || boxes[0];
        if (!box) return false;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 600));
        box.setAttribute('data-topify-cbox', '1');
        return true;
      });

      if (found) {
        try {
          await page.locator('[data-topify-cbox="1"]').first().click({ timeout: 5000 });
          textBoxFocused = true;
        } catch (e) {
          // Fallback: focus bằng DOM
          textBoxFocused = await safePageEvaluate(page, () => {
            const el = document.querySelector('[data-topify-cbox="1"]');
            if (!el) return false;
            el.focus();
            el.click();
            return true;
          });
        }
      } else {
        await wheelScroll(500);
        await safeWait(page, 1000);
      }
    }

    if (!textBoxFocused) {
      throw new Error('Lỗi: Không tìm thấy ô nhập bình luận hoặc không thể click vào ô bình luận.');
    }
    await safeWait(page, 800);

    console.log(`[Buff COMMENT] Đang gõ nội dung bình luận: "${finalComment}"`);
    await humanType(page, finalComment);
    await safeWait(page, 1000);
    
    // Gửi bình luận
    await page.keyboard.press('Enter');
    await safeWait(page, 2000);

    // Bấm nút gửi bình luận (máy bay giấy) nếu có
    await safePageEvaluate(page, () => {
      const btns = Array.from(document.querySelectorAll('[role="button"]'));
      const sendBtn = btns.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
        return (aria.includes('bình luận') || aria.includes('comment') || aria.includes('gửi') || aria.includes('send')) && b.getBoundingClientRect().height > 0 && b.closest('form');
      });
      if (sendBtn) sendBtn.click();
    });

    await safeWait(page, 3000);

    // Xác minh bình luận đã được gửi bằng cách kiểm tra ô nhập có trống không, VÀ có text finalComment hay không
    const isCommentSent = await safePageEvaluate(page, (commentText) => {
      const activeText = document.activeElement ? document.activeElement.innerText || '' : '';
      const textOnScreen = document.body.innerText.includes(commentText.substring(0, 15));
      // Nếu activeElement rỗng (đã gửi) hoặc chữ xuất hiện trên màn hình trong DOM (post list)
      return activeText.trim() === '' || textOnScreen;
    }, finalComment);

    if (!isCommentSent) {
      throw new Error('Lỗi: Đã gõ bình luận nhưng dường như chưa được gửi đi (ô nhập vẫn còn chữ).');
    }

    await logHistory(profileId, 'COMMENT', config.targetUrl, finalComment);
    console.log('[Buff COMMENT] Đã đăng bình luận thành công!');
    successCount++;
    await safeWait(page, 2000);
  }

  // ===================== 3. XỬ LÝ CHIA SẺ BÀI VIẾT (SHARE) =====================
  if (shouldShare) {
    ensurePageAlive(page);
    console.log('[Buff SHARE] Bắt đầu chia sẻ bài viết...');
    
    let clickedShare = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      clickedShare = await safePageEvaluate(page, async () => {
        const container = document.querySelector('div[role="dialog"]') || document.querySelector('[role="main"]') || document.body;
        const btns = Array.from(container.querySelectorAll('[role="button"]'));
        const shareBtn = btns.find(b => {
          const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
          const text = (b.innerText || '').toLowerCase().trim();
          return (aria.includes('chia sẻ') || aria.includes('share') || text === 'chia sẻ' || text === 'share') && !aria.includes('thích') && !aria.includes('bình luận') && b.getBoundingClientRect().height > 0 && !b.closest('form');
        });

        if (shareBtn) {
          shareBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(r => setTimeout(r, 500));
          shareBtn.click();
          return true;
        }
        return false;
      });
      if (clickedShare) break;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!clickedShare) {
      throw new Error('Lỗi: Không tìm thấy nút Chia sẻ trên bài viết.');
    }

    await safeWait(page, 2500);

    const clickedShareNow = await safePageEvaluate(page, async () => {
      const items = Array.from(document.querySelectorAll('div[role="menuitem"], span, div[role="button"]'));
      const shareNow = items.find(el => {
        const t = (el.innerText || '').toLowerCase().trim();
        return (t === 'chia sẻ ngay' || t === 'share now' || t === 'chia sẻ ngay (công khai)' || t.includes('chia sẻ ngay')) && el.getBoundingClientRect().height > 0;
      });
      if (shareNow) {
        shareNow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 500));
        shareNow.click();
        return true;
      }
      return false;
    });

    if (!clickedShareNow) {
      throw new Error('Lỗi: Không tìm thấy tùy chọn "Chia sẻ ngay" trong menu chia sẻ.');
    }
    
    await safeWait(page, 4000); // Chờ quá trình share hoàn tất
    
    await logHistory(profileId, 'SHARE', config.targetUrl, 'Đã chia sẻ bài viết thành công');
    console.log('[Buff SHARE] Đã chia sẻ bài viết thành công.');
    successCount++;
    await safeWait(page, 2000);
  }

  if (successCount === 0) {
    throw new Error('Lỗi: Không có hành động (Thích/Bình luận/Chia sẻ) nào được thực hiện thành công.');
  }
}

async function fillPostCaption(page, captionText) {
  if (!captionText || !captionText.trim()) return false;
  const cleanCaption = captionText.trim();
  const sample = cleanCaption.substring(0, Math.min(cleanCaption.length, 5));
  console.log(`[PostGroup] Bắt đầu nhập nội dung bài viết: "${cleanCaption.substring(0, 50)}"...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    // Đánh dấu ô contenteditable hoặc placeholder trong dialog
    const boxFound = await page.evaluate(() => {
      document.querySelectorAll('[data-topify-cbox]').forEach(e => e.removeAttribute('data-topify-cbox'));
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
        const rect = d.getBoundingClientRect();
        return rect.width > 200 && rect.height > 200;
      });
      const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
      if (!d) return false;

      // 1. Tìm các phần tử contenteditable
      const editables = Array.from(d.querySelectorAll('[contenteditable="true"]')).filter(el => {
        const rect = el.getBoundingClientRect();
        const lbl = (el.getAttribute('aria-label') || '').toLowerCase();
        return rect.width > 0 && rect.height > 0 && !lbl.includes('search') && !lbl.includes('tìm kiếm');
      });

      if (editables.length > 0) {
        const box = editables[0];
        box.setAttribute('data-topify-cbox', '1');
        box.focus();
        return true;
      }

      // 2. Tìm phần tử chứa placeholder text nếu contenteditable chưa xuất hiện
      const allElements = Array.from(d.querySelectorAll('*'));
      const placeholder = allElements.find(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        const ph = (el.getAttribute('aria-placeholder') || '').toLowerCase();
        return (
          t.includes('create a public post') || t.includes('tạo bài viết') || t.includes('viết gì') || t.includes('write something') ||
          aria.includes('create a public post') || aria.includes('tạo bài viết') || aria.includes('write something') ||
          ph.includes('create a public post') || ph.includes('write something')
        );
      });

      if (placeholder) {
        placeholder.setAttribute('data-topify-cbox', '1');
        return true;
      }

      return false;
    });

    if (boxFound) {
      const box = page.locator('[data-topify-cbox="1"]').first();
      await box.scrollIntoViewIfNeeded().catch(() => {});
      await box.click({ timeout: 5000, force: true }).catch(() => {});
      await safeWait(page, 200);

      // Thử click theo tọa độ chuột vào đầu box để đặt cursor chắc chắn
      const bBox = await box.boundingBox().catch(() => null);
      if (bBox) {
        await page.mouse.click(bBox.x + Math.min(25, Math.max(10, bBox.width / 4)), bBox.y + Math.min(20, Math.max(10, bBox.height / 2))).catch(() => {});
        await safeWait(page, 200);
      }

      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+A' : 'Control+A').catch(() => {});
      await page.keyboard.press('Backspace').catch(() => {});
      await safeWait(page, 150);

      // Thử 1: Gõ bàn phím theo delay (Lexical native input events)
      await page.keyboard.type(cleanCaption, { delay: 30 }).catch(() => {});
      await safeWait(page, 400);

      // Kiểm tra xem chữ đã xuất hiện trong dialog chưa
      let hasText = await page.evaluate((sampleText) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
          const rect = d.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        });
        const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
        return d ? (d.innerText || d.textContent || '').includes(sampleText) : false;
      }, sample);

      if (!hasText) {
        // Thử 2: Dùng insertText của Playwright (beforeinput)
        await page.keyboard.insertText(cleanCaption).catch(() => {});
        await safeWait(page, 400);
      }

      hasText = await page.evaluate((sampleText) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
          const rect = d.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        });
        const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
        return d ? (d.innerText || d.textContent || '').includes(sampleText) : false;
      }, sample);

      if (!hasText) {
        // Thử 3: Dispatch ClipboardEvent paste
        await page.evaluate((text) => {
          const el = document.querySelector('[data-topify-cbox="1"]') || document.querySelector('[role="dialog"] [contenteditable="true"]');
          if (!el) return;
          el.focus();
          try {
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            const pasteEv = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
            el.dispatchEvent(pasteEv);
          } catch(e) {}
        }, cleanCaption);
        await safeWait(page, 400);
      }

      hasText = await page.evaluate((sampleText) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
          const rect = d.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        });
        const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
        return d ? (d.innerText || d.textContent || '').includes(sampleText) : false;
      }, sample);

      if (!hasText) {
        // Thử 4: document.execCommand insertText
        await page.evaluate((text) => {
          const el = document.querySelector('[data-topify-cbox="1"]') || document.querySelector('[role="dialog"] [contenteditable="true"]');
          if (!el) return;
          el.focus();
          try {
            document.execCommand('insertText', false, text);
          } catch(e) {}
        }, cleanCaption);
        await safeWait(page, 400);
      }

      hasText = await page.evaluate((sampleText) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
          const rect = d.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        });
        const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
        return d ? (d.innerText || d.textContent || '').includes(sampleText) : false;
      }, sample);

      if (hasText) {
        console.log(`[PostGroup] ✅ Đã nhập thành công Caption: "${cleanCaption}"`);
        return true;
      }
    }

    await safeWait(page, 800);
  }

  console.warn('[PostGroup] Chưa thể nhập Caption sau các lần thử, tiếp tục tiến trình...');
  return false;
}

async function taskFbPostGroup(page, config, profileId) {
  const url = config.targetUrl || config.groupUrl;
  if (!url) throw new Error('Vui lòng nhập Link Group Facebook cần đăng bài!');
  if (config.checkStop && config.checkStop()) throw new Error('Tác vụ đã bị người dùng dừng');
  ensurePageAlive(page);

  const caption = config.caption || '';
  const mediaPath = config.mediaPath || '';

  console.log(`[PostGroup] Bắt đầu đăng bài lên Group: ${url} (Profile: ${profileId})`);

  // Bước 1: Điều hướng tới trang Group
  const navGroup = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  };
  try {
    await navGroup();
  } catch (err) {
    console.warn(`[PostGroup] Lỗi điều hướng lần 1 (${err.message}), thử lại...`);
    await safeWait(page, 2500);
    await navGroup();
  }

  await safeWait(page, 3000 + Math.random() * 2000);
  ensurePageAlive(page);

  // Đóng các popup thông báo hoặc overlay
  await safePageEvaluate(page, () => {
    try {
      const closeSelectors = [
        'div[aria-label="Lúc khác"]', 'div[aria-label="Not Now"]',
        'div[aria-label="Đóng vòng kết nối"]', 'div[aria-label="Bỏ qua"]', 'div[aria-label="Dismiss"]',
        'div[aria-label="Đóng"]', 'div[aria-label="Close"]'
      ];
      document.querySelectorAll(closeSelectors.join(', ')).forEach(el => {
        if (el.getBoundingClientRect().width > 0) el.click();
      });
    } catch(e) {}
  });

  // Bước 2: Tìm và bấm nút Tạo bài viết trong Group
  console.log('[PostGroup] Đang tìm nút Tạo bài viết trong nhóm...');
  const createPostSelectors = [
    '[role="button"]:has-text("Bạn viết gì đi")',
    '[role="button"]:has-text("Viết gì đó")',
    '[role="button"]:has-text("Tạo bài viết")',
    '[role="button"]:has-text("Write something")',
    '[role="button"]:has-text("Create a post")',
    '[role="button"]:has-text("Create a public post")',
    '[aria-label="Tạo bài viết"]',
    '[aria-label="Create a post"]',
    'div[data-pagelet="GroupInlineComposer"] [role="button"]'
  ];

  let dialogOpened = false;
  for (const selector of createPostSelectors) {
    if (config.checkStop && config.checkStop()) throw new Error('Tác vụ đã bị người dùng dừng');
    try {
      const count = await page.locator(selector).count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const item = page.locator(selector).nth(i);
        if (await item.isVisible().catch(() => false)) {
          await item.click({ timeout: 5000, force: true });
          await safeWait(page, 1500);
          const hasDialog = await page.locator('[role="dialog"]').count().catch(() => 0);
          if (hasDialog > 0) {
            dialogOpened = true;
            break;
          }
        }
      }
      if (dialogOpened) break;
    } catch (e) {}
  }

  if (!dialogOpened) {
    const clickedByText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('[role="button"], div[tabindex="0"]'));
      const target = buttons.find(b => {
        const t = (b.textContent || '').trim().toLowerCase();
        return t.includes('viết gì') || t.includes('tạo bài viết') || t.includes('write something') || t.includes('create a post');
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    }).catch(() => false);
    if (clickedByText) {
      await safeWait(page, 2000);
      dialogOpened = (await page.locator('[role="dialog"]').count().catch(() => 0)) > 0;
    }
  }

  if (!dialogOpened) {
    throw new Error('Không thể mở khung Tạo bài viết trong Nhóm Facebook này (có thể nhóm yêu cầu duyệt tham gia hoặc không cho đăng)');
  }

  console.log('[PostGroup] Đã mở popup tạo bài viết thành công.');
  await safeWait(page, 1500);

  // Bước 3: Nhập Caption nếu có
  if (caption && caption.trim()) {
    await fillPostCaption(page, caption);
    await safeWait(page, 1000);
  }

  // Bước 4: Đính kèm Media (Video)
  if (mediaPath && fs.existsSync(mediaPath)) {
    console.log(`[PostGroup] Đang tải file video lên: ${mediaPath}`);
    const dialog = page.locator('[role="dialog"]').last();

    let uploaded = false;

    // Cách 1: Thử tìm input[type="file"] đã có sẵn trong DOM
    const existingInputs = page.locator('input[type="file"]');
    const existCount = await existingInputs.count().catch(() => 0);
    if (existCount > 0) {
      for (let i = existCount - 1; i >= 0; i--) {
        try {
          await existingInputs.nth(i).setInputFiles(mediaPath);
          uploaded = true;
          console.log(`[PostGroup] ✅ Đã gắn video qua input[type="file"] có sẵn (thứ ${i + 1})`);
          break;
        } catch (e) {}
      }
    }

    // Cách 2: Nếu chưa có input file, tìm và bấm nút "Ảnh/video" để Facebook mở khung upload
    if (!uploaded) {
      console.log('[PostGroup] Đang tìm và bấm nút "Ảnh/video" để mở khung upload...');
      const attachButtons = [
        '[role="dialog"] [aria-label="Ảnh/video"]',
        '[role="dialog"] [aria-label="Photo/video"]',
        '[role="dialog"] [aria-label="Ảnh/Video"]',
        '[role="dialog"] [aria-label="Photo/Video"]',
        '[role="dialog"] [aria-label*="Ảnh"]',
        '[role="dialog"] [aria-label*="Photo"]',
        '[role="dialog"] [aria-label*="Thêm vào bài viết"] [role="button"]',
        '[role="dialog"] [aria-label*="Add to your post"] [role="button"]',
        '[role="dialog"] [role="button"]:has-text("Ảnh/video")',
        '[role="dialog"] [role="button"]:has-text("Photo/video")',
        '[role="dialog"] [role="button"]:has-text("Ảnh/Video")',
        '[role="dialog"] [role="button"]:has-text("Photo/Video")'
      ];

      let btnClicked = false;
      for (const sel of attachButtons) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
          try {
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await safeWait(page, 400);
            await btn.click({ timeout: 5000, force: true });
            btnClicked = true;
            console.log(`[PostGroup] Đã nhấp nút Ảnh/video qua selector: ${sel}`);
            break;
          } catch (e) {}
        }
      }

      // Fallback click bằng DOM evaluate nếu các selector trên chưa bắt được
      if (!btnClicked) {
        btnClicked = await page.evaluate(() => {
          const dialogs = document.querySelectorAll('[role="dialog"]');
          const d = dialogs[dialogs.length - 1];
          if (!d) return false;

          // Tìm thanh "Thêm vào bài viết của bạn" và bấm icon đầu tiên
          const addBars = Array.from(d.querySelectorAll('*')).filter(el => {
            const lbl = (el.getAttribute('aria-label') || '').toLowerCase();
            const txt = (el.textContent || '').toLowerCase();
            return lbl.includes('thêm vào bài viết') || lbl.includes('add to your post') || txt.includes('thêm vào bài viết') || txt.includes('add to your post');
          });

          for (const bar of addBars) {
            const firstBtn = bar.querySelector('[role="button"], div[tabindex="0"]');
            if (firstBtn) {
              firstBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
              firstBtn.click();
              return true;
            }
          }

          // Tìm bất kỳ nút nào có aria-label chứa ảnh/photo
          const allBtns = Array.from(d.querySelectorAll('[role="button"], div[tabindex="0"], div[aria-label]'));
          const photoBtn = allBtns.find(el => {
            const lbl = (el.getAttribute('aria-label') || '').toLowerCase();
            const txt = (el.textContent || '').toLowerCase();
            return (lbl.includes('ảnh') || lbl.includes('photo') || txt.includes('ảnh/video') || txt.includes('photo/video')) && !txt.includes('tạo bài viết');
          });

          if (photoBtn) {
            photoBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
            photoBtn.click();
            return true;
          }
          return false;
        }).catch(() => false);
        if (btnClicked) console.log('[PostGroup] Đã nhấp nút Ảnh/video qua DOM evaluate');
      }

      await safeWait(page, 1500);

      // Sau khi bấm Ảnh/video, Facebook chèn input[type="file"] vào popup. Kiểm tra và tải file lên:
      const postClickInputs = page.locator('[role="dialog"] input[type="file"], input[type="file"]');
      const pCount = await postClickInputs.count().catch(() => 0);
      console.log(`[PostGroup] Tìm thấy ${pCount} input[type="file"] sau khi mở khung upload`);
      if (pCount > 0) {
        for (let i = pCount - 1; i >= 0; i--) {
          try {
            await postClickInputs.nth(i).setInputFiles(mediaPath);
            uploaded = true;
            console.log(`[PostGroup] ✅ Đã tải file video vào input[type="file"] thứ ${i + 1}`);
            break;
          } catch (e) {
            console.warn(`[PostGroup] Thử input[${i}] lỗi:`, e.message);
          }
        }
      }

      // Cách 3: Nếu vẫn chưa được, bấm trực tiếp vào vùng dropzone ("Thêm ảnh/video")
      if (!uploaded) {
        console.log('[PostGroup] Thử nhấp vào vùng dropzone...');
        const dropzones = [
          dialog.locator('text=/Thêm ảnh\\/video|Add Photos\\/Videos|Thêm ảnh|Add Photos|Kéo thả|Drag.*drop/i').first(),
          dialog.locator('[role="button"]:has-text("Thêm")').first(),
          dialog.locator('[role="button"]:has-text("Add")').first()
        ];
        for (const dz of dropzones) {
          if (await dz.isVisible().catch(() => false)) {
            try {
              const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null);
              await dz.click({ timeout: 4000, force: true });
              const fc = await fileChooserPromise;
              if (fc) {
                await fc.setFiles(mediaPath);
                uploaded = true;
                console.log('[PostGroup] ✅ Đã gắn video qua FileChooser của dropzone');
                break;
              }
              const lastInputs = page.locator('input[type="file"]');
              if ((await lastInputs.count().catch(() => 0)) > 0) {
                await lastInputs.last().setInputFiles(mediaPath);
                uploaded = true;
                console.log('[PostGroup] ✅ Đã gắn video qua input[type="file"] sau khi nhấp dropzone');
                break;
              }
            } catch (e) {}
          }
        }
      }
    }

    if (!uploaded) {
      throw new Error('Không thể tải file video vào bài viết Facebook. Vui lòng kiểm tra lại định dạng video.');
    }

    console.log('[PostGroup] Đang đợi Facebook tải xong và xử lý video...');
    await page.waitForFunction(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return false;
      const media = d.querySelectorAll('img[src^="blob:"], video, [style*="blob:"], [role="progressbar"]');
      return media.length > 0;
    }, { timeout: 35000 }).catch(() => {});

    await safeWait(page, 4000);

    // Bước 4.5: Kiểm tra và đảm bảo Caption đã xuất hiện sau khi đính kèm video
    if (caption && caption.trim()) {
      const sampleCheck = caption.trim().substring(0, Math.min(caption.trim().length, 5));
      const hasCaptionAfterMedia = await page.evaluate((sample) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
          const rect = d.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200;
        });
        const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
        return d ? (d.innerText || d.textContent || '').includes(sample) : false;
      }, sampleCheck);

      if (!hasCaptionAfterMedia) {
        console.log('[PostGroup] ⚠️ Caption chưa có trong bài viết sau khi gắn video, tiến hành nhập vào ô bài viết...');
        await fillPostCaption(page, caption);
        await safeWait(page, 1500);
      } else {
        console.log('[PostGroup] ✅ Caption đã có trong bài viết sau khi gắn video.');
      }
    }
  }

  // Bước 5: Bấm nút "Đăng" / "Post"
  console.log('[PostGroup] Đang chờ nút Đăng sẵn sàng...');
  await page.waitForFunction(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d => {
      const rect = d.getBoundingClientRect();
      return rect.width > 200 && rect.height > 200;
    });
    const d = dialogs[dialogs.length - 1] || document.querySelector('[role="dialog"]');
    if (!d) return false;
    const btns = Array.from(d.querySelectorAll('[role="button"], button'));
    const postBtn = btns.find(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      const aria = (b.getAttribute('aria-label') || '').toLowerCase();
      return txt === 'đăng' || txt === 'post' || aria === 'đăng' || aria === 'post';
    });
    if (!postBtn) return false;
    const ariaDisabled = postBtn.getAttribute('aria-disabled');
    const disabled = postBtn.hasAttribute('disabled');
    return ariaDisabled !== 'true' && !disabled;
  }, { timeout: 45000 }).catch(() => {
    console.log('[PostGroup] Đã hết thời gian chờ nút Đăng enabled, sẽ tiến hành click trực tiếp...');
  });

  const postBtnSelectors = [
    '[role="dialog"] [aria-label="Đăng"]',
    '[role="dialog"] [aria-label="Post"]',
    '[role="dialog"] button:has-text("Đăng")',
    '[role="dialog"] button:has-text("Post")',
    '[role="dialog"] [role="button"]:has-text("Đăng")',
    '[role="dialog"] [role="button"]:has-text("Post")'
  ];

  let postClicked = false;
  for (const sel of postBtnSelectors) {
    const btn = page.locator(sel).last();
    if (await btn.isVisible().catch(() => false)) {
      try {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await safeWait(page, 500);
        await btn.click({ timeout: 8000, force: true });
        postClicked = true;
        console.log(`[PostGroup] Đã bấm nút Đăng qua selector: ${sel}`);
        break;
      } catch (e) {}
    }
  }

  if (!postClicked) {
    // Fallback bấm nút Đăng qua evaluate
    postClicked = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      const d = dialogs[dialogs.length - 1];
      if (!d) return false;
      const btns = Array.from(d.querySelectorAll('[role="button"], button'));
      const postBtn = btns.reverse().find(b => {
        const txt = (b.textContent || '').trim().toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        return txt === 'đăng' || txt === 'post' || aria === 'đăng' || aria === 'post';
      });
      if (postBtn) {
        postBtn.click();
        return true;
      }
      return false;
    }).catch(() => false);
  }

  if (!postClicked) {
    throw new Error('Không tìm thấy hoặc không thể bấm nút "Đăng" trong popup bài viết');
  }

  console.log('[PostGroup] Đang đợi bài viết được đăng hoàn tất...');
  await page.waitForFunction(() => {
    return document.querySelectorAll('[role="dialog"]').length === 0;
  }, { timeout: 35000 }).catch(() => {
    console.log('[PostGroup] Popup chưa đóng sau 35s, nhưng lệnh Đăng đã được gửi.');
  });

  await safeWait(page, 5000);

  await logHistory(profileId, 'POST_GROUP', url, `Đã đăng video lên Group thành công: ${caption ? caption.substring(0, 40) : 'Video'}`);
  console.log(`[PostGroup] ✅ Đăng bài lên Group thành công cho profile: ${profileId}`);
}

module.exports = {
  taskFbFarmReels,
  taskFbAutoInteract,
  taskFbAddFriendsGroup,
  taskFbInviteToGroup,
  taskFbBuffPost,
  taskFbPostGroup,
  generateAIComment
};
