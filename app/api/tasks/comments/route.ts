import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { TaskCommentItem, TaskAttachment } from '@/lib/tasks/engine';
import * as jwtPackage from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

// In-memory comments store for offline/desktop fallback
let memoryComments: TaskCommentItem[] = [
  {
    id: 'comm_1',
    taskId: 'task_1',
    authorId: 'user_2',
    authorName: 'Trần Thị B',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    content: 'Đã nhận được source video 4K từ @Nguyễn Văn A, âm thanh thoại rất rõ và sạch. Đang dựng phần hook 3s đầu tiên!',
    mentions: ['nguyenvana@topify.vn'],
    attachments: [
      {
        id: 'att_1',
        name: 'hook_sample_v1.mp4',
        size: 14800000,
        url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        type: 'video/mp4',
        uploadedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'comm_2',
    taskId: 'task_1',
    authorId: 'user_1',
    authorName: 'Nguyễn Văn A',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    content: 'Nhớ chèn thêm sticker CTA follow kênh và link bio nhé @Trần Thị B. File kịch bản đính kèm bên dưới.',
    mentions: ['tranthib@topify.vn'],
    attachments: [
      {
        id: 'att_2',
        name: 'kich_ban_chi_tiet_noi_chien.pdf',
        size: 2450000,
        url: 'https://topify.vn/docs/kich_ban_chi_tiet_noi_chien.pdf',
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'comm_3',
    taskId: 'task_2',
    authorId: 'user_2',
    authorName: 'Trần Thị B',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    content: 'Đã liên hệ với khách hàng qua Zalo OA, khách đã đồng ý nhận voucher hoàn 50k thay vì hủy đơn.',
    mentions: [],
    attachments: [],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

// GET /api/tasks/comments?taskId=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId là bắt buộc' }, { status: 400 });
    }

    let comments: TaskCommentItem[] = [];

    // 1. Try DB first
    try {
      const dbComments = await prisma.taskComment.findMany({
        where: { taskId },
        include: {
          createdBy: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (dbComments && dbComments.length > 0) {
        comments = dbComments.map((dc: any) => {
          let text = dc.content;
          let mentions: string[] = [];
          let attachments: TaskAttachment[] = [];

          try {
            if (typeof text === 'string' && text.startsWith('{') && text.endsWith('}')) {
              const parsed = JSON.parse(text);
              if (parsed.text !== undefined || parsed.content !== undefined) {
                text = parsed.text ?? parsed.content;
                mentions = Array.isArray(parsed.mentions) ? parsed.mentions : [];
                attachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
              }
            }
          } catch {}

          return {
            id: dc.id,
            taskId: dc.taskId,
            authorId: dc.createdById,
            authorName: dc.createdBy?.name || (dc.createdBy?.email ? dc.createdBy.email.split('@')[0] : 'Thành viên'),
            authorAvatar: dc.createdBy?.image || undefined,
            content: text,
            mentions,
            attachments,
            createdAt: dc.createdAt instanceof Date ? dc.createdAt.toISOString() : dc.createdAt,
          };
        });
      }
    } catch (e) {
      console.warn('[API_TASKS_COMMENTS_GET] DB query fallback to memory:', e);
    }

    // 2. Merge with any memory comments for this taskId (unpersisted or in-flight)
    const memForTask = memoryComments.filter((c) => c.taskId === taskId);
    if (memForTask.length > 0) {
      const existingIds = new Set(comments.map((c) => c.id));
      const unpersisted = memForTask.filter((c) => !existingIds.has(c.id));
      comments = [...comments, ...unpersisted];
    }

    return NextResponse.json({
      success: true,
      taskId,
      comments,
      total: comments.length,
    });
  } catch (error: any) {
    console.error('[API_TASKS_COMMENTS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks/comments - Create comment with attachments & mentions (F128)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, content, authorName, authorEmail, authorAvatar, mentions = [], attachments = [] } = body;

    if (!taskId || !content?.trim()) {
      return NextResponse.json({ error: 'Nội dung bình luận và taskId không được để trống' }, { status: 400 });
    }

    const cleanContent = content.trim();

    // 1. Resolve user ID for database persistence
    let userId: string | null = null;
    let userName = authorName || 'Bạn';
    let userAvatar = authorAvatar || undefined;

    // Check auth session
    try {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
        userName = session.user.name || userName;
      }
    } catch {}

    // Check Bearer token directly from header if session didn't resolve
    if (!userId) {
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
          const candidateId = decoded.sub || decoded.id;
          if (candidateId) {
            userId = candidateId;
            if (decoded.name) userName = decoded.name;
          }
        }
      } catch {}
    }

    // Lookup user by authorEmail if provided
    if (authorEmail && (!userId || (prisma.user?.findUnique && !(await prisma.user.findUnique({ where: { id: userId } }).catch(() => null))))) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: authorEmail },
          select: { id: true, name: true, image: true },
        });
        if (dbUser) {
          userId = dbUser.id;
          userName = dbUser.name || userName;
          userAvatar = dbUser.image || userAvatar;
        }
      } catch {}
    }

    // Fallback: verify userId exists in User table
    let verifiedUser = userId && prisma.user?.findUnique ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, image: true } }).catch(() => null) : null;

    if (!verifiedUser) {
      // Find task assignee or first user in DB
      try {
        const taskInDb = await prisma.task.findUnique({
          where: { id: taskId },
          select: { assigneeId: true },
        });
        if (taskInDb?.assigneeId) {
          verifiedUser = await prisma.user.findUnique({
            where: { id: taskInDb.assigneeId },
            select: { id: true, name: true, image: true },
          });
        }
      } catch {}

      if (!verifiedUser) {
        try {
          verifiedUser = await prisma.user.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, image: true },
          });
        } catch {}
      }
    }

    if (verifiedUser) {
      userId = verifiedUser.id;
      userName = verifiedUser.name || userName;
      userAvatar = verifiedUser.image || userAvatar;
    }

    // Ensure the task exists in DB before inserting foreign key
    let taskExistsInDb = false;
    try {
      const dbTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true },
      });
      if (dbTask) {
        taskExistsInDb = true;
      } else if (userId) {
        // Auto-create task record stub so foreign key constraint passes
        const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
        await prisma.task.create({
          data: {
            id: taskId,
            title: 'Công việc',
            priority: 'MEDIUM',
            status: 'TODO',
            assigneeId: userId,
            workspaceId: firstWs?.id || null,
          },
        });
        taskExistsInDb = true;
      }
    } catch (e) {
      console.warn('[API_TASKS_COMMENTS_POST] Check/create task error:', e);
    }

    // Structured storage in content for attachments and mentions
    const rawContentToSave =
      attachments.length > 0 || mentions.length > 0
        ? JSON.stringify({
            text: cleanContent,
            mentions: Array.isArray(mentions) ? mentions : [],
            attachments: Array.isArray(attachments) ? attachments : [],
          })
        : cleanContent;

    let commentId = `comm_${Date.now()}`;
    let createdAtIso = new Date().toISOString();

    // Persist to database if task & user are valid
    if (taskExistsInDb && userId) {
      try {
        const created = await prisma.taskComment.create({
          data: {
            taskId,
            createdById: userId,
            content: rawContentToSave,
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true, image: true } },
          },
        });
        commentId = created.id;
        createdAtIso = created.createdAt.toISOString();
        if (created.createdBy) {
          userName = created.createdBy.name || userName;
          userAvatar = created.createdBy.image || userAvatar;
        }

        // Update task's updatedAt
        await prisma.task.update({
          where: { id: taskId },
          data: { updatedAt: new Date() },
        }).catch(() => {});
      } catch (dbErr) {
        console.error('[API_TASKS_COMMENTS_POST] DB create error:', dbErr);
      }
    }

    const savedComment: TaskCommentItem = {
      id: commentId,
      taskId,
      authorId: userId || 'user_current',
      authorName: userName,
      authorAvatar: userAvatar,
      content: cleanContent,
      mentions: Array.isArray(mentions) ? mentions : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: createdAtIso,
    };

    memoryComments.push(savedComment);

    return NextResponse.json({
      success: true,
      comment: savedComment,
      message: 'Đã gửi bình luận thành công',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API_TASKS_COMMENTS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
