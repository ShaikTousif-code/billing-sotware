-- Migration: B2B and B2C Features
-- Adds support for Business-to-Business and Business-to-Consumer features
-- Date: 2025-01-15

USE [BillingDB];
GO

PRINT 'Starting B2B/B2C Features Migration...';
GO

-- ============================================
-- 0. Add Barcode Column to Products Table
-- ============================================

-- Add Barcode column to Products
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Barcode')
BEGIN
    ALTER TABLE [Products]
    ADD [Barcode] NVARCHAR(100) NULL;
    PRINT 'Added Barcode column to Products table.';
END
ELSE
BEGIN
    PRINT 'Barcode column already exists in Products table.';
END
GO

-- Create index on Barcode if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Barcode')
BEGIN
    CREATE INDEX [IX_Products_Barcode] ON [Products]([Barcode]) WHERE [Barcode] IS NOT NULL;
    PRINT 'Created index IX_Products_Barcode.';
END
ELSE
BEGIN
    PRINT 'Index IX_Products_Barcode already exists.';
END
GO

-- ============================================
-- 1. Update Customers Table for B2B/B2C Support
-- ============================================

-- Add CustomerType column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'CustomerType')
BEGIN
    ALTER TABLE [Customers]
    ADD [CustomerType] NVARCHAR(10) NOT NULL DEFAULT 'B2C';
    PRINT 'Added CustomerType column to Customers table.';
END
ELSE
BEGIN
    PRINT 'CustomerType column already exists in Customers table.';
END
GO

-- Add CustomerGroupId column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'CustomerGroupId')
BEGIN
    ALTER TABLE [Customers]
    ADD [CustomerGroupId] INT NULL;
    PRINT 'Added CustomerGroupId column to Customers table.';
END
ELSE
BEGIN
    PRINT 'CustomerGroupId column already exists in Customers table.';
END
GO

-- Add PaymentTerms column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'PaymentTerms')
BEGIN
    ALTER TABLE [Customers]
    ADD [PaymentTerms] NVARCHAR(50) NULL;
    PRINT 'Added PaymentTerms column to Customers table.';
END
ELSE
BEGIN
    PRINT 'PaymentTerms column already exists in Customers table.';
END
GO

-- Add CreditDays column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'CreditDays')
BEGIN
    ALTER TABLE [Customers]
    ADD [CreditDays] INT NULL;
    PRINT 'Added CreditDays column to Customers table.';
END
ELSE
BEGIN
    PRINT 'CreditDays column already exists in Customers table.';
END
GO

-- Add LoyaltyPointsEarned column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'LoyaltyPointsEarned')
BEGIN
    ALTER TABLE [Customers]
    ADD [LoyaltyPointsEarned] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added LoyaltyPointsEarned column to Customers table.';
END
ELSE
BEGIN
    PRINT 'LoyaltyPointsEarned column already exists in Customers table.';
END
GO

-- Add LoyaltyPointsRedeemed column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'LoyaltyPointsRedeemed')
BEGIN
    ALTER TABLE [Customers]
    ADD [LoyaltyPointsRedeemed] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added LoyaltyPointsRedeemed column to Customers table.';
END
ELSE
BEGIN
    PRINT 'LoyaltyPointsRedeemed column already exists in Customers table.';
END
GO

-- Add foreign key for CustomerGroupId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_CustomerGroups_CustomerGroupId')
BEGIN
    ALTER TABLE [Customers]
    ADD CONSTRAINT [FK_Customers_CustomerGroups_CustomerGroupId]
    FOREIGN KEY ([CustomerGroupId]) REFERENCES [CustomerGroups]([Id]) ON DELETE SET NULL;
    PRINT 'Added foreign key FK_Customers_CustomerGroups_CustomerGroupId.';
END
ELSE
BEGIN
    PRINT 'Foreign key FK_Customers_CustomerGroups_CustomerGroupId already exists.';
END
GO

-- ============================================
-- 2. Update Invoices Table for B2B/B2C Support
-- ============================================

-- Add PaymentTerms column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'PaymentTerms')
BEGIN
    ALTER TABLE [Invoices]
    ADD [PaymentTerms] NVARCHAR(50) NULL;
    PRINT 'Added PaymentTerms column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'PaymentTerms column already exists in Invoices table.';
