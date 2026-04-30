import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createChat(body: ChatRequestDto): Promise<{
        reply: string;
    }>;
}
