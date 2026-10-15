import prisma from '@/lib/db';

/**
 * M5. Analytics Engine
 * Comprehensive calculation engine for:
 * - F103: Content Performance Score (0-100)
 * - F104: Campaign ROI (Cost, Leads, Revenue, ROI%)
 * - F105: Lead Conversion Funnel (Interactions -> Leads -> Deals -> Won)
 * - F107: Internal Benchmarks (Platform & Content Pillar comparison)
 */

export interface PostPerformanceMetrics {
  id: string;
  title: string;
  platform: string;
  publishedAt: string;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  conversions: number;
  // Computed scores
  reachScore: number;       // 0 - 30
  engagementScore: number;  // 0 - 40
  clickScore: number;       // 0 - 20
  conversionScore: number;  // 0 - 10
  overallScore: number;     // 0 - 100
  tier: 'VIRAL' | 'GOOD' | 'UNDERPERFORMING';
  isEvergreen?: boolean;
}

export interface CampaignRoiMetrics {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  revenue: number;
  netProfit: number;
  roi: number; // Percentage, e.g. 150 = +150%
  leadsCount: number;
  wonDealsCount: number;
  cpl: number; // Cost Per Lead
  cpa: number; // Cost Per Acquisition
  startDate?: string;
  endDate?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentageFromTop: number;
  dropOffRate: number; // Drop off to next stage
}

export interface FunnelMetricsResult {
  stages: FunnelStage[];
  totalInteractions: number;
  totalLeads: number;
  totalDeals: number;
  totalWon: number;
  overallConversionRate: number; // Won / Interactions %
  leadToDealRate: number;        // Deals / Leads %
  dealToWonRate: number;         // Won / Deals %
  bottlenecks: string[];
}

export interface ChannelBenchmark {
  platform: string;
  displayName: string;
  postsCount: number;
  totalReach: number;
  totalEngagements: number;
  avgEngagementRate: number;
  avgPerformanceScore: number;
  dealsGenerated: number;
}

// =========================================================================
// F103: CONTENT PERFORMANCE SCORE CALCULATION
// =========================================================================

export function calculateContentPerformanceScore(raw: {
  reach?: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  conversions?: number;
}): {
  reachScore: number;
  engagementScore: number;
  clickScore: number;
  conversionScore: number;
  overallScore: number;
  tier: 'VIRAL' | 'GOOD' | 'UNDERPERFORMING';
} {
  const reach = Math.max(raw.reach || raw.views || 0, 0);
  const views = Math.max(raw.views || reach, 1);
  const likes = Math.max(raw.likes || 0, 0);
  const comments = Math.max(raw.comments || 0, 0);
  const shares = Math.max(raw.shares || 0, 0);
  const clicks = Math.max(raw.clicks || 0, 0);
  const conversions = Math.max(raw.conversions || 0, 0);

  // 1. Reach Score (Max 30) - Logarithmic scale (1,000 views = 15đ, 10,000 views = 25đ, >=30,000 = 30đ)
  let reachScore = 0;
  if (views > 0) {
    reachScore = Math.min(30, Math.round(Math.log10(views) * 6.5));
    reachScore = Math.max(5, reachScore);
  }

  // 2. Engagement Score (Max 40) - Based on weighted engagements vs reach
  // Weight: Like=1, Comment=2.5, Share=4
  const weightedEngagements = likes * 1 + comments * 2.5 + shares * 4;
  const engagementRate = reach > 0 ? (weightedEngagements / reach) * 100 : 0;
  // If engagement rate is 10%, score is 40. Scale linearly from 0-10% rate
  const engagementScore = Math.min(40, Math.round((engagementRate / 10) * 40));

  // 3. Click Score (Max 20) - CTR based
  const ctr = views > 0 ? (clicks / views) * 100 : 0;
  // 3% CTR = 20 points
  const clickScore = Math.min(20, Math.round((ctr / 3) * 20));

  // 4. Conversion Score (Max 10) - Deals/Leads won
  const conversionScore = Math.min(10, conversions * 2.5);

  const overallScore = Math.min(100, Math.max(10, reachScore + engagementScore + clickScore + conversionScore));

  let tier: 'VIRAL' | 'GOOD' | 'UNDERPERFORMING' = 'GOOD';
  if (overallScore >= 85) {
    tier = 'VIRAL';
  } else if (overallScore < 60) {
    tier = 'UNDERPERFORMING';
  }

  return {
    reachScore,
    engagementScore,
    clickScore,
    conversionScore,
    overallScore,
    tier,
  };
}

// =========================================================================
// F104: CAMPAIGN ROI CALCULATION
// =========================================================================

