# 📧 Email Notification Setup

Sprintly AI can send automatic email notifications when high-quality matches (80%+ score) are found.

---

## Quick Setup

Add these environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Sprintly AI <noreply@sprintly.ai>
NOTIFICATION_EMAIL=admin@sprintly.ai
APP_URL=http://localhost:3000
```

---

## Gmail Setup (Recommended for Testing)

### 1. Enable 2-Factor Authentication
- Go to [Google Account Security](https://myaccount.google.com/security)
- Enable 2-Step Verification

### 2. Generate App Password
- Visit [App Passwords](https://myaccount.google.com/apppasswords)
- Select "Mail" and "Other (Custom name)"
- Enter "Sprintly AI" as the name
- Copy the 16-character password

### 3. Configure Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=Sprintly AI <your-gmail@gmail.com>
NOTIFICATION_EMAIL=your-gmail@gmail.com
APP_URL=http://localhost:3000
```

---

## SendGrid Setup (Recommended for Production)

### 1. Create SendGrid Account
- Sign up at [SendGrid](https://sendgrid.com/)
- Verify your sender email address

### 2. Create API Key
- Go to Settings → API Keys
- Create a new API key with "Mail Send" permissions
- Copy the API key

### 3. Configure Environment Variables
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=Sprintly AI <verified@yourdomain.com>
NOTIFICATION_EMAIL=admin@yourdomain.com
APP_URL=https://yourdomain.com
```

---

## Other SMTP Providers

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

## Testing Email Configuration

After setting up SMTP, restart the server and run the matching engine:

```bash
# Restart server
pnpm dev

# Navigate to Matches page
# Click "Run Matching Engine"
```

If a match with 80%+ score is found, you'll receive an email notification.

---

## Email Template

The notification email includes:
- Overall match score (large, prominent)
- Company and investor names
- Investor contact email
- Six-factor score breakdown (sector, stage, geography, traction, check size, thesis)
- Match reasoning explanation
- "View Match Details" CTA button

---

## Troubleshooting

### "Email service not configured"
- Check that all SMTP environment variables are set
- Restart the server after adding variables

### "Authentication failed"
- Gmail: Make sure you're using an App Password, not your regular password
- SendGrid: Verify the API key has "Mail Send" permissions
- Check SMTP_USER and SMTP_PASS are correct

### "Connection timeout"
- Check SMTP_HOST and SMTP_PORT are correct
- Verify your firewall allows outbound connections on port 587
- Try port 465 with SSL (set SMTP_PORT=465)

### Emails not arriving
- Check spam/junk folder
- Verify NOTIFICATION_EMAIL is correct
- Check SendGrid/Gmail sending limits

---

## Disabling Email Notifications

Simply don't set the SMTP environment variables. The matching engine will work normally without sending emails.

---

## Production Recommendations

1. **Use a dedicated SMTP service** (SendGrid, Mailgun, AWS SES) instead of Gmail
2. **Set up SPF and DKIM records** for your domain to improve deliverability
3. **Monitor sending limits** - most services have daily/hourly limits
4. **Use a dedicated sending domain** (e.g., mail.yourdomain.com)
5. **Implement rate limiting** if running matching engine frequently

---

## Security Notes

- Never commit `.env` files to version control
- Use environment-specific configurations (dev, staging, prod)
- Rotate SMTP credentials regularly
- Use read-only API keys when possible
- Monitor for suspicious email activity

---

## Support

For issues with email setup:
- Check server logs for detailed error messages
- Test SMTP connection using online tools
- Verify credentials with your SMTP provider
- Contact your SMTP provider's support if authentication fails
