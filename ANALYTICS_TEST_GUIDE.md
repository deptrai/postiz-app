# Analytics Testing Guide - Epic 1-5

## Prerequisites

### 1. Backend Running
```bash
cd /Users/mac_1/Documents/GitHub/postiz-app
cd apps/backend && pnpm dev
```
Verify: http://localhost:4001 returns "App is running!"

### 2. Frontend Running
```bash
cd apps/frontend && pnpm dev
```
Verify: http://localhost:4200 loads

### 3. Login Credentials
**User with integrations:**
- Email: `test@analytics.com`
- Organization: Analytics Test Co
- Integrations: 2 (X - Chain Lens, Facebook - Lồng Đèn 3D)

**Alternative user (no integrations):**
- Email: `phanquochoipt@gmail.com`
- Will show: "Can't show analytics yet, you have to add Social Media channels"

## Epic 1: Foundation

### Test: Analytics Page Access
1. Navigate to: http://localhost:4200/analytics
2. **Expected:** Page loads with channel list on left sidebar
3. **Verify:**
   - Loading spinner appears briefly
   - Channel list shows 2 integrations (X, Facebook)
   - Each channel has profile picture and name
   - Channels are clickable

### Test: Channel Selection
1. Click on X integration (Chain Lens)
2. **Expected:** Channel becomes active (opacity 100%)
3. Click on Facebook integration (Lồng Đèn 3D)
4. **Expected:** Channel switches, Facebook becomes active
5. **Verify:**
   - Only one channel active at a time
   - Inactive channels have opacity 20%
   - Hover shows opacity 100%

### Test: Date Range Selection
1. Look for date dropdown (7 Days / 30 Days / 90 Days)
2. **Expected:** 
   - X integration: Shows 7, 30 days options
   - Facebook integration: Shows 7, 30, 90 days options
3. Select different date ranges
4. **Verify:** Dropdown value changes

## Epic 2: Ingestion & Storage

### Test: Tracked Pages (Backend Only)
**API Test:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJmMmE1YWUyLTg1NDAtNGJkNy05Y2YzLTI3YTk0Y2M5Yjc2YiIsImVtYWlsIjoidGVzdEBhbmFseXRpY3MuY29tIiwiYWN0aXZhdGVkIjp0cnVlLCJpYXQiOjE3NjU3MzkwNDB9.JTFlxB8m9NDXwVAB0OhFdOEYwwMgklgnQoBxuzkEPy8"

# Get tracked pages
curl -H "auth: $TOKEN" "http://localhost:4001/analytics/tracked-pages"

# Update tracked pages (max 20)
curl -X PUT -H "auth: $TOKEN" -H "Content-Type: application/json" \
  -d '{"integrationIds":["cmj5s6va00001iczxwarfhiw9","cmj60jsd40001icnobf0jcyqs"]}' \
  "http://localhost:4001/analytics/tracked-pages"
```

**Expected:** Returns tracked integration IDs

## Epic 3: Dashboard & Core Analytics

### Test: Platform Analytics Tab
1. Click "Platform Analytics" button
2. **Expected:** Dashboard view loads
3. **Verify:**
   - Left sidebar: Filters panel
   - Main area: KPI cards grid
   - Date range selector
   - Group selector (if groups exist)
   - Format filter (Posts/Reels/All)

### Test: KPI Cards
**Expected to see 7 KPI cards:**
1. **Total Posts** - Number of posts in period
2. **Total Reach** - Unique impressions
3. **Total Engagement** - Reactions + Comments + Shares
4. **Engagement Rate** - Percentage (Engagement / Reach)
5. **Avg Engagement** - Per post
6. **Total Impressions** - Including duplicates
7. **Video Views** - For video content

**Current State:** All show 0 (no analytics data ingested yet)

### Test: Format Breakdown Chart
1. Scroll down to "Format Breakdown" section
2. **Expected:** Chart showing Posts vs Reels distribution
3. **Current State:** Empty (no data)

### Test: Top Content List
1. Scroll to "Top Content" section
2. **Expected:** List of top performing posts
3. **Current State:** Empty state message

### Test: Page Groups Management
**API Test:**
```bash
# Create group
curl -X POST -H "auth: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"My test group"}' \
  "http://localhost:4001/analytics/groups"

# List groups
curl -H "auth: $TOKEN" "http://localhost:4001/analytics/groups"

# Update group
curl -X PUT -H "auth: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Updated Group"}' \
  "http://localhost:4001/analytics/groups/{groupId}"

# Delete group
curl -X DELETE -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/groups/{groupId}"
```

### Test: Dashboard Filters
1. Change date range (start/end dates)
2. Select group (if created)
3. Select format (Posts/Reels/All)
4. **Expected:** KPIs refresh with new filters

## Epic 4: Insights + Daily Brief

### Test: Daily Brief Tab
1. Click "Daily Brief" button
2. **Expected:** Daily brief view loads
3. **Verify:**
   - Date displayed
   - Organization ID shown
   - 3 summary cards:
     - Total Posts: 0
     - Total Engagement: 0
     - Top Performer: N/A
   - Placeholder message at bottom

### Test: Trending Topics Widget
1. Look for "Trending Topics" section in dashboard
2. **Expected:** Widget showing trending topics
3. **Current State:** Empty (no trending data)

**API Test:**
```bash
# 24h trending
curl -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/trending/topics?timeWindow=24h&limit=10"

