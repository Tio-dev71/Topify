import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { TaskCommentItem, TaskAttachment } from '@/lib/tasks/engine';

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

    let comments = memoryComments.filter((c) => c.taskId === taskId);

    // Try fetching from database if exists
    try {
      const dbComments = await prisma.taskComment.findMany({
        where: { taskId },
        include: {
          createdBy: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (dbComments && dbComments.length > 0) {
        comments = dbComments.map((dc: any) => ({
          id: dc.id,
          taskId: dc.taskId,
          authorId: dc.createdById,
          authorName: dc.createdBy?.name || dc.createdBy?.email || 'Thành viên',
          authorAvatar: dc.createdBy?.image || undefined,
          content: dc.content,
          mentions: [],
          attachments: [],
          createdAt: dc.createdAt.toISOString(),
        }));
      }
    } catch (e) {
      // fallback to memory
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

    const newComment: TaskCommentItem = {
      id: `comm_${Date.now()}`,
      taskId,
      authorId: authorEmail ? `user_${authorEmail.split('@')[0]}` : 'user_current',
      authorName: authorName || 'Bạn',
      authorAvatar: authorAvatar || undefined,
      content: content.trim(),
      mentions: Array.isArray(mentions) ? mentions : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date().toISOString(),
    };

    // Try save to database
    try {
      const session = await auth();
      if (session?.user?.id) {
        const created = await prisma.taskComment.create({
          data: {
            taskId,
            createdById: session.user.id,
            content: newComment.content,
          },
        });
        newComment.id = created.id;
      }
    } catch (e) {
      // ignore db error
    }

    memoryComments.push(newComment);

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: 'Đã gửi bình luận thành công',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API_TASKS_COMMENTS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
