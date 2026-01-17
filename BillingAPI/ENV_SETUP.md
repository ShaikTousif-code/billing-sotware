# Environment Variables Setup

## Configuration Files

The API uses `appsettings.json` files for configuration. Environment-specific files are:

- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Development environment
- `appsettings.Production.json` - Production environment

## Using Environment Variables

You can override settings using environment variables with double underscore (`__`) notation:

### Windows (PowerShell)
```powershell
$env:ConnectionStrings__DefaultConnection="Server=YOUR_SERVER;Database=BillingDB;..."
$env:JwtSettings__SecretKey="YourSecretKey"
```

### Windows (CMD)
```cmd
set ConnectionStrings__DefaultConnection=Server=YOUR_SERVER;Database=BillingDB;...
set JwtSettings__SecretKey=YourSecretKey
```

### Linux/Mac
```bash
export ConnectionStrings__DefaultConnection="Server=YOUR_SERVER;Database=BillingDB;..."
export JwtSettings__SecretKey="YourSecretKey"
```

## Using .env File (Optional)

You can use a `.env` file with a tool like `dotenv` or configure it manually:

```env
ConnectionStrings__DefaultConnection=Server=YOUR_SERVER;Database=BillingDB;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true
JwtSettings__SecretKey=YourSuperSecretKeyForJWTTokenGenerationThatShouldBeAtLeast32CharactersLong
JwtSettings__Issuer=BillingAPI
JwtSettings__Audience=BillingClient
JwtSettings__ExpirationMinutes=1440
SendGrid__ApiKey=YOUR_SENDGRID_API_KEY
SendGrid__FromEmail=noreply@yourdomain.com
SendGrid__FromName=Billing System
Twilio__AccountSid=YOUR_TWILIO_ACCOUNT_SID
Twilio__AuthToken=YOUR_TWILIO_AUTH_TOKEN
Twilio__PhoneNumber=+1234567890
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000;https://localhost:5001
```

## Important Settings

### Database Connection
Update `ConnectionStrings__DefaultConnection` with your SQL Server connection string.

### JWT Secret Key
**IMPORTANT:** Change `JwtSettings__SecretKey` to a secure random string (at least 32 characters) in production.

### Email/SMS Services
Configure SendGrid and Twilio credentials for email and SMS functionality.

## Environment-Specific Configuration

- **Development**: Uses `appsettings.Development.json` when `ASPNETCORE_ENVIRONMENT=Development`
- **Production**: Uses `appsettings.Production.json` when `ASPNETCORE_ENVIRONMENT=Production`

