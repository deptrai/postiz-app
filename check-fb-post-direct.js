require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function checkPost() {
  const integration = await prisma.integration.findUnique({
    where: { id: 'cmj7ax2n20001jqxhn1bgrxhh' }
  });

  if (!integration) {
    console.log('Integration not found');
    return;
  }

  console.log('📱 Integration:', integration.name);
  console.log('🔑 Token:', integration.token.substring(0, 20) + '...');
  console.log('');

  const postId = '118126874662490_725524980597758';
  const url = `https://graph.facebook.com/v20.0/${postId}?fields=id,message,created_time,reactions.summary(true),comments.summary(true),shares&access_token=${integration.token}`;

  console.log('🔍 Fetching post data...\n');
  
  const data = await fetch(url);
  console.log('📊 Raw FB Response:');
  console.log(JSON.stringify(data, null, 2));

  await prisma.$disconnect();
}

checkPost()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
