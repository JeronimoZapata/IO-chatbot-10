import { AgentService } from './agent/agent.service';
import { AgentMessage } from './agent/types/agent-message.type';
export declare class ChatService {
    private readonly agentService;
    constructor(agentService: AgentService);
    sendMessage(messages: AgentMessage[]): Promise<string>;
}
