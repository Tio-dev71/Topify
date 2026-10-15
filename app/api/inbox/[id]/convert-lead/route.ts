import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/inbox/[id]/convert-lead - 1-Click convert conversation to CRM Customer & Deal (F089)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();

    const conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Hội thoại không tồn tại' }, { status: 404 });
    }

    const {
      name = conversation.contactName || 'Khách hàng tiềm năng',
      phone,
      email,
      dealTitle = `Đơn hàng từ ${conversation.contactName || 'Chat'}`,
      dealValue = 500000,
      notes,
    } = body;

    // 1. Find or create Customer
    let customer = null;
    if (phone) {
      customer = await prisma.customer.findFirst({
        where: { workspaceId, phone },
      });
    }

    if (!customer && email) {
      customer = await prisma.customer.findFirst({
        where: { workspaceId, email },
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          workspaceId,
          name,
          phone: phone || null,
          email: email || null,
          source: conversation.platform || 'INBOX',
          notes: notes || `Tạo tự động từ hội thoại Topify Inbox`,
        },
      });
    } else {
      // Update phone/email if missing
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: customer.phone || phone || null,
          email: customer.email || email || null,
        },
      });
    }

    // 2. Find or create default Pipeline & Stage
    let pipeline = await prisma.pipeline.findFirst({
      where: { workspaceId },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          workspaceId,
          name: 'Quy trình bán hàng mặc định',
          isDefault: true,
          stages: {
            create: [
              { name: 'Mới tiếp cận / Tiềm năng', sortOrder: 0, color: '#3B82F6' },
              { name: 'Đang tư vấn / Báo giá', sortOrder: 1, color: '#F59E0B' },
              { name: 'Chốt đơn thành công', sortOrder: 2, color: '#10B981' },
            ],
          },
        },
        include: { stages: { orderBy: { sortOrder: 'asc' } } },
      });
    }

    const stageId = pipeline.stages[0]?.id;
    if (!stageId) {
      return NextResponse.json({ error: 'Không tìm thấy giai đoạn bán hàng' }, { status: 500 });
    }

    // 3. Create Deal in CRM
    const deal = await prisma.deal.create({
      data: {
        workspaceId,
        title: dealTitle,
        value: Number(dealValue) || 0,
        probability: 50,
        customerId: customer.id,
        pipelineId: pipeline.id,
        stageId,
        ownerId: session.user.id,
        status: 'OPEN',
      },
    });

    // 4. Link conversation to customer
    await prisma.conversation.update({
      where: { id },
      data: {
        contactId: customer.id,
      },
    });

    return NextResponse.json({
      success: true,
      customer,
      deal,
      message: 'Đã tạo Lead và Deal CRM thành công!',
    });
  } catch (error: any) {
    console.error('Error converting lead to CRM:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
