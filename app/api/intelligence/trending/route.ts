import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export interface TrendingPostItem {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE';
  publishedHoursAgo: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  velocityScore: number; // Growth per hour score 0-100
  growthStatus: 'BREAKOUT' | 'STEADY' | 'PEAKING';
  growthBadge: string;
  thumbnailUrl: string;
}

const SAMPLE_TRENDING_ITEMS: TrendingPostItem[] = [
  {
    id: 'trend_1',
    title: 'Top 3 Nồi Chiên Không Dầu Đang Cháy Hàng Trên Mọi Sàn TMĐT Tháng Này',
    author: 'Bếp Thông Minh Review',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    platform: 'TIKTOK',
    publishedHoursAgo: 6,
    views: 185000,
    likes: 19400,
    comments: 2850,
    shares: 4400,
    velocityScore: 98,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Bùng Nổ (+30,000 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_2',
    title: 'Phối Đồ Đi Làm Thanh Lịch & Tôn Dáng Với Gam Màu Pastel Mùa Thu Đông',
    author: 'OOTD Công Sở & Lifestyle',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    platform: 'INSTAGRAM',
    publishedHoursAgo: 12,
    views: 94000,
    likes: 8200,
    comments: 620,
    shares: 1190,
    velocityScore: 89,
    growthStatus: 'STEADY',
    growthBadge: '⚡ Tăng Trưởng Nhanh (+7,800 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_3',
    title: 'Cách Xây Dựng Kênh TikTok Từ Số 0 Lên 100K Followers Trong 30 Ngày Bằng AI',
    author: 'Kinh Doanh Thực Chiến',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    platform: 'YOUTUBE',
    publishedHoursAgo: 18,
    views: 142000,
    likes: 11500,
    comments: 1340,
    shares: 2450,
    velocityScore: 94,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Đang Thịnh Hành (+8,000 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_4',
    title: 'Trải Nghiệm Bàn Chải Điện Sóng Âm Sau 1 Năm Sử Dụng: Có Thực Sự Đáng Tiền?',
    author: 'Chăm Sóc Gia Đình 4.0',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    platform: 'FACEBOOK',
    publishedHoursAgo: 24,
    views: 65000,
    likes: 4200,
    comments: 510,
    shares: 880,
    velocityScore: 82,
    growthStatus: 'STEADY',
    growthBadge: '⚡ Tăng Trưởng (+2,700 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_5',
    title: 'Review Chi Tiết Robot Hút Bụi Lau Nhà Tự Động Giặt Giẻ: Cứu Cánh Cho Mẹ Bỉm Sữa',
    author: 'Gia Dụng Thông Minh',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    platform: 'TIKTOK',
    publishedHoursAgo: 4,
    views: 210000,
    likes: 23000,
    comments: 3100,
    shares: 5200,
    velocityScore: 99,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Siêu Bùng Nổ (+50,000 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_6',
    title: 'Bí Quyết Viết Tiêu Đề Bài Viết Facebook Bán Hàng Tăng 300% Tỷ Lệ Nhấp Chuột',
    author: 'Marketing Tinh Gọn',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop',
    platform: 'FACEBOOK',
    publishedHoursAgo: 10,
    views: 88000,
    likes: 5400,
    comments: 920,
    shares: 1750,
    velocityScore: 87,
    growthStatus: 'STEADY',
    growthBadge: '📈 Đang Lan Tỏa (+8,500 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_7',
    title: '5 Công Thức Bữa Sáng Eat Clean Nhanh Gọn Dưới 15 Phút Cho Người Bận Rộn',
    author: 'Healthy Living VN',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    platform: 'INSTAGRAM',
    publishedHoursAgo: 15,
    views: 76000,
    likes: 7100,
    comments: 480,
    shares: 930,
    velocityScore: 84,
    growthStatus: 'STEADY',
    growthBadge: '⚡ Xu Hướng Sống Khỏe',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_8',
    title: 'Cách Ứng Dụng ChatGPT & AI Tự Động Hóa Chăm Sóc Khách Hàng Và Chốt Đơn 24/7',
    author: 'Kỹ Năng Số & AI',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    platform: 'YOUTUBE',
    publishedHoursAgo: 8,
    views: 115000,
    likes: 9800,
    comments: 1120,
    shares: 2100,
    velocityScore: 92,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Công Nghệ Hot (+14,000 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get('platform') || 'ALL').toUpperCase();

    let dbItems: TrendingPostItem[] = [];
    try {
      const posts = await (prisma as any).competitorPost.findMany({
        where: platform !== 'ALL' ? { platform } : undefined,
        orderBy: { viralScore: 'desc' },
        take: 20,
        include: { page: true },
      });

      if (posts && posts.length > 0) {
        dbItems = posts.map((p: any) => ({
          id: p.id,
          title: p.content?.substring(0, 100) || 'Bài viết nổi bật',
          author: p.page?.name || 'Kênh đối thủ',
          authorAvatar: p.page?.avatarUrl || undefined,
          platform: (p.platform as any) || 'FACEBOOK',
          publishedHoursAgo: Math.max(1, Math.round((Date.now() - new Date(p.publishedAt).getTime()) / 3600000)),
          views: p.viewsCount || 0,
          likes: p.likesCount || 0,
          comments: p.commentsCount || 0,
          shares: p.sharesCount || 0,
          velocityScore: p.viralScore || Math.floor(Math.random() * 25) + 75,
          growthStatus: (p.viralScore || 0) > 85 ? 'BREAKOUT' : 'STEADY',
          growthBadge: (p.viralScore || 0) > 85 ? '🔥 Bùng Nổ' : '⚡ Tăng Trưởng',
          thumbnailUrl: p.mediaUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
        }));
      }
    } catch {
      // Prisma query fallback
    }

    // Combine DB posts with curated sample items
    const sampleFiltered = platform === 'ALL'
      ? SAMPLE_TRENDING_ITEMS
      : SAMPLE_TRENDING_ITEMS.filter((item) => item.platform === platform);

    const allItems = [...dbItems, ...sampleFiltered];
    // Deduplicate by title or id
    const seenTitles = new Set<string>();
    const uniqueItems: TrendingPostItem[] = [];
    for (const item of allItems) {
      const key = item.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        uniqueItems.push(item);
      }
    }

    return NextResponse.json({
      success: true,
      total: uniqueItems.length,
      items: uniqueItems,
    });
  } catch (error: any) {
    console.error('[API_TRENDING_GET]', error);
    return NextResponse.json({ error: 'Không thể tải nội dung xu hướng' }, { status: 500 });
  }
}
