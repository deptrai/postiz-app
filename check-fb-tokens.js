const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFBTokens() {
  console.log('🔐 Checking Facebook Access Tokens\n');

  const orgId = '49470bf8-706f-49d8-9ddc-2f0eb727aef9';

  const fbIntegrations = await prisma.integration.findMany({
    where: {
      organizationId: orgId,
      providerIdentifier: 'facebook',
    },
  });

  console.log(`📱 FB Integrations: ${fbIntegrations.length}\n`);

  for (const int of fbIntegrations) {
    console.log(`${int.name}`);
    console.log(`  ID: ${int.id}`);
    console.log(`  Page ID: ${int.internalId}`);
    console.log(`  Has Token: ${int.token ? '✅ Yes' : '❌ No'}`);
    
    if (int.token) {
      console.log(`  Token Length: ${int.token.length} chars`);
      console.log(`  Token Preview: ${int.token.substring(0, 20)}...`);
      
      // Test token by calling FB Graph API
      try {
        const testUrl = `https://graph.facebook.com/v20.0/me?access_token=${int.token}`;
        const response = await fetch(testUrl);
        const data = await response.json();
        
        if (response.ok) {
          console.log(`  ✅ Token VALID`);
          console.log(`     Name: ${data.name || 'N/A'}`);
          console.log(`     ID: ${data.id || 'N/A'}`);
        } else {
          console.log(`  ❌ Token INVALID`);
          console.log(`     Error: ${data.error?.message || JSON.stringify(data)}`);
        }
      } catch (error) {
        console.log(`  ❌ Token test failed: ${error.message}`);
      }
    }
    console.log('');
  }
}

checkFBTokens()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
