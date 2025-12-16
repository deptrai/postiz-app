# Đề Xuất Tính Năng Cải Tiến - postiz-app

**Ngày:** 2025-12-14
**Analyst:** Mary (Business Analyst)
**Yêu cầu từ:** Luis

---

## Tóm Tắt Nghiên Cứu

### Phân Tích Hiện Trạng

**Đã hoàn thành (7 Epics):**
- Epic 1-5: MVP Foundation, Ingestion, Dashboard, Insights, Export
- Epic 6: Playbooks + Experiments (Growth)
- Epic 7: Themes/Topic Clustering (Growth)

**Tính năng đề cập trong PRD nhưng chưa triển khai:**
1. Alerts/anomaly detection (tụt KPI/spike bất thường)
2. Competitor benchmarking (light)
3. Report automation (email/telegram)
4. GenAI Q&A "vì sao KPI thay đổi?"
5. Social listening/sentiment theo niche

### Nghiên Cứu Thị Trường

**Nguồn tham khảo:**
- Zapier: "The 8 best AI tools for social media management in 2025"
- FeedHive, Sprout Social, Buffer, Hootsuite features analysis

**Xu hướng AI Social Media 2025:**
1. **AI Content Generation** - Tạo posts, carousels, videos từ prompts
2. **Content Recycling** - Tái sử dụng top content tự động
3. **Performance Prediction** - ML dự đoán hiệu suất trước khi đăng
4. **Sentiment Analysis** - Phân tích cảm xúc audience
5. **AI Copilot** - Chat assistant cho insights
6. **Automated Reporting** - Báo cáo tự động qua email

---

## Đề Xuất Epic 8-12

### Epic 8: Alerts & Anomaly Detection ⚡
**Ưu tiên: CAO**

**Mục tiêu:** Phát hiện và cảnh báo kịp thời khi KPI thay đổi bất thường.

**Stories đề xuất:**

#### Story 8.1: KPI Drop Alerts
As a **Leader**,
I want **nhận cảnh báo khi KPI tụt đột ngột**,
So that **tôi có thể phản ứng nhanh và điều chỉnh chiến lược**.

**Acceptance Criteria:**
- Cảnh báo khi engagement rate giảm >20% so với 7 ngày trước
- Cảnh báo khi reach giảm >30% so với tuần trước
- Configurable thresholds theo group/niche

#### Story 8.2: Viral Spike Detection
As a **Leader**,
I want **phát hiện content đang viral**,
So that **tôi có thể tận dụng momentum và tạo content tương tự**.

**Acceptance Criteria:**
- Phát hiện spike >200% engagement trong 24h
- Highlight viral content trên dashboard
- Gợi ý tạo content follow-up

#### Story 8.3: Notification Channels
As a **Leader**,
I want **nhận alerts qua email/telegram**,
So that **tôi không bỏ lỡ thông tin quan trọng**.

**Acceptance Criteria:**
- Email notifications với summary
- Telegram bot integration
- Configurable notification preferences

---

### Epic 9: AI Content Assistant 🤖
**Ưu tiên: CAO**

**Mục tiêu:** Tích hợp GenAI để hỗ trợ phân tích và tạo content.

**Stories đề xuất:**

#### Story 9.1: GenAI Q&A Analytics
As a **Leader**,
I want **hỏi AI "vì sao KPI thay đổi?"**,
So that **tôi hiểu nguyên nhân và có action rõ ràng**.

**Acceptance Criteria:**
- Natural language queries về analytics data
- AI giải thích trends và anomalies
- Gợi ý actions dựa trên data

#### Story 9.2: AI Caption Generator
As a **Leader**,
I want **AI tạo caption từ playbook templates**,
So that **tôi tiết kiệm thời gian viết content**.

**Acceptance Criteria:**
- Generate 3-5 caption variants từ playbook
- Customize theo tone/style
- Include hashtag suggestions

