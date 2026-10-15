/**
 * M10. Campaign Core Engine
 * Manages Objectives & KPIs (F133), Budget Allocation & Burn Rate (F134),
 * Channel & Content Planning (F135), Asset Approvals (F137),
 * Progress Tracking (F138), and Financial Reports & ROI (F139).
 */

export type CampaignStatus = 'DRAFT' | 'PLANNING' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type CampaignObjectiveType = 'REVENUE' | 'LEADS' | 'REACH' | 'APP_INSTALL' | 'CONVERSIONS';
export type BudgetCategoryKey = 'PAID_ADS' | 'KOL_BOOKING' | 'CREATIVE_MEDIA' | 'SEEDING_OPS';
export type ChannelKey = 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'SHOPEE';
export type PhaseKey = 'TEASER' | 'KICKOFF' | 'PEAK_SALE' | 'POST_SALE';
export type AssetType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
export type AssetApprovalStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface CampaignKPI {
  id: string;
  name: string;
  metricType: CampaignObjectiveType;
  targetValue: number;
  currentValue: number;
  unit: string;
  completionRate: number; // 0 - 100%
}

export interface CampaignBudgetCategory {
  category: BudgetCategoryKey;
  label: string;
  plannedAmount: number;
  actualSpent: number;
  color: string;
}

export interface CampaignPhase {
  id: string;
  name: string;
  phaseKey: PhaseKey;
  startDate: string;
  endDate: string;
  targetPostsCount: number;
  publishedPostsCount: number;
  description: string;
}

export interface CampaignAssetItem {
  id: string;
  campaignId: string;
  name: string;
  type: AssetType;
  fileUrl: string;
  fileSize: number;
  thumbnailUrl?: string;
  approvalStatus: AssetApprovalStatus;
  reviewedBy?: string;
  reviewerNote?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface CampaignContentItem {
  id: string;
  title: string;
  channel: ChannelKey;
  phaseKey: PhaseKey;
  format: 'REEL_SHORT' | 'POST' | 'LIVESTREAM' | 'STORY';
  scheduledDate: string;
  status: 'PLANNED' | 'PRODUCING' | 'READY' | 'PUBLISHED';
}

export interface CampaignFinancialReport {
  campaignId: string;
  totalRevenue: number;
  totalPlannedBudget: number;
  totalActualSpend: number;
  paidAdsSpend: number;
  netProfit: number;
  roiPercentage: number;
  roas: number;
  totalLeads: number;
  costPerLead: number;
  totalOrders: number;
  costPerAcquisition: number;
  rating: 'OUTSTANDING' | 'ON_TARGET' | 'NEEDS_IMPROVEMENT';
  summaryVerdict: string;
}

export interface EnrichedCampaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  objectiveType: CampaignObjectiveType;
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpent: number;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  channels: ChannelKey[];
  kpis: CampaignKPI[];
  budgetCategories: CampaignBudgetCategory[];
  phases: CampaignPhase[];
  assetsCount: number;
  contentPlanCount: number;
  tasksCount: number;
  completedTasksCount: number;
  financialSummary: CampaignFinancialReport;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// F134: BUDGET BURN RATE & OVERSPEND CALCULATOR
// ============================================================================
export function calculateBudgetBurnRate(
  plannedAmount: number,
  actualSpent: number,
  startDateStr: string,
  endDateStr: string
): {
  spentPercentage: number;
  timeElapsedPercentage: number;
  isOverspending: boolean;
  burnRateStatus: 'NORMAL' | 'ACCELERATED' | 'OVER_BUDGET';
  projectedEndSpend: number;
} {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  const now = Date.now();

  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(totalDuration, now - start));

  const timeElapsedPercentage = Math.round((elapsed / totalDuration) * 100);
  const spentPercentage = plannedAmount > 0 ? Math.round((actualSpent / plannedAmount) * 100) : 0;

