import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { enqueuePublish, schedulePublish } from '@/lib/queue';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';
import { recordAuditLog } from '@/lib/audit-log';
import { isPlatformProviderConnected, PLATFORM_PROVIDER_INFO, formatFriendlyImportError } from '@/lib/content-studio/import-engine';
import type { Platform } from '@prisma/client';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS_SET = new Set([
  'FACEBOOK_REELS',
  'FACEBOOK_POST',
  'INSTAGRAM_REELS',
  'INSTAGRAM_CAROUSEL',
  'INSTAGRAM_STORY',
  'YOUTUBE_SHORTS',
  'TIKTOK_VIDEO',
  'ZALO_POST',
  'ZALO_ARTICLE',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content-studio/import/save
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getAuthContext() {
  let session = await auth();
  let userId = session?.user?.id;
  let workspaceId = (session?.user as any)?.workspaceId;

  if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }
  }

  if (userId && !workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true },
    }).catch(() => null);
    workspaceId = dbUser?.workspaceId || null;
  }

  return { userId, workspaceId };
}

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { posts, importAsDraft } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'Danh sách bài viết cần nhập rỗng.' }, { status: 400, headers: corsHeaders });
    }

    const createdPostIds: string[] = [];

    // Query active/connected social accounts for platform validation (protected against invalid enum or DB errors)
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        OR: [
          ...(workspaceId ? [{ workspaceId }] : []),
          { userId },
        ],
      },
      select: {
        provider: true,
        status: true,
        expiresAt: true,
        refreshToken: true,
      },
    }).catch((dbErr) => {
      console.warn('[import/save] Failed to query socialAccount:', dbErr);
      return [];
    });

    const connectedProviders = new Set<string>();
    for (const acc of socialAccounts) {
      const isExpired = acc.expiresAt ? new Date(acc.expiresAt).getTime() < Date.now() : false;
      const isConnected = acc.status === 'CONNECTED' || (Boolean(acc.refreshToken) && (acc.provider === 'YOUTUBE' || (acc.provider as string) === 'GOOGLE'));
      if (isConnected && (!isExpired || Boolean(acc.refreshToken))) {
        const prov = String(acc.provider).toUpperCase();
        connectedProviders.add(prov);
        if (prov === 'META' || prov === 'FACEBOOK') {
          connectedProviders.add('META');
          connectedProviders.add('FACEBOOK');
          connectedProviders.add('INSTAGRAM');
        }
        if (prov === 'INSTAGRAM') {
          connectedProviders.add('META');
          connectedProviders.add('INSTAGRAM');
        }
        if (prov === 'YOUTUBE' || prov === 'GOOGLE') {
          connectedProviders.add('YOUTUBE');
          connectedProviders.add('GOOGLE');
        }
        if (prov === 'TIKTOK') {
          connectedProviders.add('TIKTOK');
        }
        if (prov === 'ZALO') {
          connectedProviders.add('ZALO');
        }
        if (prov === 'TELEGRAM') {
          connectedProviders.add('TELEGRAM');
        }
      }
    }

    // If scheduling directly, ensure all posts have connected platforms
    if (!importAsDraft) {
      for (const item of posts) {
        const title = String(item.title || '').trim();
        const rawPlatforms = Array.isArray(item.platforms) ? item.platforms : ['FACEBOOK_REELS'];
        for (const p of rawPlatforms) {
          if (!isPlatformProviderConnected(p, connectedProviders)) {
            const info = PLATFORM_PROVIDER_INFO[p];
            return NextResponse.json(
              {
                error: `Không thể lên lịch cho bài viết "${title}" vì nền tảng ${info?.name || p} chưa được kết nối với tài khoản. Vui lòng kết nối tài khoản hoặc lưu dạng Bản thảo (Draft).`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Process posts in transaction or sequential batches
    const results = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const item of posts) {
        const title = String(item.title || '').trim();
        if (!title) continue;

        const caption = item.caption ? String(item.caption).trim() : null;
        const firstComment = item.firstComment ? String(item.firstComment).trim() : null;
        const hashtags = item.hashtags ? String(item.hashtags).trim() : null;

        // Determine platforms
        const rawPlatforms = Array.isArray(item.platforms) ? item.platforms : ['FACEBOOK_REELS'];
        const cleanPlatforms: Platform[] = rawPlatforms
          .filter((p: string) => VALID_PLATFORMS_SET.has(p)) as Platform[];

        if (cleanPlatforms.length === 0) {
          cleanPlatforms.push('FACEBOOK_REELS' as Platform);
        }

        // Determine scheduling
        let status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' = 'DRAFT';
        let finalScheduledAt: Date | null = null;

        if (importAsDraft || item.scheduledAt === 'DRAFT') {
          status = 'DRAFT';
        } else if (item.scheduledAt && item.scheduledAt !== 'NOW') {
          const parsedDate = new Date(item.scheduledAt);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
            status = 'SCHEDULED';
            finalScheduledAt = parsedDate;
          } else {
            status = 'PUBLISHING';
          }
        } else {
          // Empty or 'NOW' and !importAsDraft -> default is Đăng ngay (Publish now)!
          status = 'PUBLISHING';
        }

        const post = await tx.post.create({
          data: {
            title,
            caption,
            firstComment,
            hashtags,
            videoAssetId: null, // Draft / Text / Pending video attach
            createdById: userId,
            workspaceId,
            status,
            scheduledAt: finalScheduledAt,
            platforms: {
              create: cleanPlatforms.map((p) => ({
                platform: p,
                status: 'PENDING',
              })),
            },
          },
          select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
          },
        });

        created.push(post);
      }

      return created;
    });

    for (const post of results) {
      createdPostIds.push(post.id);
      // Queue publish job if scheduled or publish now
      if (post.status === 'PUBLISHING') {
        try {
          await enqueuePublish(post.id);
        } catch (e: any) {
          console.warn(`[ImportPost] Queue publish now warning for ${post.id}:`, e.message);
        }
      } else if (post.status === 'SCHEDULED' && post.scheduledAt) {
        try {
          await schedulePublish(post.id, post.scheduledAt);
          if (post.scheduledAt <= new Date()) {
            checkAndPublishDuePosts().catch(console.error);
          }
        } catch (e: any) {
          console.warn(`[ImportPost] Queue schedule warning for ${post.id}:`, e.message);
        }
      }
    }

    await recordAuditLog({
      action: 'POST.BULK_IMPORT',
      entityType: 'Post',
      entityId: createdPostIds[0] || 'bulk',
      userId,
      workspaceId,
      req,
      metadata: {
        totalImported: createdPostIds.length,
        importAsDraft: !!importAsDraft,
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: createdPostIds.length,
        postIds: createdPostIds,
        message: `Đã nhập thành công ${createdPostIds.length} bài viết vào hệ thống!`,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Lỗi API lưu bài viết import:', err);
    const friendlyError = formatFriendlyImportError(
      err?.message || err,
      'Không thể lưu bài viết vào hệ thống do sự cố cơ sở dữ liệu. Vui lòng thử lại sau.'
    );
    return NextResponse.json({ error: friendlyError }, { status: 500, headers: corsHeaders });
  }
}
