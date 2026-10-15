import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export interface SocialSignalItem {
  id: string;
  author: string;
  authorAvatar?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE';
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viralScore: number;
  sentiment: 'BUYING_INTENT' | 'POSITIVE' | 'NEUTRAL';
  buyingSignalDescription?: string;
  postedAt: string;
  suggestedTags: string[];
}

const SAMPLE_TRENDING_SIGNALS: SocialSignalItem[] = [
  {
    id: 'signal_1',
    author: 'Thời Trang Xu Hướng GenZ',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    platform: 'TIKTOK',
    content: 'Review mẫu áo sơ mi lụa tay bồng chống nhăn cực đỉnh mùa hè này! Ai hỏi link ở đâu thì xem ngay phần bio nhé, mã giảm 20% chỉ còn hôm nay thôi #ootd #trending #review',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
    likesCount: 52400,
    commentsCount: 3820,
    sharesCount: 7100,
    viralScore: 98,
    sentiment: 'BUYING_INTENT',
    buyingSignalDescription: 'Hơn 1,200 bình luận hỏi "shop ở đâu", "còn size M không", "ship HCM bao lâu".',
    postedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    suggestedTags: ['#AoSoMi', '#Trending', '#ReviewThoiTrang', '#SaleHe'],
  },
  {
    id: 'signal_2',
    author: 'Gia Dụng Thông Minh 4.0',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    platform: 'FACEBOOK',
    content: 'Chiếc máy hút bụi mini không dây cầm tay này đã cứu rỗi cuộc đời mình khi dọn xe hơi và góc làm việc. Nhỏ mà lực hút 12000Pa siêu khỏe!',
    mediaUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
    likesCount: 28900,
    commentsCount: 2150,
    sharesCount: 3400,
    viralScore: 89,
    sentiment: 'BUYING_INTENT',
    buyingSignalDescription: '850 bình luận để lại số điện thoại xin báo giá và tư vấn bảo hành.',
    postedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    suggestedTags: ['#GiaDungThongMinh', '#TienIch', '#MayHutBuiMini'],
  },
  {
    id: 'signal_3',
    author: 'Cộng Đồng Review Mỹ Phẩm',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    platform: 'INSTAGRAM',
    content: 'Top 3 kem chống nắng kiềm dầu không nâng tone trắng bệch đáng mua nhất hè 2026. Làn da dầu mụn nhạy cảm nhất định phải lưu lại ngay nha!',
    mediaUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=400&fit=crop',
    likesCount: 34100,
    commentsCount: 1420,
    sharesCount: 4200,
    viralScore: 92,
    sentiment: 'POSITIVE',
    buyingSignalDescription: 'Tương tác thảo luận sôi nổi về thành phần lành tính và phù hợp cho da dầu.',
    postedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    suggestedTags: ['#Skincare', '#KemChongNang', '#ReviewMyPham'],
  },
  {
    id: 'signal_4',
    author: 'Setup Góc Làm Việc & Công Nghệ',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    platform: 'YOUTUBE',
    content: 'Bàn nâng hạ công thái học tự động nhớ 4 vị trí sau 6 tháng sử dụng thực tế: Liệu có đáng đồng tiền bát gạo?',
    mediaUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop',
    likesCount: 19800,
    commentsCount: 890,
    sharesCount: 1250,
    viralScore: 82,
    sentiment: 'POSITIVE',
    buyingSignalDescription: 'Hỏi nhiều về thông số tải trọng và chính sách lắp đặt tại nhà.',
    postedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    suggestedTags: ['#DeskSetup', '#CongThaiHoc', '#WorkFromHome'],
  },
  {
    id: 'signal_5',
    author: 'Trang Tin Xu Hướng Tiêu Dùng',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    platform: 'TIKTOK',
    content: 'Cảnh báo lừa đảo đặt phòng du lịch hè qua mạng! Những chiêu trò tinh vi mới nhất bạn và gia đình cần đề phòng.',
    mediaUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
    likesCount: 45000,
    commentsCount: 2900,
    sharesCount: 12000,
    viralScore: 97,
    sentiment: 'NEUTRAL',
    buyingSignalDescription: 'Cảnh báo cộng đồng, chia sẻ mạnh mẽ giúp tăng uy tín thương hiệu.',
    postedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    suggestedTags: ['#DuLich', '#CanhBao', '#KinhNghiem'],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const platform = (searchParams.get('platform') || 'ALL').toUpperCase();
    const sentiment = (searchParams.get('sentiment') || 'ALL').toUpperCase();
    const sort = searchParams.get('sort') || 'viral';

    // 1. Try to query database CompetitorPosts
    let dbSignals: SocialSignalItem[] = [];
    try {
      const dbPosts = await prisma.competitorPost.findMany({
        where: q
          ? {
              content: { contains: q, mode: 'insensitive' },
            }
          : undefined,
        include: {
          page: true,
        },
        take: 30,
        orderBy: {
          likesCount: 'desc',
        },
      });

      if (dbPosts.length > 0) {
        dbSignals = dbPosts.map((dp) => {
          const rawContent = dp.content || '';
          const hasBuying = /mua|giá|báo giá|ship|shop|ib|inbox|size/i.test(rawContent);
          const totalEngage = dp.likesCount + dp.commentsCount * 2 + dp.sharesCount * 3;
          const viralScore = Math.min(100, Math.max(50, Math.round(Math.log10(Math.max(totalEngage, 1)) * 20)));

          return {
            id: dp.id,
            author: dp.page?.name || 'Trang Đối Thủ',
            authorAvatar: dp.page?.avatar || undefined,
            platform: 'FACEBOOK',
            content: rawContent,
            mediaUrl: dp.mediaUrl || undefined,
            likesCount: dp.likesCount,
            commentsCount: dp.commentsCount,
            sharesCount: dp.sharesCount,
            viralScore,
            sentiment: hasBuying ? 'BUYING_INTENT' : 'POSITIVE',
            buyingSignalDescription: hasBuying ? 'Phát hiện tín hiệu hỏi mua / hỏi giá trong bài viết' : undefined,
            postedAt: dp.postedAt ? dp.postedAt.toISOString() : dp.scrapedAt.toISOString(),
            suggestedTags: ['#Trending', '#ViralPost'],
          };
        });
      }
    } catch {
      //
    }

    // Combine with rich sample trending signals
    let combined = [...SAMPLE_TRENDING_SIGNALS, ...dbSignals];

    // Filter by query
    if (q) {
      combined = combined.filter((item) => {
        const text = `${item.content} ${item.author} ${item.suggestedTags.join(' ')}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Filter by platform
    if (platform !== 'ALL') {
      combined = combined.filter((item) => item.platform.toUpperCase() === platform);
    }

    // Filter by sentiment
    if (sentiment !== 'ALL') {
      combined = combined.filter((item) => item.sentiment === sentiment);
    }

    // Sort
    if (sort === 'latest') {
      combined.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    } else {
      // Default: sort by viralScore desc
      combined.sort((a, b) => b.viralScore - a.viralScore);
    }

    return NextResponse.json({
      success: true,
      total: combined.length,
      signals: combined,
    });
  } catch (error: any) {
    console.error('[API_SOCIAL_SEARCH_GET]', error);
    return NextResponse.json({ error: 'Lỗi tìm kiếm tín hiệu thị trường' }, { status: 500 });
  }
}
