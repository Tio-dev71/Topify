const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // load .env from root

async function safeWait(page, ms) {
  await page.waitForTimeout(ms);
}

async function humanType(page, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * 40) + 20 });
    if (Math.random() > 0.9) await safeWait(page, Math.floor(Math.random() * 150) + 50);
  }
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
    const likeHandle = await page.evaluateHandle(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      const likes = Array.from(document.querySelectorAll('div[aria-label="Thích"], div[aria-label="Like"], div[aria-label="Bày tỏ cảm xúc"], div[aria-label="Thích bài viết"]')).filter(isVisible);
      const validLikes = likes.filter(el => !el.closest('[data-topify-liked="true"]'));
      if (validLikes.length > 0) {
        const target = validLikes[Math.floor(Math.random() * validLikes.length)];
        const container = target.closest('div[role="article"], div[data-pagelet^="FeedUnit"]') || target;
        container.setAttribute('data-topify-liked', 'true');
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
    
    const commentResult = await page.evaluateHandle(() => {
      if (!window._topifyCommented) window._topifyCommented = new Set();
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      
      let allBtns = Array.from(document.querySelectorAll('div[role="button"], a, span'));
      let commentBtn = allBtns.find(el => {
        if (!isVisible(el)) return false;
        if (el.closest('[data-topify-commented="true"]')) return false;
        let text = (el.innerText || '').toLowerCase();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase();
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

      await page.evaluate(() => {
        const box = document.querySelector('form[action*="/comment/"] textarea, form div[contenteditable="true"], div[aria-label="Viết bình luận"], div[aria-label="Write a comment"]');
        if (box) box.focus();
      });

      await humanType(page, finalComment);
      await safeWait(page, 500);
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

    const reelHandle = await page.evaluateHandle(() => {
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

    const reelHandle = await page.evaluateHandle((index) => {
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
  const targetUrl = config.targetUrl || 'https://www.facebook.com/';
  console.log(`Farming feed at ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await safeWait(page, 4000);

  await page.evaluate(() => { window._topifyCommented = new Set(); });

  for (let i = 0; i < config.actionCount; i++) {
    if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
    console.log(`Scrolling feed ${i + 1}/${config.actionCount}`);
    await humanScroll(page, config, 2);
    await randomInteract(page, config, profileId, 0.4);
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

  const joinHandle = await page.evaluateHandle(() => {
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

      const isValid = await btn.evaluate(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) return false;
        let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
        let text = (el.innerText || '').toLowerCase().trim();
        return aria.includes('thêm bạn bè') || aria.includes('add friend') || text.includes('thêm bạn bè') || text.includes('add friend');
      });

      if (isValid) {
        try {
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

  const joinHandle = await page.evaluateHandle(() => {
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

  const inviteHandle = await page.evaluateHandle(() => {
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

    const subBtnHandle = await page.evaluateHandle(() => {
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

        const canCheck = await cb.evaluate(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) return false;
          const ariaChecked = el.getAttribute('aria-checked');
          if (ariaChecked === 'true') return false;
          if (el.tagName.toLowerCase() === 'input' && el.checked) return false;
          return true;
        });

        if (canCheck) {
          try {
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

    const sendBtnHandle = await page.evaluateHandle(() => {
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

    if (sent) console.log(`Sent invites for batch of ${invitedCount}.`);
    else {
      console.log('Could not find Send button, closing dialog via escape');
      await page.keyboard.press('Escape');
    }
    await safeWait(page, 3000);
  } else {
    console.log('Could not find the Invite button on the group page');
  }
}

async function taskFbBuffPost(page, config, profileId) {
  if (!config.targetUrl) throw new Error('Target URL is required for buff post task');
  if (config.checkStop && config.checkStop()) throw new Error('Task stopped by user');
  console.log(`Buffing post: ${config.targetUrl}`);
  await page.goto(config.targetUrl, { waitUntil: 'domcontentloaded' });
  await safeWait(page, 3000 + Math.random() * 2000);

  // Pause videos to prevent auto-scrolling to next Reel
  await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      try { v.pause(); } catch(e) {}
    });
  });

  // Đóng các popup che khuất màn hình
  await page.evaluate(() => {
    try {
      const closeSelectors = [
        'div[aria-label="Lúc khác"]', 'div[aria-label="Not Now"]',
        'div[aria-label="Đóng vòng kết nối"]', 'div[aria-label="Close"]', 'div[aria-label="Đóng"]'
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
        if (text === 'Lúc khác' || text === 'Not Now' || text === 'Đóng') {
           if (span.getBoundingClientRect().width > 0) span.click();
        }
      }
    } catch(e) {}
  });
  await safeWait(page, 2000);

  const buffActionType = config.buffActionType || 'LIKE';

  if (buffActionType === 'LIKE') {
    console.log('Liking post...');
    const likeResult = await page.evaluateHandle(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      const dialog = document.querySelector('div[role="dialog"]');
      const container = dialog || document;
      const likeSelectors = [
        '[aria-label="Thích"]', '[aria-label="Like"]',
        '[aria-label="Bày tỏ cảm xúc"]', '[aria-label="Thích bài viết"]',
        '[aria-label="Tỏ thái độ thích"]', 'div[data-testid="UFI2ReactionLink"]'
      ];
      let likes = Array.from(container.querySelectorAll(likeSelectors.join(', '))).filter(isVisible);
      if (likes.length === 0) {
        likes = Array.from(document.querySelectorAll(likeSelectors.join(', '))).filter(isVisible);
      }
      
      let isAlreadyLiked = likes.some(el => {
        let text = (el.innerText || '').toLowerCase();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase();
        return aria.includes('gỡ') || aria.includes('remove') || text.includes('đã thích');
      });

      let validLike = likes.find(el => {
        let text = (el.innerText || '').toLowerCase();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase();
        return !aria.includes('gỡ') && !aria.includes('remove') && !text.includes('đã thích');
      });
      return { element: validLike || (likes.length > 0 ? likes[0] : null), isAlreadyLiked };
    });

    const likeData = await likeResult.jsonValue();
    const likeElHandle = await likeResult.evaluateHandle(r => r.element);
    const likeEl = likeElHandle.asElement();
    
    let clicked = false;
    
    if (likeData && likeData.isAlreadyLiked) {
       console.log('Post is already liked.');
       clicked = true;
       await logHistory(profileId, 'LIKE', config.targetUrl, 'Bài viết đã được thích từ trước');
    } else if (likeEl) {
      try {
        await likeEl.hover();
        await safeWait(page, 100);
        await likeEl.click({ timeout: 3000 });
        clicked = true;
        await logHistory(profileId, 'LIKE', config.targetUrl, 'Đã thích bài viết');
      } catch(e) {
        try {
          await likeEl.evaluate(el => el.click());
          clicked = true;
          await logHistory(profileId, 'LIKE', config.targetUrl, 'Đã thích bài viết (fallback)');
        } catch(e2) {
          console.error('Failed to click LIKE fallback', e2);
        }
      }
    }
    await likeElHandle.dispose();
    await likeResult.dispose();
    
    if (!clicked) {
      throw new Error('Không tìm thấy nút Thích hoặc không thể tương tác');
    }
    
    await safeWait(page, 3000);
  } else if (buffActionType === 'COMMENT') {
    console.log('Commenting on post...');
    const commentResult = await page.evaluateHandle(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      
      const dialog = document.querySelector('div[role="dialog"]');
      const container = dialog || document;
      let allBtns = Array.from(container.querySelectorAll('div[role="button"], a, span'));
      if (allBtns.length < 5) allBtns = Array.from(document.querySelectorAll('div[role="button"], a, span'));
      
      let commentBtn = allBtns.find(el => {
        if (!isVisible(el)) return false;
        let text = (el.innerText || '').toLowerCase().trim();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
        return aria.includes('bình luận') || aria.includes('comment') || aria.includes('viết bình luận') ||
               text === 'bình luận' || text === 'comment';
      });

      let text = '';
      if (commentBtn) {
        try {
          let commentContainer = commentBtn.closest('div[role="article"], div[data-pagelet^="FeedUnit"], div[data-pagelet^="GroupFeed"], div[aria-posinset]');
          if (commentContainer) {
            const messageBlock = commentContainer.querySelector('div[data-ad-preview="message"]');
            if (messageBlock) {
              text = messageBlock.innerText;
            }
          }
        } catch(e) {}
        const target = commentBtn.closest('[role="button"]') || commentBtn;
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
        await safeWait(page, 100);
        await commentEl.click({ timeout: 3000 });
        clicked = true;
      } catch(e) {
        try {
          await commentEl.evaluate(el => el.click());
          clicked = true;
        } catch(e2) {}
      }
    }
    await commentElHandle.dispose();
    await commentResult.dispose();

    if (!clicked) {
      throw new Error('Không tìm thấy nút Bình luận hoặc không thể tương tác');
    }

    if (clicked) {
      await safeWait(page, 3000);

      let finalComment = (config.comments && config.comments.length > 0) 
          ? config.comments[Math.floor(Math.random() * config.comments.length)]
          : 'Hay quá ạ!';
          
      try {
        if (config.useAiComment && postText && postText.trim().length > 10) {
          console.log('Generating AI comment for buff post...');
          const aiText = await generateAIComment(postText, config.aiSettings || {});
          if (aiText) finalComment = aiText;
        }
      } catch (e) {
        console.log('AI Comment failed for buff post, using fallback.', e);
      }

      console.log('Sending comment: ' + finalComment);
      await page.evaluate(() => {
        const box = document.querySelector('form[action*="/comment/"] textarea, form div[contenteditable="true"], div[aria-label="Viết bình luận"], div[aria-label="Write a comment"], div[aria-label*="bình luận"][role="textbox"], div[aria-label*="comment"][role="textbox"]');
        if (box) box.focus();
      });
      await safeWait(page, 500);
      await humanType(page, finalComment);
      await safeWait(page, 1000);
      await page.keyboard.press('Enter');
      await safeWait(page, 2000);
      await logHistory(profileId, 'COMMENT', config.targetUrl, finalComment);
    }
  } else if (buffActionType === 'SHARE') {
    console.log('Sharing post...');
    const shareHandle = await page.evaluateHandle(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      }
      const dialog = document.querySelector('div[role="dialog"]');
      const container = dialog || document;
      let allBtns = Array.from(container.querySelectorAll('div[role="button"], a, span'));
      if (allBtns.length < 5) allBtns = Array.from(document.querySelectorAll('div[role="button"], a, span'));
      
      let shareBtn = allBtns.find(el => {
        if (!isVisible(el)) return false;
        let text = (el.innerText || '').toLowerCase().trim();
        let aria = (el.getAttribute('aria-label') || '').toLowerCase().trim();
        return aria.includes('chia sẻ') || aria.includes('share') || text === 'chia sẻ' || text === 'share';
      });
      if (shareBtn) {
        return shareBtn.closest('[role="button"]') || shareBtn;
      }
      return null;
    });

    const shareEl = shareHandle.asElement();
    let clickedShare = false;
    if (shareEl) {
      try {
        await shareEl.hover();
        await safeWait(page, 100);
        await shareEl.click({ timeout: 3000 });
        clickedShare = true;
      } catch(e) {
        try {
          await shareEl.evaluate(el => el.click());
          clickedShare = true;
        } catch(e2) {}
      }
    }
    await shareHandle.dispose();

    if (!clickedShare) {
      throw new Error('Không tìm thấy nút Chia sẻ hoặc không thể tương tác');
    }

    if (clickedShare) {
      await safeWait(page, 2000);
      
      const shareNowHandle = await page.evaluateHandle(() => {
        let options = Array.from(document.querySelectorAll('div[role="menuitem"], div[role="button"], span'));
        let shareNow = options.find(el => {
          let text = (el.innerText || '').toLowerCase();
          return text.includes('chia sẻ ngay') || text.includes('share now');
        });
        if (shareNow) {
          return shareNow.closest('[role="menuitem"], [role="button"]') || shareNow;
        }
        return null;
      });

      const shareNowEl = shareNowHandle.asElement();
      if (shareNowEl) {
        try {
          await shareNowEl.hover();
          await safeWait(page, 100);
          await shareNowEl.click({ timeout: 3000 });
          await logHistory(profileId, 'SHARE', config.targetUrl, 'Đã chia sẻ bài viết');
        } catch(e) {
          try {
            await shareNowEl.evaluate(el => el.click());
            await logHistory(profileId, 'SHARE', config.targetUrl, 'Đã chia sẻ bài viết (fallback)');
          } catch(e2) {}
        }
      } else {
        console.log('Share now button not found, trying fallback');
      }
      await shareNowHandle.dispose();
      await safeWait(page, 3000);
    }
  }
}

module.exports = {
  taskFbFarmReels,
  taskFbAutoInteract,
  taskFbAddFriendsGroup,
  taskFbInviteToGroup,
  taskFbBuffPost,
  generateAIComment
};
