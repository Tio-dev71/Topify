// Topify Wallet, Earnings & Referral Growth Engine (M12 & M13: F146 - F155)
// Core types, anti-fraud algorithms, commission rules, sample data & fallback store

export interface WalletData {
  id: string;
  userId: string;
  availableBalance: number; // Số dư khả dụng có thể rút (F146)
  pendingBalance: number;   // Số dư đang chờ đối soát chu kỳ (F146)
  totalWithdrawn: number;   // Tổng tiền đã rút thành công (F146)
  currency: string;
  updatedAt: string;
}

export type TransactionType = 'EARNING' | 'COMMISSION' | 'WITHDRAWAL' | 'REFUND' | 'BONUS';

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  accountInfo: string;
  status: WithdrawalStatus;
  note?: string;
  createdAt: string;
  processedAt?: string;
}

export type PaymentMethodType = 'VIETQR' | 'MOMO' | 'PAYPAL' | 'CRYPTO';

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  accountName: string;
  accountNumber: string; // Số tài khoản ngân hàng / SĐT Momo / Email PayPal / Địa chỉ ví
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface EarningTaskItem {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  category: 'CONTENT' | 'COMMUNITY' | 'GROWTH' | 'SETUP';
  progress: number;
  maxProgress: number;
  unit: string;
  isClaimed: boolean;
  isCompleted: boolean;
  expiresAt: string;
}

// ============================================
// M13. Referral & Growth Types
// ============================================

export interface ReferralProfile {
  code: string;
  referralLink: string;
  qrCodeUrl: string;
  totalClicks: number;
  totalRegistrations: number;
  totalTrialUsers: number;
  totalPaidSubscribers: number;
  conversionRate: number; // (paid / clicks) * 100
  totalCommissionEarned: number;
  pendingCommission: number;
}

export interface ReferredUserItem {
  id: string;
  name: string;
  emailMasked: string;
  registeredAt: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE_PAID' | 'EXPIRED';
  commissionEarned: number;
}

export interface CommissionRuleItem {
  id: string;
  planName: string;
  firstMonthRate: number; // % hoa hồng tháng đầu
  recurringRate: number;  // % hoa hồng trọn đời các tháng tiếp theo
  cookieDays: number;     // Số ngày lưu cookie theo dõi
  payoutSchedule: string; // Lịch thanh toán (e.g. "Ngày 15 hàng tháng")
  description: string;
}

export interface CommissionTransactionItem {
  id: string;
  orderId: string;
  referredUserName: string;
  planName: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdAt: string;
  payoutDate?: string;
}

export type FraudRiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';

export interface FraudInspectionResult {
  id: string;
  referralCode: string;
  suspectedUserId: string;
  suspectedUserName: string;
  ipAddress: string;
  deviceFingerprint: string;
  reasons: string[];
  riskScore: number; // 0 - 100
  riskLevel: FraudRiskLevel;
  actionTaken: 'FLAGGED' | 'COMMISSION_HELD' | 'SUSPENDED' | 'DISMISSED';
  detectedAt: string;
}

// ============================================
// Anti-Fraud Evaluation Algorithm (F155)
// ============================================

export function checkReferralFraud(data: {
  referrerIp: string;
  referredIp: string;
  referrerFingerprint?: string;
  referredFingerprint?: string;
  registrationsInLastHour: number;
  hasActivity: boolean;
}): { riskScore: number; riskLevel: FraudRiskLevel; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Check 1: Self-Referral qua IP
  if (data.referrerIp && data.referredIp && data.referrerIp === data.referredIp) {
    score += 50;
    reasons.push('Trùng địa chỉ IP với người giới thiệu (Self-referral detection)');
  }

  // Check 2: Trùng dấu vân tay thiết bị
  if (
    data.referrerFingerprint &&
    data.referredFingerprint &&
    data.referrerFingerprint === data.referredFingerprint
  ) {
    score += 45;
    reasons.push('Trùng dấu vân tay phần cứng / trình duyệt (Device fingerprint match)');
  }

  // Check 3: Tần suất đăng ký quá nhanh từ 1 nguồn
  if (data.registrationsInLastHour > 5) {
    score += 35;
    reasons.push(`Phát hiện tần suất đăng ký bất thường (${data.registrationsInLastHour} tài khoản/giờ)`);
  }

  // Check 4: Tài khoản rác không có hành vi sử dụng sau 48h
  if (!data.hasActivity) {
    score += 15;
    reasons.push('Tài khoản không phát sinh bất kỳ bài đăng hay kết nối kênh nào (Zero-activity churn)');
  }

  score = Math.min(100, score);
  let riskLevel: FraudRiskLevel = 'SAFE';
  if (score >= 65) riskLevel = 'HIGH_RISK';
  else if (score >= 30) riskLevel = 'SUSPICIOUS';

  return { riskScore: score, riskLevel, reasons };
}

