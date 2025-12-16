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
          resolve({ error: { message: data } });
        }
      });
    }).on('error', reject);
  });
}

async function syncAllContent() {
  const orgId = 'bae5f136-2a96-4e7c-9a80-eff62c36a320';
  
  console.log('🔄 Syncing All Content Types (30 days) for org "axx"\n');

  const tracked = await prisma.analyticsTrackedIntegration.findMany({
    where: { organizationId: orgId },
    include: { integration: true },
  });

  console.log(`📱 Found ${tracked.length} tracked integrations\n`);
  let totalPosts = 0;
  let totalMetrics = 0;

  for (const item of tracked) {
    const integration = item.integration;
    console.log(`🔍 Processing: ${integration.name}`);
    
    // 30 days
    const since = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const until = Math.floor(Date.now() / 1000);
    
    // Use /posts endpoint with non-deprecated fields
    const url = `https://graph.facebook.com/v20.0/${integration.internalId}/posts?fields=id,message,created_time,reactions.summary(total_count),comments.summary(total_count),shares&since=${since}&until=${until}&limit=100&access_token=${integration.token}`;
    
    try {
      const data = await fetch(url);
      
      if (data.error) {
        console.log(`   ❌ Error: ${data.error.message}`);
        continue;
      }
      
      const items = data.data || [];
      console.log(`   ✅ Found ${items.length} items`);
      
      for (const item of items) {
        // Determine content type based on FB type field
        let contentType = 'post'; // default
        
        // FB API returns type: link, status, photo, video, etc.
        // For now, classify all as 'post' since we can't reliably detect reels without attachments
        // Reels would need separate /reels endpoint
        if (item.type) {
          contentType = 'post'; // All feed items as posts
        }
        
        // Check if exists
        const existing = await prisma.analyticsContent.findFirst({
          where: {
            organizationId: orgId,
            integrationId: integration.id,
            externalContentId: item.id,
            deletedAt: null,
          },
        });

        let contentId;
        if (existing) {
          await prisma.analyticsContent.update({
            where: { id: existing.id },
            data: {
              caption: item.message || '',
              contentType: contentType,
              publishedAt: new Date(item.created_time),
            },
          });
          contentId = existing.id;
        } else {
          const created = await prisma.analyticsContent.create({
            data: {
              organizationId: orgId,
              integrationId: integration.id,
              externalContentId: item.id,
              contentType: contentType,
              caption: item.message || '',
              publishedAt: new Date(item.created_time),
            },
          });
          contentId = created.id;
          totalPosts++;
        }

        // Store metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const metrics = [];
        
        if (item.reactions && item.reactions.summary) {
          metrics.push({ type: 'likes', value: item.reactions.summary.total_count || 0 });
        }
        
        if (item.comments && item.comments.summary) {
          metrics.push({ type: 'comments', value: item.comments.summary.total_count || 0 });
        }
        
        if (item.shares) {
          metrics.push({ type: 'shares', value: item.shares.count || 0 });
        }
        
        for (const metric of metrics) {
          await prisma.analyticsMetric.upsert({
            where: {
              organizationId_integrationId_externalContentId_date_metricType: {
                organizationId: orgId,
                integrationId: integration.id,
                externalContentId: item.id,
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
              externalContentId: item.id,
              date: today,
              metricType: metric.type,
              metricValue: metric.value,
            },
          });
          totalMetrics++;
        }
      }
      
      console.log(`   ✅ Stored ${items.length} items with metrics`);
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

  // Count by type
  const byType = await prisma.analyticsContent.groupBy({
    by: ['contentType'],
    where: { organizationId: orgId, deletedAt: null },
    _count: true,
  });

  console.log(`\n✅ Sync Complete!`);
  console.log(`Total new items: ${totalPosts}`);
  console.log(`Total metrics added: ${totalMetrics}`);
  console.log(`\n📊 Content Summary:`);
  console.log(`Total: ${contentCount}`);
  byType.forEach(t => console.log(`  ${t.contentType}: ${t._count}`));
  console.log(`📈 Total metrics: ${metricsCount}`);

  await prisma.$disconnect();
}

syncAllContent()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
