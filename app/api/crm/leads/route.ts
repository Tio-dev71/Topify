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

// Helper to map DB Customer to LeadItem
function mapCustomerToLead(c: any): LeadItem {
  const custom = (c.customData as any) || {};
  const rawSource = String(c.source || '').toUpperCase();
  const tagsStr = String(c.tags || '').toUpperCase();

  // Determine standard 4 channels: INBOX, FORM, IMPORT, REFERRAL
  let cleanSource: LeadItem['source'] = 'INBOX';
  if (
    rawSource === 'FORM' ||
    rawSource === 'LANDING_PAGE' ||
    rawSource === 'WEB_FORM' ||
    tagsStr.includes('F102') ||
    tagsStr.includes('LANDINGPAGE') ||
    tagsStr.includes('FORM')
  ) {
    cleanSource = 'FORM';
  } else if (
    rawSource === 'IMPORT' ||
    rawSource === 'EXCEL' ||
    rawSource === 'CSV' ||
    tagsStr.includes('IMPORT')
  ) {
    cleanSource = 'IMPORT';
  } else if (
    rawSource === 'REFERRAL' ||
    rawSource === 'REF' ||
    rawSource === 'AFFILIATE' ||
    tagsStr.includes('REFERRAL') ||
    tagsStr.includes('GIỚI THIỆU')
  ) {
    cleanSource = 'REFERRAL';
  } else {
    cleanSource = 'INBOX';
  }

  // Determine source detail description
  let sourceDetail = custom.sourceDetail;
  if (!sourceDetail) {
    if (cleanSource === 'FORM') {
      sourceDetail = 'Web Form Thu Lead (F102) - Landing Page';
    } else if (cleanSource === 'IMPORT') {
      sourceDetail = custom.fileName ? `Nhập từ file: ${custom.fileName}` : 'Nhập từ file Excel/CSV';
    } else if (cleanSource === 'REFERRAL') {
      sourceDetail = 'Giới thiệu / Đối tác kinh doanh';
    } else {
      if (rawSource === 'TIKTOK') {
        sourceDetail = 'Inbox TikTok Shop Live / Tin nhắn TikTok';
      } else if (rawSource === 'FACEBOOK') {
        sourceDetail = 'Inbox Fanpage Facebook / Messenger';
      } else if (rawSource === 'INSTAGRAM') {
        sourceDetail = 'Inbox Instagram Direct';
      } else if (rawSource === 'ZALO') {
        sourceDetail = 'Tin nhắn Zalo OA / Cá nhân';
      } else {
        sourceDetail = 'Hộp thư trực tiếp (Inbox)';
      }
    }
  }

  // Determine status
  let status: LeadItem['status'] = 'NEW';
  if (custom.leadStatus) {
    status = custom.leadStatus;
  } else if (
    c.tags?.includes('Khách hàng chính thức') ||
    c.tags?.includes('Chuyển đổi') ||
    (c.deals && c.deals.length > 0) ||
    custom.isCustomer === true
  ) {
    status = 'CONVERTED';
  } else if (c.tags?.toLowerCase().includes('tiềm năng') || c.tags?.includes('VIP')) {
    status = 'QUALIFIED';
  } else if (c.tags?.toLowerCase().includes('đang liên hệ')) {
    status = 'CONTACTING';
  } else {
    status = 'NEW';
  }

  // Lead score & temperature
  const leadScore = Number(custom.leadScore) || (status === 'CONVERTED' ? 95 : 80);
  const temperature: LeadItem['temperature'] =
    leadScore >= 85 ? 'HOT' : leadScore >= 60 ? 'WARM' : 'COLD';

  // Demand & estimated value
  const demand =
    custom.demand ||
    c.notes ||
    (c.deals && c.deals[0]?.title) ||
    'Quan tâm giải pháp và dịch vụ';
  const estimatedValue =
    Number(custom.estimatedValue) ||
    (c.deals && c.deals.length > 0
      ? c.deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
      : 10000000);

  return {
    id: c.id,
    name: c.name || 'Khách tiềm năng',
    phone: c.phone || '',
    email: c.email || undefined,
    company: custom.company || undefined,
    source: cleanSource,
    sourceDetail,
    status,
    leadScore,
    temperature,
    demand,
    estimatedValue,
    assignedTo: custom.assignedTo || 'Chưa phân công',
    assignedAvatar: custom.assignedAvatar || undefined,
    notes: c.notes || undefined,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    convertedCustomerId: custom.convertedCustomerId || (status === 'CONVERTED' ? c.id : undefined),
    convertedDealId: custom.convertedDealId || (c.deals && c.deals[0]?.id) || undefined,
  };
}

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

