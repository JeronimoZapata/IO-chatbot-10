import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async createChat(@Body() body: ChatRequestDto) {
    const reply = await this.chatService.sendMessage(body.messages);
    return { reply };
  }
}
