import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/calendar/notes - Get notes for calendar view
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    let startDate = url.searchParams.get('start');
    let endDate = url.searchParams.get('end');
    const month = url.searchParams.get('month');
    const userWorkspaceId = (session.user as any).workspaceId;

    if (month && (!startDate || !endDate)) {
      const [yearStr, monthStr] = month.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        startDate = new Date(Date.UTC(y, m - 1, 20)).toISOString();
        endDate = new Date(Date.UTC(y, m + 1, 10)).toISOString();
      }
    }

    const where: any = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      if (userWorkspaceId) {
        where.OR = [
          { workspaceId: userWorkspaceId },
          { createdById: session.user.id },
        ];
      } else {
        where.createdById = session.user.id;
      }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const notes = await prisma.calendarNote.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar/notes - Create a new note
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, content, title, color } = body;
    const workspaceId = (session.user as any).workspaceId || null;
    const createdById = session.user.id;

    if (!date || (!content && !title)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const note = await prisma.calendarNote.create({
      data: {
        date: new Date(date),
        title: title?.trim() || null,
        content: content?.trim() || '',
        color: color || null,
        createdById,
        workspaceId,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
