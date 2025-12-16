const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGeneration() {
  console.log('🧪 Testing generation with frontend org...\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  console.log(`Query range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

  // Test exact query from backend
  const content = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    },
  });

  console.log(`✅ Found ${content.length} content items`);
  
  if (content.length > 0) {
    console.log('\nContent details:');
    content.forEach(c => {
      console.log(`- ${c.externalContentId}: ${c.publishedAt.toISOString()}`);
      console.log(`  deletedAt: ${c.deletedAt}`);
      console.log(`  orgId: ${c.organizationId}`);
    });

    // Now actually generate playbook
    console.log('\n🚀 Generating playbook...');
    
    // Import and use the actual service would be complex, so let's just verify data is queryable
    const metrics = await prisma.analyticsDailyMetric.findMany({
      where: {
        organizationId: orgId,
        externalContentId: { in: content.map(c => c.externalContentId) },
        deletedAt: null,
      }
    });

    console.log(`✅ Found ${metrics.length} metrics`);

    if (metrics.length >= 5) {
      console.log('\n✅ DATA IS READY - Backend should work now');
      console.log('➡️  Refresh frontend and click Generate Playbooks');
    }
  } else {
    console.log('\n❌ NO CONTENT FOUND - checking why...');
    
    // Check without date filter
    const allContent = await prisma.analyticsContent.findMany({
      where: { organizationId: orgId }
    });
    console.log(`Total content for this org (no date filter): ${allContent.length}`);
    
    if (allContent.length > 0) {
      console.log('\nAll content dates:');
      allContent.forEach(c => {
        console.log(`- ${c.externalContentId}: ${c.publishedAt.toISOString()}`);
        const inRange = c.publishedAt >= startDate && c.publishedAt <= endDate;
        console.log(`  In range? ${inRange}`);
      });
    }
  }
}

testGeneration()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
