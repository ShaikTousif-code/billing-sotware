-- =============================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SSMS
-- =============================================
-- This will add all 6 missing RMG columns to Products table
-- =============================================

-- Step 1: Make sure you're using the correct database
-- Replace 'BillingDB' with your actual database name
USE [BillingDB]
GO

-- Step 2: Add the columns (safe to run multiple times)
IF COL_LENGTH('Products', 'StyleCode') IS NULL
    ALTER TABLE Products ADD StyleCode NVARCHAR(50) NULL;
GO

IF COL_LENGTH('Products', 'Season') IS NULL
    ALTER TABLE Products ADD Season NVARCHAR(50) NULL;
GO

IF COL_LENGTH('Products', 'Collection') IS NULL
    ALTER TABLE Products ADD Collection NVARCHAR(100) NULL;
GO

IF COL_LENGTH('Products', 'Gender') IS NULL
    ALTER TABLE Products ADD Gender NVARCHAR(20) NULL;
GO

IF COL_LENGTH('Products', 'FabricType') IS NULL
    ALTER TABLE Products ADD FabricType NVARCHAR(50) NULL;
GO

IF COL_LENGTH('Products', 'SizeChartId') IS NULL
    ALTER TABLE Products ADD SizeChartId INT NULL;
GO

-- Step 3: Verify columns were added
SELECT 
    'StyleCode' AS ColumnName, 
    CASE WHEN COL_LENGTH('Products', 'StyleCode') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS Status
UNION ALL
SELECT 'Season', CASE WHEN COL_LENGTH('Products', 'Season') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'Collection', CASE WHEN COL_LENGTH('Products', 'Collection') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'Gender', CASE WHEN COL_LENGTH('Products', 'Gender') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'FabricType', CASE WHEN COL_LENGTH('Products', 'FabricType') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'SizeChartId', CASE WHEN COL_LENGTH('Products', 'SizeChartId') IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END;
GO

PRINT '========================================';
PRINT 'Migration completed!';
PRINT 'Please restart your BillingAPI application.';
PRINT '========================================';
GO