END
GO

-- Add DueDate column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'DueDate')
BEGIN
    ALTER TABLE [Invoices]
    ADD [DueDate] DATETIME2 NULL;
    PRINT 'Added DueDate column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'DueDate column already exists in Invoices table.';
END
GO

-- Add IsTaxInvoice column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'IsTaxInvoice')
BEGIN
    ALTER TABLE [Invoices]
    ADD [IsTaxInvoice] BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsTaxInvoice column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'IsTaxInvoice column already exists in Invoices table.';
END
GO

-- Add PlaceOfSupply column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'PlaceOfSupply')
BEGIN
    ALTER TABLE [Invoices]
    ADD [PlaceOfSupply] NVARCHAR(200) NULL;
    PRINT 'Added PlaceOfSupply column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'PlaceOfSupply column already exists in Invoices table.';
END
GO

-- Add LoyaltyPointsEarned column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'LoyaltyPointsEarned')
BEGIN
    ALTER TABLE [Invoices]
    ADD [LoyaltyPointsEarned] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added LoyaltyPointsEarned column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'LoyaltyPointsEarned column already exists in Invoices table.';
END
GO

-- Add LoyaltyPointsRedeemed column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'LoyaltyPointsRedeemed')
BEGIN
    ALTER TABLE [Invoices]
    ADD [LoyaltyPointsRedeemed] DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'Added LoyaltyPointsRedeemed column to Invoices table.';
END
ELSE
BEGIN
    PRINT 'LoyaltyPointsRedeemed column already exists in Invoices table.';
END
GO

-- ============================================
-- 3. Create BulkPricing Table
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BulkPricings')
BEGIN
    CREATE TABLE [dbo].[BulkPricings] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [CustomerType] NVARCHAR(10) NOT NULL DEFAULT 'B2B',
        [CustomerGroupId] INT NULL,
        [MinQuantity] DECIMAL(18,2) NOT NULL,
        [MaxQuantity] DECIMAL(18,2) NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [DiscountPercentage] DECIMAL(5,2) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([CustomerGroupId]) REFERENCES [CustomerGroups]([Id]) ON DELETE SET NULL
    );
    PRINT 'Table BulkPricings created.';
END
ELSE
BEGIN
    PRINT 'Table BulkPricings already exists.';
END
GO

-- Create index on BulkPricings
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BulkPricings_TenantId_ProductId')
BEGIN
    CREATE INDEX [IX_BulkPricings_TenantId_ProductId] ON [BulkPricings]([TenantId], [ProductId]);
    PRINT 'Created index IX_BulkPricings_TenantId_ProductId.';
END
GO

-- ============================================
-- 4. Create LoyaltyTransactions Table
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LoyaltyTransactions')
BEGIN
    CREATE TABLE [dbo].[LoyaltyTransactions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [CustomerId] INT NOT NULL,
        [TransactionType] NVARCHAR(20) NOT NULL,
        [Points] DECIMAL(18,2) NOT NULL,
        [ReferenceType] NVARCHAR(50) NULL,
        [ReferenceId] INT NULL,
        [Notes] NVARCHAR(500) NULL,
        [TransactionDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]) ON DELETE CASCADE
    );
    PRINT 'Table LoyaltyTransactions created.';
END
ELSE
BEGIN
    PRINT 'Table LoyaltyTransactions already exists.';
END
GO

-- Create index on LoyaltyTransactions
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoyaltyTransactions_TenantId_CustomerId')
BEGIN
    CREATE INDEX [IX_LoyaltyTransactions_TenantId_CustomerId] ON [LoyaltyTransactions]([TenantId], [CustomerId]);
    PRINT 'Created index IX_LoyaltyTransactions_TenantId_CustomerId.';
END
GO

-- Create index on TransactionDate
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoyaltyTransactions_TransactionDate')
BEGIN
    CREATE INDEX [IX_LoyaltyTransactions_TransactionDate] ON [LoyaltyTransactions]([TransactionDate]);
    PRINT 'Created index IX_LoyaltyTransactions_TransactionDate.';
END
GO

PRINT 'B2B/B2C Features Migration completed successfully!';
GO

