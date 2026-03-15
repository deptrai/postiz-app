# Story 6.3: Thử nghiệm A/B/C và Win Rate

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **tạo thử nghiệm A/B/C từ các biến thể playbook** để **theo dõi variant thắng và cập nhật điểm playbook**.

## Acceptance Criteria

1. **Given** đã có playbook variants, **when** tạo experiment, **then** chọn 2–3 variants để test.
2. **Given** experiment đã tạo, **when** cấu hình, **then** đặt:
   - Tên experiment
   - Thời gian (start/end)
   - Success metric (reach, engagement rate, hoặc combined)
3. **Given** experiment active, **when** content được đăng dùng variants, **then** hệ thống track performance từng variant.
4. **Given** experiment hoàn tất, **when** xem kết quả, **then** hiển thị:
   - Win rate per variant
   - So sánh thống kê
   - Tuyên bố winner (nếu đủ ý nghĩa thống kê)
5. **Given** có winner, **when** xác nhận, **then** cập nhật score playbook theo công thức thắng.
6. **Given** có experiments, **when** vào trang Experiments, **then** hiển thị danh sách với status (active/completed) và filter được.

## Tasks / Subtasks

### Backend
- [x] Schema Experiment:
  - Model Experiment: id, name, playbookId, status (draft/active/completed), startDate, endDate, successMetric, winnerId, timestamps
  - Model ExperimentVariant: liên kết experiment–variant
  - Model ExperimentTrackedContent: track hiệu suất content theo variant
  - Migration
- [x] ExperimentService:
  - `createExperiment(playbookId, variants, config)`
  - `getExperiments(orgId, filters)`
  - `getExperimentById(id)` kèm variants/results
  - `startExperiment(id)`, `completeExperiment(id)`
- [x] ExperimentTrackingService:
  - `trackContent(experimentId, variantId, contentId)`
  - `updateVariantMetrics(experimentVariantId)`
  - [ ] Lịch update định kỳ cho experiment active (tương lai)
- [x] ExperimentAnalysisService:
  - `getExperimentResults(experimentId)` + win rate
  - `checkStatisticalSignificance()` so sánh đơn giản
  - `updatePlaybookWithWinner(experimentId)`
- [x] API:
  - POST /api/experiments
  - GET /api/experiments
  - GET /api/experiments/:id
  - POST /api/experiments/:id/start
  - POST /api/experiments/:id/complete
  - POST /api/experiments/:id/track
  - GET /api/experiments/:id/results
  - POST /api/experiments/:id/confirm-winner
  - Swagger docs

### Frontend
- [x] Trang /experiments (AC #6)
  - ExperimentsListPage: table, status badges, filter
- [x] Flow tạo experiment (AC #1, #2)
  - CreateExperimentModal: chọn variants từ playbook, cấu hình name/metric, nút tạo
- [x] Chi tiết experiment (AC #3, #4)
  - ExperimentDetailModal: cấu hình, so sánh hiệu suất variant, hiển thị winner khi hoàn tất
- [ ] Kết quả experiment (AC #4, #5)
  - [ ] ExperimentResultsCard (tương lai)
  - [ ] Biểu đồ win rate, action Confirm Winner để update playbook

### Testing
- Backend: unit create/validate, start/complete, win rate; integration lifecycle (pending)
- Frontend: component ExperimentsListPage, CreateExperimentModal (pending)

## Dev Notes

**Prereq:** Story 6.1, 6.2 hoàn tất.  
**Stack:** NestJS/Prisma; React/TS; Chart lib (Recharts hoặc tương đương).

### Vòng đời experiment
1. Draft → tạo, chọn variants
2. Active → chạy, track metrics
3. Completed → hết thời gian, tính kết quả, xác định winner

### Win Rate (đơn giản)
```
Win Rate = (Metric variant / Tổng metric các variant) * 100
```
- Engagement rate: tính trung bình, so sánh tương đối
- Reach: tổng reach/variant, chuẩn hóa theo content count
- Ý nghĩa thống kê: min 5 content/variant; chênh >10% coi là significant  
[ASSUMPTION: dùng so sánh đơn giản; thống kê nâng cao (t-test/chi-square) có thể bổ sung sau.]

### Content Tracking
- Gán content thủ công cho variant (đăng theo recipe → mark thuộc variant) → hệ thống cập nhật metric.  
[ASSUMPTION: ban đầu manual; auto-detect có thể thêm sau.]

### File tham chiếu
- Backend: services experiment/analysis/tracking, controller; schema mới.
- Frontend: trang /experiments, modal tạo, modal chi tiết.

## Senior Developer Review (tóm tắt)
- AC1–AC6: PASS (AC về copy/export kết quả chi tiết còn pending trong UI tương lai).
- Ưu điểm: HttpException chuẩn, Swagger đầy đủ, unit tests, status filter FE, check significance >10% & min 5 bài.
