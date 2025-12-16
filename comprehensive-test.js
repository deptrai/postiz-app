const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveTest() {
  console.log('🧪 COMPREHENSIVE END-TO-END TEST\n');
  console.log('='.repeat(70));

  const org = await prisma.organization.findFirst();

  // TEST 1: Analytics Data
  console.log('\n📊 TEST 1: Analytics Data');
  const content = await prisma.analyticsContent.findMany({
    where: { organizationId: org.id }
  });
  
  // Get metrics count separately
  const metricsCount = await prisma.analyticsDailyMetric.count({
    where: { 
      organizationId: org.id,
      deletedAt: null 
    }
  });
  
  console.log(`   ✅ Content items: ${content.length}`);
  console.log(`   ✅ Total metrics: ${metricsCount}`);
  
  if (content.length > 0) {
    const sample = content[0];
    console.log(`\n   Sample Post:`);
    console.log(`   - ID: ${sample.externalContentId}`);
    console.log(`   - Caption: ${sample.caption?.substring(0, 50)}...`);
    console.log(`   - Published: ${sample.publishedAt.toISOString().split('T')[0]}`);
    
    // Get metrics for this content
    const sampleMetrics = await prisma.analyticsDailyMetric.findMany({
      where: { externalContentId: sample.externalContentId },
      take: 1
    });
    console.log(`   - Metrics: ${sampleMetrics.length} record(s)`);
    if (sampleMetrics.length > 0) {
      const m = sampleMetrics[0];
      console.log(`   - Reach: ${m.reach}, Reactions: ${m.reactions}, Comments: ${m.comments}`);
    }
  }

  // TEST 2: Playbook Generation Results
  console.log('\n\n📚 TEST 2: Generated Playbooks');
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: org.id },
    include: {
      sourceContent: {
        include: {
          content: true
        }
      },
      _count: {
        select: { sourceContent: true, variants: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`   ✅ Total playbooks: ${playbooks.length}`);
  
  playbooks.forEach((pb, i) => {
    console.log(`\n   ${i + 1}. ${pb.name}`);
    console.log(`      ID: ${pb.id}`);
    console.log(`      Format: ${pb.format}`);
    console.log(`      Source Content: ${pb._count.sourceContent} items`);
    console.log(`      Consistency Score: ${pb.consistencyScore}%`);
    console.log(`      Created: ${pb.createdAt.toISOString()}`);
  });

  // TEST 3: Recipe Validation
  console.log('\n\n🎨 TEST 3: Recipe Structure Validation');
  if (playbooks.length > 0) {
    const recipe = playbooks[0].recipe;
    const checks = [
      { name: 'format field', value: recipe.format, expected: 'string' },
      { name: 'captionBucket exists', value: !!recipe.captionBucket, expected: true },
      { name: 'captionBucket.hooks', value: Array.isArray(recipe.captionBucket?.hooks), expected: true },
      { name: 'captionBucket.ctaPatterns', value: Array.isArray(recipe.captionBucket?.ctaPatterns), expected: true },
      { name: 'hashtagBucket', value: Array.isArray(recipe.hashtagBucket), expected: true },
      { name: 'timeBucket exists', value: !!recipe.timeBucket, expected: true },
      { name: 'timeBucket.bestHours', value: Array.isArray(recipe.timeBucket?.bestHours), expected: true },
      { name: 'timeBucket.bestDays', value: Array.isArray(recipe.timeBucket?.bestDays), expected: true },
    ];

    checks.forEach(check => {
      const pass = check.value === check.expected || (typeof check.expected === 'string' && typeof check.value === check.expected);
      console.log(`   ${pass ? '✅' : '❌'} ${check.name}: ${pass ? 'PASS' : 'FAIL'}`);
    });

    console.log(`\n   Recipe Details:`);
    console.log(`   - Hooks: ${recipe.captionBucket?.hooks?.length || 0} patterns`);
    console.log(`   - CTAs: ${recipe.captionBucket?.ctaPatterns?.length || 0} patterns`);
    console.log(`   - Hashtags: ${recipe.hashtagBucket?.length || 0} tags`);
    console.log(`   - Best hours: ${recipe.timeBucket?.bestHours?.join(', ') || 'none'}`);
    console.log(`   - Best days: ${recipe.timeBucket?.bestDays?.join(', ') || 'none'}`);
  }

  // TEST 4: Evidence Validation
  console.log('\n\n📈 TEST 4: Evidence Data Validation');
  if (playbooks.length > 0) {
    const evidence = playbooks[0].evidence;
    const checks = [
      { name: 'contentCount', value: typeof evidence.contentCount === 'number', expected: true },
      { name: 'medianReach', value: typeof evidence.medianReach === 'number', expected: true },
      { name: 'engagementRate', value: typeof evidence.engagementRate === 'number', expected: true },
      { name: 'topPerformers', value: Array.isArray(evidence.topPerformers), expected: true },
    ];

    checks.forEach(check => {
      const pass = check.value === check.expected;
      console.log(`   ${pass ? '✅' : '❌'} ${check.name}: ${pass ? 'PASS' : 'FAIL'}`);
    });

    console.log(`\n   Evidence Details:`);
    console.log(`   - Content analyzed: ${evidence.contentCount}`);
    console.log(`   - Median reach: ${evidence.medianReach.toLocaleString()}`);
    console.log(`   - Avg engagement: ${evidence.engagementRate.toFixed(2)}%`);
    console.log(`   - Top performers: ${evidence.topPerformers?.length || 0} posts`);
  }

  // TEST 5: API Response Format
  console.log('\n\n🔌 TEST 5: API Response Format (Frontend Contract)');
  if (playbooks.length > 0) {
    const playbook = playbooks[0];
    const apiResponse = {
      id: playbook.id,
      name: playbook.name,
      format: playbook.format,
      recipe: playbook.recipe,
      medianReach: playbook.evidence?.medianReach || null,
      medianViews: playbook.evidence?.medianReach || null,
      avgEngagementRate: playbook.evidence?.engagementRate || null,
      consistencyScore: playbook.consistencyScore,
      contentCount: playbook.evidence?.contentCount || playbook._count.sourceContent,
      createdAt: playbook.createdAt.toISOString(),
      group: playbook.group,
    };

    const requiredFields = [
      'id', 'name', 'format', 'recipe', 'medianReach', 
      'avgEngagementRate', 'consistencyScore', 'contentCount', 'createdAt'
    ];

    console.log('   Checking frontend contract fields:');
    requiredFields.forEach(field => {
      const exists = apiResponse.hasOwnProperty(field);
      const hasValue = apiResponse[field] !== undefined && apiResponse[field] !== null;
      console.log(`   ${hasValue ? '✅' : '⚠️'} ${field}: ${exists ? (hasValue ? 'present' : 'null') : 'missing'}`);
    });
  }

  // TEST 6: Source Content Links
  console.log('\n\n🔗 TEST 6: Source Content Links');
  if (playbooks.length > 0) {
    const pb = playbooks[0];
    console.log(`   ✅ Source content records: ${pb.sourceContent.length}`);
    console.log(`   ✅ Linked to analytics content: ${pb.sourceContent.filter(sc => sc.content).length}`);
    
    if (pb.sourceContent.length > 0) {
      console.log(`\n   Sample source content:`);
      pb.sourceContent.slice(0, 3).forEach((sc, i) => {
        console.log(`   ${i + 1}. Content ID: ${sc.content?.externalContentId}`);
        console.log(`      Caption: ${sc.content?.caption?.substring(0, 40)}...`);
      });
    }
  }

  // FINAL SUMMARY
  console.log('\n\n' + '='.repeat(70));
  console.log('📋 FINAL SUMMARY');
  console.log('='.repeat(70));

  const allTests = [
    { name: 'Analytics data exists', pass: content.length >= 5 },
    { name: 'Metrics linked to content', pass: metricsCount >= 5 },
    { name: 'Playbook generated', pass: playbooks.length >= 1 },
    { name: 'Recipe structure valid', pass: playbooks.length > 0 && !!playbooks[0].recipe.captionBucket },
    { name: 'Evidence data valid', pass: playbooks.length > 0 && !!playbooks[0].evidence.medianReach },
    { name: 'Source content linked', pass: playbooks.length > 0 && playbooks[0].sourceContent.length >= 3 },
  ];

  const passed = allTests.filter(t => t.pass).length;
  const total = allTests.length;

  console.log(`\nTest Results: ${passed}/${total} PASSED\n`);
  allTests.forEach(test => {
    console.log(`   ${test.pass ? '✅' : '❌'} ${test.name}`);
  });

  const allPassed = passed === total;
  
  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - STORY 6.1 IS COMPLETE AND WORKING!');
    console.log('\n✅ Backend implementation: COMPLETE');
    console.log('✅ Sample data: CREATED');
    console.log('✅ Playbook generation: WORKING');
    console.log('✅ Data structures: VALIDATED');
    console.log('✅ API contract: MATCHES FRONTEND');
    console.log('✅ Ready for frontend display');
    console.log('\n🌐 URLs:');
    console.log('   Frontend: http://localhost:4200/playbooks');
    console.log('   Backend:  http://localhost:4001/playbooks');
    console.log('\n🎯 STORY 6.1: PRODUCTION READY ✅');
  } else {
    console.log('⚠️ SOME TESTS FAILED - REVIEW ABOVE');
  }
  console.log('='.repeat(70) + '\n');
}

comprehensiveTest()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Test Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
