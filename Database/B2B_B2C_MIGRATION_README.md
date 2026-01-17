# B2B/B2C Features Database Migration

## ⚠️ IMPORTANT: Run This Migration First!

The new B2B/B2C features require database schema updates. **All API requests will fail** until this migration is applied.

## Quick Fix

### Option 1: SQL Server Management Studio (Recommended)

1. **Open SSMS**
   - Connect to your SQL Server instance
   - Navigate to your database (usually `BillingDB`)

2. **Open and Execute Migration Script**
   - File → Open → File
   - Select: `Database/Migration_B2B_B2C_Features.sql`
   - Press **F5** to execute
   - Wait for "Migration completed successfully!" message

### Option 2: Command Line

```bash
sqlcmd -S YOUR_SERVER -d BillingDB -E -i "Database\Migration_B2B_B2C_Features.sql"
```

### Option 3: PowerShell

```powershell
Invoke-Sqlcmd -ServerInstance "YOUR_SERVER" -Database "BillingDB" -InputFile "Database\Migration_B2B_B2C_Features.sql"
```

## What This Migration Adds

### Customers Table
- `CustomerType` (B2B/B2C)
- `CustomerGroupId` (for B2C pricing groups)
- `PaymentTerms` (Net 30, Net 60, etc.)
- `CreditDays` (number of credit days)
- `LoyaltyPointsEarned` (total lifetime points)
- `LoyaltyPointsRedeemed` (total lifetime redeemed)

### Invoices Table
- `PaymentTerms` (payment terms for this invoice)
- `DueDate` (payment due date for B2B)
- `IsTaxInvoice` (flag for GST invoices)
- `PlaceOfSupply` (for GST compliance)
- `LoyaltyPointsEarned` (points earned in this invoice)
- `LoyaltyPointsRedeemed` (points redeemed in this invoice)

### New Tables
- `BulkPricings` - Volume pricing tiers
- `LoyaltyTransactions` - Loyalty points transaction history

## Verification

After running the migration, verify with:

```sql
USE BillingDB;
GO

-- Check new columns in Customers
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' 
AND COLUMN_NAME IN ('CustomerType', 'PaymentTerms', 'CreditDays', 'LoyaltyPointsEarned');
GO

-- Check new columns in Invoices
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Invoices' 
AND COLUMN_NAME IN ('PaymentTerms', 'DueDate', 'IsTaxInvoice', 'LoyaltyPointsEarned');
GO

-- Check new tables exist
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('BulkPricings', 'LoyaltyTransactions');
GO
```

## After Migration

1. **Restart the API** (if it's running)
2. **Test API endpoints** - they should work now
3. **Verify frontend** - B2B/B2C features should be functional

## Troubleshooting

### Error: "Invalid column name"
- The migration didn't run completely
- Check the Messages tab in SSMS for errors
- Re-run the migration script

### Error: "Table already exists"
- Some tables/columns already exist - this is fine
- The script uses IF NOT EXISTS checks
- Continue with the migration

### API still failing
- Make sure you restarted the API after migration
- Check API logs for specific error messages
- Verify all columns/tables were created using the verification queries above

