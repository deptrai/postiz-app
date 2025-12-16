# Story 9.1: GenAI Q&A Analytics

Status: done

## Story

As a **Leader**,
I want **hỏi AI "vì sao KPI thay đổi?"**,
So that **tôi hiểu nguyên nhân và có action rõ ràng**.

## Acceptance Criteria

1. **Given** analytics data đã có,
   **When** user hỏi natural language question,
   **Then** AI trả lời dựa trên data với explainability.

2. **Given** KPI change detected,
   **When** user ask "why did engagement drop?",
   **Then** AI analyze và explain possible causes.

3. **Given** AI response,
   **When** user xem details,
   **Then** hiển thị data points supporting the answer.

4. **Given** conversation history,
   **When** user ask follow-up questions,
   **Then** AI maintain context.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AIAssistantService (AC: #1, #2)
  - [ ] Implement `askQuestion(organizationId, question)` method
  - [ ] Build analytics context for LLM
  - [ ] Parse and format response

- [ ] Add LLM Integration (AC: #1)
  - [ ] OpenAI/Claude API integration
  - [ ] Prompt engineering for analytics
  - [ ] Rate limiting và cost management

- [ ] Add Conversation Context (AC: #4)
  - [ ] Store conversation history
  - [ ] Include context in prompts

- [ ] Add AI API endpoints
  - [ ] POST /api/ai/ask - Ask question
  - [ ] GET /api/ai/history - Get conversation history

### Frontend Implementation

- [ ] Create AIChat component (AC: #1, #3)
  - [ ] Chat interface
  - [ ] Message bubbles
  - [ ] Data visualization in responses

- [ ] Create QuickQuestions component
  - [ ] Suggested questions
  - [ ] One-click ask

### Testing

- [ ] Unit test: Context building
- [ ] Unit test: Response parsing

## Dev Notes

**LLM Provider:** OpenAI GPT-4 hoặc Claude

**Prompt Engineering:**
- Include relevant metrics in context
- Specify response format
- Add explainability requirements

**Cost Management:**
- Rate limiting per user
- Caching common questions
- Token budget per request

**[ASSUMPTION]:** User has API key configured for LLM provider

### References

- [Source: docs/epics.md#Story-9.1]

## Change Log

- 2025-12-14: Story 9.1 drafted
