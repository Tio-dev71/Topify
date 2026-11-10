import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { recordAuditLog } from '@/lib/audit-log';
import jwtPackage from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

export interface ModerationRule {
  id: string;
  category: 'ADS_POLICY' | 'MEDICAL_CLAIMS' | 'FINANCE_SCAM' | 'OFFENSIVE' | 'BRAND_INTEGRITY';
  categoryName: string;
  keyword: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  suggestion: string;
  isCustom?: boolean;
}

export interface ModerationScanRecord {
  id: string;
  textSnippet: string;
  targetType: 'PROMPT' | 'AI_OUTPUT' | 'AD_COPY' | 'ARTICLE';
  safetyScore: number; // 0 - 100
  status: 'SAFE' | 'WARNING' | 'VIOLATION';
  violationsCount: number;
  flaggedKeywords: string[];
  cleanText: string;
  scannedAt: string;
  scannedBy: string;
}

// Built-in standard moderation rules
const defaultModerationRules: ModerationRule[] = [
  // 1. Medical Claims / Cam kết y tế quá đà
  {
    id: 'rule_med_01',
    category: 'MEDICAL_CLAIMS',
    categoryName: 'Cam kết Y Tế / Mỹ Phẩm',
    keyword: 'trị dứt điểm',
    severity: 'CRITICAL',
    description: 'Vi phạm chính sách quảng cáo Meta/TikTok về cam kết điều trị y khoa tuyệt đối.',
    suggestion: 'hỗ trợ cải thiện rõ rệt',
  },
  {
    id: 'rule_med_02',
    category: 'MEDICAL_CLAIMS',
    categoryName: 'Cam kết Y Tế / Mỹ Phẩm',
    keyword: 'cam kết 100%',
    severity: 'CRITICAL',
    description: 'Từ ngữ cam kết tuyệt đối dễ bị quét checkpoint và khóa tài khoản quảng cáo.',
    suggestion: 'được nhiều khách hàng tin dùng',
  },
  {
    id: 'rule_med_03',
    category: 'MEDICAL_CLAIMS',
    categoryName: 'Cam kết Y Tế / Mỹ Phẩm',
    keyword: 'chữa khỏi hoàn toàn',
    severity: 'CRITICAL',
    description: 'Tuyên bố chữa khỏi bệnh trái quy định kiểm duyệt nội dung y tế.',
    suggestion: 'giúp cải thiện tình trạng hiệu quả',
  },
  // 2. Ads Policy / Chính sách quảng cáo Meta & TikTok
  {
    id: 'rule_ads_01',
    category: 'ADS_POLICY',
    categoryName: 'Chính Sách Quảng Cáo',
    keyword: 'trước sau',
    severity: 'HIGH',
    description: 'So sánh Trước/Sau (Before/After) vi phạm chính sách hiển thị hình thể của Facebook/TikTok.',
    suggestion: 'quá trình trải nghiệm và cảm nhận',
  },
  {
    id: 'rule_ads_02',
    category: 'ADS_POLICY',
    categoryName: 'Chính Sách Quảng Cáo',
    keyword: 'giảm béo cấp tốc',
    severity: 'HIGH',
    description: 'Quảng cáo giảm cân cấp tốc, tác dụng thần tốc bị cấm trên các nền tảng social.',
    suggestion: 'hỗ trợ vóc dáng thon gọn lành mạnh',
  },
  // 3. Finance & Scam / Tài chính, lừa đảo
  {
    id: 'rule_fin_01',
    category: 'FINANCE_SCAM',
    categoryName: 'Tài Chính & Kiếm Tiền',
    keyword: 'kiếm tiền không cần làm',
    severity: 'CRITICAL',
    description: 'Cờ bạc, đa cấp hoặc cơ hội làm giàu nhanh bị chặn nghiêm ngặt.',
    suggestion: 'gia tăng thu nhập từ kỹ năng thực chiến',
  },
  {
    id: 'rule_fin_02',
    category: 'FINANCE_SCAM',
    categoryName: 'Tài Chính & Kiếm Tiền',
    keyword: 'lợi nhuận chắc chắn',
    severity: 'CRITICAL',
    description: 'Cam kết lợi nhuận đầu tư không rủi ro vi phạm pháp luật tài chính.',
    suggestion: 'tiềm năng tối ưu chi phí và tăng trưởng',
  },
  // 4. Offensive & Brand Integrity
  {
    id: 'rule_off_01',
    category: 'OFFENSIVE',
    categoryName: 'Ngôn Từ Phản Cảm',
    keyword: 'lừa đảo',
    severity: 'MEDIUM',
    description: 'Ngôn từ tiêu cực gây hại uy tín thương hiệu.',
    suggestion: 'chưa đúng như kỳ vọng',
  },
  {
    id: 'rule_brand_01',
    category: 'BRAND_INTEGRITY',
    categoryName: 'Quy Chuẩn Thương Hiệu',
    keyword: 'rẻ tiền nhất thị trường',
    severity: 'MEDIUM',
    description: 'Hạ thấp định vị thương hiệu so với tone giọng cao cấp chuyên nghiệp.',
    suggestion: 'tối ưu chi phí đầu tư với hiệu quả vượt trội',
  },
];

