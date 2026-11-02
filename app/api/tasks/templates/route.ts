import { NextRequest, NextResponse } from 'next/server';
import { BUILT_IN_TASK_TEMPLATES, TaskTemplate, TaskTemplateStep } from '@/lib/tasks/engine';

// In-memory store for custom task templates
let customTaskTemplates: TaskTemplate[] = [];

// GET /api/tasks/templates - List built-in and custom workflow templates
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let allTemplates = [...BUILT_IN_TASK_TEMPLATES, ...customTaskTemplates];

    if (category && category !== 'ALL') {
      allTemplates = allTemplates.filter((t) => t.category.toUpperCase() === category.toUpperCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allTemplates = allTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.steps.some((s) => s.title.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      templates: allTemplates,
      total: allTemplates.length,
    });
  } catch (error: any) {
    console.error('[API_TASKS_TEMPLATES_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks/templates - Create a new custom task template (F130)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category = 'CUSTOM',
      description = '',
      estimatedDays = 1,
      icon = 'Sparkles',
      steps = [],
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Tên mẫu quy trình không được để trống' },
        { status: 400 }
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'Quy trình phải có ít nhất 1 bước thực hiện' },
        { status: 400 }
      );
    }

    const formattedSteps: TaskTemplateStep[] = steps
      .filter((s: any) => {
        if (typeof s === 'string') return s.trim().length > 0;
        return s && typeof s.title === 'string' && s.title.trim().length > 0;
      })
      .map((s: any, idx: number) => {
        if (typeof s === 'string') {
          return {
            title: s.trim(),
            relativeDueDays: idx + 1,
            defaultRole: 'Thành viên thực hiện',
          };
        }
        return {
          title: s.title.trim(),
          description: s.description?.trim() || undefined,
          relativeDueDays: Number(s.relativeDueDays) >= 0 ? Number(s.relativeDueDays) : idx + 1,
          defaultRole: s.defaultRole?.trim() || 'Thành viên thực hiện',
        };
      });

    if (formattedSteps.length === 0) {
      return NextResponse.json(
        { error: 'Quy trình phải có ít nhất 1 bước thực hiện hợp lệ' },
        { status: 400 }
      );
    }

    const newTemplate: TaskTemplate = {
      id: `tpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      category: (category.trim().toUpperCase() || 'CUSTOM') as any,
      description: description?.trim() || '',
      estimatedDays: Number(estimatedDays) > 0 ? Math.round(Number(estimatedDays)) : 1,
      icon: icon || 'Sparkles',
      steps: formattedSteps,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    customTaskTemplates.unshift(newTemplate);

    return NextResponse.json(
      {
        success: true,
        template: newTemplate,
        message: `Đã tạo mẫu quy trình [${newTemplate.name}] thành công!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API_TASKS_TEMPLATES_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks/templates - Delete a custom task template
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Mã mẫu quy trình (id) là bắt buộc' }, { status: 400 });
    }

    // Check if trying to delete built-in template
    const isBuiltIn = BUILT_IN_TASK_TEMPLATES.some((t) => t.id === id);
    if (isBuiltIn) {
      return NextResponse.json(
        { error: 'Không thể xóa mẫu quy trình mặc định của hệ thống' },
        { status: 400 }
      );
    }

    const initialLen = customTaskTemplates.length;
    customTaskTemplates = customTaskTemplates.filter((t) => t.id !== id);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa mẫu quy trình thành công!',
      deletedId: id,
    });
  } catch (error: any) {
    console.error('[API_TASKS_TEMPLATES_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tasks/templates - Update a custom task template
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, description, estimatedDays, icon, steps } = body;

    if (!id) {
      return NextResponse.json({ error: 'Mã mẫu quy trình (id) là bắt buộc' }, { status: 400 });
    }

    const isBuiltIn = BUILT_IN_TASK_TEMPLATES.some((t) => t.id === id);
    if (isBuiltIn) {
      return NextResponse.json(
        { error: 'Không thể chỉnh sửa mẫu quy trình mặc định của hệ thống' },
        { status: 400 }
      );
    }

    const existingIdx = customTaskTemplates.findIndex((t) => t.id === id);
    if (existingIdx === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy mẫu quy trình cần chỉnh sửa' },
        { status: 404 }
      );
    }

    const existing = customTaskTemplates[existingIdx];
    const updated: TaskTemplate = {
      ...existing,
      name: name?.trim() || existing.name,
      category: category ? (category.trim().toUpperCase() as any) : existing.category,
      description: description !== undefined ? description.trim() : existing.description,
      estimatedDays: Number(estimatedDays) > 0 ? Math.round(Number(estimatedDays)) : existing.estimatedDays,
      icon: icon || existing.icon,
      steps: Array.isArray(steps)
        ? steps.map((s: any, idx: number) => ({
            title: typeof s === 'string' ? s.trim() : s.title?.trim() || `Bước ${idx + 1}`,
            relativeDueDays: Number(s.relativeDueDays) >= 0 ? Number(s.relativeDueDays) : idx + 1,
            defaultRole: s.defaultRole?.trim() || 'Thành viên thực hiện',
            description: s.description?.trim() || undefined,
          }))
        : existing.steps,
    };

    customTaskTemplates[existingIdx] = updated;

    return NextResponse.json({
      success: true,
      template: updated,
      message: 'Đã cập nhật mẫu quy trình thành công!',
    });
  } catch (error: any) {
    console.error('[API_TASKS_TEMPLATES_PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
