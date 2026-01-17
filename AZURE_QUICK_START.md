# Azure App Service Quick Start Guide

## Quick Deployment (5 Minutes)

### Prerequisites
- Azure account (sign up at https://azure.microsoft.com/free/)
- Azure CLI installed (or use Azure Portal)

### Step 1: Install Azure CLI (if not installed)

**Windows (PowerShell):**
```powershell
# Download and install from:
# https://aka.ms/installazurecliwindows

# Or using winget
winget install -e --id Microsoft.AzureCLI
```

**Verify installation:**
```powershell
az --version
```

### Step 2: Login to Azure

```powershell
az login
```

This will open a browser for authentication.

### Step 3: Run Deployment Script

```powershell
# Navigate to project root
cd C:\Users\shaik\source\BillingSoftware

# Run deployment script
.\deploy-to-azure.ps1 `
  -ResourceGroupName "billing-software-rg" `
  -AppServiceName "billing-api-$(Get-Random)" `
  -Location "centralindia"
```

**Note:** App Service name must be globally unique. The script will generate a random name.

### Step 4: Configure Application Settings

After deployment, configure these in Azure Portal:

1. Go to Azure Portal → Your App Service → **Configuration** → **Application settings**

2. Add/Update these settings:

```
ASPNETCORE_ENVIRONMENT = Production
DB_CONNECTION_STRING = Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=Cenduit@hyd12;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
JWT_SECRET_KEY = [Generate using: -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})]
CORS_ALLOWED_ORIGINS = https://yourdomain.com
```

3. Click **Save** (app will restart)

### Step 5: Configure SQL Database Firewall

1. Go to Azure Portal → SQL Databases → `smartbillingsoluition`
2. Navigate to **Networking**
3. **Enable:** "Allow Azure services and resources to access this server"
4. Click **Save**

### Step 6: Test Deployment

```powershell
# Test health endpoint
curl https://YOUR_APP_NAME.azurewebsites.net/api/health

# Or open in browser
# https://YOUR_APP_NAME.azurewebsites.net/api/health
```

## Manual Deployment (Azure Portal)

### 1. Create App Service

1. Go to https://portal.azure.com
2. Click **Create a resource** → Search **Web App** → **Create**
3. Fill in:
   - **Name:** `billing-api-XXXX` (unique name)
   - **Runtime stack:** .NET 8 (LTS)
   - **Operating System:** Windows
   - **Region:** Central India or South India
   - **App Service Plan:** Create new → **Free (F1)**
4. Click **Review + Create** → **Create**

### 2. Deploy Code

**Option A: ZIP Deploy**

1. Build and publish locally:
```powershell
cd BillingAPI
dotnet publish --configuration Release --output ./publish
Compress-Archive -Path .\publish\* -DestinationPath .\deploy.zip -Force
```

2. In Azure Portal:
   - Go to your App Service → **Deployment Center**
   - Select **Local Git** or **ZIP Deploy**
   - Upload `deploy.zip`

**Option B: Visual Studio**

1. Right-click `BillingAPI` project
2. **Publish** → **Azure** → **Azure App Service**
3. Select your App Service
4. Click **Publish**

### 3. Configure Settings

Go to **Configuration** → **Application settings** and add:

| Name | Value |
|------|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `DB_CONNECTION_STRING` | `Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=Cenduit@hyd12;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;` |
| `JWT_SECRET_KEY` | `[Your generated secret key]` |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com` |

### 4. Configure Database Firewall

1. Azure Portal → SQL Databases → `smartbillingsoluition`
2. **Networking** → Enable "Allow Azure services"
3. **Save**

## Verify Deployment

### Check Logs

1. Azure Portal → Your App Service → **Log stream**
2. Monitor startup logs

### Test Endpoints

```powershell
# Health check
Invoke-WebRequest -Uri "https://YOUR_APP_NAME.azurewebsites.net/api/health"

# API endpoint (should return 401 - not authenticated, which is expected)
Invoke-WebRequest -Uri "https://YOUR_APP_NAME.azurewebsites.net/api/products"
```

## Troubleshooting

### App Won't Start

1. **Check Logs:** App Service → **Log stream**
2. **Common Issues:**
   - Missing `DB_CONNECTION_STRING` environment variable
   - Database firewall blocking connection
   - Missing dependencies

### Database Connection Failed

1. **Verify Firewall:**
   - Azure Portal → SQL Database → **Networking**
   - Ensure "Allow Azure services" is enabled

2. **Test Connection:**
   - Use Kudu Console: `https://YOUR_APP_NAME.scm.azurewebsites.net`
   - Navigate to **Debug Console** → **CMD**
   - Test connection

### High CPU/Memory

- Free tier has 60 minutes/day CPU limit
- Monitor in **Metrics** section
- Consider upgrading to Basic tier if needed

## Cost

**Free Tier (F1):**
- App Service: $0/month
- 60 minutes CPU/day
- 1 GB RAM
- 1 GB storage

**Azure SQL Database:**
- Check your current pricing tier
- Free tier available for testing

## Next Steps

1. ✅ Deploy frontend
2. ✅ Configure custom domain (optional)
3. ✅ Set up monitoring
4. ✅ Configure backups

## Support

- Azure Documentation: https://docs.microsoft.com/azure/app-service
- Azure Status: https://status.azure.com

