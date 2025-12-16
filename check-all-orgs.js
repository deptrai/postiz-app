require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllOrgs() {
  console.log('🔍 Checking all Organizations\n');

  // Get all organizations
  const orgs = await prisma.organization.findMany({
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(`📊 Found ${orgs.length} organizations:\n`);

  for (const org of orgs) {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`Organization: ${org.name}`);
    console.log(`ID: ${org.id}`);
    console.log(`Created: ${org.createdAt}`);
    
    // Get users
    console.log(`\nUsers (${org.users.length}):`);
    org.users.forEach(u => {
      console.log(`  - ${u.user.email} (${u.role})`);
    });
    
    // Get FB integrations
    const fbIntegrations = await prisma.integration.findMany({
      where: {
        organizationId: org.id,
        providerIdentifier: 'facebook',
      },
    });
    
    console.log(`\nFB Integrations (${fbIntegrations.length}):`);
    fbIntegrations.forEach(i => {
      console.log(`  - ${i.name}`);
      console.log(`    Page ID: ${i.internalId}`);
      console.log(`    Token: ${i.token.substring(0, 20)}...`);
      console.log(`    Updated: ${i.updatedAt || 'Never'}`);
    });
    
    // Get analytics content
    const content = await prisma.analyticsContent.count({
      where: { organizationId: org.id },
    });
    
    console.log(`\nAnalytics Content: ${content} posts`);
    
    // Get playbooks
    const playbooks = await prisma.playbook.count({
      where: { organizationId: org.id },
    });
    
    console.log(`Playbooks: ${playbooks}`);
    
    // Get experiments
    const experiments = await prisma.experiment.count({
      where: { organizationId: org.id },
    });
    
    console.log(`Experiments: ${experiments}`);
  }

  await prisma.$disconnect();
}

checkAllOrgs()
  .then(() => {
    console.log('\n\n✅ Check complete');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
