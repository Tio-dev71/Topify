import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights, getRealTimeNews } from '@/lib/rapidapi/client';
import { recordAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const targetId = searchParams.get('id');
    const targetKeyword = searchParams.get('keyword');

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // empty body is fine
    }

    const keywordId = targetId || bodyData?.id;
    const keywordStr = targetKeyword || bodyData?.keyword;

    let keywords = [];
    if (keywordId) {
      const kw = await prisma.keywordTracker.findUnique({ where: { id: keywordId } });
      if (kw) keywords.push(kw);
    } else if (keywordStr) {
      const kw = await prisma.keywordTracker.findFirst({
        where: { keyword: { equals: keywordStr.trim(), mode: 'insensitive' } }
      });
      if (kw) keywords.push(kw);
    } else {
      keywords = await prisma.keywordTracker.findMany({
        where: workspaceId ? { workspaceId } : {},
      });
    }

    let syncCount = 0;

    for (const kw of keywords) {
      try {
        // 1. Fetch volume and trend
        const rawData = await getKeywordInsights(kw.keyword);
        
        let volume = 0;
        let trend = 'FLAT';
        
        if (Array.isArray(rawData) && rawData.length > 0) {
          const match = rawData.find(item => item.text?.toLowerCase() === kw.keyword.toLowerCase()) || rawData[0];
          volume = match.volume || match.search_volume || 0;
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

        // 2. Fetch fresh articles / mentions
        try {
          const rawNews = await getRealTimeNews(kw.keyword);
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
              const lowerText = `${title} ${item.snippet || ''}`.toLowerCase();
              let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
              if (lowerText.includes('tốt') || lowerText.includes('tăng') || lowerText.includes('thành công') || lowerText.includes('đột phá') || lowerText.includes('vượt')) {
                sentiment = 'positive';
              } else if (lowerText.includes('giảm') || lowerText.includes('lỗi') || lowerText.includes('bị phạt') || lowerText.includes('suy thoái') || lowerText.includes('khủng hoảng') || lowerText.includes('cảnh báo')) {
                sentiment = 'negative';
              }

              await prisma.mentionAlert.create({
                data: {
                  title: title.slice(0, 255),
                  message: item.snippet || item.sub_title || title,
                  sourceUrl,
                  keyword: kw.keyword,
                  workspaceId: kw.workspaceId || null,
                  createdAt: !isNaN(publishedDate.getTime()) ? publishedDate : new Date()
                }
              });
            }
          }
        } catch (newsErr) {
          console.warn(`Failed to sync news for keyword ${kw.keyword}:`, newsErr);
        }

        syncCount++;
      } catch (err) {
        console.error(`Failed to sync keyword ${kw.keyword}:`, err);
      }
    }

    await recordAuditLog({
      action: 'KEYWORD.SYNC',
      entityType: 'KeywordTracker',
      userId: session.user.id,
      workspaceId: workspaceId || (session.user as any).workspaceId,
      req,
      metadata: { 
        message: `Đồng bộ dữ liệu ${syncCount} từ khóa theo dõi`,
        syncCount,
        targetKeyword: keywordStr || undefined
      },
    });

    return NextResponse.json({ success: true, message: `Đồng bộ thành công ${syncCount} từ khóa.` });
  } catch (error) {
    console.error('[KEYWORDS_SYNC_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
