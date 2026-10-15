import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_CAMPAIGNS } from '@/lib/campaigns/engine';

// GET /api/campaigns/report?campaignId=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId') || 'camp_1';

    const campaign = SAMPLE_CAMPAIGNS.find((c) => c.id === campaignId) || SAMPLE_CAMPAIGNS[0];
    const report = campaign.financialSummary;

    // Actionable recommendations based on metrics
    const recommendations: string[] = [];
    if (report.roas >= 4.0) {
      recommendations.push('ROAS vượt mốc 4.0x: Đề xuất mở rộng ngân sách quảng cáo thêm 20-30% cho các nhóm quảng cáo video hiệu quả nhất.');
    }
    if (report.costPerLead < 80000) {
      recommendations.push('Chi phí Lead (CPL) đang tối ưu rất tốt: Kích hoạt phễu chăm sóc tự động CRM và gửi voucher qua Zalo OA ngay trong 15 phút đầu.');
    }
    if (report.roiPercentage >= 150) {
      recommendations.push('Lưu trữ toàn bộ kịch bản và tệp sáng tạo (Assets) của chiến dịch này vào Thư viện Mẫu để tái sử dụng cho các đợt Mega Sale kế tiếp.');
    } else {
      recommendations.push('Cần rà soát lại Hook 3s đầu của các video Reels/TikTok để gia tăng tỷ lệ giữ chân người xem và hạ thấp chi phí CPA.');
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      objectiveType: campaign.objectiveType,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      report,
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGN_REPORT_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
