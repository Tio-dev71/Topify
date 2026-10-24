import { describe, it, expect, beforeEach } from 'vitest';
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

  describe('Earning Tasks Expiration & Claim Logic (F150)', () => {
    beforeEach(() => {
      for (const t of memoryEarningTasks) {
        t.isClaimed = false;
      }
    });

    it('should enrich tasks with isExpired status via GET /api/wallet/tasks', async () => {
      const { GET } = await import('@/app/api/wallet/tasks/route');
      const res = await GET();
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.tasks.length).toBeGreaterThanOrEqual(4);
      expect(data.expiredCount).toBeGreaterThanOrEqual(1);

      // task_001 expired on 2026-10-19 and is incomplete (8/10)
      const task1 = data.tasks.find((t: any) => t.id === 'task_001');
      expect(task1).toBeDefined();
      expect(task1.isExpired).toBe(true);
      expect(task1.isCompleted).toBe(false);
      expect(task1.isClaimed).toBe(false);

      // task_002 is completed (10000/10000) and unclaimed, ready to claim
      const task2 = data.tasks.find((t: any) => t.id === 'task_002');
      expect(task2).toBeDefined();
      expect(task2.isCompleted).toBe(true);
      expect(task2.isClaimed).toBe(false);
    });

    it('should reject claim for expired uncompleted task (task_001)', async () => {
      const { POST } = await import('@/app/api/wallet/tasks/route');
      const req = {
        json: async () => ({ taskId: 'task_001' }),
      } as any;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('hết hạn');
    });

    it('should allow claiming completed task (task_002) and update wallet balance', async () => {
      const { POST } = await import('@/app/api/wallet/tasks/route');
      const balanceBefore = memoryWallet.availableBalance;
      const task2 = memoryEarningTasks.find(t => t.id === 'task_002')!;
      const reward = task2.rewardAmount;

      const req = {
        json: async () => ({ taskId: 'task_002' }),
      } as any;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewardAmount).toBe(reward);
      expect(task2.isClaimed).toBe(true);
      expect(memoryWallet.availableBalance).toBe(balanceBefore + reward);

      // Verify transaction record was logged
      const claimTx = memoryTransactions.find(t => t.referenceId === 'task_002');
      expect(claimTx).toBeDefined();
      expect(claimTx?.type).toBe('EARNING');
      expect(claimTx?.amount).toBe(reward);

      // Second claim should fail
      const repeatRes = await POST(req);
      const repeatData = await repeatRes.json();
      expect(repeatRes.status).toBe(400);
      expect(repeatData.error).toContain('đã được nhận thưởng');
    });

    it('should claim task_003 (+200,000 VND) and reflect directly in GET /api/wallet balance and transactions', async () => {
      const { POST } = await import('@/app/api/wallet/tasks/route');
      const { GET: getWallet } = await import('@/app/api/wallet/route');

      // Get initial wallet balance via GET /api/wallet
      const initialWalletRes = await getWallet({} as any);
      const initialWalletData = await initialWalletRes.json();
      const initialBalance = initialWalletData.wallet.availableBalance;

      // Claim task_003
      const req = {
        json: async () => ({ taskId: 'task_003' }),
      } as any;

      const claimRes = await POST(req);
      const claimData = await claimRes.json();

      expect(claimRes.status).toBe(200);
      expect(claimData.success).toBe(true);
      expect(claimData.rewardAmount).toBe(200000);
      expect(claimData.wallet.availableBalance).toBe(initialBalance + 200000);
      expect(claimData.transaction).toBeDefined();
      expect(claimData.transaction.amount).toBe(200000);

      // Verify subsequent GET /api/wallet returns updated balance and transaction
      const updatedWalletRes = await getWallet({} as any);
      const updatedWalletData = await updatedWalletRes.json();

      expect(updatedWalletData.wallet.availableBalance).toBe(initialBalance + 200000);
      const foundTx = updatedWalletData.transactions.find((tx: any) => tx.referenceId === 'task_003');
      expect(foundTx).toBeDefined();
      expect(foundTx.amount).toBe(200000);
      expect(foundTx.type).toBe('EARNING');
    });
  });
});

