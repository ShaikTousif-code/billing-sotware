-- Fix FeeStructures table - Add missing columns
USE BillingDB;
GO

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FeeStructures]') AND name = 'Name')
BEGIN
    ALTER TABLE [dbo].[FeeStructures]
    ADD [Name] NVARCHAR(200) NOT NULL DEFAULT 'Fee Structure';
    PRINT 'Added Name column to FeeStructures';
END
ELSE
    PRINT 'Name column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FeeStructures]') AND name = 'Frequency')
BEGIN
    ALTER TABLE [dbo].[FeeStructures]
    ADD [Frequency] NVARCHAR(50) NOT NULL DEFAULT 'Monthly';
    PRINT 'Added Frequency column to FeeStructures';
END
ELSE
    PRINT 'Frequency column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FeeStructures]') AND name = 'IsMandatory')
BEGIN
    ALTER TABLE [dbo].[FeeStructures]
    ADD [IsMandatory] BIT NOT NULL DEFAULT 1;
    PRINT 'Added IsMandatory column to FeeStructures';
END
ELSE
    PRINT 'IsMandatory column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FeeStructures]') AND name = 'IsActive')
BEGIN
    ALTER TABLE [dbo].[FeeStructures]
    ADD [IsActive] BIT NOT NULL DEFAULT 1;
    PRINT 'Added IsActive column to FeeStructures';
END
ELSE
    PRINT 'IsActive column already exists';

PRINT 'FeeStructures table fix completed!';
GO

