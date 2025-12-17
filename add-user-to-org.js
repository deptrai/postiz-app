const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addUserToOrg() {
  const userId = '1c92bbe6-1ddc-4bdd-843d-c880a45bc6b8'; // test@postiz.local
  const targetOrgId = '1eae1e52-b1e7-422b-afa5-e54f640353a7'; // Analytics Test Co (3 FB pages)

  console.log('🔧 Adding user to organization with Facebook pages\n');

  // Check if membership already exists
  const existing = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: targetOrgId,
      },
    },
  });

  if (existing) {
    console.log('✅ User already has access to Analytics Test Co!');
    return;
  }

  // Add user to organization
  const membership = await prisma.userOrganization.create({
    data: {
      userId,
      organizationId: targetOrgId,
      role: 'SUPERADMIN',
      disabled: false,
    },
  });

  console.log('✅ Successfully added user to Analytics Test Co!');
  console.log(`   Membership ID: ${membership.id}`);
  console.log(`   Role: ${membership.role}\n`);

  console.log('📋 Next steps:');
  console.log('1. Reload the page: http://localhost:4200/monetization');
  console.log('2. Look for organization switcher (globe icon in header)');
  console.log('3. Hover over it and select "Analytics Test Co"');
  console.log('4. Verify Facebook pages and data appear!\n');
}

addUserToOrg()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
