import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const logs = securityEngineStore.getAuditLogs();

    if (format === 'csv') {
      const csvHeader = 'ID,ActorEmail,ActorRole,Action,Category,IPAddress,Location,Status,Timestamp\n';
      const csvRows = logs
        .map((l) => `"${l.id}","${l.actorEmail}","${l.actorRole}","${l.action}","${l.category}","${l.ipAddress}","${l.location}","${l.status}","${l.timestamp}"`)
        .join('\n');
      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="Topify_Security_Audit_Report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
