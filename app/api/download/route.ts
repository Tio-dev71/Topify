import { NextRequest, NextResponse } from 'next/server';
import electronPkg from '../../../electron-app/package.json';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const os = searchParams.get('os')?.toLowerCase() || 'mac';
  const ext = os === 'win' || os === 'windows' ? 'win.exe' : 'mac.dmg';
  const version = electronPkg.version || '1.3.85';

  // Chuyển hướng trực tiếp đến GitHub Releases CDN bảo đảm tải file tốc độ cao, không bao giờ bị 404 Nginx
  const downloadUrl = `https://github.com/Tio-dev71/Topify/releases/download/v${version}/Topify-Automation-${version}-${ext}`;

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

