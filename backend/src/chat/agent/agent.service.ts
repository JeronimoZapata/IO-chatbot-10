import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { createAgentGraph } from './agent.graph';
import { ModelProviderService } from './model-provider.service';
import { AgentMessage } from './types/agent-message.type';

const SYSTEM_PROMPT =
  'Eres un asistente especializado en modelos de simulacion. Tu tarea es ayudar a interpretar, plantear y resolver ejercicios academicos de simulacion de manera clara, paso a paso y con explicacion. Cuando falten datos, debes pedirlos antes de avanzar. No inventes informacion numerica.';

@Injectable()
export class AgentService {
  constructor(private readonly modelProviderService: ModelProviderService) {}

  async run(messages: AgentMessage[]): Promise<string> {
    const model = this.modelProviderService.getChatModel();
    const graph = createAgentGraph(model);

    const inputMessages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((message) => this.toBaseMessage(message)),
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
        if (
          error.message.includes('AI_PROVIDER is required') ||
          error.message.includes('OPENAI_API_KEY') ||
          error.message.includes('Unsupported AI provider')
        ) {
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
}
