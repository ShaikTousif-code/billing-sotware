-- Migration Script for School/College and Office Billing Modules
-- Run this after Migration_100Percent.sql

-- ============================================
-- SCHOOL/COLLEGE BILLING MODULES
-- ============================================

-- Classes Table
CREATE TABLE [dbo].[Classes] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Code] NVARCHAR(50) NULL,
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
GO

CREATE INDEX IX_Classes_TenantId ON [Classes]([TenantId]);
CREATE INDEX IX_Classes_AcademicYear ON [Classes]([AcademicYear]);
GO

-- Students Table
CREATE TABLE [dbo].[Students] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [StudentId] NVARCHAR(50) NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(256) NULL,
    [Phone] NVARCHAR(20) NULL,
    [DateOfBirth] DATETIME2 NOT NULL,
    [Gender] NVARCHAR(20) NULL,
    [Address] NVARCHAR(500) NULL,
    [City] NVARCHAR(100) NULL,
    [State] NVARCHAR(100) NULL,
    [Pincode] NVARCHAR(20) NULL,
    [ClassId] INT NULL,
    [Section] NVARCHAR(50) NULL,
    [Course] NVARCHAR(200) NULL,
    [Department] NVARCHAR(200) NULL,
    [AcademicYear] NVARCHAR(20) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
    [ParentName] NVARCHAR(200) NULL,
    [ParentPhone] NVARCHAR(20) NULL,
    [ParentEmail] NVARCHAR(256) NULL,
    [GuardianName] NVARCHAR(200) NULL,
    [GuardianPhone] NVARCHAR(20) NULL,
    [TotalFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [PaidFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [OutstandingFees] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [ScholarshipAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [IsScholarshipApplicable] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ClassId]) REFERENCES [Classes]([Id])
);
GO

CREATE UNIQUE INDEX IX_Students_TenantId_StudentId ON [Students]([TenantId], [StudentId]);
CREATE INDEX IX_Students_ClassId ON [Students]([ClassId]);
CREATE INDEX IX_Students_Status ON [Students]([Status]);
GO

-- Fee Structures Table
CREATE TABLE [dbo].[FeeStructures] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ClassId] INT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [FeeType] NVARCHAR(100) NOT NULL DEFAULT 'Tuition',
    [Amount] DECIMAL(18,2) NOT NULL,
    [Frequency] NVARCHAR(50) NOT NULL DEFAULT 'Monthly',
    [AcademicYear] NVARCHAR(20) NOT NULL,
    [IsMandatory] BIT NOT NULL DEFAULT 1,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ClassId]) REFERENCES [Classes]([Id])
);
GO

CREATE INDEX IX_FeeStructures_TenantId_ClassId ON [FeeStructures]([TenantId], [ClassId]);
GO

-- Fees Table
CREATE TABLE [dbo].[Fees] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [StudentId] INT NOT NULL,
    [FeeStructureId] INT NOT NULL,
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
    [Term] NVARCHAR(50) NULL,
    [Month] NVARCHAR(20) NULL,
    [Notes] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [PaidDate] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id]),
    FOREIGN KEY ([FeeStructureId]) REFERENCES [FeeStructures]([Id])
);
GO

CREATE UNIQUE INDEX IX_Fees_TenantId_FeeNumber ON [Fees]([TenantId], [FeeNumber]);
CREATE INDEX IX_Fees_StudentId ON [Fees]([StudentId]);
CREATE INDEX IX_Fees_DueDate ON [Fees]([DueDate]);
CREATE INDEX IX_Fees_Status ON [Fees]([Status]);
GO

-- Fee Payments Table
CREATE TABLE [dbo].[FeePayments] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [FeeId] INT NOT NULL,
    [StudentId] INT NOT NULL,
    [ReceiptNumber] NVARCHAR(50) NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [PaymentMode] NVARCHAR(50) NOT NULL DEFAULT 'Cash',
    [TransactionId] NVARCHAR(200) NULL,
    [ChequeNumber] NVARCHAR(50) NULL,
    [ChequeDate] DATETIME2 NULL,
    [BankName] NVARCHAR(200) NULL,
    [PaymentDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [Notes] NVARCHAR(500) NULL,
    [CreatedById] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([FeeId]) REFERENCES [Fees]([Id]),
    FOREIGN KEY ([StudentId]) REFERENCES [Students]([Id]),
    FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
);
GO

CREATE UNIQUE INDEX IX_FeePayments_TenantId_ReceiptNumber ON [FeePayments]([TenantId], [ReceiptNumber]);
CREATE INDEX IX_FeePayments_StudentId ON [FeePayments]([StudentId]);
CREATE INDEX IX_FeePayments_PaymentDate ON [FeePayments]([PaymentDate]);
GO

-- ============================================
-- OFFICE BILLING MODULES
-- ============================================

-- Office Clients Table
CREATE TABLE [dbo].[OfficeClients] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ClientCode] NVARCHAR(50) NOT NULL,
    [CompanyName] NVARCHAR(200) NOT NULL,
    [ContactPerson] NVARCHAR(200) NULL,
    [Email] NVARCHAR(256) NULL,
    [Phone] NVARCHAR(20) NULL,
    [AlternatePhone] NVARCHAR(20) NULL,
    [Address] NVARCHAR(500) NULL,
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
    [PaymentTerms] NVARCHAR(100) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id])
);
GO

