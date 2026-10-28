import prisma from '../lib/db';

async function checkCounts() {
  const [
    users,
    workspaces,
    pipelines,
    stages,
    deals,
    customers,
    competitorPages,
    competitorPosts,
    keywords,
    mentionAlerts,
    conversations,
    messages,
    posts,
    tasks,
    campaigns,
    buffOrders
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.pipeline.count(),
    prisma.pipelineStage.count(),
    prisma.deal.count(),
    prisma.customer.count(),
    prisma.competitorPage.count(),
    prisma.competitorPost.count(),
    prisma.keywordTracker.count(),
    prisma.mentionAlert.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.post.count(),
    prisma.task.count(),
    prisma.campaign.count(),
    prisma.buffOrder.count(),
  ]);

  console.log('--- Current DB State ---');
  console.log('Users (Admin/Team):', users);
  console.log('Workspaces:', workspaces);
  console.log('Pipelines:', pipelines);
  console.log('Pipeline Stages:', stages);
  console.log('Deals (CRM):', deals);
  console.log('Customers (CRM):', customers);
  console.log('Competitor Pages:', competitorPages);
  console.log('Competitor Posts:', competitorPosts);
  console.log('Keywords:', keywords);
  console.log('Mention Alerts:', mentionAlerts);
  console.log('Conversations (Inbox):', conversations);
  console.log('Messages (Inbox):', messages);
  console.log('Posts:', posts);
  console.log('Tasks:', tasks);
  console.log('Campaigns:', campaigns);
  console.log('Buff Orders:', buffOrders);
}

checkCounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
