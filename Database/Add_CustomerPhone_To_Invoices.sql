-- =============================================
-- ADD CUSTOMER PHONE FIELD TO INVOICES TABLE
-- =============================================
-- This script adds an optional CustomerPhone column
-- to store mobile number for walk-in customers
-- =============================================

USE [smartbillingsoluition]
GO

PRINT '========================================';
PRINT 'Adding CustomerPhone column to Invoices table...';
PRINT '========================================';
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Invoices' 
    AND COLUMN_NAME = 'CustomerPhone'
)
BEGIN
    ALTER TABLE [Invoices]
    ADD [CustomerPhone] NVARCHAR(20) NULL;
    
    PRINT '✓ CustomerPhone column added successfully';
    PRINT '  This column stores mobile number for walk-in customers';
END
ELSE
BEGIN
    PRINT 'CustomerPhone column already exists';
END
GO

PRINT '========================================';
PRINT 'Migration completed successfully!';
PRINT '========================================';
GO

