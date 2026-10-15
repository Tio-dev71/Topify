import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { findCustomerDuplicates } from '@/lib/crm/scoring-and-duplicates';

export const dynamic = 'force-dynamic';

// GET /api/crm/customers/duplicates - Scan and list duplicate groups (F101)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const customers = await prisma.customer.findMany({
      where: { workspaceId },
      include: {
        deals: { select: { id: true, title: true, value: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const duplicateGroups = findCustomerDuplicates(customers);

    return NextResponse.json({
      success: true,
      totalGroups: duplicateGroups.length,
      duplicateGroups,
    });
  } catch (error: any) {
    console.error('Error scanning customer duplicates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
