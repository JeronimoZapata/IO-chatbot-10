"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const messages_1 = require("@langchain/core/messages");
const agent_graph_1 = require("./agent.graph");
const model_provider_service_1 = require("./model-provider.service");
const SYSTEM_PROMPT = 'Eres un asistente especializado en modelos de simulacion. Tu tarea es ayudar a interpretar, plantear y resolver ejercicios academicos de simulacion de manera clara, paso a paso y con explicacion. Cuando falten datos, debes pedirlos antes de avanzar. No inventes informacion numerica.';
let AgentService = class AgentService {
    modelProviderService;
    constructor(modelProviderService) {
        this.modelProviderService = modelProviderService;
    }
    async run(messages) {
        const model = this.modelProviderService.getChatModel();
        const graph = (0, agent_graph_1.createAgentGraph)(model);
        const inputMessages = [
            new messages_1.SystemMessage(SYSTEM_PROMPT),
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
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('AI_PROVIDER is required') ||
                    error.message.includes('OPENAI_API_KEY') ||
                    error.message.includes('Unsupported AI provider')) {
                    throw new common_1.InternalServerErrorException(error.message);
                }
            }
            throw new common_1.InternalServerErrorException('AI provider request failed.');
        }
    }
    toBaseMessage(message) {
        switch (message.role) {
            case 'system':
                return new messages_1.SystemMessage(message.content);
            case 'assistant':
                return new messages_1.AIMessage(message.content);
            case 'user':
            default:
                return new messages_1.HumanMessage(message.content);
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_provider_service_1.ModelProviderService])
], AgentService);
//# sourceMappingURL=agent.service.js.map