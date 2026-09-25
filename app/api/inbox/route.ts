import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/inbox - List conversations
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const platform = url.searchParams.get('platform');
    const assignedTo = url.searchParams.get('assignedTo');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId, isSpam: false };
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (assignedTo) where.assignedToId = assignedTo;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          assignedTo: { select: { name: true, email: true, image: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Count unread
    const unreadCount = await prisma.message.count({
      where: {
        conversation: { workspaceId },
        isRead: false,
        direction: 'INBOUND',
      },
    });

    return NextResponse.json({
      conversations,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inbox - Create conversation with initial message or seed demo messages
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
      const demoData = [
        {
          contactName: 'Nguyễn Văn An',
          platform: 'FACEBOOK_POST' as const,
          message: 'Chào shop, mẫu áo khoác gió bên mình còn size L màu đen không ạ?',
        },
        {
          contactName: 'Trần Thị Mai Linh',
          platform: 'TIKTOK_VIDEO' as const,
          message: 'Shop ơi có ship hỏa tốc trong nội thành Hà Nội trong hôm nay được không?',
        },
        {
          contactName: 'Lê Hoàng Nam',
          platform: 'ZALO_POST' as const,
          message: 'Cho mình xin bảng giá sỉ từ 50 cái trở lên với nhé, mình mở shop ở Đà Nẵng.',
        },
      ];

      const created = [];
      for (const item of demoData) {
        const conv = await prisma.conversation.create({
          data: {
            workspaceId,
            platform: item.platform,
            contactName: item.contactName,
            status: 'NEW',
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

    const { contactName, platform, message } = body;
    if (!contactName || !message) {
      return NextResponse.json({ error: 'contactName and message are required' }, { status: 400 });
    }

    const conv = await prisma.conversation.create({
      data: {
        workspaceId,
        platform: platform || 'FACEBOOK_POST',
        contactName,
        status: 'NEW',
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

    return NextResponse.json(conv, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inbox?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.conversation.deleteMany({
      where: { id, workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
