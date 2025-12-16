-- Sample Analytics Data for Story 6.1 Testing
-- Creates sample content and metrics for playbook generation

-- Get organization ID (assuming first org in database)
DO $$
DECLARE
    org_id TEXT;
    integration_id TEXT;
    content_id_1 TEXT;
    content_id_2 TEXT;
    content_id_3 TEXT;
    content_id_4 TEXT;
    content_id_5 TEXT;
BEGIN
    -- Get first organization
    SELECT id INTO org_id FROM "Organization" LIMIT 1;
    
    -- Get first integration
    SELECT id INTO integration_id FROM "Integration" WHERE "organizationId" = org_id LIMIT 1;
    
    -- If no integration, skip
    IF integration_id IS NULL THEN
        RAISE NOTICE 'No integration found, skipping data creation';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using org: % and integration: %', org_id, integration_id;
    
    -- Create sample content (posts with good performance)
    INSERT INTO "AnalyticsContent" (
        id, "organizationId", "integrationId", "externalContentId",
        "contentType", caption, hashtags, "publishedAt", "createdAt", "updatedAt"
    ) VALUES
    -- Post 1: High engagement
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_1',
     'post', 
     'Check out this amazing product launch! Learn more in the comments below.',
     '["#tech","#startup","#innovation","#product"]',
     NOW() - INTERVAL '10 days' + INTERVAL '14 hours',
     NOW(), NOW()),
    
    -- Post 2: Good engagement  
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_2',
     'post',
     'Top 5 tips for success in 2025. Tag a friend who needs this!',
     '["#business","#success","#tips","#2025"]',
     NOW() - INTERVAL '9 days' + INTERVAL '10 hours',
     NOW(), NOW()),
    
    -- Post 3: Strong engagement
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_3',
     'post',
     'New feature alert! Comment below with your thoughts on this update.',
     '["#tech","#update","#feature","#launch"]',
     NOW() - INTERVAL '8 days' + INTERVAL '15 hours',
     NOW(), NOW()),
    
    -- Post 4: Solid engagement
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_4',
     'post',
     'Share this with someone who inspires you. Click link in bio for more!',
     '["#inspiration","#motivation","#success"]',
     NOW() - INTERVAL '7 days' + INTERVAL '14 hours',
     NOW(), NOW()),
    
    -- Post 5: Good engagement
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_5',
     'post',
     'Behind the scenes of our latest project. Learn more about our process!',
     '["#behindthescenes","#process","#tech","#innovation"]',
     NOW() - INTERVAL '6 days' + INTERVAL '10 hours',
     NOW(), NOW())
    
    RETURNING id INTO content_id_1;
    
    -- Create daily metrics for each post
    -- Post 1 metrics (high performance)
    INSERT INTO "AnalyticsDailyMetric" (
        id, "organizationId", "integrationId", "externalContentId",
        date, impressions, reach, reactions, comments, shares, "videoViews",
        "createdAt", "updatedAt"
    ) VALUES
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_1',
     (NOW() - INTERVAL '10 days')::date, 15000, 12000, 650, 85, 35, NULL,
     NOW(), NOW());
    
    -- Post 2 metrics (good performance)
    INSERT INTO "AnalyticsDailyMetric" (
        id, "organizationId", "integrationId", "externalContentId",
        date, impressions, reach, reactions, comments, shares, "videoViews",
        "createdAt", "updatedAt"
    ) VALUES
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_2',
     (NOW() - INTERVAL '9 days')::date, 10000, 8000, 450, 60, 25, NULL,
     NOW(), NOW());
    
    -- Post 3 metrics (strong performance)
    INSERT INTO "AnalyticsDailyMetric" (
        id, "organizationId", "integrationId", "externalContentId",
        date, impressions, reach, reactions, comments, shares, "videoViews",
        "createdAt", "updatedAt"
    ) VALUES
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_3',
     (NOW() - INTERVAL '8 days')::date, 18000, 14000, 800, 95, 45, NULL,
     NOW(), NOW());
    
    -- Post 4 metrics (solid performance)
    INSERT INTO "AnalyticsDailyMetric" (
        id, "organizationId", "integrationId", "externalContentId",
        date, impressions, reach, reactions, comments, shares, "videoViews",
        "createdAt", "updatedAt"
    ) VALUES
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_4',
     (NOW() - INTERVAL '7 days')::date, 9000, 7500, 400, 50, 20, NULL,
     NOW(), NOW());
    
    -- Post 5 metrics (good performance)
    INSERT INTO "AnalyticsDailyMetric" (
        id, "organizationId", "integrationId", "externalContentId",
        date, impressions, reach, reactions, comments, shares, "videoViews",
        "createdAt", "updatedAt"
    ) VALUES
    (gen_random_uuid()::text, org_id, integration_id, 'ext_post_5',
     (NOW() - INTERVAL '6 days')::date, 11000, 9000, 500, 65, 28, NULL,
     NOW(), NOW());
    
    RAISE NOTICE 'Sample data created successfully!';
    RAISE NOTICE 'Created 5 posts with metrics';
    RAISE NOTICE 'Run: SELECT * FROM "AnalyticsContent" WHERE "organizationId" = ''%'';', org_id;
END $$;
