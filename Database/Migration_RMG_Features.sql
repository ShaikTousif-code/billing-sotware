-- =============================================
-- RMG (Readymade Garments) Features Migration
-- =============================================
-- This script adds support for Size+Color variant combinations,
-- Size Charts, Sales Returns, and Sales Exchanges
-- =============================================

USE [BillingDB] -- Replace with your database name
GO

BEGIN TRANSACTION;
GO

-- =============================================
-- 1. Add RMG fields to Products table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'StyleCode')
BEGIN
    ALTER TABLE [Products] ADD [StyleCode] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Season')
BEGIN
    ALTER TABLE [Products] ADD [Season] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Collection')
BEGIN
    ALTER TABLE [Products] ADD [Collection] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Gender')
BEGIN
    ALTER TABLE [Products] ADD [Gender] NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'FabricType')
BEGIN
    ALTER TABLE [Products] ADD [FabricType] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'SizeChartId')
BEGIN
    ALTER TABLE [Products] ADD [SizeChartId] INT NULL;
END
GO

-- =============================================
-- 2. Add variant fields to InvoiceItems table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') AND name = 'VariantCombinationId')
BEGIN
    ALTER TABLE [InvoiceItems] ADD [VariantCombinationId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') AND name = 'Size')
BEGIN
    ALTER TABLE [InvoiceItems] ADD [Size] NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') AND name = 'Color')
BEGIN
    ALTER TABLE [InvoiceItems] ADD [Color] NVARCHAR(50) NULL;
END
GO

-- =============================================
-- 3. Add variant fields to Inventories table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Inventories]') AND name = 'VariantCombinationId')
BEGIN
    ALTER TABLE [Inventories] ADD [VariantCombinationId] INT NULL;
END
GO

-- Drop existing unique index if it exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Inventories_TenantId_ProductId' AND object_id = OBJECT_ID(N'[dbo].[Inventories]'))
BEGIN
    DROP INDEX [IX_Inventories_TenantId_ProductId] ON [Inventories];
END
GO

-- Create new unique index with VariantCombinationId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Inventories_TenantId_ProductId_VariantCombinationId' AND object_id = OBJECT_ID(N'[dbo].[Inventories]'))
BEGIN
    CREATE UNIQUE INDEX [IX_Inventories_TenantId_ProductId_VariantCombinationId] 
    ON [Inventories] ([TenantId], [ProductId], [VariantCombinationId])
    WHERE [VariantCombinationId] IS NOT NULL;
END
GO

-- Keep original index for non-variant inventory
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Inventories_TenantId_ProductId' AND object_id = OBJECT_ID(N'[dbo].[Inventories]'))
BEGIN
    CREATE UNIQUE INDEX [IX_Inventories_TenantId_ProductId] 
    ON [Inventories] ([TenantId], [ProductId])
    WHERE [VariantCombinationId] IS NULL;
END
GO

-- =============================================
-- 4. Add variant fields to StockTransactions table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTransactions]') AND name = 'VariantCombinationId')
BEGIN
    ALTER TABLE [StockTransactions] ADD [VariantCombinationId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTransactions]') AND name = 'Size')
BEGIN
    ALTER TABLE [StockTransactions] ADD [Size] NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockTransactions]') AND name = 'Color')
BEGIN
    ALTER TABLE [StockTransactions] ADD [Color] NVARCHAR(50) NULL;
END
GO

-- =============================================
-- 5. Create SizeCharts table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SizeCharts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SizeCharts] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [SizeValues] NVARCHAR(500) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_SizeCharts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SizeCharts_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE NO ACTION
    );
    
    CREATE INDEX [IX_SizeCharts_TenantId] ON [SizeCharts] ([TenantId]);
END
GO

-- =============================================
-- 6. Create ProductVariantCombinations table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductVariantCombinations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [ProductVariantCombinations] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [Size] NVARCHAR(20) NOT NULL,
        [Color] NVARCHAR(50) NOT NULL,
        [SKU] NVARCHAR(100) NULL,
        [Barcode] NVARCHAR(100) NULL,
        [CostPrice] DECIMAL(18,2) NULL,
        [SellingPrice] DECIMAL(18,2) NULL,
        [StockQuantity] INT NOT NULL DEFAULT 0,
        [ImageUrl] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_ProductVariantCombinations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductVariantCombinations_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ProductVariantCombinations_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
    );
    
    CREATE UNIQUE INDEX [IX_ProductVariantCombinations_TenantId_ProductId_Size_Color] 
    ON [ProductVariantCombinations] ([TenantId], [ProductId], [Size], [Color]);
    
    CREATE UNIQUE INDEX [IX_ProductVariantCombinations_TenantId_Barcode] 
    ON [ProductVariantCombinations] ([TenantId], [Barcode])
    WHERE [Barcode] IS NOT NULL;
    
    CREATE INDEX [IX_ProductVariantCombinations_ProductId] ON [ProductVariantCombinations] ([ProductId]);
END
GO

-- =============================================
-- 7. Create SalesReturns table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturns]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SalesReturns] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [TenantId] INT NOT NULL,
        [InvoiceId] INT NOT NULL,
        [ReturnNumber] NVARCHAR(50) NOT NULL,
        [ReturnDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Reason] NVARCHAR(500) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [ApprovedAt] DATETIME2 NULL,
        [ProcessedAt] DATETIME2 NULL,
        [CreditNoteId] INT NULL,
        CONSTRAINT [PK_SalesReturns] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesReturns_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesReturns_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesReturns_CreditNotes_CreditNoteId] FOREIGN KEY ([CreditNoteId]) REFERENCES [CreditNotes] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_SalesReturns_Users_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
    
    CREATE UNIQUE INDEX [IX_SalesReturns_TenantId_ReturnNumber] 
    ON [SalesReturns] ([TenantId], [ReturnNumber]);
    
    CREATE INDEX [IX_SalesReturns_InvoiceId] ON [SalesReturns] ([InvoiceId]);
