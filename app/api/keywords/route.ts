import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights, getRealTimeNews } from '@/lib/rapidapi/client';
import { recordAuditLog } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const keywords = await prisma.keywordTracker.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: 'desc' }
    });

    const enrichedKeywords = await Promise.all(
      keywords.map(async (kw) => {
        const mentionCount = await prisma.mentionAlert.count({
          where: {
            OR: [
              { keyword: { equals: kw.keyword, mode: 'insensitive' } },
              { title: { contains: kw.keyword, mode: 'insensitive' } },
              { message: { contains: kw.keyword, mode: 'insensitive' } }
            ]
          }
        });
        return {
          ...kw,
          mentionCount
        };
      })
    );

    return NextResponse.json({ keywords: enrichedKeywords });
  } catch (error) {
    console.error('[KEYWORDS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

interface RawInsightItem {
  text?: string;
  volume?: number;
  search_volume?: number;
  trend?: number | string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { keyword, workspaceId } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const cleanKeyword = keyword.trim();

    // 1. Fetch volume and trend immediately
    let volume = 0;
    let trend = 'FLAT';
    try {
      const rawInsights: RawInsightItem[] = await getKeywordInsights(cleanKeyword);
      if (Array.isArray(rawInsights) && rawInsights.length > 0) {
        const match = rawInsights.find((item) => item.text?.toLowerCase() === cleanKeyword.toLowerCase()) || rawInsights[0];
        volume = match.volume || match.search_volume || 0;
        if (match.trend !== undefined && match.trend !== null) {
          const t = parseFloat(String(match.trend));
          if (t > 0) trend = 'UP';
          else if (t < 0) trend = 'DOWN';
        }
      }
    } catch (e) {
      console.warn('[KEYWORDS_POST] Failed to get initial insights:', e);
    }

    const newKeyword = await prisma.keywordTracker.create({
      data: {
        keyword: cleanKeyword,
        workspaceId: workspaceId || null,
        volume,
        trend,
      }
    });

    // 2. Fetch initial news / mentions for this keyword
    try {
      const rawNews = await getRealTimeNews(cleanKeyword);
      const newsItems = rawNews?.data || [];
      for (const item of newsItems.slice(0, 10)) {
        const sourceUrl = item.link || item.url || item.source_url;
        if (!sourceUrl) continue;
        const title = item.title || item.snippet;
        if (!title) continue;

        const existing = await prisma.mentionAlert.findFirst({
          where: { sourceUrl }
        });

        if (!existing) {
          const pubDateStr = item.published_datetime_utc || item.published_date || item.published_at || item.datetime_utc;
          const publishedDate = pubDateStr ? new Date(pubDateStr) : new Date();

          await prisma.mentionAlert.create({
            data: {
              title: title.slice(0, 255),
              message: item.snippet || item.sub_title || title,
              sourceUrl,
              keyword: cleanKeyword,
              workspaceId: workspaceId || null,
              createdAt: !isNaN(publishedDate.getTime()) ? publishedDate : new Date()
            }
          });
        }
      }
    } catch (e) {
      console.warn('[KEYWORDS_POST] Failed to fetch initial news:', e);
    }

    // Return keyword with mention count
    const mentionCount = await prisma.mentionAlert.count({
      where: {
        OR: [
          { keyword: { equals: cleanKeyword, mode: 'insensitive' } },
          { title: { contains: cleanKeyword, mode: 'insensitive' } },
          { message: { contains: cleanKeyword, mode: 'insensitive' } }
        ]
      }
    });

    await recordAuditLog({
      action: 'KEYWORD.CREATE',
      entityType: 'KeywordTracker',
      entityId: newKeyword.id,
      userId: session.user.id,
      workspaceId: workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Thêm từ khóa theo dõi: ${cleanKeyword}`,
        volume,
        trend
      },
    });

    return NextResponse.json({
      ...newKeyword,
      mentionCount
    });
  } catch (error) {
    console.error('[KEYWORDS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, keyword, volume, trend } = body;

    if (!id) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (keyword !== undefined) updateData.keyword = keyword.trim();
    if (volume !== undefined) updateData.volume = parseInt(String(volume), 10) || 0;
    if (trend !== undefined) updateData.trend = trend;

    const updated = await prisma.keywordTracker.update({
      where: { id },
      data: updateData
    });

    const mentionCount = await prisma.mentionAlert.count({
      where: {
        OR: [
          { keyword: { equals: updated.keyword, mode: 'insensitive' } },
          { title: { contains: updated.keyword, mode: 'insensitive' } },
          { message: { contains: updated.keyword, mode: 'insensitive' } }
        ]
      }
    });

    await recordAuditLog({
      action: 'KEYWORD.UPDATE',
      entityType: 'KeywordTracker',
      entityId: id,
      userId: session.user.id,
      workspaceId: updated.workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Cập nhật từ khóa: ${updated.keyword}` 
      },
    });

    return NextResponse.json({
      ...updated,
      mentionCount
    });
  } catch (error) {
    console.error('[KEYWORDS_PATCH]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    const existing = await prisma.keywordTracker.findUnique({
      where: { id },
      select: { keyword: true, workspaceId: true },
    });

    await prisma.keywordTracker.delete({
      where: { id }
    });

    await recordAuditLog({
      action: 'KEYWORD.DELETE',
      entityType: 'KeywordTracker',
      entityId: id,
      userId: session.user.id,
      workspaceId: existing?.workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Xóa từ khóa: ${existing?.keyword || id}` 
      },
    });

    return NextResponse.json({ message: 'Keyword deleted' });
  } catch (error) {
    console.error('[KEYWORDS_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
