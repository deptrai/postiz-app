const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDataForCorrectOrg() {
  console.log('🔧 Creating sample data for FRONTEND USER organization...\n');

  // Frontend user's organization
  const frontendOrgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';
  
  const org = await prisma.organization.findUnique({
    where: { id: frontendOrgId }
  });

  if (!org) {
    console.log('❌ Frontend organization not found');
    return;
  }

  console.log(`✅ Using organization: ${org.name} (${org.id})\n`);

  // Get or create integration
  let integration = await prisma.integration.findFirst({
    where: { organizationId: frontendOrgId }
  });

  if (!integration) {
    console.log('Creating mock integration...');
    integration = await prisma.integration.create({
      data: {
        organizationId: frontendOrgId,
        name: 'Mock Facebook',
        providerIdentifier: 'facebook',
        type: 'social',
        token: 'mock-token-fb',
        profile: JSON.stringify({ name: 'Test Page' }),
        internalId: 'mock-fb-id',
        picture: '',
      },
    });
    console.log(`✅ Created integration: ${integration.name}\n`);
  } else {
    console.log(`✅ Using existing integration: ${integration.name}\n`);
  }

  // Create 5 sample posts
  const samplePosts = [
    {
      externalContentId: 'fb_post_1',
      contentType: 'post',
      caption: 'Just launched our new product! Check it out in the comments 🚀',
      hashtags: JSON.stringify(['#product', '#launch', '#tech', '#startup']),
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      reach: 15000,
      reactions: 800,
      comments: 120,
      shares: 45,
    },
    {
      externalContentId: 'fb_post_2',
      contentType: 'post',
      caption: 'Top 10 tips for growing your business. Tag someone who needs this! 💼',
      hashtags: JSON.stringify(['#business', '#growth', '#tips', '#entrepreneur']),
      publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      reach: 12000,
      reactions: 650,
      comments: 95,
      shares: 38,
    },
    {
      externalContentId: 'fb_post_3',
      contentType: 'post',
      caption: 'Exciting update! Comment below with your thoughts on this feature 💡',
      hashtags: JSON.stringify(['#update', '#feature', '#innovation', '#tech']),
      publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      reach: 18000,
      reactions: 950,
      comments: 140,
      shares: 52,
    },
    {
      externalContentId: 'fb_post_4',
      contentType: 'post',
      caption: 'Behind the scenes look at our process. Learn more about how we work!',
      hashtags: JSON.stringify(['#behindthescenes', '#process', '#team', '#work']),
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      reach: 10000,
      reactions: 520,
      comments: 78,
      shares: 30,
    },
    {
      externalContentId: 'fb_post_5',
      contentType: 'post',
      caption: 'Share this with someone who inspires you. Click link in bio for more stories! ✨',
      hashtags: JSON.stringify(['#inspiration', '#motivation', '#success', '#stories']),
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      reach: 11000,
      reactions: 580,
      comments: 85,
      shares: 33,
    },
  ];

  for (const post of samplePosts) {
    // Check if already exists
    const existing = await prisma.analyticsContent.findFirst({
      where: {
        organizationId: frontendOrgId,
        externalContentId: post.externalContentId
      }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${post.externalContentId} (already exists)`);
      continue;
    }

    // Create content
    await prisma.analyticsContent.create({
      data: {
        organizationId: frontendOrgId,
        integrationId: integration.id,
        externalContentId: post.externalContentId,
        contentType: post.contentType,
        caption: post.caption,
        hashtags: post.hashtags,
        publishedAt: post.publishedAt,
      },
    });

    // Create metrics
    await prisma.analyticsDailyMetric.create({
      data: {
        organizationId: frontendOrgId,
        integrationId: integration.id,
        externalContentId: post.externalContentId,
        date: new Date(post.publishedAt.toISOString().split('T')[0]),
        impressions: Math.round(post.reach * 1.25),
        reach: post.reach,
        reactions: post.reactions,
        comments: post.comments,
        shares: post.shares,
        videoViews: null,
      },
    });

    console.log(`✅ Created: ${post.caption.substring(0, 50)}...`);
  }

  console.log('\n🎉 Sample data created for frontend user organization!');
  console.log(`\n📊 Summary:`);
  console.log(`- Organization: ${org.name} (${org.id})`);
  console.log(`- Integration: ${integration.name}`);
  console.log(`- Posts created: ${samplePosts.length}`);
  console.log(`\n🧪 Now refresh frontend and click "Generate Playbooks"`);
}

createDataForCorrectOrg()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
