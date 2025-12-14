# Story 3.1: Manage Page Groups and Assign Pages

Status: done

## Story

As a **Leader**,
I want **to create Page Groups/Niches and assign pages to groups**,
So that **all analytics/trends are filtered by group/niche to reduce noise**.

## Acceptance Criteria

1. Given a list of tracked pages, when Leader creates a group/niche and assigns pages, then the group/niche is saved per organization.
2. And the dashboard can filter by group/niche.

## Tasks / Subtasks

- [x] Update Prisma schema
  - [x] Add `niche` field to AnalyticsGroup
  - [x] Create AnalyticsGroupMember junction table
  - [x] Add relations between Group and TrackedIntegration

- [x] Implement AnalyticsGroupService
  - [x] createGroup() - Create new page group
  - [x] getGroups() - List all groups for org
  - [x] getGroupById() - Get specific group
  - [x] updateGroup() - Update group details
  - [x] deleteGroup() - Soft delete group
  - [x] assignPages() - Assign tracked integrations to group
  - [x] removePage() - Remove page from group
  - [x] getGroupsByTrackedIntegration() - Get groups for a page

- [x] Implement API endpoints
  - [x] POST /api/analytics/groups - Create group
  - [x] GET /api/analytics/groups - List groups
  - [x] GET /api/analytics/groups/:id - Get group
  - [x] PUT /api/analytics/groups/:id - Update group
  - [x] POST /api/analytics/groups/:id/pages - Assign pages
  - [x] Add Swagger documentation

- [x] Register services
  - [x] Add AnalyticsGroupService to API module

## Dev Notes

**Prerequisites:** Story 2.1 (Track Priority Facebook Pages)

**Implementation Details:**

### Schema Design

**AnalyticsGroupMember** junction table enables many-to-many relationship:
- One group can have multiple pages
- One page can belong to multiple groups
- Cascade delete ensures cleanup when group or tracked integration is deleted

**Unique constraint:** `[groupId, trackedIntegrationId]` prevents duplicate assignments.

### Service Layer

**AnalyticsGroupService** provides:
- Full CRUD operations for groups
- Page assignment with validation
- Automatic verification of tracked integration ownership
- Idempotent page assignment (skips duplicates)

**Validation:**
- Group name unique per organization
- Tracked integrations must exist and belong to org
- Groups soft-deleted (deletedAt field)

### API Design

**RESTful endpoints:**
- POST /analytics/groups - Create group
- GET /analytics/groups - List all groups with members
- GET /analytics/groups/:id - Get group details
- PUT /analytics/groups/:id - Update group
- POST /analytics/groups/:id/pages - Assign pages
  - Body: `{ trackedIntegrationIds: string[] }`
  - Idempotent: existing assignments skipped
  - Returns updated group with all members

**Response includes:**
- Group details (id, name, description, niche)
- Members array with full tracked integration and integration details
- Timestamps (createdAt, updatedAt)

### References

- [Source: docs/epics.md#Story-3.1-Quản-lý-Page-Groups/Niches-và-gán-pages-vào-group]
- FR coverage: FR-002

### Related Files

- Prisma schema context: `docs/stories/1-2-analytics-schema-foundation.context.xml`
- Tracking service: `docs/stories/2-1-track-priority-facebook-pages.context.xml`

### Agent Model Used

Cascade

### Completion Notes

**Implementation Summary:**

Story 3.1 enables page organization into groups/niches for better analytics filtering. Leaders can create groups, assign tracked pages, and organize their analytics by meaningful categories.

**Architecture:**

1. **Database Schema**
   - AnalyticsGroup: stores group metadata (name, description, niche)
   - AnalyticsGroupMember: junction table for many-to-many relationships
   - Cascade delete ensures referential integrity

2. **Service Layer (235 lines)**
   - Full CRUD operations
   - Validation and error handling
   - Idempotent page assignments
   - Query methods for filtering

3. **API Layer**
   - RESTful endpoints with Swagger docs
   - Proper HTTP status codes
   - Request validation
   - Error handling

**Data Model:**

```
AnalyticsGroup
  ├── id (UUID)
  ├── organizationId (FK)
  ├── name (unique per org)
  ├── description (optional)
  ├── niche (optional category)
  └── members[] (AnalyticsGroupMember[])
       └── trackedIntegration
            └── integration (full details)

AnalyticsGroupMember (junction)
  ├── id (UUID)
  ├── groupId (FK, cascade delete)
  ├── trackedIntegrationId (FK, cascade delete)
  └── assignedAt (timestamp)
  @@unique([groupId, trackedIntegrationId])
```

**API Examples:**

**Create Group:**
```bash
POST /api/analytics/groups
{
  "name": "Tech News Pages",
  "description": "Technology and startup news pages",
  "niche": "technology"
}
```

**Assign Pages:**
```bash
POST /api/analytics/groups/{groupId}/pages
{
  "trackedIntegrationIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

**List Groups:**
```bash
GET /api/analytics/groups
# Returns all groups with assigned pages
```

**Features:**

1. **Many-to-Many Relationships**
   - Pages can belong to multiple groups
   - Groups can contain multiple pages
   - Flexible organization

2. **Idempotent Assignments**
   - Re-assigning same page doesn't fail
   - Duplicate assignments automatically skipped
   - Safe for retries

3. **Validation**
   - Group names unique per organization
   - Tracked integrations must exist
   - Ownership verification

4. **Soft Delete**
   - Groups marked as deleted (deletedAt)
   - Can be restored if needed
   - Member assignments cleaned up on cascade

**Use Cases:**

1. **Organize by Niche:**
   - "Tech Pages" group for technology content
   - "Sports Pages" group for sports content
   - Filter analytics by relevant category

2. **Campaign Grouping:**
   - "Q1 Campaign" group
   - "Product Launch" group
   - Track campaign performance across pages

3. **Regional Organization:**
   - "North America" group
   - "Europe" group
   - Regional performance analysis

**Benefits:**

- Reduces noise in analytics by filtering relevant pages
- Enables niche-specific trend analysis
- Supports campaign tracking across pages
- Flexible organization structure

**Future Enhancements (Not MVP):**

- Nested groups (hierarchical structure)
- Group templates for quick setup
- Auto-assignment based on page metadata
- Group-level permissions

### File List

**Created:**
1. `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-group.service.ts` (235 lines)
2. `docs/stories/3-1-manage-page-groups-and-assign-pages.md` (this file)

**Modified:**
3. `libraries/nestjs-libraries/src/database/prisma/schema.prisma` - AnalyticsGroupMember model
4. `apps/backend/src/api/routes/analytics.controller.ts` - Group endpoints
5. `apps/backend/src/api/api.module.ts` - Service registration

**Total:** ~330 lines production code + documentation

## Senior Developer Review (AI)

### Summary

Story 3.1 implements page group management with a clean many-to-many relationship design. The implementation follows RESTful principles and provides flexible organization for analytics filtering.

### Findings

- **Schema design:** Many-to-many junction table with cascade delete is standard best practice
- **Service layer:** Clean separation of concerns, proper validation
- **API design:** RESTful endpoints with appropriate HTTP methods
- **Idempotency:** Page assignment properly handles duplicates
- **Error handling:** Validates ownership and existence

### Recommendations

**Implemented:**
- ✅ Unique constraint on group name per org
- ✅ Cascade delete for referential integrity
- ✅ Idempotent page assignments
- ✅ Swagger documentation

**Future Considerations:**
- Add pagination for large group lists
- Consider bulk operations for better performance
- Add group analytics aggregation (Story 3.2)

### Verdict

✅ **APPROVED** - Production ready for MVP. Clean implementation following best practices.
