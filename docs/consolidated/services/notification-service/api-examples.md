# API Examples

Comprehensive examples for using the Notification Service API.

## Base URL

```
http://localhost:8007
```

## Authentication

Currently, the service doesn't require authentication. In production, you should add JWT authentication or API keys.

---

## Email Notifications

### Send Simple Email

```bash
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome to Job Apply Platform",
    "body": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
    "userId": "user-123"
  }'
```

### Send Verification Email

```bash
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "newuser@example.com",
    "subject": "Verify Your Email",
    "template": "verification",
    "templateData": {
      "name": "John Doe",
      "verificationToken": "abc123xyz789"
    },
    "userId": "user-456"
  }'
```

### Send Password Reset Email

```bash
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Reset Your Password",
    "template": "password-reset",
    "templateData": {
      "name": "Jane Smith",
      "resetToken": "reset-token-xyz"
    },
    "userId": "user-789"
  }'
```

### Send Application Status Update Email

```javascript
// Using fetch in JavaScript
const response = await fetch('http://localhost:8007/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'applicant@example.com',
    subject: 'Application Status Update',
    template: 'application-status',
    templateData: {
      name: 'John Doe',
      jobTitle: 'Senior Backend Developer',
      companyName: 'Tech Corp',
      status: 'interviewing',
      message: 'Congratulations! We would like to schedule an interview.'
    },
    userId: 'user-123'
  })
});

const notification = await response.json();
console.log(notification);
```

### Send Job Alert Email

```python
# Using Python requests
import requests

data = {
    "to": "jobseeker@example.com",
    "subject": "New Jobs Matching Your Preferences",
    "template": "job-alert",
    "templateData": {
        "name": "Jane Doe",
        "jobs": [
            {
                "title": "Full Stack Developer",
                "company": "StartupXYZ",
                "location": "Remote",
                "salary": "$100k - $130k",
                "url": "http://localhost:3000/jobs/123"
            },
            {
                "title": "Backend Engineer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "salary": "$120k - $160k",
                "url": "http://localhost:3000/jobs/456"
            }
        ]
    },
    "userId": "user-789"
}

response = requests.post(
    'http://localhost:8007/notifications/email',
    json=data
)
print(response.json())
```

---

## Push Notifications

### Send Push Notification

```bash
curl -X POST http://localhost:8007/notifications/push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "title": "New Message",
    "message": "You have received a new message from TechCorp",
    "actionUrl": "/messages/456",
    "data": {
      "messageId": "msg-456",
      "senderId": "company-789"
    }
  }'
```

### Send Push with Custom Icon

```javascript
const notification = {
  userId: 'user-123',
  title: 'Application Viewed',
  message: 'Your application for Senior Developer was viewed by the hiring manager',
  actionUrl: '/applications/789',
  icon: 'https://example.com/icons/eye.png',
  data: {
    applicationId: 'app-789',
    jobId: 'job-456'
  }
};

const response = await fetch('http://localhost:8007/notifications/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(notification)
});
```

---

## Notification Management

### Get All Notifications (Paginated)

```bash
# Get first page
curl "http://localhost:8007/notifications?page=1&limit=20"

# Filter by user
curl "http://localhost:8007/notifications?userId=user-123&page=1&limit=20"

# Filter by status
curl "http://localhost:8007/notifications?userId=user-123&status=sent"

# Filter by type
curl "http://localhost:8007/notifications?userId=user-123&type=email"

# Filter by read status
curl "http://localhost:8007/notifications?userId=user-123&isRead=false"

# Combine filters
curl "http://localhost:8007/notifications?userId=user-123&type=in_app&isRead=false&page=1&limit=10"
```

### Get User's Notifications

```bash
# Get latest 50 notifications for user
curl "http://localhost:8007/notifications/user/user-123?limit=50"

# Get latest 10
curl "http://localhost:8007/notifications/user/user-123?limit=10"
```

### Get Unread Count

```bash
curl "http://localhost:8007/notifications/user/user-123/unread-count"
```

Response:
```json
{
  "count": 5
}
```

### Get Single Notification

```bash
curl "http://localhost:8007/notifications/550e8400-e29b-41d4-a716-446655440000"
```

### Mark Notification as Read

```bash
curl -X PUT "http://localhost:8007/notifications/550e8400-e29b-41d4-a716-446655440000/read"
```

### Mark All User Notifications as Read

```bash
curl -X PUT "http://localhost:8007/notifications/user/user-123/read-all"
```

Response:
```json
{
  "updated": 12
}
```

### Delete Notification

```bash
curl -X DELETE "http://localhost:8007/notifications/550e8400-e29b-41d4-a716-446655440000"
```

### Delete Old Notifications

```bash
# Delete notifications older than 30 days (default)
curl -X DELETE "http://localhost:8007/notifications/cleanup/old"

# Delete notifications older than 60 days
curl -X DELETE "http://localhost:8007/notifications/cleanup/old?days=60"
```

---

## Create Custom Notification

```bash
curl -X POST http://localhost:8007/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "in_app",
    "title": "Profile Update Required",
    "message": "Please update your profile to improve your job matches",
    "priority": "medium",
    "category": "profile",
    "actionUrl": "/profile/edit",
    "data": {
      "missingFields": ["phone", "resume"]
    }
  }'
```

---

## TypeScript/JavaScript Integration Examples

### React Hook for Notifications

```typescript
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `http://localhost:8007/notifications/user/${userId}?limit=50`
      );
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `http://localhost:8007/notifications/user/${userId}/unread-count`
      );
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(
        `http://localhost:8007/notifications/${notificationId}/read`,
        { method: 'PUT' }
      );
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(
        `http://localhost:8007/notifications/user/${userId}/read-all`,
        { method: 'PUT' }
      );
      await fetchNotifications();
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
```

### Node.js Service Integration

```typescript
import axios from 'axios';

class NotificationClient {
  private baseURL = 'http://localhost:8007';

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string
  ): Promise<void> {
    await axios.post(`${this.baseURL}/notifications/email`, {
      to: email,
      subject: 'Verify Your Email',
      template: 'verification',
      templateData: { name, verificationToken: token },
    });
  }

  async sendApplicationUpdate(
    email: string,
    name: string,
    jobTitle: string,
    companyName: string,
    status: string,
    message?: string
  ): Promise<void> {
    await axios.post(`${this.baseURL}/notifications/email`, {
      to: email,
      subject: `Application Update: ${jobTitle}`,
      template: 'application-status',
      templateData: { name, jobTitle, companyName, status, message },
    });
  }

  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await axios.post(`${this.baseURL}/notifications/push`, {
      userId,
      title,
      message,
      actionUrl,
    });
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
    category?: string;
    actionUrl?: string;
  }): Promise<any> {
    const response = await axios.post(`${this.baseURL}/notifications`, data);
    return response.data;
  }
}

export default new NotificationClient();
```

---

## Health Check Endpoints

```bash
# Basic health check
curl http://localhost:8007/health

# Readiness probe
curl http://localhost:8007/health/ready

# Liveness probe
curl http://localhost:8007/health/live
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (for deletes)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Example error response:

```json
{
  "statusCode": 400,
  "message": [
    "to must be an email",
    "subject should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## Postman Collection

You can import these examples into Postman by creating a collection with these requests. The service also provides Swagger documentation at:

```
http://localhost:8007/api/docs
```

This provides an interactive API explorer where you can test all endpoints directly in your browser.
