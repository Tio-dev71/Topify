import { prisma } from '@/lib/db';
import { getPublisher } from '@/lib/publishers';
import type { Post, VideoAsset, SocialAccount, PostPlatform, Platform } from '@prisma/client';
import type { PublishResult } from '@/lib/publishers/types';

const providerMap: Record<string, string> = {
  FACEBOOK_REELS: 'META',
  FACEBOOK_POST: 'META',
  INSTAGRAM_REELS: 'META',
  INSTAGRAM_CAROUSEL: 'META',
  INSTAGRAM_STORY: 'META',
  YOUTUBE_SHORTS: 'YOUTUBE',
  TIKTOK_VIDEO: 'TIKTOK',
  ZALO_POST: 'ZALO',
  ZALO_ARTICLE: 'ZALO',
};

/**
 * Execute publishing for a specific post directly without relying on BullMQ/Redis.
 */
export async function publishPostDirectly(postId: string): Promise<{
  success: boolean;
  status: 'PUBLISHED' | 'PARTIAL_FAILED' | 'FAILED';
  error?: string;
}> {
  console.log(`🚀 [PublisherService] Bắt đầu xử lý đăng bài trực tiếp: ${postId}`);

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
    console.error(`❌ [PublisherService] Không tìm thấy bài viết: ${postId}`);
    return { success: false, status: 'FAILED', error: `Post not found: ${postId}` };
  }

  // Update post status to PUBLISHING
  await prisma.post.update({
    where: { id: postId },
    data: { status: 'PUBLISHING' },
  });

  let allSuccess = true;
  let anySuccess = false;

  for (const postPlatform of post.platforms) {
    // If already published in a previous attempt, skip re-publishing
    if (postPlatform.status === 'PUBLISHED') {
      anySuccess = true;
      continue;
    }

    await prisma.postPlatform.update({
      where: { id: postPlatform.id },
      data: { status: 'PUBLISHING', errorMessage: null },
    });

    await prisma.publishLog.create({
      data: {
        postId,
        platform: postPlatform.platform,
        level: 'INFO',
        message: `Bắt đầu xuất bản lên nền tảng ${postPlatform.platform}`,
      },
    });

    const provider = providerMap[postPlatform.platform] || 'META';

    // 1. Look up SocialAccount with fallback hierarchy
    let socialAccount: SocialAccount | null = null;

    if (post.workspaceId) {
      socialAccount = await prisma.socialAccount.findFirst({
        where: {
          workspaceId: post.workspaceId,
          provider: provider as never,
          status: 'CONNECTED',
        },
      });
    }

    if (!socialAccount) {
      socialAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: post.createdById,
          provider: provider as never,
          status: 'CONNECTED',
        },
      });
    }

    if (!socialAccount) {
      socialAccount = await prisma.socialAccount.findFirst({
        where: {
          provider: provider as never,
          OR: [
            ...(post.workspaceId ? [{ workspaceId: post.workspaceId }] : []),
            { userId: post.createdById },
          ],
        },
      });
    }

    // Mock fallback ONLY in explicit test environments
    if (!socialAccount && process.env.NODE_ENV === 'test' && process.env.USE_MOCK_PUBLISHERS === 'true') {
      socialAccount = {
        id: `mock-${provider.toLowerCase()}-${Date.now()}`,
        userId: post.createdById,
        workspaceId: post.workspaceId,
        provider: provider as never,
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        accountName: `Mock ${provider} Account`,
        pageId: 'mock_page_id',
        instagramBusinessId: 'mock_ig_id',
        youtubeChannelId: 'mock_yt_channel',
        telegramBotToken: null,
        telegramBotUsername: null,
        zaloOaId: null,
        webhookSecret: null,
        status: 'CONNECTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!socialAccount) {
      const errMsg = `Chưa kết nối tài khoản ${provider}. Vui lòng vào Cài đặt để liên kết tài khoản trước khi đăng bài.`;
      console.warn(`⚠️ [PublisherService] ${errMsg} (Post ${postId}, Platform: ${postPlatform.platform})`);

      await prisma.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: errMsg,
        },
      });

      await prisma.publishLog.create({
        data: {
          postId,
          platform: postPlatform.platform,
          level: 'ERROR',
          message: errMsg,
        },
      });

      allSuccess = false;
      continue;
    }

    // Execute platform publisher
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
          throw new Error('Đăng bài dạng Video/Reels yêu cầu phải có tệp video');
        }
        result = await publisher.publishReel(postForPlatform as Post, post.videoAsset, socialAccount, postPlatform);
      }

      // Handle token expiration/auth errors
      const isChannelMissing = result.errorMessage?.includes('youtubeSignupRequired') || result.errorMessage?.includes('chưa tạo Kênh YouTube');
      if (!result.success && !isChannelMissing && (result.errorMessage?.toLowerCase().includes('token') || result.errorMessage?.toLowerCase().includes('expired'))) {
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { status: 'DISCONNECTED' },
        }).catch(() => {});
      }

      if (result.success) {
        await prisma.postPlatform.update({
          where: { id: postPlatform.id },
          data: {
            status: 'PUBLISHED',
            externalPostId: result.externalPostId || `pub_${Date.now()}`,
          },
        });

        await prisma.publishLog.create({
          data: {
            postId,
            platform: postPlatform.platform,
            level: 'INFO',
            message: `Xuất bản thành công lên ${postPlatform.platform}`,
            metadata: { externalPostId: result.externalPostId },
          },
        });

        anySuccess = true;
      } else {
        await prisma.postPlatform.update({
          where: { id: postPlatform.id },
          data: {
            status: 'FAILED',
            errorMessage: result.errorMessage || 'Lỗi xuất bản không xác định',
          },
        });

        await prisma.publishLog.create({
          data: {
            postId,
            platform: postPlatform.platform,
            level: 'ERROR',
            message: result.errorMessage || 'Lỗi xuất bản không xác định',
          },
        });

        allSuccess = false;
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ [PublisherService] Lỗi ngoại lệ khi đăng lên ${postPlatform.platform}:`, error);

      await prisma.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: errMessage,
        },
      });

      await prisma.publishLog.create({
        data: {
          postId,
          platform: postPlatform.platform,
          level: 'ERROR',
          message: `Lỗi ngoại lệ: ${errMessage}`,
          metadata: { stack: error instanceof Error ? error.stack : undefined },
        },
      });

      allSuccess = false;
    }
  }

  // Final post status
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

  console.log(`✅ [PublisherService] Hoàn tất bài viết ${postId} với trạng thái: ${finalStatus}`);
  return { success: allSuccess, status: finalStatus };
}

/**
 * Check and publish all posts that are currently due.
 * Also rescues posts stuck in PUBLISHING with platforms PENDING.
 */
export async function checkAndPublishDuePosts(): Promise<{
  processedCount: number;
  results: Array<{ id: string; title: string; status: string }>;
}> {
  try {
    const now = new Date();
    // 1. Find scheduled posts that have reached scheduled time
    // 2. Also rescue posts that became stuck in PUBLISHING from past cron triggers
    const duePosts = await prisma.post.findMany({
      where: {
        OR: [
          {
            status: 'SCHEDULED',
            scheduledAt: {
              lte: now,
            },
          },
          {
            status: 'PUBLISHING',
            updatedAt: {
              lte: new Date(Date.now() - 60 * 1000), // stuck for > 1 min
            },
            platforms: {
              some: {
                status: 'PENDING',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    const results: Array<{ id: string; title: string; status: string }> = [];

    // 1. Process scheduled posts and rescue stuck publishing posts
    if (duePosts.length > 0) {
      console.log(`⏰ [SCHEDULE-CRON] Phát hiện ${duePosts.length} bài viết đến hạn cần xuất bản!`);

      for (const post of duePosts) {
        console.log(`⏰ [SCHEDULE-CRON] Đang kích hoạt đăng bài hẹn giờ: ${post.id} ("${post.title}")`);

        try {
          const res = await publishPostDirectly(post.id);
          results.push({
            id: post.id,
            title: post.title,
            status: res.status,
          });
        } catch (postErr: any) {
          console.error(`❌ [SCHEDULE-CRON] Lỗi khi xử lý bài hẹn giờ ${post.id}:`, postErr);
          results.push({
            id: post.id,
            title: post.title,
            status: 'ERROR: ' + postErr.message,
          });
        }
      }
    }

    // 2. Process Evergreen posts that have reached their recycling cycle (F083)
    try {
      const dueEvergreenCandidates = await prisma.post.findMany({
        where: {
          isEvergreen: true,
          status: 'PUBLISHED',
        },
        include: {
          platforms: true,
          media: true,
        },
        take: 20,
      });

      const nowMs = now.getTime();
      for (const egPost of dueEvergreenCandidates) {
        const referenceDate = egPost.lastRecycledAt
          ? new Date(egPost.lastRecycledAt).getTime()
          : (egPost.publishedAt ? new Date(egPost.publishedAt).getTime() : new Date(egPost.createdAt).getTime());

        const intervalDays = egPost.recycleIntervalDays || 30;
        const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

        if (nowMs - referenceDate >= intervalMs) {
          console.log(`♻️ [EVERGREEN-AUTO] Bài viết Evergreen ${egPost.id} ("${egPost.title}") đã đến chu kỳ ${intervalDays} ngày. Đang tự động tạo bài tái đăng mới...`);
          try {
            // Create the recycled child post
            const recycledPost = await prisma.post.create({
              data: {
                title: egPost.title,
                caption: egPost.caption,
                firstComment: egPost.firstComment,
                hashtags: egPost.hashtags,
                videoAssetId: egPost.videoAssetId,
                postType: egPost.postType,
                createdById: egPost.createdById,
                workspaceId: egPost.workspaceId,
                status: 'PUBLISHING',
                scheduledAt: now,
                originalPostId: egPost.id,
                isEvergreen: false,
                platforms: {
                  create: egPost.platforms.map((p) => ({
                    platform: p.platform,
                    status: 'PENDING',
                  })),
                },
                media: egPost.media && egPost.media.length > 0 ? {
                  create: egPost.media.map((m) => ({
                    mediaAssetId: m.mediaAssetId,
                    sortOrder: m.sortOrder,
                    caption: m.caption,
                  })),
                } : undefined,
              },
            });

            // Update the original evergreen post stats
            await prisma.post.update({
              where: { id: egPost.id },
              data: {
                lastRecycledAt: now,
                recycleCount: { increment: 1 },
              },
            });

            // Publish recycled post immediately
            const res = await publishPostDirectly(recycledPost.id);
            results.push({
              id: recycledPost.id,
              title: `[Evergreen Recycle] ${recycledPost.title}`,
              status: res.status,
            });
            console.log(`✅ [EVERGREEN-AUTO] Tự động tái xuất bản bài viết ${recycledPost.id} thành công với trạng thái: ${res.status}`);
          } catch (recycleErr: any) {
            console.error(`❌ [EVERGREEN-AUTO] Lỗi khi tự động tái đăng bài ${egPost.id}:`, recycleErr);
          }
        }
      }
    } catch (egErr: any) {
      console.warn('⚠️ [EVERGREEN-AUTO] Lỗi kiểm tra bài viết Evergreen:', egErr.message);
    }

    return { processedCount: results.length, results };
  } catch (err: any) {
    console.error('❌ [SCHEDULE-CRON] Lỗi kiểm tra bài viết đến hạn:', err.message);
    return { processedCount: 0, results: [] };
  }
}
