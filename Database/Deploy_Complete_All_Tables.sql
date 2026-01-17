-- ============================================
-- COMPLETE DATABASE DEPLOYMENT SCRIPT
-- Target Server: HOORIYASHAIK\SQLEXPRESS
-- Database: BillingDB
-- Includes ALL tables from all migration scripts
-- ============================================

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BillingDB')
BEGIN
    CREATE DATABASE BillingDB;
    PRINT 'Database BillingDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database BillingDB already exists.';
END
GO

USE BillingDB;
GO

PRINT 'Starting complete database deployment...';
PRINT '========================================';
GO

-- ============================================
-- BASE SCHEMA TABLES
-- ============================================

-- Tenants
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tenants')
BEGIN
    CREATE TABLE [dbo].[Tenants] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NOT NULL UNIQUE,
        [BusinessType] NVARCHAR(50) NULL,
        [ContactEmail] NVARCHAR(256) NULL,
        [ContactPhone] NVARCHAR(20) NULL,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [PlanType] NVARCHAR(50) NULL,
        [SubscriptionExpiresAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'Table Tenants created.';
END
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Email] NVARCHAR(256) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [Phone] NVARCHAR(20) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [LastLoginAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    CREATE UNIQUE INDEX IX_Users_TenantId_Email ON [Users]([TenantId], [Email]);
    PRINT 'Table Users created.';
END
GO

-- Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE [dbo].[Roles] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(50) NOT NULL,
        [Description] NVARCHAR(200) NULL
    );
    PRINT 'Table Roles created.';
END
GO

-- UserRoles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE [dbo].[UserRoles] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [RoleId] INT NOT NULL,
        FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
        FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id])
    );
    PRINT 'Table UserRoles created.';
END
GO

-- ProductCategories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductCategories')
BEGIN
    CREATE TABLE [dbo].[ProductCategories] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [ParentCategoryId] INT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ParentCategoryId]) REFERENCES [ProductCategories]([Id])
    );
    PRINT 'Table ProductCategories created.';
END
GO

-- Products
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE [dbo].[Products] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [SKU] NVARCHAR(100) NULL,
        [HSNCode] NVARCHAR(50) NULL,
        [SACCode] NVARCHAR(50) NULL,
        [Barcode] NVARCHAR(100) NULL,
        [Description] NVARCHAR(1000) NULL,
        [CategoryId] INT NULL,
        [CostPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [SellingPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxRate] DECIMAL(5,2) NULL,
        [TaxType] NVARCHAR(20) NULL,
        [StockQuantity] INT NULL,
        [LowStockAlert] INT NULL,
        [Unit] NVARCHAR(20) NULL,
        [Type] INT NOT NULL DEFAULT 1,
        [ImageUrl] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [TrackInventory] BIT NOT NULL DEFAULT 1,
        [IsScheduleH] BIT NOT NULL DEFAULT 0,
        [IsScheduleX] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CategoryId]) REFERENCES [ProductCategories]([Id])
    );
    CREATE UNIQUE INDEX IX_Products_TenantId_SKU ON [Products]([TenantId], [SKU]) WHERE [SKU] IS NOT NULL;
    CREATE INDEX IX_Products_Barcode ON [Products]([Barcode]) WHERE [Barcode] IS NOT NULL;
    PRINT 'Table Products created.';
END
GO

-- Customers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE [dbo].[Customers] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(20) NULL,
        [Address] NVARCHAR(500) NULL,
        [GSTIN] NVARCHAR(15) NULL,
        [CreditLimit] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [OutstandingBalance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [LoyaltyPoints] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [WalletBalance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table Customers created.';
END
GO

-- Suppliers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suppliers')
BEGIN
    CREATE TABLE [dbo].[Suppliers] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(20) NULL,
        [Address] NVARCHAR(500) NULL,
        [GSTIN] NVARCHAR(15) NULL,
        [OutstandingBalance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table Suppliers created.';
END
GO

-- Invoices
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE [dbo].[Invoices] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [InvoiceNumber] NVARCHAR(50) NOT NULL,
        [InvoiceDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CustomerId] INT NULL,
        [CustomerName] NVARCHAR(200) NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Draft',
        [SubTotal] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BillLevelDiscount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [RoundOff] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ServiceCharge] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Tips] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BalanceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaymentMode] NVARCHAR(50) NULL,
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CancelledAt] DATETIME2 NULL,
        [CancellationReason] NVARCHAR(500) NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE UNIQUE INDEX IX_Invoices_TenantId_InvoiceNumber ON [Invoices]([TenantId], [InvoiceNumber]);
    PRINT 'Table Invoices created.';
END
GO

-- Add missing columns to Invoices if table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'ServiceCharge')
        ALTER TABLE [dbo].[Invoices] ADD [ServiceCharge] DECIMAL(18,2) NOT NULL DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'Tips')
        ALTER TABLE [dbo].[Invoices] ADD [Tips] DECIMAL(18,2) NOT NULL DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'BillLevelDiscount')
        ALTER TABLE [dbo].[Invoices] ADD [BillLevelDiscount] DECIMAL(18,2) NOT NULL DEFAULT 0;
END
GO

-- InvoiceItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceItems')
BEGIN
    CREATE TABLE [dbo].[InvoiceItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [InvoiceId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table InvoiceItems created.';
END
GO

-- Payments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
BEGIN
    CREATE TABLE [dbo].[Payments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [InvoiceId] INT NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [PaymentMode] NVARCHAR(50) NOT NULL,
        [TransactionId] NVARCHAR(100) NULL,
        [Notes] NVARCHAR(500) NULL,
        [PaymentDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table Payments created.';
END
GO

-- Inventories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inventories')
BEGIN
    CREATE TABLE [dbo].[Inventories] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [Quantity] INT NOT NULL DEFAULT 0,
        [AverageCost] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [LastUpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    CREATE UNIQUE INDEX IX_Inventories_TenantId_ProductId ON [Inventories]([TenantId], [ProductId]);
    PRINT 'Table Inventories created.';
END
GO

-- StockTransactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockTransactions')
BEGIN
    CREATE TABLE [dbo].[StockTransactions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [TransactionType] NVARCHAR(20) NOT NULL,
        [Quantity] INT NOT NULL,
        [UnitCost] DECIMAL(18,2) NULL,
        [ReferenceType] NVARCHAR(50) NULL,
        [ReferenceId] INT NULL,
        [Notes] NVARCHAR(500) NULL,
        [TransactionDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedById] INT NOT NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table StockTransactions created.';
END
GO

-- PurchaseOrders
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseOrders')
BEGIN
    CREATE TABLE [dbo].[PurchaseOrders] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [SupplierId] INT NOT NULL,
        [OrderNumber] NVARCHAR(50) NOT NULL,
        [OrderDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [SubTotal] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([SupplierId]) REFERENCES [Suppliers]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table PurchaseOrders created.';
END
GO

-- PurchaseOrderItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseOrderItems')
BEGIN
    CREATE TABLE [dbo].[PurchaseOrderItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [PurchaseOrderId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table PurchaseOrderItems created.';
END
GO

-- TenantConfigurations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantConfigurations')
BEGIN
    CREATE TABLE [dbo].[TenantConfigurations] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [FinancialYearStart] NVARCHAR(5) NOT NULL DEFAULT '04-01',
        [InvoicePrefix] NVARCHAR(20) NOT NULL DEFAULT 'INV',
        [InvoiceNumberStart] INT NOT NULL DEFAULT 1,
        [InvoiceTemplate] NVARCHAR(50) NULL,
        [Currency] NVARCHAR(10) NOT NULL DEFAULT 'INR',
        [DecimalPlaces] INT NOT NULL DEFAULT 2,
        [EnableInventory] BIT NOT NULL DEFAULT 1,
        [EnableGST] BIT NOT NULL DEFAULT 1,
        [Language] NVARCHAR(10) NOT NULL DEFAULT 'en',
        [CostingMethod] NVARCHAR(20) NOT NULL DEFAULT 'Average',
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table TenantConfigurations created.';
END
GO

-- Add CostingMethod if table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantConfigurations')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TenantConfigurations]') AND name = 'CostingMethod')
        ALTER TABLE [dbo].[TenantConfigurations] ADD [CostingMethod] NVARCHAR(20) NOT NULL DEFAULT 'Average';
END
GO

-- TaxConfigurations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaxConfigurations')
BEGIN
    CREATE TABLE [dbo].[TaxConfigurations] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Rate] DECIMAL(5,2) NOT NULL,
        [Type] NVARCHAR(20) NOT NULL DEFAULT 'GST',
        [IsActive] BIT NOT NULL DEFAULT 1,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table TaxConfigurations created.';
END
GO

-- ============================================
-- NEW FEATURES TABLES (Migration_NewFeatures.sql)
-- ============================================

-- CreditNotes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CreditNotes')
BEGIN
    CREATE TABLE [dbo].[CreditNotes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [InvoiceId] INT NOT NULL,
        [CreditNoteNumber] NVARCHAR(50) NOT NULL,
        [CreditNoteDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Reason] NVARCHAR(200) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [ProcessedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE UNIQUE INDEX IX_CreditNotes_TenantId_CreditNoteNumber ON [CreditNotes]([TenantId], [CreditNoteNumber]);
    PRINT 'Table CreditNotes created.';
END
GO

-- CreditNoteItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CreditNoteItems')
BEGIN
    CREATE TABLE [dbo].[CreditNoteItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [CreditNoteId] INT NOT NULL,
        [InvoiceItemId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([CreditNoteId]) REFERENCES [CreditNotes]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table CreditNoteItems created.';
END
GO

-- Refunds
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Refunds')
BEGIN
    CREATE TABLE [dbo].[Refunds] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [InvoiceId] INT NULL,
        [CreditNoteId] INT NULL,
        [RefundNumber] NVARCHAR(50) NOT NULL,
        [RefundDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Amount] DECIMAL(18,2) NOT NULL,
        [PaymentMode] NVARCHAR(50) NOT NULL,
        [TransactionId] NVARCHAR(100) NULL,
        [BankAccount] NVARCHAR(100) NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(500) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [ProcessedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]),
        FOREIGN KEY ([CreditNoteId]) REFERENCES [CreditNotes]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table Refunds created.';
END
GO

-- ActivityLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
BEGIN
    CREATE TABLE [dbo].[ActivityLogs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [UserId] INT NOT NULL,
        [Action] NVARCHAR(50) NOT NULL,
        [EntityType] NVARCHAR(50) NOT NULL,
        [EntityId] INT NULL,
        [EntityName] NVARCHAR(200) NULL,
        [OldValues] NVARCHAR(MAX) NULL,
        [NewValues] NVARCHAR(MAX) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [UserAgent] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_ActivityLogs_TenantId_EntityType_EntityId ON [ActivityLogs]([TenantId], [EntityType], [EntityId]);
    PRINT 'Table ActivityLogs created.';
END
GO

-- ProductVariants
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductVariants')
BEGIN
    CREATE TABLE [dbo].[ProductVariants] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [ProductId] INT NOT NULL,
        [VariantType] NVARCHAR(50) NOT NULL,
        [VariantValue] NVARCHAR(100) NOT NULL,
        [SKU] NVARCHAR(100) NULL,
        [CostPrice] DECIMAL(18,2) NULL,
        [SellingPrice] DECIMAL(18,2) NULL,
        [StockQuantity] INT NULL,
        [ImageUrl] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id]) ON DELETE CASCADE
    );
    PRINT 'Table ProductVariants created.';
END
GO

-- PriceLists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PriceLists')
BEGIN
    CREATE TABLE [dbo].[PriceLists] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table PriceLists created.';
END
GO

-- PriceListItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PriceListItems')
BEGIN
    CREATE TABLE [dbo].[PriceListItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [PriceListId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [Price] DECIMAL(18,2) NOT NULL,
        [MinimumQuantity] DECIMAL(18,2) NULL,
        [ValidFrom] DATETIME2 NULL,
        [ValidTo] DATETIME2 NULL,
        FOREIGN KEY ([PriceListId]) REFERENCES [PriceLists]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table PriceListItems created.';
END
GO

-- Warehouses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Warehouses')
BEGIN
    CREATE TABLE [dbo].[Warehouses] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [ContactPerson] NVARCHAR(100) NULL,
        [ContactPhone] NVARCHAR(20) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table Warehouses created.';
END
GO

-- WarehouseInventories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WarehouseInventories')
BEGIN
    CREATE TABLE [dbo].[WarehouseInventories] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [WarehouseId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [Quantity] INT NOT NULL DEFAULT 0,
        [AverageCost] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [LastUpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    CREATE UNIQUE INDEX IX_WarehouseInventories_WarehouseId_ProductId ON [WarehouseInventories]([WarehouseId], [ProductId]);
    PRINT 'Table WarehouseInventories created.';
END
GO

-- Batches
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Batches')
BEGIN
    CREATE TABLE [dbo].[Batches] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [SupplierId] INT NULL,
        [BatchNumber] NVARCHAR(100) NOT NULL,
        [ManufacturingDate] DATETIME2 NULL,
        [ExpiryDate] DATETIME2 NULL,
        [Quantity] INT NOT NULL,
        [UnitCost] DECIMAL(18,2) NOT NULL,
        [WarehouseId] INT NULL,
        [IsExpired] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id]),
        FOREIGN KEY ([SupplierId]) REFERENCES [Suppliers]([Id]),
        FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses]([Id])
    );
    PRINT 'Table Batches created.';
END
GO

-- Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    CREATE TABLE [dbo].[Permissions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NULL,
        [Category] NVARCHAR(50) NOT NULL
    );
    PRINT 'Table Permissions created.';
END
GO

-- RolePermissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE [dbo].[RolePermissions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [RoleId] INT NOT NULL,
        [PermissionId] INT NOT NULL,
        FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id]),
        FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id])
    );
    PRINT 'Table RolePermissions created.';
END
GO

-- CustomerGroups
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerGroups')
BEGIN
    CREATE TABLE [dbo].[CustomerGroups] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [DiscountPercentage] DECIMAL(5,2) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table CustomerGroups created.';
END
GO

-- WalletTransactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WalletTransactions')
BEGIN
    CREATE TABLE [dbo].[WalletTransactions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [CustomerId] INT NOT NULL,
        [TransactionType] NVARCHAR(20) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [BalanceAfter] DECIMAL(18,2) NOT NULL,
        [ReferenceType] NVARCHAR(50) NULL,
        [ReferenceId] INT NULL,
        [Notes] NVARCHAR(500) NULL,
        [TransactionDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedById] INT NOT NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table WalletTransactions created.';
END
GO

-- PurchaseReturns
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseReturns')
BEGIN
    CREATE TABLE [dbo].[PurchaseReturns] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [PurchaseOrderId] INT NOT NULL,
        [ReturnNumber] NVARCHAR(50) NOT NULL,
        [ReturnDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Reason] NVARCHAR(200) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table PurchaseReturns created.';
END
GO

-- PurchaseReturnItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PurchaseReturnItems')
BEGIN
    CREATE TABLE [dbo].[PurchaseReturnItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [PurchaseReturnId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([PurchaseReturnId]) REFERENCES [PurchaseReturns]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table PurchaseReturnItems created.';
END
GO

-- BankAccounts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BankAccounts')
BEGIN
    CREATE TABLE [dbo].[BankAccounts] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [AccountName] NVARCHAR(200) NOT NULL,
        [AccountNumber] NVARCHAR(50) NOT NULL,
        [BankName] NVARCHAR(200) NOT NULL,
        [IFSC] NVARCHAR(20) NULL,
        [Branch] NVARCHAR(200) NULL,
        [AccountType] NVARCHAR(50) NOT NULL DEFAULT 'Current',
        [Balance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table BankAccounts created.';
END
GO

-- InvoiceTemplates
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceTemplates')
BEGIN
    CREATE TABLE [dbo].[InvoiceTemplates] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [TemplateType] NVARCHAR(50) NOT NULL DEFAULT 'Default',
        [TemplateContent] NVARCHAR(MAX) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table InvoiceTemplates created.';
END
GO

-- ============================================
-- BUSINESS MODULES TABLES (Migration_BusinessModules.sql)
-- ============================================

-- Tables (Hotel/Restaurant)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tables')
BEGIN
    CREATE TABLE [dbo].[Tables] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [TableNumber] NVARCHAR(50) NOT NULL,
        [Capacity] INT NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Available',
        [CurrentInvoiceId] INT NULL,
        [Location] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CurrentInvoiceId]) REFERENCES [Invoices]([Id])
    );
    PRINT 'Table Tables created.';
END
GO

-- KOTs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KOTs')
BEGIN
    CREATE TABLE [dbo].[KOTs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [TableId] INT NOT NULL,
        [InvoiceId] INT NULL,
        [KOTNumber] NVARCHAR(50) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(500) NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([TableId]) REFERENCES [Tables]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id])
    );
    PRINT 'Table KOTs created.';
END
GO

-- KOTItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KOTItems')
BEGIN
    CREATE TABLE [dbo].[KOTItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [KOTId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [SpecialInstructions] NVARCHAR(500) NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        FOREIGN KEY ([KOTId]) REFERENCES [KOTs]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table KOTItems created.';
END
GO

-- JobCards
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobCards')
BEGIN
    CREATE TABLE [dbo].[JobCards] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [CustomerId] INT NOT NULL,
        [JobCardNumber] NVARCHAR(50) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [ScheduledDate] DATETIME2 NULL,
        [CompletedDate] DATETIME2 NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [Description] NVARCHAR(1000) NULL,
        [AssignedToUserId] INT NULL,
        [EstimatedCost] DECIMAL(18,2) NULL,
        [ActualCost] DECIMAL(18,2) NULL,
        [InvoiceId] INT NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]),
        FOREIGN KEY ([AssignedToUserId]) REFERENCES [Users]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id])
    );
    PRINT 'Table JobCards created.';
