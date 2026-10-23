import { NextResponse } from 'next/server';
import { generateSampleExcelTemplate } from '@/lib/content-studio/import-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = generateSampleExcelTemplate();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Mau_Import_Bai_Viet_Topify.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('Lỗi API tải file mẫu import:', err);
    return NextResponse.json({ error: 'Không thể tạo file mẫu import' }, { status: 500 });
  }
}
