-- =============================================
-- Quick Fix: Add RMG columns to Products table
-- =============================================
-- Run this script if you're getting errors about missing columns
-- =============================================

USE [BillingDB] -- Replace with your database name
GO

BEGIN TRANSACTION;
GO

-- Add StyleCode column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'StyleCode')
BEGIN
    ALTER TABLE [Products] ADD [StyleCode] NVARCHAR(50) NULL;
    PRINT 'Added StyleCode column to Products table';
END
ELSE
BEGIN
    PRINT 'StyleCode column already exists';
END
GO

-- Add Season column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Season')
BEGIN
    ALTER TABLE [Products] ADD [Season] NVARCHAR(50) NULL;
    PRINT 'Added Season column to Products table';
END
ELSE
BEGIN
    PRINT 'Season column already exists';
END
GO

-- Add Collection column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Collection')
BEGIN
    ALTER TABLE [Products] ADD [Collection] NVARCHAR(100) NULL;
    PRINT 'Added Collection column to Products table';
END
ELSE
BEGIN
    PRINT 'Collection column already exists';
END
GO

-- Add Gender column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Gender')
BEGIN
    ALTER TABLE [Products] ADD [Gender] NVARCHAR(20) NULL;
    PRINT 'Added Gender column to Products table';
END
ELSE
BEGIN
    PRINT 'Gender column already exists';
END
GO

-- Add FabricType column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'FabricType')
BEGIN
    ALTER TABLE [Products] ADD [FabricType] NVARCHAR(50) NULL;
    PRINT 'Added FabricType column to Products table';
END
ELSE
BEGIN
    PRINT 'FabricType column already exists';
END
GO

-- Add SizeChartId column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'SizeChartId')
BEGIN
    ALTER TABLE [Products] ADD [SizeChartId] INT NULL;
    PRINT 'Added SizeChartId column to Products table';
END
ELSE
BEGIN
    PRINT 'SizeChartId column already exists';
END
GO

-- Verify all columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products'
    AND COLUMN_NAME IN ('StyleCode', 'Season', 'Collection', 'Gender', 'FabricType', 'SizeChartId')
ORDER BY COLUMN_NAME;
GO

COMMIT TRANSACTION;
GO

PRINT 'RMG Products columns fix completed successfully!';
GO

