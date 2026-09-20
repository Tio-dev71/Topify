import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id || !user.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || !role || !Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Ensure the email doesn't already belong to a user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      if (existingUser.workspaceId === user.workspaceId) {
        return NextResponse.json({ error: 'User is already in this workspace' }, { status: 400 });
      } else if (existingUser.workspaceId) {
         return NextResponse.json({ error: 'User belongs to another workspace' }, { status: 400 });
      }
    }

    const invite = await prisma.allowedEmail.upsert({
      where: { email: email.toLowerCase() },
      update: {
        role: role as Role,
        workspaceId: user.workspaceId,
      },
      create: {
        email: email.toLowerCase(),
        role: role as Role,
        workspaceId: user.workspaceId,
      }
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error('Failed to create invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id || !user.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invites = await prisma.allowedEmail.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Failed to fetch invites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id || !user.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter missing' }, { status: 400 });
    }

    // Ensure they only delete invites for their workspace
    await prisma.allowedEmail.deleteMany({
      where: { 
        email: email.toLowerCase(),
        workspaceId: user.workspaceId
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
