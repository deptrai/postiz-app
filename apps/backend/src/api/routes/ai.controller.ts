import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { AIAssistantService } from '@gitroom/nestjs-libraries/database/prisma/ai/ai-assistant.service';

class AskQuestionDto {
  question: string;
  integrationId?: string;
}

@Controller('/ai')
export class AIController {
  constructor(private _aiAssistantService: AIAssistantService) {}

  @Post('/ask')
  async askQuestion(
    @GetOrgFromRequest() organizationId: string,
    @GetUserFromRequest('id') userId: string,
    @Body() body: AskQuestionDto
  ) {
    const result = await this._aiAssistantService.askQuestion(
      organizationId,
      userId,
      body.question,
      body.integrationId
    );

    return {
      answer: result.answer,
      tokensUsed: result.tokensUsed,
      suggestedQuestions: this._aiAssistantService.getSuggestedQuestions(result.context),
    };
  }

  @Get('/history')
  async getHistory(
    @GetOrgFromRequest() organizationId: string,
    @GetUserFromRequest('id') userId: string,
    @Query('limit') limit?: string
  ) {
    const conversations = await this._aiAssistantService.getConversationHistory(
      organizationId,
      userId,
      limit ? parseInt(limit, 10) : 20
    );

    return { conversations };
  }

  @Get('/suggested-questions')
  async getSuggestedQuestions(
    @GetOrgFromRequest() organizationId: string,
    @Query('integrationId') integrationId?: string
  ) {
    const context = await this._aiAssistantService.buildAnalyticsContext(
      organizationId,
      integrationId
    );

    return {
      questions: this._aiAssistantService.getSuggestedQuestions(context),
    };
  }
}
