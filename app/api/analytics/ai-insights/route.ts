import { NextRequest, NextResponse } from 'next/server';
import { generateAnalyticsInsights, AnalyticsInsightsInput } from '@/lib/ai/9router';

export async function POST(req: NextRequest) {
  try {
    let body: Partial<AnalyticsInsightsInput> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body
    }

    // Default input if not provided
    const input: AnalyticsInsightsInput = {
      timeframe: body.timeframe || '30_DAYS',
      totalPosts: body.totalPosts ?? 42,
      avgPerformanceScore: body.avgPerformanceScore ?? 78.4,
      topPosts: body.topPosts || [
        { title: 'Top 5 Bí Quyết X2 Doanh Số Bán Hàng Trực Tuyến 2026', score: 95, platform: 'TIKTOK' },
        { title: 'Đập Hộp & Review Chi Tiết Bộ Sản Phẩm Best-Seller Topify', score: 88, platform: 'FACEBOOK' },
        { title: 'Hướng Dẫn 1-Click Tối Ưu Quy Trình Chăm Sóc Khách Hàng', score: 84, platform: 'YOUTUBE' },
      ],
      campaignsRoi: body.campaignsRoi || [
        { name: 'Khai Trương BST Hè 2026', roi: 250, spent: 32000000, revenue: 112000000 },
        { name: 'Flash Sale Cuối Tuần', roi: 105, spent: 14500000, revenue: 29700000 },
        { name: 'Thử Nghiệm Tệp Khách Mới', roi: -21, spent: 9800000, revenue: 7700000 },
      ],
      funnelMetrics: body.funnelMetrics || {
        interactions: 128500,
        leads: 4120,
        deals: 1350,
        won: 580,
        leadConversionRate: 3.2,
        dealWonRate: 43.0,
      },
      channelBenchmarks: body.channelBenchmarks || [
        { platform: 'TIKTOK', avgScore: 90, avgEngagement: 11.2 },
        { platform: 'FACEBOOK', avgScore: 77, avgEngagement: 6.8 },
        { platform: 'YOUTUBE', avgScore: 82, avgEngagement: 8.5 },
        { platform: 'INSTAGRAM', avgScore: 79, avgEngagement: 9.4 },
      ],
    };

    const insightResult = await generateAnalyticsInsights(input);

    return NextResponse.json({
      success: true,
      insights: insightResult,
    });
  } catch (error: any) {
    console.error('[API_AI_INSIGHTS_POST]', error);
    return NextResponse.json({ error: 'Không thể sinh AI Insights' }, { status: 500 });
  }
}
