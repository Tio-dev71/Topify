import { NextRequest, NextResponse } from 'next/server';
import { calculateInternalBenchmarks, PostPerformanceMetrics } from '@/lib/analytics/engine';

export async function GET(req: NextRequest) {
  try {
    // Sample diverse platform post records for benchmarking
    const benchmarkPosts: PostPerformanceMetrics[] = [
      // TikTok (High viral, young audience)
      {
        id: 'tt_1',
        title: 'Video biến hình xu hướng TikTok 2026',
        platform: 'TIKTOK_VIDEO',
        publishedAt: new Date().toISOString(),
        reach: 85000,
        views: 92000,
        likes: 7800,
        comments: 640,
        shares: 1200,
        clicks: 2200,
        conversions: 45,
        reachScore: 30,
        engagementScore: 38,
        clickScore: 18,
        conversionScore: 10,
        overallScore: 96,
        tier: 'VIRAL',
      },
      {
        id: 'tt_2',
        title: 'Mẹo phối đồ công sở phong cách Gen Z',
        platform: 'TIKTOK_VIDEO',
        publishedAt: new Date().toISOString(),
        reach: 42000,
        views: 45000,
        likes: 3600,
        comments: 310,
        shares: 450,
        clicks: 980,
        conversions: 18,
        reachScore: 28,
        engagementScore: 32,
        clickScore: 16,
        conversionScore: 8,
        overallScore: 84,
        tier: 'GOOD',
      },
      // Facebook (Broad audience, strong comments/conversions)
      {
        id: 'fb_1',
        title: 'Bí quyết đầu tư thông minh và quản lý tài chính cá nhân',
        platform: 'FACEBOOK_POST',
        publishedAt: new Date().toISOString(),
        reach: 38000,
        views: 41000,
        likes: 2400,
        comments: 480,
        shares: 520,
        clicks: 1200,
        conversions: 32,
        reachScore: 26,
        engagementScore: 30,
        clickScore: 18,
        conversionScore: 10,
        overallScore: 84,
        tier: 'GOOD',
      },
      {
        id: 'fb_2',
        title: 'Feedback khách hàng sử dụng dịch vụ tháng qua',
        platform: 'FACEBOOK_REELS',
        publishedAt: new Date().toISOString(),
        reach: 25000,
        views: 27000,
        likes: 1500,
        comments: 210,
        shares: 180,
        clicks: 650,
        conversions: 14,
        reachScore: 24,
        engagementScore: 26,
        clickScore: 14,
        conversionScore: 6,
        overallScore: 70,
        tier: 'GOOD',
      },
      // Instagram (High visual aesthetics, luxury segment)
      {
        id: 'ig_1',
        title: 'Bộ sưu tập ảnh phong cách Minimalism tại Studio',
        platform: 'INSTAGRAM_REELS',
        publishedAt: new Date().toISOString(),
        reach: 29000,
        views: 31000,
        likes: 2800,
        comments: 140,
        shares: 210,
        clicks: 720,
        conversions: 12,
        reachScore: 25,
        engagementScore: 34,
        clickScore: 15,
        conversionScore: 5,
        overallScore: 79,
        tier: 'GOOD',
      },
      // YouTube Shorts (Longer evergreen shelf-life)
      {
        id: 'yt_1',
        title: 'Cách thiết lập bàn làm việc chuẩn công thái học',
        platform: 'YOUTUBE_SHORTS',
        publishedAt: new Date().toISOString(),
        reach: 34000,
        views: 38000,
        likes: 2600,
        comments: 290,
        shares: 340,
        clicks: 850,
        conversions: 20,
        reachScore: 27,
        engagementScore: 31,
        clickScore: 16,
        conversionScore: 8,
        overallScore: 82,
        tier: 'GOOD',
      },
    ];

    const benchmarks = calculateInternalBenchmarks(benchmarkPosts);

    // Pillar comparison
    const pillarComparison = [
      { pillar: 'Giáo dục & Hướng dẫn (Educational)', avgScore: 86, totalPosts: 14, leadsGenerated: 142 },
      { pillar: 'Giải trí & Bắt Trend (Entertainment)', avgScore: 91, totalPosts: 18, leadsGenerated: 98 },
      { pillar: 'Giới thiệu sản phẩm (Product Launch)', avgScore: 74, totalPosts: 12, leadsGenerated: 185 },
      { pillar: 'Bằng chứng xã hội / Review (Social Proof)', avgScore: 81, totalPosts: 8, leadsGenerated: 110 },
    ];

    return NextResponse.json({
      success: true,
      channels: benchmarks,
      pillars: pillarComparison,
    });
  } catch (error: any) {
    console.error('[API_BENCHMARK_GET]', error);
    return NextResponse.json({ error: 'Không thể tính toán so sánh Benchmark' }, { status: 500 });
  }
}
