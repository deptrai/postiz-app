const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function createSampleAnalytics() {
  const orgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co

  console.log('🔧 Creating Sample Analytics Data for Analytics Test Co\n');

  // Get integrations
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      internalId: true,
    },
  });

  console.log(`📱 Found ${integrations.length} Facebook integrations\n`);

  // Sample content data
  const contentTypes = ['reel', 'video', 'post'];
  const sampleCaptions = [
    'Check out our latest product! 🚀',
    'Behind the scenes of our team 👀',
    'Tutorial: How to get started 📚',
    'Customer success story 🎉',
    'New feature announcement! ✨',
    'Weekly tips and tricks 💡',
    'Live Q&A session recap 🎙️',
    'Product demo video 🎬',
  ];

  let contentCount = 0;
  let metricsCount = 0;

  for (const integration of integrations) {
    console.log(`📝 Creating content for: ${integration.name}`);

    // Create 5-10 content items per integration
    const numContent = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numContent; i++) {
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const publishedAt = dayjs().subtract(Math.floor(Math.random() * 14), 'days').toDate();
      const externalContentId = `${integration.internalId}_${Date.now()}_${i}`;

      // Create content
      const content = await prisma.analyticsContent.create({
        data: {
          organizationId: orgId,
          integrationId: integration.id,
          externalContentId,
          contentType,
          caption: sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)],
          hashtags: JSON.stringify(['#postiz', '#socialmedia', '#marketing']),
          publishedAt,
        },
      });

      contentCount++;

      // Create metrics for this content
      const baseViews = 100 + Math.floor(Math.random() * 10000);
      const baseReach = Math.floor(baseViews * (0.8 + Math.random() * 0.4));
      const baseLikes = Math.floor(baseViews * (0.05 + Math.random() * 0.1));
      const baseComments = Math.floor(baseLikes * (0.1 + Math.random() * 0.2));
      const baseShares = Math.floor(baseLikes * (0.05 + Math.random() * 0.1));

      // Create metrics for last 7 days
      for (let d = 0; d < 7; d++) {
        const metricDate = dayjs().subtract(d, 'days').toDate();
        const dailyMultiplier = 0.5 + Math.random() * 1.0;

        const metricsToCreate = [
          { type: 'views', value: Math.floor(baseViews * dailyMultiplier / 7) },
          { type: 'reach', value: Math.floor(baseReach * dailyMultiplier / 7) },
          { type: 'likes', value: Math.floor(baseLikes * dailyMultiplier / 7) },
          { type: 'comments', value: Math.floor(baseComments * dailyMultiplier / 7) },
          { type: 'shares', value: Math.floor(baseShares * dailyMultiplier / 7) },
        ];

        for (const metric of metricsToCreate) {
          await prisma.analyticsMetric.create({
            data: {
              organization: { connect: { id: orgId } },
              integration: { connect: { id: integration.id } },
              content: { connect: { id: content.id } },
              date: metricDate,
              metricType: metric.type,
              metricValue: metric.value,
              externalContentId,
            },
          });
          metricsCount++;
        }
      }
    }

    console.log(`   ✅ Created ${numContent} content items with metrics\n`);
  }

  console.log('═══════════════════════════════════════\n');
  console.log('📊 SAMPLE DATA CREATED:\n');
  console.log(`   Total Content: ${contentCount}`);
  console.log(`   Total Metrics: ${metricsCount}\n`);

  // Verify data
  const totalContent = await prisma.analyticsContent.count({
    where: { organizationId: orgId },
  });
  const totalMetrics = await prisma.analyticsMetric.count({
    where: { organizationId: orgId },
  });

  console.log('📈 DATABASE VERIFICATION:\n');
  console.log(`   AnalyticsContent: ${totalContent} records`);
  console.log(`   AnalyticsMetric: ${totalMetrics} records\n`);

  console.log('✅ Sample data created successfully!');
  console.log('🔄 Refresh http://localhost:4200/monetization to see data!\n');
}

createSampleAnalytics()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
