import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getRealTimeNews } from '@/lib/rapidapi/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { keyword, workspaceId } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    // Call RapidAPI
    const rawData = await getRealTimeNews(keyword);
    const newsData = rawData?.data || [];

    let addedCount = 0;

    for (const item of newsData) {
      const sourceUrl = item.link || item.url;
      if (!sourceUrl) continue;

      const title = item.title || 'No Title';
      const message = item.snippet || item.description || '';

      const existingAlert = await prisma.mentionAlert.findFirst({
        where: { sourceUrl }
      });

      if (!existingAlert) {
        await prisma.mentionAlert.create({
          data: {
            title,
            message,
            sourceUrl,
            keyword,
            workspaceId: workspaceId || null,
          }
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Synced successfully. Added ${addedCount} new alerts.` });
  } catch (error) {
    console.error('[ALERTS_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal error or RapidAPI error' }, { status: 500 });
  }
}
