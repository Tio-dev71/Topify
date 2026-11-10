import { NextRequest, NextResponse } from 'next/server';
import { securityEngineStore } from '@/lib/security/security-engine';

export async function GET() {
  try {
    const endpoints = securityEngineStore.getPublicApiCatalog();

    const quotaInfo = {
      planName: 'Gói Doanh Nghiệp Pro',
      rateLimitPerMin: 300,
      monthlyQuotaRequests: 200000,
      usedRequestsThisMonth: 14250,
      remainingRequests: 185750,
      usagePercent: 7.1,
      apiBaseUrl: 'https://topify.vn/api/v1',
    };

    return NextResponse.json({
      success: true,
      data: {
        endpoints,
        quotaInfo,
        categories: [
          { id: 'CHANNELS', label: 'Kênh Mạng Xã Hội', count: endpoints.filter((e) => e.category === 'CHANNELS').length },
          { id: 'CONTENT', label: 'Bài Viết & Lịch Đăng', count: endpoints.filter((e) => e.category === 'CONTENT').length },
          { id: 'CRM', label: 'Khách Hàng & Lead CRM', count: endpoints.filter((e) => e.category === 'CRM').length },
          { id: 'TASKS', label: 'Nhiệm Vụ & Công Việc', count: endpoints.filter((e) => e.category === 'TASKS').length },
          { id: 'ANALYTICS', label: 'Báo Cáo & Số Liệu', count: endpoints.filter((e) => e.category === 'ANALYTICS').length },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải tài liệu Public API' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpointPath = '/api/v1/channels', method = 'GET' } = body;

    const endpoints = securityEngineStore.getPublicApiCatalog();
    const matched = endpoints.find((e) => e.path === endpointPath && e.method === method) || endpoints[0];

    const executionTimeMs = Math.floor(Math.random() * 45) + 25;
    let parsedSample = {};
    try {
      parsedSample = JSON.parse(matched.sampleResponse);
    } catch {
      parsedSample = { success: true, message: 'Thực thi API Sandbox thành công' };
    }

    return NextResponse.json({
      success: true,
      data: {
        statusCode: 200,
        executionTimeMs,
        endpointPath: matched.path,
        method: matched.method,
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'x-ratelimit-limit': '300',
          'x-ratelimit-remaining': '299',
          'x-topify-request-id': `req_${Date.now()}`,
        },
        responseBody: parsedSample,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi kiểm tra Public API Sandbox' },
      { status: 500 }
    );
  }
}
