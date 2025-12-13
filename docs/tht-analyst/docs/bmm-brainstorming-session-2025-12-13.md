# Brainstorming Session Results

**Session Date:** 2025-12-13
**Facilitator:** Business Analyst Mary
**Participant:** Luis

## Executive Summary

**Topic:** Build a system to analyze content performance and audience behavior across many Facebook Pages, to optimize content toward trends and audience preferences, maximizing views and engagement.

**Session Goals:**
- Ship an MVP in **2 weeks** for **10–20 priority Pages**.
- Provide a **daily brief** that helps decide what to post (topic/pillar), when to post (time slots), and which format/hook to use.
- Post-MVP priorities:
  - **Playbook Recommendations** (copy formulas from top posts, generate variants, run experiments).
  - **Topic Clustering/Themes** (smarter trend detection beyond raw keywords).

**Techniques Used:** Mind Mapping → Question Storming → SCAMPER

**Total Ideas Generated:** N/A (structured roadmap + feature set)

### Key Themes Identified:
- Content performance must be actionable: **insight → recommendation → execution** (daily brief).
- Scale management requires first-class support for **Page Groups / Niches**.
- “Trend” is best modeled as **velocity** (24–72h) on topics/themes + performance signals.
- Post-MVP differentiation comes from:
  - **Playbooks** (repeatable winning formulas with evidence)
  - **Themes** (noise-reduced topic intelligence)

## Technique Sessions

### 1) Mind Mapping (Product Map)

1. **Users & goal**
   - Single user (Leader/Owner)
   - North Star: maximize **views/reach** + **engagement** across all Pages.

2. **Data sources (MVP)**
   - Owned Pages: page-level + post/reel-level metrics.
   - Content metadata: caption text, hashtags, post type/format, publish time.
   - Optional (post-MVP): competitor Pages and benchmarks.

3. **Taxonomy / Content pillars**
   - Hybrid approach:
     - Auto tagging by keywords/topics.
     - Manual campaign/series tags.

4. **Primary metrics to optimize (MVP)**
   - Reach/Impressions (whichever is available)
   - Views (especially for Reels/videos)
   - Reactions, Comments, Shares
   - Engagement Rate = (reactions+comments+shares) / reach
   - Follower growth (proxy)
   - Link clicks (optional)

5. **Trend definition (MVP)**
   - Trend = increase in **velocity** over last 24–72h:
     - topic/keyword/theme frequency AND/OR
     - engagement rate + reach acceleration
   - Trend output is computed per **group/niche**.

6. **Recommendations output**
   - (D) All of:
     - What to post (pillar/theme)
     - When to post (time slots)
     - Which format/hook (Reels vs posts + heuristics)

7. **Dashboard scope**
   - View by: page / group / niche / campaign

8. **MVP boundary (2 weeks)**
   - Must-have: ingest + dashboard + taxonomy + trend ranking + daily brief + export.
   - Exclude: listening/sentiment, virality maps, heavy AI assistant, auto-publishing.

### 2) Question Storming (Top 10 “Gold Questions”)

These are the top questions the system must answer to support maximizing views + engagement:

1. Which posts/reels have the highest engagement rate in the last 7 days (by page and by group)?
2. Which topic/pillar drives the highest reach, and which drives the highest comments/shares?
3. Which formats win per niche/group (Reels vs video vs photo vs status)?
4. Which hook patterns correlate with higher engagement (caption length, CTA style, hashtag bucket)?
5. What are the best time slots for reach vs for comments/shares (and do they differ by niche)?
6. Which topics are trending by velocity in the last 24–72h across the page network?
7. Which trends are niche-specific (niche A up, niche B flat) for targeted reuse?
8. Are there early signals of “content fatigue” for a pillar/series?
9. What should be the top 3 pillars/themes to prioritize next week for fastest growth?
10. For virality, should we optimize share-first or view-first (and per niche)?

### 3) SCAMPER (Converge into a shippable 2-week MVP)

- **Substitute**
  - Replace heavy AI understanding with:
    - rule-based tagging + light keyword extraction
    - manual campaign tags
  - Replace enterprise trend intelligence with:
    - keyword velocity + performance velocity

- **Combine**
  - Reduce screens:
    - Dashboard
    - Insights (trends + best time + recommendations)
    - Settings

- **Adapt**
  - Borrow proven SaaS patterns:
    - content pillars + tagging (Socialinsider/Rival IQ)
    - scheduled reporting + team-ready dashboards (Emplifi/Metricool)

- **Modify**
  - Optimize for 1 leader managing many Pages:
    - group/niche is first-class
    - daily brief is the home screen

- **Eliminate**
  - No: social listening/sentiment, virality map, AI chat assistant, auto publishing.

- **Reverse**
  - Action-first UX: open app → see “3 things to do today”.

## MVP (2 weeks) — Proposed Deliverables

### Scope
- Start with **10–20 priority Pages**.
- Mix **Reels + regular posts**.
- Daily brief cadence (every morning).

### Minimal data model
- Page
- PageGroup / Niche
- Post (type/format, caption, hashtags, publishedAt)
- PostMetricsDaily (reach/impressions, reactions, comments, shares, clicks/views if available)
- Tags (auto topic tags, manual campaign tags)

### Ingestion cadence
- Daily pull (sufficient for 24–72h trend).
- Optional: higher frequency for priority pages later.

### Screens
1. **Dashboard**
   - Filters: page/group/niche/date range/format/pillar
   - Cards: reach/views, engagement, engagement rate
   - Table: top posts/reels

2. **Insights**
   - Trending topics/pillars (velocity)
   - Best time to post (basic heatmap)
   - Recommendations (top 3–5)

3. **Settings**
   - Connect pages
   - Define groups/niches
   - Tag rules/dictionary (optional in MVP)

### Daily Brief (MVP v0)
- Today’s Top Topics/Pillars (by velocity)
- Today’s Best Time Slots (by group/niche; optionally separate Reels vs posts)
- Today’s Top Post Template (from best-performing posts)

### Success Metrics
- Reduce daily content decision time to <5 minutes/day.
- Improve engagement rate and reach/views after 2–4 weeks of usage.

## Post-MVP Roadmap (Priorities: Playbooks + Themes)

### V1-A (Week 3): Playbook Recommendations v1
- Generate playbooks from top posts (14–30 days), split by:
  - Reels playbooks
  - Post playbooks
- Each playbook contains:
  - Recipe: format + caption length bucket + CTA bucket + hashtag bucket + time bucket
  - Evidence: median reach/views, median engagement rate, consistency score
  - Actions: 3–5 variants (hook/time/hashtags)

### V1-B (Week 4): Experiments loop
- Turn playbook variants into experiments (A/B/C)
- Track results (24–72h and 7-day rollup)
- Update playbook score and win rate

### V1-C (Weeks 5–6): Topic Clustering / Themes
- Cluster captions/hashtags into themes
- Theme manager: rename/merge/split
- Replace keyword-trending with theme-trending
- Daily brief upgraded:
  - Top themes + matching recommended playbooks

## Risks / Assumptions
- Data access rate limits and token stability; MVP mitigates by limiting to 10–20 pages.
- “Audience behavior” depth depends on what metrics are available; MVP focuses on behavioral proxies (views/reach/engagement).
- Trend quality initially heuristic; improves via theme clustering and manual theme curation.

---

_This document was produced from the BMAD brainstorming facilitation process._