// ============================================
// In-Memory Sample Data Store (M12 & M13)
// ============================================

export const memoryWallet: WalletData = {
  id: 'wal_topify_user_01',
  userId: 'usr_topify_demo',
  availableBalance: 4850000, // 4.850.000 VND
  pendingBalance: 1250000,   // 1.250.000 VND
  totalWithdrawn: 12400000,  // 12.400.000 VND
  currency: 'VND',
  updatedAt: new Date().toISOString(),
};

export const memoryTransactions: WalletTransactionItem[] = [
  {
    id: 'tx_001',
    walletId: 'wal_topify_user_01',
    type: 'COMMISSION',
    amount: 598000,
    description: 'Hoa hồng 20% gói Topify Pro - Khách hàng cty_thanglong@gmail.com',
    referenceId: 'ref_comm_101',
    status: 'COMPLETED',
    createdAt: '2026-10-14T10:15:00.000Z',
  },
  {
    id: 'tx_002',
    walletId: 'wal_topify_user_01',
    type: 'EARNING',
    amount: 150000,
    description: 'Thưởng hoàn thành nhiệm vụ: Đạt 10.000 lượt xem Reels trong tuần',
    referenceId: 'task_earn_reels_02',
    status: 'COMPLETED',
    createdAt: '2026-10-13T16:40:00.000Z',
  },
  {
    id: 'tx_003',
    walletId: 'wal_topify_user_01',
    type: 'WITHDRAWAL',
    amount: -2500000,
    description: 'Rút tiền về Ngân hàng Vietcombank (STK: 0071000889988)',
    referenceId: 'wd_req_089',
    status: 'COMPLETED',
    createdAt: '2026-10-10T09:20:00.000Z',
  },
  {
    id: 'tx_004',
    walletId: 'wal_topify_user_01',
    type: 'COMMISSION',
    amount: 299000,
    description: 'Hoa hồng 15% gói Topify Starter - Khách hàng shop_mebe@yahoo.com',
    referenceId: 'ref_comm_098',
    status: 'COMPLETED',
    createdAt: '2026-10-08T14:10:00.000Z',
  },
  {
    id: 'tx_005',
    walletId: 'wal_topify_user_01',
    type: 'EARNING',
    amount: 50000,
    description: 'Thưởng kết nối thành công 3 kênh MXH (Facebook, TikTok, Shopee)',
    referenceId: 'task_earn_channels_01',
    status: 'COMPLETED',
    createdAt: '2026-10-05T11:00:00.000Z',
  },
];

export const memoryWithdrawals: WithdrawalRequest[] = [
  {
    id: 'wd_req_089',
    walletId: 'wal_topify_user_01',
    amount: 2500000,
    fee: 0,
    netAmount: 2500000,
    paymentMethod: 'Vietcombank - 0071000889988',
    accountInfo: 'NGUYEN VAN TOAN - Chi nhánh Hồ Chí Minh',
    status: 'COMPLETED',
    note: 'Đã hoàn tất chuyển khoản VietQR tự động mã giao dịch #VNP29881',
    createdAt: '2026-10-10T09:20:00.000Z',
    processedAt: '2026-10-10T09:25:00.000Z',
  },
  {
    id: 'wd_req_090',
    walletId: 'wal_topify_user_01',
    amount: 1500000,
    fee: 0,
    netAmount: 1500000,
    paymentMethod: 'Momo - 0987654321',
    accountInfo: 'NGUYEN VAN TOAN',
    status: 'PENDING',
    note: 'Đang chờ kế toán duyệt phiên thanh toán đợt ngày 15 hàng tháng',
    createdAt: '2026-10-14T08:30:00.000Z',
  },
];