#### Story 9.3: Hook Optimizer
As a **Leader**,
I want **AI gợi ý hooks hiệu quả**,
So that **content của tôi thu hút hơn**.

**Acceptance Criteria:**
- Analyze top-performing hooks
- Generate hook variants
- A/B test suggestions

---

### Epic 10: Report Automation 📊
**Ưu tiên: TRUNG BÌNH**

**Mục tiêu:** Tự động hóa việc tạo và gửi báo cáo.

**Stories đề xuất:**

#### Story 10.1: Scheduled Reports
As a **Leader**,
I want **báo cáo tự động theo lịch**,
So that **tôi và team luôn có data cập nhật**.

**Acceptance Criteria:**
- Daily/Weekly/Monthly schedules
- Configurable report content
- Multiple recipients

#### Story 10.2: PDF/PPT Export
As a **Leader**,
I want **export báo cáo dạng PDF/PPT**,
So that **tôi có thể present cho stakeholders**.

**Acceptance Criteria:**
- Professional PDF templates
- PPT với charts và insights
- Branding customization

#### Story 10.3: Telegram Bot Reports
As a **Leader**,
I want **nhận báo cáo qua Telegram**,
So that **tôi xem nhanh trên mobile**.

**Acceptance Criteria:**
- Daily brief qua Telegram
- Interactive commands
- Quick stats on demand

---

### Epic 11: Competitor Benchmarking 🔍
**Ưu tiên: TRUNG BÌNH**

**Mục tiêu:** So sánh hiệu suất với competitors (public data).

**Stories đề xuất:**

#### Story 11.1: Competitor Tracking
As a **Leader**,
I want **theo dõi competitor pages**,
So that **tôi biết họ đang làm gì**.

**Acceptance Criteria:**
- Add competitor pages (public)
- Track posting frequency
- Monitor engagement patterns

#### Story 11.2: Benchmark Comparison
As a **Leader**,
I want **so sánh metrics với competitors**,
So that **tôi biết mình đang ở đâu**.

**Acceptance Criteria:**
- Side-by-side comparison
- Engagement rate benchmarks
- Content type analysis

#### Story 11.3: Competitor Trend Analysis
As a **Leader**,
I want **phát hiện trends từ competitors**,
So that **tôi không bỏ lỡ cơ hội**.

**Acceptance Criteria:**
- Identify competitor top content
- Detect emerging topics
- Gap analysis suggestions

---

### Epic 12: Content Recycling & Repurposing ♻️
**Ưu tiên: THẤP**

**Mục tiêu:** Tối ưu hóa việc tái sử dụng content hiệu quả.

**Stories đề xuất:**

#### Story 12.1: Evergreen Content Detection
As a **Leader**,
I want **phát hiện evergreen content**,
So that **tôi có thể repost hiệu quả**.

**Acceptance Criteria:**
- Identify content với consistent performance
- Suggest repost timing
- Track repost performance

#### Story 12.2: Content Refresh Suggestions
As a **Leader**,
I want **gợi ý refresh old content**,
So that **content cũ vẫn relevant**.

**Acceptance Criteria:**
- Identify outdated but high-potential content
- Suggest updates (caption, hashtags)
- Track refreshed content performance

#### Story 12.3: Cross-Platform Adaptation
As a **Leader**,
I want **adapt content cho nhiều platforms**,
So that **tôi maximize reach**.

**Acceptance Criteria:**
- Suggest platform-specific adaptations
- Resize/reformat recommendations
- Track cross-platform performance

---

## Ma Trận Ưu Tiên

| Epic | Tên | Ưu tiên | Effort | Impact | Đề xuất Sprint |
|------|-----|---------|--------|--------|----------------|
| 8 | Alerts & Anomaly Detection | CAO | Medium | High | Sprint 3 |
| 9 | AI Content Assistant | CAO | High | High | Sprint 4-5 |
| 10 | Report Automation | TRUNG BÌNH | Medium | Medium | Sprint 6 |
| 11 | Competitor Benchmarking | TRUNG BÌNH | High | Medium | Sprint 7 |
| 12 | Content Recycling | THẤP | Medium | Low | Sprint 8 |

