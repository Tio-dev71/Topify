import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { workspaceName } = body;
    const email = user.email.toLowerCase();

    // Check if user already exists in Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email }
    });

    if (dbUser) {
      return NextResponse.json({ success: true, user: dbUser });
    }

    // Check if the user was invited
    const invite = await prisma.allowedEmail.findUnique({
      where: { email }
    });

    if (invite && invite.workspaceId) {
      // User is invited as staff or other role to an existing workspace
      dbUser = await prisma.user.create({
        data: {
          email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          image: user.user_metadata?.avatar_url || '',
          emailVerified: new Date(),
          role: invite.role,
          workspaceId: invite.workspaceId,
        }
      });
    } else {
      // New user registration - no workspace yet
      dbUser = await prisma.user.create({
        data: {
          email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          image: user.user_metadata?.avatar_url || '',
          emailVerified: new Date(),
          role: 'STAFF',
          workspaceId: null,
        }
      });
    }

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error('Failed to sync user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
