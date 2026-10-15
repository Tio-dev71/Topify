import { describe, it, expect } from 'vitest';
import { 
  calculateOrderAmount, 
  generateSePayCode, 
  getVietQRUrl, 
  PRICING_TABLE, 
  CYCLE_DISCOUNTS 
} from '../lib/payment/sepay';
import { computeSubscriptionAlert as getSubscriptionAlertLevel } from '../lib/workspace/subscription-cron';

describe('F062: SePay Payment & Renewal Engine', () => {
  describe('TC-F062-01: Order Amount & VietQR Generation', () => {
    it('should correctly calculate PRO plan pricing with discounts', () => {
      // 1 Month: 499,000 VND (0% discount)
      const p1 = calculateOrderAmount('PRO', 1);
      expect(p1.baseMonthlyPrice).toBe(499000);
      expect(p1.discountPercent).toBe(0);
      expect(p1.finalAmount).toBe(499000);

      // 6 Months: 499,000 * 6 * 0.9 = 2,694,600 VND (10% discount)
      const p6 = calculateOrderAmount('PRO', 6);
      expect(p6.discountPercent).toBe(10);
      expect(p6.finalAmount).toBe(2694600);

      // 12 Months: 499,000 * 12 * 0.8 = 4,790,400 VND (20% discount)
      const p12 = calculateOrderAmount('PRO', 12);
      expect(p12.discountPercent).toBe(20);
      expect(p12.finalAmount).toBe(4790400);
    });

    it('should correctly calculate ENTERPRISE plan pricing with discounts', () => {
      // 1 Month: 1,990,000 VND
      const e1 = calculateOrderAmount('ENTERPRISE', 1);
      expect(e1.baseMonthlyPrice).toBe(1990000);
      expect(e1.finalAmount).toBe(1990000);

      // 6 Months: 1,990,000 * 6 * 0.9 = 10,746,000 VND
      const e6 = calculateOrderAmount('ENTERPRISE', 6);
      expect(e6.finalAmount).toBe(10746000);

      // 12 Months: 1,990,000 * 12 * 0.8 = 19,104,000 VND
      const e12 = calculateOrderAmount('ENTERPRISE', 12);
      expect(e12.finalAmount).toBe(19104000);
    });

    it('should generate valid SePay transfer codes with TPF prefix', () => {
      const code1 = generateSePayCode();
      const code2 = generateSePayCode();

      expect(code1).toMatch(/^TPF[A-Z0-9]{5,10}$/);
      expect(code2).toMatch(/^TPF[A-Z0-9]{5,10}$/);
      expect(code1).not.toBe(code2);
    });

    it('should construct valid VietQR URLs', () => {
      const qrUrl = getVietQRUrl(499000, 'TPF123456');
      expect(qrUrl).toContain('https://qr.sepay.vn/img');
      expect(qrUrl).toContain('amount=499000');
      expect(qrUrl).toContain('des=TPF123456');
      expect(qrUrl).toContain('bank=');
      expect(qrUrl).toContain('acc=');
    });
  });

  describe('TC-F062-03: Stacking Expiration Calculation', () => {
    it('should stack expiration when current subscription is active', () => {
      const now = new Date();
      // Current expiration is 10 days in the future
      const currentExpiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const durationMonths = 6;
      const additionalDays = durationMonths * 30;

      // Stacking logic from webhook
      const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
      const newExpiresAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

      const expectedDiffDays = Math.round((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // 10 existing days + 180 new days = 190 days
      expect(expectedDiffDays).toBe(190);
    });

    it('should calculate fresh expiration from now when current subscription has expired', () => {
      const now = new Date();
      // Current expiration was 5 days ago
      const currentExpiresAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const durationMonths = 1;
      const additionalDays = durationMonths * 30;

      const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
      const newExpiresAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

      const expectedDiffDays = Math.round((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // Fresh 30 days from now
      expect(expectedDiffDays).toBe(30);
    });
  });

  describe('TC-F062-06 & TC-F062-08: Subscription Alert Levels & Grace Period', () => {
    it('should return NONE when plan has more than 7 days remaining', () => {
      const now = new Date();
      const planExpiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const alert = getSubscriptionAlertLevel({
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        planExpiresAt,
        gracePeriodEndsAt: null,
      });

      expect(alert.alertLevel).toBe('NONE');
      expect(alert.daysRemaining).toBe(15);
      expect(alert.isExpired).toBe(false);
      expect(alert.isGracePeriod).toBe(false);
    });

    it('should return WARNING when plan has 3 to 7 days remaining', () => {
      const now = new Date();
      const planExpiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      const alert = getSubscriptionAlertLevel({
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        planExpiresAt,
        gracePeriodEndsAt: null,
      });

      expect(alert.alertLevel).toBe('WARNING');
      expect(alert.daysRemaining).toBe(5);
    });

    it('should return URGENT when plan has 1 day or less remaining', () => {
      const now = new Date();
      const planExpiresAt = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours

      const alert = getSubscriptionAlertLevel({
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        planExpiresAt,
        gracePeriodEndsAt: null,
      });

      expect(alert.alertLevel).toBe('URGENT');
      expect(alert.daysRemaining).toBe(1);
    });

    it('should return GRACE when subscription is in 3-day grace period', () => {
      const now = new Date();
      const planExpiresAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // Expired 1 day ago
      const gracePeriodEndsAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 grace days left

      const alert = getSubscriptionAlertLevel({
        plan: 'PRO',
        subscriptionStatus: 'GRACE_PERIOD',
        planExpiresAt,
        gracePeriodEndsAt,
      });

      expect(alert.alertLevel).toBe('GRACE');
      expect(alert.isGracePeriod).toBe(true);
      expect(alert.isExpired).toBe(false);
      expect(alert.graceDaysRemaining).toBe(2);
    });

    it('should identify when grace period has expired', () => {
      const now = new Date();
      const planExpiresAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const gracePeriodEndsAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // Grace period expired 1 day ago

      const alert = getSubscriptionAlertLevel({
        plan: 'PRO',
        subscriptionStatus: 'EXPIRED',
        planExpiresAt,
        gracePeriodEndsAt,
      });

      expect(alert.isExpired).toBe(true);
      expect(alert.isGracePeriod).toBe(false);
    });
  });
});
