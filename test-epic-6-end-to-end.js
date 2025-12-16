const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Epic 6 End-to-End Integration Test
 * Tests: Story 6.1 (Playbooks) + Story 6.2 (Variants) + Story 6.3 (Experiments)
 */
async function testEpic6EndToEnd() {
  console.log('🧪 Epic 6: End-to-End Integration Test\n');
  console.log('═══════════════════════════════════════\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';
  let totalTests = 0;
  let passedTests = 0;

  // ========================================
  // STORY 6.1: PLAYBOOK GENERATION
  // ========================================
  console.log('📋 STORY 6.1: Playbook Generation\n');

  // Test 1: Verify playbooks exist
  totalTests++;
  const playbooks = await prisma.playbook.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: { sourceContent: true },
  });

  if (playbooks.length > 0) {
    console.log(`✅ Test 1: Playbooks exist (${playbooks.length} found)`);
    passedTests++;
  } else {
    console.log('❌ Test 1: No playbooks found');
  }

  // Test 2: Verify playbook structure
  totalTests++;
  if (playbooks.length > 0) {
    const playbook = playbooks[0];
    const hasRequiredFields = playbook.name && playbook.recipe && playbook.consistencyScore !== null;
    const recipe = playbook.recipe;
    const hasRecipeStructure = 
      recipe.captionBucket?.hooks?.length > 0 &&
      recipe.captionBucket?.ctaPatterns?.length > 0 &&
      recipe.hashtagBucket?.length > 0 &&
      recipe.timeBucket?.bestHours?.length > 0;

    if (hasRequiredFields && hasRecipeStructure) {
      console.log('✅ Test 2: Playbook structure valid');
      console.log(`   - Hooks: ${recipe.captionBucket.hooks.length}`);
      console.log(`   - CTAs: ${recipe.captionBucket.ctaPatterns.length}`);
      console.log(`   - Hashtags: ${recipe.hashtagBucket.length}`);
      console.log(`   - Best hours: ${recipe.timeBucket.bestHours.length}`);
      passedTests++;
    } else {
      console.log('❌ Test 2: Playbook structure invalid');
    }
  } else {
    console.log('⏭️  Test 2: Skipped (no playbooks)');
  }

  console.log('');

  // ========================================
  // STORY 6.2: VARIANT GENERATION
  // ========================================
  console.log('📋 STORY 6.2: Variant Generation\n');

  const playbookWithVariants = playbooks.length > 0 ? playbooks[0] : null;

  // Test 3: Verify variants exist
  totalTests++;
  let variants = [];
  if (playbookWithVariants) {
    variants = await prisma.playbookVariant.findMany({
      where: { 
        playbookId: playbookWithVariants.id,
        deletedAt: null 
      },
    });

    if (variants.length >= 3 && variants.length <= 5) {
      console.log(`✅ Test 3: Variants exist (${variants.length} found, expected 3-5)`);
      passedTests++;
    } else {
      console.log(`❌ Test 3: Variant count incorrect (${variants.length}, expected 3-5)`);
    }
  } else {
    console.log('⏭️  Test 3: Skipped (no playbook)');
  }

  // Test 4: Verify variant types coverage
  totalTests++;
  if (variants.length > 0) {
    const types = [...new Set(variants.map(v => v.type))];
    const hasAllTypes = types.includes('hook') && types.includes('time') && types.includes('hashtag');

    if (hasAllTypes) {
      console.log('✅ Test 4: Variant types complete');
      console.log(`   - Types: ${types.join(', ')}`);
      passedTests++;
    } else {
      console.log(`❌ Test 4: Variant types incomplete (found: ${types.join(', ')})`);
    }
  } else {
    console.log('⏭️  Test 4: Skipped (no variants)');
  }

  // Test 5: Verify variant has description
  totalTests++;
  if (variants.length > 0) {
    const hasDescriptions = variants.every(v => v.description);
    if (hasDescriptions) {
      console.log('✅ Test 5: All variants have descriptions');
      passedTests++;
    } else {
      console.log('❌ Test 5: Some variants missing descriptions');
    }
  } else {
    console.log('⏭️  Test 5: Skipped (no variants)');
  }

  console.log('');

  // ========================================
  // STORY 6.3: EXPERIMENTS
  // ========================================
  console.log('📋 STORY 6.3: Experiments\n');

  // Test 6: Verify experiments exist
  totalTests++;
  const experiments = await prisma.experiment.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: {
      variants: {
        include: { variant: true },
      },
    },
  });

  if (experiments.length > 0) {
    console.log(`✅ Test 6: Experiments exist (${experiments.length} found)`);
    passedTests++;
  } else {
    console.log('❌ Test 6: No experiments found');
  }

  // Test 7: Verify experiment structure
  totalTests++;
  if (experiments.length > 0) {
    const experiment = experiments[0];
    const hasRequiredFields = 
      experiment.name &&
      experiment.successMetric &&
      experiment.status;

    const hasCorrectVariantCount = 
      experiment.variants.length >= 2 && 
      experiment.variants.length <= 3;

    if (hasRequiredFields && hasCorrectVariantCount) {
      console.log('✅ Test 7: Experiment structure valid');
      console.log(`   - Name: ${experiment.name}`);
      console.log(`   - Metric: ${experiment.successMetric}`);
      console.log(`   - Status: ${experiment.status}`);
      console.log(`   - Variants: ${experiment.variants.length}`);
      passedTests++;
    } else {
      console.log('❌ Test 7: Experiment structure invalid');
    }
  } else {
    console.log('⏭️  Test 7: Skipped (no experiments)');
  }

  // Test 8: Verify experiment lifecycle
  totalTests++;
  if (experiments.length > 0) {
    const validStatuses = ['draft', 'active', 'completed'];
    const hasValidStatus = validStatuses.includes(experiments[0].status);

    if (hasValidStatus) {
      console.log(`✅ Test 8: Experiment status valid (${experiments[0].status})`);
      passedTests++;
    } else {
      console.log(`❌ Test 8: Invalid experiment status (${experiments[0].status})`);
    }
  } else {
    console.log('⏭️  Test 8: Skipped (no experiments)');
  }

  console.log('');

  // ========================================
  // INTEGRATION TESTS
  // ========================================
  console.log('📋 INTEGRATION TESTS\n');

  // Test 9: Verify playbook → variants relationship
  totalTests++;
  if (playbookWithVariants && variants.length > 0) {
    const allVariantsBelongToPlaybook = variants.every(
      v => v.playbookId === playbookWithVariants.id
    );

    if (allVariantsBelongToPlaybook) {
      console.log('✅ Test 9: Playbook-Variant relationship valid');
      passedTests++;
    } else {
      console.log('❌ Test 9: Playbook-Variant relationship broken');
    }
  } else {
    console.log('⏭️  Test 9: Skipped (missing data)');
  }

  // Test 10: Verify experiment → variants relationship
  totalTests++;
  if (experiments.length > 0 && experiments[0].variants.length > 0) {
    const experimentVariants = experiments[0].variants;
    const allVariantsValid = experimentVariants.every(ev => ev.variant);

    if (allVariantsValid) {
      console.log('✅ Test 10: Experiment-Variant relationship valid');
      passedTests++;
    } else {
      console.log('❌ Test 10: Experiment-Variant relationship broken');
    }
  } else {
    console.log('⏭️  Test 10: Skipped (no experiment variants)');
  }

  console.log('');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('═══════════════════════════════════════');
  console.log('📊 EPIC 6 TEST SUMMARY\n');

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Epic 6 Status
  console.log('╔════════════════════════════════════════╗');
  console.log('║  EPIC 6: PLAYBOOK SYSTEM               ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Story 6.1: ${playbooks.length > 0 ? '✅ Working' : '❌ Failed'}            ║`);
  console.log(`║  Story 6.2: ${variants.length > 0 ? '✅ Working' : '❌ Failed'}            ║`);
  console.log(`║  Story 6.3: ${experiments.length > 0 ? '✅ Working' : '❌ Failed'}            ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Overall: ${passedTests === totalTests ? '✅ ALL PASS' : passedTests >= totalTests * 0.8 ? '⚠️  MOSTLY PASS' : '❌ FAILED'}              ║`);
  console.log('╚════════════════════════════════════════╝');

  console.log('');

  // Detailed Statistics
  console.log('📈 Detailed Statistics:\n');
  console.log(`Playbooks: ${playbooks.length}`);
  console.log(`Variants: ${variants.length}`);
  console.log(`Experiments: ${experiments.length}`);
  console.log(`Experiment Variants: ${experiments.reduce((sum, e) => sum + e.variants.length, 0)}`);

  console.log('');

  if (passedTests === totalTests) {
    console.log('🎉 Epic 6 is fully functional and ready for production!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️  Epic 6 is mostly working but has some issues to address.');
  } else {
    console.log('❌ Epic 6 has significant issues that need attention.');
  }
}

testEpic6EndToEnd()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Test Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
