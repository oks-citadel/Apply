import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { NotificationPreferences } from '../modules/notifications/entities/notification-preferences.entity';
import { DeviceToken } from '../modules/push/entities/device-token.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'notification_service',
  entities: [Notification, NotificationPreferences, DeviceToken],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('azure')
    ? { rejectUnauthorized: false }
    : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
