import prisma from '../lib/db';

async function cleanTestData() {
  console.log('🧹 Bắt đầu dọn dẹp toàn bộ dữ liệu test / demo ảo trong CSDL...');

  // 1. CRM
  const delDeals = await prisma.deal.deleteMany({});
  console.log(`- Đã xóa ${delDeals.count} Deals`);

  const delActivities = await prisma.crmActivity.deleteMany({});
  console.log(`- Đã xóa ${delActivities.count} CrmActivities`);

  const delCustomers = await prisma.customer.deleteMany({});
  console.log(`- Đã xóa ${delCustomers.count} Customers`);

  // 2. Theo dõi từ khóa & Thị trường (Keywords & Intelligence)
  const delAlerts = await prisma.mentionAlert.deleteMany({});
  console.log(`- Đã xóa ${delAlerts.count} MentionAlerts`);

  const delKeywords = await prisma.keywordTracker.deleteMany({});
  console.log(`- Đã xóa ${delKeywords.count} KeywordTrackers`);

  // 3. Theo dõi đối thủ (Competitors)
  const delCompPosts = await prisma.competitorPost.deleteMany({});
  console.log(`- Đã xóa ${delCompPosts.count} CompetitorPosts`);

  const delCompPages = await prisma.competitorPage.deleteMany({});
  console.log(`- Đã xóa ${delCompPages.count} CompetitorPages`);

  // 4. Hộp thư hội thoại (Inbox)
  const delMsg = await prisma.message.deleteMany({});
  console.log(`- Đã xóa ${delMsg.count} Messages`);

  const delConvNotes = await prisma.conversationNote.deleteMany({});
  console.log(`- Đã xóa ${delConvNotes.count} ConversationNotes`);

  const delConvs = await prisma.conversation.deleteMany({});
  console.log(`- Đã xóa ${delConvs.count} Conversations`);

  // 5. Bài viết & Media (Posts & Media)
  const delPostPlat = await prisma.postPlatform.deleteMany({});
  console.log(`- Đã xóa ${delPostPlat.count} PostPlatforms`);

  const delPostMedia = await prisma.postMedia.deleteMany({});
  console.log(`- Đã xóa ${delPostMedia.count} PostMedia`);

  const delPostVer = await prisma.postVersion.deleteMany({});
  console.log(`- Đã xóa ${delPostVer.count} PostVersions`);

  const delPubLogs = await prisma.publishLog.deleteMany({});
  console.log(`- Đã xóa ${delPubLogs.count} PublishLogs`);

  const delPosts = await prisma.post.deleteMany({});
  console.log(`- Đã xóa ${delPosts.count} Posts`);

  const delMedia = await prisma.mediaAsset.deleteMany({});
  console.log(`- Đã xóa ${delMedia.count} MediaAssets`);

  const delCalNotes = await prisma.calendarNote.deleteMany({});
  console.log(`- Đã xóa ${delCalNotes.count} CalendarNotes`);

  // 6. Công việc & Chiến dịch (Tasks & Campaigns)
  const delTaskComments = await prisma.taskComment.deleteMany({});
  console.log(`- Đã xóa ${delTaskComments.count} TaskComments`);

  const delTasks = await prisma.task.deleteMany({});
  console.log(`- Đã xóa ${delTasks.count} Tasks`);

  const delCampaigns = await prisma.campaign.deleteMany({});
  console.log(`- Đã xóa ${delCampaigns.count} Campaigns`);

  // 7. Tự động hóa & Buff (Automations & Buff)
  const delBuff = await prisma.buffOrder.deleteMany({});
  console.log(`- Đã xóa ${delBuff.count} BuffOrders`);

  const delAutoLogs = await prisma.automationLog.deleteMany({});
  console.log(`- Đã xóa ${delAutoLogs.count} AutomationLogs`);

  const delAutoTasks = await prisma.automationTask.deleteMany({});
  console.log(`- Đã xóa ${delAutoTasks.count} AutomationTasks`);

  // Đảm bảo Pipeline chuẩn còn tồn tại để CRM có Stage sẵn sàng
  const defaultPipeline = await prisma.pipeline.upsert({
    where: { id: 'default-pipeline' },
    update: {},
    create: {
      id: 'default-pipeline',
      name: 'Quy trình bán hàng chuẩn',
      isDefault: true,
      stages: {
        create: [
          { name: 'Tiếp cận ban đầu', color: '#6366F1', sortOrder: 1 },
          { name: 'Tư vấn & Báo giá', color: '#3B82F6', sortOrder: 2 },
          { name: 'Đàm phán chốt hợp đồng', color: '#F59E0B', sortOrder: 3 },
          { name: 'Thành công (Won)', color: '#10B981', sortOrder: 4 },
        ]
      }
    }
  });
  console.log(`✅ Pipeline mặc định đã sẵn sàng: ${defaultPipeline.name}`);

  console.log('\n🎉 Đã dọn sạch 100% dữ liệu test trong CSDL! Môi trường trắng (Clean Slate) đã sẵn sàng cho Tester kiểm thử.');
}

cleanTestData()
  .catch((err) => {
    console.error('❌ Lỗi khi dọn dẹp CSDL:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
