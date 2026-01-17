# Setup Instructions for Hangfire, Email, and SMS

## 📋 Integration Guide

### 1. Hangfire Background Jobs Setup

#### Step 1: Add to Program.cs

Add these using statements at the top:
```csharp
using Hangfire;
using Hangfire.SqlServer;
using BillingAPI.Infrastructure;
```

Add this in the service registration section (after other AddScoped calls):
```csharp
builder.Services.AddScoped<IBackgroundJobService, BackgroundJobService>();

// Hangfire configuration
builder.Services.AddHangfire(config =>
{
    config.UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddHangfireServer();
```

Add this in the app configuration section (before app.Run()):
```csharp
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire", new Hangfire.Dashboard.DashboardOptions
    {
        Authorization = new[] { new HangfireAuthorizationFilter() }
    });
}

// Schedule recurring jobs
using (var scope = app.Services.CreateScope())
{
    var serviceProvider = scope.ServiceProvider;
    var backgroundJobService = serviceProvider.GetRequiredService<IBackgroundJobService>();

    Hangfire.RecurringJob.AddOrUpdate(
        "generate-recurring-invoices",
        () => backgroundJobService.GenerateRecurringInvoicesJobAsync(),
        Hangfire.Cron.Daily(1)); // Run daily at 1 AM

    Hangfire.RecurringJob.AddOrUpdate(
        "send-fee-reminders",
        () => backgroundJobService.SendFeeRemindersJobAsync(),
        Hangfire.Cron.Daily(9)); // Run daily at 9 AM

    Hangfire.RecurringJob.AddOrUpdate(
        "send-contract-reminders",
        () => backgroundJobService.SendContractRenewalRemindersJobAsync(),
        Hangfire.Cron.Daily(10)); // Run daily at 10 AM

    Hangfire.RecurringJob.AddOrUpdate(
        "update-overdue-fees",
        () => backgroundJobService.UpdateOverdueFeesStatusJobAsync(),
        Hangfire.Cron.Daily(0)); // Run daily at midnight
}
```

#### Step 2: Database Setup
Hangfire will automatically create its tables on first run. Ensure your connection string is correct.

#### Step 3: Access Dashboard
- Development: http://localhost:5000/hangfire
- Production: Restrict access via authorization filter

---

### 2. SendGrid Email Setup

#### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your email address
3. Create an API key:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "Billing System")
   - Select "Full Access" or "Mail Send" permissions
   - Copy the API key

#### Step 2: Verify Sender Email
1. Go to Settings > Sender Authentication
2. Verify a single sender or domain
3. Use verified email in configuration

#### Step 3: Update appsettings.json
```json
{
  "SendGrid": {
    "ApiKey": "SG.your_actual_api_key_here",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "Billing System"
  }
}
```

#### Step 4: Test Email
The service will automatically use SendGrid when configured. Test by triggering a fee reminder.

---

### 3. Twilio SMS Setup

#### Step 1: Create Twilio Account
1. Sign up at https://twilio.com
2. Verify your phone number
3. Get your credentials:
   - Account SID (found on dashboard)
   - Auth Token (found on dashboard)
   - Purchase a phone number (Phone Numbers > Buy a number)

#### Step 2: Update appsettings.json
```json
{
  "Twilio": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "AuthToken": "your_auth_token_here",
    "PhoneNumber": "+1234567890"
  }
}
```

#### Step 3: Test SMS
The service will automatically use Twilio when configured. Test by triggering a fee reminder.

---

## ✅ Verification

### Test Background Jobs:
1. Start the application
2. Navigate to `/hangfire` (development only)
3. Check "Recurring Jobs" tab
4. Jobs should be scheduled and visible

### Test Email:
1. Trigger a fee reminder manually via API
2. Check SendGrid Activity Feed
3. Verify email delivery

### Test SMS:
1. Trigger a fee reminder manually via API
2. Check Twilio Console > Logs > Messaging
3. Verify SMS delivery

---

## 🔒 Production Considerations

1. **Hangfire Dashboard**: Restrict access in production
2. **API Keys**: Use environment variables, not appsettings.json
3. **Rate Limits**: Be aware of SendGrid/Twilio rate limits
4. **Error Handling**: Monitor job failures in Hangfire dashboard
5. **Logging**: All operations are logged for debugging

---

## 📝 Notes

- If SendGrid/Twilio are not configured, the system will log messages but not send actual emails/SMS
- Background jobs run automatically based on schedule
- Jobs can be manually triggered from Hangfire dashboard
- All job executions are logged for audit purposes

