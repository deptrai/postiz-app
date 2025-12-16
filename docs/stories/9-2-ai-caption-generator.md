# Story 9.2: AI Caption Generator

Status: ready-for-dev

## Story

As a **Leader**,
I want **AI tạo caption từ playbook templates**,
So that **tôi tiết kiệm thời gian viết content**.

## Acceptance Criteria

1. **Given** playbook template,
   **When** user request caption generation,
   **Then** AI tạo 3-5 variants với tone/style customizable.

2. **Given** generated captions,
   **When** user xem options,
   **Then** hiển thị với preview và edit capability.

3. **Given** caption variants,
   **When** user select one,
   **Then** có thể copy hoặc apply to draft.

4. **Given** generation history,
   **When** user xem history,
   **Then** có thể reuse past generations.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend AIAssistantService (AC: #1)
  - [ ] Implement `generateCaptions(playbook, options)` method
  - [ ] Support tone/style parameters
  - [ ] Generate multiple variants

- [ ] Add Caption Templates (AC: #1)
  - [ ] Build prompts from playbook data
  - [ ] Include hashtag suggestions

- [ ] Add Generation History (AC: #4)
  - [ ] Store generated captions
  - [ ] Link to playbooks

### Frontend Implementation

- [ ] Create CaptionGenerator component (AC: #1, #2)
  - [ ] Playbook selector
  - [ ] Tone/style options
  - [ ] Generate button

- [ ] Create CaptionVariants component (AC: #2, #3)
  - [ ] Variant cards
  - [ ] Edit inline
  - [ ] Copy/Apply buttons

### Testing

- [ ] Unit test: Caption generation
- [ ] Unit test: Variant formatting

## Dev Notes

**Tone Options:**
- Casual, Professional, Humorous, Educational, Inspirational

**Style Options:**
- Short & punchy, Storytelling, Question-based, List format

**Prerequisites:** Story 9.1 complete, Epic 6 complete

### References

- [Source: docs/epics.md#Story-9.2]

## Change Log

- 2025-12-14: Story 9.2 drafted
