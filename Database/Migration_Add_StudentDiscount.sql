-- Migration: Add Student-Level Discount Fields
-- Description: Adds discount percentage, amount, reason, and active flag to Students table
-- Date: 2025-01-XX

USE [YourDatabaseName] -- Replace with your actual database name
GO

BEGIN TRANSACTION;

-- Add discount fields to Students table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Students]') 
    AND name = 'DiscountPercentage'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD [DiscountPercentage] DECIMAL(5,2) NULL;
    
    PRINT 'Added DiscountPercentage column to Students table';
END
ELSE
BEGIN
    PRINT 'DiscountPercentage column already exists in Students table';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Students]') 
    AND name = 'DiscountAmount'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD [DiscountAmount] DECIMAL(18,2) NULL;
    
    PRINT 'Added DiscountAmount column to Students table';
END
ELSE
BEGIN
    PRINT 'DiscountAmount column already exists in Students table';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Students]') 
    AND name = 'DiscountReason'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD [DiscountReason] NVARCHAR(500) NULL;
    
    PRINT 'Added DiscountReason column to Students table';
END
ELSE
BEGIN
    PRINT 'DiscountReason column already exists in Students table';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Students]') 
    AND name = 'IsDiscountActive'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD [IsDiscountActive] BIT NOT NULL DEFAULT 1;
    
    PRINT 'Added IsDiscountActive column to Students table';
END
ELSE
BEGIN
    PRINT 'IsDiscountActive column already exists in Students table';
END
GO

-- Add check constraint to ensure only one discount type is set
IF NOT EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = 'CK_Students_DiscountType'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD CONSTRAINT CK_Students_DiscountType 
    CHECK (
        (DiscountPercentage IS NULL AND DiscountAmount IS NULL) OR
        (DiscountPercentage IS NOT NULL AND DiscountAmount IS NULL) OR
        (DiscountPercentage IS NULL AND DiscountAmount IS NOT NULL)
    );
    
    PRINT 'Added check constraint to ensure only one discount type is set';
END
ELSE
BEGIN
    PRINT 'Check constraint CK_Students_DiscountType already exists';
END
GO

-- Add check constraint for discount percentage range
IF NOT EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = 'CK_Students_DiscountPercentage_Range'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD CONSTRAINT CK_Students_DiscountPercentage_Range 
    CHECK (DiscountPercentage IS NULL OR (DiscountPercentage >= 0 AND DiscountPercentage <= 100));
    
    PRINT 'Added check constraint for discount percentage range (0-100)';
END
ELSE
BEGIN
    PRINT 'Check constraint CK_Students_DiscountPercentage_Range already exists';
END
GO

-- Add check constraint for discount amount
IF NOT EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = 'CK_Students_DiscountAmount_Positive'
)
BEGIN
    ALTER TABLE [dbo].[Students]
    ADD CONSTRAINT CK_Students_DiscountAmount_Positive 
    CHECK (DiscountAmount IS NULL OR DiscountAmount >= 0);
    
    PRINT 'Added check constraint for positive discount amount';
END
ELSE
BEGIN
    PRINT 'Check constraint CK_Students_DiscountAmount_Positive already exists';
END
GO

COMMIT TRANSACTION;
GO

PRINT 'Migration completed successfully!';
PRINT 'Student discount fields have been added to the Students table.';
GO