---

## Khuyến Nghị

### Giai đoạn 1 (Ngắn hạn - 2-4 tuần)
**Epic 8: Alerts & Anomaly Detection**
- Giá trị cao, effort vừa phải
- Tận dụng data đã có
- Tăng engagement với sản phẩm

### Giai đoạn 2 (Trung hạn - 4-8 tuần)
**Epic 9: AI Content Assistant**
- Differentiator lớn
- Cần tích hợp LLM (OpenAI/Claude)
- Tăng giá trị sản phẩm đáng kể

### Giai đoạn 3 (Dài hạn - 8+ tuần)
**Epic 10-12: Automation & Benchmarking**
- Nice-to-have features
- Tăng stickiness
- Mở rộng use cases

---

## Technical Considerations

### Epic 8 (Alerts)
- Cần background job để check thresholds
- Notification service (email, telegram)
- Alert history và acknowledgment

### Epic 9 (AI Assistant)
- OpenAI/Claude API integration
- Prompt engineering cho analytics context
- Rate limiting và cost management

### Epic 10 (Reports)
- PDF generation (puppeteer/pdfkit)
- Email service (SendGrid/SES)
- Telegram Bot API

### Epic 11 (Competitors)
- Public data scraping considerations
- Rate limiting và caching
- Data freshness management

---

## Next Steps

1. **Review với Luis** - Xác nhận priorities
2. **Chọn Epic 8** - Bắt đầu với Alerts (nếu đồng ý)
3. **Tạo stories chi tiết** - Dùng workflow `create-story`
4. **Estimate effort** - Planning poker

---

---

## Phần 2: Đề Xuất Tính Năng Monetization & Viral Content

**Ngày cập nhật:** 2025-12-14
**Yêu cầu từ:** Luis - Focus vào tăng chất lượng Page để bật kiếm tiền và viral content

---

### Nghiên Cứu Facebook Monetization 2025

**Nguồn tham khảo:**
- Rising Creator: "Facebook Monetization in 2025: A Complete Guide"
- Stack Influence: "2025 Social Media Algorithm Changes"

**Yêu cầu Monetization theo Feature:**

| Feature | Followers | Watch Time | Khác |
|---------|-----------|------------|------|
| **In-Stream Ads** | 10,000 | 30,000 one-minute views (videos >3 min) trong 60 ngày | - |
| **Reels Monetization** | - | 600,000 viewed minutes | 5+ videos |
| **Stars** | 500 (30 ngày liên tục) | - | - |
| **Fan Subscription** | 10,000 hoặc 250+ return viewers | 180,000 minutes watched | 50,000 engagements |
| **Performance Bonus** | - | - | Up to 3,000 posts, max $30,000 |

**Yếu Tố Viral Content 2025:**

1. **Watch Time** - Yếu tố #1, đặc biệt retention rate
2. **Saves & Shares** - Quan trọng hơn likes
3. **Comments & Conversations** - Tương tác thực sự
4. **Early Engagement** - Engagement trong 1 giờ đầu
5. **Hook trong 3 giây đầu** - Giữ người xem
6. **Short-form Video** - Reels/Shorts được ưu tiên
7. **Avoid Engagement Bait** - Facebook phạt clickbait

---

### Epic 13: Monetization Readiness Tracker 💰
**Ưu tiên: RẤT CAO**

**Mục tiêu:** Theo dõi tiến độ đạt điều kiện monetization và gợi ý cách đạt nhanh hơn.

**Stories đề xuất:**

#### Story 13.1: Monetization Dashboard
As a **Leader**,
I want **dashboard hiển thị tiến độ monetization**,
So that **tôi biết còn thiếu gì để bật kiếm tiền**.

