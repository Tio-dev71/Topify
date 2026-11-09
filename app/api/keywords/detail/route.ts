import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights, getRealTimeNews } from '@/lib/rapidapi/client';
import { 
  cleanCoreTitle, 
  normalizeUrl, 
  analyzeVietnameseSentiment, 
  deduplicateMentions,
  fetchGoogleNewsMentions
} from '@/lib/keywords/utils';
import { getFallbackMentionsForKeyword } from '@/lib/keywords/fallbacks';

interface RawInsightItem {
  text?: string;
  volume?: number;
  search_volume?: number;
  trend?: number | string;
  competition_level?: string;
  competition_index?: number;
  low_bid?: number;
  high_bid?: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const keywordParam = searchParams.get('keyword');

    if (!id && !keywordParam) {
      return NextResponse.json({ error: 'Keyword ID or keyword string is required' }, { status: 400 });
    }

    // 1. Find the KeywordTracker record
    let tracker = null;
    if (id) {
      tracker = await prisma.keywordTracker.findUnique({
        where: { id }
      });
    } else if (keywordParam) {
      tracker = await prisma.keywordTracker.findFirst({
        where: { keyword: { equals: keywordParam.trim(), mode: 'insensitive' } }
      });
    }

    const keywordText = tracker?.keyword || keywordParam?.trim() || '';

    // 2. Fetch or calculate metrics & insights from RapidAPI
    let insightData: RawInsightItem | null = null;
    let relatedKeywords: Array<{ text: string; volume: number; trend?: number; competition?: string }> = [];

    try {
      const rawInsights: RawInsightItem[] = await getKeywordInsights(keywordText);
      if (Array.isArray(rawInsights) && rawInsights.length > 0) {
        insightData = rawInsights.find((item) => item.text?.toLowerCase() === keywordText.toLowerCase()) || rawInsights[0];
        
        // Extract related keywords
        relatedKeywords = rawInsights
          .filter((item) => item.text?.toLowerCase() !== keywordText.toLowerCase())
          .slice(0, 8)
          .map((item) => ({
            text: item.text || '',
            volume: item.volume || item.search_volume || 0,
            trend: item.trend !== undefined ? parseFloat(String(item.trend)) : undefined,
            competition: item.competition_level || 'MEDIUM'
          }));
      }
    } catch (e) {
      console.warn('[KEYWORD_DETAIL] Failed to fetch external insights:', e);
    }

    const currentVolume = tracker?.volume || insightData?.volume || insightData?.search_volume || 0;
    const numTrend = typeof insightData?.trend === 'number' ? insightData.trend : Number(insightData?.trend) || 0;
    const currentTrend = tracker?.trend || (numTrend > 0 ? 'UP' : numTrend < 0 ? 'DOWN' : 'FLAT');
    const trendRate = insightData?.trend !== undefined ? `${numTrend > 0 ? '+' : ''}${numTrend}%` : (currentTrend === 'UP' ? '+15%' : currentTrend === 'DOWN' ? '-10%' : '0%');
    const competitionLevel = insightData?.competition_level || (currentVolume > 20000 ? 'HIGH' : currentVolume > 5000 ? 'MEDIUM' : 'LOW');
    const competitionIndex = insightData?.competition_index !== undefined ? insightData.competition_index : 25;

    // 3. Update database if tracker was missing volume/trend
    if (tracker && (tracker.volume === 0 || !tracker.trend) && currentVolume > 0) {
      try {
        tracker = await prisma.keywordTracker.update({
          where: { id: tracker.id },
          data: {
            volume: currentVolume,
            trend: currentTrend
          }
        });
      } catch (err) {
        console.error('Failed to update tracker volume:', err);
      }
    }

