# Notification Service

Multi-channel notification service for ApplyForUs AI Platform, supporting email, push notifications, SMS, and in-app notifications.

## Overview

The Notification Service handles all user communications including email notifications, push notifications to mobile devices, SMS alerts, and real-time in-app notifications via WebSocket. It manages user notification preferences and provides a unified API for sending notifications across all channels.

## Features

- **Email Notifications**: Transactional emails via Nodemailer
- **Push Notifications**: Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs)
- **In-App Notifications**: Real-time via WebSocket/Socket.io
- **SMS Support**: SMS notifications (provider-configurable)
- **User Preferences**: Per-channel notification preferences
- **Template Engine**: Handlebars-based email templates
- **Queue Processing**: Bull queue for reliable delivery
- **Device Management**: FCM/APNs device token management

## Tech Stack

- Runtime: Node.js 20+
- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL (via TypeORM)
- Queue: Bull (Redis-based)
- WebSocket: Socket.io
- Email: Nodemailer
- Push: Firebase Admin, APNs2

## API Endpoints

### Notifications

- POST /notifications/email - Send email notification
- POST /notifications/push - Send push notification
- POST /notifications - Create a notification
- GET /notifications - Get all notifications with filters
- GET /notifications/:id - Get notification by ID
- PATCH /notifications/:id/read - Mark notification as read
- DELETE /notifications/:id - Delete notification
- DELETE /notifications/cleanup/old - Delete old read notifications

### User Notifications

- GET /notifications/user/:userId - Get user notifications
- GET /notifications/user/:userId/unread-count - Get unread count
- PATCH /notifications/user/:userId/read-all - Mark all as read

### Preferences

- GET /notifications/preferences/:userId - Get notification preferences
- PUT /notifications/preferences/:userId - Update preferences

### Push Device Management

- POST /push/register - Register device for push
- DELETE /push/unregister - Unregister device
- GET /push/devices/:userId - Get user devices
- POST /push/send - Send push notification
- POST /push/cleanup - Cleanup inactive devices

## Notification Types

- EMAIL - Email notifications
- PUSH - Push notifications (mobile)
- SMS - SMS notifications
- IN_APP - In-app notifications

## Notification Priority

- LOW - Non-urgent notifications
- MEDIUM - Standard notifications
- HIGH - Important notifications
- URGENT - Critical notifications

## Notification Status

- PENDING - Queued for sending
- SENT - Successfully sent
- FAILED - Delivery failed
- READ - Read by user

## Environment Variables

- PORT (4005)
- NODE_ENV
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- REDIS_HOST, REDIS_PORT
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
- APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_FILE
- FRONTEND_URL
- APPLICATIONINSIGHTS_CONNECTION_STRING

## WebSocket Events

- Connection: ws://localhost:4005/notifications
- Events: notification, read, read-all

## Getting Started

pnpm install && cp .env.example .env && pnpm migration:run && pnpm start:dev

Service runs on http://localhost:4005
WebSocket at ws://localhost:4005/notifications
Swagger docs at http://localhost:4005/api/docs

## Deployment

docker build -t applyforus/notification-service:latest .
docker run -p 4005:4005 --env-file .env applyforus/notification-service:latest

## License

MIT
