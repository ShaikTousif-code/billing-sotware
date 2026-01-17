-- Fix Students and Fees tables - Add missing columns
USE BillingDB;
GO

-- ============================================
-- FIX STUDENTS TABLE
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Gender')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [Gender] NVARCHAR(20) NULL;
    PRINT 'Added Gender column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'City')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [City] NVARCHAR(100) NULL;
    PRINT 'Added City column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'State')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [State] NVARCHAR(100) NULL;
    PRINT 'Added State column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Pincode')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [Pincode] NVARCHAR(20) NULL;
    PRINT 'Added Pincode column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Course')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [Course] NVARCHAR(200) NULL;
    PRINT 'Added Course column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Department')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [Department] NVARCHAR(200) NULL;
    PRINT 'Added Department column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [Status] NVARCHAR(50) NULL;
    PRINT 'Added Status column to Students';
END
GO

-- Update Status column for existing rows
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Status')
BEGIN
    UPDATE [dbo].[Students] SET [Status] = CASE WHEN [IsActive] = 1 THEN 'Active' ELSE 'Inactive' END WHERE [Status] IS NULL;
    ALTER TABLE [dbo].[Students] ALTER COLUMN [Status] NVARCHAR(50) NOT NULL;
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_Students_Status')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD CONSTRAINT DF_Students_Status DEFAULT 'Active' FOR [Status];
    END
    PRINT 'Updated Status column values';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'GuardianName')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [GuardianName] NVARCHAR(200) NULL;
    PRINT 'Added GuardianName column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'GuardianPhone')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [GuardianPhone] NVARCHAR(20) NULL;
    PRINT 'Added GuardianPhone column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'ScholarshipAmount')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [ScholarshipAmount] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added ScholarshipAmount column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'IsScholarshipApplicable')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [IsScholarshipApplicable] BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsScholarshipApplicable column to Students';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE [dbo].[Students] ADD [UpdatedAt] DATETIME2 NULL;
    PRINT 'Added UpdatedAt column to Students';
END

-- ============================================
-- FIX FEES TABLE
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Fees]') AND name = 'Term')
BEGIN
    ALTER TABLE [dbo].[Fees] ADD [Term] NVARCHAR(50) NULL;
    PRINT 'Added Term column to Fees';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Fees]') AND name = 'Month')
BEGIN
    ALTER TABLE [dbo].[Fees] ADD [Month] NVARCHAR(50) NULL;
    PRINT 'Added Month column to Fees';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Fees]') AND name = 'Notes')
BEGIN
    ALTER TABLE [dbo].[Fees] ADD [Notes] NVARCHAR(MAX) NULL;
    PRINT 'Added Notes column to Fees';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Fees]') AND name = 'PaidDate')
BEGIN
    ALTER TABLE [dbo].[Fees] ADD [PaidDate] DATETIME2 NULL;
    PRINT 'Added PaidDate column to Fees';
END

PRINT 'Students and Fees tables fix completed!';
GO