// Persistent state in memory per workspace
const workspaceRulesStore = new Map<string, ModerationRule[]>();
const workspaceScansStore = new Map<string, ModerationScanRecord[]>();

async function resolveWorkspace(req: NextRequest) {
  let workspaceId: string | null = null;
  let userId: string | null = null;
  let userName = 'Admin';

  try {
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
      userName = session.user.name || session.user.email || 'Admin';
      workspaceId = (session.user as any)?.workspaceId || null;
    }
  } catch {}

  if (!workspaceId) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwtPackage.verify(token, JWT_SECRET) as any;
        userId = decoded.sub || decoded.id || userId;
        userName = decoded.name || decoded.email || userName;
        workspaceId = decoded.workspaceId || workspaceId;
      }
    } catch {}
  }

  const customHeader = req.headers.get('x-workspace-id');
  if (customHeader) workspaceId = customHeader;

  if (!workspaceId) {
    const ws = await prisma.workspace.findFirst({ select: { id: true } });
    workspaceId = ws?.id || 'default-workspace';
  }

  return { workspaceId, userId, userName };
}

function getWorkspaceRules(workspaceId: string): ModerationRule[] {
  if (!workspaceRulesStore.has(workspaceId)) {
    workspaceRulesStore.set(workspaceId, [...defaultModerationRules]);
  }
  return workspaceRulesStore.get(workspaceId)!;
}

function getWorkspaceScans(workspaceId: string): ModerationScanRecord[] {
  if (!workspaceScansStore.has(workspaceId)) {
    workspaceScansStore.set(workspaceId, [
      {
        id: 'scan_001',
        textSnippet: 'Sản phẩm serum cam kết 100% trị dứt điểm nám chỉ sau 3 ngày...',
        targetType: 'AD_COPY',
        safetyScore: 35,
        status: 'VIOLATION',
        violationsCount: 2,
        flaggedKeywords: ['cam kết 100%', 'trị dứt điểm'],
        cleanText: 'Sản phẩm serum được nhiều khách hàng tin dùng hỗ trợ cải thiện rõ rệt nám chỉ sau 3 ngày...',
        scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        scannedBy: 'yến ngô',
      },
      {
        id: 'scan_002',
        textSnippet: 'Khóa học tự động hóa Marketing giúp doanh nghiệp tối ưu chi phí vận hành...',
        targetType: 'ARTICLE',
        safetyScore: 98,
        status: 'SAFE',
        violationsCount: 0,
        flaggedKeywords: [],
        cleanText: 'Khóa học tự động hóa Marketing giúp doanh nghiệp tối ưu chi phí vận hành...',
        scannedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        scannedBy: 'minh@topify.vn',
      },
      {
        id: 'scan_003',
        textSnippet: 'Xem hình ảnh trước sau khi sử dụng dịch vụ spa để thấy rõ khác biệt...',
        targetType: 'AI_OUTPUT',
        safetyScore: 72,
        status: 'WARNING',
        violationsCount: 1,
        flaggedKeywords: ['trước sau'],
        cleanText: 'Xem quá trình trải nghiệm và cảm nhận khi sử dụng dịch vụ spa để thấy rõ khác biệt...',
        scannedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        scannedBy: 'yến ngô',
      },
    ]);
  }
  return workspaceScansStore.get(workspaceId)!;
}

