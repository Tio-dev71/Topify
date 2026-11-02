import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: 'INBOX' | 'FORM' | 'IMPORT' | 'REFERRAL';
  sourceDetail: string;
  status: 'NEW' | 'CONTACTING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
  leadScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  demand: string;
  estimatedValue: number;
  assignedTo?: string;
  assignedAvatar?: string;
  notes?: string;
  createdAt: string;
  convertedCustomerId?: string;
  convertedDealId?: string;
}

// Default initial leads demonstrating all 4 channels: Inbox, Form, Import, Referral
let initialLeads: LeadItem[] = [
  {
    id: 'lead_inbox_1',
    name: 'Nguyễn Hoàng Nam',
    phone: '0988112233',
    email: 'nam.nguyen@techcorp.vn',
    company: 'TechCorp Vietnam',
    source: 'INBOX',
    sourceDetail: 'Inbox Fanpage Topify - Tin nhắn Messenger',
    status: 'NEW',
    leadScore: 88,
    temperature: 'HOT',
    demand: 'Quan tâm phần mềm quản lý nội dung đa kênh & kết nối CRM',
    estimatedValue: 15000000,
    assignedTo: 'Nguyễn Văn A',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    notes: 'Khách nhắn hỏi từ chiến dịch quảng cáo Facebook, cần tư vấn gói doanh nghiệp 1 năm.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'lead_form_1',
    name: 'Đặng Thùy Dung',
    phone: '0977445566',
    email: 'thuydung.haian@gmail.com',
    company: 'Công ty Cổ phần May Mặc Hải An',
    source: 'FORM',
    sourceDetail: 'Web Form Thu Lead (F102) - Landing Page Nhận Báo Giá',
    status: 'CONTACTING',
    leadScore: 92,
    temperature: 'HOT',
    demand: 'Yêu cầu báo giá đặt may 300 áo polo đồng phục cao cấp cho sự kiện Q4',
    estimatedValue: 45000000,
    assignedTo: 'Trần Thị B',
    assignedAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    notes: 'Đã gửi email catalog mẫu vải, hẹn gọi lại lúc 14:00 chiều nay.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'lead_import_1',
    name: 'Trần Văn Bình',
    phone: '0912334455',
    email: 'binh.tran@vietlogistics.com',
    company: 'Việt Logistics & Supply Chain',
    source: 'IMPORT',
    sourceDetail: 'Nhập từ file Excel: Danh_sach_hoi_thao_TechExpo_T11.xlsx',
    status: 'QUALIFIED',
    leadScore: 78,
    temperature: 'WARM',
    demand: 'Tìm giải pháp gửi tin Zalo ZNS và quản lý quy trình CSKH tự động',
    estimatedValue: 24000000,
    assignedTo: 'Lê Hoàng C',
    assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    notes: 'Thu thập từ quầy triển lãm số 12, đã xác nhận người phụ trách công nghệ thông tin.',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'lead_referral_1',
    name: 'Lê Thị Mai Anh',
    phone: '0903889900',
    email: 'maianh.le@fintechvn.com',
    company: 'Fintech Solutions Group',
    source: 'REFERRAL',
    sourceDetail: 'Giới thiệu bởi Đối tác Kế toán Minh Đức (Mã ref: REF-MINHDUC)',
    status: 'QUALIFIED',
    leadScore: 95,
    temperature: 'HOT',
    demand: 'Triển khai toàn diện Topify cho 5 chi nhánh bán lẻ đồ gia dụng thông minh',
    estimatedValue: 68000000,
    assignedTo: 'Nguyễn Văn A',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    notes: 'Đối tác giới thiệu đánh giá cao khả năng Social Listening và chốt sale đa kênh.',
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
  {
    id: 'lead_inbox_2',
    name: 'Vũ Đức Thắng',
    phone: '0933556677',
    email: 'thangvu@shoppro.vn',
    company: 'ShopPro Thời Trang Trẻ',
    source: 'INBOX',
    sourceDetail: 'Inbox TikTok Shop Live - Khách hỏi bot tự động chốt đơn',
    status: 'NEW',
    leadScore: 72,
    temperature: 'WARM',
    demand: 'Hỏi tính năng tự động quét comment và gửi tin nhắn chốt đơn trên livestream',
    estimatedValue: 8500000,
    assignedTo: 'Trần Thị B',
    assignedAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    notes: 'Đang chạy 3 kênh TikTok Shop, mỗi phiên live có ~400 mắt xem.',
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
  {
    id: 'lead_form_2',
    name: 'Hoàng Nhật Minh',
    phone: '0944778899',
    email: 'nhatminh@fnbviet.com',
    company: 'Chuỗi Cà phê F&B Sài Gòn',
    source: 'FORM',
    sourceDetail: 'Web Form Thu Lead (F102) - Form Nhận Ebook & Dùng Thử',
    status: 'CONVERTED',
    leadScore: 90,
    temperature: 'HOT',
    demand: 'Đăng ký dùng thử hệ thống chăm sóc khách hàng tự động & đo lường ROI',
    estimatedValue: 18000000,
    assignedTo: 'Nguyễn Văn A',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    notes: 'Đã hoàn tất chuyển đổi thành Khách hàng chính thức và khởi tạo Deal bán hàng.',
    createdAt: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
  },
];

// Helper to compute stats
function computeLeadStats(leads: LeadItem[]) {
  const total = leads.length;
  const inboxCount = leads.filter((l) => l.source === 'INBOX').length;
  const formCount = leads.filter((l) => l.source === 'FORM').length;
  const importCount = leads.filter((l) => l.source === 'IMPORT').length;
  const referralCount = leads.filter((l) => l.source === 'REFERRAL').length;

  const newCount = leads.filter((l) => l.status === 'NEW').length;
  const contactingCount = leads.filter((l) => l.status === 'CONTACTING').length;
  const qualifiedCount = leads.filter((l) => l.status === 'QUALIFIED').length;
  const unqualifiedCount = leads.filter((l) => l.status === 'UNQUALIFIED').length;
  const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;

  const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
  const totalEstimatedValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

  return {
    total,
    inboxCount,
    formCount,
    importCount,
    referralCount,
    newCount,
    contactingCount,
    qualifiedCount,
    unqualifiedCount,
    convertedCount,
    conversionRate,
    totalEstimatedValue,
  };
}

// GET /api/crm/leads - List leads with multi-source filtering (F092)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source'); // INBOX, FORM, IMPORT, REFERRAL, ALL
    const status = searchParams.get('status'); // NEW, CONTACTING, QUALIFIED, UNQUALIFIED, CONVERTED, ALL
    const search = searchParams.get('search')?.toLowerCase().trim();
    const assignedTo = searchParams.get('assignedTo');
    const workspaceId = (session.user as any).workspaceId;

    // Check DB customers that have lead tag or source
    let dbLeads: LeadItem[] = [];
    try {
      const customers = await prisma.customer.findMany({
        where: {
          workspaceId: workspaceId || undefined,
          OR: [
            { tags: { contains: 'LEAD', mode: 'insensitive' } },
            { tags: { contains: 'F092', mode: 'insensitive' } },
            { source: { in: ['INBOX', 'FORM', 'IMPORT', 'REFERRAL', 'LANDING_PAGE'] } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (customers && customers.length > 0) {
        dbLeads = customers.map((c: any) => {
          const rawSource = (c.source || 'INBOX').toUpperCase();
          const cleanSource: LeadItem['source'] =
            rawSource === 'FORM' || rawSource === 'LANDING_PAGE'
              ? 'FORM'
              : rawSource === 'IMPORT'
              ? 'IMPORT'
              : rawSource === 'REFERRAL'
              ? 'REFERRAL'
              : 'INBOX';

          const custom = (c.customData as any) || {};
          return {
            id: c.id,
            name: c.name || 'Khách tiềm năng mới',
            phone: c.phone || 'Chưa có SĐT',
            email: c.email || undefined,
            company: custom.company || undefined,
            source: cleanSource,
            sourceDetail: custom.sourceDetail || `Kênh ${cleanSource}`,
            status: custom.leadStatus || 'NEW',
            leadScore: custom.leadScore || 80,
            temperature: custom.leadScore >= 85 ? 'HOT' : custom.leadScore >= 60 ? 'WARM' : 'COLD',
            demand: custom.demand || c.notes || 'Cần tư vấn dịch vụ',
            estimatedValue: Number(custom.estimatedValue) || 10000000,
            assignedTo: custom.assignedTo || 'Chưa phân công',
            assignedAvatar: custom.assignedAvatar,
            notes: c.notes || undefined,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
            convertedCustomerId: custom.convertedCustomerId,
            convertedDealId: custom.convertedDealId,
          };
        });
      }
    } catch {
      // Prisma fallback
    }

    // Merge in-memory initial leads with DB leads, deduplicating by phone/id
    const combinedMap = new Map<string, LeadItem>();
    [...initialLeads, ...dbLeads].forEach((item) => {
      const key = item.phone || item.id;
      combinedMap.set(key, item);
    });

    let leads = Array.from(combinedMap.values());

    // Apply filters
    if (source && source !== 'ALL') {
      leads = leads.filter((l) => l.source === source.toUpperCase());
    }

    if (status && status !== 'ALL') {
      leads = leads.filter((l) => l.status === status.toUpperCase());
    }

    if (assignedTo && assignedTo !== 'ALL') {
      leads = leads.filter((l) => l.assignedTo?.toLowerCase().includes(assignedTo.toLowerCase()));
    }

    if (search) {
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.phone.toLowerCase().includes(search) ||
          (l.email && l.email.toLowerCase().includes(search)) ||
          (l.company && l.company.toLowerCase().includes(search)) ||
          l.demand.toLowerCase().includes(search)
      );
    }

    // Sort by createdAt desc
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const allLeads = Array.from(combinedMap.values());
    const stats = computeLeadStats(allLeads);

    return NextResponse.json({
      success: true,
      total: leads.length,
      leads,
      stats,
    });
  } catch (error: any) {
    console.error('[API_LEADS_GET]', error);
    return NextResponse.json({ error: 'Không thể tải danh sách khách hàng tiềm năng' }, { status: 500 });
  }
}

// POST /api/crm/leads - Create, Bulk Import, or Convert Lead (F092)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.leads ? 'bulk_import' : 'create');
    const workspaceId = (session.user as any).workspaceId;

    // 1. BULK IMPORT LEADS FROM EXCEL/CSV
    if (action === 'bulk_import') {
      const rawLeads = Array.isArray(body.leads) ? body.leads : [];
      if (rawLeads.length === 0) {
        return NextResponse.json({ error: 'Danh sách nhập trống' }, { status: 400 });
      }

      const importedItems: LeadItem[] = [];

      for (const item of rawLeads) {
        if (!item.name && !item.phone) continue;

        const cleanPhone = String(item.phone || '').replace(/[\s\-\.\(\)]/g, '');
        const cleanName = item.name ? String(item.name).trim() : 'Khách tiềm năng';
        const cleanSource = (item.source || 'IMPORT').toUpperCase() as LeadItem['source'];

        const newLead: LeadItem = {
          id: `lead_import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          phone: cleanPhone || '0900000000',
          email: item.email ? String(item.email).trim() : undefined,
          company: item.company ? String(item.company).trim() : undefined,
          source: cleanSource,
          sourceDetail: item.sourceDetail || `Nhập từ file Excel: ${item.fileName || 'Danh_sach_leads.xlsx'}`,
          status: 'NEW',
          leadScore: Number(item.leadScore) || Math.floor(Math.random() * 20) + 70,
          temperature: 'WARM',
          demand: item.demand ? String(item.demand).trim() : 'Nhu cầu nhận tư vấn sản phẩm',
          estimatedValue: Number(item.estimatedValue) || 10000000,
          assignedTo: item.assignedTo || 'Nguyễn Văn A',
          notes: item.notes || 'Nhập hàng loạt qua file Excel/CSV',
          createdAt: new Date().toISOString(),
        };

        importedItems.push(newLead);
        initialLeads.unshift(newLead);

        // Optionally persist to DB
        try {
          await prisma.customer.create({
            data: {
              workspaceId: workspaceId || undefined,
              name: newLead.name,
              phone: newLead.phone,
              email: newLead.email,
              source: newLead.source,
              tags: `Lead, F092, ${newLead.source}`,
              notes: newLead.demand,
              customData: {
                isLead: true,
                leadStatus: newLead.status,
                leadScore: newLead.leadScore,
                demand: newLead.demand,
                estimatedValue: newLead.estimatedValue,
                assignedTo: newLead.assignedTo,
              },
            },
          });
        } catch {
          // In-memory fallback
        }
      }

      await recordAuditLog({
        userId: session.user.id,
        action: 'IMPORT',
        resourceType: 'LEAD',
        resourceId: `bulk_${importedItems.length}`,
        details: { count: importedItems.length },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${importedItems.length} khách hàng tiềm năng!`,
        importedCount: importedItems.length,
        leads: initialLeads,
        stats: computeLeadStats(initialLeads),
      });
    }

    // 2. CONVERT LEAD TO CUSTOMER & DEAL (1-CLICK CONVERSION)
    if (action === 'convert') {
      const { id, dealTitle, dealValue, pipelineId, stageId } = body;
      const targetLead = initialLeads.find((l) => l.id === id);

      if (!targetLead) {
        return NextResponse.json({ error: 'Không tìm thấy khách hàng tiềm năng' }, { status: 404 });
      }

      targetLead.status = 'CONVERTED';

      let customerId = targetLead.id;
      let dealId = `deal_${Date.now()}`;

      // Persist or link official Customer & Deal in DB
      try {
        let dbCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { id: targetLead.id },
              ...(targetLead.phone ? [{ phone: targetLead.phone }] : []),
            ],
          },
        });

        if (!dbCustomer) {
          dbCustomer = await prisma.customer.create({
            data: {
              workspaceId: workspaceId || undefined,
              name: targetLead.name,
              phone: targetLead.phone,
              email: targetLead.email,
              source: targetLead.source,
              tags: 'Khách hàng chính thức, Chuyển đổi từ Lead F092',
              notes: targetLead.notes,
              customData: {
                isCustomer: true,
                convertedFromLeadId: targetLead.id,
              },
            },
          });
        }

        customerId = dbCustomer.id;

        // If deal creation requested or default deal
        const effectiveDealTitle = dealTitle || `Hợp đồng: ${targetLead.demand || targetLead.name}`;
        const effectiveDealValue = Number(dealValue) || targetLead.estimatedValue || 15000000;

        let effectivePipelineId = pipelineId;
        let effectiveStageId = stageId;

        if (!effectivePipelineId || !effectiveStageId) {
          const defaultPipeline = await prisma.pipeline.findFirst({
            where: { workspaceId: workspaceId || undefined },
            include: { stages: { orderBy: { sortOrder: 'asc' }, take: 1 } },
          });

          if (defaultPipeline) {
            effectivePipelineId = defaultPipeline.id;
            effectiveStageId = defaultPipeline.stages[0]?.id;
          }
        }

        if (effectivePipelineId && effectiveStageId) {
          const newDeal = await prisma.deal.create({
            data: {
              workspaceId: workspaceId || undefined,
              title: effectiveDealTitle,
              value: effectiveDealValue,
              customerId,
              pipelineId: effectivePipelineId,
              stageId: effectiveStageId,
              status: 'OPEN',
            },
          });
          dealId = newDeal.id;
        }
      } catch (dbErr) {
        console.warn('[CONVERT_LEAD_DB_WARN]', dbErr);
      }

      targetLead.convertedCustomerId = customerId;
      targetLead.convertedDealId = dealId;

      await recordAuditLog({
        userId: session.user.id,
        action: 'UPDATE',
        resourceType: 'LEAD_CONVERT',
        resourceId: targetLead.id,
        details: { customerId, dealId },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: `Đã chuyển đổi thành công khách hàng "${targetLead.name}" thành Khách hàng chính thức & Tạo Cơ hội bán hàng!`,
        lead: targetLead,
        stats: computeLeadStats(initialLeads),
      });
    }

    // 3. CREATE LEAD MANUALLY
    const { name, phone, email, company, source, sourceDetail, demand, estimatedValue, assignedTo, notes } = body;

    if (!name && !phone) {
      return NextResponse.json({ error: 'Vui lòng cung cấp ít nhất Họ tên hoặc Số điện thoại' }, { status: 400 });
    }

    const cleanSource = (source || 'MANUAL').toUpperCase() as LeadItem['source'];

    const newLead: LeadItem = {
      id: `lead_${Date.now()}`,
      name: name ? String(name).trim() : 'Khách tiềm năng mới',
      phone: phone ? String(phone).replace(/[\s\-\.\(\)]/g, '') : '',
      email: email ? String(email).trim() : undefined,
      company: company ? String(company).trim() : undefined,
      source: cleanSource,
      sourceDetail: sourceDetail || `Kênh ${cleanSource} trực tiếp`,
      status: 'NEW',
      leadScore: Number(body.leadScore) || 80,
      temperature: (Number(body.leadScore) || 80) >= 85 ? 'HOT' : 'WARM',
      demand: demand ? String(demand).trim() : 'Cần tư vấn dịch vụ',
      estimatedValue: Number(estimatedValue) || 10000000,
      assignedTo: assignedTo || 'Nguyễn Văn A',
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    initialLeads.unshift(newLead);

    // Persist to DB
    try {
      await prisma.customer.create({
        data: {
          workspaceId: workspaceId || undefined,
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          source: newLead.source,
          tags: `Lead, F092, ${newLead.source}`,
          notes: newLead.notes || newLead.demand,
          customData: {
            isLead: true,
            leadStatus: newLead.status,
            leadScore: newLead.leadScore,
            demand: newLead.demand,
            estimatedValue: newLead.estimatedValue,
            assignedTo: newLead.assignedTo,
          },
        },
      });
    } catch {
      // In-memory fallback
    }

    await recordAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resourceType: 'LEAD',
      resourceId: newLead.id,
      details: { name: newLead.name, source: newLead.source },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Đã thêm khách hàng tiềm năng thành công!',
      lead: newLead,
      stats: computeLeadStats(initialLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_POST]', error);
    return NextResponse.json({ error: 'Lỗi tạo khách hàng tiềm năng' }, { status: 500 });
  }
}

