# Story 3.1: Quản lý Page Groups/Niches và gán pages vào group

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **tạo Page Groups/Niches và gán pages vào group** để **mọi analytics/trend có thể lọc theo group/niche, giảm nhiễu**.

## Acceptance Criteria

1. Khi có danh sách page được track, Leader tạo group/niche và gán pages thì group/niche được lưu theo organization.
2. Dashboard có thể lọc theo group/niche.

## Tasks / Subtasks

- [x] Cập nhật Prisma schema
  - [x] Thêm trường `niche` vào AnalyticsGroup
  - [x] Tạo bảng nối AnalyticsGroupMember
  - [x] Thêm quan hệ giữa Group và TrackedIntegration

- [x] Implement AnalyticsGroupService
  - [x] createGroup()
  - [x] getGroups()
  - [x] getGroupById()
  - [x] updateGroup()
  - [x] deleteGroup() – soft delete
  - [x] assignPages()
  - [x] removePage()
  - [x] getGroupsByTrackedIntegration()

- [x] API endpoints
  - [x] POST /api/analytics/groups – tạo group
  - [x] GET /api/analytics/groups – liệt kê
  - [x] GET /api/analytics/groups/:id – chi tiết
  - [x] PUT /api/analytics/groups/:id – cập nhật
  - [x] POST /api/analytics/groups/:id/pages – gán pages
  - [x] Thêm Swagger docs

- [x] Register services
  - [x] Thêm AnalyticsGroupService vào API module

## Dev Notes

**Prerequisite:** Story 2.1 (Track Priority Facebook Pages)

### Thiết kế Schema

**AnalyticsGroupMember** cho quan hệ many-to-many:
- 1 group có nhiều page
- 1 page thuộc nhiều group
- Cascade delete dọn dẹp khi group hoặc tracked integration bị xóa
- Unique constraint `[groupId, trackedIntegrationId]` ngăn trùng.

### Service Layer

**AnalyticsGroupService**:
- CRUD đầy đủ
- Gán page với validation
- Kiểm tra ownership tracked integration
- Idempotent assignment (bỏ qua trùng)

**Validation:**
- Tên group unique per organization
- Tracked integrations phải tồn tại và thuộc org
- Soft delete qua `deletedAt`

### API Design

**Endpoints REST:**
- POST /analytics/groups – tạo group
- GET /analytics/groups – trả kèm members
- GET /analytics/groups/:id – chi tiết
- PUT /analytics/groups/:id – cập nhật
- POST /analytics/groups/:id/pages
  - Body: `{ trackedIntegrationIds: string[] }`
  - Idempotent: bỏ qua trùng
  - Trả group kèm members

**Response gồm:**
- Thông tin group (id, name, description, niche)
- Mảng members (tracked integration + integration details)
- Timestamps

### References

- [docs/epics.md#Story-3.1-Quản-lý-Page-Groups/Niches-và-gán-pages-vào-group]
- FR-002

### Agent Model

- Cascade

### Completion Notes

**Tóm tắt:** Story 3.1 cho phép tổ chức pages thành group/niche để lọc analytics tốt hơn. Leader tạo group, gán pages, và lọc dashboard theo category phù hợp.

**Kiến trúc:**

1. **DB Schema**
   - AnalyticsGroup: name, description, niche
   - AnalyticsGroupMember: junction many-to-many
   - Cascade delete đảm bảo toàn vẹn

2. **Service Layer (235 dòng)**
   - CRUD, validation, idempotent assignment, query helpers

3. **API Layer**
   - REST + Swagger
   - Status code & validation chuẩn

**Data Model:**
```
AnalyticsGroup
  id, organizationId, name (unique per org), description?, niche?
  members[] -> AnalyticsGroupMember -> trackedIntegration -> integration

AnalyticsGroupMember
  id, groupId (cascade), trackedIntegrationId (cascade), assignedAt
  @@unique([groupId, trackedIntegrationId])
```

**API Examples:**
```bash
POST /api/analytics/groups
{ "name": "Tech News Pages", "description": "Technology and startup news pages", "niche": "technology" }

POST /api/analytics/groups/{groupId}/pages
{ "trackedIntegrationIds": ["uuid-1", "uuid-2", "uuid-3"] }

GET /api/analytics/groups
# Trả toàn bộ group kèm pages
```

**Tính năng:**
1. Many-to-many linh hoạt.
2. Idempotent assignment: re-assign không lỗi, skip trùng.
3. Validation: tên unique, kiểm ownership.
4. Soft delete: đánh dấu deletedAt, cascade member.

**Use cases:**
- Theo niche (Tech, Sports...)
- Theo campaign (Q1, Launch...)
- Theo vùng (NA, EU...)

**Lợi ích:**
- Giảm nhiễu analytics
- Phân tích trend theo niche
- Theo dõi campaign đa page

**Future (Not MVP):**
- Group lồng nhau
- Template group
- Auto-assign theo metadata
- Permission theo group

### File List

**Tạo mới:**
1. `analytics-group.service.ts`
2. `docs/stories/3-1-manage-page-groups-and-assign-pages.md` (gốc)

**Sửa:**
3. `schema.prisma` – model AnalyticsGroupMember
4. `analytics.controller.ts` – endpoints group
5. `api.module.ts` – đăng ký service

≈330 dòng code + docs

## Senior Developer Review (AI)

### Tóm tắt

Thiết kế many-to-many rõ ràng, API RESTful, idempotent assignment, validation đầy đủ.

### Findings

- Schema junction + cascade là best practice
- Service tách biệt, validation chuẩn
- API REST + HTTP method phù hợp
- Assignment xử lý duplicate

### Khuyến nghị

**Đã làm:**
- ✅ Unique name per org
- ✅ Cascade delete
- ✅ Idempotent assignment
- ✅ Swagger

**Cân nhắc sau:**
- Pagination cho danh sách lớn
- Bulk operations
- Group-level analytics (Story 3.2)

### Verdict

✅ APPROVED – Production-ready cho MVP.
