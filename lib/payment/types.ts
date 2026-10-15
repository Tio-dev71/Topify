import { SubscriptionPlan, SubscriptionStatus, PaymentStatus, InvoiceStatus } from '@prisma/client';

export type { SubscriptionPlan, SubscriptionStatus, PaymentStatus, InvoiceStatus };

export interface PlanPricingCalculation {
  plan: SubscriptionPlan;
  durationMonths: number;
  baseMonthlyPrice: number;
  discountPercent: number;
  originalAmount: number;
  amount: number;
}

export interface PaymentOrderResponse {
  id: string;
  code: string;
  plan: SubscriptionPlan;
  durationMonths: number;
  originalAmount: number;
  discountPercent: number;
  amount: number;
  qrUrl: string;
  bankId: string;
  accountNo: string;
  accountName: string;
  expiresAt: string;
}

export interface SubscriptionStatusResult {
  workspaceId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  planExpiresAt: string | null;
  daysRemaining: number;
  isGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
  graceDaysRemaining: number;
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'GRACE';
  alertMessage?: string;
}