CREATE UNIQUE INDEX IX_OfficeClients_TenantId_ClientCode ON [OfficeClients]([TenantId], [ClientCode]);
CREATE INDEX IX_OfficeClients_Status ON [OfficeClients]([Status]);
GO

-- Projects Table
CREATE TABLE [dbo].[Projects] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ClientId] INT NOT NULL,
    [ProjectCode] NVARCHAR(50) NOT NULL,
    [ProjectName] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(1000) NULL,
    [ProjectType] NVARCHAR(50) NOT NULL DEFAULT 'Fixed',
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NULL,
    [ExpectedCompletionDate] DATETIME2 NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
    [Budget] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [BilledAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [BalanceAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [ProjectManager] NVARCHAR(200) NULL,
    [Notes] NVARCHAR(1000) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id])
);
GO

CREATE UNIQUE INDEX IX_Projects_TenantId_ProjectCode ON [Projects]([TenantId], [ProjectCode]);
CREATE INDEX IX_Projects_ClientId ON [Projects]([ClientId]);
CREATE INDEX IX_Projects_Status ON [Projects]([Status]);
GO

-- Project Invoices Table
CREATE TABLE [dbo].[ProjectInvoices] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ProjectId] INT NOT NULL,
    [ClientId] INT NOT NULL,
    [InvoiceNumber] NVARCHAR(50) NOT NULL,
    [InvoiceDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [Milestone] NVARCHAR(200) NULL,
    [Description] NVARCHAR(1000) NULL,
    [SubTotal] DECIMAL(18,2) NOT NULL,
    [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [TotalAmount] DECIMAL(18,2) NOT NULL,
    [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [BalanceAmount] DECIMAL(18,2) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    [DueDate] DATETIME2 NULL,
    [PaymentTerms] NVARCHAR(100) NULL,
    [Notes] NVARCHAR(1000) NULL,
    [CreatedById] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
    FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id]),
    FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
);
GO

CREATE UNIQUE INDEX IX_ProjectInvoices_TenantId_InvoiceNumber ON [ProjectInvoices]([TenantId], [InvoiceNumber]);
CREATE INDEX IX_ProjectInvoices_ProjectId ON [ProjectInvoices]([ProjectId]);
CREATE INDEX IX_ProjectInvoices_ClientId ON [ProjectInvoices]([ClientId]);
GO

-- Project Invoice Items Table
CREATE TABLE [dbo].[ProjectInvoiceItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [ProjectInvoiceId] INT NOT NULL,
    [Description] NVARCHAR(500) NOT NULL,
    [Quantity] DECIMAL(18,2) NOT NULL DEFAULT 1,
    [UnitPrice] DECIMAL(18,2) NOT NULL,
    [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
    [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [TotalAmount] DECIMAL(18,2) NOT NULL,
    FOREIGN KEY ([ProjectInvoiceId]) REFERENCES [ProjectInvoices]([Id]) ON DELETE CASCADE
);
GO

-- Project Expenses Table
CREATE TABLE [dbo].[ProjectExpenses] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ProjectId] INT NOT NULL,
    [ExpenseType] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [ExpenseDate] DATETIME2 NOT NULL,
    [Vendor] NVARCHAR(200) NULL,
    [ReceiptNumber] NVARCHAR(100) NULL,
    [PaymentMode] NVARCHAR(50) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    [Notes] NVARCHAR(500) NULL,
    [CreatedById] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]),
    FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id])
);
GO

CREATE INDEX IX_ProjectExpenses_ProjectId ON [ProjectExpenses]([ProjectId]);
CREATE INDEX IX_ProjectExpenses_ExpenseDate ON [ProjectExpenses]([ExpenseDate]);
GO

-- Service Contracts Table
CREATE TABLE [dbo].[ServiceContracts] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ClientId] INT NOT NULL,
    [ContractNumber] NVARCHAR(50) NOT NULL,
    [ServiceName] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(1000) NULL,
    [ContractType] NVARCHAR(50) NOT NULL DEFAULT 'Monthly',
    [ContractValue] DECIMAL(18,2) NOT NULL,
    [MonthlyAmount] DECIMAL(18,2) NOT NULL,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [AutoRenewal] BIT NOT NULL DEFAULT 0,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
    [PaymentTerms] NVARCHAR(100) NULL,
    [Notes] NVARCHAR(1000) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    FOREIGN KEY ([ClientId]) REFERENCES [OfficeClients]([Id])
);
GO

CREATE UNIQUE INDEX IX_ServiceContracts_TenantId_ContractNumber ON [ServiceContracts]([TenantId], [ContractNumber]);
CREATE INDEX IX_ServiceContracts_ClientId ON [ServiceContracts]([ClientId]);
CREATE INDEX IX_ServiceContracts_Status ON [ServiceContracts]([Status]);
GO

-- Contract Invoices Table
CREATE TABLE [dbo].[ContractInvoices] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [ContractId] INT NOT NULL,
    [ClientId] INT NOT NULL,
    [InvoiceNumber] NVARCHAR(50) NOT NULL,
    [InvoiceDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [DueDate] DATETIME2 NOT NULL,
    [Period] NVARCHAR(50) NOT NULL,
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
GO

CREATE UNIQUE INDEX IX_ContractInvoices_TenantId_InvoiceNumber ON [ContractInvoices]([TenantId], [InvoiceNumber]);
CREATE INDEX IX_ContractInvoices_ContractId ON [ContractInvoices]([ContractId]);
CREATE INDEX IX_ContractInvoices_DueDate ON [ContractInvoices]([DueDate]);
GO

