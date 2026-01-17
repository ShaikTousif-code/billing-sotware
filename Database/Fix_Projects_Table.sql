-- Fix Projects table - Add missing columns
USE BillingDB;
GO

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'ExpectedCompletionDate')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [ExpectedCompletionDate] DATETIME2 NULL;
    PRINT 'Added ExpectedCompletionDate column';
END
ELSE
    PRINT 'ExpectedCompletionDate column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'PaidAmount')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added PaidAmount column';
END
ELSE
    PRINT 'PaidAmount column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'BalanceAmount')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [BalanceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added BalanceAmount column';
END
ELSE
    PRINT 'BalanceAmount column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'ProjectManager')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [ProjectManager] NVARCHAR(200) NULL;
    PRINT 'Added ProjectManager column';
END
ELSE
    PRINT 'ProjectManager column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'Notes')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [Notes] NVARCHAR(MAX) NULL;
    PRINT 'Added Notes column';
END
ELSE
    PRINT 'Notes column already exists';

PRINT 'Projects table fix completed!';
GO

