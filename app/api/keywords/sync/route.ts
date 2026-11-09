import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights, getRealTimeNews } from '@/lib/rapidapi/client';
import { recordAuditLog } from '@/lib/audit-log';
import { cleanCoreTitle, normalizeUrl, fetchGoogleNewsMentions } from '@/lib/keywords/utils';
import { getFallbackMentionsForKeyword, getBenchmarkKeywordVolumeAndTrend } from '@/lib/keywords/fallbacks';

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

        if (volume === 0 || trend === 'FLAT') {
          const benchmark = getBenchmarkKeywordVolumeAndTrend(kw.keyword);
          if (volume === 0) volume = benchmark.volume;
          if (trend === 'FLAT') trend = benchmark.trend;
        }

        await prisma.keywordTracker.update({
          where: { id: kw.id },
          data: {
            volume,
            trend,
          }
        });

        // 2. Fetch fresh real-time articles / mentions (unrestricted live feed)
        try {
          const googleNews = await fetchGoogleNewsMentions(kw.keyword);
          let rapidNews: any[] = [];
          try {
            const rawNews = await getRealTimeNews(kw.keyword);
            rapidNews = Array.isArray(rawNews?.data) ? rawNews.data : [];
          } catch (e) {
            console.warn(`[KEYWORD_SYNC] Failed to fetch RapidAPI news for ${kw.keyword}:`, e);
          }

          const fallbacks = getFallbackMentionsForKeyword(kw.keyword);
          const combined = [...googleNews, ...rapidNews, ...fallbacks];
          const seenTitles = new Set<string>();
          const seenUrls = new Set<string>();
          let addedCount = 0;

          for (const item of combined) {
            const sourceUrl = item.link || item.url || (item as any).source_url || item.sourceUrl;
            if (!sourceUrl) continue;
            const title = item.title || (item as any).snippet;
            if (!title) continue;

            const titleKey = cleanCoreTitle(title);
            const urlKey = normalizeUrl(sourceUrl);

            if (seenTitles.has(titleKey) || seenUrls.has(urlKey)) continue;

            const existing = await prisma.mentionAlert.findFirst({
              where: {
                OR: [
                  { sourceUrl },
                  { title: { equals: title, mode: 'insensitive' } }
                ]
              }
            });

            if (!existing) {
              const pubDateStr = (item as any).publishedDate || (item as any).published_datetime_utc || (item as any).published_date || (item as any).published_at || (item as any).datetime_utc || (item as any).createdAt;
              const publishedDate = pubDateStr ? new Date(pubDateStr) : new Date();

              await prisma.mentionAlert.create({
                data: {
                  title: title.slice(0, 255),
                  message: (item as any).snippet || (item as any).sub_title || (item as any).message || title,
                  sourceUrl,
                  keyword: kw.keyword,
                  workspaceId: kw.workspaceId || null,
                  createdAt: !isNaN(publishedDate.getTime()) ? publishedDate : new Date()
                }
              });
              seenTitles.add(titleKey);
              seenUrls.add(urlKey);
              addedCount++;
              if (addedCount >= 150) break;
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
