# postiz-app - Product Requirements Document

**Author:** Luis
**Date:** 2025-12-13
**Version:** 1.0

---

## Executive Summary

Mục tiêu của sản phẩm là xây dựng một hệ thống SaaS phân tích hiệu suất nội dung và hành vi tương tác (proxy behavior) trên **nhiều Facebook Pages** nhằm giúp chủ Page ra quyết định nhanh mỗi ngày: **đăng gì**, **đăng khi nào**, và **dùng format/hook nào** để tối đa hóa **lượt xem (reach/views)** và **tương tác (engagement)**.

Sản phẩm tập trung vào workflow “action-first”: mở hệ thống là thấy **Daily Brief** với 3 nhóm kết quả:

- Trend/top themes đang lên (24–72h)
- Khung giờ tốt nhất theo group/niche
- Playbook gợi ý công thức nội dung (Reels + post thường) để copy và biến thể

### What Makes This Special

"Magic" của sản phẩm là biến dữ liệu rời rạc thành **khuyến nghị hành động hằng ngày** (insight → recommendation → execution), đặc biệt phù hợp khi bạn sở hữu **rất nhiều Pages** và cần hệ thống hóa việc tối ưu content theo trend/thị hiếu.

---

## Project Classification

**Technical Type:** SaaS Web Application (Analytics + Reporting)

**Domain:** Social Media Analytics / Content Optimization

**Complexity:** Medium (data ingestion + analytics + recommendations; mở rộng thành high khi scale nhiều page và thêm theme clustering)

Dự án là một hệ thống phân tích dữ liệu (analytics) và gợi ý (recommendation) dựa trên:

- Dữ liệu owned pages (post/reel metrics)
- Metadata nội dung (caption/hashtag/time/format)
- Cấu trúc tổ chức theo group/niche/campaign

---

## Success Criteria

Thành công được định nghĩa theo **kết quả thực tế của content**, không chỉ “có dashboard”:

- **Decision speed:** mỗi ngày ra quyết định content trong **< 5 phút** nhờ Daily Brief.
- **Performance uplift:** sau 2–4 tuần sử dụng, tăng có ý nghĩa ở:
  - Reach/Views trung bình theo group/niche
  - Engagement rate (reactions+comments+shares)/reach
- **Repeatability:** tạo được các “công thức thắng” (playbooks) có **consistency score** (không dựa 1 bài may mắn).

### Business Metrics

- % tăng engagement rate theo tuần/tháng
- % tăng reach/views theo tuần/tháng
- # playbooks được dùng lại và “win rate” sau experiments

---

## Product Scope

### MVP - Minimum Viable Product (2 tuần)

**Scope giới hạn:** triển khai cho **10–20 Pages ưu tiên**.

**MVP must-have:**

1. Connect pages + tổ chức theo **group/niche**
2. Data ingestion hằng ngày: post/reel list + caption/hashtags + format + metrics
3. Taxonomy:
   - Auto keyword/topic tagging (nhẹ)
   - Manual campaign/series tagging
4. Dashboard:
   - Filter theo page/group/niche, format, date range
   - Top posts/reels + các KPI chính
5. Insights:
   - Trending topics/pillars (velocity 24–72h)
   - Best time to post (heatmap đơn giản)
   - Recommendations top 3–5
6. Daily Brief (home):
   - Top topics/pillars
   - Best time slots theo group/niche
   - Top post template (gợi ý hook/caption/hashtag bucket ở mức rule-based)
7. Export report: tối thiểu CSV (có thể mở rộng PDF/PPT sau)

**Out-of-scope MVP:** social listening/sentiment, virality map, AI assistant phức tạp, auto publish/scheduler.

### Growth Features (Post-MVP)

Ưu tiên theo lựa chọn của user:

1. **Playbook Recommendations**
   - Trích xuất công thức từ top posts/reels 14–30 ngày
   - Tạo variant và quản lý experiments (A/B/C)
2. **Topic Clustering / Themes**
   - Cluster captions/hashtags thành themes
   - Theme manager: rename/merge/split
   - Trend chuyển từ keyword → theme

Các growth features bổ sung (sau 2 ưu tiên trên):

- Alerts/anomaly detection (tụt KPI/spike bất thường)
- Competitor benchmarking (light)
- Report automation (email/telegram)

### Vision (Future)

- Scale lên nhiều pages (quota/retry/backfill)
- Multi-user/roles (nếu mở rộng team)
- Social listening/sentiment theo niche
- GenAI Q&A “vì sao KPI thay đổi?” dựa trên dữ liệu nội bộ

---

## User Experience Principles

- **Action-first:** Daily Brief là màn hình mặc định.
- **Group/niche first-class:** mọi insight đều filter theo group/niche.
- **Tách Reels vs Post thường:** recommendation và playbook phân biệt theo format.
- **Explainability:** mỗi recommendation phải có “vì sao” (metrics/velocity).

