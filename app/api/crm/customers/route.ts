import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import {
  calculateCustomerScore,
  findCustomerDuplicates,
  normalizePhoneNumber,
} from '@/lib/crm/scoring-and-duplicates';

export const dynamic = 'force-dynamic';

// GET /api/crm/customers - List customers with Lead Scoring (F100) and Duplicate Stats (F101)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const temperature = url.searchParams.get('temperature'); // HOT, WARM, COLD
    const sortBy = url.searchParams.get('sortBy') || 'leadScore'; // leadScore, createdAt, name
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
        { tags: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (tag) where.tags = { contains: tag };

    // Fetch all customers for scoring and duplicate scanning
    const rawCustomers = await prisma.customer.findMany({
      where,
      include: {
        deals: { select: { id: true, title: true, value: true, status: true } },
        activities: { select: { id: true, isDone: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate Lead Score & Temperature for each customer (F100)
    let scoredCustomers = rawCustomers.map((customer) => {
      const scoreResult = calculateCustomerScore(customer);
      return {
        ...customer,
        leadScore: scoreResult.leadScore,
        temperature: scoreResult.temperature,
        breakdown: scoreResult.breakdown,
        dealsCount: scoreResult.dealsCount,
        totalDealValue: scoreResult.totalDealValue,
        lastInteractionAt: scoreResult.lastInteractionAt,
      };
    });

    // Check duplicate groups in workspace (F101)
    const duplicateGroups = findCustomerDuplicates(rawCustomers);
    const duplicateCustomerIds = new Set<string>();
    duplicateGroups.forEach((g) => g.customerIds.forEach((id) => duplicateCustomerIds.add(id)));

    // Mark customers who are in duplicate groups
    scoredCustomers = scoredCustomers.map((c) => ({
      ...c,
      isDuplicateCandidate: duplicateCustomerIds.has(c.id),
    }));

    // Stats
    const hotCount = scoredCustomers.filter((c) => c.temperature === 'HOT').length;
    const warmCount = scoredCustomers.filter((c) => c.temperature === 'WARM').length;
    const coldCount = scoredCustomers.filter((c) => c.temperature === 'COLD').length;

    // Filter by temperature if requested
    if (temperature && temperature !== 'ALL') {
      scoredCustomers = scoredCustomers.filter((c) => c.temperature === temperature);
    }

    // Sort
    if (sortBy === 'leadScore') {
      scoredCustomers.sort((a, b) => b.leadScore - a.leadScore);
    } else if (sortBy === 'createdAt') {
      scoredCustomers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'name') {
      scoredCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const total = scoredCustomers.length;
    const paginated = scoredCustomers.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      customers: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: rawCustomers.length,
        hotCount,
        warmCount,
        coldCount,
        duplicateGroupsCount: duplicateGroups.length,
        duplicateCustomersCount: duplicateCustomerIds.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/customers - Create customer with Duplicate Warning check or Seed Demo data
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    // 1. Seed Demo Data for Testing F100 & F101
    if (body.seed) {
      const demoCustomers = [
        {
          name: 'Nguyễn Văn Minh (Khách Sỉ Hà Nội)',
          email: 'minh.nguyen@sihanoi.vn',
          phone: '0988112233',
          source: 'TIKTOK',
          tags: 'Khách sỉ, VIP, Miền Bắc',
          notes: 'Khách hỏi mua số lượng lớn 100 áo gió, cần báo giá sỉ gấp trong tuần này.',
        },
        {
          name: 'Trần Thị Thúy Hằng',
          email: 'hang.tran@gmail.com',
          phone: '0977445566',
          source: 'FACEBOOK',
          tags: 'Khách lẻ, Tiềm năng',
          notes: 'Đã hỏi tư vấn size đầm hoa nhí và xin tài khoản ngân hàng chuyển khoản.',
        },
        {
          name: 'Trần Thúy Hằng (Trùng SĐT)',
          email: 'hangtt_backup@yahoo.com',
          phone: '0977445566', // Trùng SĐT với Hằng ở trên (F101)
          source: 'ZALO',
          tags: 'Zalo lead',
          notes: 'Nhắn qua Zalo hỏi thêm màu vàng của mẫu đầm hoa.',
        },
        {
          name: 'Lê Hoàng Long',
          email: 'long.le@gmail.com',
          phone: '0912998877',
          source: 'MANUAL',
          tags: 'Chưa chốt',
          notes: 'Khách đã từng mua 1 lần cách đây 2 tháng, chưa có tương tác lại.',
        },
        {
          name: 'Le Hoang Long (Trùng Tên & Email)',
          email: 'long.le@gmail.com', // Trùng Email với Long ở trên (F101)
          phone: '0912998800',
          source: 'INSTAGRAM',
          tags: 'Instagram',
          notes: 'Follow qua Reels và hỏi shop có ship COD không.',
        },
      ];

      const createdList = [];
      for (const item of demoCustomers) {
        const c = await prisma.customer.create({
          data: {
            workspaceId,
            name: item.name,
            email: item.email,
            phone: item.phone,
            source: item.source,
            tags: item.tags,
            notes: item.notes,
          },
        });
        createdList.push(c);
      }

      // Also create a demo deal for the first VIP customer so it becomes a HOT LEAD!
      if (createdList.length > 0) {
        let pipeline = await prisma.pipeline.findFirst({
          where: { workspaceId },
          include: { stages: true },
        });

        if (!pipeline) {
          pipeline = await prisma.pipeline.create({
            data: {
              workspaceId,
              name: 'Quy trình bán hàng mặc định',
              isDefault: true,
              stages: {
                create: [
                  { name: 'Mới tiếp cận', sortOrder: 0, color: '#3B82F6' },
                  { name: 'Báo giá', sortOrder: 1, color: '#F59E0B' },
                  { name: 'Thành công', sortOrder: 2, color: '#10B981' },
                ],
              },
            },
            include: { stages: true },
          });
        }

        const stageId = pipeline.stages[0]?.id;
        if (stageId) {
          await prisma.deal.create({
            data: {
              workspaceId,
              title: 'Đơn sỉ 100 áo gió - Nguyễn Văn Minh',
              value: 15000000,
              probability: 80,
              customerId: createdList[0].id,
              pipelineId: pipeline.id,
              stageId,
              ownerId: session.user.id,
              status: 'OPEN',
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        count: createdList.length,
        message: 'Đã nạp 5 khách hàng mẫu kèm dữ liệu trùng lặp để kiểm thử!',
      });
    }

    // 2. Normal customer creation with Duplicate Check Warning (F101)
    const { name, email, phone, tags, source, notes, customData, bypassDuplicateWarning = false } = body;

    const normPhone = normalizePhoneNumber(phone);
    if (!bypassDuplicateWarning) {
      if (normPhone && normPhone.length >= 10) {
        const existingPhone = await prisma.customer.findFirst({
          where: { workspaceId, phone: { contains: normPhone } },
        });
        if (existingPhone) {
          return NextResponse.json(
            {
              error: `Số điện thoại này đã tồn tại trên hồ sơ của khách: "${existingPhone.name}"! Bạn có thể hợp nhất hồ sơ hoặc bật cho phép tạo trùng.`,
              isDuplicateWarning: true,
              existingCustomer: existingPhone,
            },
            { status: 409 }
          );
        }
      }

      if (email && email.trim()) {
        const existingEmail = await prisma.customer.findFirst({
          where: { workspaceId, email: { equals: email.trim(), mode: 'insensitive' } },
        });
        if (existingEmail) {
          return NextResponse.json(
            {
              error: `Địa chỉ email này đã tồn tại trên hồ sơ của khách: "${existingEmail.name}"!`,
              isDuplicateWarning: true,
              existingCustomer: existingEmail,
            },
            { status: 409 }
          );
        }
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        tags,
        source,
        notes,
        customData,
        workspaceId,
      },
    });

    await recordAuditLog({
      action: 'CUSTOMER.CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Thêm khách hàng mới: ${name}`,
        phone,
        email,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/customers?id=...
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const existing = await prisma.customer.findFirst({
      where: { id, workspaceId },
      select: { name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    await recordAuditLog({
      action: 'CUSTOMER.DELETE',
      entityType: 'Customer',
      entityId: id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Xóa thông tin khách hàng: ${existing.name || id}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khách hàng thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/crm/customers - Update customer details
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, phone, tags, source, notes, customData } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const existing = await prisma.customer.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (tags !== undefined) updateData.tags = tags;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (customData !== undefined) updateData.customData = customData;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: { deals: { select: { id: true, title: true, value: true, status: true } } },
    });

    await recordAuditLog({
      action: 'CUSTOMER.UPDATE',
      entityType: 'Customer',
      entityId: customer.id,
      userId: session.user.id,
      workspaceId,
      req,
      metadata: {
        message: `Cập nhật thông tin khách hàng: ${customer.name}`,
        name: customer.name,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
