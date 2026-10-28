import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateConversionFunnel } from '@/lib/analytics/engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get('seed') === 'true';

    let interactions = 0;
    let leads = 0;
    let deals = 0;
    let won = 0;

    if (!seed) {
      try {
        const [customerCount, dealCount, wonDealCount] = await Promise.all([
          prisma.customer.count(),
          prisma.deal.count(),
          prisma.deal.count({ where: { status: 'WON' } }),
        ]);

        leads = customerCount;
        deals = dealCount;
        won = wonDealCount;
        interactions = leads > 0 ? Math.max(100, leads * 25) : 0;
      } catch {
        // Fallback
      }
    } else {
      // Explicit seed request
      interactions = 128500;
      leads = 4120;
      deals = 1350;
      won = 580;
    }

    const funnel = calculateConversionFunnel({
      interactions,
      leads,
      deals,
      won,
    });

    return NextResponse.json({
      success: true,
      funnel,
    });
  } catch (error: any) {
    console.error('[API_FUNNEL_GET]', error);
    return NextResponse.json({ error: 'Không thể tính toán phễu chuyển đổi' }, { status: 500 });
  }
}