END
GO

-- JobCardItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobCardItems')
BEGIN
    CREATE TABLE [dbo].[JobCardItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [JobCardId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([JobCardId]) REFERENCES [JobCards]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table JobCardItems created.';
END
GO

-- Appointments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    CREATE TABLE [dbo].[Appointments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [CustomerId] INT NOT NULL,
        [ServiceId] INT NULL,
        [AppointmentDate] DATETIME2 NOT NULL,
        [AppointmentTime] TIME NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Scheduled',
        [Notes] NVARCHAR(500) NULL,
        [AssignedToUserId] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]),
        FOREIGN KEY ([ServiceId]) REFERENCES [Products]([Id]),
        FOREIGN KEY ([AssignedToUserId]) REFERENCES [Users]([Id])
    );
    PRINT 'Table Appointments created.';
END
GO

-- BundleProducts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BundleProducts')
BEGIN
    CREATE TABLE [dbo].[BundleProducts] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [BundlePrice] DECIMAL(18,2) NOT NULL,
        [DiscountPercentage] DECIMAL(5,2) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table BundleProducts created.';
END
GO

-- BundleItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BundleItems')
BEGIN
    CREATE TABLE [dbo].[BundleItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [BundleProductId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [DiscountPercentage] DECIMAL(5,2) NULL,
        FOREIGN KEY ([BundleProductId]) REFERENCES [BundleProducts]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table BundleItems created.';
END
GO

-- ============================================
-- 100% FEATURES TABLES (Migration_100Percent.sql)
-- ============================================

-- UnitConversions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UnitConversions')
BEGIN
    CREATE TABLE [dbo].[UnitConversions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [FromUnit] NVARCHAR(20) NOT NULL,
        [ToUnit] NVARCHAR(20) NOT NULL,
        [ConversionFactor] DECIMAL(18,4) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table UnitConversions created.';
END
GO

-- GRNs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GRNs')
BEGIN
    CREATE TABLE [dbo].[GRNs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [PurchaseOrderId] INT NOT NULL,
        [GRNNumber] NVARCHAR(50) NOT NULL,
        [GRNDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(500) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    PRINT 'Table GRNs created.';
END
GO

-- GRNItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GRNItems')
BEGIN
    CREATE TABLE [dbo].[GRNItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [GRNId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [ProductName] NVARCHAR(200) NOT NULL,
        [OrderedQuantity] DECIMAL(18,2) NOT NULL,
        [ReceivedQuantity] DECIMAL(18,2) NOT NULL,
        [RejectedQuantity] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [BatchNumber] NVARCHAR(100) NULL,
        [ExpiryDate] DATETIME2 NULL,
        [Notes] NVARCHAR(500) NULL,
        FOREIGN KEY ([GRNId]) REFERENCES [GRNs]([Id]) ON DELETE CASCADE,
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
    );
    PRINT 'Table GRNItems created.';
END
GO

-- SerialNumbers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SerialNumbers')
BEGIN
    CREATE TABLE [dbo].[SerialNumbers] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProductId] INT NOT NULL,
        [SerialNumberValue] NVARCHAR(200) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Available',
        [InvoiceId] INT NULL,
        [InvoiceItemId] INT NULL,
        [CustomerId] INT NULL,
        [SoldDate] DATETIME2 NULL,
        [WarrantyExpiryDate] DATETIME2 NULL,
        [Notes] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]),
        FOREIGN KEY ([InvoiceItemId]) REFERENCES [InvoiceItems]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id])
    );
    CREATE UNIQUE INDEX IX_SerialNumbers_Value ON [SerialNumbers]([TenantId], [ProductId], [SerialNumberValue]);
    PRINT 'Table SerialNumbers created.';
