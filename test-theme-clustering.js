const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const organizationId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';

async function testThemeClustering() {
  try {
    console.log('🧪 Testing Theme Clustering...\n');

    // Check if content exists
    const content = await prisma.analyticsContent.findMany({
      where: { organizationId },
      select: {
        id: true,
        caption: true,
        hashtags: true,
      },
      take: 5,
    });

    console.log(`📊 Found ${content.length} content items for clustering`);
    
    content.forEach(c => {
      console.log(`\nContent: ${c.id.substring(0, 8)}...`);
      console.log(`Caption: ${c.caption?.substring(0, 50)}...`);
      console.log(`Hashtags: ${JSON.stringify(c.hashtags)}`);
    });

    // Check existing themes
    const themes = await prisma.theme.findMany({
      where: { organizationId },
      include: {
        content: true,
      },
    });

    console.log(`\n\n📚 Existing themes: ${themes.length}`);
    themes.forEach(t => {
      console.log(`\nTheme: ${t.name}`);
      console.log(`Keywords: ${JSON.stringify(t.keywords)}`);
      console.log(`Content count: ${t.content.length}`);
      console.log(`Avg reach: ${t.avgReach}`);
      console.log(`Avg engagement: ${t.avgEngagement}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testThemeClustering();
