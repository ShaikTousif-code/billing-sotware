@echo off
REM Batch Script to Deploy SQL Scripts to SQL Server
REM Target Server: HOORIYASHAIK\SQLEXPRESS
REM Database: BillingDB

echo ========================================
echo SQL Server Database Deployment
echo ========================================
echo Server: HOORIYASHAIK\SQLEXPRESS
echo Database: BillingDB
echo ========================================
echo.

REM Check if sqlcmd is available
where sqlcmd >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: sqlcmd is not found in PATH
    echo Please install SQL Server Command Line Utilities
    echo Or use SQL Server Management Studio (SSMS)
    pause
    exit /b 1
)

REM Deploy the script
echo Deploying database script...
sqlcmd -S HOORIYASHAIK\SQLEXPRESS -E -i "%~dp0Deploy_All_Scripts.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Deployment completed successfully!
    echo ========================================
    echo.
    echo Database 'BillingDB' has been created/updated
    echo All tables, indexes, and relationships have been deployed.
) else (
    echo.
    echo ========================================
    echo Deployment failed!
    echo ========================================
    echo.
    echo Troubleshooting:
    echo 1. Verify SQL Server is running
    echo 2. Check server name: HOORIYASHAIK\SQLEXPRESS
    echo 3. Ensure you have sysadmin or db_owner permissions
    echo 4. Try running as Administrator
)

pause

