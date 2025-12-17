const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserOrgs() {
  const currentUserId = '1c92bbe6-1ddc-4bdd-843d-c880a45bc6b8'; // test@postiz.local

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  console.log('👤 Current User:');
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // Get all organizations
  const allOrgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`📊 All Organizations: ${allOrgs.length}\n`);
  allOrgs.forEach(org => {
    console.log(`   - ${org.name} (${org.id})`);
  });
  console.log('');

  // Get user's organization memberships
  const userOrgs = await prisma.userOrganization.findMany({
    where: {
      userId: currentUserId,
    },
    include: {
      organization: true,
    },
  });

  console.log(`🔗 User's Organization Memberships: ${userOrgs.length}\n`);
  
  if (userOrgs.length === 0) {
    console.log('❌ User has NO organization memberships!\n');
  } else {
    userOrgs.forEach(membership => {
      console.log(`   - ${membership.organization.name}`);
      console.log(`     Org ID: ${membership.organizationId}`);
      console.log(`     Role: ${membership.role || 'N/A'}`);
      console.log('');
    });
  }

  // Check which orgs have Facebook integrations
  console.log('📱 Organizations with Facebook Pages:\n');
  
  const orgsWithFB = await prisma.organization.findMany({
    where: {
      integrations: {
        some: {
          providerIdentifier: 'facebook',
          deletedAt: null,
        },
      },
    },
    include: {
      integrations: {
        where: {
          providerIdentifier: 'facebook',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  orgsWithFB.forEach(org => {
    const isMember = userOrgs.some(m => m.organizationId === org.id);
    console.log(`${isMember ? '✅' : '❌'} ${org.name}`);
    console.log(`   User has access: ${isMember ? 'YES' : 'NO'}`);
    console.log(`   Facebook pages: ${org.integrations.length}`);
    org.integrations.forEach(int => {
      console.log(`      - ${int.name}`);
    });
    console.log('');
  });

  // Solution
  console.log('═══════════════════════════════════════\n');
  console.log('💡 SOLUTION:\n');
  
  const fbOrgs = orgsWithFB.filter(org => !userOrgs.some(m => m.organizationId === org.id));
  
  if (fbOrgs.length > 0) {
    console.log(`User needs to be added to these organizations:`);
    fbOrgs.forEach(org => {
      console.log(`   - ${org.name} (${org.id})`);
    });
    console.log('\nOptions:');
    console.log('1. Add user to these organizations');
    console.log('2. Create new user for these organizations');
    console.log('3. Copy Facebook integrations to current organization\n');
  } else {
    console.log('User already has access to all orgs with FB pages!');
  }
}

checkUserOrgs()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
