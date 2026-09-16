import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.buffOrder.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi xoá đơn buff:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, currentCount } = body;

    const updated = await prisma.buffOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(currentCount !== undefined && { currentCount })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn buff:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
