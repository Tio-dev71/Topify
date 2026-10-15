import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';

export interface LeadScoreBreakdown {
  profileScore: number;
  engagementScore: number;
  aiIntentScore: number;
  decayScore: number;
  reasons: string[];
}

export interface CustomerWithScore {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  tags: string | null;
  source: string | null;
  notes: string | null;
  customData: any;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  leadScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  breakdown: LeadScoreBreakdown;
  dealsCount: number;
  totalDealValue: number;
  lastInteractionAt: Date | null;
}

export interface DuplicateGroup {
  groupId: string;
  matchType: 'PHONE' | 'EMAIL' | 'FUZZY_NAME';
  matchKey: string;
  confidence: number;
  customerIds: string[];
  customers: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    source: string | null;
    createdAt: Date;
    dealsCount: number;
  }>;
}

/**
 * Remove Vietnamese accents and normalize string for fuzzy matching
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize phone number (handle +84, 84, leading 0, spaces, dashes)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length >= 11) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

/**
 * Calculate Lead Score & Temperature for a customer (F100)
 */
export function calculateCustomerScore(
  customer: any,
  relatedData?: {
    deals?: Array<{ id: string; value: number; status: string }>;
    conversations?: Array<{ id: string; lastMessageAt: Date | null; messages?: any[] }>;
    activities?: Array<{ id: string; isDone: boolean }>;
  }
): {
  leadScore: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  breakdown: LeadScoreBreakdown;
  dealsCount: number;
  totalDealValue: number;
  lastInteractionAt: Date | null;
} {
  let profileScore = 0;
  let engagementScore = 0;
  let aiIntentScore = 0;
  let decayScore = 0;
  const reasons: string[] = [];

  // 1. Profile Completeness (Max 50)
  const normPhone = normalizePhoneNumber(customer.phone);
  if (normPhone && normPhone.length >= 10) {
    profileScore += 25;
    reasons.push('Có số điện thoại liên hệ xác thực (+25đ)');
  }

  if (customer.email && customer.email.includes('@')) {
    profileScore += 15;
    reasons.push('Có địa chỉ email hợp lệ (+15đ)');
  }

  if (customer.notes || customer.customData?.address || customer.source) {
    profileScore += 10;
    reasons.push('Đầy đủ thông tin nguồn và ghi chú (+10đ)');
  }

  // 2. Engagement & Interaction (Max 35)
  const deals = relatedData?.deals || customer.deals || [];
  const conversations = relatedData?.conversations || customer.conversations || [];
  const activities = relatedData?.activities || customer.activities || [];

  const dealsCount = deals.length;
  const totalDealValue = deals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);

  // Check recent conversation message in last 24h
  let hasRecentChat = false;
  let totalMsgCount = 0;
  let latestMsgDate: Date | null = null;

  for (const conv of conversations) {
    if (conv.lastMessageAt) {
      const msgDate = new Date(conv.lastMessageAt);
      if (!latestMsgDate || msgDate > latestMsgDate) {
        latestMsgDate = msgDate;
      }
      const hoursAgo = (Date.now() - msgDate.getTime()) / (1000 * 60 * 60);
      if (hoursAgo <= 24) {
        hasRecentChat = true;
      }
    }
    if (conv.messages) {
      totalMsgCount += conv.messages.length;
    }
  }

  if (hasRecentChat) {
    engagementScore += 20;
    reasons.push('Có tin nhắn tương tác trong 24 giờ qua (+20đ)');
  }

  if (totalMsgCount >= 3 || conversations.length >= 2) {
    engagementScore += 15;
    reasons.push('Tương tác thường xuyên qua hộp thư (+15đ)');
  }

  const hasOpenDeal = deals.some((d: any) => d.status === 'OPEN');
  if (hasOpenDeal) {
    engagementScore += 15;
    reasons.push('Có giao dịch/Deal đang mở trong quy trình bán hàng (+15đ)');
  }

  const hasCompletedActivity = activities.some((a: any) => a.isDone);
  if (hasCompletedActivity) {
    engagementScore += 10;
    reasons.push('Đã hoàn thành cuộc gọi hoặc buổi tư vấn (+10đ)');
  }

  // 3. AI Intent Scoring (Max 15)
  const notesLower = (customer.notes || '').toLowerCase();
  if (
    notesLower.includes('giá sỉ') ||
    notesLower.includes('đặt cọc') ||
    notesLower.includes('chốt đơn') ||
    notesLower.includes('số lượng lớn')
  ) {
    aiIntentScore += 15;
    reasons.push('Phát hiện ý định mua hàng / mua sỉ khẩn cấp (+15đ)');
  }

  // 4. Decay (Penalties for inactivity)
  const lastActive = latestMsgDate || customer.updatedAt || customer.createdAt;
  const daysInactive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);

  if (daysInactive > 30) {
    decayScore -= 25;
    reasons.push('Hơn 30 ngày không có tương tác mới (-25đ)');
  } else if (daysInactive > 7) {
    decayScore -= 10;
    reasons.push('Hơn 7 ngày không có tương tác mới (-10đ)');
  }

  // Final Score (Clamped between 5 and 100)
  const rawScore = profileScore + engagementScore + aiIntentScore + decayScore;
  const leadScore = Math.min(100, Math.max(5, rawScore));

  let temperature: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  if (leadScore >= 80) {
    temperature = 'HOT';
  } else if (leadScore >= 50) {
    temperature = 'WARM';
  }

  return {
    leadScore,
    temperature,
    breakdown: {
      profileScore,
      engagementScore,
      aiIntentScore,
      decayScore,
      reasons,
    },
    dealsCount,
    totalDealValue,
    lastInteractionAt: lastActive,
  };
}

