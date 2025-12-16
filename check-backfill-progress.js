const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBackfillProgress() {
  console.log('🔍 Checking Backfill Progress\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  // Get all analytics content
  const allContent = await prisma.analyticsContent.findMany({
    where: { organizationId: orgId },
    include: { integration: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Total Content: ${allContent.length}\n`);

  // Separate by type
  const sampleData = allContent.filter(c => 
    c.externalContentId.startsWith('fb_post_') ||
    c.externalContentId.startsWith('ext_post_')
  );

  const realData = allContent.filter(c => 
    !c.externalContentId.startsWith('fb_post_') &&
    !c.externalContentId.startsWith('ext_post_')
  );

  console.log(`🧪 Sample/Seed Data: ${sampleData.length}`);
  console.log(`✅ Real FB Data: ${realData.length}\n`);

  if (realData.length > 0) {
    console.log('🎉 REAL FACEBOOK DATA FOUND!\n');
    
    console.log('Sample real posts:');
    realData.slice(0, 5).forEach((post, idx) => {
      console.log(`\n${idx + 1}. ${post.externalContentId}`);
      console.log(`   Integration: ${post.integration.name}`);
      console.log(`   Published: ${post.publishedAt.toISOString().split('T')[0]}`);
      console.log(`   Caption: ${post.caption?.substring(0, 60)}...`);
      console.log(`   Created: ${post.createdAt.toISOString()}`);
    });

    console.log('\n✅ Backfill is working!');
    console.log('📋 Next steps:');
    console.log('1. Wait for all jobs to complete');
    console.log('2. Delete sample data');
    console.log('3. Regenerate playbooks');
  } else {
    console.log('⏳ NO REAL DATA YET\n');
    console.log('Possible reasons:');
    console.log('1. Workers still processing jobs');
    console.log('2. FB access tokens invalid/expired');
    console.log('3. FB pages have no posts in date range');
    console.log('4. Jobs not picked up by workers');
    console.log('\n💡 Check workers logs for errors');
  }

  // Check latest createdAt to see if new data is coming
  if (allContent.length > 0) {
    const latest = allContent[0];
    console.log(`\n📅 Latest content created: ${latest.createdAt.toISOString()}`);
    
    const nowMinus5Min = new Date(Date.now() - 5 * 60 * 1000);
    if (latest.createdAt > nowMinus5Min) {
      console.log('   ✅ Recent activity (< 5 minutes ago)');
    } else {
      console.log('   ⚠️  No recent activity');
    }
  }
}

checkBackfillProgress()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
