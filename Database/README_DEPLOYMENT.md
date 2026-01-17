# Database Deployment Guide

## 🎯 Target Server
**Server:** `HOORIYASHAIK\SQLEXPRESS`  
**Database:** `BillingDB`

---

## 📋 Deployment Scripts

### Option 1: Complete All-in-One Script (Recommended)
**File:** `Deploy_Complete_All_Tables.sql`

This script includes **ALL tables** from all migration scripts:
- ✅ Base Schema (Tenants, Users, Products, Customers, Invoices, etc.)
- ✅ New Features (CreditNotes, Refunds, ActivityLogs, ProductVariants, etc.)
- ✅ Business Modules (Tables, KOTs, JobCards, Appointments, BundleProducts)
- ✅ 100% Features (UnitConversions, GRNs, SerialNumbers)
- ✅ School/Office Billing (Classes, Students, Fees, Projects, etc.)
- ✅ Advanced Features (InstallmentPlans, TimeEntries, Milestones, Documents, FeeConcessions)
- ✅ All Indexes
- ✅ Default Data (Roles, Permissions)

**Use this script for fresh deployment or to ensure all tables exist.**

---

### Option 2: Original Consolidated Script
**File:** `Deploy_All_Scripts.sql`

This is a simplified version with core tables. Use `Deploy_Complete_All_Tables.sql` instead.

---

## 🚀 Quick Deployment

### Method 1: SQL Server Management Studio (SSMS)

1. **Open SSMS**
   - Connect to: `HOORIYASHAIK\SQLEXPRESS`
   - Use Windows Authentication

2. **Open Script**
   - File → Open → File
   - Select: `Database/Deploy_Complete_All_Tables.sql`

3. **Execute**
   - Press **F5** or Click **Execute**
   - Wait for completion
   - Check Messages tab for success messages

---

### Method 2: Batch File

**Double-click:** `Database/Deploy_To_SQLServer.bat`

This will automatically run the deployment script.

---

### Method 3: PowerShell

```powershell
cd Database
.\Deploy_To_SQLServer.ps1
```

---

### Method 4: Command Line (sqlcmd)

```bash
sqlcmd -S HOORIYASHAIK\SQLEXPRESS -E -i "Database\Deploy_Complete_All_Tables.sql"
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

**Expected:** Should show **60+ tables** including all core, business, school, office, and advanced feature tables.

---

## 📊 Tables Included

### Core Tables (15+)
- Tenants, Users, Roles, UserRoles
- Products, ProductCategories
- Customers, Suppliers
- Invoices, InvoiceItems, Payments
- Inventories, StockTransactions
- PurchaseOrders, PurchaseOrderItems
- TenantConfigurations, TaxConfigurations

### New Features (15+)
- CreditNotes, CreditNoteItems
- Refunds
- ActivityLogs
- ProductVariants
- PriceLists, PriceListItems
- Warehouses, WarehouseInventories
- Batches
- Permissions, RolePermissions
- CustomerGroups
- WalletTransactions
- PurchaseReturns, PurchaseReturnItems
- BankAccounts
- InvoiceTemplates

### Business Modules (8+)
- Tables, KOTs, KOTItems
- JobCards, JobCardItems
- Appointments
- BundleProducts, BundleItems

### 100% Features (4+)
- UnitConversions
- GRNs, GRNItems
- SerialNumbers

### School/Office Billing (10+)
- Classes, Students
- FeeStructures, Fees, FeePayments
- OfficeClients
- Projects, ProjectInvoices, ProjectInvoiceItems
- ProjectExpenses
- ServiceContracts, ContractInvoices

### Advanced Features (7+)
- InstallmentPlans, Installments
- TimeEntries
- Milestones, Deliverables
- Documents
- FeeConcessions

**Total: 60+ tables with all indexes and relationships**

---

## ⚙️ Connection String

The connection string in `BillingAPI/appsettings.json` has been updated to:
```
Server=HOORIYASHAIK\SQLEXPRESS;Database=BillingDB;Trusted_Connection=True;MultipleActiveResultSets=true
```

---

## 🔧 Troubleshooting

### Error: Cannot connect to server
- Verify SQL Server Express is running
- Check server name: `HOORIYASHAIK\SQLEXPRESS`
- Try: `Services.msc` → SQL Server (SQLEXPRESS) → Start

### Error: Permission denied
- Run SSMS/PowerShell as Administrator
- Verify Windows account has SQL Server access

### Error: Database exists
- Script uses `IF NOT EXISTS` - safe to run multiple times
- Existing data will be preserved
- Missing tables will be created

### Error: Table already exists
- Script checks for existence before creating
- Safe to run multiple times
- Only missing tables will be created

---

## 📝 Notes

- ✅ Script is **idempotent** - safe to run multiple times
- ✅ Uses `IF NOT EXISTS` checks for all tables
- ✅ Preserves existing data
- ✅ Creates indexes automatically
- ✅ Inserts default roles and permissions
- ✅ All foreign key relationships are configured

---

## 🎯 Next Steps

1. ✅ Database deployed
2. ⏭️ Start API: `cd BillingAPI && dotnet run`
3. ⏭️ Start UI: `cd BillingUI && npm run dev`
4. ⏭️ Test the application

---

**Ready to deploy!** 🚀

