import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { ModelProviderService } from './model-provider.service';

type ConfigValues = Record<string, string | undefined>;

const createService = (values: ConfigValues) => {
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;

  return new ModelProviderService(configService);
};

describe('ModelProviderService', () => {
  it('creates a Gemini chat model when AI_PROVIDER is gemini', async () => {
    const service = createService({
      AI_PROVIDER: 'gemini',
      AI_MODEL: 'gemini-2.5-flash',
      AI_TEMPERATURE: '0.2',
      GOOGLE_API_KEY: 'test-google-key',
    });

    await expect(service.getChatModel()).resolves.toBeInstanceOf(
      ChatGoogleGenerativeAI,
    );
  });

  it('creates an OpenAI chat model when AI_PROVIDER is openai', async () => {
    const service = createService({
      AI_PROVIDER: 'openai',
      AI_MODEL: 'gpt-4o-mini',
      AI_TEMPERATURE: '0',
      OPENAI_API_KEY: 'test-openai-key',
    });

    await expect(service.getChatModel()).resolves.toBeInstanceOf(ChatOpenAI);
  });

  it('requires GOOGLE_API_KEY for Gemini', async () => {
    const service = createService({
      AI_PROVIDER: 'gemini',
      AI_MODEL: 'gemini-2.5-flash',
    });

    await expect(service.getChatModel()).rejects.toThrow(
      'GOOGLE_API_KEY is required when AI_PROVIDER=gemini',
    );
  });

  it('requires OPENAI_API_KEY for OpenAI', async () => {
    const service = createService({
      AI_PROVIDER: 'openai',
      AI_MODEL: 'gpt-4o-mini',
    });

    await expect(service.getChatModel()).rejects.toThrow(
      'OPENAI_API_KEY is required when AI_PROVIDER=openai',
    );
  });

  it('rejects unsupported AI providers', async () => {
    const service = createService({
      AI_PROVIDER: 'unsupported',
    });

    await expect(service.getChatModel()).rejects.toThrow(
      'Unsupported AI provider: unsupported',
    );
  });
});
