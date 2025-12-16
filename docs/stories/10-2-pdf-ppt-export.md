# Story 10.2: PDF/PPT Export

Status: ready-for-dev

## Story

As a **Leader**,
I want **export báo cáo dạng PDF/PPT**,
So that **tôi có thể present cho stakeholders**.

## Acceptance Criteria

1. **Given** report data,
   **When** user request PDF export,
   **Then** hệ thống generate file với professional template.

2. **Given** report data,
   **When** user request PPT export,
   **Then** hệ thống generate slides với charts và insights.

3. **Given** export options,
   **When** user configure settings,
   **Then** có thể customize branding (logo, colors).

4. **Given** generated file,
   **When** export complete,
   **Then** user có thể download immediately.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ReportExportService (AC: #1, #2)
  - [ ] Implement `exportToPDF(reportData, options)` method
  - [ ] Implement `exportToPPT(reportData, options)` method

- [ ] Add PDF Generation (AC: #1)
  - [ ] Use puppeteer hoặc pdfkit
  - [ ] Professional template design

- [ ] Add PPT Generation (AC: #2)
  - [ ] Use pptxgenjs hoặc similar
  - [ ] Chart rendering

- [ ] Add Branding Options (AC: #3)
  - [ ] Logo upload
  - [ ] Color customization

### Frontend Implementation

- [ ] Create ExportButton component (AC: #4)
  - [ ] Format selector (PDF/PPT)
  - [ ] Download trigger

- [ ] Create BrandingSettings component (AC: #3)
  - [ ] Logo upload
  - [ ] Color picker

### Testing

- [ ] Unit test: PDF generation
- [ ] Unit test: PPT generation

## Dev Notes

**Libraries:**
- PDF: puppeteer, pdfkit, or html-pdf
- PPT: pptxgenjs

**Prerequisites:** Story 10.1 complete

### References

- [Source: docs/epics.md#Story-10.2]

## Change Log

- 2025-12-14: Story 10.2 drafted
