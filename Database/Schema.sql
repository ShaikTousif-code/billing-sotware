-- Billing Software Database Schema
-- SQL Server Database Script

-- Create Database (run this separately if needed)
-- CREATE DATABASE BillingSoftware;
-- GO
-- USE BillingSoftware;
-- GO

-- Tenants Table
CREATE TABLE [dbo].[Tenants] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [BusinessType] NVARCHAR(50) NULL,
    [ContactEmail] NVARCHAR(256) NULL,
    [ContactPhone] NVARCHAR(20) NULL,
    [Address] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [SubscriptionExpiresAt] DATETIME2 NULL,
    [PlanType] NVARCHAR(50) NULL
);
GO

-- Users Table
CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Email] NVARCHAR(256) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Phone] NVARCHAR(20) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [LastLoginAt] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
);
GO

CREATE UNIQUE INDEX IX_Users_TenantId_Email ON [Users]([TenantId], [Email]);
GO

-- Roles Table
CREATE TABLE [dbo].[Roles] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(200) NULL
);
GO

-- UserRoles Table
CREATE TABLE [dbo].[UserRoles] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UserId] INT NOT NULL,
    [RoleId] INT NOT NULL,
    FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
    FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id])
);
GO

-- ProductCategories Table
CREATE TABLE [dbo].[ProductCategories] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [ParentCategoryId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
);
GO

-- Products Table
CREATE TABLE [dbo].[Products] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [SKU] NVARCHAR(100) NULL,
    [HSNCode] NVARCHAR(50) NULL,
    [SACCode] NVARCHAR(50) NULL,
    [Description] NVARCHAR(1000) NULL,
    [CategoryId] INT NULL,
    [CostPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [SellingPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [TaxRate] DECIMAL(5,2) NULL,
    [TaxType] NVARCHAR(20) NULL,
    [StockQuantity] INT NULL,
    [LowStockAlert] INT NULL,
    [Unit] NVARCHAR(20) NULL,
    [ImageUrl] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [TrackInventory] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([CategoryId]) REFERENCES [ProductCategories]([Id])
);
GO

CREATE UNIQUE INDEX IX_Products_TenantId_SKU ON [Products]([TenantId], [SKU]) WHERE [SKU] IS NOT NULL;
GO

-- Customers Table
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
GO

-- Suppliers Table
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
GO

-- Invoices Table
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
    [RoundOff] DECIMAL(18,2) NOT NULL DEFAULT 0,
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
GO

CREATE UNIQUE INDEX IX_Invoices_TenantId_InvoiceNumber ON [Invoices]([TenantId], [InvoiceNumber]);
GO

-- InvoiceItems Table
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
GO

-- Payments Table
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
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id]),
    FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
);
GO

-- Inventory Table
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
GO

CREATE UNIQUE INDEX IX_Inventories_TenantId_ProductId ON [Inventories]([TenantId], [ProductId]);
GO

-- StockTransactions Table
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
GO

-- PurchaseOrders Table
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
GO

-- PurchaseOrderItems Table
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
GO

-- TenantConfigurations Table
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
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
);
GO

-- TaxConfigurations Table
CREATE TABLE [dbo].[TaxConfigurations] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Rate] DECIMAL(5,2) NOT NULL,
    [Type] NVARCHAR(20) NOT NULL DEFAULT 'GST',
    [IsActive] BIT NOT NULL DEFAULT 1,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
);
GO

-- Insert default roles
INSERT INTO [Roles] ([Name], [Description]) VALUES
('Owner', 'Full access to all features'),
('Manager', 'Can manage products, customers, and view reports'),
('Cashier', 'Can create invoices and process payments'),
('Accountant', 'Can view reports and manage financial data');
GO

-- Insert sample tenant (for testing)
INSERT INTO [Tenants] ([Name], [Code], [BusinessType], [IsActive], [PlanType]) VALUES
('Demo Shop', 'DEMO001', 'Retail', 1, 'Premium');
GO

-- Insert default tenant configuration
INSERT INTO [TenantConfigurations] ([TenantId], [InvoicePrefix], [EnableInventory], [EnableGST]) VALUES
(1, 'INV', 1, 1);
GO

-- Insert sample user (password: Admin@123)
INSERT INTO [Users] ([TenantId], [Email], [PasswordHash], [FirstName], [LastName], [IsActive]) VALUES
(1, 'admin@demoshop.com', 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'Admin', 'User', 1);
GO

-- Assign Owner role to admin user
INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES
(1, 1);
GO

