-- Migration: Add Expiry Configuration Fields
-- Date: 2026-01-19
-- Description: Adds expiry configuration fields to Products and status field to Batches

USE [smartbillingsoluition];
GO

-- Add ManufacturingDate and expiry configuration fields to Products table
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'ManufacturingDate'
)
BEGIN
    ALTER TABLE [Products]
    ADD [ManufacturingDate] DATETIME2 NULL;
    
    PRINT '✓ Added ManufacturingDate column to Products table';
END
ELSE
BEGIN
    PRINT 'ℹ ManufacturingDate column already exists in Products table';
END
GO

-- Add expiry configuration fields to Products table
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'ExpiryType'
)
BEGIN
    ALTER TABLE [Products]
    ADD [ExpiryType] NVARCHAR(50) NULL,
        [ExpireAfterValue] INT NULL,
        [ExpireAfterUnit] NVARCHAR(50) NULL,
        [AlertBeforeValue] INT NULL,
        [AlertBeforeUnit] NVARCHAR(50) NULL,
        [IsExpiryEnabled] BIT NOT NULL DEFAULT 0;
    
    PRINT '✓ Added expiry configuration columns to Products table';
END
ELSE
BEGIN
    PRINT 'ℹ Expiry configuration columns already exist in Products table';
END
GO

-- Add status field to Batches table
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Batches' 
    AND COLUMN_NAME = 'Status'
)
BEGIN
    ALTER TABLE [Batches]
    ADD [Status] NVARCHAR(50) NULL;
    
    PRINT '✓ Added Status column to Batches table';
END
ELSE
BEGIN
    PRINT 'ℹ Status column already exists in Batches table';
END
GO

-- Set initial status for existing batches (run separately to avoid issues)
BEGIN TRY
    UPDATE [Batches]
    SET [Status] = CASE 
        WHEN [ExpiryDate] IS NULL THEN N'ACTIVE'
        WHEN CAST([ExpiryDate] AS DATE) < CAST(GETUTCDATE() AS DATE) THEN N'EXPIRED'
        ELSE N'ACTIVE'
    END
    WHERE [Status] IS NULL;
    
    PRINT '✓ Updated status for existing batches';
END TRY
BEGIN CATCH
    PRINT '⚠ Warning: Could not update batch status. Error: ' + ERROR_MESSAGE();
END CATCH
GO

PRINT '✓ Migration completed successfully!';
GO

