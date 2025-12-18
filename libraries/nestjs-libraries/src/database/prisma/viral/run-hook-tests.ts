import { HookAnalyzerService, HookMetadata } from './hook-analyzer.service';

// Mock PrismaService
const mockPrismaService = {} as any;

async function runTests() {
  const service = new HookAnalyzerService(mockPrismaService);
  let passed = 0;
  let failed = 0;

  console.log('Running HookAnalyzerService Tests...\n');

  // Test 1: Question hook
  try {
    const metadata1: HookMetadata = {
      hookText: 'Did you know this secret hack?',
      contentType: 'reel',
      hasMusic: true,
    };
    const result1 = await service.analyzeHook('org-123', metadata1);
    
    if (result1.openingType === 'question' && 
        result1.effectivenessScore > 0 && 
        result1.effectivenessScore <= 100) {
      console.log('✓ Test 1 PASSED: Question hook analyzed correctly');
      console.log(`  Opening type: ${result1.openingType}, Score: ${result1.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 1 FAILED: Question hook not analyzed correctly');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 1 FAILED:', String(e));
    failed++;
  }

  // Test 2: Statement hook
  try {
    const metadata2: HookMetadata = {
      hookText: 'This is the secret nobody tells you',
      contentType: 'video',
    };
    const result2 = await service.analyzeHook('org-123', metadata2);
    
    if (result2.openingType === 'statement') {
      console.log('✓ Test 2 PASSED: Statement hook analyzed correctly');
      console.log(`  Opening type: ${result2.openingType}, Score: ${result2.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 2 FAILED: Expected statement, got', result2.openingType);
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 2 FAILED:', String(e));
    failed++;
  }

  // Test 3: Curiosity hook
  try {
    const metadata3: HookMetadata = {
      hookText: 'Wait for it... you will be amazed',
      contentType: 'reel',
    };
    const result3 = await service.analyzeHook('org-123', metadata3);
    
    if (result3.openingType === 'curiosity') {
      console.log('✓ Test 3 PASSED: Curiosity hook analyzed correctly');
      console.log(`  Opening type: ${result3.openingType}, Score: ${result3.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 3 FAILED: Expected curiosity, got', result3.openingType);
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 3 FAILED:', String(e));
    failed++;
  }

  // Test 4: Action hook
  try {
    const metadata4: HookMetadata = {
      hookText: 'Watch this transformation happen now',
      contentType: 'reel',
    };
    const result4 = await service.analyzeHook('org-123', metadata4);
    
    if (result4.openingType === 'action') {
      console.log('✓ Test 4 PASSED: Action hook analyzed correctly');
      console.log(`  Opening type: ${result4.openingType}, Score: ${result4.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 4 FAILED: Expected action, got', result4.openingType);
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 4 FAILED:', String(e));
    failed++;
  }

  // Test 5: Problem hook
  try {
    const metadata5: HookMetadata = {
      hookText: 'Struggling with your morning routine?',
      contentType: 'video',
    };
    const result5 = await service.analyzeHook('org-123', metadata5);
    
    if (result5.openingType === 'problem') {
      console.log('✓ Test 5 PASSED: Problem hook analyzed correctly');
      console.log(`  Opening type: ${result5.openingType}, Score: ${result5.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 5 FAILED: Expected problem, got', result5.openingType);
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 5 FAILED:', String(e));
    failed++;
  }

  // Test 6: Unknown hook
  try {
    const metadata6: HookMetadata = {
      hookText: 'Hello world',
      contentType: 'post',
    };
    const result6 = await service.analyzeHook('org-123', metadata6);
    
    if (result6.openingType === 'unknown') {
      console.log('✓ Test 6 PASSED: Unknown pattern detected correctly');
      console.log(`  Opening type: ${result6.openingType}, Score: ${result6.effectivenessScore}`);
      passed++;
    } else {
      console.log('✗ Test 6 FAILED: Expected unknown, got', result6.openingType);
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 6 FAILED:', String(e));
    failed++;
  }

  // Test 7: Breakdown completeness
  try {
    const metadata7: HookMetadata = {
      hookText: 'Did you know this amazing secret?',
      contentType: 'reel',
      hasMusic: true,
      hasVoiceover: true,
      hasQuickCuts: true,
    };
    const result7 = await service.analyzeHook('org-123', metadata7);
    
    if (result7.breakdown.openingType !== undefined &&
        result7.breakdown.pacing !== undefined &&
        result7.breakdown.visualImpact !== undefined &&
        result7.breakdown.audioHook !== undefined) {
      console.log('✓ Test 7 PASSED: Breakdown includes all factors');
      console.log(`  Breakdown: openingType=${result7.breakdown.openingType}, pacing=${result7.breakdown.pacing}, visualImpact=${result7.breakdown.visualImpact}, audioHook=${result7.breakdown.audioHook}`);
      passed++;
    } else {
      console.log('✗ Test 7 FAILED: Breakdown incomplete');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 7 FAILED:', String(e));
    failed++;
  }

  // Test 8: Get hook patterns
  try {
    const patterns = await service.getHookPatterns();
    
    if (patterns.length > 0 && patterns[0].type && patterns[0].name) {
      console.log('✓ Test 8 PASSED: Hook patterns retrieved successfully');
      console.log(`  Found ${patterns.length} patterns`);
      passed++;
    } else {
      console.log('✗ Test 8 FAILED: Patterns not retrieved correctly');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 8 FAILED:', String(e));
    failed++;
  }

  // Test 9: Get patterns by type
  try {
    const patterns = await service.getHookPatterns(undefined, 'question');
    
    if (patterns.length > 0 && patterns.every(p => p.type === 'question')) {
      console.log('✓ Test 9 PASSED: Filtered patterns by type');
      console.log(`  Found ${patterns.length} question patterns`);
      passed++;
    } else {
      console.log('✗ Test 9 FAILED: Pattern filtering failed');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 9 FAILED:', String(e));
    failed++;
  }

  // Test 10: Compare hooks
  try {
    const hooks = [
      { id: 'hook1', metadata: { hookText: 'Did you know this secret?', contentType: 'reel' as const } },
      { id: 'hook2', metadata: { hookText: 'Hello world', contentType: 'post' as const } },
    ];
    const result = await service.compareHooks('org-123', hooks);
    
    if (result.rankings.length === 2 && 
        result.rankings[0].rank === 1 && 
        result.rankings[1].rank === 2) {
      console.log('✓ Test 10 PASSED: Hooks compared and ranked correctly');
      console.log(`  Rankings: #1 score=${result.rankings[0].score}, #2 score=${result.rankings[1].score}`);
      passed++;
    } else {
      console.log('✗ Test 10 FAILED: Comparison failed');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 10 FAILED:', String(e));
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${passed}/${passed + failed} passed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
  } else {
    console.log(`✗ ${failed} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(console.error);
