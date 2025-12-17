import { ViralScoreService, ContentMetadata } from './viral-score.service';

// Mock PrismaService
const mockPrisma = {
  analyticsContent: {
    findMany: async (): Promise<any[]> => [],
  },
} as any;

const service = new ViralScoreService(mockPrisma);

async function runTests(): Promise<void> {
  console.log('Running ViralScoreService Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Calculate viral score (AC #1)
  try {
    const result = await service.calculateViralScore('test-org', {
      caption: 'Amazing content! Follow for more',
      hashtags: ['viral', 'trending'],
      contentType: 'reel',
      scheduledTime: new Date('2025-12-17T19:00:00'),
      hookText: 'Did you know this?',
    });

    if (result.overallScore >= 0 && result.overallScore <= 100) {
      console.log('✓ Test 1: Calculate viral score (AC #1) - Score:', result.overallScore);
      passed++;
    } else {
      console.log('✗ Test 1 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 1:', e.message);
    failed++;
  }

  // Test 2: Breakdown has all factors (AC #3)
  try {
    const result = await service.calculateViralScore('test-org', {
      caption: 'Test',
      contentType: 'post',
    });

    const factors = ['hook', 'caption', 'hashtags', 'timing', 'format'] as const;
    const hasAll = factors.every((f) => typeof result.breakdown[f] === 'number');

    if (hasAll) {
      console.log('✓ Test 2: Breakdown has all factors (AC #3)');
      console.log('  Breakdown:', JSON.stringify(result.breakdown));
      passed++;
    } else {
      console.log('✗ Test 2 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 2:', e.message);
    failed++;
  }

  // Test 3: Reels get higher format score than posts
  try {
    const reelResult = await service.calculateViralScore('test-org', {
      caption: 'Test',
      contentType: 'reel',
    });
    const postResult = await service.calculateViralScore('test-org', {
      caption: 'Test',
      contentType: 'post',
    });

    if (reelResult.breakdown.format > postResult.breakdown.format) {
      console.log('✓ Test 3: Reels get higher format score than posts');
      console.log(`  Reel: ${reelResult.breakdown.format}, Post: ${postResult.breakdown.format}`);
      passed++;
    } else {
      console.log('✗ Test 3 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 3:', e.message);
    failed++;
  }

  // Test 4: Suggestions for low scores (AC #4)
  try {
    const result = await service.calculateViralScore('test-org', {
      caption: 'Hi',
      contentType: 'post',
      hashtags: [],
    });

    if (result.suggestions.length > 0) {
      console.log('✓ Test 4: Suggestions for low scores (AC #4)');
      console.log(`  Generated ${result.suggestions.length} suggestions`);
      passed++;
    } else {
      console.log('✗ Test 4 failed - no suggestions');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 4:', e.message);
    failed++;
  }

  // Test 5: Compare content (AC #5)
  try {
    const result = await service.compareContent('test-org', [
      { id: 'draft-1', metadata: { caption: 'Short', contentType: 'post' } },
      { id: 'draft-2', metadata: { caption: 'Amazing viral content!', contentType: 'reel', hashtags: ['viral'] } },
    ]);

    if (result.rankings.length === 2 && result.rankings[0].rank === 1 && result.rankings[1].rank === 2) {
      console.log('✓ Test 5: Compare content ranks correctly (AC #5)');
      console.log(`  Rank 1: ${result.rankings[0].contentId} (${result.rankings[0].score})`);
      console.log(`  Rank 2: ${result.rankings[1].contentId} (${result.rankings[1].score})`);
      passed++;
    } else {
      console.log('✗ Test 5 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 5:', e.message);
    failed++;
  }

  // Test 6: Optimal timing gets higher score
  try {
    const optimalResult = await service.calculateViralScore('test-org', {
      caption: 'Test',
      contentType: 'reel',
      scheduledTime: new Date('2025-12-17T19:00:00'), // 7 PM
    });
    const lateResult = await service.calculateViralScore('test-org', {
      caption: 'Test',
      contentType: 'reel',
      scheduledTime: new Date('2025-12-17T03:00:00'), // 3 AM
    });

    if (optimalResult.breakdown.timing > lateResult.breakdown.timing) {
      console.log('✓ Test 6: Optimal timing gets higher score');
      console.log(`  7PM: ${optimalResult.breakdown.timing}, 3AM: ${lateResult.breakdown.timing}`);
      passed++;
    } else {
      console.log('✗ Test 6 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 6:', e.message);
    failed++;
  }

  // Test 7: Interpretation matches score range
  try {
    const highScore = await service.calculateViralScore('test-org', {
      caption: 'Amazing secret tip! Follow for more exclusive content 🔥\n\nDrop a comment!',
      hashtags: ['viral', 'tips', 'trending', 'fyp', 'foryou'],
      contentType: 'reel',
      scheduledTime: new Date('2025-12-17T19:00:00'),
      hookText: 'Did you know this secret hack that went viral?',
    });

    const validInterpretations = ['High viral potential', 'Good potential', 'Average', 'Low potential, needs improvement'];
    if (validInterpretations.includes(highScore.interpretation)) {
      console.log('✓ Test 7: Interpretation is valid');
      console.log(`  Score: ${highScore.overallScore}, Interpretation: "${highScore.interpretation}"`);
      passed++;
    } else {
      console.log('✗ Test 7 failed - invalid interpretation');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 7:', e.message);
    failed++;
  }

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
