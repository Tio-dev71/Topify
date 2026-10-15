import { NextRequest, NextResponse } from 'next/server';
import { BUILT_IN_TASK_TEMPLATES, TaskTemplate } from '@/lib/tasks/engine';

// GET /api/tasks/templates - List built-in standardized workflow templates
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    let templates = BUILT_IN_TASK_TEMPLATES;
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length,
    });
  } catch (error: any) {
    console.error('[API_TASKS_TEMPLATES_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