END
GO

-- ============================================
-- SCHOOL/OFFICE BILLING TABLES
-- ============================================

-- Classes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Classes')
BEGIN
    CREATE TABLE [dbo].[Classes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL DEFAULT 'School',
        [Course] NVARCHAR(200) NULL,
        [Department] NVARCHAR(200) NULL,
        [MaxStrength] INT NULL,
        [CurrentStrength] INT NOT NULL DEFAULT 0,
        [AcademicYear] NVARCHAR(20) NOT NULL,
        [ClassTeacher] NVARCHAR(200) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    CREATE UNIQUE INDEX IX_Classes_TenantId_Code ON [Classes]([TenantId], [Code]);
    CREATE INDEX IX_Classes_TenantId ON [Classes]([TenantId]);
    CREATE INDEX IX_Classes_AcademicYear ON [Classes]([AcademicYear]);
    PRINT 'Table Classes created.';
END
GO

-- Students
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Students')
BEGIN
    CREATE TABLE [dbo].[Students] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [StudentId] NVARCHAR(50) NOT NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(50) NULL,
        [ClassId] INT NULL,
        [Section] NVARCHAR(50) NULL,
        [AcademicYear] NVARCHAR(50) NULL,
        [DateOfBirth] DATETIME2 NULL,
        [ParentName] NVARCHAR(200) NULL,
        [ParentEmail] NVARCHAR(256) NULL,
        [ParentPhone] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [TotalFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [OutstandingFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ClassId]) REFERENCES [Classes]([Id])
    );
    CREATE UNIQUE INDEX IX_Students_TenantId_StudentId ON [Students]([TenantId], [StudentId]);
    CREATE INDEX IX_Students_TenantId ON [Students]([TenantId]);
    CREATE INDEX IX_Students_ClassId ON [Students]([ClassId]);
    PRINT 'Table Students created.';
