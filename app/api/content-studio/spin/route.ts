import { NextRequest, NextResponse } from 'next/server';
import {
  generateSpinVariants,
  parseSpintax,
  calculateUniquenessScore,
} from '@/lib/content-studio/content-studio-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content-studio/spin
 * F015: Spin nội dung - Tự sinh biến thể caption tránh trùng lặp/spam & Spintax Parser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, count = 3, originalTitle = '', testSpintaxOnly = false } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nội dung caption hoặc cú pháp spintax để xử lý' },
        { status: 400 }
      );
    }

    // Nếu chỉ muốn kiểm thử Spintax
    if (testSpintaxOnly) {
      const spintaxResult = parseSpintax(text);
      return NextResponse.json({
        success: true,
        data: spintaxResult,
      });
    }

    const safeCount = Math.max(1, Math.min(10, Number(count) || 3));
    const result = generateSpinVariants(text, safeCount, originalTitle);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/content-studio/spin:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể tạo biến thể spin nội dung' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-studio/spin
 * Lấy các mẫu Spintax hướng dẫn chuẩn
 */
export async function GET() {
  const sampleSpintax =
    '{Xin chào|Chào các bạn|Hi cả nhà}, {hôm nay|ngày đẹp trời hôm nay} mình xin {chia sẻ|bật mí|gửi tới bạn} {bí quyết|tuyệt chiêu|mẹo đỉnh cao} để {tăng doanh số|bùng nổ đơn hàng} nhé!';

  const parsed = parseSpintax(sampleSpintax);

  return NextResponse.json({
    success: true,
    data: {
      guide: 'Sử dụng cú pháp {từ 1|từ 2|từ 3} để hệ thống tự động hoán đổi từ ngữ ngẫu nhiên.',
      sampleSpintax,
      parsedSample: parsed,
      features: [
        'Hỗ trợ Spintax lồng nhau {A|B|{C|D}}',
        'Tự động sinh 3-10 biến thể với AI không cần viết Spintax',
        'Đo lường chỉ số độc nhất Uniqueness Score (%) chống thuật toán spam',
        'Tự động xáo trộn Hook, Body, Emoji và CTA',
      ],
    },
  });
}
