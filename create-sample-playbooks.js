require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePlaybooks() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';
  
  console.log('🎨 Creating Sample Playbooks with Realistic Metrics\n');

  // Delete existing playbooks first
  await prisma.playbook.deleteMany({
    where: { organizationId: orgId }
  });

  // Playbook 1: Product/Service Posts (Phim Cách Nhiệt)
  const playbook1 = await prisma.playbook.create({
    data: {
      organizationId: orgId,
      name: 'Product Service Posts',
      format: 'post',
      recipe: {
        hooks: [
          'Khách hỏi',
          'Trời nóng',
          'Hoàn thiện',
        ],
        hashtags: [
          'phimcachnhiet',
          'danche',
          'saigon',
        ],
        ctas: [
          'inbox',
          'liên hệ',
          'đặt lịch',
        ],
        times: ['morning', 'afternoon'],
      },
      evidence: {
        contentCount: 8,
        medianReach: 45,
        engagementRate: 0.08,
        consistency: 0.75,
      },
      consistencyScore: 75,
    },
  });

  console.log(`✅ Created Playbook: ${playbook1.name}`);

  // Create variants for Playbook 1
  const variant1_1 = await prisma.playbookVariant.create({
    data: {
      playbookId: playbook1.id,
      name: 'Question Hook',
      type: 'hook',
      recipe: {
        hook: 'Khách hỏi: "[question]"',
        structure: 'question + solution + cta',
      },
      description: 'Start with customer question to create relatability',
    },
  });

  const variant1_2 = await prisma.playbookVariant.create({
    data: {
      playbookId: playbook1.id,
      name: 'Weather Hook',
      type: 'hook',
      recipe: {
        hook: 'Trời [weather condition]',
        structure: 'weather context + product benefit + cta',
      },
      description: 'Use weather as context for product relevance',
    },
  });

  console.log(`   ✅ Created 2 variants`);

  // Playbook 2: Company/Trust Posts
  const playbook2 = await prisma.playbook.create({
    data: {
      organizationId: orgId,
      name: 'Trust Building Posts',
      format: 'post',
      recipe: {
        hooks: [
          'Công ty làm uy tín',
          'Khách tin giới thiệu',
        ],
        hashtags: [
          'uytín',
          'chấtlượng',
        ],
        ctas: [
          'tin tưởng',
          'giới thiệu',
        ],
        times: ['evening'],
      },
      evidence: {
        contentCount: 3,
        medianReach: 35,
        engagementRate: 0.05,
        consistency: 0.65,
      },
      consistencyScore: 65,
    },
  });

  console.log(`✅ Created Playbook: ${playbook2.name}`);

  // Create variant for Playbook 2
  const variant2_1 = await prisma.playbookVariant.create({
    data: {
      playbookId: playbook2.id,
      name: 'Social Proof',
      type: 'hook',
      recipe: {
        hook: 'Công ty làm uy tín khách tin giới thiệu khách',
        structure: 'credibility statement + proof + cta',
      },
      description: 'Leverage customer referrals for trust',
    },
  });

  console.log(`   ✅ Created 1 variant`);

  // Link some actual posts as source content
  const samplePosts = await prisma.analyticsContent.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    take: 5,
    orderBy: { publishedAt: 'desc' },
  });

  for (const post of samplePosts.slice(0, 3)) {
    await prisma.playbookSourceContent.create({
      data: {
        playbookId: playbook1.id,
        contentId: post.id,
      },
    });
  }

  for (const post of samplePosts.slice(3, 5)) {
    await prisma.playbookSourceContent.create({
      data: {
        playbookId: playbook2.id,
        contentId: post.id,
      },
    });
  }

  console.log(`   ✅ Linked source content\n`);

  const totalPlaybooks = await prisma.playbook.count({
    where: { organizationId: orgId, deletedAt: null }
  });

  const totalVariants = await prisma.playbookVariant.count({
    where: {
      playbook: { organizationId: orgId },
      deletedAt: null,
    }
  });

  console.log('📊 Summary:');
  console.log(`   Playbooks: ${totalPlaybooks}`);
  console.log(`   Variants: ${totalVariants}`);
  console.log(`   ✅ Sample playbooks created successfully!`);

  await prisma.$disconnect();
}

createSamplePlaybooks()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
