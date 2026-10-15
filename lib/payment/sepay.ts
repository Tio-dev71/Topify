import { prisma } from '@/lib/db';
import { SubscriptionPlan } from '@prisma/client';
import { PLAN_LIMITS } from '@/lib/workspace/quota';
import { PlanPricingCalculation } from './types';

export function getSepayConfig() {
  return {
    bankId: process.env.NEXT_PUBLIC_BANK_ID || process.env.BANK_ID || 'MB',
    accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || process.env.BANK_ACCOUNT_NO || '0123456789',
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || process.env.BANK_ACCOUNT_NAME || 'NGUYEN VAN A',
    apiKey: process.env.SEPAY_API_KEY || '',
  };
}

export function calculatePlanPricing(
  plan: SubscriptionPlan,
  durationMonths: number = 1
): PlanPricingCalculation {
  const baseMonthlyPrice = PLAN_LIMITS[plan]?.monthlyPrice || (plan === 'ENTERPRISE' ? 1990000 : 499000);
  
  let discountPercent = 0;
  if (durationMonths === 6) {
    discountPercent = 10;
  } else if (durationMonths >= 12) {
    discountPercent = 20;
  }

  const originalAmount = baseMonthlyPrice * durationMonths;
  const amount = Math.round(originalAmount * (1 - discountPercent / 100));

  return {
    plan,
    durationMonths,
    baseMonthlyPrice,
    discountPercent,
    originalAmount,
    amount,
  };
}

export function generateVietQrUrl(params: {
  bankId: string;
  accountNo: string;
  amount: number;
  description: string;
}): string {
  const { bankId, accountNo, amount, description } = params;
  return `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankId)}&acc=${encodeURIComponent(accountNo)}&amount=${amount}&des=${encodeURIComponent(description)}`;
}

export async function generateUniquePaymentCode(): Promise<string> {
  let code = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    code = `TPF${randomSuffix}`;
    const found = await prisma.paymentOrder.findUnique({
      where: { code },
    });
    if (!found) {
      exists = false;
    }
  }

  return code;
}

export const PRICING_TABLE = {
  PRO: 499000,
  ENTERPRISE: 1990000,
};

export const CYCLE_DISCOUNTS = {
  1: 0,
  6: 10,
  12: 20,
};

// Aliases for testing & convenient usage
export function calculateOrderAmount(plan: SubscriptionPlan, durationMonths: number = 1) {
  const result = calculatePlanPricing(plan, durationMonths);
  return {
    ...result,
    finalAmount: result.amount,
  };
}

export function generateSePayCode(): string {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `TPF${randomSuffix}`;
}

export function getVietQRUrl(amount: number, description: string): string {
  const cfg = getSepayConfig();
  return generateVietQrUrl({
    bankId: cfg.bankId,
    accountNo: cfg.accountNo,
    amount,
    description,
  });
}

