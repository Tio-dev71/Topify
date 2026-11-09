import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthContext(req: NextRequest) {
  let userId: string | undefined;
  let workspaceId: string | undefined;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.sub || decoded?.id) {
        userId = decoded.sub || decoded.id;
        workspaceId = decoded.workspaceId;
      }
    } catch (e) {}
  }

  if (!userId) {
    const session = await auth();
    userId = session?.user?.id;
    workspaceId = (session?.user as any)?.workspaceId;
  }

  if (userId && !workspaceId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true },
    });
    workspaceId = user?.workspaceId || undefined;
  }

  return { userId, workspaceId };
}

export const dynamic = 'force-dynamic';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN';
  options?: string[];
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

const DEFAULT_CRM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf_industry',
    key: 'industry',
    name: 'Lĩnh vực kinh doanh',
    type: 'SELECT',
    options: ['Thời trang & May mặc', 'F&B / Ẩm thực', 'Bất động sản', 'Dịch vụ / Spa / Thẩm mỹ', 'Bán lẻ & E-commerce', 'Công nghệ & Giáo dục'],
    required: false,
    description: 'Ngành nghề hoạt động chính của doanh nghiệp/khách hàng',
  },
  {
    id: 'cf_company_size',
    key: 'companySize',
    name: 'Quy mô nhân sự',
    type: 'SELECT',
    options: ['Cá nhân / Hộ kinh doanh', '1 - 10 nhân sự', '11 - 50 nhân sự', '51 - 200 nhân sự', 'Trên 200 nhân sự'],
    required: false,
    description: 'Ước lượng quy mô tổ chức khách hàng',
  },
  {
    id: 'cf_budget',
    key: 'budget',
    name: 'Ngân sách dự kiến',
    type: 'TEXT',
    required: false,
    description: 'Hạn mức ngân sách dành cho chiến dịch/dự án',
  },
  {
    id: 'cf_decision_maker',
    key: 'decisionMaker',
    name: 'Người ra quyết định',
    type: 'TEXT',
    required: false,
    description: 'Chức danh hoặc họ tên người phê duyệt hợp đồng',
  },
  {
    id: 'cf_tax_code',
    key: 'taxCode',
    name: 'Mã số thuế / MST',
    type: 'TEXT',
    required: false,
    description: 'Mã số thuế doanh nghiệp phục vụ xuất hóa đơn VAT',
  },
  {
    id: 'cf_special_needs',
    key: 'specialNeeds',
    name: 'Nhu cầu đặc thù',
    type: 'TEXT',
    required: false,
    description: 'Yêu cầu tính năng hoặc lưu ý tư vấn chuyên sâu',
  },
];

// GET /api/crm/custom-fields - List field definitions and customer usage stats (F099)
export async function GET(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: `crm_custom_fields_${workspaceId}` },
    });

    let customFields: CustomFieldDefinition[] = DEFAULT_CRM_FIELDS;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          customFields = parsed;
        }
      } catch (e) {}
    }

    // Count how many customers have custom data populated
    const totalCustomersWithCustomData = await prisma.customer.count({
      where: {
        workspaceId,
        customData: { not: null as any },
      },
    });

    return NextResponse.json({
      fields: customFields,
      totalFields: customFields.length,
      customersWithCustomData: totalCustomersWithCustomData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/crm/custom-fields - Add or update a custom field definition (F099)
export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, name, type = 'TEXT', options = [], required = false, description = '' } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'Mã trường (key) và Tên trường (name) là bắt buộc' }, { status: 400 });
    }

    const cleanKey = key.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    const setting = await prisma.systemSetting.findUnique({
      where: { key: `crm_custom_fields_${workspaceId}` },
    });

    let fields: CustomFieldDefinition[] = [...DEFAULT_CRM_FIELDS];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          fields = parsed;
        }
      } catch (e) {}
    }

    const existingIdx = fields.findIndex(f => f.key === cleanKey);
    const newField: CustomFieldDefinition = {
      id: existingIdx >= 0 ? fields[existingIdx].id : `cf_${Date.now()}`,
      key: cleanKey,
      name: name.trim(),
      type,
      options: Array.isArray(options) ? options : [],
      required: Boolean(required),
      description: description?.trim() || '',
    };

    if (existingIdx >= 0) {
      fields[existingIdx] = newField;
    } else {
      fields.push(newField);
    }

    await prisma.systemSetting.upsert({
      where: { key: `crm_custom_fields_${workspaceId}` },
      update: { value: JSON.stringify(fields) },
      create: { key: `crm_custom_fields_${workspaceId}`, value: JSON.stringify(fields) },
    });

    await recordAuditLog({
      action: 'CUSTOM_FIELD.SAVE',
      entityType: 'Workspace',
      entityId: workspaceId,
      userId,
      workspaceId,
      req,
      metadata: {
        message: `Lưu trường dữ liệu tùy biến CRM: ${name} (${cleanKey})`,
        field: newField,
      },
    });

    return NextResponse.json({ success: true, field: newField, fields });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/crm/custom-fields?key=... - Remove a custom field definition (F099)
export async function DELETE(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext(req);
    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: `crm_custom_fields_${workspaceId}` },
    });

    let fields: CustomFieldDefinition[] = [...DEFAULT_CRM_FIELDS];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          fields = parsed;
        }
      } catch (e) {}
    }

    fields = fields.filter(f => f.key !== key);

    await prisma.systemSetting.upsert({
      where: { key: `crm_custom_fields_${workspaceId}` },
      update: { value: JSON.stringify(fields) },
      create: { key: `crm_custom_fields_${workspaceId}`, value: JSON.stringify(fields) },
    });

    return NextResponse.json({ success: true, message: `Đã xóa trường tùy biến: ${key}`, fields });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

