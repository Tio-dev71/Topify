import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getRealTimeNews } from '@/lib/rapidapi/client';

interface NewsArticleItem {
  link?: string;
  url?: string;
  source_url?: string;
  title?: string;
  snippet?: string;
  description?: string;
  sub_title?: string;
  published_datetime_utc?: string;
  published_date?: string;
  published_at?: string;
  datetime_utc?: string;
  datetime?: string;
  timestamp?: string;
  date?: string;
  sub_articles?: NewsArticleItem[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { keyword, workspaceId, clearPrevious } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const cleanKeyword = keyword.trim();
    const userWithWorkspace = session.user as { workspaceId?: string };
    const effectiveWorkspaceId = userWithWorkspace?.workspaceId || workspaceId || null;

    // Nếu người dùng yêu cầu làm mới session (xóa kết quả cũ để theo dõi từ khóa mới sạch sẽ)
    if (clearPrevious) {
      await prisma.mentionAlert.deleteMany({
        where: effectiveWorkspaceId ? {
          workspaceId: effectiveWorkspaceId
        } : {}
      });
    }

    // Call RapidAPI Real-Time News
    const rawData = await getRealTimeNews(cleanKeyword);
    const newsData: NewsArticleItem[] = rawData?.data || [];

    let addedCount = 0;

    const processArticleItem = async (item: NewsArticleItem) => {
      const sourceUrl = item.link || item.url || item.source_url;
      if (!sourceUrl) return;

      const title = item.title || 'No Title';
      const message = item.snippet || item.description || item.sub_title || '';

      // Trích xuất chính xác thời gian đăng bài thực tế từ nguồn phát
      const rawPublishedDate = 
        item.published_datetime_utc || 
        item.published_date || 
        item.published_at || 
        item.datetime_utc || 
        item.datetime || 
        item.timestamp || 
        item.date;

      let publishedDate: Date = new Date();
      if (rawPublishedDate) {
        const parsed = new Date(rawPublishedDate);
        if (!isNaN(parsed.getTime())) {
          publishedDate = parsed;
        }
      }

      const existingAlert = await prisma.mentionAlert.findFirst({
        where: { sourceUrl }
      });

      if (!existingAlert) {
        await prisma.mentionAlert.create({
          data: {
            title,
            message,
            sourceUrl,
            keyword: cleanKeyword,
            workspaceId: effectiveWorkspaceId,
            createdAt: publishedDate, // Lưu chuẩn xác thời gian xuất bản gốc của bài viết
          }
        });
        addedCount++;
      } else {
        // Cập nhật lại thời gian chuẩn nếu bài viết đã tồn tại trong DB
        if (rawPublishedDate) {
          await prisma.mentionAlert.update({
            where: { id: existingAlert.id },
            data: { createdAt: publishedDate }
          });
        }
      }
    };

    for (const item of newsData) {
      await processArticleItem(item);
      if (Array.isArray(item.sub_articles)) {
        for (const subItem of item.sub_articles) {
          await processArticleItem(subItem);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Quét thời gian thực thành công. Đã cập nhật ${addedCount} đề cập mới cho "${cleanKeyword}".`,
      count: addedCount,
      keyword: cleanKeyword
    });
  } catch (error) {
    console.error('[ALERTS_SYNC_POST]', error);
    return NextResponse.json({ error: 'Lỗi khi kết nối dịch vụ quét tin tức thời gian thực.' }, { status: 500 });
  }
}

