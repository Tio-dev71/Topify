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
  velocityScore: number; // Growth per hour
  growthStatus: 'BREAKOUT' | 'STEADY' | 'PEAKING';
  growthBadge: string;
  thumbnailUrl: string;
}

const SAMPLE_TRENDING_ITEMS: TrendingPostItem[] = [
  {
    id: 'trend_1',
    title: 'Top 3 Nồi Chiên Không Dầu Đang Cháy Hàng Trên Mọi Sàn TMĐT',
    author: 'Bếp Thông Minh Review',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    platform: 'TIKTOK',
    publishedHoursAgo: 8,
    views: 125000,
    likes: 12400,
    comments: 1850,
    shares: 3400,
    velocityScore: 98,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Bùng Nổ (+15,000 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_2',
    title: 'Phối Đồ Đi Làm Thanh Lịch Với Gam Màu Pastel Trẻ Trung',
    author: 'OOTD Công Sở',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    platform: 'INSTAGRAM',
    publishedHoursAgo: 14,
    views: 68000,
    likes: 6200,
    comments: 420,
    shares: 890,
    velocityScore: 86,
    growthStatus: 'STEADY',
    growthBadge: '⚡ Tăng Trưởng Nhanh (+4,800 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_3',
    title: 'Cách Xây Dựng Kênh TikTok Từ Số 0 Lên 100K Followers Trong 30 Ngày',
    author: 'Kinh Doanh Thực Chiến',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    platform: 'YOUTUBE',
    publishedHoursAgo: 20,
    views: 89000,
    likes: 7100,
    comments: 940,
    shares: 1450,
    velocityScore: 91,
    growthStatus: 'BREAKOUT',
    growthBadge: '🔥 Đang Thịnh Hành (+4,400 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
  },
  {
    id: 'trend_4',
    title: 'Trải Nghiệm Dùng Bàn Chải Điện Sonic Sau 1 Năm: Có Đáng Tiền?',
    author: 'Nha Khoa Gia Đình',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    platform: 'FACEBOOK',
    publishedHoursAgo: 32,
    views: 45000,
    likes: 2400,
    comments: 310,
    shares: 480,
    velocityScore: 74,
    growthStatus: 'STEADY',
    growthBadge: '📈 Ổn Định (+1,400 views/h)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=400&fit=crop',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get('platform') || 'ALL').toUpperCase();

    let items: TrendingPostItem[] = [];
    try {
      const posts = await (prisma as any).competitorPost.findMany({
        where: platform !== 'ALL' ? { platform } : undefined,
        orderBy: { viralScore: 'desc' },
        take: 20,
        include: { page: true },
      });
      if (posts && posts.length > 0) {
        items = posts.map((p: any) => ({
          id: p.id,
          title: p.content?.substring(0, 100) || 'Bài viết đối thủ',
          author: p.page?.name || 'Trang đối thủ',
          authorAvatar: p.page?.avatarUrl || undefined,
          platform: (p.platform as any) || 'FACEBOOK',
          publishedHoursAgo: Math.max(1, Math.round((Date.now() - new Date(p.publishedAt).getTime()) / 3600000)),
          views: p.viewsCount || 0,
          likes: p.likesCount || 0,
          comments: p.commentsCount || 0,
          shares: p.sharesCount || 0,
          velocityScore: p.viralScore || 0,
          growthStatus: (p.viralScore || 0) > 85 ? 'BREAKOUT' : 'STEADY',
          growthBadge: (p.viralScore || 0) > 85 ? '🔥 Bùng Nổ' : '⚡ Tăng Trưởng',
          thumbnailUrl: p.mediaUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
        }));
      }
    } catch {
      // Return clean empty array
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      items,
    });
  } catch (error: any) {
    console.error('[API_TRENDING_GET]', error);
    return NextResponse.json({ error: 'Không thể tải nội dung xu hướng' }, { status: 500 });
  }
}
