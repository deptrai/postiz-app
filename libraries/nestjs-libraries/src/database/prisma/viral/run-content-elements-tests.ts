import { ContentElementsService } from './content-elements.service';

const service = new ContentElementsService();

async function runTests(): Promise<void> {
  console.log('Running ContentElementsService Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Analyze content with all elements
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'Check out this amazing tip! 🔥 Learn how to grow your audience fast. #viral #growth',
      hashtags: ['viral', 'growth', 'tips'],
      contentType: 'reel',
      videoLength: 25,
    });

    if (
      result.caption &&
      result.hashtags &&
      result.format &&
      result.cta &&
      result.overallScore >= 0 &&
      result.overallScore <= 100
    ) {
      console.log('✓ Test 1: Analyze content with all elements - Score:', result.overallScore);
      passed++;
    } else {
      console.log('✗ Test 1 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 1:', e.message);
    failed++;
  }

  // Test 2: Caption length categorization
  try {
    const shortResult = await service.analyzeContentElements('org-1', { caption: 'Short' });
    const mediumResult = await service.analyzeContentElements('org-1', {
      caption: 'This is a medium length caption that provides some value to the reader with useful information here.',
    });
    const longResult = await service.analyzeContentElements('org-1', {
      caption: 'This is a very long caption that goes on and on with lots of content. It provides extensive value to the reader and includes many details about the topic at hand. Long captions can be effective for educational content where you need to explain complex concepts in detail.',
    });

    if (
      shortResult.caption.lengthCategory === 'short' &&
      mediumResult.caption.lengthCategory === 'medium' &&
      longResult.caption.lengthCategory === 'long'
    ) {
      console.log('✓ Test 2: Caption length categorization');
      passed++;
    } else {
      console.log('✗ Test 2 failed:', shortResult.caption.lengthCategory, mediumResult.caption.lengthCategory, longResult.caption.lengthCategory);
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 2:', e.message);
    failed++;
  }

  // Test 3: Tone detection
  try {
    const casualResult = await service.analyzeContentElements('org-1', {
      caption: 'Hey guys! OMG this is so lit! Gonna share some vibes with yall today lol',
    });
    const educationalResult = await service.analyzeContentElements('org-1', {
      caption: 'Learn how to master this skill with our step-by-step tutorial. Did you know this fact? Here is a tip for you.',
    });

    if (casualResult.caption.tone === 'casual' && educationalResult.caption.tone === 'educational') {
      console.log('✓ Test 3: Tone detection');
      passed++;
    } else {
      console.log('✗ Test 3 failed:', casualResult.caption.tone, educationalResult.caption.tone);
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 3:', e.message);
    failed++;
  }

  // Test 4: Emoji counting
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: '🔥 Amazing content! 💪 Keep going! 🚀',
    });

    if (result.caption.emojiUsage.count === 3) {
      console.log('✓ Test 4: Emoji counting');
      passed++;
    } else {
      console.log('✗ Test 4 failed: Expected 3 emojis, got', result.caption.emojiUsage.count);
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 4:', e.message);
    failed++;
  }

  // Test 5: Hashtag optimal range
  try {
    const optimalResult = await service.analyzeContentElements('org-1', {
      caption: 'Content',
      hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
    });
    const tooFewResult = await service.analyzeContentElements('org-1', {
      caption: 'Content',
      hashtags: ['tag1', 'tag2'],
    });

    if (optimalResult.hashtags.optimal === true && tooFewResult.hashtags.optimal === false) {
      console.log('✓ Test 5: Hashtag optimal range');
      passed++;
    } else {
      console.log('✗ Test 5 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 5:', e.message);
    failed++;
  }

  // Test 6: Trending hashtag detection
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'Content',
      hashtags: ['viral', 'trending', 'fyp'],
    });

    const trendingCount = result.hashtags.hashtags.filter((h) => h.trending).length;
    if (trendingCount > 0) {
      console.log('✓ Test 6: Trending hashtag detection - Found', trendingCount, 'trending');
      passed++;
    } else {
      console.log('✗ Test 6 failed: No trending hashtags detected');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 6:', e.message);
    failed++;
  }

  // Test 7: Format analysis
  try {
    const reelResult = await service.analyzeContentElements('org-1', {
      caption: 'Content',
      contentType: 'reel',
      videoLength: 25,
    });

    if (
      reelResult.format.format === 'reel' &&
      reelResult.format.formatScore >= 80 &&
      reelResult.format.videoLength?.optimal === true
    ) {
      console.log('✓ Test 7: Format analysis - Reel score:', reelResult.format.formatScore);
      passed++;
    } else {
      console.log('✗ Test 7 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 7:', e.message);
    failed++;
  }

  // Test 8: CTA detection - engagement
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'What do you think? Comment below with your thoughts!',
    });

    if (result.cta.detected && result.cta.types.some((c) => c.type === 'engagement')) {
      console.log('✓ Test 8: CTA detection - engagement');
      passed++;
    } else {
      console.log('✗ Test 8 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 8:', e.message);
    failed++;
  }

  // Test 9: CTA detection - save
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'Save this for later! You will need it.',
    });

    if (result.cta.detected && result.cta.types.some((c) => c.type === 'save')) {
      console.log('✓ Test 9: CTA detection - save');
      passed++;
    } else {
      console.log('✗ Test 9 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 9:', e.message);
    failed++;
  }

  // Test 10: CTA detection - share
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'Tag a friend who needs to see this!',
    });

    if (result.cta.detected && result.cta.types.some((c) => c.type === 'share')) {
      console.log('✓ Test 10: CTA detection - share');
      passed++;
    } else {
      console.log('✗ Test 10 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 10:', e.message);
    failed++;
  }

  // Test 11: No CTA detection
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: 'Just a regular caption without any call to action.',
    });

    if (!result.cta.detected && result.cta.types.length === 0) {
      console.log('✓ Test 11: No CTA detection');
      passed++;
    } else {
      console.log('✗ Test 11 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 11:', e.message);
    failed++;
  }

  // Test 12: Successful patterns
  try {
    const result = await service.getSuccessfulPatterns('org-1');

    if (
      result.captionPatterns.length > 0 &&
      result.hashtagPatterns.length > 0 &&
      result.formatPatterns.length > 0 &&
      result.ctaPatterns.length > 0
    ) {
      console.log('✓ Test 12: Successful patterns');
      passed++;
    } else {
      console.log('✗ Test 12 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 12:', e.message);
    failed++;
  }

  // Test 13: Optimized vs basic content score comparison
  try {
    const optimizedResult = await service.analyzeContentElements('org-1', {
      caption: '🔥 Amazing tip! Learn how to grow your audience with these exclusive tricks. Save this for later! Comment your thoughts below! #viral #trending #fyp #growth #tips #content',
      hashtags: ['viral', 'trending', 'fyp', 'growth', 'tips', 'content', 'creator'],
      contentType: 'reel',
      videoLength: 25,
    });

    const basicResult = await service.analyzeContentElements('org-1', {
      caption: 'Hello',
      contentType: 'post',
    });

    if (optimizedResult.overallScore > basicResult.overallScore) {
      console.log('✓ Test 13: Optimized vs basic score comparison -', optimizedResult.overallScore, 'vs', basicResult.overallScore);
      passed++;
    } else {
      console.log('✗ Test 13 failed:', optimizedResult.overallScore, 'vs', basicResult.overallScore);
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 13:', e.message);
    failed++;
  }

  // Test 14: Strengths and improvements identification
  try {
    const result = await service.analyzeContentElements('org-1', {
      caption: '🔥 Great content with emojis! Save this for later!',
      hashtags: ['viral', 'trending', 'fyp', 'growth', 'tips', 'content', 'creator'],
      contentType: 'reel',
      videoLength: 25,
    });

    if (result.topStrengths.length > 0) {
      console.log('✓ Test 14: Strengths identification - Found', result.topStrengths.length, 'strengths');
      passed++;
    } else {
      console.log('✗ Test 14 failed');
      failed++;
    }
  } catch (e: any) {
    console.log('✗ Test 14:', e.message);
    failed++;
  }

  // Summary
  console.log('\n========================================');
  console.log(`Tests completed: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
