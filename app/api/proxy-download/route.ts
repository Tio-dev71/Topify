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

    // Fetch the file from the external URL
    const response = await fetch(url);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
    }

    // Forward the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Set headers to force download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Let Next.js handle chunked transfer encoding automatically
    // Removed manual Content-Length mapping to fix premature close errors

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