export const memoryPaymentMethods: SavedPaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'VIETQR',
    accountName: 'NGUYEN VAN TOAN',
    accountNumber: '0071000889988',
    bankName: 'Vietcombank (Ngân hàng Ngoại thương VN)',
    isDefault: true,
    createdAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'pm_002',
    type: 'MOMO',
    accountName: 'NGUYEN VAN TOAN',
    accountNumber: '0987654321',
    isDefault: false,
    createdAt: '2026-09-20T14:30:00.000Z',
  },
  {
    id: 'pm_003',
    type: 'PAYPAL',
    accountName: 'Nguyen Van Toan',
    accountNumber: 'vantoan.growth@topify.vn',
    isDefault: false,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

export const memoryEarningTasks: EarningTaskItem[] = [
  {
    id: 'task_001',
    title: 'Xuất bản 10 bài đăng social trong tuần',
    description: 'Lên lịch và xuất bản thành công 10 video hoặc hình ảnh qua Topify Calendar.',
    rewardAmount: 50000,
    category: 'CONTENT',
    progress: 8,
    maxProgress: 10,
    unit: 'bài đăng',
    isClaimed: false,
    isCompleted: false,
    expiresAt: '2026-10-19T23:59:59.000Z',
  },
  {
    id: 'task_002',
    title: 'Đạt mốc 10.000 lượt xem video ngắn',
    description: 'Tổng views trên các clip TikTok Reels hoặc Shorts được đăng qua Topify cán mốc 10.000 lượt xem.',
    rewardAmount: 150000,
    category: 'GROWTH',
    progress: 10000,
    maxProgress: 10000,
    unit: 'lượt xem',
    isClaimed: true,
    isCompleted: true,
    expiresAt: '2026-10-31T23:59:59.000Z',
  },
  {
    id: 'task_003',
    title: 'Giới thiệu 3 chủ shop dùng thử Topify',
    description: 'Mời thành công 3 bạn bè hoặc đối tác đăng ký Workspace mới qua Referral link.',
    rewardAmount: 200000,
    category: 'COMMUNITY',
    progress: 3,
    maxProgress: 3,
    unit: 'shop',
    isClaimed: false,
    isCompleted: true, // Đã hoàn thành, sẵn sàng Claim thưởng!
    expiresAt: '2026-10-25T23:59:59.000Z',
  },
  {
    id: 'task_004',
    title: 'Kết nối trọn bộ 3 nền tảng TikTok + Facebook + Shopee',
    description: 'Liên kết ít nhất 1 tài khoản cho mỗi mạng xã hội cốt lõi trong mục Quản lý kênh.',
    rewardAmount: 30000,
    category: 'SETUP',
    progress: 3,
    maxProgress: 3,
    unit: 'kênh',
    isClaimed: true,
    isCompleted: true,
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
];

export const memoryReferralProfile: ReferralProfile = {
  code: 'TOP-VIET99',
  referralLink: 'https://topify.app/ref/TOP-VIET99',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://topify.app/ref/TOP-VIET99',
  totalClicks: 1420,
  totalRegistrations: 168,
  totalTrialUsers: 95,
  totalPaidSubscribers: 28,
  conversionRate: 16.67, // (28 / 168) * 100
  totalCommissionEarned: 18450000,
  pendingCommission: 1250000,
};

export const memoryReferredUsers: ReferredUserItem[] = [
  {
    id: 'ref_u_01',
    name: 'Công ty CP May Mặc Thăng Long',
    emailMasked: 'cty_t***@gmail.com',
    registeredAt: '2026-10-14T08:30:00.000Z',
    plan: 'PRO',
    status: 'ACTIVE_PAID',
    commissionEarned: 598000,
  },
  {
    id: 'ref_u_02',
    name: 'Shop Mẹ & Bé Nhật Bản',
    emailMasked: 'shop_***@yahoo.com',
    registeredAt: '2026-10-08T12:00:00.000Z',
    plan: 'STARTER',
    status: 'ACTIVE_PAID',
    commissionEarned: 299000,
  },
  {
    id: 'ref_u_03',
    name: 'Nội Thất Gỗ Xanh Decor',
    emailMasked: 'goxanh_***@gmail.com',
    registeredAt: '2026-10-11T15:20:00.000Z',
    plan: 'FREE',
    status: 'TRIAL',
    commissionEarned: 0,
  },
  {
    id: 'ref_u_04',
    name: 'Học Viện Thẩm Mỹ Seoul',
    emailMasked: 'seoul_***@gmail.com',
    registeredAt: '2026-10-02T10:15:00.000Z',
    plan: 'ENTERPRISE',
    status: 'ACTIVE_PAID',
    commissionEarned: 2500000,
  },
];

export const memoryCommissionRules: CommissionRuleItem[] = [
  {
    id: 'rule_starter',
    planName: 'Gói Starter (299.000 VND/tháng)',
    firstMonthRate: 15,
    recurringRate: 5,
    cookieDays: 30,
    payoutSchedule: 'Ngày 15 hàng tháng',
    description: 'Nhận 15% doanh thu tháng đầu tiên và 5% mỗi tháng khách hàng gia hạn dịch vụ.',
  },
  {
    id: 'rule_pro',
    planName: 'Gói Pro Creator (599.000 VND/tháng)',
    firstMonthRate: 20,
    recurringRate: 10,
    cookieDays: 60,
    payoutSchedule: 'Ngày 15 hàng tháng',
    description: 'Nhận 20% doanh thu tháng đầu tiên và 10% doanh thu định kỳ trọn đời.',
  },
  {
    id: 'rule_enterprise',
    planName: 'Gói Doanh Nghiệp (Enterprise)',
    firstMonthRate: 25,
    recurringRate: 10,
    cookieDays: 90,
    payoutSchedule: 'Đối soát 24h sau khi ký hợp đồng',
    description: 'Hoa hồng 25% giá trị hợp đồng thanh toán lần đầu cho hợp đồng năm.',
  },
];

export const memoryCommissionHistory: CommissionTransactionItem[] = [
  {
    id: 'comm_tx_001',
    orderId: 'ORD_2026_1088',
    referredUserName: 'Công ty CP May Mặc Thăng Long',
    planName: 'Gói Pro Creator (1 Năm)',
    orderAmount: 5990000,
    commissionRate: 20,
    commissionAmount: 1198000,
    status: 'PENDING',
    createdAt: '2026-10-14T09:00:00.000Z',
    payoutDate: '2026-10-15',
  },
  {
    id: 'comm_tx_002',
    orderId: 'ORD_2026_1042',
    referredUserName: 'Shop Mẹ & Bé Nhật Bản',
    planName: 'Gói Starter (Hàng tháng)',
    orderAmount: 299000,
    commissionRate: 15,
    commissionAmount: 44850,
    status: 'APPROVED',
    createdAt: '2026-10-08T12:00:00.000Z',
    payoutDate: '2026-10-15',
  },
  {
    id: 'comm_tx_003',
    orderId: 'ORD_2026_0991',
    referredUserName: 'Học Viện Thẩm Mỹ Seoul',
    planName: 'Gói Enterprise',
    orderAmount: 24000000,
    commissionRate: 25,
    commissionAmount: 6000000,
    status: 'PAID',
    createdAt: '2026-10-02T10:15:00.000Z',
    payoutDate: '2026-10-03',
  },
];

export const memoryFraudAlerts: FraudInspectionResult[] = [
  {
    id: 'frd_001',
    referralCode: 'TOP-VIET99',
    suspectedUserId: 'usr_fake_882',
    suspectedUserName: 'toan.clone1@gmail.com',
    ipAddress: '118.69.182.10',
    deviceFingerprint: 'fp_macbook_m1_chrome_129',
    reasons: [
      'Trùng địa chỉ IP với người giới thiệu (Self-referral detection)',
      'Trùng dấu vân tay phần cứng / trình duyệt (Device fingerprint match)',
    ],
    riskScore: 95,
    riskLevel: 'HIGH_RISK',
    actionTaken: 'COMMISSION_HELD',
    detectedAt: '2026-10-13T14:10:00.000Z',
  },
  {
    id: 'frd_002',
    referralCode: 'TOP-VIET99',
    suspectedUserId: 'usr_rapid_991',
    suspectedUserName: 'marketing.lead.bulk@tempmail.com',
    ipAddress: '42.119.220.4',
    deviceFingerprint: 'fp_win_headless_bot_44',
    reasons: [
      'Phát hiện tần suất đăng ký bất thường (7 tài khoản/giờ từ cùng subnet IP)',
      'Sử dụng dịch vụ email tạm thời (TempMail Disposable)',
    ],
    riskScore: 75,
    riskLevel: 'HIGH_RISK',
    actionTaken: 'SUSPENDED',
    detectedAt: '2026-10-12T03:22:00.000Z',
  },
  {
    id: 'frd_003',
    referralCode: 'TOP-VIET99',
    suspectedUserId: 'usr_clean_102',
    suspectedUserName: 'phuong.nguyen@vietbrand.vn',
    ipAddress: '14.161.40.88',
    deviceFingerprint: 'fp_iphone15_safari_18',
    reasons: ['Tài khoản chưa phát sinh bài đăng sau 24h'],
    riskScore: 15,
    riskLevel: 'SAFE',
    actionTaken: 'DISMISSED',
    detectedAt: '2026-10-14T07:15:00.000Z',
  },
];
