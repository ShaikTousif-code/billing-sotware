# Azure App Service Deployment Script
# This script helps deploy the Billing API to Azure App Service

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "centralindia",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanName = "billing-api-plan"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Azure App Service Deployment Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version 2>&1
    Write-Host "✓ Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI not found. Please install it from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $account = az account show 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Please login to Azure..." -ForegroundColor Yellow
        az login
    } else {
        Write-Host "✓ Already logged in to Azure" -ForegroundColor Green
    }
} catch {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}

Write-Host ""
Write-Host "Step 1: Building application..." -ForegroundColor Yellow
Set-Location BillingAPI
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Restore failed" -ForegroundColor Red
    exit 1
}

dotnet build --configuration Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Publishing application..." -ForegroundColor Yellow
dotnet publish --configuration Release --output ./publish
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Publish failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Publish successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Creating deployment package..." -ForegroundColor Yellow
Set-Location publish
Compress-Archive -Path * -DestinationPath ..\deploy.zip -Force
Set-Location ..\..
Write-Host "✓ Deployment package created: BillingAPI\deploy.zip" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✓ Resource group exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Checking App Service Plan..." -ForegroundColor Yellow
$planExists = az appservice plan list --resource-group $ResourceGroupName --query "[?name=='$AppServicePlanName']" -o tsv
if (-not $planExists) {
    Write-Host "Creating App Service Plan: $AppServicePlanName (Free tier)" -ForegroundColor Yellow
    az appservice plan create `
        --name $AppServicePlanName `
        --resource-group $ResourceGroupName `
        --sku FREE `
        --is-linux false
    Write-Host "✓ App Service Plan created" -ForegroundColor Green
} else {
    Write-Host "✓ App Service Plan exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 6: Checking Web App..." -ForegroundColor Yellow
$appExists = az webapp list --resource-group $ResourceGroupName --query "[?name=='$AppServiceName']" -o tsv
if (-not $appExists) {
    Write-Host "Creating Web App: $AppServiceName" -ForegroundColor Yellow
    az webapp create `
        --name $AppServiceName `
        --resource-group $ResourceGroupName `
        --plan $AppServicePlanName `
        --runtime "DOTNET|8.0"
    Write-Host "✓ Web App created" -ForegroundColor Green
} else {
    Write-Host "✓ Web App exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 7: Configuring application settings..." -ForegroundColor Yellow

# Read connection string from appsettings.Production.json
$prodConfig = Get-Content "BillingAPI\appsettings.Production.json" | ConvertFrom-Json
$connectionString = $prodConfig.ConnectionStrings.DefaultConnection

# Set environment variables
az webapp config appsettings set `
    --resource-group $ResourceGroupName `
    --name $AppServiceName `
    --settings `
        ASPNETCORE_ENVIRONMENT="Production" `
        DB_CONNECTION_STRING="$connectionString" `
    --output none

Write-Host "✓ Application settings configured" -ForegroundColor Green
Write-Host "  Note: You still need to set JWT_SECRET_KEY and CORS_ALLOWED_ORIGINS manually" -ForegroundColor Yellow

Write-Host ""
Write-Host "Step 8: Deploying application..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $ResourceGroupName `
    --name $AppServiceName `
    --src "BillingAPI\deploy.zip"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your API is available at:" -ForegroundColor Yellow
Write-Host "https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set JWT_SECRET_KEY in Azure Portal → Configuration → Application settings" -ForegroundColor White
Write-Host "2. Set CORS_ALLOWED_ORIGINS in Azure Portal → Configuration → Application settings" -ForegroundColor White
Write-Host "3. Configure Azure SQL Database firewall to allow Azure services" -ForegroundColor White
Write-Host "4. Test the API: https://$AppServiceName.azurewebsites.net/api/health" -ForegroundColor White
Write-Host ""

