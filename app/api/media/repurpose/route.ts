import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { generateVideoRepurposeHighlights } from '@/lib/ai/9router';
import { processVideoRepurposeCut } from '@/lib/media/studio';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for video cutting

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
      feature: 'F114 - AI Video Repurpose & Highlights',
      capabilities: ['analyze', 'cut', 'upload'],
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let action = 'analyze';
    let title = '';
    let durationSeconds = 180;
    let transcriptText = '';
    let mediaUrl = '';
    let assetId = '';
    let startTime = 0;
    let endTime = 0;
    let clipTitle = '';

    let inputBuffer: Buffer | null = null;
    let originalFileName = 'video.mp4';
    let mimeType = 'video/mp4';

    // 1. Parse Multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      action = (formData.get('action') as string) || 'analyze';
      title = (formData.get('title') as string) || '';
      durationSeconds = Number(formData.get('durationSeconds')) || 0;
      transcriptText = (formData.get('transcriptText') as string) || '';
      mediaUrl = (formData.get('mediaUrl') as string) || '';
      assetId = (formData.get('assetId') as string) || '';
      startTime = Number(formData.get('startTime')) || 0;
      endTime = Number(formData.get('endTime')) || 0;
      clipTitle = (formData.get('clipTitle') as string) || title || '';

      const file = (formData.get('file') || formData.get('video')) as File | null;
      if (file && typeof file !== 'string') {
        const arrayBuf = await file.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuf);
        originalFileName = file.name || 'uploaded_video.mp4';
        mimeType = file.type || 'video/mp4';
        if (!title) title = originalFileName.replace(/\.[^/.]+$/, '');
      }
    } else {
      // 2. Parse JSON
      const body = await req.json().catch(() => ({}));
      action = body.action || 'analyze';
      title = body.title || '';
      durationSeconds = Number(body.durationSeconds) || 0;
      transcriptText = body.transcriptText || '';
      mediaUrl = body.mediaUrl || body.fileUrl || body.url || '';
      assetId = body.assetId || '';
      startTime = Number(body.startTime) || 0;
      endTime = Number(body.endTime) || 0;
      clipTitle = body.clipTitle || body.title || '';
      if (body.fileName) originalFileName = body.fileName;
    }

    // Resolve User and Workspace
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

    // -------------------------------------------------------------
    // ACTION: CUT (Physically slice video with FFmpeg & create Asset)
    // -------------------------------------------------------------
    if (action === 'cut') {
      if (!inputBuffer && assetId) {
        const existingAsset = await prisma.videoAsset.findUnique({
          where: { id: assetId },
        }).catch(() => null);
        if (existingAsset?.storageUrl) {
          mediaUrl = existingAsset.storageUrl;
          originalFileName = existingAsset.originalFileName || originalFileName;
        }
      }

      if (!inputBuffer && mediaUrl) {
        try {
          const storage = getStorage();
          inputBuffer = await storage.getBuffer(mediaUrl);
        } catch {
          const res = await fetch(mediaUrl);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            inputBuffer = Buffer.from(arr);
          }
        }
      }

      if (!inputBuffer || inputBuffer.length === 0) {
        return NextResponse.json(
          { error: 'Không tìm thấy dữ liệu video nguồn để thực hiện cắt clip' },
          { status: 400, headers: corsHeaders }
        );
      }

      const cutResult = await processVideoRepurposeCut({
        inputBuffer,
        originalFileName,
        startTime,
        endTime,
        clipTitle,
      });

      // Upload cut clip to Topify Storage
      const storage = getStorage();
      const storageUrl = await storage.upload(
        cutResult.outputBuffer,
        cutResult.outputFileName,
        cutResult.mimeType
      );

      // Create VideoAsset in database
      const videoAsset = await prisma.videoAsset.create({
        data: {
          originalFileName: cutResult.outputFileName,
          titleFromFileName: clipTitle || cutResult.outputFileName.replace(/\.[^/.]+$/, ''),
          storageUrl,
          source: 'MEDIA_STUDIO_REPURPOSE',
          mimeType: cutResult.mimeType,
          size: cutResult.outputBuffer.length,
          duration: cutResult.duration,
          width: cutResult.width || 1080,
          height: cutResult.height || 1920,
          createdById: userId,
          workspaceId: workspaceId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          clipUrl: storageUrl,
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
        },
        { status: 201, headers: corsHeaders }
      );
    }

    // -------------------------------------------------------------
    // ACTION: ANALYZE (AI extract highlight markers, hook, caption)
    // -------------------------------------------------------------
    let sourceAsset: any = null;

    // If an actual video file was uploaded during analyze, persist it as source VideoAsset
    if (inputBuffer && inputBuffer.length > 0) {
      try {
        const storage = getStorage();
        const savedUrl = await storage.upload(inputBuffer, originalFileName, mimeType);
        sourceAsset = await prisma.videoAsset.create({
          data: {
            originalFileName,
            titleFromFileName: title || originalFileName.replace(/\.[^/.]+$/, ''),
            storageUrl: savedUrl,
            source: 'MEDIA_STUDIO_SOURCE',
            mimeType,
            size: inputBuffer.length,
            duration: durationSeconds > 0 ? durationSeconds : null,
            createdById: userId,
            workspaceId: workspaceId,
          },
        });
      } catch (saveErr) {
        console.warn('Could not save uploaded source video to storage:', saveErr);
      }
    }

    const effectiveTitle = title || (sourceAsset ? sourceAsset.titleFromFileName : 'Video chia sẻ kiến thức kinh doanh đa kênh');
    const effectiveDuration = durationSeconds > 0 ? durationSeconds : 180;

    const result = await generateVideoRepurposeHighlights({
      title: effectiveTitle,
      durationSeconds: effectiveDuration,
      transcriptText,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        sourceAsset,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API_MEDIA_REPURPOSE_POST]', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể tách clip highlight từ video' },
      { status: 500, headers: corsHeaders }
    );
  }
}
