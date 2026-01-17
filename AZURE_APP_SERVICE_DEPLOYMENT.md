# Azure App Service Deployment Guide

## Prerequisites

- Azure account (free tier available)
- Azure SQL Database (already configured: `touseef.database.windows.net`)
- .NET 8.0 SDK installed locally
- Azure CLI or Azure Portal access

## Step 1: Prepare the Application

### 1.1 Build the Application

```powershell
cd BillingAPI
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --output ./publish
```

### 1.2 Verify Production Configuration

Ensure `appsettings.Production.json` has the correct connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=Cenduit@hyd12;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

## Step 2: Create Azure App Service

### Option A: Using Azure Portal

1. **Sign in to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with your Azure account

2. **Create App Service**
   - Click "Create a resource"
   - Search for "Web App"
   - Click "Create"

3. **Configure Basic Settings**
   - **Subscription:** Select your subscription (Free tier available)
   - **Resource Group:** Create new or use existing
   - **Name:** `billing-api` (must be globally unique)
   - **Publish:** Code
   - **Runtime stack:** .NET 8 (LTS)
   - **Operating System:** Windows (or Linux)
   - **Region:** Choose closest to your users (e.g., Central India, South India)
   - **App Service Plan:** 
     - Click "Create new"
     - Name: `billing-api-plan`
     - **SKU and size:** Free (F1) - 1 GB RAM, 1 GB storage
     - Click "OK"

4. **Review and Create**
   - Review settings
   - Click "Create"
   - Wait for deployment (2-3 minutes)

### Option B: Using Azure CLI

```powershell
# Login to Azure
az login

# Set variables
$resourceGroup = "billing-software-rg"
$appServicePlan = "billing-api-plan"
$appName = "billing-api-$(Get-Random)"
$location = "centralindia"  # or "southindia"

# Create resource group
az group create --name $resourceGroup --location $location

# Create App Service Plan (Free tier)
az appservice plan create `
  --name $appServicePlan `
  --resource-group $resourceGroup `
  --sku FREE `
  --is-linux false

# Create Web App
az webapp create `
  --name $appName `
  --resource-group $resourceGroup `
  --plan $appServicePlan `
  --runtime "DOTNET|8.0"

Write-Host "App Service created: https://$appName.azurewebsites.net"
```

## Step 3: Configure Application Settings

### 3.1 Set Environment Variables

In Azure Portal:

1. Go to your App Service
2. Navigate to **Configuration** → **Application settings**
3. Add the following settings:

```
ASPNETCORE_ENVIRONMENT = Production
DB_CONNECTION_STRING = Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=Cenduit@hyd12;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
JWT_SECRET_KEY = [Generate a strong 64-character secret key]
CORS_ALLOWED_ORIGINS = https://yourdomain.com,https://www.yourdomain.com
```

**Generate JWT Secret Key:**
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

4. Click **Save** (this will restart the app)

### 3.2 Configure CORS

1. Go to **CORS** section
2. Add allowed origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - Or use `*` for development (not recommended for production)

## Step 4: Configure Azure SQL Database Firewall

1. Go to Azure Portal → SQL Databases → `smartbillingsoluition`
2. Navigate to **Networking** or **Firewall and virtual networks**
3. **Enable "Allow Azure services and resources to access this server"** (Important!)
4. Add your App Service's outbound IP addresses:
   - Go to your App Service → **Properties**
   - Copy "Outbound IP addresses"
   - Add each IP to SQL Database firewall rules

## Step 5: Deploy the Application

### Option A: Deploy from Local Machine (ZIP Deploy)

1. **Create deployment package:**
```powershell
cd BillingAPI
dotnet publish --configuration Release --output ./publish
Compress-Archive -Path .\publish\* -DestinationPath .\deploy.zip -Force
```

2. **Deploy using Azure CLI:**
```powershell
az webapp deployment source config-zip `
  --resource-group billing-software-rg `
  --name billing-api `
  --src .\deploy.zip
```

### Option B: Deploy from Visual Studio

1. Right-click on `BillingAPI` project
2. Select **Publish**
3. Choose **Azure** → **Azure App Service (Windows)**
4. Select your App Service
5. Click **Publish**

### Option C: Deploy from GitHub Actions (CI/CD)

1. **Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    
    - name: Restore dependencies
      run: dotnet restore BillingAPI/BillingAPI.csproj
    
    - name: Build
      run: dotnet build BillingAPI/BillingAPI.csproj --configuration Release --no-restore
    
    - name: Publish
      run: dotnet publish BillingAPI/BillingAPI.csproj --configuration Release --no-build --output ./publish
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'billing-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./publish
```