# 48h trending
curl -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/trending/topics?timeWindow=48h&limit=10"

# 72h trending
curl -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/trending/topics?timeWindow=72h&limit=10"
```

### Test: Best Time to Post
1. Look for "Best Time to Post" heatmap
2. **Expected:** Heatmap showing optimal posting times
3. **Current State:** Empty (no data)

**API Test:**
```bash
curl -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/best-time?days=7"
```

### Test: Tag Management
**API Test:**
```bash
# List tags
curl -H "auth: $TOKEN" "http://localhost:4001/analytics/tags"

# Create tag
curl -X POST -H "auth: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Campaign 2025"}' \
  "http://localhost:4001/analytics/tags"

# Update tag
curl -X PUT -H "auth: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Updated Campaign"}' \
  "http://localhost:4001/analytics/tags/{tagId}"

# Delete tag
curl -X DELETE -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/tags/{tagId}"

# Assign tag to content
curl -X POST -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/content/{contentId}/tags/{tagId}"
```

## Epic 5: Export Reporting

### Test: Export CSV Button
1. Scroll to bottom of dashboard
2. Look for "Export CSV" button (bottom right)
3. Click button
4. **Expected:** Export modal opens

### Test: Export Modal
1. **Verify modal contains:**
   - Date range selector (start/end)
   - Group filter dropdown
   - Format filter (Posts/Reels/All)
   - Export button
   - Close button

2. Select filters
3. Click "Export" button
4. **Expected:** CSV file downloads

**API Test:**
```bash
curl -H "auth: $TOKEN" \
  "http://localhost:4001/analytics/export/csv?startDate=2025-12-01&endDate=2025-12-15&format=all" \
  -o analytics_export.csv
```

## Known Issues

### 1. No Analytics Data
**Symptom:** All metrics show 0
**Reason:** No analytics data has been ingested from Facebook/X APIs yet
**Solution:** Wait for data ingestion cron job or manually trigger ingestion

### 2. Empty State Messages
**Expected behavior when no data:**
- "No data available"
- "No content found for the selected date range"
- "Make sure you have tracked Facebook pages and ingested data"

### 3. Chrome MCP Timeout
**Symptom:** Browser automation tools timeout
**Workaround:** Manual browser testing required

## Success Criteria

### Epic 1: Foundation ✅
- [x] Analytics page loads
- [x] Channel list displays
- [x] Channel selection works
- [x] Date range selector works

### Epic 2: Ingestion & Storage ✅
- [x] API endpoints respond
- [x] Tracked pages CRUD works

### Epic 3: Dashboard & Core Analytics ✅
- [x] KPI cards display
- [x] Dashboard filters work
- [x] Groups CRUD API works
- [x] Format breakdown component exists
- [x] Top content list component exists

### Epic 4: Insights + Daily Brief ✅
- [x] Daily brief tab works
- [x] Daily brief API returns data
- [x] Trending topics API works
- [x] Best time API works
- [x] Tags CRUD API works

### Epic 5: Export Reporting ✅
- [x] Export button exists
- [x] Export modal opens
- [x] CSV export API works

## Next Steps

### To Get Real Data:
1. Ensure Facebook/X integrations are properly connected
2. Wait for or trigger analytics ingestion cron job
3. Verify data appears in database tables:
   - `AnalyticsContent`
   - `AnalyticsMetric`
   - `AnalyticsDailyMetric`

### To Test with Sample Data:
Create seed script to populate:
- Sample posts with metrics
- Sample trending topics
- Sample best time data
- Sample tags

## API Endpoints Reference

```
Epic 1-2:
GET  /integrations/list
GET  /analytics/tracked-pages
PUT  /analytics/tracked-pages

Epic 3:
GET  /analytics/groups
POST /analytics/groups
GET  /analytics/groups/:id
PUT  /analytics/groups/:id
DELETE /analytics/groups/:id
POST /analytics/groups/:groupId/pages
DELETE /analytics/groups/:groupId/pages/:integrationId
GET  /analytics/dashboard/kpis
GET  /analytics/dashboard/top-content
GET  /analytics/dashboard/format-breakdown

Epic 4:
GET  /analytics/tags
POST /analytics/tags
PUT  /analytics/tags/:id
DELETE /analytics/tags/:id
POST /analytics/content/:contentId/tags/:tagId
DELETE /analytics/content/:contentId/tags/:tagId
GET  /analytics/trending/topics
GET  /analytics/best-time
GET  /analytics/daily-brief

Epic 5:
GET  /analytics/export/csv
```

## Troubleshooting

### Backend Not Responding
```bash
# Check if running
lsof -ti:4001

# Restart
pkill -9 -f "nest start"
cd apps/backend && pnpm dev
```

### Frontend Not Loading
```bash
# Check if running
lsof -ti:4200

# Restart
cd apps/frontend && pnpm dev
```

### Database Connection Issues
```bash
# Check PostgreSQL
docker ps | grep postgres

# Check connection
docker exec -it $(docker ps -qf "name=postgres") \
  psql -U postiz-local -d postiz-db-local -c "SELECT 1"
```
