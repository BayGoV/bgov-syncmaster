import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('preferences')
  preferenceEvent(@Req() req: Request): string {
    return '';
  }

  @Post('members')
  memberEvent(@Req() req: Request): string {
    return '';
  }
}
