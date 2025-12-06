import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Profile } from '../modules/profile/entities/profile.entity';
import { WorkExperience } from '../modules/career/entities/work-experience.entity';
import { Education } from '../modules/career/entities/education.entity';
import { Skill } from '../modules/skills/entities/skill.entity';
import { Preference } from '../modules/preferences/entities/preference.entity';
import { Subscription } from '../modules/subscription/entities/subscription.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'jobpilot',
  entities: [Profile, WorkExperience, Education, Skill, Preference, Subscription],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
