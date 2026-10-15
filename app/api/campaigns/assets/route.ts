import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_ASSETS, CampaignAssetItem, AssetApprovalStatus, AssetType } from '@/lib/campaigns/engine';

let memoryAssets: CampaignAssetItem[] = [...SAMPLE_ASSETS];

// GET /api/campaigns/assets?campaignId=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId');
    const status = url.searchParams.get('status');

    let assets = [...memoryAssets];
    if (campaignId) {
      assets = assets.filter((a) => a.campaignId === campaignId);
    }
    if (status && status !== 'ALL') {
      assets = assets.filter((a) => a.approvalStatus === status);
    }

    return NextResponse.json({
      success: true,
      assets,
      total: assets.length,
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGN_ASSETS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/campaigns/assets - Upload / add new creative asset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, name, type = 'IMAGE', fileUrl = '', fileSize = 2500000, thumbnailUrl } = body;

    if (!campaignId || !name?.trim()) {
      return NextResponse.json({ error: 'campaignId và tên asset là bắt buộc' }, { status: 400 });
    }

    const newAsset: CampaignAssetItem = {
      id: `asset_${Date.now()}`,
      campaignId,
      name: name.trim(),
      type: type as AssetType,
      fileUrl: fileUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1080&h=1920&fit=crop',
      fileSize: Number(fileSize) || 2500000,
      thumbnailUrl: thumbnailUrl || undefined,
      approvalStatus: 'PENDING_REVIEW',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryAssets.unshift(newAsset);

    return NextResponse.json({
      success: true,
      asset: newAsset,
      message: 'Đã tải lên tài nguyên và chuyển sang hàng đợi chờ duyệt',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API_CAMPAIGN_ASSETS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/campaigns/assets - Review approval status (APPROVED / REJECTED)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, assetId, approvalStatus, reviewerNote, reviewedBy } = body;
    const targetId = id || assetId;

    if (!targetId || !approvalStatus) {
      return NextResponse.json({ error: 'assetId và approvalStatus là bắt buộc' }, { status: 400 });
    }

    const index = memoryAssets.findIndex((a) => a.id === targetId);
    if (index === -1) {
      return NextResponse.json({ error: 'Không tìm thấy tài nguyên' }, { status: 404 });
    }

    memoryAssets[index].approvalStatus = approvalStatus as AssetApprovalStatus;
    if (reviewerNote !== undefined) memoryAssets[index].reviewerNote = reviewerNote;
    if (reviewedBy !== undefined) memoryAssets[index].reviewedBy = reviewedBy;
    memoryAssets[index].updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      asset: memoryAssets[index],
      message: `Đã cập nhật trạng thái phê duyệt: ${approvalStatus}`,
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGN_ASSETS_PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
