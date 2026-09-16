import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import crypto from 'crypto';

// GET /api/referral - Get referral info
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      include: {
        referred: { select: { name: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no referral code exists, create one
    if (referrals.length === 0) {
      const code = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const referral = await prisma.referral.create({
        data: {
          referrerId: session.user.id,
          code,
        },
        include: {
          referred: { select: { name: true, email: true, createdAt: true } },
        },
      });
      referrals = [referral];
    }

    // Aggregate stats
    const stats = {
      totalClicks: referrals.reduce((sum, r) => sum + r.clicks, 0),
      totalRegistrations: referrals.reduce((sum, r) => sum + r.registrations, 0),
      totalConversions: referrals.reduce((sum, r) => sum + r.conversions, 0),
      totalCommission: referrals.reduce((sum, r) => sum + r.commission, 0),
    };

    return NextResponse.json({ referrals, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
