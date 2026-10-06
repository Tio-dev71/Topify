import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    let filename = searchParams.get('filename') || 'video';

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Ensure filename has an extension
    if (!filename.includes('.')) {
      filename = `${filename}.mp4`; // default to mp4
    }

    // Set request headers for CDNs like TikTok / Akamai
    const isTikTok = url.includes('tiktok') || url.includes('byteoversea') || url.includes('ibytedtos');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (isTikTok) {
      fetchHeaders['Referer'] = 'https://www.tiktok.com/';
    }

    // Fetch the file from the external URL
    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
    }

    // Forward the content type from the original response
    const contentType = response.headers.get('content-type') || (filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');

    // Set headers to force download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    const safeAsciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');
    headers.set('Content-Disposition', `attachment; filename="${safeAsciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
