import { NextResponse } from 'next/server';
import { generateSampleExcelTemplate } from '@/lib/content-studio/import-engine';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const buffer = generateSampleExcelTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Mau_Import_Bai_Viet_Topify.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('Lỗi API tải file mẫu import:', err);
    return NextResponse.json({ error: 'Không thể tạo file mẫu import' }, { status: 500, headers: corsHeaders });
  }
}