2. **Get Publish Profile:**
   - Go to App Service → **Get publish profile**
   - Copy the content
   - Add to GitHub Secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`

### Option D: Deploy using VS Code

1. Install **Azure App Service** extension
2. Sign in to Azure
3. Right-click on `publish` folder
4. Select **Deploy to Web App**
5. Choose your App Service

## Step 6: Configure Additional Settings

### 6.1 Enable Always On (Optional - Not available in Free tier)

Free tier doesn't support Always On. App will cold start after inactivity.

### 6.2 Configure Logging

1. Go to **App Service logs**
2. Enable **Application Logging (Filesystem)**
3. Set level to **Warning** or **Error** for production
4. Enable **Detailed Error Messages** (for troubleshooting)

### 6.3 Set Custom Domain (Optional)

1. Go to **Custom domains**
2. Click **Add custom domain**
3. Follow instructions to verify domain
4. Configure DNS records

## Step 7: Test Deployment

### 7.1 Health Check

```powershell
# Test health endpoint
curl https://billing-api.azurewebsites.net/api/health

# Or in browser
https://billing-api.azurewebsites.net/api/health
```

### 7.2 Test API Endpoints

```powershell
# Test login endpoint
curl -X POST https://billing-api.azurewebsites.net/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"tenantCode":"YOUR_TENANT","email":"test@example.com","password":"password"}'
```

### 7.3 Check Logs

1. Go to **Log stream** in Azure Portal
2. Monitor real-time logs
3. Or download logs from **Logs** section

## Step 8: Database Migration

### Option A: Run Migrations from Local Machine

```powershell
# Set connection string temporarily
$env:DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=Cenduit@hyd12;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Run migrations
cd BillingAPI
dotnet ef database update --configuration Release
```

### Option B: Run SQL Scripts Manually

1. Connect to Azure SQL Database using SSMS or Azure Portal Query Editor
2. Run scripts from `Database` folder:
   - `MASTER_MIGRATION_smartbillingsoluition.sql`
   - `Create_SupportTickets_Table.sql`
   - Any other migration scripts

## Step 9: Update Frontend Configuration

Update `BillingUI/.env.production`:

```env
VITE_API_BASE_URL=https://billing-api.azurewebsites.net
VITE_API_TIMEOUT=30000
```

## Step 10: Free Tier Limitations

### App Service Free Tier (F1) Limits:

- **Compute:** 60 minutes/day shared CPU
- **Memory:** 1 GB RAM
- **Storage:** 1 GB
- **Custom domains:** Not supported
- **SSL:** Free SSL certificate available
- **Always On:** Not available (app may cold start)
- **Scaling:** Manual scaling only (1 instance)

### Recommendations:

1. **Monitor Usage:** Check Azure Portal → Metrics for CPU/Memory usage
2. **Optimize Performance:** 
   - Enable response compression
   - Use caching where possible
   - Optimize database queries
3. **Upgrade When Needed:** Consider Basic tier (B1) for production if free tier is insufficient

## Troubleshooting

### App Won't Start

1. **Check Logs:**
   - Go to **Log stream** in Azure Portal
   - Check for startup errors

2. **Common Issues:**
   - Missing environment variables
   - Database connection string incorrect
   - Firewall blocking database access
   - Missing dependencies

### Database Connection Errors

1. **Verify Firewall Rules:**
   - Ensure "Allow Azure services" is enabled
   - Add App Service outbound IPs to firewall

2. **Test Connection:**
   ```powershell
   # Test from App Service Kudu Console
   # Go to: https://billing-api.scm.azurewebsites.net
   # Navigate to Debug Console → CMD
   # Test connection
   ```

### High CPU/Memory Usage

1. **Monitor Metrics:**
   - Check Azure Portal → Metrics
   - Identify peak usage times

2. **Optimize:**
   - Review slow queries
   - Enable caching
   - Consider upgrading to Basic tier

## Security Checklist

- [ ] Environment variables set (not in code)
- [ ] Database password stored securely
- [ ] JWT secret key is strong and unique
- [ ] CORS configured for specific domains
- [ ] HTTPS enabled (automatic with Azure)
- [ ] Swagger disabled in production
- [ ] Firewall rules configured
- [ ] Application logs enabled

## Cost Estimation (Free Tier)

- **App Service (F1):** $0/month (60 minutes/day limit)
- **Azure SQL Database:** Check your current pricing tier
- **Bandwidth:** First 5 GB free, then pay-as-you-go
- **Total:** $0 + SQL Database costs

## Next Steps

1. Deploy frontend to Azure Static Web Apps or another hosting service
2. Set up custom domain
3. Configure SSL certificate (automatic with Azure)
4. Set up monitoring and alerts
5. Configure automated backups for database

## Support Resources

- Azure App Service Documentation: https://docs.microsoft.com/azure/app-service
- .NET on Azure: https://docs.microsoft.com/dotnet/azure/
- Azure SQL Database: https://docs.microsoft.com/azure/azure-sql/

