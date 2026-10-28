import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join('/');
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), uploadDir, filename);

    // Security: prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), uploadDir));
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.pdf': 'application/pdf',
    };

    let fileBuffer: Buffer | null = null;
    let fileSize = 0;

    if (!fs.existsSync(filePath)) {
      // Check remote fallback to production or Supabase storage
      try {
        const remoteFallbackUrl = `https://topify.vn/api/uploads/${filename}?v=fallback`;
        const remoteRes = await fetch(remoteFallbackUrl);
        if (remoteRes.ok) {
          const arrayBuffer = await remoteRes.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
          fileSize = fileBuffer.length;
          // Cache locally to prevent redundant remote requests
          try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, fileBuffer);
          } catch (writeErr) {
            console.warn('[Uploads Route] Could not cache remote file locally:', writeErr);
          }
        }
      } catch (remoteErr) {
        console.warn('[Uploads Route] Failed to fetch remote fallback file:', remoteErr);
      }

      if (!fileBuffer) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    } else {
      const stat = fs.statSync(filePath);
      fileSize = stat.size;
      fileBuffer = fs.readFileSync(filePath);
    }

    let contentType = mimeTypes[ext];
    if (!contentType || contentType === 'application/octet-stream') {
      if (fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47) {
        contentType = 'image/png';
      } else if (fileBuffer.length >= 3 && fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF) {
        contentType = 'image/jpeg';
      } else if (fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString() === 'GIF8') {
        contentType = 'image/gif';
      } else if (fileBuffer.length >= 12 && fileBuffer.slice(8, 12).toString() === 'WEBP') {
        contentType = 'image/webp';
      } else {
        contentType = 'application/octet-stream';
      }
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
