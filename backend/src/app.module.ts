import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EpisodesModule } from './modules/episodes/episodes.module.js';
import { SharedModule } from './shared/shared.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SharedModule, EpisodesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
