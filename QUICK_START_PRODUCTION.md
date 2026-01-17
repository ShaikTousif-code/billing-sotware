# Quick Start: Production Setup (15 minutes)

## Critical Steps to Make Production-Ready

### 1. Backend Configuration (5 minutes)

#### Option A: Use Environment Variables (Recommended)
```powershell
# Windows PowerShell
$env:ASPNETCORE_ENVIRONMENT="Production"
$env:DB_CONNECTION_STRING="Server=YOUR_SERVER;Database=smartbillingsoluition;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True"
$env:JWT_SECRET_KEY="GENERATE_STRONG_64_CHARACTER_KEY"
$env:CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

```bash
# Linux/Mac
export ASPNETCORE_ENVIRONMENT=Production
export DB_CONNECTION_STRING="Server=YOUR_SERVER;Database=smartbillingsoluition;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True"
export JWT_SECRET_KEY="GENERATE_STRONG_64_CHARACTER_KEY"
export CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

#### Option B: Use appsettings.Production.json
1. Copy `appsettings.Production.json.example` to `appsettings.Production.json`
2. Replace placeholders with your actual values:
   - `REPLACE_WITH_YOUR_PRODUCTION_DB_CONNECTION_STRING` → Your DB connection
   - `REPLACE_WITH_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS` → Generate strong key
   - `https://yourdomain.com` → Your actual domain

#### Generate JWT Secret Key
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

```bash
# Bash
openssl rand -base64 64
```

### 2. Frontend Configuration (2 minutes)

1. Create `.env.production` file:
```bash
cd BillingUI
cp .env.production.example .env.production
```

2. Edit `.env.production`:
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=30000
```

### 3. Build Applications (5 minutes)

**Backend:**
```bash
cd BillingAPI
dotnet publish --configuration Release --output ./publish
```

**Frontend:**
```bash
cd BillingUI
npm install
npm run build
```

### 4. Verify Configuration (3 minutes)

- [ ] Environment variables are set OR appsettings.Production.json is configured
- [ ] JWT secret key is strong (64+ characters)
- [ ] Database connection string is correct
- [ ] CORS origins include your production domain
- [ ] Frontend .env.production has correct API URL
- [ ] Both applications build successfully

### 5. Deploy

Follow `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Security Checklist

- [x] JWT secret key is strong and secure
- [x] Database connection string uses secure credentials
- [x] CORS is restricted to production domain
- [x] Swagger is disabled in production (already configured)
- [x] HTTPS is enabled (configure in deployment)
- [x] Environment variables are used for sensitive data

## What Changed

✅ **Backend:**
- Added support for environment variables (DB_CONNECTION_STRING, JWT_SECRET_KEY, CORS_ALLOWED_ORIGINS)
- Created appsettings.Production.json template
- Updated CORS to read from configuration or environment
- Added validation to ensure required config is present

✅ **Frontend:**
- Created .env.production.example template
- Created .env.example for development

✅ **Documentation:**
- Created PRODUCTION_READINESS_CHECKLIST.md
- Created DEPLOYMENT_GUIDE.md
- Created QUICK_START_PRODUCTION.md (this file)

## Next Steps

1. **Set environment variables** or configure `appsettings.Production.json`
2. **Generate and set JWT secret key**
3. **Update CORS with your production domain**
4. **Build both applications**
5. **Deploy following DEPLOYMENT_GUIDE.md**
6. **Test production deployment**

## Need Help?

- See `DEPLOYMENT_GUIDE.md` for detailed deployment options
- See `PRODUCTION_READINESS_CHECKLIST.md` for comprehensive checklist
- Check application logs if issues occur

