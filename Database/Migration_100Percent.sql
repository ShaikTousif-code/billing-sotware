-- Migration Script for 100% Implementation Features
-- Run this after Migration_BusinessModules.sql

-- Unit Conversions Table
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
GO

-- GRN (Goods Receipt Note) Table
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
GO

-- GRN Items Table
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
GO

-- Serial Numbers Table
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
GO

CREATE UNIQUE INDEX IX_SerialNumbers_Value ON [SerialNumbers]([TenantId], [ProductId], [SerialNumberValue]);
GO

-- Add ServiceCharge and Tips to Invoices
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'ServiceCharge')
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [ServiceCharge] DECIMAL(18,2) NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'Tips')
BEGIN
    ALTER TABLE [dbo].[Invoices] ADD [Tips] DECIMAL(18,2) NOT NULL DEFAULT 0;
END
GO

-- Add Schedule H/X flag to Products (Medical)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'IsScheduleH')
BEGIN
    ALTER TABLE [dbo].[Products] ADD [IsScheduleH] BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'IsScheduleX')
BEGIN
    ALTER TABLE [dbo].[Products] ADD [IsScheduleX] BIT NOT NULL DEFAULT 0;
END
GO

-- Add Costing Method to Tenant Configuration
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TenantConfigurations]') AND name = 'CostingMethod')
BEGIN
    ALTER TABLE [dbo].[TenantConfigurations] ADD [CostingMethod] NVARCHAR(20) NOT NULL DEFAULT 'Average';
END
GO

