import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { titleFromFilename, isAllowedVideoType, getMaxFileSize } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    let session = await auth();
    let userId = session?.user?.id;
    let workspaceId = (session?.user as any)?.workspaceId;
    
    // Mock fallback cho dev environment nếu không có auth cookie
    if (!userId) {
      const mockUser = await prisma.user.findFirst();
      if (!mockUser) {
        return NextResponse.json({ error: 'Please run: npx prisma db seed first' }, { status: 500 });
      }
      userId = mockUser.id;
      workspaceId = mockUser.workspaceId;
    }
    
    const formData = await req.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type
    if (!isAllowedVideoType(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP4, MOV, WebM' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
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
        mimeType: file.type,
        size: file.size,
        duration: duration,
        createdById: userId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json(videoAsset, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