**Acceptance Criteria:**
- Hiển thị progress bars cho: followers, watch time, engagement
- So sánh với thresholds của từng monetization feature
- Estimated time to eligibility

#### Story 13.2: Gap Analysis & Recommendations
As a **Leader**,
I want **phân tích gap và gợi ý cách đạt eligibility**,
So that **tôi có action plan rõ ràng**.

**Acceptance Criteria:**
- "Bạn cần thêm X followers, Y watch minutes"
- Gợi ý content types để tăng watch time
- Gợi ý posting frequency tối ưu

#### Story 13.3: Monetization Alerts
As a **Leader**,
I want **nhận thông báo khi gần đạt eligibility**,
So that **tôi không bỏ lỡ cơ hội**.

**Acceptance Criteria:**
- Alert khi đạt 80%, 90%, 100% thresholds
- Celebration notification khi eligible
- Warning nếu metrics đang giảm

---

### Epic 14: Viral Content Optimizer 🚀
**Ưu tiên: RẤT CAO**

**Mục tiêu:** Dự đoán và tối ưu viral potential của content.

**Stories đề xuất:**

#### Story 14.1: Viral Score Prediction
As a **Leader**,
I want **dự đoán viral score trước khi đăng**,
So that **tôi biết content nào có tiềm năng cao**.

**Acceptance Criteria:**
- Viral score 0-100 dựa trên historical data
- Factors: hook, caption, hashtags, timing, format
- Comparison với top-performing content

#### Story 14.2: Hook Analyzer
As a **Leader**,
I want **phân tích hook effectiveness**,
So that **tôi tạo hooks thu hút hơn**.

**Acceptance Criteria:**
- Analyze 3 giây đầu của video
- Compare với hooks của viral content
- Gợi ý hook patterns hiệu quả

#### Story 14.3: Optimal Viral Timing
As a **Leader**,
I want **biết thời điểm tốt nhất để viral**,
So that **tôi maximize reach potential**.

**Acceptance Criteria:**
- Analyze historical viral content timing
- Factor in audience activity patterns
- Recommend posting windows cho viral potential

#### Story 14.4: Content Elements Analysis
As a **Leader**,
I want **phân tích elements của viral content**,
So that **tôi có thể replicate success**.

**Acceptance Criteria:**
- Caption length và style analysis
- Hashtag effectiveness scoring
- Format comparison (Reels vs Post vs Live)
- CTA effectiveness

---

### Epic 15: Video Performance Analyzer 🎬
**Ưu tiên: CAO**

**Mục tiêu:** Phân tích sâu hiệu suất video để tối ưu watch time.

**Stories đề xuất:**

#### Story 15.1: Watch Time Analytics
As a **Leader**,
I want **analytics chi tiết về watch time**,
So that **tôi hiểu viewer behavior**.

**Acceptance Criteria:**
- Total watch time per video
- Average view duration
- Completion rate
- Replay rate

#### Story 15.2: Retention Curve Analysis
As a **Leader**,
I want **xem retention curve của video**,
So that **tôi biết điểm drop-off**.

**Acceptance Criteria:**
- Visual retention graph
- Identify drop-off points
- Compare với benchmark
- Gợi ý improvements

#### Story 15.3: Video Length Optimization
As a **Leader**,
I want **biết video length tối ưu**,
So that **tôi maximize engagement**.

**Acceptance Criteria:**
- Analyze performance by video length
- Recommend optimal length per format
- Compare với niche benchmarks

#### Story 15.4: Thumbnail Effectiveness
As a **Leader**,
I want **đánh giá thumbnail effectiveness**,
So that **tôi tăng click-through rate**.

**Acceptance Criteria:**
- CTR analysis per thumbnail style
- A/B test suggestions
- Best practices recommendations

---

### Epic 16: Content Quality Scoring 📊
**Ưu tiên: CAO**

**Mục tiêu:** Đánh giá chất lượng content để đảm bảo monetization compliance.

