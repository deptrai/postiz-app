# Story 5.1: Xuất báo cáo CSV theo khoảng thời gian (Page/Group/Niche)

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **xuất báo cáo CSV** để **lưu, phân tích thêm hoặc chia sẻ với đội**.

## Acceptance Criteria

1. **Given** dữ liệu dashboard/insights, **when** chọn date range + scope, **then** hệ thống trả file CSV tải xuống.
2. **And** CSV gồm tối thiểu các cột KPI theo PRD.
3. **And** export hỗ trợ filter:
   - Date range (start/end)
   - Group/niche
   - Content format (post/reel/all)
4. **And** CSV được định dạng header đầy đủ.
5. **And** export lớn (>1000 rows) được xử lý an toàn.

## Tasks / Subtasks

### Backend
- [x] Tạo `AnalyticsExportService`
  - [x] `generateCSV()`, `formatData()`, `buildHeaders()`
  - [x] Xử lý dataset lớn (stream nếu cần)
- [x] CSV generation
  - [x] Export chi tiết theo content
  - [x] Export tổng hợp (summary)
  - [x] Hỗ trợ cả hai
  - [x] Định dạng số/ngày nhất quán
- [x] API
  - [x] `GET /api/analytics/export/csv`
  - [x] Query: groupId, startDate, endDate, format, type
  - [x] Response: download CSV
  - [x] Swagger docs

### Frontend
- [x] UI Export
  - [x] Nút export trên dashboard
  - [x] Modal chọn options
  - [x] Date range picker
  - [x] Format selector
  - [x] Export type (detailed/summary)
  - [x] Loading indicator
- [x] Download
  - [x] Trigger tải file
  - [x] Xử lý lỗi download
  - [x] Hiển thị thông báo thành công

### Testing
- [x] Backend: unit CSV generate/format, large dataset, integration API
- [x] Frontend: component modal, trigger download, error handling

## Dev Notes

**Prereq:** Story 3.2 (KPI/content), 4.2 (trending/tags), 2.3 (metrics).  
**Stack:** NestJS + csv-stringify/papaparse; React download blob; CSV chuẩn RFC 4180.

### Loại export CSV
1. **Detailed:** 1 dòng/content, đủ metrics → phân tích sâu.
2. **Summary:** 1 dòng/kỳ hoặc group, KPI tổng → báo cáo cao cấp.

[ASSUMPTION]: MVP ưu tiên detailed; summary có thể bổ sung sau.  
[ASSUMPTION]: Sinh file server-side; nếu >10K rows, cân nhắc job nền + gửi link (tương lai).

### Cấu trúc CSV (Detailed)
Headers ví dụ:
```
Content ID,Integration Name,Content Type,Published Date,Caption,Hashtags,
Total Reach,Total Impressions,Total Reactions,Total Comments,Total Shares,
Total Video Views,Total Engagement,Engagement Rate (%),Tags
```

Sample row:
```
"abc123","TechPage","post","2025-01-10 14:30:00","Amazing product launch...","#tech,#startup",
50000,75000,1800,500,200,0,2500,5.0,"ai,startup,product"
```

### Service (tóm tắt)
- `generateCSV(orgId, { groupId?, integrationIds?, startDate, endDate, format?, exportType })`
  - detailed → `generateDetailedCSV`
  - summary → `generateSummaryCSV`
- `generateDetailedCSV`: query content + metrics + tags; aggregate reach/impressions/reactions/comments/shares/videoViews/engagement/rate; parse hashtags JSON; stringify CSV (quoted, header).
- `generateSummaryCSV`: group metrics by date; tính contentCount, reach, impressions, reactions, comments, shares, videoViews, engagement, engagementRate; stringify CSV.
- `getIntegrationIdsFromGroup`: lấy integration từ group để filter.

### API Design
`GET /api/analytics/export/csv`
- Query: groupId?, integrationIds?, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), format? ('post'|'reel'|'all'), exportType? ('detailed'|'summary', default detailed)
- Response: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="analytics-export-YYYY-MM-DD.csv"`

### Edge Cases
- Invalid params → 400.
- Dataset lớn → có thể stream/chia batch; hiện tại xử lý trực tiếp nhưng cần guard hiệu năng.
- Không có data → CSV chỉ header hoặc trống.

### File List (tóm tắt)
- Service `analytics-export.service.ts`; controller endpoint; FE export modal/nút; Swagger.
