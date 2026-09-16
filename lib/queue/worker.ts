import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getPublisher } from '../publishers';

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
        provider: providerMap[postPlatform.platform] as any,
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

      let result: any;
      if (post.postType === 'FEED' || post.postType === 'ARTICLE') {
        result = await publisher.publishFeed(postForPlatform as any, post.videoAsset, socialAccount, postPlatform);
      } else if (post.postType === 'CAROUSEL') {
        const assets = post.videoAsset ? [post.videoAsset] : [];
        result = await publisher.publishCarousel(postForPlatform as any, assets, socialAccount, postPlatform);
      } else {
        if (!post.videoAsset) {
          throw new Error('Reel post requires a video asset');
        }
        result = await publisher.publishReel(postForPlatform as any, post.videoAsset, socialAccount, postPlatform);
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
    } catch (error: any) {
      await prisma.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      await prisma.publishLog.create({
        data: {
          postId,
          platform: postPlatform.platform,
          level: 'ERROR',
          message: `Unexpected error: ${error.message}`,
          metadata: { stack: error.stack },
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

async function processTokenMonitorJob(job: Job) {
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
      } catch (err: any) {
        console.error(`❌ Failed to refresh token for ${acc.id}:`, err.message);
      }
    }
  }
}

export function startWorker() {
  const publishWorker = new Worker('publish-reel', processPublishJob, {
    connection: connection as any,
    concurrency: 2,
  });

  publishWorker.on('completed', (job) => {
    console.log(`✅ Publish Job ${job.id} completed`);
  });

  publishWorker.on('failed', (job, err) => {
    console.error(`❌ Publish Job ${job?.id} failed:`, err.message);
  });

  const tokenWorker = new Worker('token-monitor', processTokenMonitorJob, {
    connection: connection as any,
    concurrency: 1,
  });

  tokenWorker.on('completed', (job) => {
    console.log(`✅ Token Monitor Job ${job.id} completed`);
  });

  console.log('🔄 BullMQ workers started (publish-reel, token-monitor)');
  return { publishWorker, tokenWorker };
}
