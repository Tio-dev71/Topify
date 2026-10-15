import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/inbox - List conversations with SLA & Spam awareness
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // NEW, OPEN, PENDING, RESOLVED, CLOSED
    const platform = url.searchParams.get('platform');
    const assignedTo = url.searchParams.get('assignedTo');
    const isSpamParam = url.searchParams.get('isSpam');
    const search = url.searchParams.get('search');
    const slaFilter = url.searchParams.get('sla'); // 'breached', 'urgent'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };

    // Spam handling
    if (isSpamParam === 'true') {
      where.isSpam = true;
    } else if (isSpamParam === 'all') {
      // no filter on isSpam
    } else {
      where.isSpam = false;
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Platform filter
    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    // Assignee filter
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    // Search filter
    if (search && search.trim() !== '') {
      where.OR = [
        { contactName: { contains: search.trim(), mode: 'insensitive' } },
        { messages: { some: { content: { contains: search.trim(), mode: 'insensitive' } } } },
      ];
    }

    // SLA filter
    const now = new Date();
    if (slaFilter === 'breached') {
      where.slaDeadline = { lt: now };
      where.status = { in: ['NEW', 'OPEN', 'PENDING'] };
    } else if (slaFilter === 'urgent') {
      const in15m = new Date(Date.now() + 15 * 60 * 1000);
      where.slaDeadline = { gte: now, lte: in15m };
      where.status = { in: ['NEW', 'OPEN', 'PENDING'] };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          assignedTo: { select: { id: true, name: true, email: true, image: true } },
          _count: {
            select: {
              messages: true,
              notes: true,
            },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Statistics counts
    const [unreadCount, newCount, spamCount, breachedCount] = await Promise.all([
      prisma.message.count({
        where: {
          conversation: { workspaceId, isSpam: false },
          isRead: false,
          direction: 'INBOUND',
        },
      }),
      prisma.conversation.count({
        where: { workspaceId, status: 'NEW', isSpam: false },
      }),
      prisma.conversation.count({
        where: { workspaceId, isSpam: true },
      }),
      prisma.conversation.count({
        where: {
          workspaceId,
          isSpam: false,
          status: { in: ['NEW', 'OPEN', 'PENDING'] },
          slaDeadline: { lt: now },
        },
      }),
    ]);

    return NextResponse.json({
      conversations,
      total,
      unreadCount,
      newCount,
      spamCount,
      breachedCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inbox - Create conversation or seed diverse demo messages for testing
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();

    // Check if simulator seed request
    if (body.seed) {
      const now = Date.now();
      const demoData = [
        {
          contactName: 'Hoàng Minh Tuấn',
          platform: 'TIKTOK_VIDEO' as const,
          status: 'NEW' as const,
          slaDeadline: new Date(now + 12 * 60 * 1000), // Còn 12 phút
          isSpam: false,
          message: 'Chào shop, áo hoodie mẫu mới có size XL không? Mình cao 1m75 nặng 72kg mặc vừa không ạ?',
        },
        {
          contactName: 'Chị Mai Lan (Khách mua sỉ)',
          platform: 'FACEBOOK_POST' as const,
          status: 'OPEN' as const,
          slaDeadline: new Date(now + 4 * 60 * 1000), // Cảnh báo: Còn 4 phút
          isSpam: false,
          message: 'Shop ơi mình muốn lấy sỉ 30 cái đầm hoa nhí, ship về địa chỉ: 120 Cầu Giấy, HN. Số điện thoại của mình: 0988776655, gọi báo giá giúp mình nhé!',
        },
        {
          contactName: 'Lê Thu Trang',
          platform: 'INSTAGRAM_REELS' as const,
          status: 'PENDING' as const,
          slaDeadline: new Date(now - 15 * 60 * 1000), // Quá hạn 15 phút (Breached)
          isSpam: false,
          message: 'Dạ shop ơi đơn hàng mình đặt hôm qua đã đóng gói gửi đi chưa shop?',
        },
        {
          contactName: 'Thành Long - Support',
          platform: 'ZALO_POST' as const,
          status: 'RESOLVED' as const,
          slaDeadline: null,
          isSpam: false,
          message: 'Cảm ơn shop nhiều nhé, mình nhận được hàng rồi, chất vải rất đẹp!',
        },
        {
          contactName: 'Telegram Kiếm Tiền Online',
          platform: 'FACEBOOK_POST' as const,
          status: 'NEW' as const,
          slaDeadline: null,
          isSpam: true,
          message: 'Cơ hội việc làm online thu nhập 500k/ngày tại nhà, inbox t.me/kiemtienonline ngay!',
        },
      ];

      const created = [];
      for (const item of demoData) {
        const conv = await prisma.conversation.create({
          data: {
            workspaceId,
            platform: item.platform,
            contactName: item.contactName,
            status: item.status,
            slaDeadline: item.slaDeadline,
            isSpam: item.isSpam,
            lastMessageAt: new Date(),
            messages: {
              create: {
                direction: 'INBOUND',
                content: item.message,
                senderName: item.contactName,
                isRead: false,
              },
            },
          },
          include: {
            messages: true,
          },
        });
        created.push(conv);
      }

      return NextResponse.json({ success: true, count: created.length, conversations: created });
    }

    const { contactName, platform, message, slaMinutes = 15 } = body;
    if (!contactName || !message) {
      return NextResponse.json({ error: 'contactName and message are required' }, { status: 400 });
    }

    // Default SLA is 15 minutes for new inbound conversations
    const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000);

    const conv = await prisma.conversation.create({
      data: {
        workspaceId,
        platform: platform || 'FACEBOOK_POST',
        contactName,
        status: 'NEW',
        slaDeadline,
        lastMessageAt: new Date(),
        messages: {
          create: {
            direction: 'INBOUND',
            content: message,
            senderName: contactName,
            isRead: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ conversation: conv });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