END
GO

-- FeeStructures
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeeStructures')
BEGIN
    CREATE TABLE [dbo].[FeeStructures] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ClassId] INT NOT NULL,
        [FeeType] NVARCHAR(100) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [AcademicYear] NVARCHAR(50) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ClassId]) REFERENCES [Classes]([Id])
    );
    CREATE INDEX IX_FeeStructures_TenantId ON [FeeStructures]([TenantId]);
    CREATE INDEX IX_FeeStructures_ClassId ON [FeeStructures]([ClassId]);
    PRINT 'Table FeeStructures created.';
END
GO

-- Fees
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Fees')
BEGIN
    CREATE TABLE [dbo].[Fees] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [StudentId] INT NOT NULL,
        [FeeStructureId] INT NULL,
        [FeeNumber] NVARCHAR(50) NOT NULL,
        [FeeType] NVARCHAR(100) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ScholarshipAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [NetAmount] DECIMAL(18,2) NOT NULL,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BalanceAmount] DECIMAL(18,2) NOT NULL,
        [DueDate] DATETIME2 NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id]),
        FOREIGN KEY ([FeeStructureId]) REFERENCES [FeeStructures]([Id])
    );
    CREATE UNIQUE INDEX IX_Fees_TenantId_FeeNumber ON [Fees]([TenantId], [FeeNumber]);
    CREATE INDEX IX_Fees_TenantId ON [Fees]([TenantId]);
    CREATE INDEX IX_Fees_StudentId ON [Fees]([StudentId]);
    CREATE INDEX IX_Fees_DueDate ON [Fees]([DueDate]);
    PRINT 'Table Fees created.';
END
GO

