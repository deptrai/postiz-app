const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function testAutoTracking() {
  try {
    console.log('Testing Auto-Tracking Service...\n');

    // Get existing content
    const content = await prisma.analyticsContent.findMany({
      where: { organizationId },
      take: 5,
      select: {
        id: true,
        caption: true,
        contentType: true,
        hashtags: true,
        publishedAt: true,
      },
    });

    console.log(`Found ${content.length} content items to test`);
    
    // Get experiment variants
    const experiment = await prisma.experiment.findFirst({
      where: { organizationId },
      include: {
        variants: {
          include: {
            variant: {
              include: {
                playbook: true,
              },
            },
          },
        },
      },
    });

    if (!experiment) {
      console.log('No experiment found');
      return;
    }

    console.log(`\nExperiment: ${experiment.name}`);
    console.log(`Variants: ${experiment.variants.length}`);
    
    experiment.variants.forEach(v => {
      console.log(`- ${v.variant.name} (${v.variant.type})`);
      console.log(`  Playbook: ${v.variant.playbook.name}`);
      console.log(`  Recipe:`, JSON.stringify(v.variant.playbook.recipe, null, 2));
    });

    console.log('\n--- Testing Manual Matching ---');
    
    // For each content, check if it matches any variant
    for (const c of content) {
      console.log(`\nContent: ${c.id}`);
      console.log(`Format: ${c.contentType}`);
      console.log(`Caption: ${c.caption?.substring(0, 50)}...`);
      console.log(`Hashtags: ${JSON.stringify(c.hashtags)}`);
      
      // Check each variant
      for (const expVariant of experiment.variants) {
        const variant = expVariant.variant;
        const playbook = variant.playbook;
        
        let score = 0;
        let matches = [];
        
        // Format match
        if (playbook.format === c.contentType) {
          score += 0.2;
          matches.push('format');
        }
        
        // Hashtag match
        if (c.hashtags && playbook.recipe?.hashtags) {
          const contentHashtags = c.hashtags.map(h => h.toLowerCase().replace('#', ''));
          const playbookHashtags = playbook.recipe.hashtags.map(h => h.toLowerCase().replace('#', ''));
          
          const matchingHashtags = contentHashtags.filter(h => playbookHashtags.includes(h));
          if (matchingHashtags.length > 0) {
            score += 0.2;
            matches.push(`hashtags(${matchingHashtags.length})`);
          }
        }
        
        // Hook match
        if (c.caption && playbook.recipe?.hooks) {
          const caption = c.caption.toLowerCase();
          const matchingHooks = playbook.recipe.hooks.filter(hook => 
            caption.includes(hook.toLowerCase())
          );
          if (matchingHooks.length > 0) {
            score += 0.3;
            matches.push(`hooks(${matchingHooks.length})`);
          }
        }
        
        if (score > 0) {
          console.log(`  → Match: ${variant.name} (score: ${score.toFixed(2)}, ${matches.join(', ')})`);
        }
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testAutoTracking();
