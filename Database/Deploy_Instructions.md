# Database Deployment Instructions

## Target Server
**Server Name:** `HOORIYASHAIK\SQLEXPRESS`  
**Database:** `BillingDB`

---

## Deployment Methods

### Method 1: Using SQL Server Management Studio (SSMS)

1. **Open SQL Server Management Studio**
   - Connect to server: `HOORIYASHAIK\SQLEXPRESS`
   - Use Windows Authentication

2. **Open the Deployment Script**
   - File → Open → File
   - Navigate to: `Database/Deploy_All_Scripts.sql`

3. **Execute the Script**
   - Click "Execute" (F5)
   - Wait for completion
   - Check Messages tab for success messages

---

### Method 2: Using sqlcmd Command Line

```bash
sqlcmd -S HOORIYASHAIK\SQLEXPRESS -E -i "Database\Deploy_All_Scripts.sql"
```

**Parameters:**
- `-S`: Server name
- `-E`: Use Windows Authentication
- `-i`: Input file path

---

### Method 3: Using PowerShell

```powershell
$server = "HOORIYASHAIK\SQLEXPRESS"
$database = "BillingDB"
$scriptPath = "Database\Deploy_All_Scripts.sql"

Invoke-Sqlcmd -ServerInstance $server -Database $database -InputFile $scriptPath
```

---

## Verification

After deployment, verify the database:

```sql
USE BillingDB;
GO

-- Check if all tables exist
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

-- Should show all tables including:
-- Tenants, Users, Products, Customers, Invoices, Payments
-- Classes, Students, Fees, FeePayments
-- OfficeClients, Projects, ProjectInvoices
-- InstallmentPlans, Installments, TimeEntries
-- Milestones, Deliverables, Documents, FeeConcessions
```

---

## Update Connection String

The connection string in `BillingAPI/appsettings.json` has been updated to:
```
Server=HOORIYASHAIK\SQLEXPRESS;Database=BillingDB;Trusted_Connection=True;MultipleActiveResultSets=true
```

---

## Troubleshooting

### Error: Cannot connect to server
- Verify SQL Server is running
- Check if SQL Server Express is installed
- Verify server name is correct: `HOORIYASHAIK\SQLEXPRESS`

### Error: Database already exists
- The script will skip creation if database exists
- Existing tables will be skipped (IF NOT EXISTS checks)

### Error: Permission denied
- Ensure you have sysadmin or db_owner permissions
- Try running as Administrator

### Error: Login failed
- Use Windows Authentication
- Verify your Windows account has SQL Server access

---

## Next Steps

1. ✅ Database deployed
2. ✅ Connection string updated
3. ⏭️ Start the API: `dotnet run` in `BillingAPI` folder
4. ⏭️ Start the UI: `npm run dev` in `BillingUI` folder

---

## Notes

- The script uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- All tables are created with proper indexes and foreign keys
- Default roles (Owner, Manager, Staff) are inserted automatically
- The script will print progress messages for each table created

