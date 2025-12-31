import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchHistory } from './entities/search-history.entity';
import { JwtAuthGuard } from '../../common/guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([SearchHistory]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, JwtAuthGuard],
  exports: [SearchService],
})
export class SearchModule {}
