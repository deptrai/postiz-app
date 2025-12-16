# Story 6.2 UI Testing Guide

## Quick Test Steps

### 1. Open Playbooks Page
- URL: http://localhost:4200/playbooks
- Expected: See playbook "post Playbook - 2025-12-15"

### 2. Open Playbook Detail
- Click playbook card
- Expected: Modal opens showing recipe details

### 3. Generate Variants
- Scroll to bottom "Variants" section
- Click "Generate Variants" button
- Expected: 5 variants appear

### 4. Verify Variants Display
Expected variants:
- Hook Variation A (type: hook)
- Hook Variation B (type: hook)
- Time Variation A (type: time)
- Time Variation B (type: time)
- Hashtag Variation (type: hashtag)

### 5. Test Copy Button
- Click "Copy" on any variant
- Expected: Alert "Recipe copied to clipboard!"
- Paste to verify JSON recipe

## Acceptance Criteria Check
- AC1: 5 variants displayed ✅
- AC2: Name/type/description shown ✅
- AC3: Hook/time/hashtag covered ✅
- AC4: Copy button works ✅
- AC5: Story 6.3 (future) ⏳

## Result
Mark each test: ✅ PASS or ❌ FAIL
