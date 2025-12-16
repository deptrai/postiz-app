require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrg() {
  // Find user
  const user = await prisma.user.findFirst({
    where: { 
      email: 'test@analytics.com',
      providerName: 'LOCAL'
    },
    include: {
      organizations: {
        include: {
          organization: {
            include: {
              integrations: {
                where: { disabled: null },
                select: {
                  id: true,
                  name: true,
                  providerIdentifier: true,
                  type: true,
                }
              },
              playbooks: {
                include: {
                  variants: true,
                }
              },
              experiments: true,
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User:', user.email);
  console.log('');

  user.organizations.forEach(userOrg => {
    const org = userOrg.organization;
    console.log(`📊 Organization: ${org.name} (${org.id})`);
    console.log(`Integrations: ${org.integrations.length}`);
    org.integrations.forEach(int => {
      console.log(`  - ${int.name} (${int.providerIdentifier})`);
    });
    console.log(`Playbooks: ${org.playbooks.length}`);
    org.playbooks.forEach(pb => {
      console.log(`  - ${pb.name} (${pb.variants.length} variants)`);
    });
    console.log(`Experiments: ${org.experiments.length}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkOrg()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