**Stories đề xuất:**

#### Story 16.1: Quality Score Dashboard
As a **Leader**,
I want **quality score cho mỗi post/video**,
So that **tôi biết content nào cần cải thiện**.

**Acceptance Criteria:**
- Overall quality score 0-100
- Breakdown: engagement, watch time, compliance
- Trend over time

#### Story 16.2: Engagement Bait Detection
As a **Leader**,
I want **phát hiện engagement bait**,
So that **tôi tránh bị Facebook phạt**.

**Acceptance Criteria:**
- Detect clickbait patterns
- Flag "LIKE this! SHARE now!" type content
- Suggest authentic alternatives

#### Story 16.3: Policy Compliance Check
As a **Leader**,
I want **check policy compliance trước khi đăng**,
So that **tôi không mất monetization eligibility**.

**Acceptance Criteria:**
- Check Partner Monetization Policies
- Check Content Monetization Policies
- Flag potential violations
- Suggest fixes

#### Story 16.4: Advertiser-Friendly Scoring
As a **Leader**,
I want **biết content có advertiser-friendly không**,
So that **tôi maximize ad revenue**.

**Acceptance Criteria:**
- Score content cho ad suitability
- Flag sensitive topics
- Recommend adjustments

---

## Ma Trận Ưu Tiên Cập Nhật (Bao gồm Monetization & Viral)

| Epic | Tên | Ưu tiên | Effort | Impact | Đề xuất Sprint |
|------|-----|---------|--------|--------|----------------|
| **13** | Monetization Readiness Tracker | ⚡ RẤT CAO | Medium | Very High | Sprint 3 |
| **14** | Viral Content Optimizer | ⚡ RẤT CAO | High | Very High | Sprint 4 |
| **15** | Video Performance Analyzer | 🔥 CAO | Medium | High | Sprint 5 |
| **16** | Content Quality Scoring | 🔥 CAO | Medium | High | Sprint 6 |
| 8 | Alerts & Anomaly Detection | 🔥 CAO | Medium | High | Sprint 7 |
| 9 | AI Content Assistant | 🔥 CAO | High | High | Sprint 8-9 |
| 10 | Report Automation | 📊 TRUNG BÌNH | Medium | Medium | Sprint 10 |
| 11 | Competitor Benchmarking | 📊 TRUNG BÌNH | High | Medium | Sprint 11 |
| 12 | Content Recycling | ♻️ THẤP | Medium | Low | Sprint 12 |

---

## Khuyến Nghị Roadmap Cập Nhật

### Phase 1: Monetization Foundation (4-6 tuần)
**Epic 13 + 14**
- Monetization Readiness Tracker
- Viral Content Optimizer
- **Giá trị:** Giúp users đạt monetization nhanh hơn

### Phase 2: Content Excellence (4-6 tuần)
**Epic 15 + 16**
- Video Performance Analyzer
- Content Quality Scoring
- **Giá trị:** Tăng chất lượng content, tránh violations

### Phase 3: Automation & Intelligence (6-8 tuần)
**Epic 8 + 9**
- Alerts & Anomaly Detection
- AI Content Assistant
- **Giá trị:** Proactive insights và AI support

### Phase 4: Advanced Features (8+ tuần)
**Epic 10-12**
- Report Automation
- Competitor Benchmarking
- Content Recycling
- **Giá trị:** Enterprise features

---

## Technical Considerations cho Monetization & Viral

### Epic 13 (Monetization Tracker)
- Cần track: followers count, watch time, engagement metrics
- Progress calculation logic
- Threshold configuration per monetization type

### Epic 14 (Viral Optimizer)
- ML model cho viral prediction (hoặc rule-based MVP)
- Hook analysis (video first 3 seconds)
- Historical viral content database

### Epic 15 (Video Analyzer)
- Retention curve data (nếu Facebook API cung cấp)
- Video metadata analysis
- Benchmark database per niche

