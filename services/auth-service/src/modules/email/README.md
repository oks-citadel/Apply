# Email Service Module

This module handles all email notifications for the authentication service using Nodemailer.

## Features

- **Email Verification**: Sends verification emails with tokens to new users
- **Password Reset**: Sends password reset emails with secure tokens
- **Welcome Emails**: Sends welcome emails after successful verification
- **Professional Templates**: HTML and plain text email templates
- **Error Handling**: Graceful error handling with logging
- **SMTP Configuration**: Flexible SMTP configuration via environment variables

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@jobpilot.ai

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Token Expiration (in seconds)
EMAIL_VERIFICATION_EXPIRY=86400  # 24 hours
PASSWORD_RESET_EXPIRY=3600       # 1 hour
```

### Supported Email Providers

#### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

**Note**: For Gmail, you must use an [App Password](https://myaccount.google.com/apppasswords), not your regular Gmail password. This requires 2-factor authentication to be enabled.

#### Outlook/Office 365
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASS=your-mailgun-smtp-password
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-ses-smtp-username
EMAIL_PASS=your-aws-ses-smtp-password
```

## Usage

### In Auth Service

The email service is automatically injected into the `AuthService`:

```typescript
constructor(
  private readonly emailService: EmailService,
) {}

// Send verification email
await this.emailService.sendVerificationEmail(user.email, token);

// Send password reset email
await this.emailService.sendPasswordResetEmail(user.email, token);

// Send welcome email
await this.emailService.sendWelcomeEmail(user.email, user.firstName);
```

### Email Templates

All emails include:
- Professional HTML templates with styling
- Plain text fallback for compatibility
- Responsive design
- Clear call-to-action buttons
- Security warnings where appropriate

## Development & Testing

### Testing Email Configuration

The service automatically verifies the SMTP connection on initialization. Check the logs for:

```
[EmailService] Email service is ready to send emails
```

If configuration is incorrect, you'll see:
```
[EmailService] Email service configuration error. Emails will not be sent.
```

### Testing with Mailtrap (Development)

For development, use [Mailtrap](https://mailtrap.io/) to test emails without sending them to real addresses:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@jobpilot.ai
```

### Testing with MailHog (Local Development)

If you're running MailHog locally:

```env
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@jobpilot.ai
```

## Error Handling

The email service includes comprehensive error handling:

- **Registration**: If verification email fails, user is still registered but warned in logs
- **Password Reset**: If email fails, error is logged but generic success message is shown (security)
- **Welcome Email**: Failures are logged but don't affect user experience

## Security Considerations

1. **App Passwords**: Always use app-specific passwords, never your main email password
2. **Environment Variables**: Never commit `.env` files with real credentials
3. **Rate Limiting**: Consider implementing rate limiting for email sending
4. **Token Expiration**: Tokens expire automatically (24h for verification, 1h for reset)
5. **Generic Messages**: Password reset doesn't reveal if email exists

## Troubleshooting

### Emails not sending

1. Check SMTP credentials are correct
2. Verify EMAIL_HOST and EMAIL_PORT settings
3. Check firewall/network allows SMTP connections
4. Review logs for specific error messages
5. Test with a service like Mailtrap first

### Gmail "Less secure app" error

Gmail requires an App Password:
1. Enable 2-factor authentication
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password
4. Use that password in EMAIL_PASS

### Outlook authentication error

If using Outlook, ensure:
1. SMTP access is enabled in your account settings
2. 2-factor authentication is configured properly
3. Using the correct SMTP server (smtp-mail.outlook.com)

## Future Enhancements

- [ ] Email templates with more customization options
- [ ] Queue-based email sending for better reliability
- [ ] Email analytics and tracking
- [ ] Template engine support (Handlebars/Pug)
- [ ] Attachment support
- [ ] Bulk email sending
- [ ] Email preview in development mode
