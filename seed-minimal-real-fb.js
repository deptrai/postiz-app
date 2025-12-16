require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedMinimalRealFB() {
  console.log('🌱 Seeding minimal data with REAL Facebook integrations\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.analyticsTrackedIntegration.deleteMany({});
  await prisma.integration.deleteMany({});
  await prisma.userOrganization.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleaned\n');

  // 1. Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'luis@test.com',
      password: passwordHash,
      isSuperAdmin: false,
      providerName: 'LOCAL',
      timezone: 0,
    },
  });

  console.log(`✅ User created: ${user.email} (ID: ${user.id})\n`);

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Analytics Test Co',
      users: {
        create: {
          userId: user.id,
          role: 'ADMIN',
          disabled: false,
        },
      },
    },
  });

  console.log(`✅ Organization created: ${org.name} (ID: ${org.id})\n`);

  // 3. Create 3 REAL Facebook Integrations with validated tokens
  const fbIntegrations = [
    {
      name: 'XB Global Việt Nam',
      internalId: '118126874662490',
      token: 'EAAIcfyeKDzkBQDhBrfcxs8b6IvQnZCR0Db1ZC0pIAF8tZB5QlJjm3xnuwU6GwukR4BEPKUNBvSQNZAsGD5yFNCTH1IjIvCbGdEzZBk2hk6lk3xCPvJitkb04Y3rXWiggSdD8wOt4YZCNCZC1ZCJ8E7oO5LE6ZAl8WN7ZBHZB9ApcOJ3F7eFPXLZC2eCWg0lnczgCZCd7wKnQZDZD',
    },
    {
      name: 'Luis Phan',
      internalId: '3076044449234145',
      token: 'EAAYpZBtnbCXUBQJHYAZCPYu0rWPZAiamZBJ5pJOpsBi34snuH9i6I1GpVx24EG2Q4dGEG8f4EvXBBhIUPxzKiZAPiGmBQZAe4g0xXRGDkl68ezF6NSdNgDwRSCONrqUl5zQFVpG4ZABX7ogZCJqYN06Uu1y1wBACQWn7hBj3FRLZA7QZDZD',
    },
    {
      name: 'Lồng Đèn 3D Giá Tận Kho',
      internalId: '545110472014991',
      token: 'EAAIcfyeKDzkBQHpSAuZCBrOTYY9tqS62OFbDOwZBaBZAl4kKQl5iWmHkrYfKHdkiRh4AaZBEk7xvEXGRAMQSAe4bSNJQ0yW81Gi9bZCZClMmWmQXJXqgJAQ4SXOwsWzk8ZBJZCyZBP25llJVl8MgNsgvmCuKCIYZCT5jIPWL4CqYUZAf0TG5QZBPg0Rjm9ZCpGvHQZDZD',
    },
  ];

  const createdIntegrations = [];

  for (const fbData of fbIntegrations) {
    const integration = await prisma.integration.create({
      data: {
        organizationId: org.id,
        name: fbData.name,
        internalId: fbData.internalId,
        providerIdentifier: 'facebook',
        type: 'social',
        token: fbData.token,
        refreshToken: '',
        picture: '',
        disabled: false,
      },
    });

    createdIntegrations.push(integration);
    console.log(`✅ FB Integration: ${integration.name}`);
    console.log(`   ID: ${integration.id}`);
    console.log(`   Page ID: ${integration.internalId}\n`);
  }

  // 4. Track integrations for analytics
  for (const integration of createdIntegrations) {
    await prisma.analyticsTrackedIntegration.create({
      data: {
        organizationId: org.id,
        integrationId: integration.id,
      },
    });
  }

  console.log(`✅ All integrations tracked for analytics\n`);

  console.log('═══════════════════════════════════════');
  console.log('🎉 Seed Complete!\n');
  console.log(`Organization: ${org.name}`);
  console.log(`ID: ${org.id}`);
  console.log(`User: ${user.email}`);
  console.log(`Password: password123`);
  console.log(`\nFB Integrations: ${createdIntegrations.length} (all tracked)\n`);
  console.log('📋 Next Steps:');
  console.log('1. Login to get JWT token');
  console.log('2. Call POST /analytics/manual-sync');
  console.log('3. Verify REAL FB posts in database');
  console.log('4. Regenerate playbooks from real data');
}

seedMinimalRealFB()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
