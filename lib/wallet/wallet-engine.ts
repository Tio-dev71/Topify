import fs from 'fs';
import path from 'path';

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
// Initial Clean Data Store (M12 & M13)
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
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tx_002',
    walletId: 'wal_topify_user_01',
    type: 'EARNING',
    amount: 150000,
    description: 'Thưởng hoàn thành nhiệm vụ: Đạt 10.000 lượt xem Reels trong tuần',
    referenceId: 'task_earn_reels_02',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'tx_003',
    walletId: 'wal_topify_user_01',
    type: 'WITHDRAWAL',
    amount: -2500000,
    description: 'Rút tiền về Ngân hàng MB Bank (STK: 0987654321)',
    referenceId: 'wd_req_089',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'tx_004',
    walletId: 'wal_topify_user_01',
    type: 'COMMISSION',
    amount: 299000,
    description: 'Hoa hồng 15% gói Topify Starter - Khách hàng shop_mebe@yahoo.com',
    referenceId: 'ref_comm_098',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'tx_005',
    walletId: 'wal_topify_user_01',
    type: 'EARNING',
    amount: 50000,
    description: 'Thưởng kết nối thành công 3 kênh MXH (Facebook, TikTok, Shopee)',
    referenceId: 'task_earn_channels_01',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export const memoryWithdrawals: WithdrawalRequest[] = [
  {
    id: 'wd_req_089',
    walletId: 'wal_topify_user_01',
    amount: 2500000,
    fee: 0,
    netAmount: 2500000,
    paymentMethod: 'MB Bank - 0987654321',
    accountInfo: 'YẾN NGÔ - Chi nhánh Hà Nội',
    status: 'COMPLETED',
    note: 'Đã hoàn tất chuyển khoản VietQR tự động mã giao dịch #VNP29881',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 6 + 300000).toISOString(),
  },
  {
    id: 'wd_req_090',
    walletId: 'wal_topify_user_01',
    amount: 1500000,
    fee: 0,
    netAmount: 1500000,
    paymentMethod: 'Momo - 0987654321',
    accountInfo: 'YẾN NGÔ',
    status: 'PENDING',
    note: 'Đang chờ đối soát phiên thanh toán đợt ngày 15 hàng tháng',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export const memoryPaymentMethods: SavedPaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'VIETQR',
    accountName: 'YẾN NGÔ',
    accountNumber: '0987654321',
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    isDefault: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'pm_002',
    type: 'MOMO',
    accountName: 'YẾN NGÔ',
    accountNumber: '0987654321',
    isDefault: false,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'pm_003',
    type: 'PAYPAL',
    accountName: 'Yen Ngo',
    accountNumber: 'nhim300997@gmail.com',
    isDefault: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
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
    expiresAt: '2026-10-19T00:00:00.000Z',
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
    isClaimed: false,
    isCompleted: true,
    expiresAt: '2027-12-31T23:59:59.000Z',
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
    isCompleted: true,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    id: 'task_004',
    title: 'Khởi tạo chiến dịch tiếp thị đầu tiên',
    description: 'Thiết lập mục tiêu KPI và phân bổ ngân sách cho chiến dịch mới trong mục Chiến dịch.',
    rewardAmount: 100000,
    category: 'SETUP',
    progress: 1,
    maxProgress: 1,
    unit: 'chiến dịch',
    isClaimed: false,
    isCompleted: true,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    id: 'task_005',
    title: 'Kết nối trọn bộ 3 nền tảng TikTok + Facebook + Shopee',
    description: 'Liên kết ít nhất 1 tài khoản cho mỗi mạng xã hội cốt lõi trong mục Quản lý kênh.',
    rewardAmount: 30000,
    category: 'SETUP',
    progress: 3,
    maxProgress: 3,
    unit: 'kênh',
    isClaimed: true,
    isCompleted: true,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
];

// ============================================
// Wallet Persistent Store (File + Memory)
// ============================================

