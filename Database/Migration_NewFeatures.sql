-- Migration Script for New Features
-- Run this after the base Schema.sql

-- Credit Notes Table
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
GO

CREATE UNIQUE INDEX IX_CreditNotes_TenantId_CreditNoteNumber ON [CreditNotes]([TenantId], [CreditNoteNumber]);
GO

-- Credit Note Items Table
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
GO

-- Refunds Table
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
GO

-- Activity Logs Table
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
GO

CREATE INDEX IX_ActivityLogs_TenantId_EntityType_EntityId ON [ActivityLogs]([TenantId], [EntityType], [EntityId]);
GO

-- Product Variants Table
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
GO

-- Price Lists Table
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
GO

-- Price List Items Table
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
GO

-- Warehouses Table
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
GO

-- Warehouse Inventory Table
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
GO

CREATE UNIQUE INDEX IX_WarehouseInventories_WarehouseId_ProductId ON [WarehouseInventories]([WarehouseId], [ProductId]);
GO

-- Batches Table (for Medical/Pharmacy)
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
GO

-- Permissions Table
CREATE TABLE [dbo].[Permissions] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL UNIQUE,
    [Description] NVARCHAR(500) NULL,
    [Category] NVARCHAR(50) NOT NULL
);
GO

-- Role Permissions Table
CREATE TABLE [dbo].[RolePermissions] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [RoleId] INT NOT NULL,
    [PermissionId] INT NOT NULL,
    FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id]),
    FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id])
);
GO

-- Customer Groups Table
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
GO

-- Wallet Transactions Table
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
GO

-- Purchase Returns Table
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
GO

-- Purchase Return Items Table
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
GO

-- Bank Accounts Table
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
GO

-- Invoice Templates Table
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
GO

-- Add BillLevelDiscount column to Invoices if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'BillLevelDiscount')
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [BillLevelDiscount] DECIMAL(18,2) NOT NULL DEFAULT 0;
END
GO

-- Insert default permissions
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
GO