// GET /api/ai/safety-moderation - Get rules, blacklist keywords, and scan history
export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = await resolveWorkspace(req);
    const rules = getWorkspaceRules(workspaceId);
    const scans = getWorkspaceScans(workspaceId);

    // Also attempt to read recent scans from DB AuditLog
    let auditScans: any[] = [];
    try {
      auditScans = await prisma.auditLog.findMany({
        where: {
          workspaceId,
          action: 'AI.SAFETY.SCAN',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } catch {}

    const combinedScans = [...scans];
    for (const log of auditScans) {
      const scanItem = log.metadata?.scan || log.metadata?.payload || log.metadata;
      if (scanItem && typeof scanItem === 'object' && scanItem.id) {
        if (!combinedScans.some((s) => s.id === scanItem.id)) {
          combinedScans.unshift(scanItem);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rules,
        scans: combinedScans,
        summary: {
          totalRules: rules.length,
          customRulesCount: rules.filter((r) => r.isCustom).length,
          totalScans: combinedScans.length,
          safePercent: Math.round(
            (combinedScans.filter((s) => s.status === 'SAFE').length / (combinedScans.length || 1)) * 100
          ),
          flaggedCount: combinedScans.filter((s) => s.status !== 'SAFE').length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching safety moderation data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải dữ liệu kiểm duyệt an toàn' },
      { status: 500 }
    );
  }
}

// POST /api/ai/safety-moderation - Scan text, add custom rule, or delete rule
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, userId, userName } = await resolveWorkspace(req);
    const body = await req.json();
    const { action = 'scan' } = body;

    // ACTION 1: Add a custom blacklist keyword / policy rule
    if (action === 'add_rule') {
      const { keyword, category = 'ADS_POLICY', severity = 'HIGH', description = '', suggestion = '' } = body;
      if (!keyword || !keyword.trim()) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập từ khóa vi phạm' }, { status: 400 });
      }

      const rules = getWorkspaceRules(workspaceId);
      const categoryNames: Record<string, string> = {
        ADS_POLICY: 'Chính Sách Quảng Cáo',
        MEDICAL_CLAIMS: 'Cam kết Y Tế / Mỹ Phẩm',
        FINANCE_SCAM: 'Tài Chính & Kiếm Tiền',
        OFFENSIVE: 'Ngôn Từ Phản Cảm',
        BRAND_INTEGRITY: 'Quy Chuẩn Thương Hiệu',
      };

      const newRule: ModerationRule = {
        id: `rule_custom_${Date.now()}`,
        category,
        categoryName: categoryNames[category] || 'Tùy Chỉnh Doanh Nghiệp',
        keyword: keyword.trim().toLowerCase(),
        severity,
        description: description.trim() || `Quy tắc nội bộ cấm từ khóa "${keyword.trim()}"`,
        suggestion: suggestion.trim() || 'từ ngữ thay thế phù hợp',
        isCustom: true,
      };

      rules.unshift(newRule);

      await recordAuditLog({
        workspaceId,
        userId: userId || undefined,
        action: 'AI.SAFETY.RULE_CREATE',
        entityType: 'AiModerationRule',
        entityId: newRule.id,
        metadata: { rule: newRule },
      });

      return NextResponse.json({
        success: true,
        message: `Đã thêm từ khóa cấm "${newRule.keyword}" thành công`,
        data: newRule,
      });
    }

    // ACTION 2: Delete a rule
    if (action === 'delete_rule') {
      const { ruleId } = body;
      const rules = getWorkspaceRules(workspaceId);
      const index = rules.findIndex((r) => r.id === ruleId);
      if (index !== -1) {
        rules.splice(index, 1);
      }
      return NextResponse.json({
        success: true,
        message: 'Đã xóa quy tắc kiểm duyệt',
      });
    }

    // ACTION 3: Scan text for policy violations and compute safety score
    const { text, targetType = 'PROMPT' } = body;
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập nội dung cần kiểm duyệt' }, { status: 400 });
    }

    const rules = getWorkspaceRules(workspaceId);
    const content = text.trim();
    const lowerContent = content.toLowerCase();

    const violations: Array<{ rule: ModerationRule; match: string }> = [];
    let cleanText = content;

    for (const rule of rules) {
      const kw = rule.keyword.toLowerCase();
      if (lowerContent.includes(kw)) {
        violations.push({ rule, match: rule.keyword });

        // Auto-sanitize text with suggestion
        if (rule.suggestion) {
          const regex = new RegExp(kw, 'gi');
          cleanText = cleanText.replace(regex, rule.suggestion);
        }
      }
    }

    // Calculate Safety Score: Start with 100, deduct based on severity
    let score = 100;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;

    for (const v of violations) {
      if (v.rule.severity === 'CRITICAL') {
        score -= 35;
        criticalCount++;
      } else if (v.rule.severity === 'HIGH') {
        score -= 20;
        highCount++;
      } else {
        score -= 10;
        mediumCount++;
      }
    }
    score = Math.max(0, Math.min(100, score));

    let status: 'SAFE' | 'WARNING' | 'VIOLATION' = 'SAFE';
    if (criticalCount > 0 || score < 60) {
      status = 'VIOLATION';
    } else if (violations.length > 0 || score < 85) {
      status = 'WARNING';
    }

    const scanRecord: ModerationScanRecord = {
      id: `scan_${Date.now()}`,
      textSnippet: content.length > 90 ? `${content.substring(0, 90)}...` : content,
      targetType,
      safetyScore: score,
      status,
      violationsCount: violations.length,
      flaggedKeywords: violations.map((v) => v.rule.keyword),
      cleanText,
      scannedAt: new Date().toISOString(),
      scannedBy: userName,
    };

    const scans = getWorkspaceScans(workspaceId);
    scans.unshift(scanRecord);
    if (scans.length > 50) scans.pop();

    await recordAuditLog({
      workspaceId,
      userId: userId || undefined,
      action: 'AI.SAFETY.SCAN',
      entityType: 'AiModerationScan',
      entityId: scanRecord.id,
      metadata: { scan: scanRecord },
    });

    return NextResponse.json({
      success: true,
      data: {
        scanResult: scanRecord,
        violations: violations.map((v) => ({
          keyword: v.rule.keyword,
          category: v.rule.category,
          categoryName: v.rule.categoryName,
          severity: v.rule.severity,
          description: v.rule.description,
          suggestion: v.rule.suggestion,
        })),
        cleanText,
      },
    });
  } catch (error: any) {
    console.error('Error in safety moderation scan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xử lý kiểm duyệt nội dung' },
      { status: 500 }
    );
  }
}
