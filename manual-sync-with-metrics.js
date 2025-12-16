require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// Simple fetch using https
async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        json: async () => JSON.parse(data),
        ok: res.statusCode === 200 
      }));
    }).on('error', reject);
  });
}

async function manualSync() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';
  
  console.log('🔄 Manual Sync with Metrics for org "axx"\n');

  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: { organizationId: orgId },
    include: { integration: true },
  });

  console.log(`📱 Found ${tracked.length} tracked integrations\n`);
  let totalPosts = 0;
  let totalMetrics = 0;

  for (const item of tracked) {
    const integration = item.integration;
    console.log(`🔍 Fetching data for: ${integration.name}`);
    
    const since = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const until = Math.floor(Date.now() / 1000);
    
    const url = `https://graph.facebook.com/v20.0/${integration.internalId}/posts?fields=id,message,created_time,reactions.summary(true),comments.summary(true),shares&since=${since}&until=${until}&access_token=${integration.token}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.log(`   ❌ Error: ${data.error.message}`);
        continue;
      }
      
      const posts = data.data || [];
      console.log(`   ✅ Found ${posts.length} posts`);
      
      for (const post of posts) {
        const existing = await prisma.analyticsContent.findFirst({
          where: {
            organizationId: orgId,
            integrationId: integration.id,
            externalContentId: post.id,
            deletedAt: null,
          },
        });

        let contentId;
        if (existing) {
          await prisma.analyticsContent.update({
            where: { id: existing.id },
            data: {
              caption: post.message || '',
              publishedAt: new Date(post.created_time),
            },
          });
          contentId = existing.id;
        } else {
          const created = await prisma.analyticsContent.create({
            data: {
              organizationId: orgId,
              integrationId: integration.id,
              externalContentId: post.id,
              contentType: 'post',
              caption: post.message || '',
              publishedAt: new Date(post.created_time),
            },
          });
          contentId = created.id;
          totalPosts++;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day
        const metrics = [];
        
        if (post.reactions && post.reactions.summary) {
          metrics.push({ type: 'likes', value: post.reactions.summary.total_count || 0 });
        }
        
        if (post.comments && post.comments.summary) {
          metrics.push({ type: 'comments', value: post.comments.summary.total_count || 0 });
        }
        
        if (post.shares) {
          metrics.push({ type: 'shares', value: post.shares.count || 0 });
        }
        
        for (const metric of metrics) {
          await prisma.analyticsMetric.upsert({
            where: {
              organizationId_integrationId_externalContentId_date_metricType: {
                organizationId: orgId,
                integrationId: integration.id,
                externalContentId: post.id,
                date: today,
                metricType: metric.type,
              },
            },
            update: {
              metricValue: metric.value,
            },
            create: {
              organizationId: orgId,
              integrationId: integration.id,
              contentId: contentId,
              externalContentId: post.id,
              date: today,
              metricType: metric.type,
              metricValue: metric.value,
            },
          });
          totalMetrics++;
        }
        
        if (metrics.length > 0) {
          console.log(`      - Stored ${metrics.length} metrics for: ${post.id}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  const contentCount = await prisma.analyticsContent.count({
    where: { organizationId: orgId, deletedAt: null },
  });

  const metricsCount = await prisma.analyticsMetric.count({
    where: { organizationId: orgId },
  });

  console.log(`\n✅ Sync Complete!`);
  console.log(`Total posts processed: ${totalPosts}`);
  console.log(`Total metrics added: ${totalMetrics}`);
  console.log(`📊 Analytics Content in DB: ${contentCount} posts`);
  console.log(`📈 Analytics Metrics in DB: ${metricsCount} metrics`);

  await prisma.$disconnect();
}

manualSync()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