// PATCH /api/crm/leads - Update lead status or details (F092)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, status, notes, assignedTo, demand, estimatedValue } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id khách hàng tiềm năng' }, { status: 400 });
    }

    const targetLead = initialLeads.find((l) => l.id === id);
    if (targetLead) {
      if (status) targetLead.status = status;
      if (notes !== undefined) targetLead.notes = notes;
      if (assignedTo !== undefined) targetLead.assignedTo = assignedTo;
      if (demand !== undefined) targetLead.demand = demand;
      if (estimatedValue !== undefined) targetLead.estimatedValue = Number(estimatedValue);
    }

    // Update in DB if exists
    try {
      await prisma.customer.updateMany({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : undefined,
          customData: {
            leadStatus: status,
            assignedTo,
            demand,
            estimatedValue,
          },
        },
      });
    } catch {
      // Ignore DB error
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật thông tin khách hàng tiềm năng',
      lead: targetLead,
      stats: computeLeadStats(initialLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_PATCH]', error);
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}

// DELETE /api/crm/leads - Delete lead (F092)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id cần xóa' }, { status: 400 });
    }

    initialLeads = initialLeads.filter((l) => l.id !== id);

    try {
      await prisma.customer.deleteMany({
        where: { id },
      });
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa khách hàng tiềm năng',
      stats: computeLeadStats(initialLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_DELETE]', error);
    return NextResponse.json({ error: 'Lỗi xóa' }, { status: 500 });
  }
}
