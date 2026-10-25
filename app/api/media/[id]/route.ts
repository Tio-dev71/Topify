import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

function canAccessAsset(asset: { createdById: string; workspaceId: string | null }, session: any) {
  if (session?.user?.role === 'SUPER_ADMIN') return true;
  if (asset.createdById === session?.user?.id) return true;
  const userWorkspaceId = session?.user?.workspaceId;
  if (userWorkspaceId && asset.workspaceId && asset.workspaceId === userWorkspaceId) return true;
  return false;
}

// GET /api/media/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, email: true } }, postMedia: { include: { post: { select: { id: true, title: true } } } } },
    });
    if (!asset || !canAccessAsset(asset, session)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    let finalStorageUrl = asset.storageUrl;
    if (finalStorageUrl && !finalStorageUrl.startsWith('http://') && !finalStorageUrl.startsWith('https://')) {
      const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'topify.vn';
      const requestProto = req.headers.get('x-forwarded-proto') || (requestHost.includes('localhost') ? 'http' : 'https');
      finalStorageUrl = `${requestProto}://${requestHost}${finalStorageUrl.startsWith('/') ? '' : '/'}${finalStorageUrl}`;
    }
    return NextResponse.json({ ...asset, storageUrl: finalStorageUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/media/[id] — Update tags, alt
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing || !canAccessAsset(existing, session)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { tags: body.tags, alt: body.alt, fileName: body.fileName },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/media/[id]
export const PATCH = PUT;

// DELETE /api/media/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing || !canAccessAsset(existing, session)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.mediaAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
