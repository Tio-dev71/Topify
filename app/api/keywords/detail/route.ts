import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getKeywordInsights, getRealTimeNews } from '@/lib/rapidapi/client';

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
    let mentions = await prisma.mentionAlert.findMany({
      where: {
        OR: [
          { keyword: { equals: keywordText, mode: 'insensitive' } },
          { title: { contains: keywordText, mode: 'insensitive' } },
          { message: { contains: keywordText, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // 5. If no mentions exist yet, auto-fetch initial real-time news so the user immediately has content
    if (mentions.length === 0) {
      try {
        const rawNews = await getRealTimeNews(keywordText);
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
                keyword: keywordText,
                workspaceId: tracker?.workspaceId || null,
                createdAt: !isNaN(publishedDate.getTime()) ? publishedDate : new Date()
              }
            });
          }
        }

        // Re-query mentions
        mentions = await prisma.mentionAlert.findMany({
          where: {
            OR: [
              { keyword: { equals: keywordText, mode: 'insensitive' } },
              { title: { contains: keywordText, mode: 'insensitive' } },
              { message: { contains: keywordText, mode: 'insensitive' } }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
      } catch (err) {
        console.warn('[KEYWORD_DETAIL] Auto news fetch failed:', err);
      }
    }

    // 6. Calculate sentiment statistics
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const enrichedMentions = mentions.map((m) => {
      const lower = `${m.title} ${m.message || ''}`.toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (lower.includes('tốt') || lower.includes('tăng') || lower.includes('thành công') || lower.includes('đột phá') || lower.includes('vượt') || lower.includes('lợi nhuận')) {
        sentiment = 'positive';
        positiveCount++;
      } else if (lower.includes('giảm') || lower.includes('lỗi') || lower.includes('phạt') || lower.includes('suy thoái') || lower.includes('khủng hoảng') || lower.includes('cảnh báo') || lower.includes('tiêu cực')) {
        sentiment = 'negative';
        negativeCount++;
      } else {
        neutralCount++;
      }
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
