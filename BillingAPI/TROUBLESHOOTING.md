# API Troubleshooting Guide

## API Stuck/Infinite Loop Issues

If the API gets stuck during startup, follow these steps:

### Quick Fix: Disable Hangfire

1. **Edit `appsettings.json`** and set:
```json
{
  "Hangfire": {
    "Enabled": false
  }
}
```

2. **Restart the API**

### Stop Stuck API Process

#### Windows PowerShell:
```powershell
# Find the process
Get-Process -Name "BillingAPI" -ErrorAction SilentlyContinue

# Kill the process
Stop-Process -Name "BillingAPI" -Force
```

#### Windows CMD:
```cmd
taskkill /F /IM BillingAPI.exe
```

#### Or use Task Manager:
1. Press `Ctrl + Shift + Esc`
2. Find "BillingAPI" process
3. Right-click → End Task

### Common Causes of API Getting Stuck

1. **Hangfire Database Connection**
   - Hangfire tries to connect to SQL Server during startup
   - If database is slow or unreachable, it can hang
   - **Solution**: Disable Hangfire or fix database connection

2. **Database Connection Timeout**
   - SQL Server connection string might be incorrect
   - Database server might be down
   - **Solution**: Check connection string in `appsettings.json`

3. **Hangfire Schema Creation**
   - Hangfire tries to create tables if they don't exist
   - Can hang if database permissions are insufficient
   - **Solution**: Set `PrepareSchemaIfNecessary = false` (already done)

### Permanent Solution: Disable Hangfire

If Hangfire keeps causing issues, you can permanently disable it:

1. Set `"Hangfire": { "Enabled": false }` in `appsettings.json`
2. The API will start without Hangfire
3. Background jobs won't run, but the API will work normally

### Check API Logs

Look for errors in:
- Console output when starting the API
- Application logs (if configured)
- Windows Event Viewer

### Verify Database Connection

Test your connection string:
```powershell
# Test SQL Server connection
sqlcmd -S "HOORIYASHAIK\SQLEXPRESS" -E -Q "SELECT 1"
```

### Restart Clean

1. Stop the API process
2. Delete `bin` and `obj` folders:
   ```powershell
   Remove-Item -Recurse -Force bin, obj
   ```
3. Rebuild:
   ```powershell
   dotnet clean
   dotnet build
   ```
4. Run:
   ```powershell
   dotnet run
   ```

## Prevention

The current configuration:
- ✅ Hangfire is optional (can be disabled)
- ✅ Hangfire initialization is non-blocking
- ✅ Database timeouts are configured
- ✅ Error handling prevents startup failures

If issues persist, disable Hangfire completely.

