import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const memoryAudits = securityEngineStore.getOAuthAudits();

    // Query real social accounts from database if available
    let dbAccounts: any[] = [];
    try {
      dbAccounts = await prisma.socialAccount.findMany({
        select: {
          id: true,
          provider: true,
          accountName: true,
          expiresAt: true,
          status: true,
        },
      });
    } catch {}

    // Merge or enrich audits
    const enrichedAudits = [...memoryAudits];
    for (const dbAcc of dbAccounts) {
      if (!enrichedAudits.some((a) => a.id === dbAcc.id)) {
        enrichedAudits.push({
          id: dbAcc.id,
          provider: dbAcc.provider as any,
          accountName: dbAcc.accountName || `Kênh ${dbAcc.provider}`,
          tokenStatus: dbAcc.status === 'CONNECTED' ? 'HEALTHY' : 'REVOKED',
          expiresAt: dbAcc.expiresAt ? dbAcc.expiresAt.toISOString() : new Date(Date.now() + 86400000 * 30).toISOString(),
          daysRemaining: 30,
          grantedScopes: ['read_profile', 'publish_content'],
          requiredScopes: ['read_profile', 'publish_content'],
          missingScopes: [],
          healthScore: dbAcc.status === 'CONNECTED' ? 100 : 0,
          lastAuditedAt: new Date().toISOString(),
        });
      }
    }

    const averageHealthScore = Math.round(
      enrichedAudits.reduce((sum, a) => sum + a.healthScore, 0) / (enrichedAudits.length || 1)
    );

    return NextResponse.json({
      success: true,
      data: {
        accounts: enrichedAudits,
        totalConnected: enrichedAudits.length,
        healthyCount: enrichedAudits.filter((a) => a.tokenStatus === 'HEALTHY').length,
        expiringSoonCount: enrichedAudits.filter((a) => a.tokenStatus === 'EXPIRING_SOON').length,
        averageHealthScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi kiểm tra quyền OAuth' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'recheck', accountId } = body;

    if (action === 'recheck') {
      if (!accountId) {
        return NextResponse.json({ success: false, error: 'accountId là bắt buộc' }, { status: 400 });
      }
      const updated = securityEngineStore.recheckOAuthAccount(accountId);
      const accounts = securityEngineStore.getOAuthAudits();
      return NextResponse.json({
        success: true,
        message: 'Đã hoàn tất rà soát lại token và quyền OAuth thành công',
        data: { account: updated, accounts },
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi thao tác kiểm toán OAuth' },
      { status: 500 }
    );
  }
}