export function calculateCampaignRoi(campaign: {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  startDate?: Date | null;
  endDate?: Date | null;
}, deals: Array<{ value: number; status: string }>, leadsCount: number): CampaignRoiMetrics {
  const totalCost = campaign.spent > 0 ? campaign.spent : campaign.budget;
  const wonDeals = deals.filter(d => d.status === 'WON');
  const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const netProfit = revenue - totalCost;

  let roi = 0;
  if (totalCost > 0) {
    roi = ((revenue - totalCost) / totalCost) * 100;
  } else if (revenue > 0) {
    roi = 100;
  }

  const cpl = leadsCount > 0 ? totalCost / leadsCount : 0;
  const cpa = wonDeals.length > 0 ? totalCost / wonDeals.length : 0;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    budget: campaign.budget,
    spent: campaign.spent,
    revenue,
    netProfit,
    roi: Math.round(roi * 10) / 10,
    leadsCount,
    wonDealsCount: wonDeals.length,
    cpl: Math.round(cpl),
    cpa: Math.round(cpa),
    startDate: campaign.startDate ? campaign.startDate.toISOString() : undefined,
    endDate: campaign.endDate ? campaign.endDate.toISOString() : undefined,
  };
}

// =========================================================================
// F105: LEAD CONVERSION FUNNEL
// =========================================================================

export function calculateConversionFunnel(params: {
  interactions: number;
  leads: number;
  deals: number;
  won: number;
}): FunnelMetricsResult {
  const interactions = Math.max(params.interactions, 1);
  const leads = Math.max(params.leads, 0);
  const deals = Math.max(params.deals, 0);
  const won = Math.max(params.won, 0);

  // Drop-offs
  const dropToLeads = interactions > 0 ? Math.max(0, ((interactions - leads) / interactions) * 100) : 0;
  const dropToDeals = leads > 0 ? Math.max(0, ((leads - deals) / leads) * 100) : 0;
  const dropToWon = deals > 0 ? Math.max(0, ((deals - won) / deals) * 100) : 0;

  const stages: FunnelStage[] = [
    {
      id: 'stage_1',
      name: '1. Tương tác & Tin nhắn (Top of Funnel)',
      count: interactions,
      percentageFromTop: 100,
      dropOffRate: Math.round(dropToLeads * 10) / 10,
    },
    {
      id: 'stage_2',
      name: '2. Khách tiềm năng (Leads CRM)',
      count: leads,
      percentageFromTop: Math.round((leads / interactions) * 1000) / 10,
      dropOffRate: Math.round(dropToDeals * 10) / 10,
    },
    {
      id: 'stage_3',
      name: '3. Cơ hội bán hàng (Deals Pipeline)',
      count: deals,
      percentageFromTop: Math.round((deals / interactions) * 1000) / 10,
      dropOffRate: Math.round(dropToWon * 10) / 10,
    },
    {
      id: 'stage_4',
      name: '4. Chốt đơn thành công (Deals Won)',
      count: won,
      percentageFromTop: Math.round((won / interactions) * 1000) / 10,
      dropOffRate: 0,
    },
  ];

  const overallConversionRate = Math.round((won / interactions) * 10000) / 100;
  const leadToDealRate = leads > 0 ? Math.round((deals / leads) * 1000) / 10 : 0;
  const dealToWonRate = deals > 0 ? Math.round((won / deals) * 1000) / 10 : 0;

  const bottlenecks: string[] = [];
  if (dropToLeads > 95) {
    bottlenecks.push('Tỷ lệ chuyển đổi từ Tương tác sang Lead thấp (>95% rớt). Cần bổ sung Call-to-action kêu gọi để lại SĐT trong bài viết.');
  }
  if (dropToDeals > 70) {
    bottlenecks.push('Hơn 70% Lead chưa được tạo Deal. Đội ngũ tư vấn cần chủ động mở cơ hội báo giá trong vòng 15 phút.');
  }
  if (dropToWon > 60) {
    bottlenecks.push('Tỷ lệ chốt đơn (Deal to Won) dưới 40%. Cần tối ưu lại chính sách khuyến mãi hoặc kịch bản chốt sale.');
  }

  return {
    stages,
    totalInteractions: interactions,
    totalLeads: leads,
    totalDeals: deals,
    totalWon: won,
    overallConversionRate,
    leadToDealRate,
    dealToWonRate,
    bottlenecks,
  };
}

// =========================================================================
// F107: INTERNAL BENCHMARKING
// =========================================================================

export function calculateInternalBenchmarks(posts: PostPerformanceMetrics[]): ChannelBenchmark[] {
  const platforms = ['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'];
  const platformNames: Record<string, string> = {
    TIKTOK: 'TikTok Video',
    FACEBOOK: 'Facebook Reels / Page',
    INSTAGRAM: 'Instagram Reels',
    YOUTUBE: 'YouTube Shorts',
  };

  return platforms.map((plt) => {
    const matched = posts.filter((p) => p.platform.toUpperCase().includes(plt));
    const count = matched.length;
    const totalReach = matched.reduce((sum, p) => sum + p.reach, 0);
    const totalEngagements = matched.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0);
    const avgScore = count > 0 ? Math.round(matched.reduce((sum, p) => sum + p.overallScore, 0) / count) : 0;
    const avgEngagementRate = totalReach > 0 ? Math.round((totalEngagements / totalReach) * 1000) / 10 : 0;
    const dealsGenerated = matched.reduce((sum, p) => sum + p.conversions, 0);

    return {
      platform: plt,
      displayName: platformNames[plt] || plt,
      postsCount: count,
      totalReach,
      totalEngagements,
      avgEngagementRate,
      avgPerformanceScore: avgScore,
      dealsGenerated,
    };
  });
}
