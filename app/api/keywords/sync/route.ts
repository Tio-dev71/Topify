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
        
        let volume = 0;
        let trend = 'FLAT';
        
        if (Array.isArray(rawData) && rawData.length > 0) {
          // Find the exact match or take the first one
          const match = rawData.find(item => item.text?.toLowerCase() === kw.keyword.toLowerCase()) || rawData[0];
          
          volume = match.volume || match.search_volume || 0;
          
          // Trend is now a number (e.g. 31.6). If trend > 0, it's UP.
          if (match.trend !== undefined && match.trend !== null) {
             const t = parseFloat(match.trend);
             if (t > 0) trend = 'UP';
             else if (t < 0) trend = 'DOWN';
          }
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
