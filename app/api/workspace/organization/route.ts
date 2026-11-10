import { NextRequest, NextResponse } from 'next/server';
import { workspaceStore } from '@/lib/workspace/workspace-engine';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const org = workspaceStore.getOrganizationStructure();
    return NextResponse.json({ success: true, ...org });
  } catch (error: any) {
    console.error('[API_ORG_GET]', error);
    return NextResponse.json({ error: 'Không thể tải thông tin tổ chức và dự án' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'update_org') {
      const res = workspaceStore.updateOrganization({
        organizationName: body.organizationName,
        workspaceName: body.workspaceName,
      });
      return NextResponse.json(res);
    }

    if (action === 'create_team') {
      if (!body.name || !body.leadEmail) {
        return NextResponse.json({ error: 'Vui lòng nhập tên nhóm và email trưởng nhóm' }, { status: 400 });
      }
      const res = workspaceStore.addTeam({
        name: body.name,
        description: body.description || '',
        leadEmail: body.leadEmail,
      });
      return NextResponse.json(res);
    }

    if (action === 'delete_team') {
      if (!body.teamId) {
        return NextResponse.json({ error: 'Thiếu teamId' }, { status: 400 });
      }
      const res = workspaceStore.deleteTeam(body.teamId);
      return NextResponse.json(res);
    }

    if (action === 'create_project') {
      if (!body.name || !body.deadline) {
        return NextResponse.json({ error: 'Vui lòng nhập tên dự án và thời hạn' }, { status: 400 });
      }
      const res = workspaceStore.addProject({
        name: body.name,
        teamId: body.teamId,
        clientName: body.clientName || 'Nội bộ công ty',
        budget: Number(body.budget) || 0,
        status: body.status || 'IN_PROGRESS',
        deadline: body.deadline,
      });
      return NextResponse.json(res);
    }

    if (action === 'update_project') {
      if (!body.projectId) {
        return NextResponse.json({ error: 'Thiếu projectId' }, { status: 400 });
      }
      const res = workspaceStore.updateProjectProgress(body.projectId, Number(body.progress) || 0, body.status);
      return NextResponse.json(res);
    }

    if (action === 'delete_project') {
      if (!body.projectId) {
        return NextResponse.json({ error: 'Thiếu projectId' }, { status: 400 });
      }
      const res = workspaceStore.deleteProject(body.projectId);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_ORG_POST]', error);
    return NextResponse.json({ error: 'Lỗi xử lý tổ chức và dự án' }, { status: 500 });
  }
}

