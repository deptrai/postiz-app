require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMetrics() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320'; // org "axx"

  // Get analytics content with metrics
  const content = await prisma.analyticsContent.findMany({
    where: { 
      organizationId: orgId,
      deletedAt: null,
    },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
      },
    },
  });

  console.log(`📊 Found ${content.length} posts\n`);

  content.forEach(post => {
    console.log(`Post: ${post.externalContentId}`);
    console.log(`  Published: ${post.publishedAt}`);
    console.log(`  Caption: ${post.caption?.substring(0, 50)}...`);
    console.log(`  Metrics: ${post.metrics.length}`);
    
    if (post.metrics.length > 0) {
      const latest = post.metrics[0];
      console.log(`  Latest metrics (${latest.timestamp}):`);
      
      const metricsByType = post.metrics.reduce((acc, m) => {
        acc[m.metricType] = m.metricValue;
        return acc;
      }, {});
      
      console.log(`    Reach: ${metricsByType.reach || 0}`);
      console.log(`    Likes: ${metricsByType.likes || 0}`);
      console.log(`    Comments: ${metricsByType.comments || 0}`);
      console.log(`    Shares: ${metricsByType.shares || 0}`);
    } else {
      console.log('  ⚠️ No metrics found!');
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkMetrics()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
