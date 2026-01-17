# Production Database Setup - Azure SQL Database

## Connection String Configuration

The production database is configured to use Azure SQL Database:

**Server:** `tcp:touseef.database.windows.net,1433`  
**Database:** `smartbillingsoluition`  
**User ID:** `touseef`  
**Password:** [Set via environment variable or replace in appsettings.Production.json]

## Setup Instructions

### Option 1: Using Environment Variable (Recommended - More Secure)

Set the `DB_CONNECTION_STRING` environment variable with your actual password:

**Windows (PowerShell):**
```powershell
$env:DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

**Linux/Mac (Bash):**
```bash
export DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

**For systemd service (Linux):**
Add to `/etc/systemd/system/billing-api.service`:
```ini
[Service]
Environment=DB_CONNECTION_STRING="Server=tcp:touseef.database.windows.net,1433;Initial Catalog=smartbillingsoluition;Persist Security Info=False;User ID=touseef;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

### Option 2: Using appsettings.Production.json

1. Open `BillingAPI/appsettings.Production.json`
2. Find the `ConnectionStrings.DefaultConnection` section
3. Replace `{your_password}` with your actual Azure SQL Database password
4. **Warning:** This stores the password in plain text. Use environment variables for better security.

## Azure SQL Database Configuration

### Firewall Rules

Ensure your application server's IP address is allowed in Azure SQL Database firewall:

1. Go to Azure Portal → SQL Databases → `smartbillingsoluition`
2. Navigate to "Networking" or "Firewall and virtual networks"
3. Add your server's IP address or enable "Allow Azure services and resources to access this server"

### Connection String Parameters Explained

- **Server:** Azure SQL Database server endpoint
- **Initial Catalog:** Database name
- **User ID:** Database username
- **Password:** Database password (set via environment variable)
- **Encrypt=True:** Required for Azure SQL Database
- **TrustServerCertificate=False:** Validates SSL certificate
- **Connection Timeout=30:** 30 second timeout for connections
- **MultipleActiveResultSets=False:** Disabled for Azure SQL

## Testing Connection

### Using SQL Server Management Studio (SSMS)

1. Open SSMS
2. Server name: `touseef.database.windows.net`
3. Authentication: SQL Server Authentication
4. Login: `touseef`
5. Password: [Your password]
6. Click "Connect"

### Using Azure Portal

1. Go to Azure Portal → SQL Databases → `smartbillingsoluition`
2. Click "Query editor"
3. Login with `touseef` credentials
4. Test queries

### From Application

The application will automatically use the connection string from:
1. `DB_CONNECTION_STRING` environment variable (if set)
2. `appsettings.Production.json` (if environment variable not set)

## Security Best Practices

1. ✅ **Use Environment Variables:** Store password in environment variables, not in config files
2. ✅ **Azure Key Vault:** Consider using Azure Key Vault for production secrets
3. ✅ **Firewall Rules:** Restrict database access to specific IP addresses
4. ✅ **SSL/TLS:** Always use `Encrypt=True` for Azure SQL Database
5. ✅ **Strong Password:** Use a strong, unique password for database user
6. ✅ **Regular Backups:** Ensure Azure SQL Database backups are configured

## Troubleshooting

### Connection Timeout
- Check firewall rules in Azure Portal
- Verify server IP is whitelisted
- Check network connectivity

### Authentication Failed
- Verify username and password
- Check if user account is active
- Verify database name is correct

### SSL/TLS Errors
- Ensure `Encrypt=True` is set
- Check `TrustServerCertificate=False` (for production)
- Verify Azure SQL Database SSL certificate

## Next Steps

After configuring the connection string:

1. Run database migrations (if needed)
2. Test connection from application
3. Verify all tables are created
4. Test critical operations (login, create invoice, etc.)

