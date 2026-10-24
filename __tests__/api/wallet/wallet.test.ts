import { 
  checkReferralFraud, 
  memoryWallet, 
  memoryTransactions, 
  memoryWithdrawals, 
  memoryEarningTasks, 
  memoryReferralProfile,
  memoryCommissionRules 
} from '@/lib/wallet/wallet-engine';

describe('Wallet & Referral Growth Engine (M12 & M13: F146 - F155)', () => {
  describe('Anti-Fraud Evaluation Algorithm (F155)', () => {
    it('should classify completely clean traffic as SAFE with score 0', () => {
      const result = checkReferralFraud({
        referrerIp: '113.161.40.12',
        referredIp: '14.162.80.99',
        referrerFingerprint: 'fp_referrer_iphone15',
        referredFingerprint: 'fp_referred_pixel8',
        registrationsInLastHour: 1,
        hasActivity: true,
      });

      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('SAFE');
      expect(result.reasons).toHaveLength(0);
    });

    it('should flag self-referral by IP as SUSPICIOUS (score 50)', () => {
      const result = checkReferralFraud({
        referrerIp: '113.161.40.12',
        referredIp: '113.161.40.12',
        referrerFingerprint: 'fp_dev_a',
        referredFingerprint: 'fp_dev_b',
        registrationsInLastHour: 2,
        hasActivity: true,
      });

      expect(result.riskScore).toBe(50);
      expect(result.riskLevel).toBe('SUSPICIOUS');
      expect(result.reasons[0]).toContain('Trùng địa chỉ IP');
    });

    it('should flag combined IP + device fingerprint match as HIGH_RISK (score 95)', () => {
      const result = checkReferralFraud({
        referrerIp: '113.161.40.12',
        referredIp: '113.161.40.12',
        referrerFingerprint: 'fp_same_macbook_pro',
        referredFingerprint: 'fp_same_macbook_pro',
        registrationsInLastHour: 3,
        hasActivity: true,
      });

      expect(result.riskScore).toBe(95);
      expect(result.riskLevel).toBe('HIGH_RISK');
      expect(result.reasons).toContain('Trùng địa chỉ IP với người giới thiệu (Self-referral detection)');
      expect(result.reasons).toContain('Trùng dấu vân tay phần cứng / trình duyệt (Device fingerprint match)');
    });

    it('should detect abnormal registration velocity (> 5/hour)', () => {
      const result = checkReferralFraud({
        referrerIp: '113.161.40.12',
        referredIp: '14.226.50.88',
        registrationsInLastHour: 12,
        hasActivity: true,
      });

      expect(result.riskScore).toBe(35);
      expect(result.riskLevel).toBe('SUSPICIOUS');
      expect(result.reasons[0]).toContain('Phát hiện tần suất đăng ký bất thường (12 tài khoản/giờ)');
    });

    it('should penalize zero-activity churn accounts', () => {
      const result = checkReferralFraud({
        referrerIp: '113.161.40.12',
        referredIp: '14.226.50.88',
        registrationsInLastHour: 1,
        hasActivity: false,
      });

      expect(result.riskScore).toBe(15);
      expect(result.riskLevel).toBe('SAFE');
      expect(result.reasons[0]).toContain('Zero-activity churn');
    });

    it('should cap max risk score at 100', () => {
      const result = checkReferralFraud({
        referrerIp: '1.1.1.1',
        referredIp: '1.1.1.1', // 50
        referrerFingerprint: 'same',
        referredFingerprint: 'same', // 45
        registrationsInLastHour: 20, // 35
        hasActivity: false, // 15 -> sum 145, capped at 100
      });

      expect(result.riskScore).toBe(100);
      expect(result.riskLevel).toBe('HIGH_RISK');
    });
  });

  describe('Wallet & Referral In-Memory Data Store Integrity', () => {
    it('should have valid initial balances and currency VND (F146)', () => {
      expect(memoryWallet.availableBalance).toBeGreaterThanOrEqual(0);
      expect(memoryWallet.pendingBalance).toBeGreaterThanOrEqual(0);
      expect(memoryWallet.totalWithdrawn).toBeGreaterThanOrEqual(0);
      expect(memoryWallet.currency).toBe('VND');
    });

    it('should contain initial transaction records with valid types (F147)', () => {
      expect(memoryTransactions.length).toBeGreaterThan(0);
      for (const tx of memoryTransactions) {
        expect(['EARNING', 'COMMISSION', 'WITHDRAWAL', 'REFUND', 'BONUS']).toContain(tx.type);
        expect(typeof tx.amount).toBe('number');
        expect(tx.status).toBe('COMPLETED');
      }
    });

    it('should maintain initial withdrawal requests with proper statuses (F148)', () => {
      expect(memoryWithdrawals.length).toBeGreaterThan(0);
      for (const wd of memoryWithdrawals) {
        expect(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED']).toContain(wd.status);
        expect(wd.amount).toBeGreaterThan(0);
      }
    });

    it('should provide weekly earning tasks with rewards (F150)', () => {
      expect(memoryEarningTasks.length).toBeGreaterThan(0);
      for (const task of memoryEarningTasks) {
        expect(task.rewardAmount).toBeGreaterThan(0);
        expect(task.maxProgress).toBeGreaterThan(0);
        expect(task.progress).toBeLessThanOrEqual(task.maxProgress);
      }
    });

    it('should maintain tiered commission rules for Topify plans (F153)', () => {
      expect(memoryCommissionRules.length).toBeGreaterThan(0);
      for (const rule of memoryCommissionRules) {
        expect(rule.firstMonthRate).toBeGreaterThan(0);
        expect(rule.recurringRate).toBeGreaterThan(0);
        expect(rule.cookieDays).toBeGreaterThanOrEqual(30);
      }
    });

    it('should compute valid referral conversion rates (F152)', () => {
      expect(memoryReferralProfile.totalClicks).toBeGreaterThan(0);
      expect(memoryReferralProfile.conversionRate).toBeGreaterThan(0);
      expect(memoryReferralProfile.conversionRate).toBeLessThanOrEqual(100);
    });
  });
});