  // If spent percentage outpaces time elapsed by > 15%, flag accelerated
  const isOverspending = actualSpent > plannedAmount || spentPercentage > timeElapsedPercentage + 15;

  let burnRateStatus: 'NORMAL' | 'ACCELERATED' | 'OVER_BUDGET' = 'NORMAL';
  if (actualSpent >= plannedAmount) {
    burnRateStatus = 'OVER_BUDGET';
  } else if (isOverspending) {
    burnRateStatus = 'ACCELERATED';
  }

  // Projected spend
  const dailyRate = elapsed > 0 ? actualSpent / (elapsed / (24 * 3600 * 1000)) : 0;
  const totalDays = totalDuration / (24 * 3600 * 1000);
  const projectedEndSpend = Math.round(dailyRate * totalDays);

  return {
    spentPercentage,
    timeElapsedPercentage,
    isOverspending,
    burnRateStatus,
    projectedEndSpend,
  };
}

// ============================================================================
// F139: CAMPAIGN FINANCIALS & ROI CALCULATOR
// ============================================================================
export function calculateCampaignROI(
  revenue: number,
  totalSpend: number,
  adsSpend: number,
  leadsCount: number,
  ordersCount: number
): CampaignFinancialReport {
  const netProfit = revenue - totalSpend;
  const roiPercentage = totalSpend > 0 ? Math.round((netProfit / totalSpend) * 100) : 0;
  const roas = adsSpend > 0 ? Math.round((revenue / adsSpend) * 10) / 10 : 0;
  const costPerLead = leadsCount > 0 ? Math.round(totalSpend / leadsCount) : 0;
  const costPerAcquisition = ordersCount > 0 ? Math.round(totalSpend / ordersCount) : 0;

  let rating: 'OUTSTANDING' | 'ON_TARGET' | 'NEEDS_IMPROVEMENT' = 'ON_TARGET';
  let summaryVerdict = 'Chiến dịch đạt hiệu suất ổn định theo kế hoạch đề ra.';

  if (roiPercentage >= 150 || roas >= 4.0) {
    rating = 'OUTSTANDING';
    summaryVerdict = 'Chiến dịch bùng nổ vượt bậc, tỷ suất sinh lời ROI và ROAS ở mức xuất sắc!';
  } else if (roiPercentage < 20 || roas < 1.5) {
    rating = 'NEEDS_IMPROVEMENT';
    summaryVerdict = 'Hiệu suất chuyển đổi chưa đạt kỳ vọng, chi phí trên mỗi đơn (CPA) còn cao.';
  }

  return {
    campaignId: '',
    totalRevenue: revenue,
    totalPlannedBudget: totalSpend * 1.1,
    totalActualSpend: totalSpend,
    paidAdsSpend: adsSpend,
    netProfit,
    roiPercentage,
    roas,
    totalLeads: leadsCount,
    costPerLead,
    totalOrders: ordersCount,
    costPerAcquisition,
    rating,
    summaryVerdict,
  };
}

