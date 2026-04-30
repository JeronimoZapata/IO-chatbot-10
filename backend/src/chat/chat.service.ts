import { Injectable } from '@nestjs/common';
import { AgentService } from './agent/agent.service';
import { AgentMessage } from './agent/types/agent-message.type';

@Injectable()
export class ChatService {
  constructor(private readonly agentService: AgentService) {}

  async sendMessage(messages: AgentMessage[]): Promise<string> {
    return this.agentService.run(messages);
  }
}
