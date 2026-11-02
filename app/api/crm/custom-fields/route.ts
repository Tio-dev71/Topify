import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true },
    });

    let customFields: CustomFieldDefinition[] = DEFAULT_CRM_FIELDS;
    if (workspace?.settings && typeof workspace.settings === 'object') {
      const storedFields = (workspace.settings as any)?.crmCustomFields;
      if (Array.isArray(storedFields) && storedFields.length > 0) {
        customFields = storedFields;
      }
    }

    // Count how many customers have custom data populated
    const totalCustomersWithCustomData = await prisma.customer.count({
      where: {
        workspaceId,
        customData: { not: undefined },
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, name, type = 'TEXT', options = [], required = false, description = '' } = body;
    const workspaceId = (session.user as any).workspaceId;

    if (!key || !name) {
      return NextResponse.json({ error: 'Mã trường (key) và Tên trường (name) là bắt buộc' }, { status: 400 });
    }

    const cleanKey = key.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true },
    });

    const currentSettings: any = (workspace?.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    let fields: CustomFieldDefinition[] = Array.isArray(currentSettings.crmCustomFields)
      ? [...currentSettings.crmCustomFields]
      : [...DEFAULT_CRM_FIELDS];

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

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        settings: {
          ...currentSettings,
          crmCustomFields: fields,
        },
      },
    });

    await recordAuditLog({
      action: 'CUSTOM_FIELD.SAVE',
      entityType: 'Workspace',
      entityId: workspaceId,
      userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const workspaceId = (session.user as any).workspaceId;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true },
    });

    const currentSettings: any = (workspace?.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    let fields: CustomFieldDefinition[] = Array.isArray(currentSettings.crmCustomFields)
      ? [...currentSettings.crmCustomFields]
      : [...DEFAULT_CRM_FIELDS];

    fields = fields.filter(f => f.key !== key);

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        settings: {
          ...currentSettings,
          crmCustomFields: fields,
        },
      },
    });

    return NextResponse.json({ success: true, message: `Đã xóa trường tùy biến: ${key}`, fields });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

