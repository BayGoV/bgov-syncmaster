import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import { PreferencesService } from './preferences/preferences.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private preferenceService: PreferencesService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('preferences')
  preferenceEvent(@Req() req: Request): string {
    const jsonMessage = Buffer.from(req.body.message.data, 'base64').toString();
    const preference = JSON.parse(jsonMessage);
    this.preferenceService.pipeline.next(preference);
    return '';
  }

  @Post('members')
  memberEvent(@Req() req: Request): string {
    return '';
  }
}
