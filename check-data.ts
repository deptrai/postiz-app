import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking database for analytics data...\n');

  // Get organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization found');
    return;
  }
  console.log(`✅ Organization: ${org.name} (${org.id})\n`);

  // Check content
  const content = await prisma.analyticsContent.findMany({
    where: { organizationId: org.id },
  });
  console.log(`📄 AnalyticsContent: ${content.length} records`);
  if (content.length > 0) {
    console.log('Sample:', content.slice(0, 2).map(c => ({
      id: c.externalContentId,
      type: c.contentType,
      caption: c.caption?.substring(0, 40) + '...',
      published: c.publishedAt
    })));
  }

  // Check metrics
  const metrics = await prisma.analyticsDailyMetric.findMany({
    where: { organizationId: org.id },
  });
  console.log(`\n📊 AnalyticsDailyMetric: ${metrics.length} records`);
  if (metrics.length > 0) {
    console.log('Sample:', metrics.slice(0, 2).map(m => ({
      contentId: m.externalContentId,
      reach: m.reach,
      reactions: m.reactions,
      date: m.date
    })));
  }

  // Check playbooks
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: org.id },
  });
  console.log(`\n📚 Playbooks: ${playbooks.length} records`);
  if (playbooks.length > 0) {
    console.log('Playbooks:', playbooks.map(p => ({
      name: p.name,
      format: p.format,
      created: p.createdAt
    })));
  }

  console.log('\n✅ Data check complete');
}

checkData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