// ============================================================================
// SAMPLE BUILT-IN DATA FOR INSTANT DESKTOP & DEMO
// ============================================================================
export const SAMPLE_CAMPAIGNS: EnrichedCampaign[] = [
  {
    id: 'camp_1',
    name: 'Mega Sale Giữa Tháng 11.11 - Siêu Sale Nồi Chiên & Gia Dụng',
    description: 'Chiến dịch trọng điểm quý 4 kích hoạt doanh số trên TikTok Shop, Facebook Reels và phễu CRM Topify.',
    status: 'RUNNING',
    objectiveType: 'REVENUE',
    startDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    totalBudget: 85000000, // 85 triệu
    totalSpent: 42500000,  // 42.5 triệu (50%)
    ownerId: 'user_1',
    ownerName: 'Nguyễn Văn A (Lead)',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    channels: ['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'SHOPEE'],
    kpis: [
      {
        id: 'kpi_1',
        name: 'Doanh thu thuần mục tiêu',
        metricType: 'REVENUE',
        targetValue: 280000000,
        currentValue: 196000000,
        unit: 'đ',
        completionRate: 70,
      },
      {
        id: 'kpi_2',
        name: 'Số lượng Lead mới thu về CRM',
        metricType: 'LEADS',
        targetValue: 800,
        currentValue: 620,
        unit: 'leads',
        completionRate: 77.5,
      },
      {
        id: 'kpi_3',
        name: 'Độ phủ video (Total Views)',
        metricType: 'REACH',
        targetValue: 1500000,
        currentValue: 1280000,
        unit: 'lượt xem',
        completionRate: 85.3,
      },
    ],
    budgetCategories: [
      { category: 'PAID_ADS', label: 'Quảng cáo trả phí (TikTok & FB Ads)', plannedAmount: 45000000, actualSpent: 26000000, color: '#3b82f6' },
      { category: 'KOL_BOOKING', label: 'Booking KOC/KOL Review sản phẩm', plannedAmount: 25000000, actualSpent: 12000000, color: '#a855f7' },
      { category: 'CREATIVE_MEDIA', label: 'Sản xuất Video & Banner Creative', plannedAmount: 10000000, actualSpent: 3500000, color: '#10b981' },
      { category: 'SEEDING_OPS', label: 'Seeding hội nhóm & Vận hành phễu', plannedAmount: 5000000, actualSpent: 1000000, color: '#f59e0b' },
    ],
    phases: [
      {
        id: 'ph_1',
        name: 'Giai đoạn 1: Teaser & Thu thập Lead sớm',
        phaseKey: 'TEASER',
        startDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 8,
        publishedPostsCount: 8,
        description: 'Tung video ngắn hé lộ deal khủng và mời vào nhóm Zalo nhận voucher độc quyền.',
      },
      {
        id: 'ph_2',
        name: 'Giai đoạn 2: Kick-off Mở bán & Đẩy mạnh Livestream',
        phaseKey: 'KICKOFF',
        startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 14,
        publishedPostsCount: 11,
        description: 'Phát trực tiếp đa kênh, tung mã giảm giá giờ vàng và đẩy ngân sách TikTok Ads.',
      },
      {
        id: 'ph_3',
        name: 'Giai đoạn 3: Mega Peak Sale & Countdown Chốt đơn',
        phaseKey: 'PEAK_SALE',
        startDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 12,
        publishedPostsCount: 0,
        description: 'Chiến dịch giờ chót, email nhắc giỏ hàng bỏ quên và SMS thông báo ưu đãi sắp hết hạn.',
      },
      {
        id: 'ph_4',
        name: 'Giai đoạn 4: Cảm ơn & Tái chăm sóc (Post-Sale)',
        phaseKey: 'POST_SALE',
        startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 4,
        publishedPostsCount: 0,
        description: 'Gửi thiệp cảm ơn, khảo sát độ hài lòng CSKH và giới thiệu quà tặng phụ kiện.',
      },
    ],
    assetsCount: 7,
    contentPlanCount: 38,
    tasksCount: 12,
    completedTasksCount: 8,
    financialSummary: {
      campaignId: 'camp_1',
      totalRevenue: 196000000,
      totalPlannedBudget: 85000000,
      totalActualSpend: 42500000,
      paidAdsSpend: 26000000,
      netProfit: 153500000,
      roiPercentage: 361,
      roas: 7.5,
      totalLeads: 620,
      costPerLead: 68548,
      totalOrders: 312,
      costPerAcquisition: 136217,
      rating: 'OUTSTANDING',
      summaryVerdict: 'Chiến dịch bùng nổ vượt bậc, tỷ suất sinh lời ROI 361% và ROAS 7.5x rất ấn tượng!',
    },
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'camp_2',
    name: 'Ra Mắt Bộ Sưu Tập Thời Trang Thu Đông 2026',
    description: 'Chiến dịch định vị thương hiệu cao cấp kết hợp Lookbook Reels, KOC trải nghiệm và chiến dịch Retargeting.',
    status: 'PLANNING',
    objectiveType: 'LEADS',
    startDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
    totalBudget: 40000000,
    totalSpent: 6500000,
    ownerId: 'user_2',
    ownerName: 'Trần Thị B',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    channels: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK'],
    kpis: [
      {
        id: 'kpi_21',
        name: 'Đăng ký nhận Lookbook độc quyền',
        metricType: 'LEADS',
        targetValue: 1200,
        currentValue: 150,
        unit: 'leads',
        completionRate: 12.5,
      },
      {
        id: 'kpi_22',
        name: 'Lượt tương tác Reels & Shorts',
        metricType: 'REACH',
        targetValue: 800000,
        currentValue: 95000,
        unit: 'tương tác',
        completionRate: 11.9,
      },
    ],
    budgetCategories: [
      { category: 'PAID_ADS', label: 'Quảng cáo trả phí (TikTok & FB Ads)', plannedAmount: 18000000, actualSpent: 1500000, color: '#3b82f6' },
      { category: 'KOL_BOOKING', label: 'Booking KOC/KOL Review sản phẩm', plannedAmount: 14000000, actualSpent: 4000000, color: '#a855f7' },
      { category: 'CREATIVE_MEDIA', label: 'Sản xuất Video & Banner Creative', plannedAmount: 6000000, actualSpent: 1000000, color: '#10b981' },
      { category: 'SEEDING_OPS', label: 'Seeding hội nhóm & Vận hành phễu', plannedAmount: 2000000, actualSpent: 0, color: '#f59e0b' },
    ],
    phases: [
      {
        id: 'ph_21',
        name: 'Teaser Lookbook',
        phaseKey: 'TEASER',
        startDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 6,
        publishedPostsCount: 0,
        description: 'Tung bộ ảnh nghệ thuật và video moodboard phong cách châu Âu.',
      },
      {
        id: 'ph_22',
        name: 'Chính thức mở bán',
        phaseKey: 'KICKOFF',
        startDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 15,
        publishedPostsCount: 0,
        description: 'Tung mã ưu đãi cho 100 khách hàng đầu tiên và kích hoạt mạng lưới KOCs.',
      },
    ],
    assetsCount: 4,
    contentPlanCount: 21,
    tasksCount: 8,
    completedTasksCount: 3,
    financialSummary: {
      campaignId: 'camp_2',
      totalRevenue: 22000000,
      totalPlannedBudget: 40000000,
      totalActualSpend: 6500000,
      paidAdsSpend: 1500000,
      netProfit: 15500000,
      roiPercentage: 238,
      roas: 14.6,
      totalLeads: 150,
      costPerLead: 43333,
      totalOrders: 35,
      costPerAcquisition: 185714,
      rating: 'ON_TARGET',
      summaryVerdict: 'Giai đoạn chuẩn bị tiến triển tốt, chi phí thu lead sớm ở mức tối ưu.',
    },
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'camp_3',
    name: 'Chiến Dịch Tải Ứng Dụng Topify Mobile App Q3',
    description: 'Chạy phễu chuyển đổi cài đặt ứng dụng Topify trên iOS và Android qua chiến dịch Viral Video & Refferal.',
    status: 'COMPLETED',
    objectiveType: 'APP_INSTALL',
    startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    totalBudget: 35000000,
    totalSpent: 33800000,
    ownerId: 'user_3',
    ownerName: 'Lê Hoàng C',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    channels: ['TIKTOK', 'FACEBOOK', 'YOUTUBE'],
    kpis: [
      {
        id: 'kpi_31',
        name: 'Lượt cài đặt ứng dụng thành công',
        metricType: 'APP_INSTALL',
        targetValue: 5000,
        currentValue: 5420,
        unit: 'installs',
        completionRate: 108.4,
      },
    ],
    budgetCategories: [
      { category: 'PAID_ADS', label: 'Quảng cáo trả phí (TikTok & FB Ads)', plannedAmount: 25000000, actualSpent: 24500000, color: '#3b82f6' },
      { category: 'KOL_BOOKING', label: 'Booking KOC/KOL Review sản phẩm', plannedAmount: 7000000, actualSpent: 6800000, color: '#a855f7' },
      { category: 'CREATIVE_MEDIA', label: 'Sản xuất Video & Banner Creative', plannedAmount: 3000000, actualSpent: 2500000, color: '#10b981' },
      { category: 'SEEDING_OPS', label: 'Seeding hội nhóm & Vận hành phễu', plannedAmount: 0, actualSpent: 0, color: '#f59e0b' },
    ],
    phases: [
      {
        id: 'ph_31',
        name: 'Toàn chiến dịch',
        phaseKey: 'KICKOFF',
        startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 20,
        publishedPostsCount: 20,
        description: 'Hoàn thành chiến dịch đạt 108% KPI.',
      },
    ],
    assetsCount: 5,
    contentPlanCount: 20,
    tasksCount: 6,
    completedTasksCount: 6,
    financialSummary: {
      campaignId: 'camp_3',
      totalRevenue: 68000000,
      totalPlannedBudget: 35000000,
      totalActualSpend: 33800000,
      paidAdsSpend: 24500000,
      netProfit: 34200000,
      roiPercentage: 101,
      roas: 2.8,
      totalLeads: 5420,
      costPerLead: 6236,
      totalOrders: 450,
      costPerAcquisition: 75111,
      rating: 'ON_TARGET',
      summaryVerdict: 'Chiến dịch hoàn thành đúng hạn, CPI cài đặt app thấp hơn 15% so với benchmark ngành.',
    },
    createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

export const SAMPLE_ASSETS: CampaignAssetItem[] = [
  {
    id: 'asset_1',
    campaignId: 'camp_1',
    name: 'Banner_Hero_MegaSale_11.11_1080x1920.png',
    type: 'IMAGE',
    fileUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1080&h=1920&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=400&fit=crop',
    fileSize: 3450000,
    approvalStatus: 'APPROVED',
    reviewedBy: 'Nguyễn Văn A (Lead)',
    reviewerNote: 'Thiết kế chuẩn nhận diện thương hiệu, CTA nổi bật.',
    uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset_2',
    campaignId: 'camp_1',
    name: 'Teaser_Video_Hook3s_AirFryer_4K.mp4',
    type: 'VIDEO',
    fileUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&h=400&fit=crop',
    fileSize: 45800000,
    approvalStatus: 'APPROVED',
    reviewedBy: 'Nguyễn Văn A (Lead)',
    reviewerNote: 'Nhịp cắt 3s đầu rất cuốn, phụ đề to rõ ràng.',
    uploadedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset_3',
    campaignId: 'camp_1',
    name: 'Kich_ban_Livestream_FlashSale_11.11.pdf',
    type: 'DOCUMENT',
    fileUrl: 'https://topify.vn/docs/sample.pdf',
    fileSize: 1200000,
    approvalStatus: 'APPROVED',
    reviewedBy: 'Trần Thị B',
    reviewerNote: 'Đã bổ sung khung giờ vàng 12h trưa và 20h tối.',
    uploadedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset_4',
    campaignId: 'camp_1',
    name: 'Cover_Story_Voucher_50k.png',
    type: 'IMAGE',
    fileUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1080&h=1920&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=400&fit=crop',
    fileSize: 2100000,
    approvalStatus: 'PENDING_REVIEW',
    uploadedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset_5',
    campaignId: 'camp_1',
    name: 'KOC_Video_Draft_Unboxing.mp4',
    type: 'VIDEO',
    fileUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=400&fit=crop',
    fileSize: 32000000,
    approvalStatus: 'REJECTED',
    reviewedBy: 'Nguyễn Văn A (Lead)',
    reviewerNote: 'Âm thanh thoại bị rè nhẹ và logo nhà tài trợ bị che góc dưới, cần quay lại phần mở hộp.',
    uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
