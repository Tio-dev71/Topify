import { NextRequest, NextResponse } from 'next/server';

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

    let items = [...SAMPLE_TRENDING_ITEMS];
    if (platform !== 'ALL') {
      items = items.filter((i) => i.platform === platform);
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
