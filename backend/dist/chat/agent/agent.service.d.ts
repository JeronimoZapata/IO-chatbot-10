import { ModelProviderService } from './model-provider.service';
import { AgentMessage } from './types/agent-message.type';
export declare class AgentService {
    private readonly modelProviderService;
    private readonly logger;
    private readonly knowledgeBaseContent;
    constructor(modelProviderService: ModelProviderService);
    run(messages: AgentMessage[]): Promise<string>;
    private toBaseMessage;
    private loadKnowledgeBase;
}
