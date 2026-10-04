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
    const { status, currentCount, url, actionType, targetCount, config } = body;

    const data: any = {};
    if (status) data.status = status;
    if (currentCount !== undefined) data.currentCount = parseInt(currentCount);
    if (url) data.url = url;
    if (actionType) data.actionType = actionType;
    if (targetCount !== undefined) data.targetCount = parseInt(targetCount);
    if (config !== undefined) data.config = config;

    const updated = await prisma.buffOrder.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn buff:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
