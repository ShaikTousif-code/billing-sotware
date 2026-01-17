-- =============================================
-- FIX SizeCharts Table - Add Missing Columns
-- =============================================
-- This script adds the IsDefault column if it's missing
-- =============================================

USE [smartbillingsoluition]
GO

PRINT 'Checking SizeCharts table structure...';
GO

-- Check if IsDefault column exists
IF COL_LENGTH('SizeCharts', 'IsDefault') IS NULL
BEGIN
    ALTER TABLE SizeCharts ADD IsDefault BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added IsDefault column to SizeCharts table';
END
ELSE
BEGIN
    PRINT 'IsDefault column already exists in SizeCharts table';
END
GO

-- Ensure SizeValues column exists (should already exist from migration)
IF COL_LENGTH('SizeCharts', 'SizeValues') IS NULL
BEGIN
    ALTER TABLE SizeCharts ADD SizeValues NVARCHAR(MAX) NOT NULL DEFAULT '';
    PRINT '✓ Added SizeValues column to SizeCharts table';
END
ELSE
BEGIN
    PRINT 'SizeValues column already exists';
END
GO

-- Verify all required columns exist
PRINT '';
PRINT '========================================';
PRINT 'SizeCharts Table Structure Verification';
PRINT '========================================';

SELECT 
    COLUMN_NAME AS ColumnName,
    DATA_TYPE AS DataType,
    CHARACTER_MAXIMUM_LENGTH AS MaxLength,
    IS_NULLABLE AS IsNullable,
    COLUMN_DEFAULT AS DefaultValue
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SizeCharts'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '========================================';
PRINT 'Fix completed!';
PRINT '========================================';
GO

