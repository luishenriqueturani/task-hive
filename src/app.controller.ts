import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health/root', description: 'Retorna mensagem de boas-vindas da API.' })
  @ApiResponse({ status: 200, description: 'OK', schema: { example: 'Hello World!' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
