require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      providerName: true,
      organizations: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  console.log('👤 Users in database:\n');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Provider: ${u.providerName}`);
    console.log(`Organizations: ${u.organizations.map(o => o.organization.name).join(', ')}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkUsers()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
