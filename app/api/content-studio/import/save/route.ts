import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { schedulePublish } from '@/lib/queue';
import { checkAndPublishDuePosts } from '@/lib/queue/publisher-service';
import { recordAuditLog } from '@/lib/audit-log';
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { posts, importAsDraft } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'Danh sách bài viết cần nhập rỗng.' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const userId = session.user.id;
    const createdPostIds: string[] = [];

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
        let status: 'DRAFT' | 'SCHEDULED' = 'DRAFT';
        let finalScheduledAt: Date | null = null;

        if (!importAsDraft && item.scheduledAt) {
          const parsedDate = new Date(item.scheduledAt);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
            status = 'SCHEDULED';
            finalScheduledAt = parsedDate;
          }
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
      // Queue publish job if scheduled
      if (post.status === 'SCHEDULED' && post.scheduledAt) {
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

    return NextResponse.json({
      success: true,
      count: createdPostIds.length,
      postIds: createdPostIds,
      message: `Đã nhập thành công ${createdPostIds.length} bài viết vào hệ thống!`,
    });
  } catch (err: any) {
    console.error('Lỗi API lưu bài viết import:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ khi lưu bài viết import' }, { status: 500 });
  }
}
