-- Migration Script for Business-Specific Modules
-- Run this after Migration_NewFeatures.sql

-- Tables for Hotel/Restaurant Module
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
GO

-- KOT (Kitchen Order Ticket) Table
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
GO

-- KOT Items Table
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
GO

-- Job Cards for Service Business Module
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
GO

-- Job Card Items Table
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
GO

-- Appointments Table
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
GO

-- Bundle Products Table
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
GO

-- Bundle Items Table
CREATE TABLE [dbo].[BundleItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [BundleProductId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] DECIMAL(18,2) NOT NULL,
    [DiscountPercentage] DECIMAL(5,2) NULL,
    FOREIGN KEY ([BundleProductId]) REFERENCES [BundleProducts]([Id]) ON DELETE CASCADE,
    FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
);
GO

-- Add ProductType column to Products if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Type')
BEGIN
    ALTER TABLE [dbo].[Products] ADD [Type] INT NOT NULL DEFAULT 1; -- 1 = Product, 2 = Service
END
GO

-- Add Barcode column to Products
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'Barcode')
BEGIN
    ALTER TABLE [dbo].[Products] ADD [Barcode] NVARCHAR(100) NULL;
END
GO

CREATE INDEX IX_Products_Barcode ON [Products]([Barcode]) WHERE [Barcode] IS NOT NULL;
GO

