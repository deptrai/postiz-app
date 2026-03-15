# Story 14.2: Phân tích Hook

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **phân tích hook effectiveness** để **tạo hooks thu hút hơn**.

## Acceptance Criteria

1. **Given** video content, **when** user yêu cầu hook analysis, **then** hệ thống phân tích 3 giây đầu và trả effectiveness score.
2. **Given** hook analysis, **when** user xem chi tiết, **then** hiển thị breakdown: opening type, pacing, visual impact.
3. **Given** viral hooks lịch sử, **when** phân tích hook mới, **then** so sánh với patterns của viral content.
4. **Given** kết quả hook analysis, **when** user xem recommendations, **then** gợi ý hook patterns hiệu quả theo niche/format.
5. **Given** nhiều hooks, **when** user so sánh, **then** rank hooks theo effectiveness score.

## Tasks / Subtasks

### Backend
- [x] HookAnalyzerService:
  - `analyzeHook(videoMetadata)`, định nghĩa hook effectiveness factors, tính effectiveness score
- [x] Hook Patterns Database:
  - Trích xuất patterns từ viral content, phân loại theo opening type, lưu pattern metadata
- [x] Hook Recommendations:
  - Sinh gợi ý theo niche, đề xuất proven hook patterns
- [x] API:
  - POST /api/viral/hook/analyze
  - GET /api/viral/hook/patterns
  - Swagger docs

### Frontend
- [x] HookAnalysisCard:
  - Hiển thị effectiveness score, factor breakdown, visual indicators
- [x] HookPatterns:
  - Danh sách successful patterns, ví dụ từ viral content, nút Apply to draft
- [x] HookComparison:
  - So sánh side-by-side, ranking display

### Testing
- [x] Backend: unit hook analysis, pattern matching, recommendation generation
- [x] Frontend: component HookAnalysisCard, HookPatterns

## Dev Notes

**Prereq:** Story 14.1 hoàn tất; có historical video data.

**Hook Effectiveness Factors:**
| Factor | Weight | Mô tả |
|--------|--------|-------|
| Opening Type | 30% | Question, statement, action, v.v. |
| Pacing | 25% | Fast cuts, slow reveal, v.v. |
| Visual Impact | 25% | Visuals thu hút |
| Audio Hook | 20% | Music, voice, sound effects |

**Hook Opening Types:**
1. Question Hook: "Did you know...?"
2. Statement Hook: "This changed everything..."
3. Action Hook: Nhảy thẳng vào hành động
4. Curiosity Hook: "Wait for it..."
5. Problem Hook: "Struggling with...?"

[ASSUMPTION: Hook analysis dựa metadata và caption analysis, không phân tích frame video thực (cần ML/CV); nếu thiếu video metadata, ước lượng dựa caption đầu.]

**File dự kiến:** hook-analyzer.service.ts, hook-analysis-card.tsx, hook-patterns.tsx.
