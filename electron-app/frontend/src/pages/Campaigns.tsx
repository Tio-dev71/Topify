import { useState, useEffect } from 'react';
import {
  Rocket,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Image,
  Video,
  Eye,
  Check,
  X,
  Sparkles,
  Download,
  Share2,
  ChevronRight,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export type CampaignStatus = 'DRAFT' | 'PLANNING' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type CampaignObjectiveType = 'REVENUE' | 'LEADS' | 'REACH' | 'APP_INSTALL' | 'CONVERSIONS';
export type ChannelKey = 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'SHOPEE';
export type PhaseKey = 'TEASER' | 'KICKOFF' | 'PEAK_SALE' | 'POST_SALE';
export type AssetApprovalStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface CampaignKPI {
  id: string;
  name: string;
  metricType: CampaignObjectiveType;
  targetValue: number;
  currentValue: number;
  unit: string;
  completionRate: number;
}

export interface CampaignBudgetCategory {
  category: string;
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
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  fileUrl: string;
  fileSize: number;
  thumbnailUrl?: string;
  approvalStatus: AssetApprovalStatus;
  reviewedBy?: string;
  reviewerNote?: string;
  uploadedAt: string;
  updatedAt: string;
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

// Initial Sample Campaigns
const INITIAL_CAMPAIGNS: EnrichedCampaign[] = [
  {
    id: 'camp_1',
    name: 'Mega Sale Giữa Tháng 11.11 - Siêu Sale Nồi Chiên & Gia Dụng',
    description: 'Chiến dịch trọng điểm quý 4 kích hoạt doanh số trên TikTok Shop, Facebook Reels và phễu CRM Topify.',
    status: 'RUNNING',
    objectiveType: 'REVENUE',
    startDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    totalBudget: 85000000,
    totalSpent: 42500000,
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
    assetsCount: 5,
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
    totalSpent: 0,
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
        currentValue: 0,
        unit: 'leads',
        completionRate: 0,
      },
      {
        id: 'kpi_22',
        name: 'Lượt tương tác Reels & Shorts',
        metricType: 'REACH',
        targetValue: 800000,
        currentValue: 0,
        unit: 'tương tác',
        completionRate: 0,
      },
    ],
    budgetCategories: [
      { category: 'PAID_ADS', label: 'Quảng cáo trả phí (TikTok & FB Ads)', plannedAmount: 18000000, actualSpent: 0, color: '#3b82f6' },
      { category: 'KOL_BOOKING', label: 'Booking KOC/KOL Review sản phẩm', plannedAmount: 14000000, actualSpent: 0, color: '#a855f7' },
      { category: 'CREATIVE_MEDIA', label: 'Sản xuất Video & Banner Creative', plannedAmount: 6000000, actualSpent: 0, color: '#10b981' },
      { category: 'SEEDING_OPS', label: 'Seeding hội nhóm & Vận hành phễu', plannedAmount: 2000000, actualSpent: 0, color: '#f59e0b' },
    ],
    phases: [
      {
        id: 'ph_21',
        name: 'Giai đoạn 1: Teaser Lookbook & Thu thập Lead',
        phaseKey: 'TEASER',
        startDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 6,
        publishedPostsCount: 0,
        description: 'Tung bộ ảnh nghệ thuật và video moodboard phong cách châu Âu.',
      },
      {
        id: 'ph_22',
        name: 'Giai đoạn 2: Chính thức mở bán BST Thu Đông',
        phaseKey: 'KICKOFF',
        startDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
        targetPostsCount: 15,
        publishedPostsCount: 0,
        description: 'Tung mã ưu đãi cho 100 khách hàng đầu tiên và kích hoạt mạng lưới KOCs.',
      },
    ],
    assetsCount: 3,
    contentPlanCount: 21,
    tasksCount: 8,
    completedTasksCount: 2,
    financialSummary: {
      campaignId: 'camp_2',
      totalRevenue: 0,
      totalPlannedBudget: 40000000,
      totalActualSpend: 0,
      paidAdsSpend: 0,
      netProfit: 0,
      roiPercentage: 0,
      roas: 0,
      totalLeads: 0,
      costPerLead: 0,
      totalOrders: 0,
      costPerAcquisition: 0,
      rating: 'ON_TARGET',
      summaryVerdict: 'Chiến dịch đang trong giai đoạn lên kế hoạch và chuẩn bị tài nguyên trước ngày khởi chạy.',
    },
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'camp_3',
    name: 'Chiến Dịch Tải Ứng Dụng Topify Mobile App Q3',
    description: 'Chạy phễu chuyển đổi cài đặt ứng dụng Topify trên iOS và Android qua chiến dịch Viral Video & Referral.',
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
    budgetCategories: [],
    phases: [],
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

const INITIAL_ASSETS: CampaignAssetItem[] = [
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

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'progress' | 'assets' | 'report'>('campaigns');
  const [campaigns, setCampaigns] = useState<EnrichedCampaign[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('camp_1');
  const [assets, setAssets] = useState<CampaignAssetItem[]>(INITIAL_ASSETS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterObjective, setFilterObjective] = useState<string>('ALL');

  // Create Campaign Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampObjective, setNewCampObjective] = useState<CampaignObjectiveType>('REVENUE');
  const [newCampBudget, setNewCampBudget] = useState('50000000');
  const [newCampChannels, setNewCampChannels] = useState<ChannelKey[]>(['TIKTOK', 'FACEBOOK']);
  const [newCampStartDate, setNewCampStartDate] = useState('');
  const [newCampEndDate, setNewCampEndDate] = useState('');

  // F133: KPI Detail Inputs
  const [newKpiName, setNewKpiName] = useState('Doanh thu thuần mục tiêu');
  const [newKpiTargetValue, setNewKpiTargetValue] = useState('150000000');
  const [newKpiUnit, setNewKpiUnit] = useState('đ');

  // F134: Budget Allocation %
  const [newBudgetAdsPercent, setNewBudgetAdsPercent] = useState('50');
  const [newBudgetKolPercent, setNewBudgetKolPercent] = useState('30');
  const [newBudgetMediaPercent, setNewBudgetMediaPercent] = useState('15');
  const [newBudgetSeedingPercent, setNewBudgetSeedingPercent] = useState('5');

  // F135: Linked Content Plan
  const [newLinkedPlan, setNewLinkedPlan] = useState('plan_q4_ecommerce');

  // F136: Campaign Assignee & Team Lead
  const [newAssignee, setNewAssignee] = useState('user_1');

  // Asset Review Modal / State
  const [reviewAssetTarget, setReviewAssetTarget] = useState<CampaignAssetItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // Currently focused campaign
  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesObjective = filterObjective === 'ALL' || c.objectiveType === filterObjective;
    return matchesSearch && matchesStatus && matchesObjective;
  });

  // Handle Create Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch');
      return;
    }

    const budgetNum = Number(newCampBudget) || 50000000;
    const targetValNum = Number(newKpiTargetValue) || (newCampObjective === 'REVENUE' ? budgetNum * 3 : 1000);

    const adsPct = (Number(newBudgetAdsPercent) || 50) / 100;
    const kolPct = (Number(newBudgetKolPercent) || 30) / 100;
    const mediaPct = (Number(newBudgetMediaPercent) || 15) / 100;
    const seedingPct = (Number(newBudgetSeedingPercent) || 5) / 100;

    const memberMap: Record<string, { name: string; avatar: string }> = {
      user_1: { name: 'Nguyễn Văn A (Lead)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      user_2: { name: 'Trần Thị B (Content)', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
      user_3: { name: 'Lê Hoàng C (Media)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      user_4: { name: 'Vũ Đức D (Performance)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    };
    const chosenMember = memberMap[newAssignee] || memberMap['user_1'];

    const newCamp: EnrichedCampaign = {
      id: `camp_${Date.now()}`,
      name: newCampName.trim(),
      description: newCampDesc.trim() || 'Chiến dịch tiếp thị mới tạo',
      status: 'PLANNING',
      objectiveType: newCampObjective,
      startDate: newCampStartDate ? new Date(newCampStartDate).toISOString() : new Date().toISOString(),
      endDate: newCampEndDate ? new Date(newCampEndDate).toISOString() : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      totalBudget: budgetNum,
      totalSpent: 0,
      ownerId: newAssignee,
      ownerName: chosenMember.name,
      ownerAvatar: chosenMember.avatar,
      channels: newCampChannels,
      kpis: [
        {
          id: `kpi_${Date.now()}`,
          name: newKpiName.trim() || (newCampObjective === 'REVENUE' ? 'Doanh thu thuần mục tiêu' : 'Chỉ số KPI mục tiêu'),
          metricType: newCampObjective,
          targetValue: targetValNum,
          currentValue: 0,
          unit: newKpiUnit || (newCampObjective === 'REVENUE' ? 'đ' : 'lượt'),
          completionRate: 0,
        },
      ],
      budgetCategories: [
        { category: 'PAID_ADS', label: 'Quảng cáo trả phí (TikTok & FB Ads)', plannedAmount: budgetNum * adsPct, actualSpent: 0, color: '#3b82f6' },
        { category: 'KOL_BOOKING', label: 'Booking KOC/KOL Review', plannedAmount: budgetNum * kolPct, actualSpent: 0, color: '#a855f7' },
        { category: 'CREATIVE_MEDIA', label: 'Sản xuất Creative & Media', plannedAmount: budgetNum * mediaPct, actualSpent: 0, color: '#10b981' },
        { category: 'SEEDING_OPS', label: 'Seeding hội nhóm & Phễu CRM', plannedAmount: budgetNum * seedingPct, actualSpent: 0, color: '#f59e0b' },
      ],
      phases: [
        {
          id: `ph_${Date.now()}_1`,
          name: 'Giai đoạn 1: Teaser & Chuẩn bị Creative',
          phaseKey: 'TEASER',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          targetPostsCount: 6,
          publishedPostsCount: 0,
          description: 'Lên ý tưởng, kịch bản và chuẩn bị tệp creative.',
        },
        {
          id: `ph_${Date.now()}_2`,
          name: 'Giai đoạn 2: Kick-off Mở bán & Đẩy Ads',
          phaseKey: 'KICKOFF',
          startDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
          targetPostsCount: 16,
          publishedPostsCount: 0,
          description: 'Đẩy bài viết đa kênh và chạy ads chuyển đổi.',
        },
      ],
      assetsCount: 0,
      contentPlanCount: 22,
      tasksCount: 4,
      completedTasksCount: 0,
      financialSummary: {
        campaignId: `camp_${Date.now()}`,
        totalRevenue: 0,
        totalPlannedBudget: budgetNum,
        totalActualSpend: 0,
        paidAdsSpend: 0,
        netProfit: 0,
        roiPercentage: 0,
        roas: 0,
        totalLeads: 0,
        costPerLead: 0,
        totalOrders: 0,
        costPerAcquisition: 0,
        rating: 'ON_TARGET',
        summaryVerdict: 'Chiến dịch mới khởi tạo, đang trong giai đoạn chuẩn bị.',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCampaigns([newCamp, ...campaigns]);
    setSelectedCampaignId(newCamp.id);
    setIsCreateModalOpen(false);

    // Reset form
    setNewCampName('');
    setNewCampDesc('');
    setNewCampBudget('50000000');
    setNewCampStartDate('');
    setNewCampEndDate('');
    setNewKpiTargetValue('150000000');

    toast.success('Đã tạo chiến dịch mới thành công (F133 - F136)!');
  };

  // Handle Approve / Reject Asset
  const handleUpdateAssetStatus = (assetId: string, status: AssetApprovalStatus) => {
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          return {
            ...a,
            approvalStatus: status,
            reviewedBy: 'Bạn (Quản trị)',
            reviewerNote: reviewNote || (status === 'APPROVED' ? 'Đã phê duyệt đạt chuẩn.' : 'Cần chỉnh sửa lại theo yêu cầu.'),
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    setReviewAssetTarget(null);
    setReviewNote('');
    toast.success(status === 'APPROVED' ? 'Đã phê duyệt tài nguyên!' : 'Đã từ chối tài nguyên và gửi phản hồi.');
  };

  const CHANNEL_BADGE_STYLES: Record<string, string> = {
    TIKTOK: 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-gray-100 border-black/15 dark:border-white/20',
    FACEBOOK: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    INSTAGRAM: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25',
    YOUTUBE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
    SHOPEE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
    ZALO: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  };

  const formatCampaignDateRange = (startDateStr: string, endDateStr: string) => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const startFormatted = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
      const endFormatted = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
      return `${startFormatted} — ${endFormatted}`;
    } catch {
      return `${startDateStr} — ${endDateStr}`;
    }
  };

  const formatDateWithYear = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Helper render status badge
  const renderStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Đang chạy</span>;
      case 'PLANNING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">Lên kế hoạch</span>;
      case 'PAUSED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Tạm dừng</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Đã hoàn thành</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400">Bản nháp</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Quản lý Chiến dịch (Campaigns)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Phân hệ M10
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Định nghĩa mục tiêu KPI, quản lý ngân sách, kế hoạch nội dung đa kênh, duyệt tài nguyên sáng tạo và báo cáo ROI thực chiến.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 font-medium text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo chiến dịch mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'campaigns'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Danh sách Chiến dịch</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[var(--color-muted)] text-[var(--color-foreground)]">
              {campaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'progress'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tiến độ Hợp nhất (F138)</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'assets'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kho Asset & Luồng Duyệt (F137)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-500/10 text-amber-500">
              {assets.filter((a) => a.approvalStatus === 'PENDING_REVIEW').length} chờ duyệt
            </span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'report'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Báo cáo Tổng kết & ROI (F139)</span>
          </button>
        </div>

        {/* Campaign switcher for progress/assets/report */}
        {activeTab !== 'campaigns' && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs text-[var(--color-muted-foreground)] font-medium">Chiến dịch:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-xs text-[var(--color-foreground)] focus:outline-none max-w-xs truncate"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CAMPAIGN LIST & SUMMARY (F133, F134, F135) */}
      {/* ==================================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chiến dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="RUNNING">Đang chạy</option>
                <option value="PLANNING">Lên kế hoạch</option>
                <option value="PAUSED">Tạm dừng</option>
                <option value="COMPLETED">Đã hoàn thành</option>
              </select>

              <select
                value={filterObjective}
                onChange={(e) => setFilterObjective(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none"
              >
                <option value="ALL">Mọi mục tiêu</option>
                <option value="REVENUE">Doanh thu (Revenue)</option>
                <option value="LEADS">Khách tiềm năng (Leads)</option>
                <option value="REACH">Độ phủ (Reach)</option>
                <option value="APP_INSTALL">Cài đặt ứng dụng</option>
              </select>
            </div>
          </div>

          {/* Campaign Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((camp) => {
              const primaryKpi = camp.kpis[0];
              const spentPct = camp.totalBudget > 0 ? Math.round((camp.totalSpent / camp.totalBudget) * 100) : 0;

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {renderStatusBadge(camp.status)}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-muted)] text-[var(--color-foreground)]">
                            {camp.objectiveType}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                          {camp.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Timeline & Channels */}
                    <div className="space-y-2 pt-2.5 border-t border-[var(--color-border)]">
                      {/* Timeline on 1 line with full year */}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-medium text-[var(--color-foreground)] whitespace-nowrap text-[11px]">
                          {formatCampaignDateRange(camp.startDate, camp.endDate)}
                        </span>
                      </div>

                      {/* Channels list with wrap */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-[10px] font-medium text-[var(--color-muted-foreground)] mr-0.5">Kênh:</span>
                        {camp.channels.map((ch) => (
                          <span
                            key={ch}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              CHANNEL_BADGE_STYLES[ch] || 'bg-[var(--color-muted)] text-[var(--color-foreground)] border-transparent'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* KPI Progress (F133) */}
                    {primaryKpi && (
                      <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                            <Target className="w-3 h-3 text-[var(--color-primary)]" />
                            <span>{primaryKpi.name}</span>
                          </span>
                          <span className="font-bold text-indigo-400">
                            {primaryKpi.completionRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, primaryKpi.completionRate)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-foreground)]">
                          <span>Đạt: {primaryKpi.currentValue.toLocaleString('vi-VN')} {primaryKpi.unit}</span>
                          <span>Chỉ tiêu: {primaryKpi.targetValue.toLocaleString('vi-VN')} {primaryKpi.unit}</span>
                        </div>
                      </div>
                    )}

                    {/* Budget progress (F134) */}
                    <div className="p-3 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--color-muted-foreground)] font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Ngân sách chiến dịch</span>
                        </span>
                        <span className={`font-bold text-xs ${spentPct > 100 ? 'text-rose-500' : spentPct > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {spentPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            spentPct > 100 ? 'bg-rose-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, spentPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-foreground)] font-medium">
                        <span>Đã chi: <strong className="text-[var(--color-foreground)]">{camp.totalSpent.toLocaleString('vi-VN')}đ</strong></span>
                        <span>Tổng: <strong className="text-[var(--color-foreground)]">{camp.totalBudget.toLocaleString('vi-VN')}đ</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {camp.ownerAvatar ? (
                          <img src={camp.ownerAvatar} alt="owner" className="w-full h-full object-cover" />
                        ) : (
                          camp.ownerName[0]
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--color-muted-foreground)] truncate max-w-[120px]">
                        {camp.ownerName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCampaignId(camp.id);
                        setActiveTab('progress');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--color-muted)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-semibold transition-all"
                    >
                      <span>Xem tiến độ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PROGRESS DASHBOARD (F138) */}
      {/* ==================================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                    {currentCampaign.name}
                  </h2>
                  {renderStatusBadge(currentCampaign.status)}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  {currentCampaign.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)] mt-2">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--color-foreground)]">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="whitespace-nowrap">{formatCampaignDateRange(currentCampaign.startDate, currentCampaign.endDate)}</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1">
                    {currentCampaign.channels.map((ch) => (
                      <span
                        key={ch}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          CHANNEL_BADGE_STYLES[ch] || 'bg-[var(--color-muted)] text-[var(--color-foreground)] border-transparent'
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-semibold flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Báo cáo ROI</span>
                </button>
              </div>
            </div>

            {/* 4 Trục Tiến độ Hợp nhất (Content, Tasks, KPIs, Budget) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-[var(--color-border)]">
              {/* 1. Content Progress */}
              <div className="p-3.5 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted-foreground)] font-medium">Tiến độ Xuất bản</span>
                  <span className="font-bold text-blue-500">
                    {Math.round(
                      (currentCampaign.phases.reduce((a, b) => a + b.publishedPostsCount, 0) /
                        (currentCampaign.phases.reduce((a, b) => a + b.targetPostsCount, 0) || 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="text-xl font-bold text-[var(--color-foreground)]">
                  {currentCampaign.phases.reduce((a, b) => a + b.publishedPostsCount, 0)} /{' '}
                  {currentCampaign.phases.reduce((a, b) => a + b.targetPostsCount, 0)} bài
                </div>
                <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.round(
                        (currentCampaign.phases.reduce((a, b) => a + b.publishedPostsCount, 0) /
                          (currentCampaign.phases.reduce((a, b) => a + b.targetPostsCount, 0) || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* 2. Task Progress (Kết nối M9) */}
              <div className="p-3.5 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted-foreground)] font-medium">Công việc liên quan (M9)</span>
                  <span className="font-bold text-indigo-400">
                    {Math.round((currentCampaign.completedTasksCount / (currentCampaign.tasksCount || 1)) * 100)}%
                  </span>
                </div>
                <div className="text-xl font-bold text-[var(--color-foreground)]">
                  {currentCampaign.completedTasksCount} / {currentCampaign.tasksCount} task hoàn thành
                </div>
                <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${Math.round((currentCampaign.completedTasksCount / (currentCampaign.tasksCount || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 3. KPI Completion */}
              <div className="p-3.5 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted-foreground)] font-medium">KPI Mục tiêu</span>
                  <span className="font-bold text-emerald-500">
                    {currentCampaign.kpis[0]?.completionRate || 0}%
                  </span>
                </div>
                <div className="text-xl font-bold text-[var(--color-foreground)] truncate">
                  {(currentCampaign.kpis[0]?.currentValue || 0).toLocaleString('vi-VN')} {currentCampaign.kpis[0]?.unit}
                </div>
                <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, currentCampaign.kpis[0]?.completionRate || 0)}%` }}
                  />
                </div>
              </div>

              {/* 4. Budget Burn Rate */}
              <div className="p-3.5 rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-muted-foreground)] font-medium">Giải ngân Ngân sách</span>
                  <span className="font-bold text-purple-400">
                    {Math.round((currentCampaign.totalSpent / (currentCampaign.totalBudget || 1)) * 100)}%
                  </span>
                </div>
                <div className="text-xl font-bold text-[var(--color-foreground)]">
                  {currentCampaign.totalSpent.toLocaleString('vi-VN')}đ
                </div>
                <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((currentCampaign.totalSpent / (currentCampaign.totalBudget || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Phases View (F135 & F138) */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-foreground)]">
                  Kế hoạch Nội dung theo Giai đoạn (Campaign Timeline Phases)
                </h3>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Phân bổ mật độ nội dung và theo dõi số lượng bài viết đã xuất bản theo từng giai đoạn tiếp thị.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {currentCampaign.phases.map((ph, idx) => {
                const phaseProgress = Math.round((ph.publishedPostsCount / (ph.targetPostsCount || 1)) * 100);
                return (
                  <div
                    key={ph.id}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-[var(--color-foreground)]">
                            {ph.name}
                          </div>
                          <div className="text-[10px] text-[var(--color-muted-foreground)] whitespace-nowrap">
                            {formatCampaignDateRange(ph.startDate, ph.endDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[var(--color-muted-foreground)]">
                          Đã đăng: <strong className="text-[var(--color-foreground)]">{ph.publishedPostsCount}/{ph.targetPostsCount} bài</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${phaseProgress === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {phaseProgress}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-muted-foreground)] pl-8">
                      {ph.description}
                    </p>

                    <div className="pl-8">
                      <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                          style={{ width: `${Math.min(100, phaseProgress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentCampaign.phases.length === 0 && (
                <div className="py-8 text-center text-xs text-[var(--color-muted-foreground)] italic border border-dashed border-[var(--color-border)] rounded-xl">
                  Chưa thiết lập giai đoạn (Phases) cho chiến dịch này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CREATIVE ASSETS & APPROVAL (F137) */}
      {/* ==================================================================== */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--color-foreground)]">
                Kho Tài Nguyên Sáng Tạo & Luồng Duyệt (Asset & Approval Flow)
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                Kiểm duyệt chất lượng hình ảnh, kịch bản và video trailer trước khi xuất bản rộng rãi trên các kênh.
              </p>
            </div>
          </div>

          {/* Asset List Table */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] font-semibold border-b border-[var(--color-border)]">
                <tr>
                  <th className="py-3 px-4">Tên tài nguyên</th>
                  <th className="py-3 px-3">Loại tệp</th>
                  <th className="py-3 px-3">Kích thước</th>
                  <th className="py-3 px-3">Trạng thái duyệt</th>
                  <th className="py-3 px-3">Người duyệt & Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {assets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          {ast.type === 'VIDEO' ? <Video className="w-4 h-4" /> : ast.type === 'DOCUMENT' ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--color-foreground)]">{ast.name}</div>
                          <div className="text-[10px] text-[var(--color-muted-foreground)]">
                            Đăng tải: {formatDateWithYear(ast.uploadedAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-muted)] text-[var(--color-foreground)]">
                        {ast.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[var(--color-muted-foreground)]">
                      {Math.round(ast.fileSize / 1024 / 1024 * 10) / 10} MB
                    </td>

                    <td className="py-3 px-3">
                      {ast.approvalStatus === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã duyệt</span>
                        </span>
                      ) : ast.approvalStatus === 'REJECTED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1 w-max">
                          <X className="w-3 h-3" />
                          <span>Từ chối</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {ast.reviewedBy ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-[var(--color-foreground)]">{ast.reviewedBy}</div>
                          <div className="text-[10px] text-[var(--color-muted-foreground)] line-clamp-1 italic">
                            "{ast.reviewerNote}"
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--color-muted-foreground)] italic">Chưa duyệt</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ast.approvalStatus === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleUpdateAssetStatus(ast.id, 'APPROVED')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                              title="Duyệt nhanh"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewAssetTarget(ast);
                                setReviewNote('');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                              title="Từ chối kèm góp ý"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                        <a
                          href={ast.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                          title="Xem tệp"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: FINANCIAL REPORT & ROI (F139) */}
      {/* ==================================================================== */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500 text-white">
                  {currentCampaign.status === 'PLANNING'
                    ? '📋 ĐANG LÊN KẾ HOẠCH'
                    : currentCampaign.financialSummary.rating === 'OUTSTANDING'
                    ? '🏆 THÀNH CÔNG VƯỢT BẬC'
                    : '⭐ ĐẠT MỤC TIÊU'}
                </span>
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {currentCampaign.name}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {currentCampaign.financialSummary.summaryVerdict}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)] pt-1">
                <div className="flex items-center gap-1.5 font-medium text-[var(--color-foreground)]">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="whitespace-nowrap">{formatCampaignDateRange(currentCampaign.startDate, currentCampaign.endDate)}</span>
                </div>
                <div className="flex items-center flex-wrap gap-1">
                  {currentCampaign.channels.map((ch) => (
                    <span
                      key={ch}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        CHANNEL_BADGE_STYLES[ch] || 'bg-[var(--color-muted)] text-[var(--color-foreground)] border-transparent'
                      }`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success('Đã tải xuống Báo cáo tổng kết chiến dịch dạng PDF!');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Báo Cáo Chiến Dịch</span>
              </button>
            </div>
          </div>

          {/* Financial Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Doanh thu ghi nhận (Revenue)</span>
              <div className="text-2xl font-bold text-emerald-500">
                {currentCampaign.financialSummary.totalRevenue.toLocaleString('vi-VN')}đ
              </div>
              <span className="text-[11px] text-[var(--color-muted-foreground)]">Từ CRM Deals & Đơn hàng</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Chi phí thực tế (Total Spend)</span>
              <div className="text-2xl font-bold text-[var(--color-foreground)]">
                {currentCampaign.financialSummary.totalActualSpend.toLocaleString('vi-VN')}đ
              </div>
              <span className="text-[11px] text-blue-400">
                Trong đó Ads: {currentCampaign.financialSummary.paidAdsSpend.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Tỷ suất sinh lời ROI %</span>
              <div className="text-2xl font-bold text-indigo-400">
                +{currentCampaign.financialSummary.roiPercentage}%
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">
                Lợi nhuận ròng: +{currentCampaign.financialSummary.netProfit.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-1">
              <span className="text-xs text-[var(--color-muted-foreground)]">Chỉ số ROAS quảng cáo</span>
              <div className="text-2xl font-bold text-purple-400">
                {currentCampaign.financialSummary.roas}x
              </div>
              <span className="text-[11px] text-[var(--color-muted-foreground)]">1đ Ads mang về {currentCampaign.financialSummary.roas}đ Doanh thu</span>
            </div>
          </div>

          {/* Unit Economics: CPL & CPA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
              <h4 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Hiệu quả Thu thập Khách hàng Tiềm năng (Leads)</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">Tổng Lead thu về</span>
                  <div className="text-xl font-bold text-[var(--color-foreground)]">
                    {currentCampaign.financialSummary.totalLeads} leads
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">Chi phí trên mỗi Lead (CPL)</span>
                  <div className="text-xl font-bold text-emerald-500">
                    {currentCampaign.financialSummary.costPerLead.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
              <h4 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>Hiệu quả Chuyển đổi Đơn hàng (Acquisition)</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">Tổng Đơn hàng chốt</span>
                  <div className="text-xl font-bold text-[var(--color-foreground)]">
                    {currentCampaign.financialSummary.totalOrders} đơn
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-muted)]/30 border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-muted-foreground)]">Chi phí trên mỗi Đơn (CPA)</span>
                  <div className="text-xl font-bold text-indigo-400">
                    {currentCampaign.financialSummary.costPerAcquisition.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE NEW CAMPAIGN (F133, F134, F135) */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Tạo Chiến Dịch Mới (F133 - F135)</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* SECTION 1: BASIC INFO */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5" /> Thông tin cơ bản chiến dịch
                </h4>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">
                    Tên chiến dịch <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Mega Sale 12.12 - Tri Ân Khách Hàng Cuối Năm"
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Mô tả mục tiêu chiến dịch</label>
                  <textarea
                    rows={2}
                    placeholder="Mục tiêu mở rộng tập khách hàng, thúc đẩy doanh số..."
                    value={newCampDesc}
                    onChange={(e) => setNewCampDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-foreground)] text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={newCampStartDate}
                      onChange={(e) => setNewCampStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={newCampEndDate}
                      onChange={(e) => setNewCampEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: F133 - KPI & OBJECTIVE */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    F133 • Thiết lập Mục tiêu &amp; Chỉ số KPI
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                    Đặc tả F133
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Loại mục tiêu cốt lõi</label>
                    <select
                      value={newCampObjective}
                      onChange={(e) => {
                        const val = e.target.value as CampaignObjectiveType;
                        setNewCampObjective(val);
                        if (val === 'REVENUE') {
                          setNewKpiName('Doanh thu thuần mục tiêu');
                          setNewKpiUnit('đ');
                        } else if (val === 'LEADS') {
                          setNewKpiName('Số lượng Leads CRM');
                          setNewKpiUnit('leads');
                        } else if (val === 'REACH') {
                          setNewKpiName('Lượt xem video (Views)');
                          setNewKpiUnit('lượt xem');
                        } else if (val === 'APP_INSTALL') {
                          setNewKpiName('Lượt cài đặt ứng dụng');
                          setNewKpiUnit('lượt cài');
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                    >
                      <option value="REVENUE">Tối ưu Doanh thu (Revenue)</option>
                      <option value="LEADS">Thu thập Leads CRM</option>
                      <option value="REACH">Độ phủ thương hiệu (Reach/Views)</option>
                      <option value="APP_INSTALL">Cài đặt Ứng dụng (App Install)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Tên chỉ số KPI</label>
                    <input
                      type="text"
                      value={newKpiName}
                      onChange={(e) => setNewKpiName(e.target.value)}
                      placeholder="vd: Doanh thu thuần mục tiêu"
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Giá trị mục tiêu cần đạt</label>
                    <input
                      type="number"
                      value={newKpiTargetValue}
                      onChange={(e) => setNewKpiTargetValue(e.target.value)}
                      placeholder="150000000"
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs font-bold text-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-foreground)]">Đơn vị tính KPI</label>
                    <input
                      type="text"
                      value={newKpiUnit}
                      onChange={(e) => setNewKpiUnit(e.target.value)}
                      placeholder="đ, leads, views..."
                      className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: F134 - BUDGET ALLOCATION */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                    F134 • Phân Bổ Ngân Sách Theo Hạng Mục
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold">
                    Đặc tả F134
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Tổng ngân sách kế hoạch (VND)</label>
                  <input
                    type="number"
                    value={newCampBudget}
                    onChange={(e) => setNewCampBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs font-bold text-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                    <div className="text-[10px] font-semibold text-blue-500">Quảng cáo Ads (%)</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newBudgetAdsPercent}
                      onChange={(e) => setNewBudgetAdsPercent(e.target.value)}
                      className="w-full p-1 rounded-lg border border-[var(--color-border)] bg-transparent text-xs font-bold text-center"
                    />
                    <div className="text-[10px] text-[var(--color-muted-foreground)] text-center truncate">
                      {Math.round(((Number(newCampBudget) || 0) * (Number(newBudgetAdsPercent) || 0)) / 100).toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                    <div className="text-[10px] font-semibold text-purple-500">Booking KOL (%)</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newBudgetKolPercent}
                      onChange={(e) => setNewBudgetKolPercent(e.target.value)}
                      className="w-full p-1 rounded-lg border border-[var(--color-border)] bg-transparent text-xs font-bold text-center"
                    />
                    <div className="text-[10px] text-[var(--color-muted-foreground)] text-center truncate">
                      {Math.round(((Number(newCampBudget) || 0) * (Number(newBudgetKolPercent) || 0)) / 100).toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                    <div className="text-[10px] font-semibold text-emerald-500">Creative/Media (%)</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newBudgetMediaPercent}
                      onChange={(e) => setNewBudgetMediaPercent(e.target.value)}
                      className="w-full p-1 rounded-lg border border-[var(--color-border)] bg-transparent text-xs font-bold text-center"
                    />
                    <div className="text-[10px] text-[var(--color-muted-foreground)] text-center truncate">
                      {Math.round(((Number(newCampBudget) || 0) * (Number(newBudgetMediaPercent) || 0)) / 100).toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                    <div className="text-[10px] font-semibold text-amber-500">Seeding Phễu (%)</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newBudgetSeedingPercent}
                      onChange={(e) => setNewBudgetSeedingPercent(e.target.value)}
                      className="w-full p-1 rounded-lg border border-[var(--color-border)] bg-transparent text-xs font-bold text-center"
                    />
                    <div className="text-[10px] text-[var(--color-muted-foreground)] text-center truncate">
                      {Math.round(((Number(newCampBudget) || 0) * (Number(newBudgetSeedingPercent) || 0)) / 100).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: F135 - CHANNELS & CONTENT PLAN */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    F135 • Kênh Phân Phối &amp; Kế Hoạch Nội Dung Liên Kết
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 font-bold">
                    Đặc tả F135
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--color-foreground)]">Kênh phân phối áp dụng (Channels)</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'SHOPEE'] as ChannelKey[]).map((ch) => (
                      <label key={ch} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-muted)]/30">
                        <input
                          type="checkbox"
                          checked={newCampChannels.includes(ch)}
                          onChange={(e) => {
                            if (e.target.checked) setNewCampChannels([...newCampChannels, ch]);
                            else setNewCampChannels(newCampChannels.filter((c) => c !== ch));
                          }}
                          className="rounded border-[var(--color-border)] text-[var(--color-primary)]"
                        />
                        <span className="font-medium text-[var(--color-foreground)]">{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Gắn với Kế hoạch Nội dung (Content Plan)</label>
                  <select
                    value={newLinkedPlan}
                    onChange={(e) => setNewLinkedPlan(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  >
                    <option value="plan_q4_ecommerce">Kế hoạch Quý 4 - Chiến Dịch E-commerce &amp; Livestream (Content Studio)</option>
                    <option value="plan_brand_awareness">Kế hoạch Định Vị Thương Hiệu &amp; Video Viral TikTok</option>
                    <option value="plan_holiday_sale">Kế hoạch Tri Ân Khách Hàng Dịp Lễ &amp; Mini-game</option>
                    <option value="plan_new_launch">Kế hoạch Ra Mắt Dòng Sản Phẩm Mới</option>
                  </select>
                </div>
              </div>

              {/* SECTION 5: F136 - ASSIGNEE & TEAM */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    F136 • Gắn Thành Viên Phụ Trách (Assignee / Team Lead)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold">
                    Đặc tả F136
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-foreground)]">Trưởng chiến dịch phụ trách (Project Lead)</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none text-xs"
                  >
                    <option value="user_1">Nguyễn Văn A (Project Lead &amp; Strategy)</option>
                    <option value="user_2">Trần Thị B (Lead Content Creator &amp; Copywriter)</option>
                    <option value="user_3">Lê Hoàng C (Media Producer &amp; Video Editor)</option>
                    <option value="user_4">Vũ Đức D (Performance Ads &amp; Data Analyst)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-95 text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Tạo chiến dịch hoàn tất</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REJECT ASSET WITH REASON */}
      {/* ==================================================================== */}
      {reviewAssetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-[var(--color-foreground)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Góp ý chỉnh sửa & Từ chối tài nguyên</span>
            </h3>

            <p className="text-xs text-[var(--color-muted-foreground)]">
              Vui lòng nêu rõ lý do từ chối để bộ phận Media & Design điều chỉnh kịp thời cho chiến dịch.
            </p>

            <textarea
              rows={3}
              placeholder="Ví dụ: Hình ảnh bị mờ logo, nhạc nền bị dính bản quyền hoặc sai tỷ lệ 9:16..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-foreground)] focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewAssetTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleUpdateAssetStatus(reviewAssetTarget.id, 'REJECTED')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white hover:opacity-95 text-xs font-semibold shadow-sm"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
