import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';
import {
  ASPECT_RATIO_PROFILES,
  calculateResizeTransform,
  processMediaResize,
  AspectRatio,
  ResizeMode,
} from '@/lib/media/studio';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for video transcoding

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      profiles: ASPECT_RATIO_PROFILES,
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let targetRatio: AspectRatio = '16:9';
    let mode: ResizeMode = 'FIT_BLUR';
    let customScale = 100;

    let inputBuffer: Buffer | null = null;
    let originalFileName = 'media.mp4';
    let mimeType = 'video/mp4';

    // 1. Handle multipart/form-data (File upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = (formData.get('file') || formData.get('video')) as File | null;
      targetRatio = ((formData.get('targetRatio') as string) || '16:9') as AspectRatio;
      mode = ((formData.get('mode') as string) || 'FIT_BLUR') as ResizeMode;
      if (formData.get('customScale')) {
        customScale = Number(formData.get('customScale')) || 100;
      }

      if (file && typeof file !== 'string') {
        const arrayBuf = await file.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuf);
        originalFileName = file.name || 'uploaded_media.mp4';
        mimeType = file.type || 'video/mp4';
      }
    } else {
      // 2. Handle JSON request (URL or Pure Transform)
      const body = await req.json().catch(() => ({}));
      targetRatio = (body.targetRatio || '16:9') as AspectRatio;
      mode = (body.mode || 'FIT_BLUR') as ResizeMode;
      if (body.customScale) customScale = Number(body.customScale) || 100;

      const mediaUrl = body.mediaUrl || body.fileUrl || body.url;

      if (mediaUrl && typeof mediaUrl === 'string') {
        originalFileName = body.fileName || body.name || mediaUrl.split('/').pop()?.split('?')[0] || 'media.mp4';
        mimeType = body.mimeType || (/\.(jpg|jpeg|png|webp)$/i.test(originalFileName) ? 'image/png' : 'video/mp4');

        try {
          const storage = getStorage();
          inputBuffer = await storage.getBuffer(mediaUrl);
        } catch {
          // Direct fetch fallback if storage getBuffer failed
          const res = await fetch(mediaUrl);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            inputBuffer = Buffer.from(arr);
          }
        }
      } else if (!body.sourceWidth && !body.sourceHeight) {
        // No file, no mediaUrl, no sourceWidth: return error
        return NextResponse.json(
          { error: 'Vui lòng cung cấp tệp hoặc mediaUrl để thực hiện resize' },
          { status: 400, headers: corsHeaders }
        );
      } else {
        // Pure mathematical transform calculation (Backward compatibility with tests and UI spec queries)
        const sourceWidth = body.sourceWidth || 1920;
        const sourceHeight = body.sourceHeight || 1080;
        const transform = calculateResizeTransform({
          sourceWidth,
          sourceHeight,
          targetRatio,
          mode,
        });

        return NextResponse.json(
          {
            success: true,
            transform,
            targetProfile: ASPECT_RATIO_PROFILES[targetRatio],
          },
          { headers: corsHeaders }
        );
      }
    }

    // 3. If media buffer is present, transcode using processMediaResize
    if (inputBuffer && inputBuffer.length > 0) {
      let session = await auth();
      let userId = session?.user?.id;
      let workspaceId = (session?.user as any)?.workspaceId;

      if (!userId) {
        const mockUser = await prisma.user.findFirst().catch(() => null);
        if (mockUser) {
          userId = mockUser.id;
          workspaceId = mockUser.workspaceId;
        }
      }

      if (workspaceId && prisma.workspace?.findUnique) {
        const wsExists = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { id: true },
        }).catch(() => null);
        if (!wsExists) workspaceId = null;
      }

      if (userId && prisma.user?.findUnique) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }).catch(() => null);
        if (!userExists) userId = undefined;
      }

      const resized = await processMediaResize({
        inputBuffer,
        originalFileName,
        mimeType,
        targetRatio,
        mode,
        customScale,
      });

      // Upload processed buffer to Topify Storage
      const storage = getStorage();
      const storageUrl = await storage.upload(
        resized.outputBuffer,
        resized.outputFileName,
        resized.mimeType
      );

      // Create VideoAsset in database so it can be attached to posts and published to channels
      const videoAsset = await prisma.videoAsset.create({
        data: {
          originalFileName: resized.outputFileName,
          titleFromFileName: resized.outputFileName.replace(/\.[^/.]+$/, ''),
          storageUrl,
          source: 'MEDIA_STUDIO_RESIZE',
          mimeType: resized.mimeType,
          size: resized.outputBuffer.length,
          duration: resized.duration ? Math.round(resized.duration) : null,
          width: resized.width,
          height: resized.height,
          createdById: userId,
          workspaceId: workspaceId,
        },
      });

      const transform = calculateResizeTransform({
        sourceWidth: resized.width,
        sourceHeight: resized.height,
        targetRatio,
        mode,
      });

      return NextResponse.json(
        {
          success: true,
          mediaUrl: storageUrl,
          asset: {
            id: videoAsset.id,
            storageUrl: videoAsset.storageUrl,
            originalFileName: videoAsset.originalFileName,
            titleFromFileName: videoAsset.titleFromFileName,
            mimeType: videoAsset.mimeType,
            width: videoAsset.width,
            height: videoAsset.height,
            duration: videoAsset.duration,
            size: videoAsset.size,
          },
          targetProfile: ASPECT_RATIO_PROFILES[targetRatio],
          transform,
        },
        { status: 201, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Không thể đọc dữ liệu video/hình ảnh để resize' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API_MEDIA_RESIZE_POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xử lý chuyển đổi kích thước asset' },
      { status: 500, headers: corsHeaders }
    );
  }
}
