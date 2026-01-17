-- Add UPIId column to Tenants table
-- This script adds UPI ID support for receiving payments at the store/tenant level

USE smartbillingsoluition;
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Tenants' AND COLUMN_NAME = 'UPIId'
)
BEGIN
    ALTER TABLE Tenants
    ADD UPIId NVARCHAR(100) NULL;
    
    PRINT 'UPIId column added to Tenants table successfully.';
END
ELSE
BEGIN
    PRINT 'UPIId column already exists in Tenants table.';
END
GO

