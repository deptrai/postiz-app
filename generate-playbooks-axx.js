require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generatePlaybooks() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320'; // org "axx"
  
  console.log('📚 Generating Playbooks for org "axx"\n');

  // Get analytics content
  const content = await prisma.analyticsContent.findMany({
    where: { organizationId: orgId },
    include: { integration: true },
  });

  console.log(`Found ${content.length} posts`);

  if (content.length === 0) {
    console.log('No content to generate playbooks from');
    return;
  }

  // Create a playbook based on real data
  const playbook = await prisma.playbook.create({
    data: {
      organizationId: orgId,
      name: 'Test Post Pattern',
      format: 'post',
      recipe: {
        hooks: ['test hook'],
        ctas: ['learn more'],
        hashtags: ['test', 'facebook'],
        times: ['morning'],
      },
      evidence: {
        medianReach: 0,
        engagementRate: 0,
        consistency: 0,
      },
      consistencyScore: 0.0,
    },
  });

  console.log(`\n✅ Created playbook: ${playbook.name}`);
  console.log(`   ID: ${playbook.id}`);

  // Link the source content
  await prisma.playbookSourceContent.create({
    data: {
      playbookId: playbook.id,
      contentId: content[0].id,
    },
  });

  console.log(`   Linked to content: ${content[0].externalContentId}`);

  // Create a variant based on the content
  const variant = await prisma.playbookVariant.create({
    data: {
      playbookId: playbook.id,
      name: 'Original Pattern',
      type: 'hook',
      recipe: {
        hook: content[0].caption || 'Test caption',
        cta: 'learn more',
        hashtags: ['test', 'facebook'],
      },
      description: 'Variant generated from real FB post',
    },
  });

  console.log(`   Created variant: ${variant.name}`);

  // Check final state
  const playbookCount = await prisma.playbook.count({
    where: { organizationId: orgId },
  });

  const variantCount = await prisma.playbookVariant.count({
    where: { 
      playbook: { organizationId: orgId },
    },
  });

  console.log(`\n📊 Final counts:`);
  console.log(`   Playbooks: ${playbookCount}`);
  console.log(`   Variants: ${variantCount}`);

  await prisma.$disconnect();
}

generatePlaybooks()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
