import { NextRequest, NextResponse } from 'next/server';
import { evaluateMemberProductivity } from '@/lib/tasks/engine';

export async function GET(req: NextRequest) {
  try {
    // List team members to evaluate
    const teamMembers = [
      { id: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@topify.vn', role: 'Content & Media Lead' },
      { id: 'user_2', name: 'Trần Thị B', email: 'tranthib@topify.vn', role: 'Video Editor & CSKH' },
      { id: 'user_3', name: 'Lê Hoàng C', email: 'lehoangc@topify.vn', role: 'Growth & Ads Specialist' },
    ];

    // Fetch tasks from /api/tasks internally or query direct
    // We can simulate enriched task lists for team member workload calculation
    const allTasks = [
      {
        id: 'task_1',
        assigneeId: 'user_1',
        collaboratorIds: ['user_2', 'user_3'],
        status: 'IN_PROGRESS' as const,
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        priority: 'HIGH' as const,
      },
      {
        id: 'task_2',
        assigneeId: 'user_2',
        collaboratorIds: ['user_1'],
        status: 'TODO' as const,
        dueDate: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        priority: 'URGENT' as const,
      },
      {
        id: 'task_3',
        assigneeId: 'user_3',
        collaboratorIds: ['user_1', 'user_2'],
        status: 'REVIEW' as const,
        dueDate: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), // Overdue
        priority: 'HIGH' as const,
      },
      {
        id: 'task_4',
        assigneeId: 'user_1',
        collaboratorIds: ['user_3'],
        status: 'DONE' as const,
        dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        priority: 'MEDIUM' as const,
      },
      {
        id: 'task_5',
        assigneeId: 'user_2',
        collaboratorIds: [],
        status: 'IN_PROGRESS' as const,
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        priority: 'HIGH' as const,
      },
      {
        id: 'task_6',
        assigneeId: 'user_2',
        collaboratorIds: ['user_3'],
        status: 'IN_PROGRESS' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        priority: 'URGENT' as const,
      },
      {
        id: 'task_7',
        assigneeId: 'user_2',
        collaboratorIds: [],
        status: 'REVIEW' as const,
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        priority: 'URGENT' as const,
      },
      {
        id: 'task_8',
        assigneeId: 'user_2',
        collaboratorIds: [],
        status: 'TODO' as const,
        dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        priority: 'MEDIUM' as const,
      },
    ];

    const memberMetrics = teamMembers.map((member) =>
      evaluateMemberProductivity(member.id, member.name, member.email, member.role, allTasks)
    );

    const totalTeamTasks = allTasks.length;
    const completedTeamTasks = allTasks.filter((t) => t.status === 'DONE').length;
    const overdueTeamTasks = allTasks.filter((t) => {
      if (t.status === 'DONE' || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < Date.now();
    }).length;

    const teamOnTimeRate = totalTeamTasks > 0
      ? Math.round(((totalTeamTasks - overdueTeamTasks) / totalTeamTasks) * 100)
      : 100;

    const teamCompletionRate = totalTeamTasks > 0
      ? Math.round((completedTeamTasks / totalTeamTasks) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalTeamTasks,
        completedTeamTasks,
        overdueTeamTasks,
        teamOnTimeRate,
        teamCompletionRate,
        overloadedMembersCount: memberMetrics.filter((m) => m.isOverloaded).length,
      },
      members: memberMetrics,
    });
  } catch (error: any) {
    console.error('[API_TASKS_PRODUCTIVITY_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
