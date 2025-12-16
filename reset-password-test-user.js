require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update test@analytics.com password
  const user = await prisma.user.update({
    where: { 
      email_providerName: {
        email: 'test@analytics.com',
        providerName: 'LOCAL'
      }
    },
    data: { password: hashedPassword },
  });

  console.log('✅ Password reset successful for test@analytics.com');
  console.log('Email:', user.email);
  console.log('New password: password123');

  await prisma.$disconnect();
}

resetPassword()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
