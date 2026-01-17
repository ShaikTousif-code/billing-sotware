# Production Deployment Guide

## Prerequisites

- .NET 8.0 SDK installed
- Node.js 18+ and npm installed
- SQL Server database (or SQL Server Express)
- Production server (Windows/Linux)
- Domain name and SSL certificate (for HTTPS)

## Step 1: Backend Configuration

### 1.1 Set Environment Variables

Create environment variables on your production server:

**Windows (PowerShell):**
```powershell
$env:ASPNETCORE_ENVIRONMENT="Production"
$env:DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
$env:JWT_SECRET_KEY="YOUR_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG"
$env:CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**Linux/Mac (Bash):**
```bash
export ASPNETCORE_ENVIRONMENT=Production
export DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
export JWT_SECRET_KEY="YOUR_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG"
export CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**Note:** Replace `YOUR_ACTUAL_PASSWORD` with your actual Azure SQL Database password. For better security, use environment variables instead of storing the password in `appsettings.Production.json`.

**Or use appsettings.Production.json:**
1. The connection string is already configured in `appsettings.Production.json` for Azure SQL Database
2. **IMPORTANT:** Replace `{your_password}` in the connection string with your actual Azure SQL Database password
3. Alternatively, use the `DB_CONNECTION_STRING` environment variable (recommended for security)
4. Replace `${JWT_SECRET_KEY}` and `${FRONTEND_URL}` with actual values

### 1.2 Generate Strong JWT Secret Key

```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

```bash
# Bash
openssl rand -base64 64
```

### 1.3 Update appsettings.Production.json

Edit `BillingAPI/appsettings.Production.json` and replace placeholders:
- `${DB_CONNECTION_STRING}` → Your production database connection string
- `${JWT_SECRET_KEY}` → Your generated JWT secret key
- `${FRONTEND_URL}` → Your frontend URL (e.g., `https://yourdomain.com`)

### 1.4 Build Backend

```bash
cd BillingAPI
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --output ./publish
```

## Step 2: Database Setup

### 2.1 Run Migrations

```bash
cd BillingAPI
dotnet ef database update --configuration Release
```

Or manually run the SQL scripts in the `Database` folder:
1. `MASTER_MIGRATION_smartbillingsoluition.sql` (if starting fresh)
2. Any additional migration scripts

### 2.2 Verify Database

- Check that all tables are created
- Verify indexes exist
- Test connection from application

## Step 3: Frontend Configuration

### 3.1 Create Production Environment File

```bash
cd BillingUI
cp .env.production.example .env.production
```

