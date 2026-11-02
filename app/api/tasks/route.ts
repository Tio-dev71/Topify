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

// In-memory task store (starts clean for testing)
let memoryTasks: EnrichedTask[] = [];

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
      let workspaceId = (session?.user as any)?.workspaceId;
      if (!workspaceId && session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { workspaceId: true },
        });
        workspaceId = dbUser?.workspaceId;
      }
      if (!workspaceId) {
        const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
        workspaceId = firstWs?.id;
      }

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

        if (dbTasks) {
          const mappedDbTasks = dbTasks.map((t: any) => {
            // Parse collaboratorIds and subtasks from recurRule if encoded as JSON
            let collabIds: string[] = [];
            let recurRuleStr: string | null = t.recurRule;
            let subtasksList: any[] = [];
            try {
              if (t.recurRule && t.recurRule.startsWith('{')) {
                const parsed = JSON.parse(t.recurRule);
                collabIds = parsed.collaboratorIds || [];
                recurRuleStr = parsed.recurRule || null;
                if (Array.isArray(parsed.subtasks)) {
                  subtasksList = parsed.subtasks;
                }
              }
            } catch (e) {
              // plain string
            }

            if (t.children && t.children.length > 0) {
              subtasksList = t.children.map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                isCompleted: ch.status === 'DONE',
              }));
            }

            return {
              id: t.id,
              title: t.title,
              description: t.description,
              priority: (t.priority as TaskPriority) || 'MEDIUM',
              status: t.status === 'IN_REVIEW' ? 'REVIEW' : (t.status as TaskStatus) || 'TODO',
              dueDate: t.dueDate ? t.dueDate.toISOString() : null,
              assigneeId: t.assigneeId,
              assignee: t.assignee,
              collaboratorIds: collabIds,
              collaborators: collabIds.map((cId) => ({
                id: cId,
                name: cId === 'user_1' ? 'Nguyễn Văn A' : cId === 'user_2' ? 'Trần Thị B' : 'Lê Hoàng C',
                email: `${cId}@topify.vn`,
              })),
              isRecurring: t.isRecurring,
              recurRule: recurRuleStr,
              subtasks: subtasksList,
              commentsCount: t._count?.comments || 0,
              attachmentsCount: 0,
              createdAt: t.createdAt.toISOString(),
              updatedAt: t.updatedAt.toISOString(),
            };
          });

          // Merge with memoryTasks (avoid duplicate ids)
          const dbIds = new Set(mappedDbTasks.map((t: any) => t.id));
          const nonDbMemory = memoryTasks.filter((t) => !dbIds.has(t.id));
          tasks = [...mappedDbTasks, ...nonDbMemory];
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
      let workspaceId = (session?.user as any)?.workspaceId;
      let userId = session?.user?.id;

      if (!workspaceId && userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { workspaceId: true },
        });
        workspaceId = dbUser?.workspaceId;
      }

      if (!workspaceId) {
        const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
        workspaceId = firstWs?.id;
      }

      if (!userId) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        userId = firstUser?.id;
      }

      if (workspaceId && userId) {
        let validAssigneeId: string | null = null;
        if (newTask.assigneeId) {
          const userExists = await prisma.user.findUnique({ where: { id: newTask.assigneeId } });
          if (userExists) {
            validAssigneeId = newTask.assigneeId;
          }
        }

        // Encode collaborators & subtasks in recurRule JSON
        const encodedRule = JSON.stringify({
          recurRule: recurRule || null,
          collaboratorIds: newTask.collaboratorIds,
          subtasks: newTask.subtasks,
        });

        const createdDb = await prisma.task.create({
          data: {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            status: newTask.status === 'REVIEW' ? 'IN_REVIEW' : (newTask.status as any),
            dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
            assigneeId: validAssigneeId,
            isRecurring: newTask.isRecurring,
            recurRule: encodedRule,
            createdById: userId,
            workspaceId,
          },
        });
        newTask.id = createdDb.id;

        await recordAuditLog({
          action: 'TASK.CREATE',
          entityType: 'Task',
          entityId: createdDb.id,
          userId,
          workspaceId,
          req,
          metadata: {
            title: newTask.title,
            priority: newTask.priority,
            status: newTask.status,
          },
        });
      }
    } catch (dbErr) {
      console.warn('DB Task create fallback to memory:', dbErr);
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
      if (status !== undefined) updateData.status = status === 'REVIEW' ? 'IN_REVIEW' : status;
      if (priority !== undefined) updateData.priority = priority;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) {
        if (assigneeId) {
          const userExists = await prisma.user.findUnique({ where: { id: assigneeId } });
          updateData.assigneeId = userExists ? assigneeId : null;
        } else {
          updateData.assigneeId = null;
        }
      }
      if (isRecurring !== undefined) updateData.isRecurring = isRecurring;

      if (collaboratorIds !== undefined || subtasks !== undefined || recurRule !== undefined) {
        updateData.recurRule = JSON.stringify({
          recurRule: recurRule || null,
          collaboratorIds: collaboratorIds || [],
          subtasks: subtasks || [],
        });
      }

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
