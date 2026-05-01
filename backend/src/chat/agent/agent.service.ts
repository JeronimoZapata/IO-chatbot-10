import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import * as fs from 'fs';
import * as path from 'path';
import { createAgentGraph } from './agent.graph';
import { ModelProviderService } from './model-provider.service';
import { AgentMessage } from './types/agent-message.type';

const SYSTEM_PROMPT =
  'Eres un asistente especializado en modelos de simulacion. Tu tarea es ayudar a interpretar, plantear y resolver ejercicios academicos de simulacion de manera clara, paso a paso y con explicacion. Cuando falten datos, debes pedirlos antes de avanzar. No inventes informacion numerica.';

const DEFAULT_KNOWLEDGE_BASE_PATH = path.resolve(
  process.cwd(),
  'model-context.md',
);
const FALLBACK_KNOWLEDGE_BASE_PATH = path.resolve(
  process.cwd(),
  '..',
  'model-context.md',
);

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly knowledgeBaseContent: string;

  constructor(private readonly modelProviderService: ModelProviderService) {
    this.knowledgeBaseContent = this.loadKnowledgeBase();
  }

  async run(messages: AgentMessage[]): Promise<string> {
    const model = this.modelProviderService.getChatModel();
    const graph = createAgentGraph(model);

    const systemParts: string[] = [SYSTEM_PROMPT];
    if (this.knowledgeBaseContent) {
      systemParts.push(`Base de conocimiento:\n\n${this.knowledgeBaseContent}`);
    }

    const nonSystemMessages: BaseMessage[] = [];
    for (const message of messages) {
      if (message.role === 'system') {
        systemParts.push(message.content);
        continue;
      }

      nonSystemMessages.push(this.toBaseMessage(message));
    }

    const inputMessages: BaseMessage[] = [
      new SystemMessage(systemParts.join('\n\n')),
      ...nonSystemMessages,
    ];

    try {
      const result = await graph.invoke({ messages: inputMessages });
      const lastMessage = result.messages[result.messages.length - 1];
      if (!lastMessage) {
        return '';
      }

      if (typeof lastMessage.content === 'string') {
        return lastMessage.content;
      }

      return JSON.stringify(lastMessage.content);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      } else {
        this.logger.error('Unknown error while invoking AI provider.', error as any);
      }

      if (error instanceof Error) {
        if (
          error.message.includes('AI_PROVIDER is required') ||
          error.message.includes('OPENAI_API_KEY') ||
          error.message.includes('Unsupported AI provider')
        ) {
          throw new InternalServerErrorException(error.message);
        }

        if (error.message.trim()) {
          throw new InternalServerErrorException(error.message);
        }
      }

      throw new InternalServerErrorException('AI provider request failed.');
    }
  }

  private toBaseMessage(message: AgentMessage): BaseMessage {
    switch (message.role) {
      case 'system':
        return new SystemMessage(message.content);
      case 'assistant':
        return new AIMessage(message.content);
      case 'user':
      default:
        return new HumanMessage(message.content);
    }
  }

  private loadKnowledgeBase(): string {
    const configuredPath = process.env.KNOWLEDGE_BASE_PATH;
    const candidatePaths = [
      configuredPath,
      DEFAULT_KNOWLEDGE_BASE_PATH,
      FALLBACK_KNOWLEDGE_BASE_PATH,
    ].filter((value): value is string => Boolean(value));

    for (const candidatePath of candidatePaths) {
      if (!fs.existsSync(candidatePath)) {
        continue;
      }

      try {
        return fs.readFileSync(candidatePath, 'utf8').trim();
      } catch (error) {
        this.logger.warn(
          `Failed to read knowledge base at ${candidatePath}.`,
        );
      }
    }

    this.logger.warn('Knowledge base file was not found or could not be read.');
    return '';
  }
}
