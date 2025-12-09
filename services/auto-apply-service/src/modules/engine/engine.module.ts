import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineController } from './engine.controller';
import { EngineService } from './engine.service';
import { Application } from '../applications/entities/application.entity';
import { ApplicationsModule } from '../applications/applications.module';
import { BrowserModule } from '../browser/browser.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { FormMappingModule } from '../form-mapping/form-mapping.module';
import { CaptchaModule } from '../captcha/captcha.module';
import { RateLimiterModule } from '../rate-limiter/rate-limiter.module';
import { QueueModule } from '../queue/queue.module';
import { AnswerLibraryModule } from '../answer-library/answer-library.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    forwardRef(() => ApplicationsModule),
    forwardRef(() => QueueModule),
    BrowserModule,
    AdaptersModule,
    FormMappingModule,
    CaptchaModule,
    RateLimiterModule,
    AnswerLibraryModule,
  ],
  controllers: [EngineController],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