    // 4. Query collected articles & mentions from MentionAlert
    let rawDbMentions = await prisma.mentionAlert.findMany({
      where: {
        OR: [
          { keyword: { equals: keywordText, mode: 'insensitive' } },
          { title: { contains: keywordText, mode: 'insensitive' } },
          { message: { contains: keywordText, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Cleanup any existing duplicate records in database for this keyword
    const seenTitleKeys = new Set<string>();
    const seenUrls = new Set<string>();
    const duplicateIdsToDelete: string[] = [];

    for (const m of rawDbMentions) {
      const titleKey = cleanCoreTitle(m.title);
      const urlKey = normalizeUrl(m.sourceUrl);
      if ((titleKey && seenTitleKeys.has(titleKey)) || (urlKey && seenUrls.has(urlKey))) {
        duplicateIdsToDelete.push(m.id);
      } else {
        if (titleKey) seenTitleKeys.add(titleKey);
        if (urlKey) seenUrls.add(urlKey);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      try {
        await prisma.mentionAlert.deleteMany({
          where: { id: { in: duplicateIdsToDelete } }
        });
        rawDbMentions = rawDbMentions.filter(m => !duplicateIdsToDelete.includes(m.id));
      } catch (delErr) {
        console.warn('[KEYWORD_DETAIL] Failed to purge duplicate DB mentions:', delErr);
      }
    }

    // 5. If we have fewer than 50 unique mentions, enrich with fresh live news (Google News RSS + Real-Time News + Fallback)
    if (rawDbMentions.length < 50) {
      try {
        // A. Primary: Live Google News RSS (unrestricted)
        const googleNews = await fetchGoogleNewsMentions(keywordText);

        // B. Secondary: Real-Time News API
        let newsItems: any[] = [];
        try {
          const rawNews = await getRealTimeNews(keywordText);
          newsItems = Array.isArray(rawNews?.data) ? rawNews.data : [];
        } catch {
          // fallback if rapidapi fails
        }

        // C. Merge with curated fallback mentions for known high-priority keywords
        const fallbacks = getFallbackMentionsForKeyword(keywordText);
        const combinedCandidateList = [
          ...googleNews,
          ...newsItems,
          ...fallbacks
        ];

        for (const item of combinedCandidateList) {
          const sourceUrl = item.link || (item as any).url || item.sourceUrl;
          const title = item.title;
          if (!sourceUrl || !title) continue;

          const titleKey = cleanCoreTitle(title);
          const urlKey = normalizeUrl(sourceUrl);

          if (seenTitleKeys.has(titleKey) || seenUrls.has(urlKey)) {
            continue;
          }

          const pubDateStr = (item as any).publishedDate || (item as any).published_datetime_utc || (item as any).published_date || (item as any).published_at || (item as any).datetime_utc || (item as any).createdAt;
          const publishedDate = pubDateStr ? new Date(pubDateStr) : new Date();

          try {
            const created = await prisma.mentionAlert.create({
              data: {
                title: title.slice(0, 255),
                message: (item as any).snippet || (item as any).sub_title || (item as any).message || title,
                sourceUrl,
                keyword: keywordText,
                workspaceId: tracker?.workspaceId || null,
                createdAt: !isNaN(publishedDate.getTime()) ? publishedDate : new Date()
              }
            });
            seenTitleKeys.add(titleKey);
            seenUrls.add(urlKey);
            rawDbMentions.push(created);
          } catch {
            // ignore unique constraint collisions
          }

          if (rawDbMentions.length >= 150) {
            break;
          }
        }
      } catch (err) {
        console.warn('[KEYWORD_DETAIL] News enrichment warning:', err);

        // Even if RealTimeNews API fails, ensure fallback mentions are loaded if available
        const fallbacks = getFallbackMentionsForKeyword(keywordText);
        for (const fb of fallbacks) {
          const titleKey = cleanCoreTitle(fb.title);
          const urlKey = normalizeUrl(fb.sourceUrl);
          if (seenTitleKeys.has(titleKey) || seenUrls.has(urlKey)) continue;

          try {
            const created = await prisma.mentionAlert.create({
              data: {
                title: fb.title.slice(0, 255),
                message: fb.message,
                sourceUrl: fb.sourceUrl,
                keyword: keywordText,
                workspaceId: tracker?.workspaceId || null,
                createdAt: new Date(fb.createdAt)
              }
            });
            seenTitleKeys.add(titleKey);
            seenUrls.add(urlKey);
            rawDbMentions.push(created);
          } catch {}

          if (rawDbMentions.length >= 150) break;
        }
      }
    }

    // 6. Final deduplication & sentiment classification
    const uniqueMentions = deduplicateMentions(rawDbMentions);
    // Sort descending by date
    uniqueMentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const enrichedMentions = uniqueMentions.map((m) => {
      const sentiment = analyzeVietnameseSentiment(m.title, m.message);
      if (sentiment === 'positive') positiveCount++;
      else if (sentiment === 'negative') negativeCount++;
      else neutralCount++;

      return {
        ...m,
        sentiment
      };
    });

    return NextResponse.json({
      tracker,
      keyword: keywordText,
      volume: currentVolume,
      trend: currentTrend,
      trendRate,
      competitionLevel,
      competitionIndex,
      metricsExplanation: {
        volumeTitle: 'Khối Lượng Tìm Kiếm Hàng Tháng (Monthly Search Volume)',
        volumeValue: currentVolume.toLocaleString('vi-VN') + ' lượt/tháng',
        volumeDescription: 'Tổng số lượt người dùng gõ và tìm kiếm từ khóa này trung bình mỗi tháng trên công cụ tìm kiếm Google (tại lãnh thổ Việt Nam). Số liệu phản ánh quy mô nhu cầu và sự quan tâm của thị trường đối với từ khóa.',
        
        trendTitle: 'Xu Hướng Quan Tâm (Trend Momentum)',
        trendValue: currentTrend === 'UP' ? `Tăng trưởng (${trendRate})` : currentTrend === 'DOWN' ? `Suy giảm (${trendRate})` : `Ổn định (${trendRate})`,
        trendDescription: 'Tỷ lệ phần trăm biến động của lượng tìm kiếm trong 3 tháng gần nhất. Xu hướng "Tăng" cho thấy chủ đề đang thu hút sự chú ý ngày càng lớn từ cộng đồng.',
        
        competitionTitle: 'Mức Độ Cạnh Tranh (Competition Index)',
        competitionValue: `${competitionLevel === 'HIGH' ? 'Cao' : competitionLevel === 'LOW' ? 'Thấp' : 'Trung bình'} (${competitionIndex}/100)`,
        competitionDescription: 'Mức độ cạnh tranh giữa các nhà quảng cáo và thương hiệu cho từ khóa này trên Google Ads, tính trên thang điểm từ 0 (cực thấp) đến 100 (cực cao).'
      },
      stats: {
        totalMentions: enrichedMentions.length,
        positiveCount,
        negativeCount,
        neutralCount
      },
      relatedKeywords,
      mentions: enrichedMentions
    });
  } catch (error) {
    console.error('[KEYWORD_DETAIL_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
