import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseExcelOrCsvBuffer, fetchAndParseGoogleSheet } from '@/lib/content-studio/import-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // 1. Google Sheets via JSON payload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { sheetUrl } = body;
      if (!sheetUrl) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp đường dẫn Google Sheets (sheetUrl).' },
          { status: 400 }
        );
      }

      const result = await fetchAndParseGoogleSheet(sheetUrl);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Lỗi đọc Google Sheets' }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // 2. Multipart file upload (.xlsx, .xls, .csv)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const sheetUrl = formData.get('sheetUrl') as string | null;

      if (sheetUrl) {
        const result = await fetchAndParseGoogleSheet(sheetUrl);
        if (!result.success) {
          return NextResponse.json({ error: result.error || 'Lỗi đọc Google Sheets' }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      if (!file) {
        return NextResponse.json(
          { error: 'Vui lòng tải lên tệp Excel (.xlsx, .xls) hoặc .csv' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const result = parseExcelOrCsvBuffer(buffer, isCsv ? 'CSV' : 'EXCEL');

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Lỗi đọc tệp' }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
      { status: 415 }
    );
  } catch (err: any) {
    console.error('Lỗi API parse import posts:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ khi parse dữ liệu import' }, { status: 500 });
  }
}
