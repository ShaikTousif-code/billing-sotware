# Quick Deployment Guide

## 🚀 Fastest Way to Deploy

### Option 1: SQL Server Management Studio (Recommended)

1. **Open SSMS**
   - Connect to: `HOORIYASHAIK\SQLEXPRESS`

2. **Open Script**
   - File → Open → File
   - Select: `Database/Deploy_All_Scripts.sql`

3. **Execute**
   - Press F5 or Click Execute
   - Wait for "Deployment completed successfully!"

---

### Option 2: Batch File (Windows)

1. **Double-click**: `Database/Deploy_To_SQLServer.bat`
2. **Wait for completion**
3. **Check for success message**

---

### Option 3: PowerShell

1. **Open PowerShell** (as Administrator)
2. **Navigate to Database folder**:
   ```powershell
   cd Database
   ```
3. **Run script**:
   ```powershell
   .\Deploy_To_SQLServer.ps1
   ```

---

### Option 4: Command Line (sqlcmd)

```bash
sqlcmd -S HOORIYASHAIK\SQLEXPRESS -E -i "Database\Deploy_All_Scripts.sql"
```

---

## ✅ Verification

After deployment, run this in SSMS:

```sql
USE BillingDB;
GO

-- Count all tables
SELECT COUNT(*) AS TotalTables 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';
GO

-- List all tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO
```

**Expected:** Should show 40+ tables including:
- Core: Tenants, Users, Products, Customers, Invoices, Payments
- School: Classes, Students, Fees, FeePayments, FeeStructures
- Office: OfficeClients, Projects, ProjectInvoices, ServiceContracts
- Advanced: InstallmentPlans, TimeEntries, Milestones, Documents, FeeConcessions

---

## 📝 Connection String Updated

The connection string in `BillingAPI/appsettings.json` has been updated to:
```
Server=HOORIYASHAIK\SQLEXPRESS;Database=BillingDB;Trusted_Connection=True
```

---

## 🎯 Next Steps

1. ✅ Database deployed
2. ⏭️ Start API: `cd BillingAPI && dotnet run`
3. ⏭️ Start UI: `cd BillingUI && npm run dev`

---

## ⚠️ Troubleshooting

**Error: Cannot connect**
- Verify SQL Server Express is running
- Check server name: `HOORIYASHAIK\SQLEXPRESS`
- Try: `Services.msc` → SQL Server (SQLEXPRESS) → Start

**Error: Permission denied**
- Run SSMS/PowerShell as Administrator
- Verify Windows account has SQL Server access

**Error: Database exists**
- Script uses `IF NOT EXISTS` - safe to run multiple times
- Existing data will be preserved

---

**Ready to deploy!** 🚀