-- FeePayments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeePayments')
BEGIN
    CREATE TABLE [dbo].[FeePayments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [FeeId] INT NULL,
        [StudentId] INT NOT NULL,
        [ReceiptNumber] NVARCHAR(50) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [PaymentMode] NVARCHAR(50) NOT NULL,
        [PaymentDate] DATETIME2 NOT NULL,
        [TransactionId] NVARCHAR(200) NULL,
        [ChequeNumber] NVARCHAR(50) NULL,
        [ChequeDate] DATETIME2 NULL,
        [BankName] NVARCHAR(200) NULL,
        [Notes] NVARCHAR(500) NULL,
        [CreatedById] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([FeeId]) REFERENCES [Fees]([Id]),
        FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE UNIQUE INDEX IX_FeePayments_TenantId_ReceiptNumber ON [FeePayments]([TenantId], [ReceiptNumber]);
    CREATE INDEX IX_FeePayments_TenantId ON [FeePayments]([TenantId]);
    CREATE INDEX IX_FeePayments_StudentId ON [FeePayments]([StudentId]);
    PRINT 'Table FeePayments created.';
END
GO

-- OfficeClients
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OfficeClients')
BEGIN
    CREATE TABLE [dbo].[OfficeClients] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ClientCode] NVARCHAR(50) NOT NULL,
        [CompanyName] NVARCHAR(200) NOT NULL,
        [ContactPerson] NVARCHAR(200) NULL,
        [Email] NVARCHAR(256) NOT NULL,
        [Phone] NVARCHAR(50) NOT NULL,
        [AlternatePhone] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NOT NULL,
        [City] NVARCHAR(100) NULL,
        [State] NVARCHAR(100) NULL,
        [Pincode] NVARCHAR(20) NULL,
        [Country] NVARCHAR(100) NULL,
        [GSTIN] NVARCHAR(50) NULL,
        [PAN] NVARCHAR(50) NULL,
        [ClientType] NVARCHAR(50) NOT NULL DEFAULT 'Corporate',
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CreditLimit] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [OutstandingBalance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaymentTerms] NVARCHAR(200) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    CREATE UNIQUE INDEX IX_OfficeClients_TenantId_ClientCode ON [OfficeClients]([TenantId], [ClientCode]);
    PRINT 'Table OfficeClients created.';
END
GO

-- Projects
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE [dbo].[Projects] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ClientId] INT NOT NULL,
        [ProjectCode] NVARCHAR(50) NOT NULL,
        [ProjectName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [StartDate] DATETIME2 NOT NULL,
        [EndDate] DATETIME2 NULL,
        [Budget] DECIMAL(18,2) NULL,
        [BilledAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [ProjectType] NVARCHAR(50) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id])
    );
    CREATE UNIQUE INDEX IX_Projects_TenantId_ProjectCode ON [Projects]([TenantId], [ProjectCode]);
    PRINT 'Table Projects created.';
END
GO

-- ProjectInvoices
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectInvoices')
BEGIN
    CREATE TABLE [dbo].[ProjectInvoices] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProjectId] INT NOT NULL,
        [ClientId] INT NOT NULL,
        [InvoiceNumber] NVARCHAR(50) NOT NULL,
        [InvoiceDate] DATETIME2 NOT NULL,
        [DueDate] DATETIME2 NOT NULL,
        [SubTotal] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BalanceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [CreatedById] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
        FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE UNIQUE INDEX IX_ProjectInvoices_TenantId_InvoiceNumber ON [ProjectInvoices]([TenantId], [InvoiceNumber]);
    PRINT 'Table ProjectInvoices created.';
END
GO

-- ProjectInvoiceItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectInvoiceItems')
BEGIN
    CREATE TABLE [dbo].[ProjectInvoiceItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [ProjectInvoiceId] INT NOT NULL,
        [Description] NVARCHAR(500) NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL,
        [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        FOREIGN KEY ([ProjectInvoiceId]) REFERENCES [ProjectInvoices]([Id]) ON DELETE CASCADE
    );
    PRINT 'Table ProjectInvoiceItems created.';
END
GO

-- ProjectExpenses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectExpenses')
BEGIN
    CREATE TABLE [dbo].[ProjectExpenses] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProjectId] INT NOT NULL,
        [ExpenseType] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [ExpenseDate] DATETIME2 NOT NULL,
        [Vendor] NVARCHAR(200) NULL,
        [ReceiptNumber] NVARCHAR(50) NULL,
        [PaymentMode] NVARCHAR(50) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [Notes] NVARCHAR(1000) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_ProjectExpenses_TenantId ON [ProjectExpenses]([TenantId]);
    CREATE INDEX IX_ProjectExpenses_ProjectId ON [ProjectExpenses]([ProjectId]);
    PRINT 'Table ProjectExpenses created.';
END
GO

-- ServiceContracts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiceContracts')
BEGIN
    CREATE TABLE [dbo].[ServiceContracts] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ClientId] INT NOT NULL,
        [ContractNumber] NVARCHAR(50) NOT NULL,
        [ServiceName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [StartDate] DATETIME2 NOT NULL,
        [EndDate] DATETIME2 NOT NULL,
        [ContractType] NVARCHAR(50) NOT NULL,
        [MonthlyAmount] DECIMAL(18,2) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [AutoRenew] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id])
    );
    CREATE UNIQUE INDEX IX_ServiceContracts_TenantId_ContractNumber ON [ServiceContracts]([TenantId], [ContractNumber]);
    CREATE INDEX IX_ServiceContracts_TenantId ON [ServiceContracts]([TenantId]);
    CREATE INDEX IX_ServiceContracts_ClientId ON [ServiceContracts]([ClientId]);
    PRINT 'Table ServiceContracts created.';
END
GO

-- ContractInvoices
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContractInvoices')
BEGIN
    CREATE TABLE [dbo].[ContractInvoices] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ContractId] INT NOT NULL,
        [ClientId] INT NOT NULL,
        [InvoiceNumber] NVARCHAR(50) NOT NULL,
        [InvoiceDate] DATETIME2 NOT NULL,
        [DueDate] DATETIME2 NOT NULL,
        [Period] NVARCHAR(50) NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BalanceAmount] DECIMAL(18,2) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [PaidDate] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ContractId]) REFERENCES [ServiceContracts]([Id]),
        FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id])
    );
    CREATE UNIQUE INDEX IX_ContractInvoices_TenantId_InvoiceNumber ON [ContractInvoices]([TenantId], [InvoiceNumber]);
    CREATE INDEX IX_ContractInvoices_TenantId ON [ContractInvoices]([TenantId]);
    CREATE INDEX IX_ContractInvoices_ContractId ON [ContractInvoices]([ContractId]);
    PRINT 'Table ContractInvoices created.';
