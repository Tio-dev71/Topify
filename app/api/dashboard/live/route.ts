import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    let fileProfiles: string[] = [];
    if (fs.existsSync(screenshotsDir)) {
      fileProfiles = fs.readdirSync(screenshotsDir)
        .filter(f => f.endsWith('.jpg'))
        .map(f => f.replace('.jpg', ''));
    }

    // Lấy các tác vụ đang chạy trong database
    const runningTasks = await prisma.automationTask.findMany({
      where: { status: 'RUNNING' },
      orderBy: { updatedAt: 'desc' },
    });

    // Gom tất cả profileId từ các tác vụ đang chạy
    const taskProfileIds: string[] = runningTasks.flatMap(t => {
      if (Array.isArray(t.profileIds)) {
        return (t.profileIds as any[]).map(id => String(id)).filter(Boolean);
      }
      return [];
    });
    const allProfileIds: string[] = Array.from(new Set([...fileProfiles, ...taskProfileIds]));

    // Lấy thông tin tài khoản Facebook tương ứng
    let accounts: any[] = [];
    if (allProfileIds.length > 0) {
      accounts = await prisma.facebookAccount.findMany({
        where: {
          OR: [
            { id: { in: allProfileIds } },
            { profileId: { in: allProfileIds } }
          ]
        },
        select: {
          id: true,
          name: true,
          uid: true,
          profileId: true,
          status: true,
        }
      });
    }

    // Lấy logs hoạt động gần nhất
    const recentLogs = await prisma.automationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      activeProfiles: allProfileIds,
      runningTasks,
      accounts,
      recentLogs,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Failed to get live profiles:', error);
    return NextResponse.json({ activeProfiles: [], runningTasks: [], accounts: [], recentLogs: [] });
  }
}