export class WalletStoreManager {
  private filePath = path.join(process.cwd(), 'data', 'wallet-store.json');
  private wallet: WalletData = { ...memoryWallet };
  private transactions: WalletTransactionItem[] = [...memoryTransactions];
  private withdrawals: WithdrawalRequest[] = [...memoryWithdrawals];
  private paymentMethods: SavedPaymentMethod[] = [...memoryPaymentMethods];
  private earningTasks: EarningTaskItem[] = [...memoryEarningTasks];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.wallet) this.wallet = { ...this.wallet, ...data.wallet };
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          this.transactions = data.transactions;
        }
        if (Array.isArray(data.withdrawals) && data.withdrawals.length > 0) {
          this.withdrawals = data.withdrawals;
        }
        if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
          this.paymentMethods = data.paymentMethods;
        }
        if (Array.isArray(data.earningTasks) && data.earningTasks.length > 0) {
          this.earningTasks = data.earningTasks;
        }
      } else {
        this.saveToDisk();
      }
    } catch (e) {
      console.warn('[WalletStoreManager] loadFromDisk fallback to defaults');
    }
    this.syncLegacyVariables();
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        wallet: this.wallet,
        transactions: this.transactions,
        withdrawals: this.withdrawals,
        paymentMethods: this.paymentMethods,
        earningTasks: this.earningTasks,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[WalletStoreManager] saveToDisk error', e);
    }
    this.syncLegacyVariables();
  }

  private syncLegacyVariables() {
    Object.assign(memoryWallet, this.wallet);
    memoryTransactions.length = 0;
    memoryTransactions.push(...this.transactions);
    memoryWithdrawals.length = 0;
    memoryWithdrawals.push(...this.withdrawals);
    memoryPaymentMethods.length = 0;
    memoryPaymentMethods.push(...this.paymentMethods);
    memoryEarningTasks.length = 0;
    memoryEarningTasks.push(...this.earningTasks);
  }

  // F146: Wallet Balance
  public getWallet(userId?: string): WalletData {
    if (userId) this.wallet.userId = userId;
    return { ...this.wallet };
  }

  public updateBalance(params: { availableDelta?: number; pendingDelta?: number; withdrawnDelta?: number }): WalletData {
    if (params.availableDelta !== undefined) {
      this.wallet.availableBalance = Math.max(0, this.wallet.availableBalance + params.availableDelta);
    }
    if (params.pendingDelta !== undefined) {
      this.wallet.pendingBalance = Math.max(0, this.wallet.pendingBalance + params.pendingDelta);
    }
    if (params.withdrawnDelta !== undefined) {
      this.wallet.totalWithdrawn = Math.max(0, this.wallet.totalWithdrawn + params.withdrawnDelta);
    }
    this.wallet.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return { ...this.wallet };
  }

  // F147: Transactions
  public getTransactions(): WalletTransactionItem[] {
    return [...this.transactions];
  }

  public addTransaction(tx: Omit<WalletTransactionItem, 'id' | 'createdAt'>): WalletTransactionItem {
    const newTx: WalletTransactionItem = {
      ...tx,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.unshift(newTx);
    this.saveToDisk();
    return newTx;
  }

  // F148: Withdrawals
  public getWithdrawals(): WithdrawalRequest[] {
    return [...this.withdrawals];
  }

  public createWithdrawal(params: {
    amount: number;
    paymentMethod: string;
    accountInfo: string;
    note?: string;
  }): { withdrawal: WithdrawalRequest; wallet: WalletData; transaction: WalletTransactionItem } {
    if (params.amount > this.wallet.availableBalance) {
      throw new Error(`Số dư khả dụng không đủ (${this.wallet.availableBalance.toLocaleString('vi-VN')} VND)`);
    }

    const newWd: WithdrawalRequest = {
      id: `wd_req_${Date.now()}`,
      walletId: this.wallet.id,
      amount: params.amount,
      fee: 0,
      netAmount: params.amount,
      paymentMethod: params.paymentMethod,
      accountInfo: params.accountInfo,
      status: 'PENDING',
      note: params.note || 'Yêu cầu rút tiền qua cổng tự động VietQR/Momo',
      createdAt: new Date().toISOString(),
    };

    this.wallet.availableBalance -= params.amount;
    this.wallet.pendingBalance += params.amount;
    this.wallet.updatedAt = new Date().toISOString();

    const newTx: WalletTransactionItem = {
      id: `tx_${Date.now()}`,
      walletId: this.wallet.id,
      type: 'WITHDRAWAL',
      amount: -params.amount,
      description: `Yêu cầu rút tiền về ${params.paymentMethod}`,
      referenceId: newWd.id,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.withdrawals.unshift(newWd);
    this.transactions.unshift(newTx);
    this.saveToDisk();

    return { withdrawal: newWd, wallet: { ...this.wallet }, transaction: newTx };
  }

  public updateWithdrawalStatus(
    id: string,
    status: WithdrawalStatus,
    note?: string
  ): { withdrawal: WithdrawalRequest; wallet: WalletData; refundTx?: WalletTransactionItem } | null {
    const wd = this.withdrawals.find((w) => w.id === id);
    if (!wd) return null;

    if (['COMPLETED', 'REJECTED'].includes(wd.status)) {
      throw new Error(`Yêu cầu rút tiền này đã ở trạng thái ${wd.status}`);
    }

    wd.status = status;
    wd.processedAt = ['COMPLETED', 'REJECTED'].includes(status) ? new Date().toISOString() : undefined;
    if (note) wd.note = note;

    let refundTx: WalletTransactionItem | undefined = undefined;

    if (status === 'COMPLETED') {
      this.wallet.pendingBalance = Math.max(0, this.wallet.pendingBalance - wd.amount);
      this.wallet.totalWithdrawn += wd.amount;
    } else if (status === 'REJECTED') {
      this.wallet.pendingBalance = Math.max(0, this.wallet.pendingBalance - wd.amount);
      this.wallet.availableBalance += wd.amount;

      refundTx = {
        id: `tx_${Date.now()}`,
        walletId: this.wallet.id,
        type: 'REFUND',
        amount: wd.amount,
        description: `Hoàn tiền lệnh rút bị từ chối (${wd.id}): ${note || 'Từ chối bởi quản trị viên'}`,
        referenceId: wd.id,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };
      this.transactions.unshift(refundTx);
    }

    this.wallet.updatedAt = new Date().toISOString();
    this.saveToDisk();

    return { withdrawal: wd, wallet: { ...this.wallet }, refundTx };
  }

  // F149: Payment Methods
  public getPaymentMethods(): SavedPaymentMethod[] {
    return [...this.paymentMethods];
  }

  public addPaymentMethod(params: {
    type: PaymentMethodType;
    accountName: string;
    accountNumber: string;
    bankName?: string;
    isDefault?: boolean;
  }): SavedPaymentMethod {
    if (params.isDefault || this.paymentMethods.length === 0) {
      this.paymentMethods.forEach((pm) => (pm.isDefault = false));
    }

    const newMethod: SavedPaymentMethod = {
      id: `pm_${Date.now()}`,
      type: params.type,
      accountName: params.accountName.toUpperCase().trim(),
      accountNumber: String(params.accountNumber).trim(),
      bankName: params.bankName || (params.type === 'VIETQR' ? 'Ngân hàng Việt Nam' : undefined),
      isDefault: params.isDefault || this.paymentMethods.length === 0,
      createdAt: new Date().toISOString(),
    };

    this.paymentMethods.push(newMethod);
    this.saveToDisk();
    return newMethod;
  }

  public updatePaymentMethod(params: {
    id: string;
    type?: PaymentMethodType;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    isDefault?: boolean;
  }): SavedPaymentMethod | null {
    const target = this.paymentMethods.find((pm) => pm.id === params.id);
    if (!target) return null;

    if (params.type) target.type = params.type;
    if (params.accountName) target.accountName = params.accountName.toUpperCase().trim();
    if (params.accountNumber) target.accountNumber = String(params.accountNumber).trim();
    if (params.bankName !== undefined) target.bankName = params.bankName;

    if (params.isDefault) {
      this.paymentMethods.forEach((pm) => (pm.isDefault = pm.id === params.id));
    }

    this.saveToDisk();
    return target;
  }

  public deletePaymentMethod(id: string): boolean {
    const index = this.paymentMethods.findIndex((pm) => pm.id === id);
    if (index === -1) return false;

    const wasDefault = this.paymentMethods[index].isDefault;
    this.paymentMethods.splice(index, 1);

    if (wasDefault && this.paymentMethods.length > 0) {
      this.paymentMethods[0].isDefault = true;
    }

    this.saveToDisk();
    return true;
  }

  public setDefaultPaymentMethod(id: string): boolean {
    const target = this.paymentMethods.find((pm) => pm.id === id);
    if (!target) return false;

    this.paymentMethods.forEach((pm) => (pm.isDefault = pm.id === id));
    this.saveToDisk();
    return true;
  }

  // F150: Earning Tasks
  public getEarningTasks(): EarningTaskItem[] {
    const now = Date.now();
    return this.earningTasks.map((t) => ({
      ...t,
      isExpired: new Date(t.expiresAt).getTime() < now,
    }));
  }

  public claimEarningTask(taskId: string): {
    success: boolean;
    rewardAmount: number;
    task: EarningTaskItem;
    wallet: WalletData;
    transaction: WalletTransactionItem;
  } {
    const task = this.earningTasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Nhiệm vụ không tồn tại');

    if (task.isClaimed) throw new Error('Nhiệm vụ này đã được nhận thưởng trước đó');

    const isExpired = new Date(task.expiresAt).getTime() < Date.now();
    if (!task.isCompleted) {
      if (isExpired) throw new Error('Nhiệm vụ đã hết hạn');
      throw new Error(`Chưa hoàn thành nhiệm vụ (${task.progress}/${task.maxProgress} ${task.unit})`);
    }

    task.isClaimed = true;
    this.wallet.availableBalance += task.rewardAmount;
    this.wallet.updatedAt = new Date().toISOString();

    const rewardTx: WalletTransactionItem = {
      id: `tx_${Date.now()}`,
      walletId: this.wallet.id,
      type: 'EARNING',
      amount: task.rewardAmount,
      description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
      referenceId: task.id,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(rewardTx);
    this.saveToDisk();

    return {
      success: true,
      rewardAmount: task.rewardAmount,
      task,
      wallet: { ...this.wallet },
      transaction: rewardTx,
    };
  }

  public updateTaskProgress(taskId: string, incrementOrSet: number, isSet = false): EarningTaskItem | null {
    const task = this.earningTasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (isSet) {
      task.progress = Math.min(task.maxProgress, Math.max(0, incrementOrSet));
    } else {
      task.progress = Math.min(task.maxProgress, task.progress + incrementOrSet);
    }

    if (task.progress >= task.maxProgress) {
      task.isCompleted = true;
    }

    this.saveToDisk();
    return task;
  }
}

export const walletStore = new WalletStoreManager();

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
