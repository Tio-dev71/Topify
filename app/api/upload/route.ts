import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { titleFromFilename, isAllowedVideoType, getMaxFileSize } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// OPTIONS /api/upload — Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;
    
    // Mock fallback cho dev environment nếu không có auth cookie
    if (!userId) {
      const mockUser = await prisma.user.findFirst().catch(() => null);
      if (!mockUser) {
        return NextResponse.json({ error: 'Please run: npx prisma db seed first' }, { status: 500, headers: corsHeaders });
      }
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }

    if (!workspaceId) {
      const dbUser = await prisma.user?.findUnique?.({
        where: { id: userId },
        select: { workspaceId: true },
      })?.catch?.(() => null);
      workspaceId = dbUser?.workspaceId || null;
    }

    // Verify workspaceId exists in DB to prevent foreign key errors
    if (workspaceId && prisma.workspace?.findUnique) {
      const wsExists = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true },
      }).catch(() => null);
      if (!wsExists) {
        workspaceId = null;
      }
    }

    // Verify userId exists in DB to prevent foreign key errors
    if (prisma.user?.findUnique) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }).catch(() => null);
      if (!userExists) {
        const fallbackUser = session?.user?.email
          ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, workspaceId: true } }).catch(() => null)
          : await prisma.user.findFirst?.({ select: { id: true, workspaceId: true } })?.catch?.(() => null);
        if (fallbackUser) {
          userId = fallbackUser.id;
          if (!workspaceId) workspaceId = fallbackUser.workspaceId;
        }
      }
    }
    
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr: any) {
      console.error('[Upload] Failed to parse formData:', formErr);
      return NextResponse.json(
        { error: 'No video file provided (Failed to parse form data)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const file = (formData.get('video') || formData.get('file')) as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    if (!isAllowedVideoType(file.type, file.name)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP4, MOV, WebM' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${maxSize / 1024 / 1024}MB` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Upload file
    const storage = getStorage();
    const storageUrl = await storage.upload(file, file.name, file.type);

    // Read optional duration from client metadata
    const rawDuration = formData.get('duration');
    const duration = rawDuration ? Math.round(parseFloat(String(rawDuration))) : null;

    // Generate title from filename
    const title = titleFromFilename(file.name);

    // Create video asset record
    const videoAsset = await prisma.videoAsset.create({
      data: {
        originalFileName: file.name,
        titleFromFileName: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        storageUrl: storageUrl,
        source: 'LOCAL_UPLOAD',
        mimeType: file.type || 'video/mp4',
        size: file.size,
        duration: duration,
        createdById: userId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json(videoAsset, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