### Key Interactions

- Chọn group/niche → xem Daily Brief
- Click 1 trend/theme → xem top posts liên quan
- Click 1 playbook → copy template + chọn variants để thử

---

## Functional Requirements

### A) Account & Organization

- **FR-001 (MVP):** Hệ thống cho phép connect và lưu danh sách **10–20 Facebook Pages ưu tiên**.
- **FR-002 (MVP):** User có thể tạo và quản lý **Page Groups/Niches** và gán Pages vào group.

### B) Data Ingestion & Storage

- **FR-003 (MVP):** Hệ thống ingest dữ liệu post/reel tối thiểu 1 lần/ngày.
- **FR-004 (MVP):** Hệ thống lưu metadata nội dung: caption text, hashtag list, format/type, publish time.
- **FR-005 (MVP):** Hệ thống lưu metrics tối thiểu: reach/impressions (nếu có), views (nếu có), reactions, comments, shares, clicks (optional).

### C) Taxonomy (Keywords/Pillars + Campaign Tags)

- **FR-006 (MVP):** Hệ thống tự động gán keyword/topic tags cho post/reel dựa trên caption/hashtags.
- **FR-007 (MVP):** User có thể gán manual campaign/series tag cho content.

### D) Dashboard & Analytics

- **FR-008 (MVP):** Dashboard cho phép filter theo page/group/niche, format, date range.
- **FR-009 (MVP):** Dashboard hiển thị top posts/reels theo reach/views, engagement, engagement rate.

### E) Trend Detection (MVP keyword-based)

- **FR-010 (MVP):** Hệ thống tính trend theo **velocity 24–72h** cho keyword/topic (và/hoặc performance velocity).
- **FR-011 (MVP):** Trend output hiển thị theo group/niche để tránh nhiễu.

### F) Best Time to Post

- **FR-012 (MVP):** Hệ thống tính best time slots theo group/niche dựa trên lịch sử 7–14 ngày.
- **FR-013 (MVP):** Best time slots có thể phân biệt Reels vs post thường nếu dữ liệu đủ.

### G) Recommendations (Daily Brief)

- **FR-014 (MVP):** Daily Brief mỗi ngày cung cấp tối thiểu:
  - Top trending topics/pillars
  - Best time slots
  - Top post template (heuristics)
- **FR-015 (MVP):** Mỗi recommendation phải có lý do (metrics/velocity) để giải thích.

### H) Reporting

- **FR-016 (MVP):** User có thể export report theo date range (tối thiểu CSV).

### I) Post-MVP: Playbooks + Experiments

- **FR-017 (Growth):** Hệ thống tạo playbooks từ top posts/reels 14–30 ngày với recipe rõ ràng (format, caption bucket, CTA bucket, hashtag bucket, time bucket).
- **FR-018 (Growth):** Mỗi playbook tạo 3–5 variants để user thử.
- **FR-019 (Growth):** Hệ thống hỗ trợ experiments A/B/C và tính win rate.

### J) Post-MVP: Themes (Topic Clustering)

- **FR-020 (Growth):** Hệ thống cluster keyword/caption/hashtags thành themes.
- **FR-021 (Growth):** User có thể rename/merge/split themes.
- **FR-022 (Growth):** Trend list chuyển sang theme trending (noise-reduced).

---

## Non-Functional Requirements

### Performance

- **NFR-P1:** Dashboard/Daily Brief tải trong thời gian hợp lý cho 10–20 pages (mục tiêu < 3s trong điều kiện bình thường).

### Security

- **NFR-S1:** Không lưu secrets/token dưới dạng plaintext; giới hạn quyền truy cập theo nguyên tắc least-privilege.
- **NFR-S2:** Audit log tối thiểu cho các thao tác connect pages và thay đổi grouping/tag rules (post-MVP nếu cần).

### Scalability

- **NFR-C1:** Thiết kế ingestion theo job/queue để có thể mở rộng từ 20 pages → nhiều pages trong tương lai.

### Integration

- **NFR-I1:** Có cơ chế “backfill/retry” khi ingestion fail (MVP ở mức tối thiểu; nâng cấp sau).

---

## Implementation Planning

### Epic Breakdown Required

Sau PRD, bước tiếp theo là tách thành epics và stories.

**Next Step:** chạy workflow `create-epics-and-stories` để tạo `epics.md`.

---

## References

- Brainstorming session (source): `tht-analyst/docs/bmm-brainstorming-session-2025-12-13.md`

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow create-epics-and-stories`
2. **Architecture** - Run: `workflow create-architecture`
3. **(Optional) Validate PRD** - Run: `validate-prd`

---

_This PRD captures the essence of postiz-app - action-first daily brief + playbooks + themes for content optimization at scale._
