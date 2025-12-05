# Quick Start Guide

Get the Notification Service up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- SMTP credentials (Gmail, SendGrid, etc.)

## Step 1: Install Dependencies

```bash
cd services/notification-service
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, update these:
# - DB_* variables for your PostgreSQL connection
# - SMTP_* variables for email sending
```

## Step 3: Setup Database

```bash
# Create the database
createdb notification_service

# Or using psql:
psql -U postgres -c "CREATE DATABASE notification_service;"
```

## Step 4: Start the Service

```bash
# Development mode (with hot reload)
npm run start:dev

# The service will start on http://localhost:8007
# Swagger docs available at http://localhost:8007/api/docs
```

## Step 5: Test the API

### Using Swagger UI

1. Open http://localhost:8007/api/docs
2. Try the endpoints interactively

### Using cURL

```bash
# Send an email notification
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello World!</h1>",
    "userId": "user-123"
  }'

# Get notifications
curl http://localhost:8007/notifications?userId=user-123

# Send push notification (placeholder)
curl -X POST http://localhost:8007/notifications/push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "title": "Test Push",
    "message": "This is a test notification"
  }'

# Mark notification as read
curl -X PUT http://localhost:8007/notifications/{id}/read

# Get unread count
curl http://localhost:8007/notifications/user/user-123/unread-count
```

## Quick Docker Setup

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f notification-service
```

## Testing Email Templates

The service includes pre-built email templates. Test them like this:

```bash
# Verification Email
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Verify Your Email",
    "template": "verification",
    "templateData": {
      "name": "John Doe",
      "verificationToken": "abc123xyz"
    },
    "userId": "user-123"
  }'
```

## Common Issues

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: Ensure PostgreSQL is running and credentials are correct in `.env`

### Email Sending Error

```
Error: Invalid login
```

**Solution**:
- For Gmail: Enable 2FA and create an App Password
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT are correct

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::8007
```

**Solution**: Change PORT in `.env` or stop the conflicting service

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the Swagger API docs at http://localhost:8007/api/docs
- Customize email templates in `src/modules/email/email.service.ts`
- Integrate with your other microservices

## Development Tips

```bash
# Watch mode (auto-restart on changes)
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

## Production Deployment

```bash
# Build the service
npm run build

# Start in production mode
NODE_ENV=production npm run start:prod
```

## Support

If you encounter issues:
1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is accessible
4. Test SMTP connection separately