END
GO

-- ============================================
-- ADVANCED FEATURES TABLES (Migration_AdvancedFeatures.sql)
-- ============================================

-- InstallmentPlans
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InstallmentPlans')
BEGIN
    CREATE TABLE [dbo].[InstallmentPlans] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [FeeId] INT NOT NULL,
        [StudentId] INT NOT NULL,
        [PlanName] NVARCHAR(200) NOT NULL,
        [NumberOfInstallments] INT NOT NULL,
        [TotalAmount] DECIMAL(18,2) NOT NULL,
        [InstallmentAmount] DECIMAL(18,2) NOT NULL,
        [StartDate] DATETIME2 NOT NULL,
        [Frequency] NVARCHAR(50) NOT NULL DEFAULT 'Monthly',
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([FeeId]) REFERENCES [Fees]([Id]),
        FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id])
    );
    CREATE INDEX IX_InstallmentPlans_TenantId ON [InstallmentPlans]([TenantId]);
    CREATE INDEX IX_InstallmentPlans_StudentId ON [InstallmentPlans]([StudentId]);
    PRINT 'Table InstallmentPlans created.';
END
GO

-- Installments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Installments')
BEGIN
    CREATE TABLE [dbo].[Installments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [InstallmentPlanId] INT NOT NULL,
        [InstallmentNumber] INT NOT NULL,
        [Amount] DECIMAL(18,2) NOT NULL,
        [DueDate] DATETIME2 NOT NULL,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidDate] DATETIME2 NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [PaymentReference] NVARCHAR(200) NULL,
        FOREIGN KEY ([InstallmentPlanId]) REFERENCES [InstallmentPlans]([Id]) ON DELETE CASCADE
    );
    PRINT 'Table Installments created.';
END
GO

