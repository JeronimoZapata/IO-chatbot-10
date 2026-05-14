import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class ModelProviderService {
  constructor(private readonly configService: ConfigService) {}

  async getChatModel(): Promise<BaseChatModel> {
    const rawProvider = this.configService.get<string>('AI_PROVIDER');
    if (!rawProvider) {
      throw new Error('AI_PROVIDER is required.');
    }

    const provider = rawProvider.toLowerCase();
    const model = this.configService.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
    const temperature = this.parseTemperature(this.configService.get<string>('AI_TEMPERATURE'));

    switch (provider) {
      case 'openai': {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
        }

        const { ChatOpenAI } = await import('@langchain/openai');
        return new ChatOpenAI({
          apiKey,
          model,
          temperature,
        });
      }
      case 'gemini': {
        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
        if (!apiKey) {
          throw new Error('GOOGLE_API_KEY is required when AI_PROVIDER=gemini');
        }

        return new ChatGoogleGenerativeAI({
          apiKey,
          model,
          temperature,
        });
      }
      // TODO: Add Anthropic provider.
      // TODO: Add Groq provider.
      // TODO: Add Ollama provider.
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private parseTemperature(value: string | undefined): number {
    if (!value) {
      return 0.2;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0.2;
    }

    return parsed;
  }
}
