import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';

// GET /api/media — List media assets
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const mediaType = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const where: any = {
      workspaceId: (session.user as any).workspaceId,
    };

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

    return NextResponse.json({ assets, total });
  } catch (error: any) {
    console.error('List media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/media — Upload media asset
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const tags = formData.get('tags') as string || null;
    const alt = formData.get('alt') as string || null;
    
    const mimeType = file.type;
    const size = file.size;
    const fileName = file.name;
    
    let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
    if (mimeType.startsWith('image/')) mediaType = 'IMAGE';
    else if (mimeType.startsWith('video/')) mediaType = 'VIDEO';
    else if (mimeType.startsWith('audio/')) mediaType = 'AUDIO';
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const storage = getStorage();
    const storageUrl = await storage.upload(buffer, fileName);

    const asset = await prisma.mediaAsset.create({
      data: {
        fileName,
        storageUrl,
        mimeType,
        size,
        mediaType,
        tags,
        alt,
        createdById: session.user.id,
        workspaceId: (session.user as any).workspaceId,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('Create media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