// Helper to fetch all leads from DB for a workspace
async function fetchDbLeads(workspaceId?: string): Promise<LeadItem[]> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        workspaceId: workspaceId || undefined,
      },
      include: {
        deals: { select: { id: true, title: true, value: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map(mapCustomerToLead);
  } catch (err) {
    console.error('[API_LEADS_FETCH_DB_ERROR]', err);
    return [];
  }
}

// GET /api/crm/leads - List leads with multi-source filtering (F092) - 100% Real DB Data
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

    const allLeads = await fetchDbLeads(workspaceId);
    let leads = [...allLeads];

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
          (l.demand && l.demand.toLowerCase().includes(search)) ||
          (l.notes && l.notes.toLowerCase().includes(search))
      );
    }

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

// POST /api/crm/leads - Create, Bulk Import, or Convert Lead (F092) - 100% Real DB Data
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.leads ? 'bulk_import' : 'create');
    const workspaceId = (session.user as any).workspaceId;

    // 1. BULK IMPORT LEADS FROM EXCEL/CSV (100% DB INSERT)
    if (action === 'bulk_import') {
      const rawLeads = Array.isArray(body.leads) ? body.leads : [];
      if (rawLeads.length === 0) {
        return NextResponse.json({ error: 'Danh sách nhập trống' }, { status: 400 });
      }

      let importedCount = 0;
      for (const item of rawLeads) {
        if (!item.name && !item.phone) continue;

        const cleanPhone = String(item.phone || '').replace(/[\s\-\.\(\)]/g, '');
        const cleanName = item.name ? String(item.name).trim() : 'Khách tiềm năng';
        const cleanSource = (item.source || 'IMPORT').toUpperCase();

        try {
          await prisma.customer.create({
            data: {
              workspaceId: workspaceId || undefined,
              name: cleanName,
              phone: cleanPhone || '0900000000',
              email: item.email ? String(item.email).trim() : null,
              source: cleanSource,
              tags: `Lead, F092, ${cleanSource}`,
              notes: item.demand ? String(item.demand).trim() : 'Nhập hàng loạt qua file Excel/CSV',
              customData: {
                isLead: true,
                leadStatus: 'NEW',
                leadScore: Number(item.leadScore) || 75,
                demand: item.demand ? String(item.demand).trim() : 'Nhu cầu nhận tư vấn sản phẩm',
                estimatedValue: Number(item.estimatedValue) || 10000000,
                assignedTo: item.assignedTo || 'Chưa phân công',
                company: item.company ? String(item.company).trim() : undefined,
                sourceDetail: item.sourceDetail || `Nhập từ file: ${item.fileName || 'Danh_sach_leads.xlsx'}`,
              },
            },
          });
          importedCount++;
        } catch (insertErr) {
          console.error('[API_LEADS_BULK_IMPORT_ITEM_ERROR]', insertErr);
        }
      }

      await recordAuditLog({
        userId: session.user.id,
        action: 'IMPORT',
        entityType: 'LEAD',
        entityId: `bulk_${importedCount}`,
        metadata: { count: importedCount },
      }).catch(() => null);

      const allLeads = await fetchDbLeads(workspaceId);
      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${importedCount} khách hàng tiềm năng vào cơ sở dữ liệu!`,
        importedCount,
        leads: allLeads,
        stats: computeLeadStats(allLeads),
      });
    }

    // 2. CONVERT LEAD TO CUSTOMER & DEAL (1-CLICK CONVERSION IN DB)
    if (action === 'convert') {
      const { id, dealTitle, dealValue, pipelineId, stageId } = body;
      if (!id) {
        return NextResponse.json({ error: 'Thiếu id khách hàng tiềm năng' }, { status: 400 });
      }

      const customer = await prisma.customer.findFirst({
        where: {
          id,
          workspaceId: workspaceId || undefined,
        },
        include: { deals: true },
      });

      if (!customer) {
        return NextResponse.json({ error: 'Không tìm thấy khách hàng tiềm năng trong dữ liệu' }, { status: 404 });
      }

      const custom = (customer.customData as any) || {};

      // Determine pipeline & stage for deal creation
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

      let dealId: string | undefined;
      if (effectivePipelineId && effectiveStageId) {
        const effectiveDealTitle = dealTitle || `Hợp đồng: ${custom.demand || customer.name || 'Khách hàng'}`;
        const effectiveDealValue = Number(dealValue) || Number(custom.estimatedValue) || 15000000;

        const newDeal = await prisma.deal.create({
          data: {
            workspaceId: workspaceId || undefined,
            title: effectiveDealTitle,
            value: effectiveDealValue,
            customerId: customer.id,
            pipelineId: effectivePipelineId,
            stageId: effectiveStageId,
            status: 'OPEN',
          },
        });
        dealId = newDeal.id;
      }

      // Update tags and customData
      const existingTags = customer.tags ? customer.tags.split(',').map((t) => t.trim()) : [];
      if (!existingTags.includes('Khách hàng chính thức')) {
        existingTags.push('Khách hàng chính thức');
      }
      if (!existingTags.includes('Chuyển đổi từ Lead F092')) {
        existingTags.push('Chuyển đổi từ Lead F092');
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          tags: existingTags.join(', '),
          customData: {
            ...custom,
            isCustomer: true,
            leadStatus: 'CONVERTED',
            convertedCustomerId: customer.id,
            convertedDealId: dealId || custom.convertedDealId,
          },
        },
        include: { deals: true },
      });

      await recordAuditLog({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'LEAD_CONVERT',
        entityId: customer.id,
        metadata: { customerId: customer.id, dealId },
      }).catch(() => null);

      const allLeads = await fetchDbLeads(workspaceId);
      return NextResponse.json({
        success: true,
        message: `Đã chuyển đổi thành công khách hàng "${customer.name}" thành Khách hàng chính thức & Tạo Cơ hội bán hàng!`,
        lead: mapCustomerToLead(updatedCustomer),
        stats: computeLeadStats(allLeads),
      });
    }

    // 3. CREATE LEAD MANUALLY (100% DB INSERT)
    const { name, phone, email, company, source, sourceDetail, demand, estimatedValue, assignedTo, notes } = body;

    if (!name && !phone) {
      return NextResponse.json({ error: 'Vui lòng cung cấp ít nhất Họ tên hoặc Số điện thoại' }, { status: 400 });
    }

    const cleanSource = (source || 'INBOX').toUpperCase();
    const cleanPhone = phone ? String(phone).replace(/[\s\-\.\(\)]/g, '') : '';
    const cleanName = name ? String(name).trim() : 'Khách tiềm năng mới';

    const newCustomer = await prisma.customer.create({
      data: {
        workspaceId: workspaceId || undefined,
        name: cleanName,
        phone: cleanPhone || '0900000000',
        email: email ? String(email).trim() : null,
        source: cleanSource,
        tags: `Lead, F092, ${cleanSource}`,
        notes: notes || demand || 'Khách tiềm năng mới tạo từ CRM',
        customData: {
          isLead: true,
          leadStatus: 'NEW',
          leadScore: Number(body.leadScore) || 80,
          demand: demand ? String(demand).trim() : 'Cần tư vấn dịch vụ',
          estimatedValue: Number(estimatedValue) || 10000000,
          assignedTo: assignedTo || 'Chưa phân công',
          company: company ? String(company).trim() : undefined,
          sourceDetail: sourceDetail || `Kênh ${cleanSource} trực tiếp`,
        },
      },
      include: { deals: true },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'LEAD',
      entityId: newCustomer.id,
      metadata: { name: newCustomer.name, source: newCustomer.source },
    }).catch(() => null);

    const allLeads = await fetchDbLeads(workspaceId);
    return NextResponse.json({
      success: true,
      message: 'Đã thêm khách hàng tiềm năng thành công!',
      lead: mapCustomerToLead(newCustomer),
      stats: computeLeadStats(allLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_POST]', error);
    return NextResponse.json({ error: 'Lỗi tạo khách hàng tiềm năng' }, { status: 500 });
  }
}

// PATCH /api/crm/leads - Update lead status or details (F092) - 100% Real DB Update
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      id,
      name,
      phone,
      email,
      company,
      source,
      sourceDetail,
      status,
      notes,
      assignedTo,
      demand,
      estimatedValue,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id khách hàng tiềm năng' }, { status: 400 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const existing = await prisma.customer.findFirst({
      where: {
        id,
        workspaceId: workspaceId || undefined,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng tiềm năng' }, { status: 404 });
    }

    const existingCustom = (existing.customData as any) || {};
    const updatedCustom = {
      ...existingCustom,
      isLead: true,
      ...(company !== undefined && { company: company ? String(company).trim() : undefined }),
      ...(sourceDetail !== undefined && { sourceDetail: sourceDetail ? String(sourceDetail).trim() : undefined }),
      ...(demand !== undefined && { demand: demand ? String(demand).trim() : undefined }),
      ...(estimatedValue !== undefined && { estimatedValue: Number(estimatedValue) }),
      ...(assignedTo !== undefined && { assignedTo: assignedTo ? String(assignedTo).trim() : undefined }),
      ...(status !== undefined && { leadStatus: status }),
    };

    const cleanSource = source ? String(source).toUpperCase() : undefined;

    const updatedCustomer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(phone !== undefined && { phone: String(phone).replace(/[\s\-\.\(\)]/g, '') }),
        ...(email !== undefined && { email: email ? String(email).trim() : null }),
        ...(cleanSource !== undefined && {
          source: cleanSource,
          tags: `Lead, F092, ${cleanSource}`,
        }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
        customData: updatedCustom,
      },
      include: { deals: true },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'LEAD',
      entityId: id,
      metadata: { name: updatedCustomer.name, status, assignedTo },
    }).catch(() => null);

    const allLeads = await fetchDbLeads(workspaceId);
    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật thông tin khách hàng tiềm năng thành công',
      lead: mapCustomerToLead(updatedCustomer),
      stats: computeLeadStats(allLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_PATCH]', error);
    return NextResponse.json({ error: 'Lỗi cập nhật khách hàng tiềm năng' }, { status: 500 });
  }
}

// DELETE /api/crm/leads - Delete lead (F092) - 100% Real DB Delete
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

    const workspaceId = (session.user as any).workspaceId;

    await prisma.customer.deleteMany({
      where: {
        id,
        workspaceId: workspaceId || undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'LEAD',
      entityId: id,
    }).catch(() => null);

    const allLeads = await fetchDbLeads(workspaceId);
    return NextResponse.json({
      success: true,
      message: 'Đã xóa khách hàng tiềm năng thành công',
      stats: computeLeadStats(allLeads),
    });
  } catch (error: any) {
    console.error('[API_LEADS_DELETE]', error);
    return NextResponse.json({ error: 'Lỗi xóa khách hàng tiềm năng' }, { status: 500 });
  }
}
