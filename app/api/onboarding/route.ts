import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceName } = await req.json();

    if (!workspaceName) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Check if user already has a workspace
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (currentUser?.workspaceId) {
      return NextResponse.json({ error: 'User already belongs to a workspace' }, { status: 400 });
    }

    // Create the workspace
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        plan: 'FREE',
      }
    });

    // Update user to be ADMIN of the new workspace
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        workspaceId: newWorkspace.id,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ success: true, workspace: newWorkspace });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
