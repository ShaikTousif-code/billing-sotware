# API Error Fix: "An error occurred while processing your request"

## 🔴 Problem

All API requests are failing with the error: **"An error occurred while processing your request"**

## 🔍 Root Cause

The new B2B/B2C features added new database columns and tables, but the database schema hasn't been updated yet. Entity Framework is trying to query columns that don't exist, causing database errors.

## ✅ Solution: Run Database Migration

### Step 1: Stop the API (if running)
- Close the API process/terminal
- This allows the database migration to run without conflicts

### Step 2: Run the Migration Script

**Option A: SQL Server Management Studio (Easiest)**
1. Open SSMS
2. Connect to your SQL Server (e.g., `HOORIYASHAIK\SQLEXPRESS`)
3. Select your database (usually `BillingDB`)
4. File → Open → File
5. Navigate to: `Database/Migration_B2B_B2C_Features.sql`
6. Press **F5** to execute
7. Wait for "Migration completed successfully!" message

**Option B: Command Line**
```bash
sqlcmd -S YOUR_SERVER -d BillingDB -E -i "Database\Migration_B2B_B2C_Features.sql"
```

**Option C: PowerShell**
```powershell
Invoke-Sqlcmd -ServerInstance "YOUR_SERVER" -Database "BillingDB" -InputFile "Database\Migration_B2B_B2C_Features.sql"
```

### Step 3: Restart the API
```bash
cd BillingAPI
dotnet run
```

### Step 4: Verify
- API should start without errors
- Try making an API request
- Check that endpoints respond correctly

## 📋 What the Migration Adds

### New Columns in `Customers` Table:
- `CustomerType` (B2B/B2C)
- `CustomerGroupId` (for pricing groups)
- `PaymentTerms` (Net 30, Net 60, etc.)
- `CreditDays` (number of credit days)
- `LoyaltyPointsEarned` (total lifetime)
- `LoyaltyPointsRedeemed` (total lifetime)

### New Columns in `Invoices` Table:
- `PaymentTerms`
- `DueDate`
- `IsTaxInvoice`
- `PlaceOfSupply`
- `LoyaltyPointsEarned`
- `LoyaltyPointsRedeemed`

### New Tables:
- `BulkPricings` (volume pricing)
- `LoyaltyTransactions` (loyalty history)

## 🔧 Verification Query

After migration, run this to verify:

```sql
USE BillingDB;
GO

-- Check Customers columns
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' 
AND COLUMN_NAME IN ('CustomerType', 'PaymentTerms', 'CreditDays');
GO

-- Check Invoices columns
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Invoices' 
AND COLUMN_NAME IN ('PaymentTerms', 'DueDate', 'IsTaxInvoice');
GO

-- Check new tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('BulkPricings', 'LoyaltyTransactions');
GO
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test in a development environment first
3. **Data Safety**: The migration uses `IF NOT EXISTS` checks, so it's safe to run multiple times
4. **Default Values**: Existing records will get default values (B2C for CustomerType, 0 for numeric fields)

## 🐛 If Issues Persist

1. **Check API Logs**: Look in `BillingAPI/logs/` for detailed error messages
2. **Check Database Connection**: Verify connection string in `appsettings.json`
3. **Verify Migration**: Run the verification queries above
4. **Check Entity Framework**: Ensure all models match the database schema

## 📞 Quick Test

After migration, test with:

```bash
# Test customers endpoint
curl http://localhost:5000/api/customers

# Test products endpoint  
curl http://localhost:5000/api/products
```

Both should return data without errors.

