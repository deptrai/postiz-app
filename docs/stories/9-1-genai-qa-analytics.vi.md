# Story 9.1: GenAI Q&A cho analytics

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **hỏi AI “vì sao KPI thay đổi?”** để **hiểu nguyên nhân và có hành động rõ ràng**.

## Acceptance Criteria

1. **Given** đã có analytics data, **when** user hỏi bằng ngôn ngữ tự nhiên, **then** AI trả lời dựa trên data kèm explainability.
2. **Given** phát hiện KPI thay đổi, **when** user hỏi “why did engagement drop?”, **then** AI phân tích và giải thích nguyên nhân khả dĩ.
3. **Given** AI response, **when** user xem chi tiết, **then** hiển thị data points hỗ trợ câu trả lời.
4. **Given** có history hội thoại, **when** user hỏi tiếp, **then** AI giữ ngữ cảnh.

## Tasks / Subtasks

### Backend
- [ ] AIAssistantService:
  - `askQuestion(orgId, question)`
  - Xây dựng analytics context cho LLM
  - Parse/format response
- [ ] LLM Integration:
  - OpenAI/Claude API
  - Prompt engineering cho analytics
  - Rate limiting & cost control
- [ ] Conversation Context:
  - Lưu history hội thoại
  - Đưa context vào prompt
- [ ] API:
  - POST /api/ai/ask
  - GET /api/ai/history

### Frontend
- [ ] AIChat:
  - Giao diện chat, bubbles
  - Visualization dữ liệu trong câu trả lời
- [ ] QuickQuestions:
  - Câu hỏi gợi ý, one-click ask

### Testing
- [ ] Unit: build context
- [ ] Unit: parse response

## Dev Notes

**LLM:** OpenAI GPT-4 hoặc Claude  
**Prompt:** include metrics liên quan, format kết quả, yêu cầu giải thích.  
**Cost:** rate limit per user, cache câu hỏi phổ biến, giới hạn token/request.  

[ASSUMPTION: User đã cấu hình API key cho LLM provider; nếu không, trả hướng dẫn cấu hình trước khi trả lời.] 
