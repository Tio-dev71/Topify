import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getPublisher } from '../publishers';
import { scheduleTokenMonitor, scheduleKeywordScraper } from './index';
import { getKeywordInsights, getFacebookPagePosts, getRealTimeNews } from '../rapidapi/client';

const prisma = new PrismaClient();

console.log("=== WORKER INIT ===");
console.log("CWD:", process.cwd());
console.log("REDIS_URL defined?", !!process.env.REDIS_URL);
if (process.env.REDIS_URL) {
  console.log("REDIS_URL starts with:", process.env.REDIS_URL.substring(0, 10));
}

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

async function processPublishJob(job: Job<{ postId: string }>) {
  const { postId } = job.data;
  console.log(`🚀 Processing publish job for post: ${postId}`);

  // Get post with all relations
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      videoAsset: true,
      platforms: true,
      createdBy: {
        include: {
          socialAccounts: true,
        },
      },
    },
  });

  if (!post) {
    throw new Error(`Post not found: ${postId}`);
  }

  // Update post status to PUBLISHING
  await prisma.post.update({
    where: { id: postId },
    data: { status: 'PUBLISHING' },
  });

  let allSuccess = true;
  let anySuccess = false;

  // Process each platform
  for (const postPlatform of post.platforms) {
    // Update platform status
    await prisma.postPlatform.update({
      where: { id: postPlatform.id },
      data: { status: 'PUBLISHING' },
    });

    // Log start
    await prisma.publishLog.create({
      data: {
        postId,
        platform: postPlatform.platform,
        level: 'INFO',
        message: `Starting publish to ${postPlatform.platform}`,
      },
    });

    // Find matching social account (using ADMIN's connected account)
    const providerMap: Record<string, string> = {
      FACEBOOK_REELS: 'META',
      INSTAGRAM_REELS: 'META',
      YOUTUBE_SHORTS: 'YOUTUBE',
      TIKTOK_VIDEO: 'TIKTOK',
      ZALO_VIDEO: 'ZALO',
    };
    
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        workspaceId: post.workspaceId,
        provider: providerMap[postPlatform.platform] as never,
      },
    });

    if (!socialAccount) {
      await prisma.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: `No ${providerMap[postPlatform.platform]} account connected`,
        },
      });
      await prisma.publishLog.create({
        data: {
          postId,
          platform: postPlatform.platform,
          level: 'ERROR',
          message: `No ${providerMap[postPlatform.platform]} account connected. Please connect your account in Settings.`,
        },
      });
      allSuccess = false;
      continue;
    }

    // Publish
    try {
      const publisher = getPublisher(postPlatform.platform);
      
      const postForPlatform = {
        ...post,
        title: postPlatform.customTitle || post.title,
        caption: postPlatform.customCaption || post.caption,
        firstComment: postPlatform.customFirstComment || post.firstComment,
      };

      let result: PublishResult;
      if (post.postType === 'FEED' || post.postType === 'ARTICLE') {
        result = await publisher.publishFeed(postForPlatform as Post, post.videoAsset, socialAccount, postPlatform);
      } else if (post.postType === 'CAROUSEL') {
        const assets = post.videoAsset ? [post.videoAsset] : [];
        result = await publisher.publishCarousel(postForPlatform as Post, assets, socialAccount, postPlatform);
      } else {
        if (!post.videoAsset) {
          throw new Error('Reel post requires a video asset');
        }
        result = await publisher.publishReel(postForPlatform as Post, post.videoAsset, socialAccount, postPlatform);
      }

      // Handle token expiration/auth errors
      if (!result.success && (result.errorMessage?.toLowerCase().includes('token') || result.errorMessage?.toLowerCase().includes('auth'))) {
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { status: 'DISCONNECTED' }
        });
      }

      if (result.success) {
        await prisma.postPlatform.update({
          where: { id: postPlatform.id },
          data: {
            status: 'PUBLISHED',
            externalPostId: result.externalPostId,
          },
        });
        await prisma.publishLog.create({
          data: {
            postId,
            platform: postPlatform.platform,
            level: 'INFO',
            message: `Successfully published to ${postPlatform.platform}`,
            metadata: { externalPostId: result.externalPostId },
          },
        });
        anySuccess = true;
      } else {
        await prisma.postPlatform.update({
          where: { id: postPlatform.id },
          data: {
            status: 'FAILED',
            errorMessage: result.errorMessage,
          },
        });
        await prisma.publishLog.create({
          data: {
            postId,
            platform: postPlatform.platform,
            level: 'ERROR',
            message: result.errorMessage || 'Unknown error',
          },
        });
        allSuccess = false;
      }
    } catch (error: unknown) {
      await prisma.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      await prisma.publishLog.create({
        data: {
          postId,
          platform: postPlatform.platform,
          level: 'ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          metadata: { stack: error instanceof Error ? error.stack : undefined },
        },
      });
      allSuccess = false;
    }
  }

  // Update final post status
  let finalStatus: 'PUBLISHED' | 'FAILED' | 'PARTIAL_FAILED';
  if (allSuccess) {
    finalStatus = 'PUBLISHED';
  } else if (anySuccess) {
    finalStatus = 'PARTIAL_FAILED';
  } else {
    finalStatus = 'FAILED';
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: finalStatus,
      publishedAt: anySuccess ? new Date() : undefined,
    },
  });

  console.log(`📋 Post ${postId} final status: ${finalStatus}`);
}

