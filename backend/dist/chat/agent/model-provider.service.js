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
exports.ModelProviderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const google_genai_1 = require("@langchain/google-genai");
let ModelProviderService = class ModelProviderService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getChatModel() {
        const rawProvider = this.configService.get('AI_PROVIDER');
        if (!rawProvider) {
            throw new Error('AI_PROVIDER is required.');
        }
        const provider = rawProvider.toLowerCase();
        const model = this.configService.get('AI_MODEL') ?? 'gpt-4o-mini';
        const temperature = this.parseTemperature(this.configService.get('AI_TEMPERATURE'));
        switch (provider) {
            case 'openai': {
                const apiKey = this.configService.get('OPENAI_API_KEY');
                if (!apiKey) {
                    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
                }
                return new openai_1.ChatOpenAI({
                    apiKey,
                    model,
                    temperature,
                });
            }
            case 'gemini': {
                const apiKey = this.configService.get('GOOGLE_API_KEY');
                if (!apiKey) {
                    throw new Error('GOOGLE_API_KEY is required when AI_PROVIDER=gemini');
                }
                return new google_genai_1.ChatGoogleGenerativeAI({
                    apiKey,
                    model,
                    temperature,
                });
            }
            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    }
    parseTemperature(value) {
        if (!value) {
            return 0.2;
        }
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 0.2;
        }
        return parsed;
    }
};
exports.ModelProviderService = ModelProviderService;
exports.ModelProviderService = ModelProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ModelProviderService);
//# sourceMappingURL=model-provider.service.js.map