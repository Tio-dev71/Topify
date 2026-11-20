import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit-log';
import { getFacebookDeepPosts, getFacebookPageInfo } from '@/lib/rapidapi/client';
import { getVTV24CanonicalPosts, getTodayDynamicPosts } from '@/app/api/competitors/posts/sync/route';
import { scrapeFacebookPostsUnified } from '@/lib/facebook-scraper';

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

    // Lấy danh sách Lịch Tự Động Quét Đa Page (Multi-Page Schedules)
    const rawSchedules = await prisma.automationTask.findMany({
      where: {
        type: 'fb_page_schedule',
        ...(userWorkspaceId ? {
          OR: [
            { workspaceId: userWorkspaceId },
            { workspaceId: null },
          ]
        } : {})
      },
      orderBy: { createdAt: 'desc' },
    });

    const schedules = rawSchedules.map(s => {
      const cfg = (s.config as any) || {};
      return {
        id: s.id,
        name: s.name,
        pageUrl: cfg.pageUrl || '',
        pageName: cfg.pageName || s.name,
        intervalMinutes: Number(cfg.intervalMinutes) || 15,
        accountsPerRun: Number(cfg.accountsPerRun) || 20,
        concurrency: Number(cfg.concurrency) || 5,
        randomAccounts: Boolean(cfg.randomAccounts ?? true),
        useAiComment: Boolean(cfg.useAiComment ?? true),
        likesPerPost: Number(cfg.likesPerPost) || 1,
        commentsPerPost: Number(cfg.commentsPerPost) || 1,
        comments: cfg.comments || [],
        isActive: Boolean(cfg.isActive ?? true),
        lastRunAt: cfg.lastRunAt || null,
        nextRunAt: cfg.nextRunAt || null,
        lastScannedPostUrl: cfg.lastScannedPostUrl || null,
        interactedPostUrls: Array.isArray(cfg.interactedPostUrls) ? cfg.interactedPostUrls : [],
        status: s.status || 'IDLE',
        statusMessage: cfg.statusMessage || '',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

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
        schedulesCount: schedules.length,
        totalPostsScanned,
        totalPlannedLikes,
        totalPlannedComments,
        totalExecutedLikes,
        totalExecutedComments,
        totalExecutedCost,
        formattedTotalCost: `${totalExecutedCost.toLocaleString('vi-VN')} đ`,
      },
      tasks,
      schedules,
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
    // ACTION 1: SCAN LATEST POSTS FROM FACEBOOK PAGE/URL (Unified with F051)
    // ========================================================
    if (action === 'scan') {
      const { targetUrl, pageId, limit = 10 } = body;
      if (!targetUrl && !pageId) {
        return NextResponse.json({ error: 'Vui lòng cung cấp link Fanpage hoặc Page ID cần quét.' }, { status: 400 });
      }

      let urlToScan = String(targetUrl || '').trim();
      if (!urlToScan && pageId) {
        const foundPage = await prisma.competitorPage.findUnique({ where: { id: pageId } });
        if (foundPage?.url) {
          urlToScan = foundPage.url;
        }
      }

      if (!urlToScan) {
        return NextResponse.json({ error: 'Không tìm thấy liên kết Fanpage cần quét.' }, { status: 400 });
      }

      const userWorkspaceId = (session.user as any).workspaceId;
      const scrapeResult = await scrapeFacebookPostsUnified(urlToScan, limit, userWorkspaceId);

      if (scrapeResult.posts.length === 0) {
        return NextResponse.json({
          error: 'Không thể cào dữ liệu từ Fanpage này. Vui lòng kiểm tra lại liên kết hoặc Fanpage chưa có bài viết công khai.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        pageName: scrapeResult.pageName,
        avatarUrl: scrapeResult.avatarUrl,
        targetUrl: urlToScan,
        postsCount: scrapeResult.posts.length,
        posts: scrapeResult.posts,
        source: scrapeResult.source,
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

      // Lọc bỏ bài viết trùng lặp URL và URL trang chủ chung
      const seenPostUrls = new Set<string>();
      const validPosts: any[] = [];
      const hasSpecific = posts.some((p: any) => {
        const u = String(p.url || '').toLowerCase();
        return u.includes('/posts/') || u.includes('/photos/') || u.includes('/videos/') || u.includes('/reel/') || u.includes('story_fbid');
      });

      for (const p of posts) {
        const u = String(p.url || '').trim();
        if (!u) continue;
        const clean = u.split('?')[0].replace(/\/+$/, '');
        if (seenPostUrls.has(clean)) continue;
        if (hasSpecific && targetUrl && clean === targetUrl.split('?')[0].replace(/\/+$/, '')) {
          continue;
        }
        seenPostUrls.add(clean);
        validPosts.push(p);
      }

      if (validPosts.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy liên kết bài viết hợp lệ nào.' }, { status: 400 });
      }

      const totalLikesTarget = validPosts.length * Number(likesPerPost || 0);
      const totalCommentsTarget = validPosts.length * Number(commentsPerPost || 0);

      if (totalLikesTarget === 0 && totalCommentsTarget === 0) {
        return NextResponse.json({ error: 'Cần đặt số Like hoặc Comment lớn hơn 0.' }, { status: 400 });
      }

      // Calculate complete billing
      const billing = calculateBilling(totalLikesTarget, totalCommentsTarget);

      const userWorkspaceId = (session.user as any).workspaceId;
      const taskName = name?.trim() || `Auto Like (${likesPerPost}) & Comment (${commentsPerPost}) cho ${validPosts.length} bài viết mới`;

      const taskConfig = {
        targetUrl: targetUrl || validPosts[0]?.url,
        postsCount: validPosts.length,
        posts: validPosts.map((p: any) => ({
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

    // ========================================================
    // ACTION 5: SAVE SCHEDULE (CREATE / EDIT MULTI-PAGE SCHEDULE)
    // ========================================================
    if (action === 'save_schedule') {
      const {
        id,
        pageUrl,
        pageName,
        intervalMinutes = 15,
        accountsPerRun = 20,
        concurrency = 5,
        randomAccounts = true,
        useAiComment = true,
        likesPerPost = 1,
        commentsPerPost = 1,
        comments = [],
        isActive = true,
      } = body;

      const cleanUrl = String(pageUrl || '').trim();
      if (!cleanUrl) {
        return NextResponse.json({ error: 'Vui lòng cung cấp link Fanpage/Group để lên lịch quét.' }, { status: 400 });
      }

      const safeInterval = Math.max(1, Number(intervalMinutes) || 15);
      const safeAccCount = Math.max(1, Number(accountsPerRun) || 20);
      const safeConcurrency = Math.max(1, Number(concurrency) || 5);
      const name = String(pageName || '').trim() || cleanUrl.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, '').replace(/\/+$/, '') || 'Lịch Fanpage';

      const userWorkspaceId = (session.user as any).workspaceId;

      if (id) {
        // Cập nhật cấu hình lịch hiện có
        const existing = await prisma.automationTask.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json({ error: 'Không tìm thấy cấu hình lịch cần sửa.' }, { status: 404 });
        }

        const oldCfg: any = existing.config || {};
        const updatedCfg = {
          ...oldCfg,
          pageUrl: cleanUrl,
          pageName: name,
          intervalMinutes: safeInterval,
          accountsPerRun: safeAccCount,
          concurrency: safeConcurrency,
          randomAccounts: Boolean(randomAccounts),
          useAiComment: Boolean(useAiComment),
          likesPerPost: Math.max(0, Number(likesPerPost) || 1),
          commentsPerPost: Math.max(0, Number(commentsPerPost) || 1),
          comments: Array.isArray(comments) && comments.length > 0 ? comments : (oldCfg.comments || []),
          isActive: Boolean(isActive),
        };

        const updated = await prisma.automationTask.update({
          where: { id },
          data: {
            name: `Lịch Quét: ${name} (mỗi ${safeInterval}p)`,
            config: updatedCfg,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Cập nhật lịch quét Fanpage thành công!',
          schedule: updated,
        });
      } else {
        // Tạo mới cấu hình lịch
        const newConfig = {
          pageUrl: cleanUrl,
          pageName: name,
          intervalMinutes: safeInterval,
          accountsPerRun: safeAccCount,
          concurrency: safeConcurrency,
          randomAccounts: Boolean(randomAccounts),
          useAiComment: Boolean(useAiComment),
          likesPerPost: Math.max(0, Number(likesPerPost) || 1),
          commentsPerPost: Math.max(0, Number(commentsPerPost) || 1),
          comments: Array.isArray(comments) && comments.length > 0 ? comments : [
            'Bài viết rất hay và ý nghĩa!',
            'Thông tin cực kỳ kịp thời và chính xác',
            'Nội dung bổ ích quá, hóng các bài tiếp theo ạ',
            'Chuẩn luôn ad ơi, thả tim cho bài viết',
            'Cảm ơn page đã chia sẻ!',
          ],
          isActive: Boolean(isActive),
          lastRunAt: null,
          nextRunAt: new Date(Date.now() + 5000).toISOString(), // Lần đầu quét ngay sau 5 giây
          lastScannedPostUrl: null,
          interactedPostUrls: [],
          statusMessage: 'Sẵn sàng kích hoạt đợt quét đầu tiên',
        };

        const newTask = await prisma.automationTask.create({
          data: {
            name: `Lịch Quét: ${name} (mỗi ${safeInterval}p)`,
            type: 'fb_page_schedule',
            config: newConfig,
            profileIds: [],
            status: 'IDLE',
            workspaceId: userWorkspaceId || null,
            userId: session.user.id || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Đã thêm mới lịch quét Fanpage vào hệ thống!',
          schedule: newTask,
        });
      }
    }

    // ========================================================
    // ACTION 6: TOGGLE SCHEDULE ACTIVE/PAUSE
    // ========================================================
    if (action === 'toggle_schedule') {
      const { id, isActive } = body;
      if (!id) {
        return NextResponse.json({ error: 'Thiếu schedule ID.' }, { status: 400 });
      }

      const existing = await prisma.automationTask.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Không tìm thấy lịch.' }, { status: 404 });
      }

      const oldCfg: any = existing.config || {};
      const newActive = Boolean(isActive);
      const updatedCfg = {
        ...oldCfg,
        isActive: newActive,
        nextRunAt: newActive ? (oldCfg.nextRunAt || new Date().toISOString()) : oldCfg.nextRunAt,
        statusMessage: newActive ? 'Đã bật lịch tự động' : 'Tạm dừng lịch',
      };

      const updated = await prisma.automationTask.update({
        where: { id },
        data: {
          config: updatedCfg,
          status: newActive ? (existing.status === 'PAUSED' ? 'IDLE' : existing.status) : 'PAUSED',
        },
      });

      return NextResponse.json({
        success: true,
        message: newActive ? 'Đã kích hoạt lại lịch quét Fanpage' : 'Đã tạm dừng lịch quét Fanpage',
        schedule: updated,
      });
    }

    // ========================================================
    // ACTION 7: UPDATE SCHEDULE PROGRESS / TIMING AFTER EXECUTION
    // ========================================================
    if (action === 'update_schedule_progress') {
      const {
        id,
        lastRunAt,
        nextRunAt,
        lastScannedPostUrl,
        interactedPostUrls,
        status,
        statusMessage,
      } = body;

      if (!id) {
        return NextResponse.json({ error: 'Thiếu schedule ID.' }, { status: 400 });
      }

      const existing = await prisma.automationTask.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Không tìm thấy lịch.' }, { status: 404 });
      }

      const oldCfg: any = existing.config || {};
      const updatedCfg = {
        ...oldCfg,
        lastRunAt: lastRunAt !== undefined ? lastRunAt : oldCfg.lastRunAt,
        nextRunAt: nextRunAt !== undefined ? nextRunAt : oldCfg.nextRunAt,
        lastScannedPostUrl: lastScannedPostUrl !== undefined ? lastScannedPostUrl : oldCfg.lastScannedPostUrl,
        interactedPostUrls: Array.isArray(interactedPostUrls) ? interactedPostUrls : oldCfg.interactedPostUrls || [],
        statusMessage: statusMessage !== undefined ? statusMessage : oldCfg.statusMessage,
      };

      const updated = await prisma.automationTask.update({
        where: { id },
        data: {
          config: updatedCfg,
          status: status || existing.status,
        },
      });

      return NextResponse.json({
        success: true,
        schedule: updated,
      });
    }

    // ========================================================
    // ACTION 8: DELETE SCHEDULE
    // ========================================================
    if (action === 'delete_schedule') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Thiếu schedule ID.' }, { status: 400 });
      }

      await prisma.automationTask.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa lịch quét Fanpage thành công',
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

