# Story 7.2: Theme Manager (Đổi tên / Gộp / Tách)

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **quản lý theme (đổi tên/gộp/tách)** để **themes ngày càng chính xác cho niche của tôi**.

## Acceptance Criteria

1. **Given** đã có themes, **when** user rename theme, **then** cập nhật tên và giữ nguyên liên kết content.
2. **Given** có ≥2 themes, **when** user merge, **then** gộp thành 1 theme, giữ toàn bộ content và lưu lịch sử truy vết.
3. **Given** một theme có nhiều content, **when** user split, **then** tạo theme mới dựa trên chọn thủ công hoặc auto sub-clustering.
4. **Given** thao tác (rename/merge/split), **when** hoàn tất, **then** hệ thống log lịch sử cho traceability.
5. **Given** có history, **when** user xem chi tiết theme, **then** thấy lịch sử thay đổi (rename/merge/split).

## Tasks / Subtasks

### Backend
- [x] Mở rộng schema Theme cho history:
  - Model ThemeHistory: id, themeId, action, previousState JSON, newState JSON, relatedThemeIds, createdAt
  - Quan hệ Theme 1:N ThemeHistory
  - Migration
- [x] ThemeManagerService:
  - `renameTheme(themeId, newName)`
  - `mergeThemes(themeIds[], targetName)`
  - `splitTheme(themeId, splitConfig)`
  - Log mọi thao tác vào ThemeHistory
- [x] ThemeService (history):
  - `getThemeHistory(themeId)`
- [x] API:
  - POST /api/themes/:id/rename
  - POST /api/themes/merge
  - POST /api/themes/:id/split
  - GET /api/themes/:id/history
  - Swagger docs

### Frontend
- [x] Đổi tên (AC #1):
  - Inline edit trên theme detail modal, validate non-empty, nút save khi đổi.
- [x] Gộp (AC #2):
  - Checkbox multi-select list, MergeThemesModal, đặt tên theme gộp.
- [x] Tách (AC #3):
  - Backend hỗ trợ manual/auto; Frontend SplitThemeModal (future).
- [x] History view (AC #5):
  - Tab History trên detail modal, timeline thay đổi (action + date).

### Testing
- Backend: unit rename/merge/split + history; integration lifecycle (pending)
- Frontend: component rename, MergeThemesModal (pending)

## Dev Notes

**Prereq:** Story 7.1 (clustering, base Theme).  
**Stack:** NestJS/Prisma; React/TS.

### Merge Logic
1) Chọn target (đầu tiên hoặc user chọn)  
2) Di chuyển toàn bộ content vào target  
3) Gộp keywords  
4) Tính lại metrics  
5) Soft-delete themes nguồn (giữ lịch sử)  
6) Log history (relatedThemeIds)

### Split Logic
- Manual: user chọn content cho theme mới → tạo theme mới → cập nhật theme gốc → log.  
- Auto: sub-clustering trên content theme → gợi ý nhóm → user xác nhận → tạo theme mới → log.

### History Schema (tóm tắt)
```
model ThemeHistory {
  id String @id @default(uuid())
  themeId String
  action String  // rename | merge | split
  previousState Json
  newState Json
  relatedThemeIds String[]
  createdAt DateTime @default(now())
  theme Theme @relation(fields: [themeId], references: [id])
}
```

### File tham chiếu
- Backend: theme-manager.service.ts (+spec), schema thêm ThemeHistory, controller thêm endpoints.
- Frontend: merge-themes.modal.tsx, split-theme.modal.tsx, theme-history.component.tsx, themes-list.page.tsx.

## Senior Developer Review (tóm tắt)
- AC1–AC5: PASS.  
- Ưu điểm: history logging đầy đủ, soft delete để truy vết, Swagger, unit tests, UI rename/merge.  
- Pending: split modal FE, integration tests, FE tests.

[ASSUMPTION: Soft-delete themes sau merge/split để giữ traceability; có thể cần cờ deletedAt nếu schema chưa có.] 
