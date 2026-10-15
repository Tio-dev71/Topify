import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_CAMPAIGNS, calculateBudgetBurnRate } from '@/lib/campaigns/engine';

// GET /api/campaigns/progress?campaignId=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId') || 'camp_1';

    const campaign = SAMPLE_CAMPAIGNS.find((c) => c.id === campaignId) || SAMPLE_CAMPAIGNS[0];

    // 1. Content Progress
    const totalTargetPosts = campaign.phases.reduce((acc, p) => acc + p.targetPostsCount, 0) || 30;
    const totalPublishedPosts = campaign.phases.reduce((acc, p) => acc + p.publishedPostsCount, 0) || 15;
    const contentCompletionRate = Math.round((totalPublishedPosts / (totalTargetPosts || 1)) * 100);

    // 2. Tasks Progress
    const totalTasks = campaign.tasksCount || 10;
    const completedTasks = campaign.completedTasksCount || 6;
    const taskCompletionRate = Math.round((completedTasks / (totalTasks || 1)) * 100);

    // 3. KPI Progress
    const kpiSummary = campaign.kpis.map((k) => ({
      ...k,
      completionRate: k.targetValue > 0 ? Math.min(100, Math.round((k.currentValue / k.targetValue) * 100)) : 0,
    }));
    const averageKpiCompletion = Math.round(
      kpiSummary.reduce((acc, k) => acc + k.completionRate, 0) / (kpiSummary.length || 1)
    );

    // 4. Budget Burn Progress
    const budgetBurn = calculateBudgetBurnRate(
      campaign.totalBudget,
      campaign.totalSpent,
      campaign.startDate,
      campaign.endDate
    );

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      metrics: {
        content: {
          targetPosts: totalTargetPosts,
          publishedPosts: totalPublishedPosts,
          rate: contentCompletionRate,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          rate: taskCompletionRate,
        },
        kpis: {
          averageRate: averageKpiCompletion,
          items: kpiSummary,
        },
        budget: {
          plannedAmount: campaign.totalBudget,
          actualSpent: campaign.totalSpent,
          categories: campaign.budgetCategories,
          burnRate: budgetBurn,
        },
      },
      phases: campaign.phases,
    });
  } catch (error: any) {
    console.error('[API_CAMPAIGN_PROGRESS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
