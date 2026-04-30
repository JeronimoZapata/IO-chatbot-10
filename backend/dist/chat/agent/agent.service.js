"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const messages_1 = require("@langchain/core/messages");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const agent_graph_1 = require("./agent.graph");
const model_provider_service_1 = require("./model-provider.service");
const SYSTEM_PROMPT = 'Eres un asistente especializado en modelos de simulacion. Tu tarea es ayudar a interpretar, plantear y resolver ejercicios academicos de simulacion de manera clara, paso a paso y con explicacion. Cuando falten datos, debes pedirlos antes de avanzar. No inventes informacion numerica.';
const DEFAULT_KNOWLEDGE_BASE_PATH = path.resolve(process.cwd(), 'knowledge-base.md');
const FALLBACK_KNOWLEDGE_BASE_PATH = path.resolve(process.cwd(), '..', 'knowledge-base.md');
let AgentService = AgentService_1 = class AgentService {
    modelProviderService;
    logger = new common_1.Logger(AgentService_1.name);
    knowledgeBaseContent;
    constructor(modelProviderService) {
        this.modelProviderService = modelProviderService;
        this.knowledgeBaseContent = this.loadKnowledgeBase();
    }
    async run(messages) {
        const model = this.modelProviderService.getChatModel();
        const graph = (0, agent_graph_1.createAgentGraph)(model);
        const systemParts = [SYSTEM_PROMPT];
        if (this.knowledgeBaseContent) {
            systemParts.push(`Base de conocimiento:\n\n${this.knowledgeBaseContent}`);
        }
        const nonSystemMessages = [];
        for (const message of messages) {
            if (message.role === 'system') {
                systemParts.push(message.content);
                continue;
            }
            nonSystemMessages.push(this.toBaseMessage(message));
        }
        const inputMessages = [
            new messages_1.SystemMessage(systemParts.join('\n\n')),
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
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(error.message, error.stack);
            }
            else {
                this.logger.error('Unknown error while invoking AI provider.', error);
            }
            if (error instanceof Error) {
                if (error.message.includes('AI_PROVIDER is required') ||
                    error.message.includes('OPENAI_API_KEY') ||
                    error.message.includes('Unsupported AI provider')) {
                    throw new common_1.InternalServerErrorException(error.message);
                }
                if (error.message.trim()) {
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
    loadKnowledgeBase() {
        const configuredPath = process.env.KNOWLEDGE_BASE_PATH;
        const candidatePaths = [
            configuredPath,
            DEFAULT_KNOWLEDGE_BASE_PATH,
            FALLBACK_KNOWLEDGE_BASE_PATH,
        ].filter((value) => Boolean(value));
        for (const candidatePath of candidatePaths) {
            if (!fs.existsSync(candidatePath)) {
                continue;
            }
            try {
                return fs.readFileSync(candidatePath, 'utf8').trim();
            }
            catch (error) {
                this.logger.warn(`Failed to read knowledge base at ${candidatePath}.`);
            }
        }
        this.logger.warn('Knowledge base file was not found or could not be read.');
        return '';
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_provider_service_1.ModelProviderService])
], AgentService);
//# sourceMappingURL=agent.service.js.map