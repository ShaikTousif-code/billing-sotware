# RMG Features Database Migration Guide

## Problem
You're getting this error:
```
Invalid column name 'Collection'.
Invalid column name 'FabricType'.
Invalid column name 'Gender'.
Invalid column name 'Season'.
Invalid column name 'SizeChartId'.
Invalid column name 'StyleCode'.
```

This means the RMG columns haven't been added to your Products table yet.

## Solution: Run the Migration Script

### Step 1: Open SQL Server Management Studio (SSMS) or Azure Data Studio

### Step 2: Connect to Your Database
- Connect to your SQL Server instance
- Make sure you're connected to the correct database (usually `BillingDB`)

### Step 3: Open the Migration Script
- Open the file: `Database/QuickFix_RMG_Products.sql`
- OR open: `Database/Migration_RMG_Features.sql` (for full migration)

### Step 4: Update Database Name (if needed)
- Look for this line near the top:
  ```sql
  USE [BillingDB]
  ```
- Replace `BillingDB` with your actual database name if different

### Step 5: Execute the Script
- Press `F5` or click "Execute"
- Wait for the script to complete
- You should see messages like:
  ```
  ✓ Added StyleCode column
  ✓ Added Season column
  ✓ Added Collection column
  ✓ Added Gender column
  ✓ Added FabricType column
  ✓ Added SizeChartId column
  ✓ SUCCESS: All 6 RMG columns have been added to Products table!
  ```

### Step 6: Restart Your API
- Stop your BillingAPI application
- Start it again
- The error should be resolved

## Quick Fix Script (Recommended for Immediate Fix)
**File:** `Database/QuickFix_RMG_Products.sql`
- Only adds the 6 missing columns to Products table
- Safe to run multiple times (checks if columns exist first)
- Takes less than 1 minute to execute

## Full Migration Script (Recommended for Complete Setup)
**File:** `Database/Migration_RMG_Features.sql`
- Adds all RMG features:
  - RMG columns in Products table
  - ProductVariantCombinations table
  - SizeCharts table
  - SalesReturns and SalesReturnItems tables
  - SalesExchanges and SalesExchangeItems tables
  - All indexes and foreign keys
- Safe to run multiple times (idempotent)
- Takes 2-3 minutes to execute

## Verification

After running the script, verify the columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products'
    AND COLUMN_NAME IN ('StyleCode', 'Season', 'Collection', 'Gender', 'FabricType', 'SizeChartId')
ORDER BY COLUMN_NAME;
```

You should see 6 rows returned.

## Troubleshooting

### Error: "Invalid object name 'Products'"
- Make sure you're connected to the correct database
- Check the database name in the `USE [DatabaseName]` statement

### Error: "Cannot find the object 'Products'"
- The table might be in a different schema (e.g., `dbo.Products`)
- Try: `SELECT * FROM dbo.Products` to verify

### Columns still not found after running script
- Check if you're connected to the correct database
- Verify the script executed without errors
- Run the verification query above

## Need Help?

If you continue to have issues:
1. Check the SQL Server error messages in the output window
2. Verify you have ALTER TABLE permissions on the database
3. Make sure no other processes are locking the Products table

