# Story 10.2: Xuất báo cáo PDF/PPT

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **export báo cáo dạng PDF/PPT** để **present cho stakeholders**.

## Acceptance Criteria

1. **Given** report data, **when** user yêu cầu PDF, **then** hệ thống tạo file với template chuyên nghiệp.
2. **Given** report data, **when** user yêu cầu PPT, **then** hệ thống tạo slides với charts và insights.
3. **Given** export options, **when** user cấu hình, **then** có thể tùy chỉnh branding (logo, màu).
4. **Given** file đã tạo, **when** export xong, **then** user tải ngay.

## Tasks / Subtasks

### Backend
- [ ] ReportExportService:
  - `exportToPDF(reportData, options)`
  - `exportToPPT(reportData, options)`
- [ ] PDF generation:
  - puppeteer hoặc pdfkit
  - Template chuyên nghiệp
- [ ] PPT generation:
  - pptxgenjs hoặc tương tự
  - Render charts
- [ ] Branding options:
  - Upload logo
  - Chọn màu

### Frontend
- [ ] ExportButton:
  - Chọn format (PDF/PPT)
  - Trigger download
- [ ] BrandingSettings:
  - Upload logo
  - Color picker

### Testing
- [ ] Unit: PDF generation
- [ ] Unit: PPT generation

## Dev Notes

**Libraries:** PDF (puppeteer/pdfkit/html-pdf), PPT (pptxgenjs).  
**Prereq:** Story 10.1 hoàn tất.  

[ASSUMPTION: Nếu backend chưa có lưu trữ logo/màu, tạm lưu trong cấu hình người dùng; nếu render chart khó trên PPT, có thể nhúng hình ảnh chart xuất từ frontend.] 
