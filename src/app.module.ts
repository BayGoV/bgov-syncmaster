import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreferencesService } from './preferences/preferences.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PreferencesService],
})
export class AppModule {}