END
GO

-- =============================================
-- 8. Create SalesReturnItems table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturnItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SalesReturnItems] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [SalesReturnId] INT NOT NULL,
        [InvoiceItemId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [VariantCombinationId] INT NULL,
        [Size] NVARCHAR(20) NULL,
        [Color] NVARCHAR(50) NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [Reason] NVARCHAR(500) NULL,
        CONSTRAINT [PK_SalesReturnItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesReturnItems_SalesReturns_SalesReturnId] FOREIGN KEY ([SalesReturnId]) REFERENCES [SalesReturns] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesReturnItems_InvoiceItems_InvoiceItemId] FOREIGN KEY ([InvoiceItemId]) REFERENCES [InvoiceItems] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesReturnItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesReturnItems_ProductVariantCombinations_VariantCombinationId] FOREIGN KEY ([VariantCombinationId]) REFERENCES [ProductVariantCombinations] ([Id]) ON DELETE SET NULL
    );
    
    CREATE INDEX [IX_SalesReturnItems_SalesReturnId] ON [SalesReturnItems] ([SalesReturnId]);
    CREATE INDEX [IX_SalesReturnItems_ProductId] ON [SalesReturnItems] ([ProductId]);
END
GO

-- =============================================
-- 9. Create SalesExchanges table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesExchanges]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SalesExchanges] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [TenantId] INT NOT NULL,
        [InvoiceId] INT NOT NULL,
        [ExchangeNumber] NVARCHAR(50) NOT NULL,
        [ExchangeDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Reason] NVARCHAR(500) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [PriceDifference] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [ApprovedAt] DATETIME2 NULL,
        [ProcessedAt] DATETIME2 NULL,
        CONSTRAINT [PK_SalesExchanges] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesExchanges_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesExchanges_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesExchanges_Users_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
    
    CREATE UNIQUE INDEX [IX_SalesExchanges_TenantId_ExchangeNumber] 
    ON [SalesExchanges] ([TenantId], [ExchangeNumber]);
    
    CREATE INDEX [IX_SalesExchanges_InvoiceId] ON [SalesExchanges] ([InvoiceId]);
END
GO

-- =============================================
-- 10. Create SalesExchangeItems table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesExchangeItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SalesExchangeItems] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [SalesExchangeId] INT NOT NULL,
        [Type] NVARCHAR(20) NOT NULL, -- Original or New
        [InvoiceItemId] INT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [VariantCombinationId] INT NULL,
        [Size] NVARCHAR(20) NULL,
        [Color] NVARCHAR(50) NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        CONSTRAINT [PK_SalesExchangeItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesExchangeItems_SalesExchanges_SalesExchangeId] FOREIGN KEY ([SalesExchangeId]) REFERENCES [SalesExchanges] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesExchangeItems_InvoiceItems_InvoiceItemId] FOREIGN KEY ([InvoiceItemId]) REFERENCES [InvoiceItems] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_SalesExchangeItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesExchangeItems_ProductVariantCombinations_VariantCombinationId] FOREIGN KEY ([VariantCombinationId]) REFERENCES [ProductVariantCombinations] ([Id]) ON DELETE SET NULL
    );
    
    CREATE INDEX [IX_SalesExchangeItems_SalesExchangeId] ON [SalesExchangeItems] ([SalesExchangeId]);
    CREATE INDEX [IX_SalesExchangeItems_ProductId] ON [SalesExchangeItems] ([ProductId]);
END
GO

-- =============================================
-- 11. Add foreign key constraints for new fields
-- =============================================
-- Add FK for Products.SizeChartId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Products_SizeCharts_SizeChartId')
BEGIN
    ALTER TABLE [Products] 
    ADD CONSTRAINT [FK_Products_SizeCharts_SizeChartId] 
    FOREIGN KEY ([SizeChartId]) REFERENCES [SizeCharts] ([Id]) ON DELETE SET NULL;
END
GO

-- Add FK for InvoiceItems.VariantCombinationId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_InvoiceItems_ProductVariantCombinations_VariantCombinationId')
BEGIN
    ALTER TABLE [InvoiceItems] 
    ADD CONSTRAINT [FK_InvoiceItems_ProductVariantCombinations_VariantCombinationId] 
    FOREIGN KEY ([VariantCombinationId]) REFERENCES [ProductVariantCombinations] ([Id]) ON DELETE SET NULL;
END
GO

-- Add FK for Inventories.VariantCombinationId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Inventories_ProductVariantCombinations_VariantCombinationId')
BEGIN
    ALTER TABLE [Inventories] 
    ADD CONSTRAINT [FK_Inventories_ProductVariantCombinations_VariantCombinationId] 
    FOREIGN KEY ([VariantCombinationId]) REFERENCES [ProductVariantCombinations] ([Id]) ON DELETE SET NULL;
END
GO

-- Add FK for StockTransactions.VariantCombinationId
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_StockTransactions_ProductVariantCombinations_VariantCombinationId')
BEGIN
    ALTER TABLE [StockTransactions] 
    ADD CONSTRAINT [FK_StockTransactions_ProductVariantCombinations_VariantCombinationId] 
    FOREIGN KEY ([VariantCombinationId]) REFERENCES [ProductVariantCombinations] ([Id]) ON DELETE SET NULL;
END
GO

COMMIT TRANSACTION;
GO

PRINT 'RMG Features migration completed successfully!';
GO