async function processTokenMonitorJob(_job: Job) {
  console.log(`🔍 Checking token expirations...`);
  // Find accounts expiring in less than 7 days, or already expired
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringAccounts = await prisma.socialAccount.findMany({
    where: {
      status: 'CONNECTED',
      expiresAt: {
        lte: sevenDaysFromNow,
      }
    }
  });

  for (const acc of expiringAccounts) {
    console.log(`⚠️ Account ${acc.id} (${acc.provider}) is expiring soon.`);
    if (acc.expiresAt && acc.expiresAt < new Date()) {
      await prisma.socialAccount.update({
        where: { id: acc.id },
        data: { status: 'EXPIRED' }
      });
      console.log(`❌ Account ${acc.id} marked as EXPIRED.`);
    } else {
      console.log(`🔄 Call API to refresh token for ${acc.id}...`);
      try {
        let newAccessToken = acc.accessToken;
        let newExpiresAt = acc.expiresAt;

        if (acc.provider === 'META') {
          // Meta long-lived token refresh
          const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
          const clientSecret = process.env.FACEBOOK_APP_SECRET;
          if (clientId && clientSecret) {
            const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${acc.accessToken}`);
            const data = await res.json();
            if (data.access_token) {
              newAccessToken = data.access_token;
              newExpiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null;
            }
          }
        } else if (acc.provider === 'TIKTOK') {
          // TikTok token refresh
          const clientKey = process.env.TIKTOK_CLIENT_KEY;
          const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
          if (clientKey && clientSecret && acc.refreshToken) {
            const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: acc.refreshToken,
              })
            });
            const data = await res.json();
            if (data.access_token) {
              newAccessToken = data.access_token;
              newExpiresAt = new Date(Date.now() + data.expires_in * 1000);
            }
          }
        } else if (acc.provider === 'ZALO') {
           // Zalo token refresh
           const appId = process.env.ZALO_APP_ID;
           const secretKey = process.env.ZALO_APP_SECRET;
           if (appId && secretKey && acc.refreshToken) {
             const res = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/x-www-form-urlencoded',
                 'secret_key': secretKey
               },
               body: new URLSearchParams({
                 app_id: appId,
                 grant_type: 'refresh_token',
                 refresh_token: acc.refreshToken
               })
             });
             const data = await res.json();
             if (data.access_token) {
               newAccessToken = data.access_token;
               newExpiresAt = new Date(Date.now() + parseInt(data.expires_in) * 1000);
             }
           }
        }
        
        await prisma.socialAccount.update({
          where: { id: acc.id },
          data: {
             accessToken: newAccessToken,
             expiresAt: newExpiresAt
          }
        });
        console.log(`✅ Token for ${acc.id} refreshed successfully.`);
      } catch (err: unknown) {
        console.error(`❌ Failed to refresh token for ${acc.id}:`, err instanceof Error ? err.message : String(err));
      }
    }
  }
}

async function processKeywordScraperJob(_job: Job) {
  console.log(`🔍 [CRON 24H] Bắt đầu chu kỳ tự động cào dữ liệu: Từ khóa, Cảnh báo & Đối thủ...`);
  
  // 1. Quét và cập nhật Từ khóa (Keyword Insights)
  try {
    const keywords = await prisma.keywordTracker.findMany();
    console.log(`🤖 Đang xử lý ${keywords.length} từ khóa theo dõi...`);
    
    for (const kw of keywords) {
      try {
        console.log(`  -> Quét insight từ khóa: "${kw.keyword}"`);
        const rawData = await getKeywordInsights(kw.keyword);
        
        let volume = 0;
        let trend = 'FLAT';
        
        if (Array.isArray(rawData) && rawData.length > 0) {
          const match = rawData.find(item => item.text?.toLowerCase() === kw.keyword.toLowerCase()) || rawData[0];
          volume = match.volume || match.search_volume || 0;
          if (match.trend !== undefined && match.trend !== null) {
            const t = parseFloat(match.trend);
            if (t > 0) trend = 'UP';
            else if (t < 0) trend = 'DOWN';
          }
        }

        await prisma.keywordTracker.update({
          where: { id: kw.id },
          data: { volume, trend }
        });

        // 2. Đồng thời quét tin tức cảnh báo (Mention Alerts) theo từ khóa này
        try {
          const newsRes = await getRealTimeNews(kw.keyword);
          const newsList = newsRes?.data || [];
          for (const item of newsList.slice(0, 5)) { // lấy tối đa 5 tin mới nhất mỗi từ khóa
            const sourceUrl = item.link || item.url;
            if (!sourceUrl) continue;

            const existing = await prisma.mentionAlert.findFirst({ where: { sourceUrl } });
            if (!existing) {
              await prisma.mentionAlert.create({
                data: {
                  title: item.title || 'Tin mới',
                  message: item.snippet || item.description || '',
                  sourceUrl,
                  keyword: kw.keyword,
                  workspaceId: kw.workspaceId,
                }
              });
            }
          }
        } catch (newsErr) {
          console.error(`  ⚠️ Lỗi quét cảnh báo cho từ khóa ${kw.keyword}:`, newsErr);
        }
      } catch (err) {
        console.error(`  ⚠️ Lỗi khi cào dữ liệu từ khóa ${kw.keyword}:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Lỗi xử lý khối từ khóa:', err);
  }

  // 3. Quét bài viết mới của các Fanpage Đối thủ
  try {
    const competitorPages = await prisma.competitorPage.findMany();
    console.log(`🤖 Đang quét bài viết mới cho ${competitorPages.length} fanpage đối thủ...`);
    
    for (const page of competitorPages) {
      try {
        console.log(`  -> Quét Fanpage: ${page.name || page.url}`);
        const rawPosts = await getFacebookPagePosts(page.url);
        const posts = rawPosts?.results || rawPosts?.data || rawPosts?.posts || [];

        for (const item of posts.slice(0, 10)) {
          const externalId = (item.id || item.post_id || '').toString();
          if (!externalId) continue;

          const content = item.text || item.content || item.description || item.message || null;
          const mediaUrl = item.video_url || item.image_url || item.media || item.video || item.image || null;
          const likesCount = parseInt(item.likes || item.reactions || item.reactions_count || '0', 10);
          const commentsCount = parseInt(item.comments || item.comments_count || '0', 10);
          const sharesCount = parseInt(item.shares || item.reshare_count || '0', 10);

          let postedAtDate = new Date();
          let ts = item.created_time || item.time || item.timestamp;
          if (ts) {
            if (typeof ts === 'number' || (typeof ts === 'string' && /^\d+$/.test(ts))) {
              postedAtDate = new Date(parseInt(ts, 10) * 1000);
            } else {
              postedAtDate = new Date(ts);
            }
          }

          const existingPost = await prisma.competitorPost.findFirst({
            where: { pageId: page.id, externalId }
          });

          if (existingPost) {
            await prisma.competitorPost.update({
              where: { id: existingPost.id },
              data: {
                likesCount: isNaN(likesCount) ? 0 : likesCount,
                commentsCount: isNaN(commentsCount) ? 0 : commentsCount,
                sharesCount: isNaN(sharesCount) ? 0 : sharesCount,
                scrapedAt: new Date(),
              }
            });
          } else {
            await prisma.competitorPost.create({
              data: {
                pageId: page.id,
                externalId,
                content,
                mediaUrl,
                likesCount: isNaN(likesCount) ? 0 : likesCount,
                commentsCount: isNaN(commentsCount) ? 0 : commentsCount,
                sharesCount: isNaN(sharesCount) ? 0 : sharesCount,
                postedAt: postedAtDate,
              }
            });
          }
        }
      } catch (pageErr) {
        console.error(`  ⚠️ Lỗi khi cào bài viết cho fanpage ${page.url}:`, pageErr);
      }
    }
  } catch (err) {
    console.error('❌ Lỗi xử lý khối đối thủ:', err);
  }

  console.log(`✅ [CRON 24H] Hoàn thành chu kỳ tự động cào dữ liệu.`);
}

export function startWorker() {
  const publishWorker = new Worker('publish-reel', processPublishJob, {
    connection: connection as never,
    concurrency: 2,
  });

  publishWorker.on('completed', (job) => {
    console.log(`✅ Publish Job ${job.id} completed`);
  });

  publishWorker.on('failed', (job, err) => {
    console.error(`❌ Publish Job ${job?.id} failed:`, err.message);
  });

  const tokenWorker = new Worker('token-monitor', processTokenMonitorJob, {
    connection: connection as never,
    concurrency: 1,
  });

  tokenWorker.on('completed', (job) => {
    console.log(`✅ Token Monitor Job ${job.id} completed`);
  });

  const scraperWorker = new Worker('keyword-scraper', processKeywordScraperJob, {
    connection: connection as never,
    concurrency: 1,
  });

  scraperWorker.on('completed', (job) => {
    console.log(`✅ Keyword Scraper Job ${job.id} completed`);
  });

  console.log('🔄 BullMQ workers started (publish-reel, token-monitor, keyword-scraper)');
  
  // Schedule repeatable jobs
  scheduleTokenMonitor().catch(console.error);
  scheduleKeywordScraper().catch(console.error);

  return { publishWorker, tokenWorker, scraperWorker };
}
