import { describe, it, expect, beforeEach } from 'vitest';
import { 
  walletStore, 
  checkReferralFraud 
} from '@/lib/wallet/wallet-engine';
import { GET as getReferral, POST as postReferral } from '@/app/api/referral/route';
import { 
  GET as getCommissions, 
  POST as postCommissions, 
  DELETE as deleteCommissions, 
  PATCH as patchCommissions 
} from '@/app/api/referral/commissions/route';
import { GET as getAntiFraud, POST as postAntiFraud } from '@/app/api/referral/anti-fraud/route';
import { NextRequest } from 'next/server';

function createMockReq(url: string, method = 'GET', body?: any): NextRequest {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('M13 – Referral & Growth Comprehensive Tests (F151 – F155)', () => {
  // ============================================
  // F151: Referral Link & Code
  // ============================================
  describe('F151: Referral Link & Code (Mã & Link giới thiệu duy nhất)', () => {
    it('should retrieve referral profile with valid code and non-fake properties', () => {
      const profile = walletStore.getReferralProfile();
      expect(profile).toBeDefined();
      expect(profile.code).toBeTruthy();
      expect(profile.referralLink).toContain(profile.code);
      expect(decodeURIComponent(profile.qrCodeUrl)).toContain(profile.referralLink);
      expect(profile.totalClicks).toBeGreaterThanOrEqual(0);
      expect(profile.totalRegistrations).toBeGreaterThanOrEqual(0);
    });

    it('should update referral code and automatically regenerate link & QR code', () => {
      const customCode = 'TOP-YEN-AFFILIATE';
      const updated = walletStore.updateReferralCode(customCode);
      expect(updated.code).toBe(customCode);
      expect(updated.referralLink).toBe(`https://topify.app/ref/${customCode}`);
      expect(decodeURIComponent(updated.qrCodeUrl)).toContain(updated.referralLink);

      const freshProfile = walletStore.getReferralProfile();
      expect(freshProfile.code).toBe(customCode);
    });

    it('should reject invalid or too short custom referral codes', () => {
      expect(() => walletStore.updateReferralCode('NO')).toThrow();
      expect(() => walletStore.updateReferralCode('  ')).toThrow();
    });

    it('should update referral code via POST /api/referral', async () => {
      const req = createMockReq('http://localhost:3000/api/referral', 'POST', {
        customCode: 'TOP-GROWTH-2026',
      });
      const res = await postReferral(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.profile.code).toBe('TOP-GROWTH-2026');
      expect(json.profile.referralLink).toBe('https://topify.app/ref/TOP-GROWTH-2026');
    });
  });

  // ============================================
  // F152: Referral Tracking (Funnel & Referred Users)
  // ============================================
  describe('F152: Referral Tracking (Theo dõi phễu & Khách hàng giới thiệu)', () => {
    it('should list referred users with realistic data and statuses', () => {
      const users = walletStore.getReferredUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      const first = users[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('emailMasked');
      expect(first).toHaveProperty('plan');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('commissionEarned');
    });

    it('should track clicks, registrations, and auto-calculate conversion rate', () => {
      const initialProfile = walletStore.getReferralProfile();
      const initialClicks = initialProfile.totalClicks;
      const initialRegs = initialProfile.totalRegistrations;

      const clickResult = walletStore.trackReferralEvent('CLICK');
      expect(clickResult.profile.totalClicks).toBe(initialClicks + 1);

      const regResult = walletStore.trackReferralEvent('REGISTER', {
        name: 'Trần Văn Nam',
        emailMasked: 'nam_***@gmail.com',
        plan: 'STARTER',
      });
      expect(regResult.profile.totalRegistrations).toBe(initialRegs + 1);
      expect(regResult.user?.name).toBe('Trần Văn Nam');
    });

    it('should simulate a referred user via POST /api/referral and persist to store', async () => {
      const req = createMockReq('http://localhost:3000/api/referral', 'POST', {
        action: 'SIMULATE_USER',
        userSimulation: {
          name: 'Nha Khoa Nụ Cười Xinh',
          emailMasked: 'nhakhoa_***@gmail.com',
          plan: 'PRO',
          status: 'ACTIVE_PAID',
          commissionEarned: 598000,
        },
      });
      const res = await postReferral(req);
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.user.name).toBe('Nha Khoa Nụ Cười Xinh');
      expect(json.user.plan).toBe('PRO');

      const allUsers = walletStore.getReferredUsers();
      expect(allUsers.some(u => u.name === 'Nha Khoa Nụ Cười Xinh')).toBe(true);
    });

    it('should return 4-stage referral funnel via GET /api/referral', async () => {
      const req = createMockReq('http://localhost:3000/api/referral', 'GET');
      const res = await getReferral(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.funnel)).toBe(true);
      expect(json.funnel.length).toBe(4);
      expect(json.funnel[0].stage).toContain('Clicks');
      expect(json.funnel[1].stage).toContain('Đăng ký');
    });
  });

  // ============================================
  // F153: Commission Rules Configuration
  // ============================================
  describe('F153: Commission Rule (Cấu hình chính sách hoa hồng)', () => {
    it('should return existing commission rules (Starter, Pro, Enterprise)', () => {
      const rules = walletStore.getCommissionRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThanOrEqual(3);
      expect(rules.some(r => r.planName.includes('Starter'))).toBe(true);
      expect(rules.some(r => r.planName.includes('Pro'))).toBe(true);
      expect(rules.some(r => r.planName.includes('Enterprise'))).toBe(true);
    });

    it('should add a new commission rule and persist it', () => {
      const newRule = walletStore.addCommissionRule({
        planName: 'Chiến dịch Tết 2027 (Khai Xuân)',
        firstMonthRate: 30,
        recurringRate: 15,
        cookieDays: 45,
        payoutSchedule: 'Hàng tuần thứ 6',
        description: 'Chính sách ưu đãi đặc biệt dịp đầu năm mới',
      });
      expect(newRule.id).toBeDefined();
      expect(newRule.firstMonthRate).toBe(30);

      const freshRules = walletStore.getCommissionRules();
      expect(freshRules.some(r => r.id === newRule.id)).toBe(true);
    });

    it('should update an existing commission rule', () => {
      const rules = walletStore.getCommissionRules();
      const first = rules[0];
      const updated = walletStore.updateCommissionRule({
        id: first.id,
        firstMonthRate: 22,
        recurringRate: 8,
      });
      expect(updated?.firstMonthRate).toBe(22);
      expect(updated?.recurringRate).toBe(8);
    });

    it('should delete a custom commission rule', () => {
      const tempRule = walletStore.addCommissionRule({
        planName: 'Gói thử nghiệm tạm',
        firstMonthRate: 10,
        recurringRate: 5,
        cookieDays: 15,
        payoutSchedule: 'Cuối tháng',
        description: 'Tạm xóa',
      });
      const deleted = walletStore.deleteCommissionRule(tempRule.id);
      expect(deleted).toBe(true);
      const freshRules = walletStore.getCommissionRules();
      expect(freshRules.some(r => r.id === tempRule.id)).toBe(false);
    });
  });

  // ============================================
  // F154: Commission History & Direct Payout to Wallet
  // ============================================
  describe('F154: Commission History (Lịch sử commission & Quyết toán ví)', () => {
    it('should retrieve commission history with status indicators', () => {
      const history = walletStore.getCommissionHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      const item = history[0];
      expect(item).toHaveProperty('orderId');
      expect(item).toHaveProperty('referredUserName');
      expect(item).toHaveProperty('planName');
      expect(item).toHaveProperty('commissionAmount');
      expect(['PENDING', 'APPROVED', 'PAID']).toContain(item.status);
    });

    it('should approve a pending commission transaction', () => {
      const newTx = walletStore.addCommissionTransaction({
        orderId: `ORD_TEST_${Date.now()}`,
        referredUserName: 'Bác Sĩ CKI Lê Minh',
        planName: 'Gói Pro Creator (1 Năm)',
        orderAmount: 5990000,
        commissionRate: 20,
        commissionAmount: 1198000,
        status: 'PENDING',
      });

      const approved = walletStore.updateCommissionStatus(newTx.id, 'APPROVED');
      expect(approved?.item.status).toBe('APPROVED');
    });

    it('should payout an approved commission, directly credit wallet balance F146 and log transaction F147', () => {
      const initialWallet = walletStore.getWallet();
      const initialBalance = initialWallet.availableBalance;

      const commAmount = 500000;
      const newTx = walletStore.addCommissionTransaction({
        orderId: `ORD_PAY_${Date.now()}`,
        referredUserName: 'Trung Tâm Ngoại Ngữ Á Âu',
        planName: 'Gói Starter (Năm)',
        orderAmount: 2500000,
        commissionRate: 20,
        commissionAmount: commAmount,
        status: 'APPROVED',
      });

      const result = walletStore.updateCommissionStatus(newTx.id, 'PAID');
      expect(result).not.toBeNull();
      expect(result?.item.status).toBe('PAID');
      expect(result?.item.payoutDate).toBeDefined();

      // Verify wallet available balance was credited!
      const updatedWallet = walletStore.getWallet();
      expect(updatedWallet.availableBalance).toBe(initialBalance + commAmount);

      // Verify transaction was logged in ledger F147!
      const txs = walletStore.getTransactions();
      const loggedTx = txs.find(t => t.referenceId === newTx.id);
      expect(loggedTx).toBeDefined();
      expect(loggedTx?.type).toBe('COMMISSION');
      expect(loggedTx?.amount).toBe(commAmount);
    });
  });

  // ============================================
  // F155: Anti-fraud Referral Engine
  // ============================================
  describe('F155: Anti-fraud Referral (Phát hiện gian lận tiếp thị)', () => {
    it('should detect self-referral and flag HIGH_RISK when IP addresses match', () => {
      const fraudCheck = checkReferralFraud({
        referrerIp: '14.161.40.88',
        referredIp: '14.161.40.88', // Identical IP
        referrerFingerprint: 'fp_a',
        referredFingerprint: 'fp_b',
        registrationsInLastHour: 1,
        hasActivity: true,
      });

      expect(fraudCheck.riskScore).toBeGreaterThanOrEqual(50);
      expect(fraudCheck.reasons.some(r => r.includes('Self-referral'))).toBe(true);
    });

    it('should detect hardware fingerprint spoofing and rapid signups', () => {
      const fraudCheck = checkReferralFraud({
        referrerIp: '1.2.3.4',
        referredIp: '5.6.7.8',
        referrerFingerprint: 'fp_hardware_macbook_xyz',
        referredFingerprint: 'fp_hardware_macbook_xyz', // Device match
        registrationsInLastHour: 9, // Too many
        hasActivity: false,
      });

      expect(fraudCheck.riskScore).toBeGreaterThanOrEqual(80);
      expect(fraudCheck.riskLevel).toBe('HIGH_RISK');
    });

    it('should return SAFE risk level for genuine referrals', () => {
      const cleanCheck = checkReferralFraud({
        referrerIp: '113.161.80.20',
        referredIp: '14.248.90.11',
        referrerFingerprint: 'fp_client_iphone',
        referredFingerprint: 'fp_client_windows_pc',
        registrationsInLastHour: 1,
        hasActivity: true,
      });

      expect(cleanCheck.riskLevel).toBe('SAFE');
      expect(cleanCheck.riskScore).toBeLessThan(30);
    });

    it('should run a fraud scan and save alert to store via POST /api/referral/anti-fraud', async () => {
      const req = createMockReq('http://localhost:3000/api/referral/anti-fraud', 'POST', {
        scanData: {
          userName: 'test_suspicious_bot@tempmail.io',
          referredIp: '118.69.182.10',
          referrerIp: '118.69.182.10',
          fingerprint: 'fp_bot_detected_99',
        },
      });
      const res = await postAntiFraud(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.alert).toBeDefined();
      expect(json.alert.riskLevel).toBe('HIGH_RISK');
      expect(json.alert.actionTaken).toBe('COMMISSION_HELD');

      // Update action taken on this alert
      const updateReq = createMockReq('http://localhost:3000/api/referral/anti-fraud', 'POST', {
        action: 'UPDATE_STATUS',
        alertId: json.alert.id,
        newStatus: 'SUSPENDED',
      });
      const updateRes = await postAntiFraud(updateReq);
      const updateJson = await updateRes.json();
      expect(updateJson.success).toBe(true);
      expect(updateJson.alert.actionTaken).toBe('SUSPENDED');
    });
  });
});
