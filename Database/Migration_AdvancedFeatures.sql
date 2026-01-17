-- Migration Script for Advanced Features
-- Run this after Migration_SchoolOfficeBilling.sql

-- ============================================
-- INSTALLMENT PLANS
-- ============================================

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
GO

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
GO

CREATE INDEX IX_InstallmentPlans_TenantId ON [InstallmentPlans]([TenantId]);
CREATE INDEX IX_InstallmentPlans_StudentId ON [InstallmentPlans]([StudentId]);
GO

-- ============================================
-- TIME TRACKING
-- ============================================

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
GO

CREATE INDEX IX_TimeEntries_TenantId_ProjectId ON [TimeEntries]([TenantId], [ProjectId]);
CREATE INDEX IX_TimeEntries_EntryDate ON [TimeEntries]([EntryDate]);
GO

-- ============================================
-- MILESTONES & DELIVERABLES
-- ============================================

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
GO

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
GO

CREATE INDEX IX_Milestones_TenantId_ProjectId ON [Milestones]([TenantId], [ProjectId]);
GO

-- ============================================
-- DOCUMENTS
-- ============================================

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
GO

CREATE INDEX IX_Documents_TenantId_EntityType_EntityId ON [Documents]([TenantId], [EntityType], [EntityId]);
CREATE INDEX IX_Documents_DocumentType ON [Documents]([DocumentType]);
GO

-- ============================================
-- FEE CONCESSIONS
-- ============================================

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
GO

CREATE INDEX IX_FeeConcessions_TenantId_StudentId ON [FeeConcessions]([TenantId], [StudentId]);
CREATE INDEX IX_FeeConcessions_Status ON [FeeConcessions]([Status]);
GO

