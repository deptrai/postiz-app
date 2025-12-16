const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findRealFBData() {
  console.log('🔍 Finding organizations with real Facebook data...\n');

  // Get ALL organizations
  const allOrgs = await prisma.organization.findMany();
  console.log(`📊 Total Organizations: ${allOrgs.length}\n`);

  for (const org of allOrgs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Organization: ${org.name}`);
    console.log(`ID: ${org.id}`);
    console.log(`Created: ${org.createdAt.toISOString().split('T')[0]}`);
    
    // Check integrations
    const integrations = await prisma.integration.findMany({
      where: { organizationId: org.id },
    });

    console.log(`\n📱 Integrations: ${integrations.length}`);
    
    const fbIntegrations = integrations.filter(i => 
      i.providerIdentifier === 'facebook' || 
      i.providerIdentifier === 'facebook-page' ||
      i.type === 'facebook'
    );

    const mockIntegrations = integrations.filter(i => 
      i.name === 'Mock Social Platform' || 
      i.providerIdentifier === 'mock-social'
    );

    if (fbIntegrations.length > 0) {
      console.log(`   ✅ FACEBOOK: ${fbIntegrations.length} channels`);
      fbIntegrations.forEach(fb => {
        console.log(`      - ${fb.name} (${fb.providerIdentifier})`);
        console.log(`        ID: ${fb.id}`);
      });
    }

    if (mockIntegrations.length > 0) {
      console.log(`   🧪 Mock: ${mockIntegrations.length} channels`);
    }

    // Check analytics content
    const content = await prisma.analyticsContent.findMany({
      where: { organizationId: org.id },
      include: { integration: true },
    });

    console.log(`\n📄 Analytics Content: ${content.length} posts`);

    if (content.length > 0) {
      const fbContent = content.filter(c => 
        c.integration.providerIdentifier === 'facebook' ||
        c.integration.providerIdentifier === 'facebook-page'
      );
      const mockContent = content.filter(c => 
        c.integration.name === 'Mock Social Platform'
      );

      if (fbContent.length > 0) {
        console.log(`   ✅ FACEBOOK POSTS: ${fbContent.length}`);
        console.log(`      Date range: ${fbContent[0]?.publishedAt?.toISOString().split('T')[0]} to ${fbContent[fbContent.length-1]?.publishedAt?.toISOString().split('T')[0]}`);
      }

      if (mockContent.length > 0) {
        console.log(`   🧪 Mock posts: ${mockContent.length}`);
      }
    }

    // Check playbooks
    const playbooks = await prisma.playbook.findMany({
      where: { organizationId: org.id, deletedAt: null },
    });

    console.log(`\n📋 Playbooks: ${playbooks.length}`);
    if (playbooks.length > 0) {
      playbooks.forEach(pb => {
        console.log(`   - ${pb.name} (Score: ${pb.consistencyScore}%)`);
      });
    }

    // Check experiments
    const experiments = await prisma.experiment.findMany({
      where: { organizationId: org.id, deletedAt: null },
    });

    console.log(`\n🧪 Experiments: ${experiments.length}`);
    if (experiments.length > 0) {
      experiments.forEach(exp => {
        console.log(`   - ${exp.name} (Status: ${exp.status})`);
      });
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n💡 Summary:`);
  
  const orgsWithFB = [];
  for (const org of allOrgs) {
    const integrations = await prisma.integration.findMany({
      where: { 
        organizationId: org.id,
        OR: [
          { providerIdentifier: 'facebook' },
          { providerIdentifier: 'facebook-page' }
        ]
      },
    });

    if (integrations.length > 0) {
      const content = await prisma.analyticsContent.findMany({
        where: { 
          organizationId: org.id,
          integration: {
            OR: [
              { providerIdentifier: 'facebook' },
              { providerIdentifier: 'facebook-page' }
            ]
          }
        },
      });

      orgsWithFB.push({
        org: org.name,
        id: org.id,
        fbChannels: integrations.length,
        posts: content.length,
      });
    }
  }

  if (orgsWithFB.length > 0) {
    console.log(`\n✅ Organizations with Real Facebook Data:\n`);
    orgsWithFB.forEach(o => {
      console.log(`   ${o.org}`);
      console.log(`   - ID: ${o.id}`);
      console.log(`   - FB Channels: ${o.fbChannels}`);
      console.log(`   - Posts: ${o.posts}`);
      console.log('');
    });
  } else {
    console.log(`\n⚠️  No organizations with real Facebook data found!`);
    console.log(`   User said "đã kết nối 2 channel fb" but data not in DB yet.`);
    console.log(`   Possible reasons:`);
    console.log(`   1. Analytics sync not completed`);
    console.log(`   2. Different database/environment`);
    console.log(`   3. Need to trigger analytics fetch`);
  }
}

findRealFBData()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
