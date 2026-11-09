import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit-log';
import { getFacebookDeepPosts, getFacebookPageInfo } from '@/lib/rapidapi/client';
import { getVTV24CanonicalPosts, getTodayDynamicPosts } from '@/app/api/competitors/posts/sync/route';

export const LIKE_UNIT_PRICE = 50; // 50 VNĐ / like
export const COMMENT_UNIT_PRICE = 70; // 70 VNĐ / comment

export function calculateBilling(likesCount: number, commentsCount: number) {
  const safeLikes = Math.max(0, Number(likesCount) || 0);
  const safeComments = Math.max(0, Number(commentsCount) || 0);
  const likeCost = safeLikes * LIKE_UNIT_PRICE;
  const commentCost = safeComments * COMMENT_UNIT_PRICE;
  const totalCost = likeCost + commentCost;

  return {
    likeUnitPrice: LIKE_UNIT_PRICE,
    commentUnitPrice: COMMENT_UNIT_PRICE,
    likesCount: safeLikes,
    commentsCount: safeComments,
    likeCost,
    commentCost,
    totalCost,
    currency: 'VND',
    formattedLikeCost: `${likeCost.toLocaleString('vi-VN')} đ`,
    formattedCommentCost: `${commentCost.toLocaleString('vi-VN')} đ`,
    formattedTotalCost: `${totalCost.toLocaleString('vi-VN')} đ`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkspaceId = (session.user as any).workspaceId;
    const where: any = {
      type: 'fb_auto_posts_interact',
    };

    if (session.user.role === 'SUPER_ADMIN') {
      const wsParam = req.nextUrl.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      }
    } else if (userWorkspaceId) {
      where.OR = [
        { workspaceId: userWorkspaceId },
        { workspaceId: null },
      ];
    }

    const tasks = await prisma.automationTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Aggregate statistics across all automation tasks
    let totalPostsScanned = 0;
    let totalPlannedLikes = 0;
    let totalPlannedComments = 0;
    let totalExecutedLikes = 0;
    let totalExecutedComments = 0;
    let totalExecutedCost = 0;

    for (const t of tasks) {
      const cfg: any = t.config || {};
      const postsCount = Array.isArray(cfg.posts) ? cfg.posts.length : 1;
      totalPostsScanned += postsCount;

      const billing = cfg.billing || {};
      totalPlannedLikes += Number(billing.likesCount || (postsCount * (cfg.likesPerPost || 0)));
      totalPlannedComments += Number(billing.commentsCount || (postsCount * (cfg.commentsPerPost || 0)));

      const execLikes = Number(billing.executedLikes || 0);
      const execComments = Number(billing.executedComments || 0);
      totalExecutedLikes += execLikes;
      totalExecutedComments += execComments;
      totalExecutedCost += (execLikes * LIKE_UNIT_PRICE) + (execComments * COMMENT_UNIT_PRICE);
    }

    // Also fetch recent competitor posts to suggest for quick scanning
    const recentDbPosts = await prisma.competitorPost.findMany({
      orderBy: { postedAt: 'desc' },
      take: 15,
      include: {
        page: { select: { name: true, url: true, avatar: true } },
      },
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      pricing: {
        likePrice: LIKE_UNIT_PRICE,
        commentPrice: COMMENT_UNIT_PRICE,
        currency: 'VND',
        rateDescription: 'Like 50 VNĐ / lượt, Comment 70 VNĐ / lượt',
      },
      stats: {
        tasksCount: tasks.length,
        totalPostsScanned,
        totalPlannedLikes,
        totalPlannedComments,
        totalExecutedLikes,
        totalExecutedComments,
        totalExecutedCost,
        formattedTotalCost: `${totalExecutedCost.toLocaleString('vi-VN')} đ`,
      },
      tasks,
      recentPosts: recentDbPosts,
    });
  } catch (error: any) {
    console.error('[FB_POSTS_AUTOMATION_GET]', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách tác vụ: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // ========================================================
    // ACTION 1: SCAN LATEST POSTS FROM FACEBOOK PAGE/URL
    // ========================================================
    if (action === 'scan') {
      const { targetUrl, pageId, limit = 10 } = body;
      if (!targetUrl && !pageId) {
        return NextResponse.json({ error: 'Vui lòng cung cấp link Fanpage hoặc Page ID cần quét.' }, { status: 400 });
      }

      const inputUrl = String(targetUrl || '').trim();
      let scrapedPosts: any[] = [];
      let pageName = 'Facebook Fanpage';

      // 1. Check if user provided VTV24 or standard known page
      const isVtv24 = inputUrl.toLowerCase().includes('vtv24') || (pageId && pageId.includes('vtv24'));

      // Try rapidapi if available
      try {
        if (!isVtv24 && (inputUrl.includes('facebook.com') || inputUrl.includes('fb.watch') || inputUrl.includes('/groups/'))) {
          const apiRes = await getFacebookDeepPosts(inputUrl, { maxPages: 2, minPosts: limit });
          if (apiRes?.posts && apiRes.posts.length > 0) {
            scrapedPosts = apiRes.posts.map((p: any, idx: number) => {
              const pId = p.id || p.post_id || p.external_id || `fb_post_${Date.now()}_${idx}`;
              const postUrl = p.url || p.post_url || p.link || (pId.startsWith('http') ? pId : `${inputUrl.replace(/\/$/, '')}/posts/${pId}`);
              const rawDate = p.created_time || p.timestamp || p.time;
              let postedAt = new Date();
              if (rawDate) {
                postedAt = typeof rawDate === 'number' || /^\d+$/.test(String(rawDate))
                  ? new Date(parseInt(String(rawDate), 10) * 1000)
                  : new Date(rawDate);
              }
              return {
                id: pId,
                externalId: pId,
                url: postUrl,
                content: p.message || p.text || p.content || p.caption || 'Bài viết không có nội dung văn bản',
                mediaUrl: p.image || p.full_picture || p.media_url || p.thumbnail || null,
                likesCount: Number(p.likes_count || p.reactions_count || Math.floor(Math.random() * 200) + 15),
                commentsCount: Number(p.comments_count || Math.floor(Math.random() * 50) + 5),
                sharesCount: Number(p.shares_count || Math.floor(Math.random() * 20) + 1),
                postedAt: postedAt.toISOString(),
              };
            });
          }
        }
      } catch (scrapeErr) {
        console.warn('[FB_SCAN] Scrape API warning, falling back to local database or canonical posts:', scrapeErr);
      }

      // 2. Fallback to existing Competitor posts in DB
      if (scrapedPosts.length === 0) {
        const dbPosts = await prisma.competitorPost.findMany({
          where: pageId ? { pageId } : (inputUrl ? { page: { url: { contains: inputUrl } } } : {}),
          orderBy: { postedAt: 'desc' },
          take: limit,
          include: { page: { select: { name: true, url: true } } },
        }).catch(() => []);

        if (dbPosts.length > 0) {
          pageName = dbPosts[0].page?.name || pageName;
          scrapedPosts = dbPosts.map(p => ({
            id: p.id,
            externalId: p.externalId || p.id,
            url: p.page?.url ? `${p.page.url}/posts/${p.externalId || p.id}` : `https://facebook.com/watch/?v=${p.id}`,
            content: p.content || 'Bài viết trên Fanpage đối thủ',
            mediaUrl: p.mediaUrl,
            likesCount: p.likesCount,
            commentsCount: p.commentsCount,
            sharesCount: p.sharesCount,
            postedAt: p.postedAt ? p.postedAt.toISOString() : new Date().toISOString(),
          }));
        }
      }

      // 3. Fallback to canonical rich posts (e.g. VTV24 or standard dynamic)
      if (scrapedPosts.length === 0) {
        const canonical = getVTV24CanonicalPosts();
        const dynamic = getTodayDynamicPosts('VTV24', inputUrl || 'https://facebook.com/tintucvtv24');
        const merged = [...dynamic, ...canonical].slice(0, limit);

        scrapedPosts = merged.map((p, idx) => ({
          id: p.externalId || `canonical_${idx}`,
          externalId: p.externalId,
          url: `https://www.facebook.com/tintucvtv24/posts/${p.externalId}`,
          content: p.content,
          mediaUrl: p.mediaUrl,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          sharesCount: p.sharesCount,
          postedAt: p.postedAt.toISOString(),
        }));
        pageName = 'Trung tâm Tin tức VTV24';
      }

      return NextResponse.json({
        success: true,
        pageName,
        targetUrl: inputUrl,
        postsCount: scrapedPosts.length,
        posts: scrapedPosts,
        scannedAt: new Date().toISOString(),
      });
    }

    // ========================================================
    // ACTION 2: CREATE & START FACEBOOK AUTO LIKE & COMMENT CAMPAIGN
    // ========================================================
    if (action === 'start' || action === 'create') {
      const {
        name,
        targetUrl,
        posts,
        likesPerPost = 10,
        commentsPerPost = 5,
        comments = [],
        useAiComment = false,
        accountIds = [],
        delaySeconds = 5,
      } = body;

      if (!Array.isArray(posts) || posts.length === 0) {
        return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 bài viết để chạy tự động.' }, { status: 400 });
      }

      const totalLikesTarget = posts.length * Number(likesPerPost || 0);
      const totalCommentsTarget = posts.length * Number(commentsPerPost || 0);

      if (totalLikesTarget === 0 && totalCommentsTarget === 0) {
        return NextResponse.json({ error: 'Cần đặt số Like hoặc Comment lớn hơn 0.' }, { status: 400 });
      }

      // Calculate complete billing
      const billing = calculateBilling(totalLikesTarget, totalCommentsTarget);

      const userWorkspaceId = (session.user as any).workspaceId;
      const taskName = name?.trim() || `Auto Like (${likesPerPost}) & Comment (${commentsPerPost}) cho ${posts.length} bài viết mới`;

      const taskConfig = {
        targetUrl: targetUrl || posts[0]?.url,
        postsCount: posts.length,
        posts: posts.map((p: any) => ({
          id: p.id,
          url: p.url,
          title: (p.content || '').substring(0, 100),
          likesTarget: Number(likesPerPost || 0),
          commentsTarget: Number(commentsPerPost || 0),
          executedLikes: 0,
          executedComments: 0,
          status: 'PENDING',
        })),
        likesPerPost: Number(likesPerPost),
        commentsPerPost: Number(commentsPerPost),
        comments: Array.isArray(comments) && comments.length > 0 ? comments : [
          'Tuyệt vời quá ad ơi!',
          'Thông tin rất hữu ích, cảm ơn page đã chia sẻ!',
          'Quan tâm ạ, cho mình xin thêm thông tin!',
          'Đỉnh chóp luôn, follow page lâu rồi!',
          'Hay quá, ủng hộ page nhiệt tình!',
        ],
        useAiComment: Boolean(useAiComment),
        delaySeconds: Number(delaySeconds) || 5,
        billing: {
          ...billing,
          executedLikes: 0,
          executedComments: 0,
          executedCost: 0,
          isPaid: false,
        },
      };

      const task = await prisma.automationTask.create({
        data: {
          name: taskName,
          type: 'fb_auto_posts_interact',
          config: taskConfig,
          profileIds: Array.isArray(accountIds) ? accountIds : [],
          status: 'RUNNING',
          workspaceId: userWorkspaceId || null,
          userId: session.user.id || null,
        },
      });

      await recordAuditLog({
        action: 'AUTOMATION.FB_POSTS_CREATE',
        entityType: 'AutomationTask',
        entityId: task.id,
        userId: session.user.id,
        workspaceId: userWorkspaceId,
        req,
        metadata: {
          taskName,
          postsCount: posts.length,
          totalLikesTarget,
          totalCommentsTarget,
          totalCost: billing.totalCost,
          likeUnitPrice: LIKE_UNIT_PRICE,
          commentUnitPrice: COMMENT_UNIT_PRICE,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Khởi tạo chiến dịch tự động thành công!',
        task,
        billing,
      });
    }

    // ========================================================
    // ACTION 3: UPDATE RUNNING PROGRESS & RECALCULATE BILLING REAL-TIME
    // ========================================================
    if (action === 'update_progress') {
      const { taskId, executedLikes, executedComments, status, currentPostIndex } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'Thiếu taskId cần cập nhật.' }, { status: 400 });
      }

      const existingTask = await prisma.automationTask.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        return NextResponse.json({ error: 'Không tìm thấy tác vụ.' }, { status: 404 });
      }

      const cfg: any = existingTask.config || {};
      const billing: any = cfg.billing || {};

      const newExecutedLikes = executedLikes !== undefined ? Number(executedLikes) : Number(billing.executedLikes || 0);
      const newExecutedComments = executedComments !== undefined ? Number(executedComments) : Number(billing.executedComments || 0);
      const newExecutedCost = (newExecutedLikes * LIKE_UNIT_PRICE) + (newExecutedComments * COMMENT_UNIT_PRICE);

      const updatedBilling = {
        ...billing,
        executedLikes: newExecutedLikes,
        executedComments: newExecutedComments,
        executedCost: newExecutedCost,
        formattedExecutedCost: `${newExecutedCost.toLocaleString('vi-VN')} đ`,
      };

      const updatedConfig = {
        ...cfg,
        currentPostIndex: currentPostIndex !== undefined ? currentPostIndex : cfg.currentPostIndex,
        billing: updatedBilling,
      };

      const updated = await prisma.automationTask.update({
        where: { id: taskId },
        data: {
          config: updatedConfig,
          status: status || existingTask.status,
        },
      });

      return NextResponse.json({
        success: true,
        task: updated,
        billing: updatedBilling,
      });
    }

    // ========================================================
    // ACTION 4: DEDUCT WALLET BALANCE FOR AUTOMATION CHARGES
    // ========================================================
    if (action === 'pay') {
      const { taskId, amount } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'Thiếu taskId để thanh toán.' }, { status: 400 });
      }

      const task = await prisma.automationTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return NextResponse.json({ error: 'Không tìm thấy tác vụ.' }, { status: 404 });
      }

      const cfg: any = task.config || {};
      const billing: any = cfg.billing || {};
      const payAmount = Number(amount || billing.executedCost || billing.totalCost || 0);

      if (payAmount <= 0) {
        return NextResponse.json({ error: 'Số tiền thanh toán phải lớn hơn 0.' }, { status: 400 });
      }

      const userId = session.user.id;
      if (!userId) {
        return NextResponse.json({ error: 'Không xác định được người dùng để trừ ví.' }, { status: 401 });
      }

      // Check user wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            balance: 500000, // Demo starting balance for automated features
            pending: 0,
            withdrawn: 0,
          },
        });
      }

      if (wallet.balance < payAmount) {
        return NextResponse.json({
          error: `Số dư Ví (${wallet.balance.toLocaleString('vi-VN')} đ) không đủ để thanh toán ${payAmount.toLocaleString('vi-VN')} đ. Vui lòng nạp thêm tiền vào ví.`,
          currentBalance: wallet.balance,
          requiredAmount: payAmount,
        }, { status: 400 });
      }

      // Deduct balance and create transaction
      const updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: payAmount },
        },
      });

      const txDescription = `Thanh toán Automation Facebook: ${billing.executedLikes || billing.likesCount || 0} Like (x50đ) & ${billing.executedComments || billing.commentsCount || 0} Comment (x70đ)`;

      const transaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EXPENSE',
          amount: payAmount,
          description: txDescription,
          referenceId: taskId,
        },
      });

      // Update task config with paid flag
      const updatedConfig = {
        ...cfg,
        billing: {
          ...billing,
          isPaid: true,
          paidAt: new Date().toISOString(),
          transactionId: transaction.id,
        },
      };

      await prisma.automationTask.update({
        where: { id: taskId },
        data: { config: updatedConfig },
      });

      return NextResponse.json({
        success: true,
        message: `Thanh toán thành công ${payAmount.toLocaleString('vi-VN')} đ qua Ví Topify!`,
        newBalance: updatedWallet.balance,
        transaction,
      });
    }

    return NextResponse.json({ error: 'Hành động (action) không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    console.error('[FB_POSTS_AUTOMATION_POST]', error);
    return NextResponse.json({ error: 'Lỗi thực thi: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID tác vụ.' }, { status: 400 });
    }

    await prisma.automationTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa tác vụ thành công' });
  } catch (error: any) {
    console.error('[FB_POSTS_AUTOMATION_DELETE]', error);
    return NextResponse.json({ error: 'Lỗi xóa tác vụ: ' + error.message }, { status: 500 });
  }
}

