import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
export declare class ModelProviderService {
    private readonly configService;
    constructor(configService: ConfigService);
    getChatModel(): ChatOpenAI<import("@langchain/openai").ChatOpenAICallOptions> | ChatGoogleGenerativeAI;
    private parseTemperature;
}
