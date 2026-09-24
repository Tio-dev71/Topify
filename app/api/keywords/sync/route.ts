import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights } from '@/lib/rapidapi/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const keywords = await prisma.keywordTracker.findMany({
      where: workspaceId ? { workspaceId } : {},
    });

    let syncCount = 0;

    for (const kw of keywords) {
      try {
        const rawData = await getKeywordInsights(kw.keyword);
        
        // Basic mapping assuming search volume and trend come in response
        const volume = rawData?.search_volume || rawData?.volume || 0;
        let trend = 'FLAT';
        
        // Compute trend if array of historical volume is provided
        if (rawData?.trend && Array.isArray(rawData.trend)) {
          const last = rawData.trend[rawData.trend.length - 1];
          const prev = rawData.trend[rawData.trend.length - 2];
          if (last > prev) trend = 'UP';
          else if (last < prev) trend = 'DOWN';
        }

        await prisma.keywordTracker.update({
          where: { id: kw.id },
          data: {
            volume,
            trend,
          }
        });
        syncCount++;
      } catch (err) {
        console.error(`Failed to sync keyword ${kw.keyword}:`, err);
      }
    }

    return NextResponse.json({ success: true, message: `Synced ${syncCount} keywords successfully.` });
  } catch (error) {
    console.error('[KEYWORDS_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
