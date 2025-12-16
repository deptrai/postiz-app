require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkContent() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

  const content = await prisma.analyticsContent.findMany({
    where: { 
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      metrics: true,
      integration: {
        select: { name: true }
      }
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  console.log(`📊 Found ${content.length} posts\n`);

  content.forEach(post => {
    console.log(`📝 ${post.integration.name}`);
    console.log(`   ID: ${post.externalContentId}`);
    console.log(`   Date: ${post.publishedAt.toISOString().split('T')[0]}`);
    console.log(`   Caption: ${(post.caption || '').substring(0, 50)}...`);
    
    const metricsByType = post.metrics.reduce((acc, m) => {
      acc[m.metricType] = m.metricValue;
      return acc;
    }, {});
    
    console.log(`   Likes: ${metricsByType.likes || 0}`);
    console.log(`   Comments: ${metricsByType.comments || 0}`);
    console.log(`   Shares: ${metricsByType.shares || 0}`);
    console.log('');
  });

  // Summary
  const totalMetrics = await prisma.analyticsMetric.aggregate({
    where: { organizationId: orgId },
    _sum: { metricValue: true },
    _count: true,
  });

  console.log('📈 Metrics Summary:');
  console.log(`   Total metric records: ${totalMetrics._count}`);
  console.log(`   Sum of all values: ${totalMetrics._sum.metricValue}`);

  await prisma.$disconnect();
}

checkContent()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
