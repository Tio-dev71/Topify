import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/media — Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET /api/media — List media assets
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const mediaType = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let userWorkspaceId = (session.user as any).workspaceId;
    if (!userWorkspaceId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { workspaceId: true },
      });
      userWorkspaceId = dbUser?.workspaceId || null;
    }

    const where: any = {};
    if (session.user.role === 'SUPER_ADMIN') {
      const wsParam = url.searchParams.get('workspaceId');
      if (wsParam && wsParam !== 'all') {
        where.workspaceId = wsParam;
      } else if (wsParam !== 'all' && userWorkspaceId) {
        where.workspaceId = userWorkspaceId;
      }
    } else {
      if (userWorkspaceId) {
        where.workspaceId = userWorkspaceId;
      } else {
        where.createdById = session.user.id;
      }
    }

    if (mediaType) where.mediaType = mediaType;
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tag) {
      where.tags = { contains: tag, mode: 'insensitive' };
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          createdBy: { select: { name: true, email: true } },
        },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'topify.vn';
    const requestProto = req.headers.get('x-forwarded-proto') || (requestHost.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${requestProto}://${requestHost}`;

    const formattedAssets = assets.map((asset) => {
      let finalStorageUrl = asset.storageUrl;
      if (finalStorageUrl && !finalStorageUrl.startsWith('http://') && !finalStorageUrl.startsWith('https://')) {
        finalStorageUrl = `${baseUrl}${finalStorageUrl.startsWith('/') ? '' : '/'}${finalStorageUrl}`;
      }
      if (finalStorageUrl && finalStorageUrl.includes('/api/uploads/') && !finalStorageUrl.includes('?')) {
        const timeKey = asset.updatedAt ? new Date(asset.updatedAt).getTime() : '1';
        finalStorageUrl = `${finalStorageUrl}?v=${timeKey}`;
      }
      return {
        ...asset,
        storageUrl: finalStorageUrl,
      };
    });

    return NextResponse.json({ assets: formattedAssets, total }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('List media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/media — Upload media asset
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('video') || formData.get('media')) as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
    }

    const tags = formData.get('tags') as string || null;
    const alt = formData.get('alt') as string || null;
    
    let mimeType = file.type || '';
    const size = file.size;
    const fileName = file.name;
    const ext = (fileName.split('.').pop() || '').toLowerCase();

    const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'ogv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

    // Fallback MIME mapping if not provided or generic
    if (!mimeType || mimeType === 'application/octet-stream') {
      const mimeMap: Record<string, string> = {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        webm: 'video/webm',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo',
        flv: 'video/x-flv',
        wmv: 'video/x-ms-wmv',
        m4v: 'video/x-m4v',
        '3gp': 'video/3gpp',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        bmp: 'image/bmp',
        ico: 'image/x-icon',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        pdf: 'application/pdf',
      };
      if (mimeMap[ext]) {
        mimeType = mimeMap[ext];
      }
    }
    
    let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
    if (mimeType.startsWith('image/') || imageExts.includes(ext)) mediaType = 'IMAGE';
    else if (mimeType.startsWith('video/') || videoExts.includes(ext)) mediaType = 'VIDEO';
    else if (mimeType.startsWith('audio/') || audioExts.includes(ext)) mediaType = 'AUDIO';
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const storage = getStorage();
    let storageUrl: string;
    try {
      storageUrl = await storage.upload(buffer, fileName, mimeType);
    } catch (storageErr: any) {
      console.warn('Primary storage upload failed, attempting local fallback:', storageErr?.message || storageErr);
      const { LocalStorageAdapter } = await import('@/lib/storage') as any;
      if (LocalStorageAdapter) {
        const local = new LocalStorageAdapter();
        storageUrl = await local.upload(buffer, fileName, mimeType);
      } else {
        throw storageErr;
      }
    }

    // Resolve workspaceId if missing from session
    let workspaceId = (session.user as any).workspaceId;
    if (!workspaceId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { workspaceId: true },
      });
      workspaceId = dbUser?.workspaceId || null;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        fileName,
        storageUrl,
        mimeType: mimeType || 'application/octet-stream',
        size,
        mediaType,
        tags,
        alt,
        createdById: session.user.id,
        workspaceId,
      },
    });

    let finalStorageUrl = asset.storageUrl;
    if (finalStorageUrl && !finalStorageUrl.startsWith('http://') && !finalStorageUrl.startsWith('https://')) {
      const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'topify.vn';
      const requestProto = req.headers.get('x-forwarded-proto') || (requestHost.includes('localhost') ? 'http' : 'https');
      finalStorageUrl = `${requestProto}://${requestHost}${finalStorageUrl.startsWith('/') ? '' : '/'}${finalStorageUrl}`;
    }

    return NextResponse.json({ ...asset, storageUrl: finalStorageUrl }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Create media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
