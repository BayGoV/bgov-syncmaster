import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreferencesService } from './preferences/preferences.service';
import { MeetupsService } from './meetups/meetups.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PreferencesService, MeetupsService],
})
export class AppModule {}
