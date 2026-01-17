# PowerShell Script to Deploy All SQL Scripts to SQL Server
# Target Server: HOORIYASHAIK\SQLEXPRESS
# Database: BillingDB

$serverName = "HOORIYASHAIK\SQLEXPRESS"
$databaseName = "BillingDB"
$scriptPath = Join-Path $PSScriptRoot "Deploy_All_Scripts.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SQL Server Database Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server: $serverName" -ForegroundColor Yellow
Write-Host "Database: $databaseName" -ForegroundColor Yellow
Write-Host "Script: $scriptPath" -ForegroundColor Yellow
Write-Host ""

# Check if SQL Server module is available
if (-not (Get-Module -ListAvailable -Name SqlServer)) {
    Write-Host "Installing SqlServer PowerShell module..." -ForegroundColor Yellow
    Install-Module -Name SqlServer -Scope CurrentUser -Force -AllowClobber
}

try {
    Write-Host "Connecting to SQL Server..." -ForegroundColor Green
    
    # Read the SQL script
    $sqlScript = Get-Content -Path $scriptPath -Raw -Encoding UTF8
    
    # Execute the script
    Invoke-Sqlcmd -ServerInstance $serverName -Database "master" -Query $sqlScript -ErrorAction Stop
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database '$databaseName' has been created/updated on server '$serverName'" -ForegroundColor Cyan
    Write-Host "All tables, indexes, and relationships have been deployed." -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify SQL Server is running" -ForegroundColor Yellow
    Write-Host "2. Check server name: $serverName" -ForegroundColor Yellow
    Write-Host "3. Ensure you have sysadmin or db_owner permissions" -ForegroundColor Yellow
    Write-Host "4. Try running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