-- TimeEntries
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeEntries')
BEGIN
    CREATE TABLE [dbo].[TimeEntries] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProjectId] INT NOT NULL,
        [UserId] INT NULL,
        [EmployeeName] NVARCHAR(200) NOT NULL,
        [EntryDate] DATETIME2 NOT NULL,
        [Hours] DECIMAL(18,2) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [TaskType] NVARCHAR(100) NOT NULL,
        [IsBillable] BIT NOT NULL DEFAULT 1,
        [HourlyRate] DECIMAL(18,2) NULL,
        [TotalAmount] DECIMAL(18,2) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [ApprovedById] INT NULL,
        [ApprovedAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
        FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
        FOREIGN KEY ([ApprovedById]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_TimeEntries_TenantId_ProjectId ON [TimeEntries]([TenantId], [ProjectId]);
    CREATE INDEX IX_TimeEntries_EntryDate ON [TimeEntries]([EntryDate]);
    PRINT 'Table TimeEntries created.';
END
GO

-- Milestones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Milestones')
BEGIN
    CREATE TABLE [dbo].[Milestones] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [ProjectId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [TargetDate] DATETIME2 NOT NULL,
        [CompletedDate] DATETIME2 NULL,
        [PercentageComplete] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Not Started',
        [BillingAmount] DECIMAL(18,2) NULL,
        [IsBilled] BIT NOT NULL DEFAULT 0,
        [InvoiceId] INT NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [ProjectInvoices]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_Milestones_TenantId_ProjectId ON [Milestones]([TenantId], [ProjectId]);
    PRINT 'Table Milestones created.';
END
GO

-- Deliverables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Deliverables')
BEGIN
    CREATE TABLE [dbo].[Deliverables] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [MilestoneId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [CompletedDate] DATETIME2 NULL,
        [FileUrl] NVARCHAR(500) NULL,
        [Notes] NVARCHAR(1000) NULL,
        FOREIGN KEY ([MilestoneId]) REFERENCES [Milestones]([Id]) ON DELETE CASCADE
    );
    PRINT 'Table Deliverables created.';
END
GO

-- Documents
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Documents')
BEGIN
    CREATE TABLE [dbo].[Documents] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [DocumentType] NVARCHAR(100) NOT NULL,
        [EntityType] NVARCHAR(100) NULL,
        [EntityId] INT NULL,
        [FileName] NVARCHAR(500) NOT NULL,
        [OriginalFileName] NVARCHAR(500) NOT NULL,
        [FilePath] NVARCHAR(1000) NOT NULL,
        [FileType] NVARCHAR(50) NOT NULL,
        [FileSize] BIGINT NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [Tags] NVARCHAR(500) NULL,
        [CreatedById] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_Documents_TenantId_EntityType_EntityId ON [Documents]([TenantId], [EntityType], [EntityId]);
    CREATE INDEX IX_Documents_DocumentType ON [Documents]([DocumentType]);
    PRINT 'Table Documents created.';
END
GO

-- FeeConcessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeeConcessions')
BEGIN
    CREATE TABLE [dbo].[FeeConcessions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [StudentId] INT NOT NULL,
        [FeeId] INT NULL,
        [ConcessionType] NVARCHAR(50) NOT NULL DEFAULT 'Discount',
        [Amount] DECIMAL(18,2) NOT NULL,
        [Percentage] DECIMAL(5,2) NULL,
        [Reason] NVARCHAR(500) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [RequestedById] INT NOT NULL,
        [ApprovedById] INT NULL,
        [ApprovedAt] DATETIME2 NULL,
        [ApprovalNotes] NVARCHAR(1000) NULL,
        [ValidFrom] DATETIME2 NOT NULL,
        [ValidTo] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id]),
        FOREIGN KEY ([FeeId]) REFERENCES [Fees]([Id]),
        FOREIGN KEY ([RequestedById]) REFERENCES [Users]([Id]),
        FOREIGN KEY ([ApprovedById]) REFERENCES [Users]([Id])
    );
    CREATE INDEX IX_FeeConcessions_TenantId_StudentId ON [FeeConcessions]([TenantId], [StudentId]);
    CREATE INDEX IX_FeeConcessions_Status ON [FeeConcessions]([Status]);
    PRINT 'Table FeeConcessions created.';
END
GO

-- ============================================
-- ADDITIONAL INDEXES (from AdditionalIndexes.sql)
-- ============================================

-- Invoice Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_InvoiceDate')
BEGIN
    CREATE INDEX IX_Invoices_InvoiceDate ON [Invoices]([InvoiceDate]);
END
GO

-- Invoice Status Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_Status')
BEGIN
    CREATE INDEX IX_Invoices_Status ON [Invoices]([Status]) WHERE [Status] IS NOT NULL;
END
GO

-- Invoice Tenant + Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_TenantId_InvoiceDate')
BEGIN
    CREATE INDEX IX_Invoices_TenantId_InvoiceDate ON [Invoices]([TenantId], [InvoiceDate]);
END
GO

-- Payment Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_PaymentDate')
BEGIN
    CREATE INDEX IX_Payments_PaymentDate ON [Payments]([PaymentDate]);
END
GO

-- Payment Tenant + Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_TenantId_PaymentDate')
BEGIN
    CREATE INDEX IX_Payments_TenantId_PaymentDate ON [Payments]([TenantId], [PaymentDate]);
END
GO

-- Customer Name Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Name')
BEGIN
    CREATE INDEX IX_Customers_Name ON [Customers]([Name]);
END
GO

-- Product Name Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Name')
BEGIN
    CREATE INDEX IX_Products_Name ON [Products]([Name]);
END
GO

-- Stock Transaction Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StockTransactions_TransactionDate')
BEGIN
    CREATE INDEX IX_StockTransactions_TransactionDate ON [StockTransactions]([TransactionDate]);
END
GO

-- Batch Expiry Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Batches_ExpiryDate')
BEGIN
    CREATE INDEX IX_Batches_ExpiryDate ON [Batches]([ExpiryDate]) WHERE [ExpiryDate] IS NOT NULL;
END
GO

-- Purchase Order Date Index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PurchaseOrders_OrderDate')
BEGIN
    CREATE INDEX IX_PurchaseOrders_OrderDate ON [PurchaseOrders]([OrderDate]);
END
GO

-- CreatedAt indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_CreatedAt')
BEGIN
    CREATE INDEX IX_Products_CreatedAt ON [Products]([CreatedAt]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_CreatedAt')
BEGIN
    CREATE INDEX IX_Customers_CreatedAt ON [Customers]([CreatedAt]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_CreatedAt')
BEGIN
    CREATE INDEX IX_Invoices_CreatedAt ON [Invoices]([CreatedAt]);
END
GO

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default roles if they don't exist
IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Owner')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) VALUES ('Owner', 'Full system access');
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Manager')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) VALUES ('Manager', 'Management access');
END

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Staff')
BEGIN
    INSERT INTO [Roles] ([Name], [Description]) VALUES ('Staff', 'Staff access');
END

-- Insert default permissions if they don't exist
IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'products.view')
BEGIN
    INSERT INTO [Permissions] ([Name], [Description], [Category]) VALUES
    ('products.view', 'View products', 'Products'),
    ('products.create', 'Create products', 'Products'),
    ('products.update', 'Update products', 'Products'),
    ('products.delete', 'Delete products', 'Products'),
    ('invoices.view', 'View invoices', 'Invoices'),
    ('invoices.create', 'Create invoices', 'Invoices'),
    ('invoices.update', 'Update invoices', 'Invoices'),
    ('invoices.delete', 'Delete invoices', 'Invoices'),
    ('invoices.cancel', 'Cancel invoices', 'Invoices'),
    ('customers.view', 'View customers', 'Customers'),
    ('customers.create', 'Create customers', 'Customers'),
    ('customers.update', 'Update customers', 'Customers'),
    ('customers.delete', 'Delete customers', 'Customers'),
    ('reports.view', 'View reports', 'Reports'),
    ('payments.create', 'Create payments', 'Payments'),
    ('payments.view', 'View payments', 'Payments');
END

PRINT 'Default roles and permissions inserted.';
GO

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

PRINT '========================================';
PRINT 'Complete database deployment finished!';
PRINT 'All tables, indexes, and relationships have been created.';
PRINT '========================================';
GO