### Epic 16 (Quality Scoring)
- NLP cho engagement bait detection
- Policy rules engine
- Content classification

---

---

## Phần 3: Review & Đánh Giá Toàn Bộ Đề Xuất

**Ngày review:** 2025-12-14
**Reviewer:** Mary (Business Analyst)

---

### Tổng Quan Review

| Epic | Tên | Feasibility | Business Value | Complexity | Status |
|------|-----|-------------|----------------|------------|--------|
| 8 | Alerts & Anomaly Detection | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ APPROVED |
| 9 | AI Content Assistant | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ APPROVED (MVP) |
| 10 | Report Automation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ✅ APPROVED |
| 11 | Competitor Benchmarking | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ NEEDS REVISION |
| 12 | Content Recycling | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ✅ APPROVED |
| **13** | Monetization Readiness Tracker | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ **TOP PRIORITY** |
| 14 | Viral Content Optimizer | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ APPROVED (rule-based MVP) |
| 15 | Video Performance Analyzer | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ NEEDS REVISION |
| 16 | Content Quality Scoring | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ APPROVED (rule-based MVP) |

---

### Chi Tiết Review Từng Epic

#### Epic 8: Alerts & Anomaly Detection ✅
**Status: APPROVED**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 5/5 | Có data sẵn, logic threshold đơn giản |
| Business Value | 4/5 | Proactive monitoring, tăng engagement với app |
| Technical Complexity | 3/5 | Background jobs, notification service |
| Dependencies | None | Dùng data từ Epic 1-7 |

**Đề xuất:** Triển khai như đề xuất, không cần điều chỉnh.

---

#### Epic 9: AI Content Assistant ✅ (MVP)
**Status: APPROVED với MVP scope**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 3/5 | Cần LLM integration (OpenAI/Claude) |
| Business Value | 5/5 | Major differentiator, high user value |
| Technical Complexity | 5/5 | Prompt engineering, cost management, rate limiting |
| Dependencies | OpenAI/Claude API, API key management |

**Đề xuất điều chỉnh:**
- MVP: Chỉ GenAI Q&A cho analytics (Story 9.1)
- Phase 2: Caption generator và hook optimizer
- Cần budget cho API costs

---

#### Epic 10: Report Automation ✅
**Status: APPROVED**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 5/5 | Standard feature, nhiều libraries hỗ trợ |
| Business Value | 3/5 | Nice-to-have, không critical |
| Technical Complexity | 3/5 | PDF generation, email service |
| Dependencies | SendGrid/SES, PDF library |

**Đề xuất:** Triển khai như đề xuất, ưu tiên thấp hơn.

---

#### Epic 11: Competitor Benchmarking ⚠️
**Status: NEEDS REVISION**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 2/5 | Legal concerns với scraping competitor data |
| Business Value | 3/5 | Useful nhưng có alternatives |
| Technical Complexity | 4/5 | Data scraping, ToS compliance |
| Dependencies | None |

**Vấn đề:**
- Scraping Facebook Pages có thể vi phạm ToS
- Legal risks với competitor data
- Data freshness khó đảm bảo

**Đề xuất điều chỉnh:**
- **Đổi thành "Industry Benchmarking"**
- Dùng industry averages thay vì competitor-specific data
- User tự nhập competitor metrics (manual)
- Hoặc chỉ compare với own historical data

---

#### Epic 12: Content Recycling ✅
**Status: APPROVED**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 4/5 | Logic đơn giản, dùng historical data |
| Business Value | 3/5 | Useful cho content planning |
| Technical Complexity | 3/5 | Pattern detection, scheduling logic |
| Dependencies | None |

**Đề xuất:** Triển khai như đề xuất, ưu tiên thấp.

---

#### Epic 13: Monetization Readiness Tracker ✅ ⭐
**Status: TOP PRIORITY**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 5/5 | Calculation logic đơn giản |
| Business Value | 5/5 | Core user need, direct revenue impact |
| Technical Complexity | 3/5 | Progress tracking, threshold config |
| Dependencies | Facebook API data (đã có từ Epic 2) |

