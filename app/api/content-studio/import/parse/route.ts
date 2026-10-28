import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseExcelOrCsvBuffer, fetchAndParseGoogleSheet, formatFriendlyImportError } from '@/lib/content-studio/import-engine';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/content-studio/import/parse
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

async function getAuthContext() {
  let session = await auth();
  let userId = session?.user?.id;
  let workspaceId = (session?.user as any)?.workspaceId;

  if (!userId && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const mockUser = await prisma.user.findFirst().catch(() => null);
    if (mockUser) {
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }
  }

  if (userId && !workspaceId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true },
    }).catch(() => null);
    workspaceId = dbUser?.workspaceId || null;
  }

  return { userId, workspaceId };
}

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Query connected accounts for user/workspace to validate platform availability
    // Protected against invalid enum arguments or DB errors
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        OR: [
          ...(workspaceId ? [{ workspaceId }] : []),
          { userId },
        ],
      },
      select: {
        provider: true,
        status: true,
        expiresAt: true,
        refreshToken: true,
      },
    }).catch((dbErr) => {
      console.warn('[import/parse] Failed to query socialAccount:', dbErr);
      return [];
    });

    const connectedProviders = new Set<string>();
    for (const acc of socialAccounts) {
      const isExpired = acc.expiresAt ? new Date(acc.expiresAt).getTime() < Date.now() : false;
      const isConnected = acc.status === 'CONNECTED' || (Boolean(acc.refreshToken) && (acc.provider === 'YOUTUBE' || (acc.provider as string) === 'GOOGLE'));
      if (isConnected && (!isExpired || Boolean(acc.refreshToken))) {
        const prov = String(acc.provider).toUpperCase();
        connectedProviders.add(prov);
        if (prov === 'META' || prov === 'FACEBOOK') {
          connectedProviders.add('META');
          connectedProviders.add('FACEBOOK');
          connectedProviders.add('INSTAGRAM');
        }
        if (prov === 'INSTAGRAM') {
          connectedProviders.add('META');
          connectedProviders.add('INSTAGRAM');
        }
        if (prov === 'YOUTUBE' || prov === 'GOOGLE') {
          connectedProviders.add('YOUTUBE');
          connectedProviders.add('GOOGLE');
        }
        if (prov === 'TIKTOK') {
          connectedProviders.add('TIKTOK');
        }
        if (prov === 'ZALO') {
          connectedProviders.add('ZALO');
        }
        if (prov === 'TELEGRAM') {
          connectedProviders.add('TELEGRAM');
        }
      }
    }

    const contentType = req.headers.get('content-type') || '';

    // 1. Google Sheets via JSON payload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { sheetUrl } = body;
      if (!sheetUrl) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp đường dẫn Google Sheets (sheetUrl).' },
          { status: 400, headers: corsHeaders }
        );
      }

      const result = await fetchAndParseGoogleSheet(sheetUrl, connectedProviders);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Lỗi đọc Google Sheets' }, { status: 400, headers: corsHeaders });
      }
      return NextResponse.json(result, { headers: corsHeaders });
    }

    // 2. Multipart file upload (.xlsx, .xls, .csv)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const sheetUrl = formData.get('sheetUrl') as string | null;

      if (sheetUrl) {
        const result = await fetchAndParseGoogleSheet(sheetUrl, connectedProviders);
        if (!result.success) {
          return NextResponse.json({ error: result.error || 'Lỗi đọc Google Sheets' }, { status: 400, headers: corsHeaders });
        }
        return NextResponse.json(result, { headers: corsHeaders });
      }

      if (!file) {
        return NextResponse.json(
          { error: 'Vui lòng tải lên tệp Excel (.xlsx, .xls) hoặc .csv' },
          { status: 400, headers: corsHeaders }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const result = parseExcelOrCsvBuffer(buffer, isCsv ? 'CSV' : 'EXCEL', connectedProviders);

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Lỗi đọc tệp' }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json(result, { headers: corsHeaders });
    }

    return NextResponse.json(
      { error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
      { status: 415, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Lỗi API parse import posts:', err);
    const friendlyError = formatFriendlyImportError(
      err?.message || err,
      'Hệ thống gặp sự cố khi xử lý dữ liệu import. Vui lòng kiểm tra lại cấu trúc file mẫu và thử lại.'
    );
    return NextResponse.json({ error: friendlyError }, { status: 500, headers: corsHeaders });
  }
}
