import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);
  const logger = new Logger('Seeder');

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        logger.log('Seeding database...');
        await seeder.seedJobs();
        logger.log('Seeding completed!');
        break;
      case 'clear':
        logger.log('Clearing database...');
        await seeder.clearJobs();
        logger.log('Database cleared!');
        break;
      case 'reseed':
        logger.log('Reseeding database...');
        await seeder.reseedJobs();
        logger.log('Reseeding completed!');
        break;
      default:
        logger.log('Usage: npm run seed [seed|clear|reseed]');
    }
  } catch (error) {
    logger.error('Seeder error', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