/**
 * Scan and detect duplicate customer records in workspace (F101)
 */
export function findCustomerDuplicates(customers: any[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedPairs = new Set<string>();

  // Map by normalized phone
  const phoneMap = new Map<string, any[]>();
  // Map by normalized email
  const emailMap = new Map<string, any[]>();

  for (const c of customers) {
    const normPhone = normalizePhoneNumber(c.phone);
    if (normPhone && normPhone.length >= 10) {
      if (!phoneMap.has(normPhone)) phoneMap.set(normPhone, []);
      phoneMap.get(normPhone)!.push(c);
    }

    if (c.email && c.email.trim()) {
      const normEmail = c.email.trim().toLowerCase();
      if (!emailMap.has(normEmail)) emailMap.set(normEmail, []);
      emailMap.get(normEmail)!.push(c);
    }
  }

  // 1. Exact Phone Matches
  for (const [phone, list] of phoneMap.entries()) {
    if (list.length > 1) {
      const ids = list.map((c) => c.id).sort().join('_');
      if (!processedPairs.has(ids)) {
        processedPairs.add(ids);
        duplicateGroups.push({
          groupId: `phone_${phone}`,
          matchType: 'PHONE',
          matchKey: phone,
          confidence: 100,
          customerIds: list.map((c) => c.id),
          customers: list.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            source: c.source,
            createdAt: c.createdAt,
            dealsCount: c.deals?.length || 0,
          })),
        });
      }
    }
  }

  // 2. Exact Email Matches
  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      const ids = list.map((c) => c.id).sort().join('_');
      if (!processedPairs.has(ids)) {
        processedPairs.add(ids);
        duplicateGroups.push({
          groupId: `email_${email}`,
          matchType: 'EMAIL',
          matchKey: email,
          confidence: 100,
          customerIds: list.map((c) => c.id),
          customers: list.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            source: c.source,
            createdAt: c.createdAt,
            dealsCount: c.deals?.length || 0,
          })),
        });
      }
    }
  }

  // 3. Fuzzy Name Matching (between remaining unmerged customers)
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const c1 = customers[i];
      const c2 = customers[j];

      const name1 = normalizeVietnamese(c1.name || '');
      const name2 = normalizeVietnamese(c2.name || '');

      if (name1 && name2 && name1 === name2 && name1.length > 3) {
        const pairKey = [c1.id, c2.id].sort().join('_');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          duplicateGroups.push({
            groupId: `fuzzy_${pairKey}`,
            matchType: 'FUZZY_NAME',
            matchKey: c1.name || '',
            confidence: 85,
            customerIds: [c1.id, c2.id],
            customers: [c1, c2].map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              source: c.source,
              createdAt: c.createdAt,
              dealsCount: c.deals?.length || 0,
            })),
          });
        }
      }
    }
  }

  return duplicateGroups;
}