Edit `.env.production`:
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=30000
```

### 3.2 Build Frontend

```bash
cd BillingUI
npm install
npm run build
```

The build output will be in `BillingUI/dist/`

## Step 4: Deployment Options

### Option A: IIS (Windows)

1. **Install IIS and .NET Hosting Bundle**
   - Download from: https://dotnet.microsoft.com/download/dotnet/8.0

2. **Deploy Backend**
   ```powershell
   # Copy publish folder to IIS directory
   Copy-Item -Path "BillingAPI\publish\*" -Destination "C:\inetpub\wwwroot\BillingAPI" -Recurse
   ```

3. **Configure IIS Application Pool**
   - Create new Application Pool
   - Set .NET CLR Version to "No Managed Code"
   - Set Managed Pipeline Mode to "Integrated"

4. **Create IIS Site**
   - Point to `C:\inetpub\wwwroot\BillingAPI`
   - Bind to port 80/443 with your domain

5. **Deploy Frontend**
   - Copy `BillingUI/dist/*` to `C:\inetpub\wwwroot\BillingUI`
   - Configure IIS to serve static files
   - Set up URL rewrite for SPA routing

### Option B: Linux with Nginx

1. **Install .NET Runtime**
   ```bash
   wget https://dot.net/v1/dotnet-install.sh
   chmod +x dotnet-install.sh
   ./dotnet-install.sh --channel 8.0
   ```

2. **Deploy Backend**
   ```bash
   # Copy published files
   sudo cp -r BillingAPI/publish/* /var/www/billing-api/
   
   # Create systemd service
   sudo nano /etc/systemd/system/billing-api.service
   ```

   Service file content:
   ```ini
   [Unit]
   Description=Billing API
   After=network.target

   [Service]
   Type=notify
   ExecStart=/usr/bin/dotnet /var/www/billing-api/BillingAPI.dll
   Restart=always
   RestartSec=10
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DB_CONNECTION_STRING="..."
   Environment=JWT_SECRET_KEY="..."
   Environment=CORS_ALLOWED_ORIGINS="https://yourdomain.com"

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable billing-api
   sudo systemctl start billing-api
   ```

3. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/billing-api
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection keep-alive;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       root /var/www/billing-ui;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Deploy Frontend**
   ```bash
   sudo cp -r BillingUI/dist/* /var/www/billing-ui/
   sudo chown -R www-data:www-data /var/www/billing-ui
   ```

5. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
   ```

### Option C: Docker

1. **Create Dockerfile for Backend**
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
   WORKDIR /app
   EXPOSE 80
   EXPOSE 443

   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["BillingAPI/BillingAPI.csproj", "BillingAPI/"]
   RUN dotnet restore "BillingAPI/BillingAPI.csproj"
   COPY . .
   WORKDIR "/src/BillingAPI"
   RUN dotnet build "BillingAPI.csproj" -c Release -o /app/build

   FROM build AS publish
   RUN dotnet publish "BillingAPI.csproj" -c Release -o /app/publish

   FROM base AS final
   WORKDIR /app
   COPY --from=publish /app/publish .
   ENTRYPOINT ["dotnet", "BillingAPI.dll"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     api:
       build:
         context: .
         dockerfile: BillingAPI/Dockerfile
       ports:
         - "5000:80"
       environment:
         - ASPNETCORE_ENVIRONMENT=Production
         - DB_CONNECTION_STRING=${DB_CONNECTION_STRING}
         - JWT_SECRET_KEY=${JWT_SECRET_KEY}
         - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
       restart: unless-stopped
   
     ui:
       image: nginx:alpine
       ports:
         - "80:80"
       volumes:
         - ./BillingUI/dist:/usr/share/nginx/html
         - ./nginx.conf:/etc/nginx/conf.d/default.conf
       restart: unless-stopped
   ```

## Step 5: Post-Deployment Verification

### 5.1 Test Backend
```bash
# Health check
curl https://api.yourdomain.com/api/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantCode":"YOUR_TENANT","email":"test@example.com","password":"password"}'
```

### 5.2 Test Frontend
- Open https://yourdomain.com
- Verify login works
- Test critical flows (create invoice, add product, etc.)

### 5.3 Check Logs
```bash
# Backend logs
tail -f BillingAPI/logs/billing-api-*.log

# Or if using systemd
journalctl -u billing-api -f
```

## Step 6: Security Checklist

- [ ] HTTPS is enabled and working
- [ ] JWT secret key is strong and secure
- [ ] Database credentials are secure
- [ ] CORS is configured for production domain only
- [ ] Swagger is disabled in production
- [ ] Environment variables are set correctly
- [ ] Firewall rules are configured
- [ ] Database backups are scheduled
- [ ] Log files are being rotated
- [ ] Error messages don't expose sensitive information

## Step 7: Monitoring Setup

### 7.1 Application Insights (Optional)
Add to `Program.cs`:
```csharp
builder.Services.AddApplicationInsightsTelemetry();
```

### 7.2 Health Checks
Already configured - access at `/health`

### 7.3 Log Monitoring
- Set up log aggregation (ELK, Seq, etc.)
- Configure alerts for errors
- Monitor performance metrics

## Troubleshooting

### Backend won't start
- Check environment variables are set
- Verify database connection
- Check logs in `logs/` directory
- Verify .NET runtime is installed

### Frontend can't connect to API
- Check CORS configuration
- Verify API URL in `.env.production`
- Check browser console for errors
- Verify API is running and accessible

### Database connection errors
- Verify connection string format
- Check SQL Server is running
- Verify firewall rules allow connection
- Test connection with `sqlcmd` or SQL Server Management Studio

## Support

For issues, check:
- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-deployment checklist
- `BillingAPI/TROUBLESHOOTING.md` - Common issues and solutions
- Application logs in `BillingAPI/logs/`

