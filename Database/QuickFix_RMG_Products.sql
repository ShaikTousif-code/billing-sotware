-- =============================================
-- QUICK FIX: Add RMG columns to Products table
-- =============================================
-- This script ONLY adds the missing columns to fix the immediate error
-- Run this in SQL Server Management Studio or Azure Data Studio
-- =============================================

-- IMPORTANT: Replace 'BillingDB' with your actual database name
USE [BillingDB]
GO

-- Check current database
SELECT DB_NAME() AS CurrentDatabase;
GO

-- Add StyleCode column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'StyleCode'
)
BEGIN
    ALTER TABLE Products ADD StyleCode NVARCHAR(50) NULL;
    PRINT '✓ Added StyleCode column';
END
ELSE
BEGIN
    PRINT 'StyleCode column already exists';
END
GO

-- Add Season column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'Season'
)
BEGIN
    ALTER TABLE Products ADD Season NVARCHAR(50) NULL;
    PRINT '✓ Added Season column';
END
ELSE
BEGIN
    PRINT 'Season column already exists';
END
GO

-- Add Collection column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'Collection'
)
BEGIN
    ALTER TABLE Products ADD Collection NVARCHAR(100) NULL;
    PRINT '✓ Added Collection column';
END
ELSE
BEGIN
    PRINT 'Collection column already exists';
END
GO

-- Add Gender column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'Gender'
)
BEGIN
    ALTER TABLE Products ADD Gender NVARCHAR(20) NULL;
    PRINT '✓ Added Gender column';
END
ELSE
BEGIN
    PRINT 'Gender column already exists';
END
GO

-- Add FabricType column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'FabricType'
)
BEGIN
    ALTER TABLE Products ADD FabricType NVARCHAR(50) NULL;
    PRINT '✓ Added FabricType column';
END
ELSE
BEGIN
    PRINT 'FabricType column already exists';
END
GO

-- Add SizeChartId column
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') 
    AND name = 'SizeChartId'
)
BEGIN
    ALTER TABLE Products ADD SizeChartId INT NULL;
    PRINT '✓ Added SizeChartId column';
END
ELSE
BEGIN
    PRINT 'SizeChartId column already exists';
END
GO

-- Verify all columns were added
PRINT '';
PRINT '========================================';
PRINT 'Verification: Checking added columns';
PRINT '========================================';

SELECT 
    COLUMN_NAME AS ColumnName,
    DATA_TYPE AS DataType,
    IS_NULLABLE AS IsNullable,
    CHARACTER_MAXIMUM_LENGTH AS MaxLength
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products'
    AND COLUMN_NAME IN ('StyleCode', 'Season', 'Collection', 'Gender', 'FabricType', 'SizeChartId')
ORDER BY COLUMN_NAME;

IF @@ROWCOUNT = 6
BEGIN
    PRINT '';
    PRINT '✓ SUCCESS: All 6 RMG columns have been added to Products table!';
    PRINT 'You can now restart your API application.';
END
ELSE
BEGIN
    PRINT '';
    PRINT '⚠ WARNING: Not all columns were found. Please check the output above.';
END
GO

