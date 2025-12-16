import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating sample analytics data for Story 6.1 testing...');

  // Get first organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('❌ No organization found. Please create an organization first.');
    return;
  }

  console.log(`✅ Using organization: ${org.name} (${org.id})`);

  // Get first integration for this org, or create a mock one
  let integration = await prisma.integration.findFirst({
    where: { organizationId: org.id },
  });

  if (!integration) {
    console.log('⚠️ No integration found. Creating mock integration...');
    integration = await prisma.integration.create({
      data: {
        organizationId: org.id,
        name: 'Mock Social Platform',
        providerIdentifier: 'mock-social',
        type: 'social',
        token: 'mock-token',
        profile: JSON.stringify({ name: 'Mock Profile' }),
        internalId: 'mock-internal-id',
        picture: '',
      },
    });
    console.log(`✅ Created mock integration: ${integration.name}`);
  } else {
    console.log(`✅ Using integration: ${integration.name} (${integration.id})`);
  }

  // Create sample posts with good performance
  const samplePosts = [
    {
      externalContentId: 'ext_post_1',
      contentType: 'post',
      caption: 'Check out this amazing product launch! Learn more in the comments below.',
      hashtags: JSON.stringify(['#tech', '#startup', '#innovation', '#product']),
      publishedAt: dayjs().subtract(10, 'days').add(14, 'hours').toDate(),
      reach: 12000,
      reactions: 650,
      comments: 85,
      shares: 35,
    },
    {
      externalContentId: 'ext_post_2',
      contentType: 'post',
      caption: 'Top 5 tips for success in 2025. Tag a friend who needs this!',
      hashtags: JSON.stringify(['#business', '#success', '#tips', '#2025']),
      publishedAt: dayjs().subtract(9, 'days').add(10, 'hours').toDate(),
      reach: 8000,
      reactions: 450,
      comments: 60,
      shares: 25,
    },
    {
      externalContentId: 'ext_post_3',
      contentType: 'post',
      caption: 'New feature alert! Comment below with your thoughts on this update.',
      hashtags: JSON.stringify(['#tech', '#update', '#feature', '#launch']),
      publishedAt: dayjs().subtract(8, 'days').add(15, 'hours').toDate(),
      reach: 14000,
      reactions: 800,
      comments: 95,
      shares: 45,
    },
    {
      externalContentId: 'ext_post_4',
      contentType: 'post',
      caption: 'Share this with someone who inspires you. Click link in bio for more!',
      hashtags: JSON.stringify(['#inspiration', '#motivation', '#success']),
      publishedAt: dayjs().subtract(7, 'days').add(14, 'hours').toDate(),
      reach: 7500,
      reactions: 400,
      comments: 50,
      shares: 20,
    },
    {
      externalContentId: 'ext_post_5',
      contentType: 'post',
      caption: 'Behind the scenes of our latest project. Learn more about our process!',
      hashtags: JSON.stringify(['#behindthescenes', '#process', '#tech', '#innovation']),
      publishedAt: dayjs().subtract(6, 'days').add(10, 'hours').toDate(),
      reach: 9000,
      reactions: 500,
      comments: 65,
      shares: 28,
    },
  ];

  for (const post of samplePosts) {
    // Create content
    const content = await prisma.analyticsContent.create({
      data: {
        organizationId: org.id,
        integrationId: integration.id,
        externalContentId: post.externalContentId,
        contentType: post.contentType,
        caption: post.caption,
        hashtags: post.hashtags,
        publishedAt: post.publishedAt,
      },
    });

    // Create daily metrics
    await prisma.analyticsDailyMetric.create({
      data: {
        organizationId: org.id,
        integrationId: integration.id,
        externalContentId: post.externalContentId,
        date: dayjs(post.publishedAt).startOf('day').toDate(),
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

  console.log('\n🎉 Sample data created successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`- Organization: ${org.name}`);
  console.log(`- Integration: ${integration.name}`);
  console.log(`- Posts created: ${samplePosts.length}`);
  console.log(`- Metrics created: ${samplePosts.length}`);
  console.log(`\n🧪 Now test: Click "Generate Playbooks" button on frontend`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
