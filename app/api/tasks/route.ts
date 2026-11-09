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

export interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const DEMO_MEMBERS_MAP: Record<string, CollaboratorInfo> = {
  user_1: { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn' },
  user_2: { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn' },
  user_3: { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn' },
};

async function buildWorkspaceMemberMap(workspaceId?: string | null, currentUserId?: string | null): Promise<Map<string, CollaboratorInfo>> {
  const map = new Map<string, CollaboratorInfo>();

  for (const [id, m] of Object.entries(DEMO_MEMBERS_MAP)) {
    map.set(id, m);
    map.set(m.email.toLowerCase(), m);
  }

  try {
    const userOrCond: any[] = [];
    if (workspaceId) userOrCond.push({ workspaceId });
    if (currentUserId) userOrCond.push({ id: currentUserId });

    const [users, allowedEmails] = await Promise.all([
      userOrCond.length > 0 && prisma.user?.findMany
        ? prisma.user.findMany({
            where: { OR: userOrCond },
            select: { id: true, name: true, email: true, image: true },
          })
        : Promise.resolve([]),
      workspaceId && (prisma as any).allowedEmail?.findMany
        ? (prisma as any).allowedEmail.findMany({
            where: { workspaceId },
            select: { id: true, email: true },
          })
        : Promise.resolve([]),
    ]);

    if (Array.isArray(users)) {
      for (const u of users) {
        const info: CollaboratorInfo = {
          id: u.id,
          name: u.name || (u.email ? u.email.split('@')[0] : 'Thành viên'),
          email: u.email || `${u.id}@topify.vn`,
          avatar: u.image || undefined,
        };
        map.set(u.id, info);
        if (u.email) map.set(u.email.toLowerCase(), info);
      }
    }

    if (Array.isArray(allowedEmails)) {
      for (const a of allowedEmails) {
        const info: CollaboratorInfo = {
          id: a.id,
          name: a.email ? a.email.split('@')[0] : 'Thành viên',
          email: a.email || `${a.id}@topify.vn`,
        };
        map.set(a.id, info);
        if (a.email && !map.has(a.email.toLowerCase())) {
          map.set(a.email.toLowerCase(), info);
        }
      }
    }
  } catch (err) {
    console.warn('[TASKS] Failed to load workspace members for task collaborator resolution:', err);
  }

  return map;
}

function resolveCollaborators(
  collabIds: string[],
  providedCollaborators?: CollaboratorInfo[] | null,
  memberMap?: Map<string, CollaboratorInfo>
): CollaboratorInfo[] {
  const ids = Array.isArray(collabIds) ? collabIds : [];
  const providedMap = new Map<string, CollaboratorInfo>();
  if (Array.isArray(providedCollaborators)) {
    for (const c of providedCollaborators) {
      if (c && c.id) {
        providedMap.set(c.id, c);
        if (c.email) providedMap.set(c.email.toLowerCase(), c);
      }
    }
  }

  return ids.map((id) => {
    // 1. If explicit collaborator details were provided with an actual name
    if (providedMap.has(id)) {
      const p = providedMap.get(id)!;
      if (p.name && (p.name !== 'Lê Hoàng C' || id === 'user_3')) {
        return {
          id,
          name: p.name,
          email: p.email || `${id}@topify.vn`,
          avatar: p.avatar,
        };
      }
    }

    // 2. Check workspace member map (registered users & allowedEmails)
    if (memberMap && memberMap.has(id)) {
      return memberMap.get(id)!;
    }
    if (memberMap && memberMap.has(id.toLowerCase())) {
      return memberMap.get(id.toLowerCase())!;
    }

    // 3. Fallback to provided collaborator if available
    if (providedMap.has(id)) {
      const p = providedMap.get(id)!;
      return {
        id,
        name: p.name || (p.email ? p.email.split('@')[0] : 'Thành viên'),
        email: p.email || `${id}@topify.vn`,
        avatar: p.avatar,
      };
    }

    // 4. Email string
    if (id.includes('@')) {
      return {
        id,
        name: id.split('@')[0],
        email: id,
      };
    }

    // 5. Demo IDs
    if (id === 'user_1') return { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn' };
    if (id === 'user_2') return { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn' };
    if (id === 'user_3') return { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn' };

    return {
      id,
      name: 'Thành viên',
      email: `${id}@topify.vn`,
    };
  });
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
        const [dbTasks, memberMap] = await Promise.all([
          prisma.task.findMany({
            where: { workspaceId, parentId: null },
            include: {
              assignee: { select: { id: true, name: true, email: true, image: true } },
              children: true,
              _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          buildWorkspaceMemberMap(workspaceId, session?.user?.id),
        ]);

        if (dbTasks) {
          const mappedDbTasks = dbTasks.map((t: any) => {
            // Parse collaboratorIds and subtasks from recurRule if encoded as JSON
            let collabIds: string[] = [];
            let storedCollaborators: CollaboratorInfo[] = [];
            let recurRuleStr: string | null = t.recurRule;
            let subtasksList: any[] = [];
            try {
              if (t.recurRule && t.recurRule.startsWith('{')) {
                const parsed = JSON.parse(t.recurRule);
                collabIds = parsed.collaboratorIds || [];
                recurRuleStr = parsed.recurRule || null;
                if (Array.isArray(parsed.collaborators)) {
                  storedCollaborators = parsed.collaborators;
                }
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

            let resolvedAssignee = t.assignee;
            if (!resolvedAssignee && t.assigneeId && memberMap.has(t.assigneeId)) {
              const m = memberMap.get(t.assigneeId)!;
              resolvedAssignee = {
                id: m.id,
                name: m.name,
                email: m.email,
                image: m.avatar || null,
              };
            }

            return {
              id: t.id,
              title: t.title,
              description: t.description,
              priority: (t.priority as TaskPriority) || 'MEDIUM',
              status: t.status === 'IN_REVIEW' ? 'REVIEW' : (t.status as TaskStatus) || 'TODO',
              dueDate: t.dueDate ? t.dueDate.toISOString() : null,
              assigneeId: t.assigneeId,
              assignee: resolvedAssignee,
              collaboratorIds: collabIds,
              collaborators: resolveCollaborators(collabIds, storedCollaborators, memberMap),
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
      collaborators = [],
      isRecurring = false,
      recurRule,
      subtasks = [],
      templateId,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề công việc không được để trống' }, { status: 400 });
    }

    // Identify user & workspace
    const session = await auth();
    let workspaceId = (session?.user as any)?.workspaceId;
    let userId = session?.user?.id;

    if (!workspaceId && userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { workspaceId: true },
        });
        workspaceId = dbUser?.workspaceId;
      } catch {}
    }

    if (!workspaceId) {
      try {
        const firstWs = await prisma.workspace.findFirst({ select: { id: true } });
        workspaceId = firstWs?.id;
      } catch {}
    }

    if (!userId) {
      try {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        userId = firstUser?.id;
      } catch {}
    }

    const memberMap = await buildWorkspaceMemberMap(workspaceId, userId);
    const resolvedCollabIds = Array.isArray(collaboratorIds) && collaboratorIds.length > 0
      ? collaboratorIds
      : (Array.isArray(collaborators) ? collaborators.map((c: any) => c.id) : []);
    const resolvedCollaborators = resolveCollaborators(resolvedCollabIds, collaborators, memberMap);

    let resolvedAssignee: any = null;
    if (assigneeId) {
      const found = memberMap.get(assigneeId);
      resolvedAssignee = {
        id: assigneeId,
        name: assigneeName || found?.name || (assigneeId.includes('@') ? assigneeId.split('@')[0] : 'Người phụ trách'),
        email: assigneeEmail || found?.email || `${assigneeId}@topify.vn`,
        image: found?.avatar || null,
      };
    }

    const newTask: EnrichedTask = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority as TaskPriority,
      status: (status as TaskStatus) || 'TODO',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId: assigneeId || null,
      assignee: resolvedAssignee,
      collaboratorIds: resolvedCollabIds,
      collaborators: resolvedCollaborators,
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

    // If template was selected, add template steps and default description if missing
    if (templateId) {
      const tpl = BUILT_IN_TASK_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        if (!newTask.description) {
          newTask.description = tpl.description || null;
        }
        if (newTask.subtasks.length === 0) {
          newTask.subtasks = tpl.steps.map((st, i) => ({
            id: `sub_tpl_${Date.now()}_${i}`,
            title: st.title,
            isCompleted: false,
            assigneeName: st.defaultRole,
          }));
        }
      }
    }

    // Try save to database if available
    try {
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
          collaborators: newTask.collaborators,
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
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
          },
        });
        newTask.id = createdDb.id;
        if (createdDb.assignee) {
          newTask.assignee = createdDb.assignee;
        }

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
    const {
      id,
      taskId,
      status,
      priority,
      title,
      description,
      dueDate,
      assigneeId,
      assigneeName,
      assigneeEmail,
      collaboratorIds,
      collaborators,
      subtasks,
      isRecurring,
      recurRule,
    } = body;
    const targetId = id || taskId;

    if (!targetId) {
      return NextResponse.json({ error: 'Mã công việc không hợp lệ' }, { status: 400 });
    }

    const session = await auth();
    let workspaceId = (session?.user as any)?.workspaceId;
    let userId = session?.user?.id;
    if (!workspaceId && userId) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } });
        workspaceId = dbUser?.workspaceId;
      } catch {}
    }
    const memberMap = await buildWorkspaceMemberMap(workspaceId, userId);

    let resolvedCollabs: CollaboratorInfo[] | undefined;
    if (collaboratorIds !== undefined || collaborators !== undefined) {
      const targetIds = collaboratorIds !== undefined
        ? collaboratorIds
        : (Array.isArray(collaborators) ? collaborators.map((c: any) => c.id) : []);
      resolvedCollabs = resolveCollaborators(targetIds, collaborators, memberMap);
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
        const assignedMember = assigneeId ? memberMap.get(assigneeId) : null;
        memoryTasks[index].assignee = assigneeId
          ? {
              id: assigneeId,
              name: assigneeName || assignedMember?.name || (assigneeId.includes('@') ? assigneeId.split('@')[0] : 'Người phụ trách'),
              email: assigneeEmail || assignedMember?.email || `${assigneeId}@topify.vn`,
            }
          : null;
      }
      if (resolvedCollabs !== undefined) {
        memoryTasks[index].collaboratorIds = resolvedCollabs.map((c) => c.id);
        memoryTasks[index].collaborators = resolvedCollabs;
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

      if (resolvedCollabs !== undefined || subtasks !== undefined || recurRule !== undefined) {
        let currentRule: any = {};
        try {
          const existingDb = await prisma.task.findUnique({ where: { id: targetId }, select: { recurRule: true } });
          if (existingDb?.recurRule && existingDb.recurRule.startsWith('{')) {
            currentRule = JSON.parse(existingDb.recurRule);
          }
        } catch {}

        updateData.recurRule = JSON.stringify({
          recurRule: recurRule !== undefined ? recurRule : (currentRule.recurRule || null),
          collaboratorIds: resolvedCollabs ? resolvedCollabs.map((c) => c.id) : (currentRule.collaboratorIds || []),
          collaborators: resolvedCollabs || currentRule.collaborators || [],
          subtasks: subtasks !== undefined ? subtasks : (currentRule.subtasks || []),
        });
      }

      const updatedDb = await prisma.task.update({
        where: { id: targetId },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      if (index === -1) {
        let collabIds: string[] = [];
        let storedCollaborators: CollaboratorInfo[] = [];
        let recurRuleStr: string | null = updatedDb.recurRule;
        let subtasksList: any[] = [];
        try {
          if (updatedDb.recurRule && updatedDb.recurRule.startsWith('{')) {
            const parsed = JSON.parse(updatedDb.recurRule);
            collabIds = parsed.collaboratorIds || [];
            storedCollaborators = parsed.collaborators || [];
            recurRuleStr = parsed.recurRule || null;
            subtasksList = parsed.subtasks || [];
          }
        } catch {}

        const returnedTask: EnrichedTask = {
          id: updatedDb.id,
          title: updatedDb.title,
          description: updatedDb.description,
          priority: updatedDb.priority as any,
          status: updatedDb.status === 'IN_REVIEW' ? 'REVIEW' : (updatedDb.status as any),
          dueDate: updatedDb.dueDate ? updatedDb.dueDate.toISOString() : null,
          assigneeId: updatedDb.assigneeId,
          assignee: updatedDb.assignee,
          collaboratorIds: collabIds,
          collaborators: resolveCollaborators(collabIds, storedCollaborators, memberMap),
          isRecurring: updatedDb.isRecurring,
          recurRule: recurRuleStr,
          subtasks: subtasksList,
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: updatedDb.createdAt.toISOString(),
          updatedAt: updatedDb.updatedAt.toISOString(),
        };

        return NextResponse.json({
          success: true,
          task: returnedTask,
          message: 'Cập nhật công việc thành công',
        });
      }
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
