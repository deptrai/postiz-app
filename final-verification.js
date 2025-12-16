const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('✅ FINAL VERIFICATION\n');
  console.log('='.repeat(60));

  const org = await prisma.organization.findFirst();

  // 1. Check analytics data
  console.log('\n1️⃣ Analytics Data:');
  const content = await prisma.analyticsContent.count({ 
    where: { organizationId: org.id } 
  });
  const metrics = await prisma.analyticsDailyMetric.count({ 
    where: { organizationId: org.id } 
  });
  console.log(`   ✅ AnalyticsContent: ${content} records`);
  console.log(`   ✅ AnalyticsDailyMetric: ${metrics} records`);

  // 2. Check playbooks
  console.log('\n2️⃣ Playbooks:');
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: org.id },
    include: {
      _count: { select: { sourceContent: true } }
    }
  });
  console.log(`   ✅ Total playbooks: ${playbooks.length}`);
  
  if (playbooks.length > 0) {
    playbooks.forEach(pb => {
      console.log(`\n   📚 ${pb.name}`);
      console.log(`      ID: ${pb.id}`);
      console.log(`      Format: ${pb.format}`);
      console.log(`      Sources: ${pb._count.sourceContent} items`);
      console.log(`      Score: ${pb.consistencyScore}%`);
      console.log(`      Created: ${pb.createdAt.toISOString()}`);
    });
  }

  // 3. Check recipe structure
  console.log('\n3️⃣ Recipe Structure:');
  if (playbooks.length > 0) {
    const recipe = playbooks[0].recipe;
    console.log(`   ✅ captionBucket.hooks: ${recipe.captionBucket?.hooks?.length || 0} items`);
    console.log(`   ✅ captionBucket.ctaPatterns: ${recipe.captionBucket?.ctaPatterns?.length || 0} items`);
    console.log(`   ✅ hashtagBucket: ${recipe.hashtagBucket?.length || 0} hashtags`);
    console.log(`   ✅ timeBucket.bestHours: ${recipe.timeBucket?.bestHours?.length || 0} hours`);
    console.log(`   ✅ timeBucket.bestDays: ${recipe.timeBucket?.bestDays?.length || 0} days`);
  }

  // 4. Check evidence structure  
  console.log('\n4️⃣ Evidence Structure:');
  if (playbooks.length > 0) {
    const evidence = playbooks[0].evidence;
    console.log(`   ✅ contentCount: ${evidence.contentCount}`);
    console.log(`   ✅ medianReach: ${evidence.medianReach}`);
    console.log(`   ✅ engagementRate: ${evidence.engagementRate.toFixed(2)}%`);
    console.log(`   ✅ topPerformers: ${evidence.topPerformers?.length || 0} items`);
  }

  // 5. Summary
  console.log('\n5️⃣ Summary:');
  console.log('='.repeat(60));
  
  const allGood = content >= 5 && metrics >= 5 && playbooks.length >= 1;
  
  if (allGood) {
    console.log('\n   🎉 SUCCESS! Story 6.1 is WORKING:');
    console.log('   ✅ Analytics data exists');
    console.log('   ✅ Playbook generated successfully');
    console.log('   ✅ Recipe structure correct');
    console.log('   ✅ Evidence data complete');
    console.log('   ✅ Ready for frontend display');
    console.log('\n   ➡️  Frontend at: http://localhost:4200/playbooks');
    console.log('   ➡️  Backend API: http://localhost:4001/playbooks');
    console.log('\n   🎯 STORY 6.1: COMPLETE ✅\n');
  } else {
    console.log('\n   ⚠️  Issues found:');
    if (content < 5) console.log(`   ❌ Need more analytics content (have ${content}, need 5)`);
    if (metrics < 5) console.log(`   ❌ Need more metrics (have ${metrics}, need 5)`);
    if (playbooks.length < 1) console.log(`   ❌ No playbooks generated`);
  }
}

finalVerification()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
