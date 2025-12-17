import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host', 'localhost');
        const redisPort = configService.get<number>('redis.port', 6380);
        const redisPassword = configService.get<string>('redis.password', '');
        const redisTls = configService.get<boolean>('redis.tls', false);
        const defaultTtl = configService.get<number>('redis.ttl', 300);

        return {
          store: redisStore,
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          ttl: defaultTtl,
          tls: redisTls ? {} : undefined,
          // Connection retry strategy
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null; // Stop retrying after 3 attempts
            }
            return Math.min(times * 1000, 3000); // Exponential backoff with max 3s
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [CacheModule, RedisCacheService],
})
export class RedisCacheModule {}
