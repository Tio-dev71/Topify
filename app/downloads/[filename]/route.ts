import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    const params = await context.params;
    const rawFilename = params.filename;

    if (!rawFilename) {
      return NextResponse.json({ error: 'Tên file không hợp lệ' }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(rawFilename);

    const distDir = path.join(process.cwd(), 'electron-app', 'dist');
    const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');

    // Check primary location: electron-app/dist or public/downloads
    let targetPath = path.join(distDir, safeFilename);
    if (!fs.existsSync(targetPath)) {
      targetPath = path.join(publicDownloadsDir, safeFilename);
    }

    // Fallback: If exact version not found, find latest matching file in distDir or publicDownloadsDir
    if (!fs.existsSync(targetPath)) {
      const isDmg = safeFilename.endsWith('.dmg');
      const isExe = safeFilename.endsWith('.exe');

      const searchDirs = [distDir, publicDownloadsDir];
      for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const matching = files
            .filter((f) => (isDmg && f.endsWith('.dmg')) || (isExe && f.endsWith('.exe')))
            .sort()
            .reverse();

          if (matching.length > 0) {
            targetPath = path.join(dir, matching[0]);
            break;
          }
        }
      }
    }

    if (!fs.existsSync(targetPath)) {
      // Fallback: Redirect directly to GitHub Release assets
      const verMatch = safeFilename.match(/(\d+\.\d+\.\d+)/);
      const tag = verMatch ? `v${verMatch[1]}` : 'v1.3.84';
      const ghReleaseUrl = `https://github.com/Tio-dev71/Topify/releases/download/${tag}/${safeFilename}`;
      console.log(`[DOWNLOAD_ROUTE] File local không có sẵn, chuyển hướng sang GitHub Release: ${ghReleaseUrl}`);
      return NextResponse.redirect(ghReleaseUrl, 302);
    }

    const stat = fs.statSync(targetPath);
    const fileStream = fs.createReadStream(targetPath);
    const finalFilename = path.basename(targetPath);

    const headers = new Headers();
    headers.set('Content-Length', stat.size.toString());
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${finalFilename}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

    // Convert node stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[DOWNLOAD_ROUTE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý file tải về' }, { status: 500 });
  }
}
