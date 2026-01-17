-- ============================================
-- COMPLETE DATABASE DEPLOYMENT SCRIPT
-- Target Server: HOORIYASHAIK\SQLEXPRESS
-- Database: BillingDB
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

PRINT 'Starting database deployment...';
PRINT '========================================';
GO

-- ============================================
-- BASE SCHEMA (from Schema.sql)
-- ============================================

-- Tenants
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tenants')
BEGIN
    CREATE TABLE [dbo].[Tenants] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NOT NULL UNIQUE,
        [Email] NVARCHAR(256) NULL,
        [Phone] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [PlanType] NVARCHAR(50) NULL,
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
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [FirstName] NVARCHAR(100) NULL,
        [LastName] NVARCHAR(100) NULL,
        [Phone] NVARCHAR(50) NULL,
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
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL
    );
    PRINT 'Table Roles created.';
END
GO

-- UserRoles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE [dbo].[UserRoles] (
        [UserId] INT NOT NULL,
        [RoleId] INT NOT NULL,
        PRIMARY KEY ([UserId], [RoleId]),
        FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
        FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id])
    );
    PRINT 'Table UserRoles created.';
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
        [CategoryId] INT NULL,
        [CostPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [SellingPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [StockQuantity] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Unit] NVARCHAR(50) NOT NULL DEFAULT 'PCS',
        [IsActive] BIT NOT NULL DEFAULT 1,
        [TrackInventory] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    CREATE UNIQUE INDEX IX_Products_TenantId_SKU ON [Products]([TenantId], [SKU]) WHERE [SKU] IS NOT NULL;
    PRINT 'Table Products created.';
END
GO

-- ProductCategories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductCategories')
BEGIN
    CREATE TABLE [dbo].[ProductCategories] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [ParentCategoryId] INT NULL,
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([ParentCategoryId]) REFERENCES [ProductCategories]([Id])
    );
    PRINT 'Table ProductCategories created.';
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
        [Phone] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [GSTIN] NVARCHAR(50) NULL,
        [OutstandingBalance] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    PRINT 'Table Customers created.';
END
GO

-- Invoices
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE [dbo].[Invoices] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TenantId] INT NOT NULL,
        [InvoiceNumber] NVARCHAR(50) NOT NULL,
        [InvoiceDate] DATETIME2 NOT NULL,
        [CustomerId] INT NULL,
        [CustomerName] NVARCHAR(200) NULL,
        [SubTotal] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [TotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [BalanceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        [CreatedById] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([CustomerId]) REFERENCES [Customers]([Id]),
        FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
    );
    CREATE UNIQUE INDEX IX_Invoices_TenantId_InvoiceNumber ON [Invoices]([TenantId], [InvoiceNumber]);
    PRINT 'Table Invoices created.';
END
GO

-- InvoiceItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceItems')
BEGIN
    CREATE TABLE [dbo].[InvoiceItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [InvoiceId] INT NOT NULL,
        [ProductId] INT NULL,
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
        [PaymentDate] DATETIME2 NOT NULL,
        [TransactionId] NVARCHAR(200) NULL,
        [Notes] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
        FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices]([Id])
    );
    PRINT 'Table Payments created.';
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
        [AcademicYear] NVARCHAR(50) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
    );
    CREATE UNIQUE INDEX IX_Classes_TenantId_Code ON [Classes]([TenantId], [Code]);
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
    PRINT 'Table ContractInvoices created.';
END
GO

-- ============================================
-- ADVANCED FEATURES TABLES
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

PRINT 'Default roles inserted.';
GO

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

PRINT '========================================';
PRINT 'Database deployment completed successfully!';
PRINT 'All tables have been created.';
PRINT '========================================';
GO

