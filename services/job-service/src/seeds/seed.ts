import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        console.log('Seeding database...');
        await seeder.seedJobs();
        console.log('Seeding completed!');
        break;
      case 'clear':
        console.log('Clearing database...');
        await seeder.clearJobs();
        console.log('Database cleared!');
        break;
      case 'reseed':
        console.log('Reseeding database...');
        await seeder.reseedJobs();
        console.log('Reseeding completed!');
        break;
      default:
        console.log('Usage: npm run seed [seed|clear|reseed]');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
