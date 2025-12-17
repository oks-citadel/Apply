import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';
import { JobSourcesSeeder } from './job-sources.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);
  const jobSourcesSeeder = app.get(JobSourcesSeeder);
  const logger = new Logger('Seeder');

  const command = process.argv[2];
  const target = process.argv[3];

  try {
    switch (command) {
      case 'seed':
        if (target === 'sources' || !target) {
          logger.log('Seeding job sources...');
          await jobSourcesSeeder.seed();
          logger.log('Job sources seeding completed!');
        }
        if (target === 'jobs' || !target) {
          logger.log('Seeding jobs...');
          await seeder.seedJobs();
          logger.log('Jobs seeding completed!');
        }
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
        logger.log('Usage: npm run seed [seed|clear|reseed] [sources|jobs]');
        logger.log('Examples:');
        logger.log('  npm run seed seed sources  - Seed job sources only');
        logger.log('  npm run seed seed jobs     - Seed jobs only');
        logger.log('  npm run seed seed          - Seed both sources and jobs');
    }
  } catch (error) {
    logger.error('Seeder error', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
