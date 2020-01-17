import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import { PreferencesService } from './preferences/preferences.service';
import { MeetupsService } from './meetups/meetups.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private preferenceService: PreferencesService,
    private meetupService: MeetupsService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('preferences')
  preferenceEvent(@Req() req: Request): string {
    this.preferenceService.process(req.body.message.data);
    return '';
  }

  @Post('meetups')
  memberEvent(@Req() req: Request): string {
    this.meetupService.process(req.body.message.data);
    return '';
  }
}
