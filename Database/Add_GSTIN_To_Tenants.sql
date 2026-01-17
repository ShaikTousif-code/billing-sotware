-- Add GSTIN column to Tenants table
-- This script adds GST number support at the store/tenant level

USE smartbillingsoluition;
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Tenants' AND COLUMN_NAME = 'GSTIN'
)
BEGIN
    ALTER TABLE Tenants
    ADD GSTIN NVARCHAR(50) NULL;
    
    PRINT 'GSTIN column added to Tenants table successfully.';
END
ELSE
BEGIN
    PRINT 'GSTIN column already exists in Tenants table.';
END
GO