**Đề xuất:** 
- **Ưu tiên #1** - Triển khai đầu tiên
- Merge Story 15.1 (Watch Time Analytics) vào Epic này
- High impact, low effort

---

#### Epic 14: Viral Content Optimizer ✅ (Rule-based MVP)
**Status: APPROVED với rule-based MVP**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 3/5 | ML prediction phức tạp, rule-based khả thi |
| Business Value | 5/5 | High user value, competitive advantage |
| Technical Complexity | 4/5 | ML model hoặc rule engine |
| Dependencies | Historical viral content data |

**Đề xuất điều chỉnh:**
- MVP: Rule-based scoring (không ML)
- Factors: engagement rate, timing, format, hashtags
- Phase 2: ML model nếu có đủ data

---

#### Epic 15: Video Performance Analyzer ⚠️
**Status: NEEDS REVISION**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 3/5 | Phụ thuộc Facebook API availability |
| Business Value | 4/5 | Useful cho video optimization |
| Technical Complexity | 3/5 | Data visualization, analysis |
| Dependencies | Facebook Video Insights API |

**Vấn đề:**
- Retention curve data có thể không available qua API
- Thumbnail CTR cần A/B testing infrastructure

**Đề xuất điều chỉnh:**
- **Merge vào Epic 13** (Watch Time là core của monetization)
- Story 15.1 (Watch Time) → Epic 13
- Story 15.2-15.4 → Future enhancement khi có API data

---

#### Epic 16: Content Quality Scoring ✅ (Rule-based MVP)
**Status: APPROVED với rule-based MVP**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | 3/5 | NLP cho bait detection phức tạp |
| Business Value | 4/5 | Protect monetization eligibility |
| Technical Complexity | 4/5 | NLP, policy rules engine |
| Dependencies | None |

**Đề xuất điều chỉnh:**
- MVP: Rule-based detection (keyword patterns)
- Engagement bait patterns: "LIKE this!", "SHARE now!", etc.
- Phase 2: NLP model cho advanced detection

---

### Roadmap Điều Chỉnh Sau Review

| Phase | Epics | Timeline | Focus | Effort |
|-------|-------|----------|-------|--------|
| **1** | 13 (+ 15.1) | 2-3 tuần | Monetization Tracker + Watch Time | Medium |
| **2** | 14 + 16 | 3-4 tuần | Viral Optimizer + Quality Scoring | High |
| **3** | 8 | 2 tuần | Alerts & Anomaly | Medium |
| **4** | 9 (MVP) | 3-4 tuần | AI Q&A Assistant | High |
| **5** | 10 + 12 | 3 tuần | Reports + Recycling | Medium |
| **6** | 11 (revised) | 2-3 tuần | Industry Benchmarks | Medium |

**Tổng timeline ước tính:** 15-19 tuần (~4-5 tháng)

---

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Facebook API limitations | High | Medium | Fallback to available data, manual input |
| LLM API costs (Epic 9) | Medium | High | Rate limiting, caching, budget alerts |
| Legal issues (Epic 11) | High | Medium | Use industry averages, avoid scraping |
| ML model accuracy (Epic 14) | Medium | Medium | Start with rule-based, iterate |

---

### Final Recommendations

1. **Bắt đầu với Epic 13** - Monetization Tracker
   - Highest value, lowest risk
   - Direct impact on user revenue

2. **Combine Epic 13 + 15.1** - Watch Time là core của monetization

3. **Revise Epic 11** - Industry Benchmarks thay vì Competitor Scraping

4. **MVP approach cho Epic 9, 14, 16** - Rule-based trước, ML sau

5. **Budget cho Epic 9** - Cần estimate API costs trước khi triển khai

---

_Review hoàn thành bởi Mary (Business Analyst) - 2025-12-14_