/**
 * Execute controlled merge of customer duplicate records (F101)
 */
export async function executeCustomerMerge(params: {
  masterId: string;
  duplicateIds: string[];
  fieldOverrides?: {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
  };
  workspaceId: string;
  userId: string;
  req?: any;
}) {
  const { masterId, duplicateIds, fieldOverrides, workspaceId, userId, req } = params;

  if (duplicateIds.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một hồ sơ phụ để hợp nhất');
  }

  if (duplicateIds.includes(masterId)) {
    throw new Error('Hồ sơ chính không thể nằm trong danh sách hồ sơ phụ');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify master and duplicates belong to the same workspace
    const master = await tx.customer.findFirst({
      where: { id: masterId, workspaceId },
      include: { deals: true },
    });

    if (!master) {
      throw new Error('Không tìm thấy hồ sơ chính trong Workspace');
    }

    const duplicates = await tx.customer.findMany({
      where: { id: { in: duplicateIds }, workspaceId },
      include: { deals: true },
    });

    if (duplicates.length === 0) {
      throw new Error('Không tìm thấy các hồ sơ phụ');
    }

    // 2. Transfer all Deals from duplicates to master
    await tx.deal.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: masterId },
    });

    // 3. Transfer all Conversations from duplicates to master
    await tx.conversation.updateMany({
      where: { contactId: { in: duplicateIds } },
      data: { contactId: masterId },
    });

    // 4. Transfer all CRM Activities from duplicates to master
    await tx.crmActivity.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: masterId },
    });

    // 5. Merge Tags & Notes
    const allTags = new Set<string>();
    if (master.tags) master.tags.split(',').forEach((t) => allTags.add(t.trim()));
    duplicates.forEach((d) => {
      if (d.tags) d.tags.split(',').forEach((t) => allTags.add(t.trim()));
    });

    const mergeTimestamp = new Date().toLocaleDateString('vi-VN');
    const mergeAuditNote = `\n[Hợp nhất hồ sơ ${mergeTimestamp}]: Đã gộp thành công dữ liệu từ ${duplicates.length} hồ sơ phụ (${duplicates.map((d) => d.name || d.phone || d.id).join(', ')}).`;
    const combinedNotes = `${master.notes || ''}${mergeAuditNote}`.trim();

    // 6. Update Master Record with overrides and combined data
    const updatedMaster = await tx.customer.update({
      where: { id: masterId },
      data: {
        name: fieldOverrides?.name || master.name,
        phone: fieldOverrides?.phone || master.phone,
        email: fieldOverrides?.email || master.email,
        source: fieldOverrides?.source || master.source,
        tags: Array.from(allTags).filter(Boolean).join(', '),
        notes: combinedNotes,
      },
    });

    // 7. Delete duplicates safely
    await tx.customer.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    // 8. Record audit log
    if (req) {
      await recordAuditLog({
        action: 'CUSTOMER.MERGE',
        entityType: 'Customer',
        entityId: masterId,
        userId,
        workspaceId,
        req,
        metadata: {
          message: `Hợp nhất ${duplicates.length} hồ sơ phụ vào hồ sơ [${updatedMaster.name}]`,
          duplicateIds,
        },
      });
    }

    return updatedMaster;
  });
}
