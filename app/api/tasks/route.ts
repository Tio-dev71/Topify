import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import { BUILT_IN_TASK_TEMPLATES, TaskPriority, TaskStatus } from '@/lib/tasks/engine';

export interface EnrichedTask {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id?: string;
    name: string | null;
    email: string;
    image?: string | null;
  } | null;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  collaboratorIds: string[];
  isRecurring: boolean;
  recurRule?: string | null;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    assigneeName?: string;
  }>;
  commentsCount: number;
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// In-memory sample data for instant dev & demo on Electron
let memoryTasks: EnrichedTask[] = [
  {
    id: 'task_1',
    title: 'Sản xuất video review Nồi chiên không dầu TikTok #Shorts',
    description: 'Quay dựng video 45s giới thiệu 3 tính năng vượt trội, tập trung hook 3s đầu tiên và CTA dẫn về link bio.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    assigneeId: 'user_1',
    assignee: {
      id: 'user_1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@topify.vn',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
    collaboratorIds: ['user_2', 'user_3'],
    collaborators: [
      { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
      { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    ],
    isRecurring: true,
    recurRule: 'WEEKLY',
    subtasks: [
      { id: 'sub_1', title: 'Nghiên cứu góc máy & viết kịch bản 3s hook', isCompleted: true, assigneeName: 'Nguyễn Văn A' },
      { id: 'sub_2', title: 'Quay source video chất lượng cao tại studio', isCompleted: true, assigneeName: 'Nguyễn Văn A' },
      { id: 'sub_3', title: 'Dựng video, cắt nhịp nhanh & chèn hiệu ứng âm thanh', isCompleted: false, assigneeName: 'Trần Thị B' },
      { id: 'sub_4', title: 'Tạo phụ đề tự động WebVTT và kiểm duyệt bản quyền', isCompleted: false, assigneeName: 'Trần Thị B' },
    ],
    commentsCount: 4,
    attachmentsCount: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_2',
    title: 'Xử lý khiếu nại giao trễ đơn hàng #DH-9842 & hoàn tiền',
    description: 'Khách hàng phản ánh đơn hàng giao trễ 4 ngày tại Hà Nội. Cần kiểm tra kho vận và gọi điện trực tiếp bồi hoàn voucher.',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // 5h left
    assigneeId: 'user_2',
    assignee: {
      id: 'user_2',
      name: 'Trần Thị B',
      email: 'tranthib@topify.vn',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    collaboratorIds: ['user_1'],
    collaborators: [
      { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn' },
    ],
    isRecurring: false,
    recurRule: null,
    subtasks: [
      { id: 'sub_21', title: 'Tra cứu mã vận đơn trên hệ thống ViettelPost', isCompleted: true, assigneeName: 'Trần Thị B' },
      { id: 'sub_22', title: 'Gọi điện giải thích nguyên nhân và xin lỗi khách', isCompleted: false, assigneeName: 'Trần Thị B' },
      { id: 'sub_23', title: 'Cấp mã voucher hoàn 50.000đ cho đơn kế tiếp', isCompleted: false, assigneeName: 'Trần Thị B' },
    ],
    commentsCount: 2,
    attachmentsCount: 1,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_3',
    title: 'Chiến dịch Campaign Sale Giữa Tháng (Mid-Month 15.10)',
    description: 'Thiết lập trọn gói chiến dịch quảng cáo TikTok Ads và Facebook Reels, kích hoạt phễu CRM và theo dõi ROI.',
    priority: 'HIGH',
    status: 'REVIEW',
    dueDate: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), // Overdue!
    assigneeId: 'user_3',
    assignee: {
      id: 'user_3',
      name: 'Lê Hoàng C',
      email: 'lehoangc@topify.vn',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    collaboratorIds: ['user_1', 'user_2'],
    collaborators: [
      { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn' },
      { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn' },
    ],
    isRecurring: true,
    recurRule: 'MONTHLY',
    subtasks: [
      { id: 'sub_31', title: 'Set ngân sách và gắn UTM tracking links', isCompleted: true },
      { id: 'sub_32', title: 'Seeding 5 cộng đồng review tiêu dùng lớn', isCompleted: true },
      { id: 'sub_33', title: 'Đối soát chi phí và đo lường Campaign ROI', isCompleted: false },
    ],
    commentsCount: 5,
    attachmentsCount: 3,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_4',
    title: 'Đào tạo & Onboarding nhân sự mới phòng Media',
    description: 'Hướng dẫn thành viên mới về phong cách Brand Voice, cách sử dụng Topify Media Studio và quy trình duyệt bài.',
    priority: 'MEDIUM',
    status: 'DONE',
    dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    assigneeId: 'user_1',
    assignee: {
      id: 'user_1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@topify.vn',
    },
    collaboratorIds: ['user_3'],
    collaborators: [
      { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn' },
    ],
    isRecurring: false,
    recurRule: null,
    subtasks: [
      { id: 'sub_41', title: 'Cấp tài khoản Workspace và hướng dẫn bảo mật 2FA', isCompleted: true },
      { id: 'sub_42', title: 'Thực hành cắt dựng 1 video mẫu trong Media Studio', isCompleted: true },
      { id: 'sub_43', title: 'Đánh giá đạt chuẩn và bàn giao dự án chính', isCompleted: true },
    ],
    commentsCount: 1,
    attachmentsCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/tasks - List tasks with enriched collaborator & recurring details
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const assigneeId = url.searchParams.get('assigneeId');
    const collaboratorId = url.searchParams.get('collaboratorId');
    const search = url.searchParams.get('search');
    const isOverdue = url.searchParams.get('isOverdue');

    let tasks = [...memoryTasks];

    // Try DB query if available
    try {
      const session = await auth();
      const workspaceId = (session?.user as any)?.workspaceId;
      if (workspaceId) {
        const dbTasks = await prisma.task.findMany({
          where: { workspaceId, parentId: null },
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
            children: true,
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (dbTasks && dbTasks.length > 0) {
          tasks = dbTasks.map((t: any) => {
            // Parse collaboratorIds from recurRule if encoded as JSON
            let collabIds: string[] = [];
            let recurRuleStr: string | null = t.recurRule;
            try {
              if (t.recurRule && t.recurRule.startsWith('{')) {
                const parsed = JSON.parse(t.recurRule);
                collabIds = parsed.collaboratorIds || [];
                recurRuleStr = parsed.recurRule || null;
              }
            } catch (e) {
              // plain string
            }

            return {
              id: t.id,
              title: t.title,
              description: t.description,
              priority: (t.priority as TaskPriority) || 'MEDIUM',
              status: (t.status as TaskStatus) || 'TODO',
              dueDate: t.dueDate ? t.dueDate.toISOString() : null,
              assigneeId: t.assigneeId,
              assignee: t.assignee,
              collaboratorIds: collabIds,
              collaborators: collabIds.map((cId) => ({
                id: cId,
                name: cId === 'user_2' ? 'Trần Thị B' : 'Lê Hoàng C',
                email: `${cId}@topify.vn`,
              })),
              isRecurring: t.isRecurring,
              recurRule: recurRuleStr,
              subtasks: (t.children || []).map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                isCompleted: ch.status === 'DONE',
              })),
              commentsCount: t._count?.comments || 0,
              attachmentsCount: 0,
              createdAt: t.createdAt.toISOString(),
              updatedAt: t.updatedAt.toISOString(),
            };
          });
        }
      }
    } catch (dbErr) {
      // fallback to memoryTasks
    }

    // Filter logic
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority);
    }
    if (assigneeId) {
      tasks = tasks.filter((t) => t.assigneeId === assigneeId);
    }
    if (collaboratorId) {
      tasks = tasks.filter((t) => t.collaboratorIds?.includes(collaboratorId));
    }
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (isOverdue === 'true') {
      const now = new Date().getTime();
      tasks = tasks.filter(
        (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate).getTime() < now
      );
    }

    return NextResponse.json({
      success: true,
      tasks,
      total: tasks.length,
    });
  } catch (error: any) {
    console.error('[API_TASKS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks - Create new task with collaborators (F124), recurring (F129) and subtasks (F130)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      priority = 'MEDIUM',
      status = 'TODO',
      dueDate,
      assigneeId,
      assigneeName,
      assigneeEmail,
      collaboratorIds = [],
      isRecurring = false,
      recurRule,
      subtasks = [],
      templateId,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề công việc không được để trống' }, { status: 400 });
    }

    const newTask: EnrichedTask = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority as TaskPriority,
      status: (status as TaskStatus) || 'TODO',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId: assigneeId || null,
      assignee: assigneeId
        ? {
            id: assigneeId,
            name: assigneeName || 'Người phụ trách',
            email: assigneeEmail || 'member@topify.vn',
          }
        : null,
      collaboratorIds: Array.isArray(collaboratorIds) ? collaboratorIds : [],
      collaborators: (Array.isArray(collaboratorIds) ? collaboratorIds : []).map((id: string) => ({
        id,
        name: id === 'user_1' ? 'Nguyễn Văn A' : id === 'user_2' ? 'Trần Thị B' : 'Lê Hoàng C',
        email: `${id}@topify.vn`,
      })),
      isRecurring: Boolean(isRecurring),
      recurRule: recurRule || null,
      subtasks: Array.isArray(subtasks)
        ? subtasks.map((s: any, idx: number) => ({
            id: `sub_${Date.now()}_${idx}`,
            title: typeof s === 'string' ? s : s.title,
            isCompleted: false,
          }))
        : [],
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If template was selected, add template steps
    if (templateId) {
      const tpl = BUILT_IN_TASK_TEMPLATES.find((t) => t.id === templateId);
      if (tpl && newTask.subtasks.length === 0) {
        newTask.subtasks = tpl.steps.map((st, i) => ({
          id: `sub_tpl_${Date.now()}_${i}`,
          title: st.title,
          isCompleted: false,
          assigneeName: st.defaultRole,
        }));
      }
    }

    // Try save to database if available
    try {
      const session = await auth();
      const workspaceId = (session?.user as any)?.workspaceId;
      if (workspaceId && session?.user?.id) {
        // Encode collaborators in recurRule JSON
        const encodedRule = JSON.stringify({
          recurRule: recurRule || null,
          collaboratorIds: newTask.collaboratorIds,
        });

        const createdDb = await prisma.task.create({
          data: {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            status: newTask.status,
            dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
            assigneeId: newTask.assigneeId,
            isRecurring: newTask.isRecurring,
            recurRule: encodedRule,
            createdById: session.user.id,
            workspaceId,
          },
        });
        newTask.id = createdDb.id;
      }
    } catch (dbErr) {
      // use memory fallback
    }

    memoryTasks.unshift(newTask);

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Tạo công việc mới thành công',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API_TASKS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tasks - Update task status, priority, assignee, collaborators, subtasks
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, taskId, status, priority, title, description, dueDate, assigneeId, collaboratorIds, subtasks, isRecurring, recurRule } = body;
    const targetId = id || taskId;

    if (!targetId) {
      return NextResponse.json({ error: 'Mã công việc không hợp lệ' }, { status: 400 });
    }

    const index = memoryTasks.findIndex((t) => t.id === targetId);
    if (index !== -1) {
      if (status !== undefined) memoryTasks[index].status = status;
      if (priority !== undefined) memoryTasks[index].priority = priority;
      if (title !== undefined) memoryTasks[index].title = title;
      if (description !== undefined) memoryTasks[index].description = description;
      if (dueDate !== undefined) memoryTasks[index].dueDate = dueDate ? new Date(dueDate).toISOString() : null;
      if (assigneeId !== undefined) {
        memoryTasks[index].assigneeId = assigneeId;
        memoryTasks[index].assignee = assigneeId
          ? {
              id: assigneeId,
              name: assigneeId === 'user_1' ? 'Nguyễn Văn A' : assigneeId === 'user_2' ? 'Trần Thị B' : 'Lê Hoàng C',
              email: `${assigneeId}@topify.vn`,
            }
          : null;
      }
      if (collaboratorIds !== undefined) {
        memoryTasks[index].collaboratorIds = collaboratorIds;
        memoryTasks[index].collaborators = collaboratorIds.map((cId: string) => ({
          id: cId,
          name: cId === 'user_1' ? 'Nguyễn Văn A' : cId === 'user_2' ? 'Trần Thị B' : 'Lê Hoàng C',
          email: `${cId}@topify.vn`,
        }));
      }
      if (subtasks !== undefined) {
        memoryTasks[index].subtasks = subtasks;
      }
      if (isRecurring !== undefined) memoryTasks[index].isRecurring = isRecurring;
      if (recurRule !== undefined) memoryTasks[index].recurRule = recurRule;
      memoryTasks[index].updatedAt = new Date().toISOString();
    }

    // Attempt DB update
    try {
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (isRecurring !== undefined) updateData.isRecurring = isRecurring;

      await prisma.task.update({
        where: { id: targetId },
        data: updateData,
      });
    } catch (e) {
      // ignore db error
    }

    const updatedTask = index !== -1 ? memoryTasks[index] : null;

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Cập nhật công việc thành công',
    });
  } catch (error: any) {
    console.error('[API_TASKS_PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks?id=...
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mã công việc không hợp lệ' }, { status: 400 });
    }

    memoryTasks = memoryTasks.filter((t) => t.id !== id);

    try {
      await prisma.task.delete({ where: { id } });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa công việc thành công',
    });
  } catch (error: any) {
    console.error('[API_TASKS_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
