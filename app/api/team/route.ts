import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/team — List team members (All team members can view)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const members = await prisma.allowedEmail.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Ensure all allowed members have active User accounts with login credentials
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        let user = await prisma.user.findUnique({
          where: { email: m.email },
          select: { id: true, licenseKey: true, password: true, name: true },
        });

        // Auto-provision if User does not exist yet (e.g. minh@topify.vn, abc@company.com)
        if (!user) {
          try {
            const defaultPassword = 'Topify@123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const staffLicenseKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

            user = await prisma.user.create({
              data: {
                email: m.email,
                name: m.email.split('@')[0],
                role: m.role,
                workspaceId: m.workspaceId,
                password: hashedPassword,
                licenseKey: staffLicenseKey,
              },
              select: { id: true, licenseKey: true, password: true, name: true },
            });
          } catch {
            user = await prisma.user.findUnique({
              where: { email: m.email },
              select: { id: true, licenseKey: true, password: true, name: true },
            });
          }
        }

        return {
          id: m.id,
          name: user?.name || m.email.split('@')[0],
          email: m.email,
          role: m.role,
          createdAt: m.createdAt,
          invitedBy: m.invitedBy,
          userId: user?.id,
          licenseKey: user?.licenseKey,
          hasPassword: !!user?.password,
          defaultPassword: 'Topify@123',
        };
      })
    );

    // Also include any workspace Users not in AllowedEmail (e.g. Workspace Owner / Creator)
    try {
      const workspaceUsers = await prisma.user.findMany({
        where: workspaceId ? { workspaceId } : undefined,
        select: { id: true, name: true, email: true, role: true, createdAt: true, licenseKey: true, password: true },
      });

      const existingEmails = new Set(enrichedMembers.map((m) => m.email.toLowerCase()));
      for (const u of workspaceUsers) {
        if (!existingEmails.has(u.email.toLowerCase())) {
          enrichedMembers.push({
            id: u.id,
            name: u.name || u.email.split('@')[0],
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            invitedBy: null,
            userId: u.id,
            licenseKey: u.licenseKey,
            hasPassword: !!u.password,
            defaultPassword: 'Topify@123',
          });
          existingEmails.add(u.email.toLowerCase());
        }
      }
    } catch {
      // Ignore user query failure
    }

    return NextResponse.json({ members: enrichedMembers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/team — Add team member (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const role = body.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    const initialPassword = body.password?.trim() || 'Topify@123';

    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const workspaceId = (session.user as any).workspaceId;

    // Check if already exists in AllowedEmail
    let member = await prisma.allowedEmail.findUnique({
      where: { email },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (member) {
      // Update role & workspace
      member = await prisma.allowedEmail.update({
        where: { id: member.id },
        data: { role, workspaceId },
        include: {
          invitedBy: {
            select: { name: true, email: true },
          },
        },
      });
    } else {
      member = await prisma.allowedEmail.create({
        data: {
          email,
          role,
          invitedById: session.user.id,
          workspaceId,
        },
        include: {
          invitedBy: {
            select: { name: true, email: true },
          },
        },
      });
    }

    // Ensure User account is created/updated with password and licenseKey
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    const staffLicenseKey = `TOP-STAF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role,
        workspaceId,
        password: hashedPassword,
      },
      create: {
        email,
        name: email.split('@')[0],
        role,
        workspaceId,
        password: hashedPassword,
        licenseKey: staffLicenseKey,
      },
      select: {
        id: true,
        email: true,
        role: true,
        licenseKey: true,
      },
    });

    return NextResponse.json({
      ...member,
      userId: user.id,
      licenseKey: user.licenseKey,
      tempPassword: initialPassword,
      hasPassword: true,
      success: true,
      message: `Đã thêm thành viên ${email} thành công!`,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/team — Remove team member (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const member = await prisma.allowedEmail.findUnique({ where: { id } });
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent removing admin
    if (member.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot remove admin' },
        { status: 400 }
      );
    }

    await prisma.allowedEmail.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/team — Update team member role (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, role } = body;

    if (!id || !role || !['ADMIN', 'STAFF'].includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const member = await prisma.allowedEmail.findUnique({ where: { id } });
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Protect self-demotion
    if (member.email === session.user.email && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
    }

    const updated = await prisma.allowedEmail.update({
      where: { id },
      data: { role },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    // Also update the User role if the user has already signed in
    await prisma.user.updateMany({
      where: { email: member.email },
      data: { role },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

