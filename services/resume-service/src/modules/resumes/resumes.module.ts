import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { Resume } from './entities/resume.entity';
import { ResumeVersion } from './entities/resume-version.entity';
import { ParserModule } from '../parser/parser.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, ResumeVersion]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    ParserModule,
    ExportModule,
  ],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
