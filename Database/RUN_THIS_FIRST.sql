-- =============================================
-- ⚡ QUICK FIX - RUN THIS FIRST ⚡
-- =============================================
-- Copy this entire file and paste into SQL Server Management Studio
-- Then press F5 to execute
-- =============================================

-- IMPORTANT: Change 'BillingDB' to your actual database name
USE [BillingDB]
GO

PRINT 'Starting RMG columns migration...'
GO

-- Add StyleCode
IF COL_LENGTH('Products', 'StyleCode') IS NULL
BEGIN
    ALTER TABLE Products ADD StyleCode NVARCHAR(50) NULL;
    PRINT '✓ Added StyleCode';
END
ELSE
    PRINT 'StyleCode already exists';
GO

-- Add Season
IF COL_LENGTH('Products', 'Season') IS NULL
BEGIN
    ALTER TABLE Products ADD Season NVARCHAR(50) NULL;
    PRINT '✓ Added Season';
END
ELSE
    PRINT 'Season already exists';
GO

-- Add Collection
IF COL_LENGTH('Products', 'Collection') IS NULL
BEGIN
    ALTER TABLE Products ADD Collection NVARCHAR(100) NULL;
    PRINT '✓ Added Collection';
END
ELSE
    PRINT 'Collection already exists';
GO

-- Add Gender
IF COL_LENGTH('Products', 'Gender') IS NULL
BEGIN
    ALTER TABLE Products ADD Gender NVARCHAR(20) NULL;
    PRINT '✓ Added Gender';
END
ELSE
    PRINT 'Gender already exists';
GO

-- Add FabricType
IF COL_LENGTH('Products', 'FabricType') IS NULL
BEGIN
    ALTER TABLE Products ADD FabricType NVARCHAR(50) NULL;
    PRINT '✓ Added FabricType';
END
ELSE
    PRINT 'FabricType already exists';
GO

-- Add SizeChartId
IF COL_LENGTH('Products', 'SizeChartId') IS NULL
BEGIN
    ALTER TABLE Products ADD SizeChartId INT NULL;
    PRINT '✓ Added SizeChartId';
END
ELSE
    PRINT 'SizeChartId already exists';
GO

-- Final verification
PRINT ''
PRINT '========================================'
PRINT 'Verification:'
PRINT '========================================'

DECLARE @Count INT = 0;
IF COL_LENGTH('Products', 'StyleCode') IS NOT NULL SET @Count = @Count + 1;
IF COL_LENGTH('Products', 'Season') IS NOT NULL SET @Count = @Count + 1;
IF COL_LENGTH('Products', 'Collection') IS NOT NULL SET @Count = @Count + 1;
IF COL_LENGTH('Products', 'Gender') IS NOT NULL SET @Count = @Count + 1;
IF COL_LENGTH('Products', 'FabricType') IS NOT NULL SET @Count = @Count + 1;
IF COL_LENGTH('Products', 'SizeChartId') IS NOT NULL SET @Count = @Count + 1;

IF @Count = 6
BEGIN
    PRINT '✓ SUCCESS: All 6 columns added!'
    PRINT '✓ Please restart your BillingAPI application now.'
END
ELSE
BEGIN
    PRINT '✗ WARNING: Only ' + CAST(@Count AS VARCHAR) + ' out of 6 columns found.'
    PRINT 'Please check the error messages above.'
END
GO

